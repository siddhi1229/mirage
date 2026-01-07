from dotenv import load_dotenv
import os
import random
from typing import Tuple
from groq import Groq
import nltk
from nltk.corpus import wordnet
from nltk.tokenize import sent_tokenize, word_tokenize

# Download NLTK data with error handling
try:
    nltk.data.find("tokenizers/punkt")
    nltk.data.find("corpora/wordnet")
    nltk.data.find("taggers/averaged_perceptron_tagger")
except LookupError:
    print("Downloading required NLTK data...")
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)

load_dotenv()

# Groq client initialization
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.1-8b-instant"
MAX_TOKENS = 512
TEMPERATURE_CLEAN = 0.7


# ============================================================================
# Aggressive Noise Injection Functions
# ============================================================================

def add_aggressive_synonym_noise(text: str) -> str:
    """
    Aggressively replace words with synonyms (50% of non-stop words).
    Creates VISIBLY DIFFERENT text while keeping meaning.
    """
    words = word_tokenize(text)
    pos_tags = nltk.pos_tag(words)
    new_words = words.copy()
    
    # Expanded stopwords
    stopwords = {
        "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
        "be", "been", "in", "on", "at", "to", "for", "with", "of", "by",
        "i", "you", "he", "she", "it", "we", "they", "that", "this",
        "as", "if", "so", "not", "have", "has", "do", "does", "can", "will"
    }
    
    # Find replaceable words (not stopwords)
    replaceable = []
    for i, (w, pos) in enumerate(pos_tags):
        if w.lower() not in stopwords and len(w) > 2 and w.isalpha():
            replaceable.append(i)
    
    if not replaceable:
        # Fallback: if no replaceable words, add descriptive phrases
        return text + " In essence, this is the core response."
    
    # Replace 50% of replaceable words (AGGRESSIVE)
    k = max(2, int(len(replaceable) * 0.5))
    chosen = random.sample(replaceable, min(k, len(replaceable)))
    
    synonym_map = {
        # Common word mappings to ensure replacement
        "name": ["designation", "identifier", "label", "title"],
        "personal": ["individual", "private", "own"],
        "assistant": ["helper", "aid", "support", "companion"],
        "model": ["system", "framework", "architecture"],
        "chatbot": ["conversational agent", "dialogue system", "bot"],
        "referred": ["called", "named", "known", "termed"],
        "don't": ["do not", "don't possess", "lack"],
        "have": ["possess", "own", "contain"],
        "provide": ["offer", "give", "deliver", "furnish"],
    }
    
    for idx in chosen:
        word, pos = pos_tags[idx]
        word_lower = word.lower()
        
        # Check manual mappings first
        if word_lower in synonym_map:
            replacement = random.choice(synonym_map[word_lower])
        else:
            # Try WordNet
            try:
                wn_pos = get_wordnet_pos(pos)
                if wn_pos:
                    synsets = wordnet.synsets(word_lower, pos=wn_pos)
                    if synsets:
                        synonyms = [
                            lemma.name().replace('_', ' ')
                            for s in synsets
                            for lemma in s.lemmas()
                            if lemma.name().lower() != word_lower
                        ]
                        if synonyms:
                            replacement = random.choice(list(synonyms))
                        else:
                            continue
                    else:
                        continue
                else:
                    continue
            except:
                continue
        
        if replacement:
            if word[0].isupper():
                replacement = replacement.capitalize()
            new_words[idx] = replacement
    
    return ' '.join(new_words)


def add_aggressive_expansion(text: str) -> str:
    """
    Expand the response by rephrasing and adding elaboration.
    Changes structure significantly while maintaining meaning.
    """
    expansions = [
        "To clarify, {}",
        "In simpler terms, {}",
        "More specifically, {}",
        "To put it differently, {}",
        "In other words, {}",
        "Essentially, {}",
        "To summarize, {}",
        "The key point is: {}",
    ]
    
    sentences = sent_tokenize(text)
    
    if len(sentences) == 1:
        # Single sentence - expand it
        main_sentence = sentences[0]
        expansion = random.choice(expansions)
        return expansion.format(main_sentence.lower().strip('.!?'))
    
    # Multiple sentences - reorder and expand
    new_sentences = []
    for i, sent in enumerate(sentences):
        # Add elaboration to some sentences
        if random.random() < 0.4 and i < len(sentences) - 1:
            elaboration = random.choice([
                f"{sent} {random.choice(['This means', 'Therefore', 'Consequently', 'As a result'])}, ",
                f"{sent} ",
            ])
            new_sentences.append(elaboration)
        else:
            new_sentences.append(sent + " ")
    
    return "".join(new_sentences).strip()


