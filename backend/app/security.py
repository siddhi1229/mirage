from dotenv import load_dotenv
import os
import random
import re
from typing import Tuple
from groq import Groq
import nltk
from nltk.corpus import wordnet
from nltk.tokenize import sent_tokenize, word_tokenize

load_dotenv()
print("DEBUG GROQ_API_KEY =", repr(os.getenv("GROQ_API_KEY")))

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)
    nltk.download('punkt', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.1-8b-instant"
MAX_TOKENS = 512
TEMPERATURE_CLEAN = 0.7

def get_wordnet_pos(treebank_tag: str):
    """Convert TreeBank POS tags to WordNet format"""
    if treebank_tag.startswith('J'):
        return wordnet.ADJ
    elif treebank_tag.startswith('V'):
        return wordnet.VERB
    elif treebank_tag.startswith('N'):
        return wordnet.NOUN
    elif treebank_tag.startswith('R'):
        return wordnet.ADV
    return None


# ============================================================================
# NOISE STRATEGY 1: Synonym Replacement
# Replaces 20-30% of words with synonyms to disrupt token patterns
# ============================================================================
def add_synonym_noise(text: str, replace_ratio: float = 0.25) -> str:
    """
    Replace words with synonyms to maintain semantic meaning 
    but break mathematical token extraction patterns.
    """
    words = word_tokenize(text)
    pos_tags = nltk.pos_tag(words)
    new_words = words.copy()
    
    # Skip common stopwords
    stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'in', 'on', 'at', 'to', 'for'}
    replaceable_indices = [
        i for i, (word, pos) in enumerate(pos_tags) 
        if word.lower() not in stopwords and len(word) > 3 and word.isalpha()
    ]
    
    # Randomly select words to replace
    num_to_replace = max(1, int(len(replaceable_indices) * replace_ratio))
    indices_to_replace = random.sample(
        replaceable_indices, 
        min(num_to_replace, len(replaceable_indices))
    )
    
    for idx in indices_to_replace:
        word, pos = pos_tags[idx]
        wn_pos = get_wordnet_pos(pos)
        
        if wn_pos:
            synsets = wordnet.synsets(word.lower(), pos=wn_pos)
            if synsets:
                # Get all synonyms excluding the original
                synonyms = [
                    lemma.name() for synset in synsets 
                    for lemma in synset.lemmas() 
                    if lemma.name().lower() != word.lower()
                ]
                if synonyms:
                    synonym = random.choice(synonyms).replace('_', ' ')
                    # Preserve capitalization
                    if word[0].isupper():
                        synonym = synonym.capitalize()
                    new_words[idx] = synonym
    
    return ' '.join(new_words)


# ============================================================================
# NOISE STRATEGY 2: Partial Truncation
# Randomly cut off 10-20% of the response to break gradient flow
# ============================================================================
def add_truncation_noise(text: str) -> str:
    """
    Truncate response mid-answer to disrupt mathematical extraction.
    Keeps at least 60% of content.
    """
    sentences = sent_tokenize(text)
    if len(sentences) <= 2:
        return text  # Too short to truncate safely
    
    # Keep 60-85% of sentences
    keep_ratio = random.uniform(0.6, 0.85)
    num_to_keep = max(2, int(len(sentences) * keep_ratio))
    
    return ' '.join(sentences[:num_to_keep])


# ============================================================================
# NOISE STRATEGY 3: Sentence Shuffling
# Reorder sentences to disrupt logical flow while keeping information
# ============================================================================
def add_shuffle_noise(text: str) -> str:
    """
    Shuffle sentence order to maintain info but break structural patterns.
    Keeps first sentence in place (context anchor).
    """
    sentences = sent_tokenize(text)
    if len(sentences) <= 2:
        return text
    
    # Keep first sentence, shuffle the rest
    first = sentences[0]
    rest = sentences[1:]
    random.shuffle(rest)
    
    return ' '.join([first] + rest)


# ============================================================================
# NOISE STRATEGY 4: Word Insertion
# Add filler words/phrases to dilute token density
# ============================================================================
def add_filler_noise(text: str) -> str:
    """
    Insert neutral filler phrases to dilute information density.
    """
    fillers = [
        "you know,", "basically,", "essentially,", "in other words,",
        "to put it simply,", "so to speak,", "if that makes sense,",
        "as mentioned,", "generally speaking,", "in most cases,"
    ]
    
    sentences = sent_tokenize(text)
    noisy_sentences = []
    
    for sentence in sentences:
        # 40% chance to add a filler
        if random.random() < 0.4:
            filler = random.choice(fillers)
            # Insert after first few words
            words = sentence.split()
            if len(words) > 3:
                insert_pos = random.randint(2, min(5, len(words)))
                words.insert(insert_pos, filler)
                sentence = ' '.join(words)
        noisy_sentences.append(sentence)
    
    return ' '.join(noisy_sentences)


# ============================================================================
# MAIN: Get Clean Response (Tier 1)
# ============================================================================
async def get_clean_response(query: str) -> str:
    """
    Generate clean, accurate response for legitimate users (Tier 1).
    No noise applied.
    """
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful, accurate, and professional assistant. "
                        "Provide clear, concise, and relevant responses. "
                        "Maintain a friendly and informative tone."
                    )
                },
                {"role": "user", "content": query},
            ],
            model=GROQ_MODEL,
            temperature=TEMPERATURE_CLEAN,
            max_tokens=MAX_TOKENS,
            top_p=0.9,
            stream=False,
        )
        return chat_completion.choices[0].message.content.strip()
    
    except Exception as e:
        print(f" Error in get_clean_response: {e}")
        raise


# ============================================================================
# MAIN: Get Noisy Response (Tier 2 & 3)
# Returns: (clean_response, noisy_response)
# ============================================================================
async def get_noisy_response(query: str) -> Tuple[str, str]:
    """
    Generate noisy response for suspicious/malicious users (Tier 2/3).
    
    Strategy: Apply 1-2 random noise techniques to the clean response.
    This preserves semantic meaning but disrupts model extraction.
    
    Returns:
        (clean_response, noisy_response) - Clean saved for audit, noisy served to user
    """
    # First get the clean response
    clean_response = await get_clean_response(query)
    
    try:
        # Randomly select 1-2 noise strategies
        noise_functions = [
            add_synonym_noise,
            add_truncation_noise,
            add_shuffle_noise,
            add_filler_noise
        ]
        
        num_strategies = random.randint(1, 2)
        selected_strategies = random.sample(noise_functions, num_strategies)
        
        # Apply noise strategies sequentially
        noisy_response = clean_response
        for strategy in selected_strategies:
            noisy_response = strategy(noisy_response)
        
        return clean_response, noisy_response
    
    except Exception as e:
        print(f" Error in get_noisy_response: {e}")
        # Fallback: return clean response with minimal disruption
        fallback_noisy = add_synonym_noise(clean_response)
        return clean_response, fallback_noisy

