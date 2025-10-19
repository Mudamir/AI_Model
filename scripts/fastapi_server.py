from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os

# Import all model functions
try:
    from AI_model_gemini import personalized_tutor as gemini_tutor
    print("✓ Gemini API tutor initialized")
except ImportError:
    gemini_tutor = None
    print("✗ Failed to import Gemini tutor")

try:
    from AI_model_qwen2 import personalized_tutor as qwen2_tutor
    print("✓ Qwen2 0.5B tutor initialized")
except ImportError:
    qwen2_tutor = None
    print("✗ Failed to import Qwen2 tutor")

# Initialize model instances
phi3_tutor = None
llama_tutor = None
current_tutor = None
current_model = "phi3"  # Default to faster model

try:
    from AI_model_phi3 import Phi3CCNATutor
    phi3_tutor = Phi3CCNATutor("phi3:mini")
    print("✓ Phi3:Mini CCNA Tutor initialized")
except ImportError:
    print("✗ Failed to import Phi3CCNATutor")

try:
    from AI_model_llama import LlamaCCNATutor
    llama_tutor = LlamaCCNATutor("llama3.1:8b")
    print("✓ Llama3.1:8B CCNA Tutor initialized")
except ImportError:
    print("✗ Failed to import LlamaCCNATutor")

# Set current tutor (default to phi3 for speed)
current_tutor = phi3_tutor if phi3_tutor else llama_tutor

app = FastAPI(
    title="CCNA Tutor API",
    description="""
    🌐 **CCNA AI Tutor with Multiple Model Support**
    
    This API provides access to three different AI models for CCNA exam preparation:
    
    - **Phi3-Mini**: Ultra-fast local model (1-2s response) - Logic & Reasoning
    - **Llama 3.1 8B**: Comprehensive local model (3-5s response) - Detailed explanations
    - **Gemini 1.5 Flash**: Cloud API model (2-4s response) - Code & Configuration
    
    All models are GPU-accelerated (except Gemini which uses Cloud API).
    """,
    version="2.0.0",
    contact={
        "name": "CCNA AI Tutor",
        "url": "http://localhost:3000",
    },
)

# ====== CORS for frontend ======
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== Request models ======
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []
    model: Optional[str] = "phi3"  # phi3, llama, or gemini
    
    class Config:
        schema_extra = {
            "example": {
                "message": "Explain OSPF routing protocol",
                "conversation_history": [],
                "model": "phi3"
            }
        }

class ModelSwitchRequest(BaseModel):
    model: str  # "phi3", "llama", or "gemini"
    
    class Config:
        schema_extra = {
            "example": {
                "model": "phi3"
            }
        }

class Query(BaseModel):
    question: str
    
    class Config:
        schema_extra = {
            "example": {
                "question": "What is the difference between TCP and UDP?"
            }
        }

# ====== API endpoints ======
@app.get("/", tags=["Root"])
def root():
    """Root endpoint - API information"""
    return {
        "message": "CCNA AI Tutor API",
        "version": "2.0.0",
        "docs": "/docs",
        "models_available": {
            "phi3": phi3_tutor is not None,
            "llama": llama_tutor is not None,
            "gemini": gemini_tutor is not None
        },
        "endpoints": {
            "phi3": "/chat-phi3",
            "llama": "/chat-llama",
            "gemini": "/chat-gemini",
            "health": "/health",
            "models": "/models"
        }
    }