def add_restructuring(text: str) -> str:
    """
    Restructure sentences completely while preserving meaning.
    """
    sentences = sent_tokenize(text)
    
    if len(sentences) <= 1:
        # For single sentence, use different sentence structure
        restructurings = [
            lambda t: f"It is worth noting that {t.lower().rstrip('.')}.".capitalize(),
            lambda t: f"The fact is: {t.lower().rstrip('.')}.",
            lambda t: f"One could say that {t.lower().rstrip('.')}.".capitalize(),
            lambda t: f"In reality, {t.lower().rstrip('.')}.",
        ]
        return random.choice(restructurings)(text)
    
    # Reorder sentences randomly
    reordered = sentences.copy()
    random.shuffle(reordered)
    
    return " ".join(reordered)


def add_prefix_suffix(text: str) -> str:
    """
    Add contextual prefixes and suffixes that change appearance
    but don't change core meaning.
    """
    prefixes = [
        "Based on the information available: ",
        "From my perspective: ",
        "To answer your question: ",
        "Regarding this query: ",
    ]
    
    suffixes = [
        " This is the accurate response.",
        " That covers the main points.",
        " Hope this clarifies things.",
        " Does this address your question?",
    ]
    
    return random.choice(prefixes) + text.strip() + random.choice(suffixes)


def get_wordnet_pos(treebank_tag: str):
    """Convert TreeBank tags to WordNet POS tags"""
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
# Main LLM Functions
# ============================================================================

async def get_clean_response(query: str) -> str:
    """
    Get clean, unperturbed response from Groq.
    This is what a legitimate user would see.
    """
    try:
        res = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful, accurate, and professional assistant. Provide clear, concise, and relevant responses."
                },
                {
                    "role": "user",
                    "content": query,
                }
            ],
            model=GROQ_MODEL,
            temperature=TEMPERATURE_CLEAN,
            max_tokens=MAX_TOKENS,
            top_p=0.9,
            stream=False,
        )
        response_text = res.choices[0].message.content.strip()
        return response_text
    except Exception as e:
        print(f"❌ Error in get_clean_response: {e}")
        raise


async def get_noisy_response(query: str) -> Tuple[str, str]:
    """
    Get clean response then apply AGGRESSIVE noise functions.
    Returns (clean_text, noisy_text) - VISIBLY DIFFERENT.
    
    The noisy version is what suspicious/malicious users see.
    Noise functions applied:
    1. Aggressive synonym replacement (50% of words)
    2. Response expansion/rephrasing
    3. Sentence restructuring
    4. Prefix/suffix addition
    """
    clean = await get_clean_response(query)
    
    try:
        # Apply multiple noise functions for VISIBLE differences
        noisy = clean
        
        # Always apply aggressive synonym replacement
        noisy = add_aggressive_synonym_noise(noisy)
        print(f"   ✏️  Applied: add_aggressive_synonym_noise")
        
        # Apply expansion (20% chance to make it visibly longer/different)
        if random.random() < 0.5:
            noisy = add_aggressive_expansion(noisy)
            print(f"   📝 Applied: add_aggressive_expansion")
        
        # Apply restructuring (30% chance)
        if random.random() < 0.3:
            noisy = add_restructuring(noisy)
            print(f"   🔀 Applied: add_restructuring")
        
        # Apply prefix/suffix (50% chance)
        if random.random() < 0.5:
            noisy = add_prefix_suffix(noisy)
            print(f"   ➕ Applied: add_prefix_suffix")
        
        # Final check: ensure noisy is actually different
        if noisy.strip() == clean.strip():
            print(f"   ⚠️  Noisy text same as clean, forcing difference...")
            noisy = add_aggressive_synonym_noise(clean)
            if noisy.strip() == clean.strip():
                noisy = add_prefix_suffix(clean)
        
        print(f"\n   📊 Clean length: {len(clean)} chars")
        print(f"   📊 Noisy length: {len(noisy)} chars")
        
        return clean, noisy
        
    except Exception as e:
        print(f"❌ Error in get_noisy_response: {e}")
        # Fallback: at least apply aggressive changes
        noisy = add_aggressive_synonym_noise(clean)
        if noisy.strip() == clean.strip():
            noisy = add_prefix_suffix(clean)
        return clean, noisy