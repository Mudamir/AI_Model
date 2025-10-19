import json
import faiss
import numpy as np
import torch
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

# ====== 0. Configure Gemini ======
api_key = "AIzaSyAbVzH79qXWNWh_8KUuxFjRS9H9m97DlfI"  # <- Replace if needed
genai.configure(api_key=api_key)
# Fixed: Use gemini-pro which is the stable model name
model = genai.GenerativeModel("gemini-2.5-flash")

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
print(f"Using device: {device}")  # Shows if GPU is used
embedding_model = SentenceTransformer("all-MiniLM-L6-v2", device=device)
embeddings = embedding_model.encode(questions, convert_to_numpy=True, show_progress_bar=True)

# ====== 3. Build FAISS index (CPU is fine) ======
dim = embeddings.shape[1]
index = faiss.IndexFlatL2(dim)
index.add(embeddings)

# ====== 4. Initialize conversation memory ======
conversation_history = []

# ====== 5. Gemini generate function ======
def generate_answer(prompt: str) -> str:
    """Generate a response using Gemini API."""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"[Error from Gemini API] {str(e)}"

# ====== 7. Personalized Tutor Function ======
def personalized_tutor(query: str, top_k: int = 3) -> str:
    # ----- Semantic search -----
    query_vec = embedding_model.encode([query], convert_to_numpy=True)
    D, I = index.search(query_vec, top_k)
    context = "\n".join(
        [f"Q: {questions[i]}\nA: {correct_texts[i]}" for i in I[0] if i < len(questions)]
    )

    # ----- Conversation memory -----
    history_text = ""
    if conversation_history:
        history_text = "\nPrevious tutor interactions:\n" + "\n".join(conversation_history[-5:])

    # ----- Optimized for CONFIGURATION MODE ONLY -----
    prompt = f"""
You are an expert Cisco network engineer specializing in IOS configurations and CLI commands.

Your expertise:
- **Cisco IOS Command Syntax**: Provide exact, copy-pasteable commands
- **Router & Switch Configuration**: Step-by-step configuration workflows
- **VLAN Setup**: Trunking, access ports, inter-VLAN routing
- **Routing Protocols**: OSPF, EIGRP, BGP configuration
- **ACLs & Security**: Access control lists, port security
- **NAT/PAT**: Network address translation setup
- **Verification Commands**: Show commands to verify configs work

Your response format:
1. Brief explanation of what we're configuring
2. Exact CLI commands (copy-pasteable)
3. Explanation of what each command does
4. Verification steps with show commands
5. Common mistakes to avoid

Context/reference:
{context}

{history_text}

Configuration request: {query}

Provide clear CLI commands with syntax and verification steps.
"""
    # ----- Generate answer -----
    response_text = generate_answer(prompt)
    conversation_history.append(f"Q: {query}\nA: {response_text}")
    return response_text

# ====== 8. Test Loop ======
if __name__ == "__main__":
    print("📘 Welcome to your Gemini-powered CCNA tutor! Type 'exit' to quit.\n")
    while True:
        user_query = input("Your question: ")
        if user_query.lower().strip() == "exit":
            print("👋 Ending session. Keep studying!")
            break
        answer = personalized_tutor(user_query)
        print("\nTutor Answer:\n", answer, "\n")