@app.post("/switch-model", tags=["Model Management"])
def switch_model(request: ModelSwitchRequest):
    """
    Switch between Phi3, Llama, and Gemini models
    
    - **phi3**: Ultra-fast local model (1-2s)
    - **llama**: Comprehensive local model (3-5s)
    - **gemini**: Cloud API for code generation (2-4s)
    """
    global current_tutor, current_model
    
    try:
        if request.model.lower() == "phi3" and phi3_tutor:
            current_tutor = phi3_tutor
            current_model = "phi3"
            return {
                "status": "success",
                "message": "Switched to Phi3:Mini (Ultra-Fast Mode)",
                "model": "phi3:mini",
                "response_time": "1-2 seconds",
                "gpu_accelerated": True
            }
        elif request.model.lower() == "llama" and llama_tutor:
            current_tutor = llama_tutor
            current_model = "llama"
            return {
                "status": "success", 
                "message": "Switched to Llama3.1:8B (Comprehensive Mode)",
                "model": "llama3.1:8b",
                "response_time": "3-5 seconds",
                "gpu_accelerated": True
            }
        elif request.model.lower() == "gemini" and gemini_tutor:
            current_model = "gemini"
            return {
                "status": "success",
                "message": "Switched to Gemini (Code & Config Mode)",
                "model": "gemini-1.5-flash",
                "response_time": "2-4 seconds",
                "gpu_accelerated": False
            }
        else:
            return {
                "status": "error",
                "message": f"Model '{request.model}' not available"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error switching model: {str(e)}"
        }

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    """Main chat endpoint with model switching support"""
    global current_tutor, current_model
    
    try:
        # Switch model if requested
        if request.model and request.model != current_model:
            if request.model.lower() == "phi3" and phi3_tutor:
                current_tutor = phi3_tutor
                current_model = "phi3"
            elif request.model.lower() == "llama" and llama_tutor:
                current_tutor = llama_tutor
                current_model = "llama"
        
        # Use current tutor
        if current_tutor:
            answer = current_tutor.ask_question(request.message)
            model_name = "phi3:mini" if current_model == "phi3" else "llama3.1:8b"
            return {
                "response": answer,
                "model_used": model_name,
                "model_type": current_model,
                "subject": "ccna",
                "gpu_accelerated": True,
                "status": "success"
            }
        elif gemini_tutor:
            answer = gemini_tutor(request.message)
            return {
                "response": answer,
                "model_used": "gemini",
                "subject": "networking",
                "status": "success"
            }
        else:
            return {"error": "No AI model available", "status": "error"}
        
    except Exception as e:
        return {
            "error": f"Error generating response: {str(e)}",
            "status": "error"
        }

@app.post("/chat-phi3", tags=["AI Models"])
def chat_phi3_endpoint(request: ChatRequest):
    """
    🧠 **Phi3-Mini Model** - Ultra-Fast Logic & Reasoning
    
    - **Response Time**: 1-2 seconds
    - **GPU Accelerated**: Yes (RTX 3050)
    - **Best For**: CCNA concepts, protocols, exam strategies
    - **Model**: phi3:mini (Local Ollama)
    
    Perfect for quick answers and understanding networking fundamentals.
    """
    try:
        if phi3_tutor:
            answer = phi3_tutor.ask_question(request.message)
            return {
                "response": answer,
                "model_used": "phi3:mini",
                "model_type": "logic",
                "subject": "ccna",
                "gpu_accelerated": True,
                "response_time": "1-2s",
                "status": "success"
            }
        else:
            return {"error": "Phi3 model not available. Make sure Ollama is running with phi3:mini", "status": "error"}
    except Exception as e:
        return {
            "error": f"Error generating response: {str(e)}",
            "status": "error"
        }

@app.post("/chat-llama", tags=["AI Models"])
def chat_llama_endpoint(request: ChatRequest):
    """
    🦙 **Llama 3.1 8B Model** - Comprehensive Explanations
    
    - **Response Time**: 3-5 seconds
    - **GPU Accelerated**: Yes (RTX 3050)
    - **Best For**: Detailed explanations, complex topics, in-depth analysis
    - **Model**: llama3.1:8b (Local Ollama)
    
    Ideal for comprehensive understanding and detailed technical explanations.
    """
    try:
        if llama_tutor:
            answer = llama_tutor.ask_question(request.message)
            return {
                "response": answer,
                "model_used": "llama3.1:8b",
                "model_type": "comprehensive",
                "subject": "ccna",
                "gpu_accelerated": True,
                "response_time": "3-5s",
                "status": "success"
            }
        else:
            return {"error": "Llama model not available. Make sure Ollama is running with llama3.1:8b", "status": "error"}
    except Exception as e:
        return {
            "error": f"Error generating response: {str(e)}",
            "status": "error"
        }

