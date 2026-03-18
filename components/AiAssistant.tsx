'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bot, Send, Sparkles, Loader2, Trash2, Mic, MicOff,
  Building2, FileText, Users, TrendingUp, AlertTriangle, Wrench,
  BarChart3, Clock, Zap, ChevronUp, X
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AiAssistantPageProps {
  role: 'ADMIN' | 'TENANT'
}

const ADMIN_SUGGESTIONS = [
  { icon: BarChart3, label: 'Tổng quan', prompt: 'Cho tôi xem tổng quan dashboard hôm nay', color: '#3b82f6' },
  { icon: Building2, label: 'Phòng trống', prompt: 'Hiện có bao nhiêu phòng trống?', color: '#10b981' },
  { icon: Clock, label: 'HĐ sắp hết', prompt: 'Liệt kê các hợp đồng sắp hết hạn', color: '#f59e0b' },
  { icon: TrendingUp, label: 'Doanh thu', prompt: 'Báo cáo doanh thu tháng này', color: '#8b5cf6' },
  { icon: AlertTriangle, label: 'Quá hạn', prompt: 'Hoá đơn nào đang quá hạn?', color: '#ef4444' },
  { icon: Wrench, label: 'Bảo trì', prompt: 'Các sự cố đang chờ xử lý?', color: '#f97316' },
]

const TENANT_SUGGESTIONS = [
  { icon: FileText, label: 'Hoá đơn', prompt: 'Cho tôi xem hoá đơn hiện tại', color: '#3b82f6' },
  { icon: Building2, label: 'Phòng', prompt: 'Thông tin phòng tôi đang thuê', color: '#10b981' },
  { icon: Clock, label: 'Hợp đồng', prompt: 'Hợp đồng còn bao lâu hết hạn?', color: '#f59e0b' },
  { icon: Wrench, label: 'Báo sự cố', prompt: 'Tôi muốn báo sự cố trong phòng', color: '#ef4444' },
  { icon: TrendingUp, label: 'Gia hạn', prompt: 'Tôi muốn gia hạn hợp đồng', color: '#8b5cf6' },
  { icon: Users, label: 'Liên hệ', prompt: 'Tôi muốn liên hệ admin', color: '#06b6d4' },
]

// Parse markdown table
const parseTable = (content: string): { before: string; table: string; after: string } | null => {
  const tableRegex = /(\|[\s\S]*?\|)\s*\n(\|[-:\s|]+\|)\s*\n((?:\|[\s\S]*?\|\s*\n?)+)/g
  const match = tableRegex.exec(content)
  if (!match) return null
  const before = content.slice(0, match.index)
  const table = match[0]
  const after = content.slice(match.index + match[0].length)
  return { before, table, after }
}

