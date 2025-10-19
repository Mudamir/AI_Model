import time
import psutil
from AI_model import personalized_tutor, questions, correct_texts

def measure_inference_time(query):
    start = time.time()
    response = personalized_tutor(query)
    end = time.time()
    return response, end - start

def measure_memory_usage():
    process = psutil.Process()
    mem_info = process.memory_info()
    return mem_info.rss / (1024 * 1024)  # Memory in MB

def measure_accuracy(sample_size=20):
    correct = 0
    for i in range(sample_size):
        query = questions[i]
        expected = correct_texts[i]
        response = personalized_tutor(query)
        if expected.lower() in response.lower():
            correct += 1
    return correct / sample_size

def collect_user_feedback():
    feedback = []
    for _ in range(5):
        query = input("Enter a test question: ")
        response, t = measure_inference_time(query)
        print("Response:", response)
        print(f"Inference time: {t:.2f}s")
        mem = measure_memory_usage()
        print(f"Memory usage: {mem:.2f} MB")
        score = input("Rate answer quality (1-5): ")
        feedback.append({'query': query, 'response': response, 'time': t, 'memory': mem, 'score': score})
    return feedback

if __name__ == "__main__":
    print("=== Model Efficiency Evaluation ===")
    acc = measure_accuracy()
    print(f"Accuracy (simple match): {acc*100:.2f}%")
    feedback = collect_user_feedback()
    print("User feedback collected:", feedback)