@app.post("/chat-gemini", tags=["AI Models"])
def chat_gemini_endpoint(request: ChatRequest):
    """
    ⚡ **Gemini 1.5 Flash** - Code & Configuration Expert
    
    - **Response Time**: 2-4 seconds
    - **GPU Accelerated**: No (Cloud API)
    - **Best For**: Cisco CLI commands, configurations, scripts, troubleshooting
    - **Model**: gemini-1.5-flash-latest (Google Cloud)
    
    Specialized in Cisco IOS commands and network device configurations.
    """
    try:
        if gemini_tutor:
            answer = gemini_tutor(request.message)
            return {
                "response": answer,
                "model_used": "gemini-1.5-flash-latest",
                "model_type": "code",
                "subject": "ccna",
                "gpu_accelerated": False,
                "response_time": "2-4s",
                "status": "success"
            }
        else:
            return {"error": "Gemini API not available. Check API key in AI_model_gemini.py", "status": "error"}
    except Exception as e:
        return {
            "error": f"Error generating response: {str(e)}",
            "status": "error"
        }

@app.post("/ask")
def ask_tutor(query: Query):
    """Legacy endpoint for backward compatibility"""
    try:
        if current_tutor:
            answer = current_tutor.ask_question(query.question)
        elif gemini_tutor:
            answer = gemini_tutor(query.question)
        else:
            return {"error": "No AI model available"}
        
        return {"answer": answer}
    except Exception as e:
        return {"error": f"Error: {str(e)}"}

# ====== Multiple Choice specific endpoints ======
class MCAnswerRequest(BaseModel):
    question_id: Optional[int] = None
    user_answer: str
    question_data: Optional[dict] = None

@app.get("/random-question")
def get_random_question():
    """Get a random CCNA multiple choice question"""
    try:
        if ccna_tutor:
            import random
            question = random.choice(ccna_tutor.dataset)
            return {
                "question": question,
                "status": "success"
            }
        else:
            return {"error": "CCNA tutor not available", "status": "error"}
    except Exception as e:
        return {"error": f"Error: {str(e)}", "status": "error"}

@app.post("/check-answer")
def check_answer(request: MCAnswerRequest):
    """Check multiple choice answer and provide explanation"""
    try:
        if ccna_tutor and request.question_data:
            correct_answer = request.question_data.get('correct_answer', '').upper()
            user_answer = request.user_answer.upper()
            is_correct = user_answer == correct_answer
            
            # Generate detailed explanation
            explanation = ccna_tutor.generate_explanation(request.question_data, request.user_answer)
            
            return {
                "correct": is_correct,
                "correct_answer": correct_answer,
                "explanation": explanation,
                "status": "success"
            }
        else:
            return {"error": "Invalid request or CCNA tutor not available", "status": "error"}
    except Exception as e:
        return {"error": f"Error: {str(e)}", "status": "error"}

@app.get("/topics")
def get_topics():
    """Get available CCNA topics"""
    try:
        if ccna_tutor:
            topics = set()
            for q in ccna_tutor.dataset:
                if 'topic' in q:
                    topics.add(q['topic'])
            return {
                "topics": sorted(list(topics)),
                "status": "success"
            }
        else:
            return {"error": "CCNA tutor not available", "status": "error"}
    except Exception as e:
        return {"error": f"Error: {str(e)}", "status": "error"}

@app.get("/models", tags=["Model Management"])
def get_available_models():
    """
    📋 **Get All Available Models**
    
    Returns a list of all initialized AI models with their specifications,
    performance metrics, and current selection status.
    """
    models = []
    
    if phi3_tutor:
        models.append({
            "id": "phi3",
            "name": "Phi3:Mini",
            "description": "Ultra-fast responses (1-2 seconds)",
            "model": "phi3:mini",
            "speed": "ultra-fast",
            "detail_level": "focused",
            "gpu_accelerated": True,
            "response_time": "1-2s",
            "best_for": "Quick answers, concepts, exam prep",
            "endpoint": "/chat-phi3"
        })
    
    if llama_tutor:
        models.append({
            "id": "llama", 
            "name": "Llama3.1:8B",
            "description": "Comprehensive responses (3-5 seconds)",
            "model": "llama3.1:8b", 
            "speed": "moderate",
            "detail_level": "comprehensive",
            "gpu_accelerated": True,
            "response_time": "3-5s",
            "best_for": "Detailed explanations, complex topics",
            "endpoint": "/chat-llama"
        })
    
    if gemini_tutor:
        models.append({
            "id": "gemini",
            "name": "Gemini 1.5 Flash",
            "description": "Code & configuration expert (2-4 seconds)",
            "model": "gemini-1.5-flash-latest",
            "speed": "fast",
            "detail_level": "code-focused",
            "gpu_accelerated": False,
            "response_time": "2-4s",
            "best_for": "CLI commands, configurations, scripts",
            "endpoint": "/chat-gemini"
        })
    
    return {
        "available_models": models,
        "total_models": len(models),
        "current_model": current_model,
        "current_tutor": current_tutor.__class__.__name__ if current_tutor else "Gemini API",
        "status": "success"
    }

