import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history } = await request.json()

    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000"

    const response = await fetch(`${fastApiUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any authentication headers if your FastAPI requires them
        ...(process.env.FASTAPI_API_KEY && {
          Authorization: `Bearer ${process.env.FASTAPI_API_KEY}`,
        }),
      },
      body: JSON.stringify({
        message,
        conversation_history: conversation_history || [],
        model: process.env.OLLAMA_MODEL || "llama3.2", // Default to llama3.2, can be changed
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("FastAPI error:", errorText)
      throw new Error(`FastAPI responded with status: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      response: data.response || data.message || "I apologize, but I couldn't generate a response.",
    })
  } catch (error) {
    console.error("Error calling FastAPI backend:", error)

    return NextResponse.json(
      {
        error: "Failed to get response from Ollama AI model",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion:
          "Make sure your FastAPI server is running on http://localhost:8000 and Ollama is installed with a model pulled",
      },
      { status: 500 },
    )
  }
}
