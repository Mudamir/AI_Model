"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, MoreHorizontal, MessageSquare, Settings, Download, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
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
      content: "Hello! I'm your AI assistant powered by Ollama. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("default")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userMessage.content }), // <-- FIXED
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer || "I apologize, but I couldn't process your request at the moment.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'm sorry, I'm having trouble connecting to the Ollama service. Please make sure your FastAPI server and Ollama are running locally.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">AI Assistant</h1>
              <p className="text-xs text-sidebar-foreground/60">Powered by Ollama</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4">
          <Button
            onClick={startNewConversation}
            variant="outline"
            className="w-full justify-start mb-6 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border hover:bg-sidebar-accent/80 h-10"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            New Conversation
          </Button>

          <div className="space-y-4">
            <div className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
              Recent Conversations
            </div>
            <div className="space-y-2">
              {chatSessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadConversation(session)}
                  className={cn(
                    "p-3 rounded-lg text-sm cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                    session.id === currentSessionId
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground",
                  )}
                >
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-xs opacity-70 mt-1">{session.createdAt.toLocaleDateString()}</div>
                </div>
              ))}
              {chatSessions.length === 0 && (
                <div className="p-3 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  <div className="font-medium">Current Session</div>
                  <div className="text-xs opacity-70 mt-1">Active conversation</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Button
            onClick={exportChat}
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Chat
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-6 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">AI Assistant</h2>
                <p className="text-sm text-muted-foreground">Ready to help • Powered by Ollama via FastAPI</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
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
                  <Avatar className="h-9 w-9 mt-1 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-6 py-4 text-sm leading-relaxed shadow-sm transition-all hover:shadow-md",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-12 rounded-br-md"
                      : "bg-card text-card-foreground border border-border rounded-bl-md",
                  )}
                >
                  {message.role === "assistant" ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <p className="text-pretty whitespace-pre-wrap">{message.content}</p>
                  )}

                  <div
                    className={cn(
                      "text-xs mt-3 opacity-70 flex items-center gap-2",
                      message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    <span>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                        onClick={() => navigator.clipboard.writeText(message.content)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-9 w-9 mt-1 ring-2 ring-accent/10">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <Avatar className="h-9 w-9 mt-1 ring-2 ring-primary/10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card text-card-foreground border border-border rounded-2xl rounded-bl-md px-6 py-4 text-sm shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-6 bg-card">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message here... (Supports **bold**, *italic*, `code`, and more)"
                  disabled={isLoading}
                  className="pr-14 h-14 bg-input border-border focus:ring-ring text-base rounded-2xl shadow-sm transition-all focus:shadow-md"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-3 h-8 w-8 p-0 bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all hover:shadow-md hover:scale-105"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Connected to FastAPI + Ollama • Press Enter to send • Supports markdown formatting • Chats auto-saved
              locally
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