// Render table
const renderTable = (tableContent: string) => {
  const lines = tableContent.trim().split('\n').filter(line => line.trim())
  if (lines.length < 2) return null
  const headers = lines[0].split('|').filter(cell => cell.trim()).map(cell => cell.trim())
  const isSeparator = lines[1].includes('---')
  const dataLines = isSeparator ? lines.slice(2) : lines.slice(1)

  return (
    <div className="overflow-x-auto my-4 rounded-xl border text-sm" style={{
      borderColor: 'var(--border-primary)',
      backgroundColor: 'var(--bg-primary)',
    }}>
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            {headers.map((header, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap"
                style={{ color: 'var(--text-primary)' }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataLines.map((line, rowIndex) => {
            const cells = line.split('|').filter(cell => cell.trim()).map(cell => cell.trim())
            if (cells.length === 0) return null
            return (
              <tr key={rowIndex} style={{
                backgroundColor: rowIndex % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                {cells.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2.5 whitespace-nowrap"
                    style={{ color: 'var(--text-secondary)' }}>{cell}</td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AiAssistantPage({ role }: AiAssistantPageProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const suggestions = role === 'ADMIN' ? ADMIN_SUGGESTIONS : TENANT_SUGGESTIONS

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setUserId(user.id)
      }
    } catch { }

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      setSpeechSupported(true)
      const rec = new SR()
      rec.lang = 'vi-VN'
      rec.continuous = false
      rec.interimResults = true
      rec.onresult = (e: any) => {
        let final = '', interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript
          else interim += e.results[i][0].transcript
        }
        if (final) setInput(p => p + final)
        else if (interim) setInput(interim)
      }
      rec.onend = () => setIsListening(false)
      rec.onerror = () => setIsListening(false)
      recognitionRef.current = rec
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) return
    if (isListening) { recognitionRef.current.stop(); setIsListening(false) }
    else { setInput(''); recognitionRef.current.start(); setIsListening(true) }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false) }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setShowSuggestions(false)

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history, role, userId }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: data.response || data.error || 'Không thể xử lý.', timestamp: new Date(),
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: `❌ Lỗi kết nối. Vui lòng thử lại.`, timestamp: new Date(),
      }])
    } finally { setIsLoading(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const renderContent = (content: string) => {
    const tableMatch = parseTable(content)
    if (tableMatch) {
      return (
        <div className="space-y-2">
          {tableMatch.before && renderTextContent(tableMatch.before)}
          {renderTable(tableMatch.table)}
          {tableMatch.after && renderTextContent(tableMatch.after)}
        </div>
      )
    }
    return renderTextContent(content)
  }

  const renderTextContent = (content: string) => {
    const lines = content.split('\n')
    return (
      <div className="space-y-1">
        {lines.map((line, i) => {
          if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-sm mt-4 mb-2 text-[#8b5cf6]">{renderInline(line.slice(4))}</h4>
          if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-base mt-4 mb-2 text-[#8b5cf6]">{renderInline(line.slice(3))}</h3>
          if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2 text-[#8b5cf6]">{renderInline(line.slice(2))}</h2>

          if (line.match(/^[\-\*\•]\s/)) {
            return (
              <div key={i} className="flex gap-3 ml-1 py-0.5 items-start">
                <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
                <span className="flex-1 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{renderInline(line.slice(2))}</span>
              </div>
            )
          }

          const numMatch = line.match(/^(\d+)\.\s(.*)/)
          if (numMatch) return (
            <div key={i} className="flex gap-3 ml-1 py-0.5 items-start">
              <span className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold mt-0.5"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                {numMatch[1]}
              </span>
              <span className="flex-1 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{renderInline(numMatch[2])}</span>
            </div>
          )

          if (line.trim() === '---' || line.trim() === '***') return <hr key={i} className="my-4" style={{ borderColor: 'var(--border-primary)' }} />
          if (!line.trim()) return <div key={i} className="h-3" />
          return <p key={i} className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{renderInline(line)}</p>
        })}
      </div>
    )
  }

  const renderInline = (text: string): React.ReactNode => {
    // Split by markdown bold, italic, code, and also path-like links (/tenant/... or /admin/...) or http(s) urls
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|(?:\/tenant\/\S+|\/admin\/\S+|https?:\/\/\S+))/g)
    return parts.map((part, i) => {
      if (!part) return null
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold" style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) return <em key={i} style={{ color: 'var(--text-secondary)' }}>{part.slice(1, -1)}</em>
      if (part.startsWith('`') && part.endsWith('`')) return (
        <code key={i} className="px-1.5 py-0.5 rounded-md text-xs font-mono"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: '#8b5cf6', border: '1px solid var(--border-primary)' }}>
          {part.slice(1, -1)}
        </code>
      )
      // Check for links (paths or URLs)
      if (part.startsWith('/') || part.startsWith('http')) {
        const cleanLink = part.replace(/[.,!?;:]$/, '') // remove trailing punctuation
        const isInternal = cleanLink.startsWith('/')

        if (isInternal) {
          return (
            <Link key={i} href={cleanLink} className="text-[#4f46e5] hover:underline font-medium inline-flex items-center gap-0.5">
              {cleanLink}
            </Link>
          )
        }

        return (
          <a key={i} href={cleanLink} target="_blank" rel="noopener noreferrer" className="text-[#4f46e5] hover:underline font-medium inline-flex items-center gap-0.5">
            {cleanLink}
          </a>
        )
      }
      return part
    })
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden" style={{ maxHeight: 'calc(100vh - 64px)' }}>
      {/* Background */}
      <style jsx>{`
        @keyframes float1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(15px, -10px); } }
        @keyframes float2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-15px, 10px); } }
        @keyframes gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .ai-orb-1 { animation: float1 10s ease-in-out infinite; }
        .ai-orb-2 { animation: float2 12s ease-in-out infinite; }
        .gradient-animate { background-size: 200% 200%; animation: gradient-shift 3s ease infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)'
        }} />
        <div className="ai-orb-1 absolute top-[10%] right-[15%] w-60 h-60 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12), transparent 70%)' }} />
        <div className="ai-orb-2 absolute bottom-[20%] left-[10%] w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1), transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 py-3 relative z-10 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center gradient-animate shadow-lg"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7, #4f46e5)' }}>
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 animate-pulse"
              style={{ borderColor: 'var(--bg-primary)' }} />
          </div>
          <div>
            <h1 className="text-base font-bold text-primary flex items-center gap-2">
              Trợ lý AI
            </h1>
            <p className="text-xs text-secondary flex items-center gap-1.5 mt-0.5">
              <Zap size={11} className="text-green-500" />
              {role === 'ADMIN' ? 'Quản lý phòng trọ thông minh' : 'Hỗ trợ khách thuê 24/7'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setShowSuggestions(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors hover:border-red-400 hover:text-red-500"
            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
            <Trash2 size={14} /> <span className="hidden sm:inline">Xóa hội thoại</span>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 relative z-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full max-w-4xl mx-auto py-10">
            {/* Hero */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center gradient-animate shadow-xl"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7, #4f46e5)' }}>
                <Bot size={40} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-2xl opacity-30 blur-xl"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }} />
            </div>

            <h2 className="text-2xl font-bold text-primary mb-2">Xin chào! 👋</h2>
            <p className="text-sm text-secondary text-center mb-8 max-w-md leading-relaxed">
              {role === 'ADMIN'
                ? 'Tôi có thể giúp bạn quản lý phòng, cư dân, hoá đơn, hợp đồng và phân tích dữ liệu.'
                : 'Tôi có thể giúp bạn xem hoá đơn, hợp đồng, báo sự cố và tra cứu thông tin phòng.'}
            </p>

            {/* Suggestions Grid */}
            <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-4 justify-center">
              {suggestions.map((s, i) => {
                const Icon = s.icon
                return (
                  <button key={i} onClick={() => sendMessage(s.prompt)}
                    className="group flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm dark:shadow-none"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--border-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                      <Icon size={18} />
                    </div>
                    <span className="text-sm font-medium text-primary">{s.label}</span>
                  </button>
                )
              })}
            </div>

            {speechSupported && (
              <div className="mt-8 flex items-center gap-2 px-4 py-2.5 rounded-full border"
                style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                  <Mic size={12} style={{ color: '#8b5cf6' }} />
                </div>
                <span className="text-xs text-secondary">Hỗ trợ nhập liệu bằng giọng nói tiếng Việt</span>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-[1200px] mx-auto space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md gradient-animate"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7, #4f46e5)' }}>
                      <Sparkles size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                    ? 'rounded-2xl rounded-br-md text-white shadow-md'
                    : 'rounded-2xl rounded-bl-md border shadow-sm'
                    }`}
                    style={
                      msg.role === 'user'
                        ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }
                        : { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }
                    }
                  >
                    {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md gradient-animate"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7, #4f46e5)' }}>
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md border shadow-sm"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#6366f1', animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#8b5cf6', animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#a855f7', animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-secondary">Đang phân tích...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggestions bar when has messages */}
      {messages.length > 0 && !isLoading && (
        <div className="shrink-0 px-4 sm:px-6 py-3 flex justify-center relative z-10"
          style={{ borderTop: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full py-1 px-4 scroll-smooth">
            {suggestions.slice(0, role === 'ADMIN' ? 6 : suggestions.length).map((s, i) => (
              <button key={i} onClick={() => sendMessage(s.prompt)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap border transition-all hover:scale-105 active:scale-95 shadow-sm dark:shadow-none"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--border-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)' }}
              >
                <s.icon size={12} className="sm:w-[13px] sm:h-[13px]" /> {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0 px-4 sm:px-6 py-4 relative z-10"
        style={{ borderTop: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-3xl mx-auto">
          <div className={`flex items-end gap-2 rounded-[28px] px-2 py-2 transition-all duration-300 ${isListening ? 'ring-2 ring-red-500/50 bg-red-50/5' : 'bg-tertiary/50 hover:bg-tertiary/80'}`}
            style={{
              boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.1)' : 'none',
              border: '1px solid var(--border-primary)'
            }}>
            {speechSupported && (
              <button type="button" onClick={toggleVoice}
                className="p-3 rounded-full shrink-0 transition-all active:scale-90"
                style={{
                  backgroundColor: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  color: isListening ? '#ef4444' : 'var(--text-tertiary)',
                }}>
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening
                ? '🎙️ Đang nghe giọng nói...'
                : role === 'ADMIN'
                  ? 'Gửi tin nhắn cho AI Assistant...'
                  : 'Hỏi về hoá đơn, hợp đồng...'}
              rows={1}
              className="flex-1 bg-transparent outline-none border-none focus:ring-0 text-sm py-3 px-1 leading-relaxed resize-none scrollbar-hide"
              style={{ color: 'var(--text-primary)', maxHeight: '160px' }}
              disabled={isLoading}
            />

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-full shrink-0 transition-all duration-200 disabled:opacity-30 active:scale-90"
              style={{
                background: input.trim() ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
                color: input.trim() ? 'white' : 'var(--text-tertiary)',
              }}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-tertiary text-center mt-2.5 opacity-60">
            Nhấn Enter để gửi • Hỗ trợ tìm kiếm thông tin {role === 'ADMIN' ? 'nhà trọ' : 'phòng thuê'} của bạn
          </p>
        </div>
      </div>
    </div>
  )
}
