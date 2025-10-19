import json
import faiss
import numpy as np
import torch
from sentence_transformers import SentenceTransformer
import requests

# ====== 0. Configure Qwen2 0.5B (Ollama Local Model - Ultra-Lightweight) ======
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2:0.5b"

# ====== 1. Load Q&A dataset ======
dataset_path = r"C:\Users\rashi\OneDrive\Documents\AI Model\AI_Model\scripts\questions.json"

try:
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)
except FileNotFoundError:
    raise FileNotFoundError(f"Could not find dataset at {dataset_path}")

questions = []
correct_texts = []

for item in data:
    if "question" in item and "choices" in item and "correct_answer" in item:
        questions.append(item["question"])
        correct_texts.append(item["choices"][item["correct_answer"]])

print("Dataset loaded")
print("First Question:", questions[0])
print("Correct Answer:", correct_texts[0])

# ====== 2. Encode questions into embeddings (GPU if available) ======
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2", device=device)
embeddings = embedding_model.encode(questions, convert_to_numpy=True, show_progress_bar=True)

# ====== 3. Build FAISS index ======
dim = embeddings.shape[1]
index = faiss.IndexFlatL2(dim)
index.add(embeddings)

# ====== 4. Initialize conversation memory ======
conversation_history = []

# ====== 5. Qwen2 generate function ======
def generate_answer(prompt: str) -> str:
    """Generate a response using Qwen2 0.5B via Ollama."""
    try:
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.6,
                "num_predict": 256,  # Shorter for speed
                "top_p": 0.85
            }
        }
        
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "").strip()
        else:
            return f"[Error] Ollama returned status {response.status_code}. Is Ollama running?"
            
    except requests.exceptions.ConnectionError:
        return "[Error] Cannot connect to Ollama. Please start Ollama service."
    except requests.exceptions.Timeout:
        return "[Error] Request timed out. Try again."
    except Exception as e:
        return f"[Error] {str(e)}"

# ====== 6. Personalized Tutor Function ======
def personalized_tutor(query: str, mode: str = "practice", top_k: int = 3) -> str:
    """
    Qwen2 0.5B-powered CCNA tutor - ultra-lightweight for instant responses.
    
    Args:
        query: Student's question
        mode: One of "concepts", "configuration", "troubleshooting", "practice"
        top_k: Number of similar questions to retrieve
    """
    # ----- Semantic search -----
    query_vec = embedding_model.encode([query], convert_to_numpy=True)
    D, I = index.search(query_vec, top_k)
    context = "\n".join(
        [f"Q: {questions[i]}\nA: {correct_texts[i]}" for i in I[0] if i < len(questions)]
    )

    # ----- Conversation memory -----
    history_text = ""
    if conversation_history:
        history_text = "\nPrevious:\n" + "\n".join(conversation_history[-2:])

    # ----- Optimized for PRACTICE MODE ONLY -----
    instruction = """You are a CCNA exam practice coach. Provide INSTANT, CONCISE answers.

Your focus:
- Quick, direct answers
- Practice questions when asked
- Brief explanations (2-3 sentences max)
- Perfect for rapid Q&A and flash cards
- No lengthy details - speed is priority"""

    # Keep prompt short for ultra-fast responses
    prompt = f"""{instruction}

Context: {context[:400]}

Question: {query}

Quick answer:"""

    # ----- Generate answer -----
    response_text = generate_answer(prompt)
    conversation_history.append(f"Q: {query}\nA: {response_text}")
    return response_text

# ====== 7. Test Loop ======
if __name__ == "__main__":
    print("📘 Welcome to your Qwen2 0.5B-powered CCNA tutor (Ultra-Fast!)! Type 'exit' to quit.\n")
    print("Available modes: concepts, configuration, troubleshooting, practice\n")
    
    while True:
        user_query = input("Your question: ")
        if user_query.lower().strip() == "exit":
            print("👋 Ending session. Keep studying!")
            break
        
        # Ask for mode
        mode = input("Mode (concepts/configuration/troubleshooting/practice) [practice]: ").strip().lower()
        if not mode:
            mode = "practice"
        
        answer = personalized_tutor(user_query, mode=mode)
        print("\nQwen2's Answer:\n", answer, "\n")
