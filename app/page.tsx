'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, MessageCircle, Zap } from 'lucide-react'
import { getOrCreateThreadId, setThreadId } from './utils/threadId'
import SessionSidebar from './components/SessionSidebar'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isStreaming?: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好！我是由 LangGraphJS 驱动的 AI 助手。✨ 我可以帮助你解答问题、提供建议或者进行有趣的对话。有什么我可以帮助你的吗？',
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateThreadId())
  const [hasUserMessage, setHasUserMessage] = useState(false)
  const sidebarRef = useRef<{ fetchSessions: () => void }>(null)

  // 自动加载历史记录
  useEffect(() => {
    // 根据 sessionId 加载历史记录
    fetch(`/api/chat?thread_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.history) && data.history.length > 0) {
          const historyMsgs: Message[] = data.history.map((msg: any, idx: number) => {
            let role: 'user' | 'assistant' = 'assistant'
            if (Array.isArray(msg.id) && msg.id.includes('HumanMessage')) {
              role = 'user'
            } else if (Array.isArray(msg.id) && (msg.id.includes('AIMessage') || msg.id.includes('AIMessageChunk'))) {
              role = 'assistant'
            }
            return {
              id: String(idx + 1),
              content: msg.kwargs?.content || '',
              role,
              timestamp: new Date()
            }
          })
          setMessages(historyMsgs.length > 0 ? historyMsgs : [
            {
              id: '1',
              content: '你好！我是由 LangGraphJS 驱动的 AI 助手。✨ 我可以帮助你解答问题、提供建议或者进行有趣的对话。有什么我可以帮助你的吗？',
              role: 'assistant',
              timestamp: new Date()
            }
          ])
          setHasUserMessage(historyMsgs.some(msg => msg.role === 'user'))
        } else {
          setMessages([
            {
              id: '1',
              content: '你好！我是由 LangGraphJS 驱动的 AI 助手。✨ 我可以帮助你解答问题、提供建议或者进行有趣的对话。有什么我可以帮助你的吗？',
              role: 'assistant',
              timestamp: new Date()
            }
          ])
          setHasUserMessage(false)
        }
      })
      .catch(() => { })
  }, [sessionId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input.trim(), thread_id: sessionId })
      })

      if (!response.ok) {
        throw new Error('网络请求失败')
      }

      if (!hasUserMessage) {
        fetch('/api/chat/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sessionId, name: input.trim().slice(0, 20) })
        }).then(() => {
          sidebarRef.current?.fetchSessions?.();
        });
        setHasUserMessage(true);
      }

      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true
      }

      setMessages(prev => [...prev, assistantMessage])

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)

              if (data.type === 'chunk' && data.content) {
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                ))
              } else if (data.type === 'end') {
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                ))
                break
              } else if (data.type === 'error') {
                throw new Error(data.message || '服务器错误')
              }
            } catch (parseError) {
              console.error('解析流数据错误:', parseError)
            }
          }
        }
      }

    } catch (error) {
      console.error('发送消息时出错:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，发送消息时出现错误。请稍后重试。',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    adjustTextareaHeight()
  }

  // 新建会话
  const handleNewSession = (id: string) => {
    setThreadId(id);
    setSessionId(id);
    setHasUserMessage(false);
    // 新建后刷新侧边栏
    sidebarRef.current?.fetchSessions?.();
  };

  // 切换会话
  const handleSelectSession = (id: string) => {
    setSessionId(id)
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* 背景点阵和动态光效可保留在最外层 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(156,146,172,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 头部导航栏 */}
      <header className="relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20 p-4 flex-shrink-0 w-full">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {/* 左侧：图标和标题 */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  LangGraph AI 助手
                  <Zap className="h-4 w-4 text-yellow-400" />
                </h1>
                <p className="text-purple-200 text-xs">智能对话 • 实时响应 • 无限可能</p>
              </div>
            </div>
            {/* 右侧：技术标签 */}
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                qwen-plus
              </div>
              <div className="px-2 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs">
                🚀 StateGraph
              </div>
              <div className="px-2 py-1 bg-gradient-to-r from-pink-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs">
                ⚡ 流式
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主体区域：侧边栏+主内容 */}
      <div className="relative z-10 flex flex-1 h-0">
        {/* 历史会话侧边栏 */}
        <SessionSidebar
          ref={sidebarRef}
          currentSessionId={sessionId}
          onSelect={handleSelectSession}
          onNew={handleNewSession}
        />
        {/* 主内容区 */}
        <div className="flex-1 flex flex-col">
          {/* 聊天区域 */}
          <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col p-6 min-h-0">
            {/* 消息列表 */}
            <div className="flex-1 backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/10 rounded-3xl border border-white/10 shadow-2xl overflow-hidden mb-6 min-h-0">
              <div className="h-full overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 opacity-0 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    style={{
                      animation: `fadeIn 0.4s ease-out ${index * 0.08}s forwards`
                    }}
                  >
                    {/* 头像 */}
                    <div className="flex-shrink-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl transform transition-transform hover:scale-105 ${message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500'
                        : 'bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500'
                        }`}>
                        {message.role === 'user' ? (
                          <User className="h-5 w-5 text-white" />
                        ) : (
                          <Bot className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </div>

                    {/* 消息内容 */}
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`relative inline-block p-4 rounded-2xl shadow-xl backdrop-blur-md border transition-all duration-200 hover:shadow-2xl ${message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 text-white border-blue-400/30 rounded-br-md'
                        : 'bg-gradient-to-br from-white/15 to-white/5 text-white border-white/20 rounded-bl-md hover:border-purple-400/30'
                        }`}>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>

                        {/* 流式打字光标 */}
                        {message.isStreaming && (
                          <span className="inline-block w-2 h-5 bg-white/80 ml-1 typing-cursor animate-pulse"></span>
                        )}
                      </div>

                      <div className={`mt-2 text-xs text-purple-200/60 flex items-center gap-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span>{message.timestamp.toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 加载动画 - 优化版 */}
                {isLoading && (
                  <div className="flex gap-4 opacity-0" style={{ animation: 'fadeIn 0.3s ease-out forwards' }}>
                    <div className="flex-shrink-0">
                      <div className="w-11 h-11 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl rounded-bl-md p-5 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1.5">
                          <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full animate-bounce shadow-lg"></div>
                          <div className="w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.15s' }}></div>
                          <div className="w-2.5 h-2.5 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        <span className="text-purple-100 text-sm font-medium">AI 正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 输入区域 - 优化版 */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/20 shadow-2xl p-5 flex-shrink-0">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="输入你的消息... (支持 Shift+Enter 换行)"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-purple-200/60 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 backdrop-blur-sm transition-all duration-300 text-[15px] leading-relaxed input-scrollbar hover:bg-white/[0.12] hover:border-purple-400/30"
                    rows={1}
                    disabled={isLoading}
                    style={{ maxHeight: '120px' }}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="group p-4 bg-gradient-to-r from-purple-500 via-purple-600 to-cyan-500 text-white rounded-2xl hover:from-purple-600 hover:via-purple-700 hover:to-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95 disabled:transform-none"
                >
                  <Send className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-4 text-xs text-purple-200/70">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="font-medium">按 Enter 发送，Shift+Enter 换行</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-400/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <span className="text-green-300 font-medium">实时连接</span>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}
