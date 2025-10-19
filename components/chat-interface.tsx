"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, MoreHorizontal, MessageSquare, Settings, Download, Copy, Check, Code2, Brain, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  modelUsed?: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

function MarkdownRenderer({ content }: { content: string }) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates((prev) => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }))
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  // Enhanced markdown parsing with better formatting
  const parseMarkdown = (text: string) => {
    const parts: React.ReactNode[] = []
    let currentIndex = 0
    let partKey = 0

    // Code block regex (\`\`\`language\ncode\n\`\`\`)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    // Inline code regex (`code`)
    const inlineCodeRegex = /`([^`]+)`/g
    // Bold regex (**text** or __text__)
    const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g
    // Italic regex (*text* or _text_)
    const italicRegex = /\*([^*]+)\*|_([^_]+)_/g
    // List item regex (- item or * item or 1. item)
    const listRegex = /^(\s*)([-*]|\d+\.)\s+(.+)$/
    // Header regex (# Header)
    const headerRegex = /^(#{1,6})\s+(.+)$/gm

    let match
    const processedRanges: Array<{ start: number; end: number }> = []

    // Process code blocks first (highest priority)
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const beforeText = text.slice(currentIndex, match.index)
      if (beforeText && currentIndex < match.index) {
        parts.push(<span key={partKey++}>{beforeText}</span>)
      }

      const language = match[1] || "text"
      const code = match[2].trim()
      const codeId = `code-${partKey}`

      parts.push(
        <div key={partKey++} className="my-4 rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{language}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => copyToClipboard(code, codeId)}
            >
              {copiedStates[codeId] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm font-mono leading-relaxed">{code}</code>
          </pre>
        </div>,
      )

      processedRanges.push({ start: match.index, end: match.index + match[0].length })
      currentIndex = match.index + match[0].length
    }

    // Reset regex
    codeBlockRegex.lastIndex = 0

    // If we processed code blocks, handle remaining text
    if (processedRanges.length > 0) {
      const remainingText = text.slice(currentIndex)
      if (remainingText) {
        parts.push(<span key={partKey++}>{processInlineFormatting(remainingText)}</span>)
      }
      return <div className="space-y-1">{parts}</div>
    }

    // No code blocks, process inline formatting
    return <div className="space-y-1">{processInlineFormatting(text)}</div>
  }

  const processInlineFormatting = (text: string) => {
    const parts: React.ReactNode[] = []
    const lastIndex = 0
    const partKey = 0

    // Process headers
    text = text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
      const level = hashes.length
      const className =
        level === 1
          ? "text-xl font-bold mt-6 mb-3"
          : level === 2
            ? "text-lg font-bold mt-5 mb-2"
            : level === 3
              ? "text-base font-bold mt-4 mb-2"
              : "text-sm font-bold mt-3 mb-1"
      return `<h${level} class="${className}">${content}</h${level}>`
    })

    // Process lists
    text = text.replace(/^(\s*)([-*]|\d+\.)\s+(.+)$/gm, (match, indent, marker, content) => {
      const isOrdered = /\d+\./.test(marker)
      const tag = isOrdered ? "ol" : "ul"
      return `<li class="ml-4 mb-1 ${isOrdered ? "list-decimal" : "list-disc"} list-inside">${content}</li>`
    })

    // Process bold text
    text = text.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, '<strong class="font-semibold">$1$2</strong>')

    // Process italic text
    text = text.replace(/\*([^*]+)\*|_([^_]+)_/g, '<em class="italic">$1$2</em>')

    // Process inline code
    text = text.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">$1</code>')

    // Process line breaks
    text = text.replace(/\n\n/g, '</p><p class="mb-3">')
    text = text.replace(/\n/g, "<br />")

    return <div dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${text}</p>` }} />
  }

  return <div className="prose prose-sm max-w-none dark:prose-invert">{parseMarkdown(content)}</div>
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your CCNA AI Tutor. Choose **Logic & Reasoning** for exam concepts or **Code & Configuration** for CLI commands and scripts. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("default")
  const [selectedMode, setSelectedMode] = useState<"concepts" | "configuration" | "troubleshooting" | "practice">("concepts")
  const [selectedModel, setSelectedModel] = useState<"qwen2" | "phi3" | "llama" | "gemini">("phi3")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle mode change and auto-select appropriate model
  const handleModeChange = (mode: "concepts" | "configuration" | "troubleshooting" | "practice") => {
    setSelectedMode(mode)
    // Auto-select best model for each mode
    if (mode === "concepts") {
      setSelectedModel("llama") // Best for detailed theory and concepts
    } else if (mode === "configuration") {
      setSelectedModel("gemini") // Best for CLI commands and configs
    } else if (mode === "troubleshooting") {
      setSelectedModel("llama") // Best analytical reasoning
    } else if (mode === "practice") {
      setSelectedModel("qwen2") // Fastest for rapid practice
    }
  }

  // Save chat sessions to localStorage only when chatSessions changes