@app.get("/health", tags=["System"])
def health_check():
    """
    ❤️ **System Health Check**
    
    Returns the health status of the API and all available AI models.
    Use this endpoint to verify which models are initialized and ready.
    """
    models_available = []
    
    if phi3_tutor:
        models_available.append({
            "name": "phi3_mini",
            "type": "logic",
            "description": "Logic & Reasoning Mode",
            "gpu_accelerated": True,
            "status": "✓ Ready",
            "endpoint": "/chat-phi3"
        })
    
    if llama_tutor:
        models_available.append({
            "name": "llama3.1_8b",
            "type": "comprehensive",
            "description": "Comprehensive Mode",
            "gpu_accelerated": True,
            "status": "✓ Ready",
            "endpoint": "/chat-llama"
        })
    
    if gemini_tutor:
        models_available.append({
            "name": "gemini-1.5-flash-latest",
            "type": "code",
            "description": "Code & Configuration Mode",
            "gpu_accelerated": False,
            "status": "✓ Ready",
            "endpoint": "/chat-gemini"
        })
    
    return {
        "status": "healthy" if len(models_available) > 0 else "degraded",
        "api_version": "2.0.0",
        "models_available": models_available,
        "total_models_ready": len(models_available),
        "current_model": current_model,
        "gpu_accelerated": True if current_tutor else False,
        "port": 8000,
        "documentation": "/docs",
        "endpoints": {
            "phi3": "/chat-phi3",
            "llama": "/chat-llama",
            "gemini": "/chat-gemini",
            "qwen2": "/chat-qwen2",
            "models_list": "/models",
            "health": "/health"
        }
    }

@app.post("/chat-qwen2", tags=["AI Models"])
def chat_qwen2_endpoint(request: ChatRequest):
    """
    ⚡ **Qwen2 0.5B Model** - Ultra-Lightweight & Instant
    
    - **Response Time**: <1 second
    - **GPU Accelerated**: Yes (RTX 3050)
    - **Best For**: Rapid practice, quick answers, flash cards, instant responses
    - **Model**: qwen2:0.5b (Local Ollama)
    
    Ultra-fast model perfect for practice mode and rapid Q&A sessions.
    """
    try:
        if qwen2_tutor:
            # Determine mode from message content
            mode = "practice"  # Default to practice for fastest model
            if any(word in request.message.lower() for word in ["configure", "setup", "command", "cli"]):
                mode = "configuration"
            elif any(word in request.message.lower() for word in ["troubleshoot", "problem", "issue", "error"]):
                mode = "troubleshooting"
            elif any(word in request.message.lower() for word in ["what", "explain", "define"]):
                mode = "concepts"
            
            answer = qwen2_tutor(request.message, mode=mode)
            return {
                "response": answer,
                "model_used": "qwen2:0.5b",
                "model_type": "practice",
                "mode": mode,
                "gpu_accelerated": True,
                "response_time": "<1s",
                "status": "success"
            }
        else:
            return {"error": "Qwen2 model not available. Run: ollama pull qwen2:0.5b", "status": "error"}
    except Exception as e:
        return {
            "error": f"Error generating response: {str(e)}",
            "status": "error"
        }

# ====== Run with uvicorn ======
# uvicorn fastapi_server:app --reload --port 8000