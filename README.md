# AI Chatbot with FastAPI + Ollama

A modern chatbot interface built with Next.js that connects to your local Ollama models via FastAPI.

## Setup Instructions

### 1. Install Ollama
\`\`\`bash
# On macOS
brew install ollama

# On Linux
curl -fsSL https://ollama.ai/install.sh | sh

# On Windows
# Download from https://ollama.ai/download
\`\`\`

### 2. Start Ollama and Pull a Model
\`\`\`bash
# Start Ollama service
ollama serve

# Pull a model (in another terminal)
ollama pull llama3.2
# or try: ollama pull codellama, ollama pull mistral, etc.
\`\`\`

### 3. Install Python Dependencies
\`\`\`bash
pip install fastapi uvicorn httpx
\`\`\`

### 4. Start the FastAPI Server
\`\`\`bash
# From your project root
python scripts/fastapi_server.py
\`\`\`

### 5. Start the Next.js Frontend
\`\`\`bash
npm run dev
\`\`\`

### 6. Environment Variables (Optional)
Create a `.env.local` file:
\`\`\`
FASTAPI_URL=http://localhost:8000
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434
\`\`\`

## Features

- 🤖 Local AI inference with Ollama
- 💾 Auto-save conversations to localStorage
- 📁 Export chats as JSON files
- 🔄 Switch between conversation sessions
- 🎨 Professional red-themed UI
- ⚡ Fast local processing (no API costs!)

## VSCode Integration

1. Open this project in VSCode
2. Install the Python extension
3. Use the integrated terminal to run both servers
4. Debug FastAPI with breakpoints if needed

## Troubleshooting

- **Ollama not connecting**: Make sure `ollama serve` is running
- **Model not found**: Run `ollama pull <model-name>` first
- **FastAPI errors**: Check the terminal running the Python server
- **CORS issues**: The FastAPI server is configured for localhost:3000
