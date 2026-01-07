# MIRAGE  
### Time-Stateful Security Layer for ML APIs
---
## DEMO VIDEO - https://drive.google.com/file/d/1nd1Mc3NoNcCINhS5dtgKjeMDjclJ1ZFP/view?usp=sharing
## PROJECT VIDEO - https://drive.google.com/file/d/1sDLjvOwKT6zfthwek38ZdiXop2MIUE9a/view?usp=sharing
---
Mirage is a **state-aware security wrapper** designed to protect high-value ML APIs from **model extraction, gradient-based attacks, and adversarial probing**.  
Unlike stateless rate-limiters or firewalls, Mirage **tracks users over time**, adapts its responses, and escalates defenses based on behavioral intent.

Think of it as a security system that remembers you.



## 🚀 Why Mirage Exists

Modern ML APIs leak value silently.  
Attackers don’t break in. They **ask politely, repeatedly, and systematically**.

Traditional defenses fail because they:
- Treat each request independently
- Only block, never mislead
- Have no memory of attacker behavior

**Mirage flips the model**:  
Instead of denying access, it **poisons the attacker’s data** while preserving accuracy for legitimate users.

---

## 🧠 Core Idea: Time-Stateful Defense

Mirage introduces **time as a first-class security signal**.

It tracks:
- Query frequency
- Semantic similarity between consecutive prompts
- Duration of suspicious interaction

Based on this, Mirage escalates users through **three defense tiers**.

---

## 🛡️ The 3-Tier Defense Model

| Tier | Status      | Trigger Condition | Goal        | Defense Action |
|-----:|-------------|------------------|-------------|----------------|
| 1 | Clean | Normal score < 0.8 OR < 2 mins | Accuracy | Serve clean model output |
| 2 | Adaptive | Score ≥ 0.8 OR 2–10 mins | Deterrence | Serve rephrased / noisy responses |
| 3 | Audit | Score ≥ 0.95 AND > 10 mins | Forensics | Noise + Blockchain audit |

### Key Insight  
Attackers still receive outputs — but the **data they collect becomes mathematically useless**.

---

## 📊 Threat Scoring Engine

Mirage computes a **hybrid threat score** in real time.

### Components

1. **V-Score (Velocity)**
   - Rolling average of requests per minute
   - Detects scraping and automation

2. **D-Score (Similarity)**
   - Cosine similarity between current and previous query embeddings
   - Detects iterative semantic probing

3. **Weighted Hybrid Score**
```text
Final Score = (0.4 × V-Score) + (0.6 × D-Score)