// Hydrate chat sessions from localStorage on mount
useEffect(() => {
  const savedSessions = localStorage.getItem("chatSessions")
  if (savedSessions) {
    const parsed = JSON.parse(savedSessions)
    const hydrated = parsed.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }))
    setChatSessions(hydrated)
  }
}, [])

// Save chat sessions to localStorage only when chatSessions changes
useEffect(() => {
  localStorage.setItem("chatSessions", JSON.stringify(chatSessions))
}, [chatSessions])

// Update chatSessions only when messages change (not inside the above effect)
useEffect(() => {
  if (messages.length > 1) {
    const currentSession: ChatSession = {
      id: currentSessionId,
      title: messages[1]?.content.slice(0, 50) + "..." || "New Chat",
      messages,
      createdAt: new Date(),
    }
    const updatedSessions = chatSessions.filter((s) => s.id !== currentSessionId)
    setChatSessions([currentSession, ...updatedSessions])
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [messages, currentSessionId])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startNewConversation = () => {
    const newSessionId = Date.now().toString()
    setCurrentSessionId(newSessionId)
    setMessages([
      {
        id: "1",
        content: "Hello! I'm your AI assistant powered by Ollama. How can I help you today?",
        role: "assistant",
        timestamp: new Date(),
      },
    ])
  }

  const loadConversation = (session: ChatSession) => {
    setCurrentSessionId(session.id)
    setMessages(session.messages)
  }

  const exportChat = () => {
    const chatData = {
      sessionId: currentSessionId,
      exportedAt: new Date().toISOString(),
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      })),
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chat-${currentSessionId}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const [streamingMessage, setStreamingMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates((prev) => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }))
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setIsStreaming(false) // Keep false until we start streaming
    setStreamingMessage("")

    try {
      // Choose endpoint based on selected model
      let endpoint = "http://localhost:8000/chat-phi3" // Default
      
      switch (selectedModel) {
        case "phi3":
          endpoint = "http://localhost:8000/chat-phi3"
          break
        case "llama":
          endpoint = "http://localhost:8000/chat-llama"
          break
        case "gemini":
          endpoint = "http://localhost:8000/chat-gemini"
          break
        case "qwen2":
          endpoint = "http://localhost:8000/chat-qwen2"
          break
      }
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          conversation_history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const fullResponse = data.response || data.answer || "I apologize, but I couldn't process your request at the moment."

      // Add placeholder message for streaming
      const assistantMessageId = (Date.now() + 1).toString()
      const placeholderMessage: Message = {
        id: assistantMessageId,
        content: "",
        role: "assistant",
        timestamp: new Date(),
        modelUsed: selectedModel,
      }
      setMessages((prev) => [...prev, placeholderMessage])
      
      // Now start streaming
      setIsStreaming(true)
      await streamResponse(fullResponse, assistantMessageId)
    } catch (error) {
      console.error("Error sending message:", error)
      
      const errorResponse = "I'm sorry, I'm having trouble connecting to the AI service. Please make sure your FastAPI server is running locally."
      await streamResponse(errorResponse, assistantMessageId)
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingMessage("")
    }
  }

  const streamResponse = async (fullResponse: string, messageId: string) => {
    // Ultra-fast character-by-character streaming - ChatGPT style
    let currentText = ""
    
    for (let i = 0; i < fullResponse.length; i++) {
      currentText += fullResponse[i]
      setStreamingMessage(currentText)
      
      // Update the message in the messages array
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === messageId 
            ? { ...msg, content: currentText }
            : msg
        )
      )
      
      // Much faster streaming with minimal delays
      const char = fullResponse[i]
      let delay = 5 // Very fast base speed (was 15ms)
      
      if (char === '.' || char === '!' || char === '?') {
        delay = 30 // Brief pause at sentence end (was 100ms)
      } else if (char === ',' || char === ';' || char === ':') {
        delay = 15 // Quick pause at commas (was 50ms)
      } else if (char === '\n') {
        delay = 10 // Minimal pause at line breaks (was 30ms)
      } else if (char === ' ') {
        delay = 8 // Very brief pause at spaces (was 20ms)
      }
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      {/* Sidebar */}
      <div className="w-80 bg-gradient-to-b from-[#049fd9]/5 to-[#0d274d]/5 backdrop-blur-sm border-r border-[#049fd9]/20 flex flex-col shadow-xl">
        <div className="p-6 border-b border-[#049fd9]/20 bg-gradient-to-r from-[#049fd9]/10 to-[#0d274d]/10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#049fd9] to-[#0d274d] rounded-xl flex items-center justify-center shadow-lg shadow-[#049fd9]/30">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0d274d] dark:text-white tracking-tight">CCNA AI Tutor</h1>
              <p className="text-xs text-[#049fd9] font-medium">Cisco Certified Network Assistant</p>
            </div>
          </div>
        </div>


        <div className="flex-1 p-4 overflow-y-auto">
          <Button
            onClick={startNewConversation}
            className="w-full justify-start mb-6 bg-gradient-to-r from-[#049fd9] to-[#0d274d] text-white border-0 hover:from-[#049fd9]/90 hover:to-[#0d274d]/90 h-11 shadow-lg shadow-[#049fd9]/20 font-semibold"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            New Conversation
          </Button>

          <div className="space-y-4">
            <div className="text-xs font-bold text-[#0d274d] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-[#049fd9]"></div>
              Recent Sessions
            </div>
            <div className="space-y-2">
              {chatSessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadConversation(session)}
                  className={cn(
                    "p-3 rounded-xl text-sm cursor-pointer transition-all duration-200 border",
                    session.id === currentSessionId
                      ? "bg-gradient-to-r from-[#049fd9]/20 to-[#0d274d]/20 border-[#049fd9]/40 shadow-md"
                      : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-[#049fd9]/30 hover:bg-white/80 dark:hover:bg-slate-800/80",
                  )}
                >
                  <div className="font-semibold truncate text-[#0d274d] dark:text-white">{session.title}</div>
                  <div className="text-xs text-[#049fd9] mt-1">{session.createdAt.toLocaleDateString()}</div>
                </div>
              ))}
              {chatSessions.length === 0 && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#049fd9]/20 to-[#0d274d]/20 border border-[#049fd9]/40 text-sm shadow-md">
                  <div className="font-semibold text-[#0d274d] dark:text-white">Current Session</div>
                  <div className="text-xs text-[#049fd9] mt-1">Active conversation</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#049fd9]/20 space-y-2 bg-white/30 dark:bg-slate-900/30">
          <Button
            onClick={exportChat}
            variant="ghost"
            className="w-full justify-start text-[#0d274d] dark:text-white hover:bg-[#049fd9]/10 hover:text-[#049fd9] font-medium"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Chat
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-[#0d274d] dark:text-white hover:bg-[#049fd9]/10 hover:text-[#049fd9] font-medium"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-[#049fd9]/20 p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-11 w-11 ring-2 ring-[#049fd9]/30 shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-[#049fd9] to-[#0d274d] text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold text-[#0d274d] dark:text-white">CCNA AI Assistant</h2>
                <div className="flex items-center gap-2 text-xs text-[#049fd9] font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Ready to help with your CCNA journey</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-[#049fd9]/10 rounded-lg">
                <MoreHorizontal className="h-5 w-5 text-[#0d274d] dark:text-white" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-10 w-10 mt-1 ring-2 ring-[#049fd9]/30 shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-[#049fd9] to-[#0d274d] text-white">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-6 py-4 text-sm leading-relaxed shadow-lg transition-all hover:shadow-xl",
                    message.role === "user"
                      ? "bg-gradient-to-br from-[#049fd9] to-[#0d274d] text-white ml-12 rounded-br-md border border-[#049fd9]/30"
                      : "bg-white/80 dark:bg-slate-800/80 text-[#0d274d] dark:text-white border border-[#049fd9]/20 rounded-bl-md backdrop-blur-sm",
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children, ...props }: any) => (
                            <p className="mb-2 last:mb-0" {...props}>
                              {children}
                            </p>
                          ),
                          code: ({ node, inline, className, children, ...props }: any) => {
                            if (inline) {
                              return (
                                <code className="relative rounded-md bg-[#049fd9]/10 border border-[#049fd9]/20 px-1.5 py-0.5 font-mono text-sm text-[#0d274d] dark:text-[#049fd9]" {...props}>
                                  {children}
                                </code>
                              )
                            }

                            // Extract language from className (e.g., "language-javascript" -> "javascript")
                            const language = className?.replace('language-', '') || 'text'
                            const codeContent = String(children).replace(/\n$/, '')
                            const codeId = `code-${codeContent.slice(0, 20).replace(/\s/g, '')}`
                            
                            // Determine if it's a Cisco/networking command
                            const isCiscoCommand = language === 'cisco' || language === 'ios' || language === 'config' || 
                                                   codeContent.includes('Router>') || codeContent.includes('Switch>') ||
                                                   codeContent.includes('Router#') || codeContent.includes('Switch#') ||
                                                   codeContent.includes('configure terminal')
                          
                            return (
                              <div className="relative group my-4 rounded-xl overflow-hidden border-2 border-[#049fd9]/30 bg-gradient-to-br from-slate-900 to-slate-950 shadow-xl">
                                {/* Enhanced Header with Cisco styling */}
                                <div className="flex items-center justify-between bg-gradient-to-r from-[#0d274d] to-[#049fd9]/20 backdrop-blur px-4 py-3 border-b-2 border-[#049fd9]/30">
                                  <div className="flex items-center gap-3">
                                    {/* Terminal dots */}
                                    <div className="flex gap-1.5">
                                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                                      <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                                    </div>
                                    {/* Language label with icon */}
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#049fd9]/20 border border-[#049fd9]/30">
                                      <span className="text-sm font-bold text-[#049fd9]">
                                        {isCiscoCommand ? '🌐 Cisco IOS CLI' :
                                         language === 'bash' || language === 'shell' || language === 'sh' ? '💻 Terminal' : 
                                         language === 'python' || language === 'py' ? '🐍 Python' :
                                         language === 'javascript' || language === 'js' ? '⚡ JavaScript' :
                                         language === 'typescript' || language === 'ts' ? '📘 TypeScript' :
                                         language === 'json' ? '📄 JSON' :
                                         language === 'yaml' || language === 'yml' ? '📋 YAML' :
                                         language === 'sql' ? '🗄️ SQL' :
                                         `💻 ${language.toUpperCase()}`}
                                      </span>
                                    </div>
                                  </div>
                                  {/* Copy button */}
                                  <button
                                    onClick={() => copyToClipboard(codeContent, codeId)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#049fd9]/20 hover:bg-[#049fd9]/40 rounded-lg transition-all duration-200 border border-[#049fd9]/30 hover:border-[#049fd9] hover:shadow-lg hover:shadow-[#049fd9]/30"
                                  >
                                    {copiedStates[codeId] ? (
                                      <>
                                        <Check className="h-4 w-4 text-green-400" />
                                        <span className="text-green-400">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-4 w-4" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                {/* Code content with syntax highlighting */}
                                <SyntaxHighlighter
                                  language={isCiscoCommand ? 'bash' : language}
                                  style={oneDark}
                                  customStyle={{
                                    margin: 0,
                                    padding: '20px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    borderRadius: '0',
                                  }}
                                  showLineNumbers={codeContent.split('\n').length > 3}
                                  wrapLines={true}
                                  wrapLongLines={true}
                                >
                                  {codeContent}
                                </SyntaxHighlighter>
                              </div>
                            )
                          },  
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-pretty whitespace-pre-wrap">{message.content}</p>
                  )}


                  <div
                    className={cn(
                      "text-xs mt-3 opacity-80 flex items-center gap-2",
                      message.role === "user" ? "text-white/80" : "text-[#049fd9]",
                    )}
                  >
                    <span className="font-medium">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.role === "assistant" && (
                      <>
                        <span>•</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#049fd9]/10 border border-[#049fd9]/20">
                          {message.modelUsed === "gemini" ? "Gemini" : 
                           message.modelUsed === "llama" ? "Llama 3.1 8B" : 
                           message.modelUsed === "qwen2" ? "Qwen2 0.5B" :
                           message.modelUsed === "phi3" ? "Phi3 Mini" : 
                           selectedModel === "gemini" ? "Gemini" :
                           selectedModel === "llama" ? "Llama 3.1 8B" :
                           selectedModel === "qwen2" ? "Qwen2 0.5B" : "Phi3 Mini"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-50 hover:opacity-100 hover:bg-[#049fd9]/10"
                          onClick={() => navigator.clipboard.writeText(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-10 w-10 mt-1 ring-2 ring-[#049fd9]/30 shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && !isStreaming && (
              <div className="flex gap-4 justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <Avatar className="h-10 w-10 mt-1 ring-2 ring-[#049fd9]/30 shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-[#049fd9] to-[#0d274d] text-white">
                    <Bot className="h-5 w-5 animate-pulse" />
                  </AvatarFallback>
                </Avatar>
                {/* Modern thinking animation with text */}
                <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-white/90 to-blue-50/90 dark:from-slate-800/90 dark:to-slate-900/90 border-2 border-[#049fd9]/30 rounded-2xl rounded-bl-md shadow-xl backdrop-blur-md">
                  {/* Animated dots */}
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#049fd9] rounded-full animate-bounce [animation-delay:-0.3s] shadow-lg shadow-[#049fd9]/50"></div>
                    <div className="w-2.5 h-2.5 bg-[#049fd9] rounded-full animate-bounce [animation-delay:-0.15s] shadow-lg shadow-[#049fd9]/50"></div>
                    <div className="w-2.5 h-2.5 bg-[#049fd9] rounded-full animate-bounce shadow-lg shadow-[#049fd9]/50"></div>
                  </div>
                  {/* Thinking text */}
                  <span className="text-sm font-semibold text-[#0d274d] dark:text-white">
                    Thinking
                    <span className="inline-flex ml-0.5">
                      <span className="animate-[pulse_1.5s_ease-in-out_infinite]">.</span>
                      <span className="animate-[pulse_1.5s_ease-in-out_infinite_0.2s]">.</span>
                      <span className="animate-[pulse_1.5s_ease-in-out_infinite_0.4s]">.</span>
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area - Windsurf Style */}
        <div className="border-t border-[#049fd9]/20 p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
            {/* Combobox Selectors - Above Input */}
            <div className="flex items-center gap-3 mb-3">
              {/* Mode Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">CCNA Mode:</span>
                <select
                  value={selectedMode}
                  onChange={(e) => handleModeChange(e.target.value as "concepts" | "configuration" | "troubleshooting" | "practice")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-[#0d274d] dark:text-white focus:border-[#049fd9] focus:ring-2 focus:ring-[#049fd9]/20 outline-none transition-all cursor-pointer hover:border-[#049fd9]/50"
                >
                  <option value="concepts">📚 Concepts & Theory</option>
                  <option value="configuration">⚙️ Configuration & CLI</option>
                  <option value="troubleshooting">🔧 Troubleshooting</option>
                  <option value="practice">📝 Practice & Exams</option>
                </select>
              </div>

              {/* Model Selector - Conditional based on mode */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">AI Model:</span>
                {selectedMode === "concepts" ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#049fd9] to-[#0d274d] text-white shadow-md shadow-[#049fd9]/30 outline-none cursor-pointer hover:from-[#049fd9]/90 hover:to-[#0d274d]/90 transition-all"
                  >
                    <option value="llama" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">Llama 3.1 8B (Best, 3-5s)</option>
                    <option value="phi3" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">Phi3 Mini (Fast, 1-2s)</option>
                  </select>
                ) : selectedMode === "configuration" ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#049fd9] to-[#0d274d] text-white shadow-md shadow-[#049fd9]/30 outline-none cursor-pointer hover:from-[#049fd9]/90 hover:to-[#0d274d]/90 transition-all"
                  >
                    <option value="gemini" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">Gemini (Best, 2-4s)</option>
                    <option value="llama" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">Llama 3.1 8B (Good, 3-5s)</option>
                  </select>
                ) : selectedMode === "troubleshooting" ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#049fd9] to-[#0d274d] text-white shadow-md shadow-[#049fd9]/30 outline-none cursor-pointer hover:from-[#049fd9]/90 hover:to-[#0d274d]/90 transition-all"
                  >
                    <option value="llama" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">Llama 3.1 8B (Best, 3-5s)</option>
                    <option value="phi3" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">Phi3 Mini (Fast, 1-2s)</option>
                  </select>
                ) : (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#049fd9] to-[#0d274d] text-white shadow-md shadow-[#049fd9]/30 outline-none cursor-pointer hover:from-[#049fd9]/90 hover:to-[#0d274d]/90 transition-all"
                  >
                    <option value="qwen2" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">Qwen2 0.5B (Instant, &lt;1s)</option>
                    <option value="phi3" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">Phi3 Mini (Fast, 1-2s)</option>
                  </select>
                )}
              </div>

              <div className="flex-1"></div>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  selectedMode === "concepts" ? "bg-green-500 animate-pulse" : 
                  selectedMode === "configuration" ? "bg-blue-500 animate-pulse" :
                  selectedMode === "troubleshooting" ? "bg-yellow-500 animate-pulse" :
                  "bg-purple-500 animate-pulse"
                )}></div>
                <span className="font-medium">
                  {selectedMode === "concepts" ? "Local GPU" : 
                   selectedMode === "configuration" ? "Cloud API" :
                   selectedMode === "troubleshooting" ? "AI Analysis" :
                   "Interactive Mode"}
                </span>
              </div>
            </div>

            {/* Input Container */}
            <div className="relative">
              <div className="relative flex items-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg hover:shadow-xl focus-within:border-[#049fd9] focus-within:shadow-[#049fd9]/20 transition-all duration-200">
                {/* Model Icon Indicator */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {selectedMode === "concepts" ? (
                    <Brain className="h-5 w-5 text-[#049fd9]" />
                  ) : selectedMode === "configuration" ? (
                    <Code2 className="h-5 w-5 text-[#049fd9]" />
                  ) : selectedMode === "troubleshooting" ? (
                    <svg className="h-5 w-5 text-[#049fd9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-[#049fd9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                </div>

                {/* Input Field */}
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    selectedMode === "concepts"
                      ? "Ask about CCNA concepts, protocols, or networking theory..."
                      : selectedMode === "configuration"
                      ? "Ask about Cisco CLI commands, router/switch configurations..."
                      : selectedMode === "troubleshooting"
                      ? "Describe your network issue or error for troubleshooting help..."
                      : "Request practice questions, labs, or exam scenarios..."
                  }
                  disabled={isLoading}
                  className="flex-1 pl-16 pr-14 h-14 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-[#0d274d] dark:text-white placeholder:text-slate-400"
                />

                {/* Send Button */}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "absolute right-2 h-10 w-10 p-0 rounded-xl transition-all duration-200",
                    !input.trim() || isLoading
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-br from-[#049fd9] to-[#0d274d] text-white shadow-lg shadow-[#049fd9]/30 hover:shadow-xl hover:scale-105"
                  )}
                >
                  {isLoading ? (
                    <div className="flex space-x-0.5">
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                    </div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Helper Text */}
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[#049fd9]" />
                    {selectedModel === "phi3" ? "~1-2s response" : selectedModel === "llama" ? "~3-5s response" : "~2-4s response"}
                  </span>
                  <span>•</span>
                  <span>Press Enter to send</span>
                  <span>•</span>
                  <span className="font-medium text-[#049fd9]">
                    {selectedModel === "phi3" ? "Phi3-Mini" : selectedModel === "llama" ? "Llama 3.1" : "Gemini Flash"}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Markdown supported
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
