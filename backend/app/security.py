from dotenv import load_dotenv
import os
import random
from typing import Tuple

from groq import Groq
import nltk
from nltk.corpus import wordnet
from nltk.tokenize import sent_tokenize, word_tokenize

# ============================================================================
# ENV SETUP
# ============================================================================
load_dotenv()
print("DEBUG GROQ_API_KEY =", repr(os.getenv("GROQ_API_KEY")))

# ============================================================================
# NLTK BOOTSTRAP (FULLY PATCHED, NO SURPRISE CRASHES)
# ============================================================================
try:
    nltk.data.find("tokenizers/punkt")
    nltk.data.find("tokenizers/punkt_tab")
    nltk.data.find("corpora/wordnet")
    nltk.data.find("taggers/averaged_perceptron_tagger_eng")
except LookupError:
    nltk.download("punkt", quiet=True)
    nltk.download("punkt_tab", quiet=True)
    nltk.download("wordnet", quiet=True)
    nltk.download("omw-1.4", quiet=True)
    nltk.download("averaged_perceptron_tagger_eng", quiet=True)

# ============================================================================
# GROQ CLIENT
# ============================================================================
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

GROQ_MODEL = "llama-3.1-8b-instant"
MAX_TOKENS = 512
TEMPERATURE_CLEAN = 0.7

# ============================================================================
# UTILS
# ============================================================================
def get_wordnet_pos(treebank_tag: str):
    if treebank_tag.startswith("J"):
        return wordnet.ADJ
    elif treebank_tag.startswith("V"):
        return wordnet.VERB
    elif treebank_tag.startswith("N"):
        return wordnet.NOUN
    elif treebank_tag.startswith("R"):
        return wordnet.ADV
    return None

# ============================================================================
# NOISE STRATEGY 1: SYNONYM REPLACEMENT
# ============================================================================
def add_synonym_noise(text: str, replace_ratio: float = 0.25) -> str:
    words = word_tokenize(text)
    pos_tags = nltk.pos_tag(words)
    new_words = words.copy()

    stopwords = {
        "the","a","an","and","or","but","is","are","was","were",
        "be","been","in","on","at","to","for"
    }

    replaceable = [
        i for i, (w, _) in enumerate(pos_tags)
        if w.lower() not in stopwords and len(w) > 3 and w.isalpha()
    ]

    if not replaceable:
        return text

    k = max(1, int(len(replaceable) * replace_ratio))
    chosen = random.sample(replaceable, min(k, len(replaceable)))

    for idx in chosen:
        word, pos = pos_tags[idx]
        wn_pos = get_wordnet_pos(pos)
        if not wn_pos:
            continue

        synsets = wordnet.synsets(word.lower(), pos=wn_pos)
        if not synsets:
            continue

        synonyms = {
            lemma.name().replace("_", " ")
            for s in synsets
            for lemma in s.lemmas()
            if lemma.name().lower() != word.lower()
        }

        if synonyms:
            replacement = random.choice(list(synonyms))
            if word[0].isupper():
                replacement = replacement.capitalize()
            new_words[idx] = replacement

    return " ".join(new_words)

# ============================================================================
# NOISE STRATEGY 2: PARTIAL TRUNCATION
# ============================================================================
def add_truncation_noise(text: str) -> str:
    sentences = sent_tokenize(text)
    if len(sentences) <= 2:
        return text

    keep_ratio = random.uniform(0.6, 0.85)
    keep = max(2, int(len(sentences) * keep_ratio))
    return " ".join(sentences[:keep])

# ============================================================================
# NOISE STRATEGY 3: SENTENCE SHUFFLING
# ============================================================================
def add_shuffle_noise(text: str) -> str:
    sentences = sent_tokenize(text)
    if len(sentences) <= 2:
        return text

    first, rest = sentences[0], sentences[1:]
    random.shuffle(rest)
    return " ".join([first] + rest)

# ============================================================================
# NOISE STRATEGY 4: FILLER INSERTION
# ============================================================================
def add_filler_noise(text: str) -> str:
    fillers = [
        "you know,", "basically,", "essentially,", "in other words,",
        "to put it simply,", "so to speak,", "if that makes sense,",
        "as mentioned,", "generally speaking,", "in most cases,"
    ]

    sentences = sent_tokenize(text)
    out = []

    for s in sentences:
        if random.random() < 0.4:
            words = s.split()
            if len(words) > 3:
                pos = random.randint(2, min(5, len(words)))
                words.insert(pos, random.choice(fillers))
                s = " ".join(words)
        out.append(s)

    return " ".join(out)

# ============================================================================
# CLEAN RESPONSE (TIER 1)
# ============================================================================
async def get_clean_response(query: str) -> str:
    try:
        res = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful, accurate, and professional assistant. "
                        "Provide clear, concise, and relevant responses."
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
        return res.choices[0].message.content.strip()
    except Exception as e:
        print("Error in get_clean_response:", e)
        raise

# ============================================================================
# NOISY RESPONSE (TIER 2 / 3)
# ============================================================================
async def get_noisy_response(query: str) -> Tuple[str, str]:
    clean = await get_clean_response(query)

    noise_funcs = [
        add_synonym_noise,
        add_truncation_noise,
        add_shuffle_noise,
        add_filler_noise
    ]

    try:
        noisy = clean
        for fn in random.sample(noise_funcs, random.randint(1, 2)):
            noisy = fn(noisy)
        return clean, noisy

    except Exception as e:
        print("Error in get_noisy_response:", e)
        return clean, add_synonym_noise(clean)