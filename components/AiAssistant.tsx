'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bot, Send, Sparkles, Loader2, Trash2, Mic, MicOff,
  Building2, FileText, Users, TrendingUp, AlertTriangle, Wrench,
  BarChart3, Clock, Zap, X, MessageSquare
} from 'lucide-react'
import { useBuilding } from '@/components/BuildingContext'

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
    <div className="overflow-x-auto my-3 rounded-xl border text-sm" style={{
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
  const { selectedBuildingId } = useBuilding()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [welcomeText, setWelcomeText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    containerRef.current.style.setProperty('--mouse-x', `${x}px`)
    containerRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  const suggestions = role === 'ADMIN' ? ADMIN_SUGGESTIONS : TENANT_SUGGESTIONS

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setUserId(user.id)
      }
    } catch { }
  }, [role])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const fullText = role === 'ADMIN' ? 'Trợ lý quản lý thông minh' : 'Trợ lý cư dân 24/7'
    setWelcomeText(fullText)
  }, [role])

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

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history,
          role,
          userId,
          buildingId: selectedBuildingId
        }),
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
          if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-sm mt-3 mb-1.5" style={{ color: '#8b5cf6' }}>{renderInline(line.slice(4))}</h4>
          if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-base mt-3 mb-1.5" style={{ color: '#8b5cf6' }}>{renderInline(line.slice(3))}</h3>
          if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-3 mb-1.5" style={{ color: '#8b5cf6' }}>{renderInline(line.slice(2))}</h2>

          if (line.match(/^[\-\*\•]\s/)) {
            return (
              <div key={i} className="flex gap-2.5 ml-1 py-0.5 items-start">
                <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
                <span className="flex-1 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{renderInline(line.slice(2))}</span>
              </div>
            )
          }

          const numMatch = line.match(/^(\d+)\.\s(.*)/)
          if (numMatch) return (
            <div key={i} className="flex gap-2.5 ml-1 py-0.5 items-start">
              <span className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold mt-0.5"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                {numMatch[1]}
              </span>
              <span className="flex-1 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{renderInline(numMatch[2])}</span>
            </div>
          )

          if (line.trim() === '---' || line.trim() === '***') return <hr key={i} className="my-3" style={{ borderColor: 'var(--border-primary)' }} />
          if (!line.trim()) return <div key={i} className="h-2" />
          return <p key={i} className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{renderInline(line)}</p>
        })}
      </div>
    )
  }

  const renderInline = (text: string): React.ReactNode => {
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
      if (part.startsWith('/') || part.startsWith('http')) {
        const cleanLink = part.replace(/[.,!?;:]$/, '')
        const isInternal = cleanLink.startsWith('/')
        if (isInternal) {
          return <Link key={i} href={cleanLink} className="text-[#4f46e5] hover:underline font-medium">{cleanLink}</Link>
        }
        return <a key={i} href={cleanLink} target="_blank" rel="noopener noreferrer" className="text-[#4f46e5] hover:underline font-medium">{cleanLink}</a>
      }
      return part
    })
  }

  const hasMessages = messages.length > 0

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="h-full flex flex-col relative overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 64px)' }}
    >
      {/* GenAI Background Animation */}
      <style jsx>{`
        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.05); }
          50% { transform: translate(-10px, -35px) scale(0.95); }
          75% { transform: translate(20px, 10px) scale(1.02); }
        }
        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-25px, 15px) scale(1.03); }
          50% { transform: translate(15px, 30px) scale(0.97); }
          75% { transform: translate(-20px, -10px) scale(1.05); }
        }
        @keyframes orb-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, 20px) scale(1.04); }
          66% { transform: translate(-15px, -25px) scale(0.96); }
        }
        @keyframes mesh-shift {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes gradient-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .orb-1 { animation: orb-float-1 14s ease-in-out infinite; }
        .orb-2 { animation: orb-float-2 18s ease-in-out infinite; }
        .orb-3 { animation: orb-float-3 12s ease-in-out infinite; }
        .mesh-animate { animation: mesh-shift 8s ease-in-out infinite; }
        .gradient-flow { background-size: 200% 200%; animation: gradient-flow 4s ease infinite; }
        .pulse-ring { animation: pulse-ring 3s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #a855f7, #6366f1);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .msg-appear { animation: msg-in 0.3s ease-out; }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dot-grid {
          /* image set inline to match login page */
        }
        .dot-highlight {
          background-image: radial-gradient(circle, rgba(255, 255, 255, 0.9) 1.5px, transparent 1.5px);
          mask-image: radial-gradient(150px circle at var(--mouse-x, -300px) var(--mouse-y, -300px), black 20%, transparent 100%);
          -webkit-mask-image: radial-gradient(150px circle at var(--mouse-x, -300px) var(--mouse-y, -300px), black 20%, transparent 100%);
        }



      `}</style>

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base adaptive background */}
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#0f172a]" />

        {/* Mesh Gradient Overlay like Login Page */}
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-30">
          <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] rounded-full bg-blue-500/20 dark:bg-blue-400/15 blur-[100px] orb-1"></div>
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 dark:bg-purple-400/15 blur-[100px] orb-2"></div>
          <div className="absolute bottom-[-10%] left-[10%] w-[45%] h-[45%] rounded-full bg-indigo-500/20 dark:bg-indigo-400/15 blur-[100px] orb-3"></div>
        </div>

        {/* Subtle dot pattern matching login page but allowing highlighting */}
        <div className="absolute inset-0 opacity-[0.5] dark:opacity-[0.15] dot-grid"
          style={{ backgroundImage: 'radial-gradient(#64748b 1.0px, transparent 1.0px)', backgroundSize: '24px 24px' }} />

        {/* Interactive Highlight layer (the spotlight dots) */}
        <div className="absolute inset-0 opacity-100 dark:opacity-80 dot-highlight"
          style={{ backgroundSize: '24px 24px' }} />

        {/* Mouse Spotlight Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(350px circle at var(--mouse-x, -100px) var(--mouse-y, -100px), rgba(99, 102, 241, 0.1), transparent 100%)'
        }} />
      </div>




      {/* Messages Area / Welcome Screen */}
      <div className="flex-1 overflow-y-auto relative z-10 no-scrollbar">
        {!hasMessages ? (
          /* ===== WELCOME SCREEN ===== */
          <div className="flex flex-col items-center justify-center min-h-full px-4 sm:px-6 py-8 sm:py-12">
            <div className="w-full max-w-lg flex flex-col items-center">
              {/* AI Avatar */}
              <div className="relative mb-6">
                <div className="pulse-ring absolute inset-0 rounded-2xl" style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))',
                  filter: 'blur(12px)'
                }} />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center gradient-flow shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7, #4f46e5)' }}>
                  <Bot size={32} className="text-white sm:hidden" />
                  <Bot size={40} className="text-white hidden sm:block" />
                </div>
              </div>

              {/* Greeting */}
              <h2 className="text-xl sm:text-2xl font-bold text-primary mb-1.5">Xin chào! 👋</h2>
              <p className="shimmer-text text-sm sm:text-base font-semibold mb-1 h-6">
                {welcomeText}
              </p>
              <p className="text-xs sm:text-sm text-secondary text-center mb-6 sm:mb-8 max-w-sm leading-relaxed px-2">
                {role === 'ADMIN'
                  ? 'Quản lý phòng, cư dân, hoá đơn, hợp đồng và phân tích dữ liệu.'
                  : 'Xem hoá đơn, hợp đồng, báo sự cố và tra cứu thông tin phòng.'}
              </p>

              {/* Suggestion Cards */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {suggestions.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <button key={i} onClick={() => sendMessage(s.prompt)}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:shadow-lg"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
                        borderColor: 'var(--border-primary)',
                        backdropFilter: 'blur(12px)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = s.color
                        e.currentTarget.style.boxShadow = `0 4px 20px ${s.color}20`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-primary)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                        <Icon size={20} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-primary text-center">{s.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ===== CHAT MESSAGES ===== */
          <div className="px-3 sm:px-6 py-4 sm:py-6">
            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
              {messages.map((msg, idx) => (
                <div key={msg.id} className={`msg-appear flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 sm:gap-3 max-w-[92%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md gradient-flow"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7, #4f46e5)' }}>
                        <Sparkles size={13} className="text-white" />
                      </div>
                    )}
                    {/* Bubble */}
                    <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm leading-relaxed ${msg.role === 'user'
                      ? 'rounded-2xl rounded-br-md text-white shadow-md'
                      : 'rounded-2xl rounded-bl-md border shadow-sm'
                      }`}
                      style={
                        msg.role === 'user'
                          ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }
                          : {
                            backgroundColor: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-primary)',
                            backdropFilter: 'blur(8px)'
                          }
                      }
                    >
                      {msg.role === 'assistant' ? (
                        renderContent(msg.content)
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="msg-appear flex justify-start">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md gradient-flow"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7, #4f46e5)' }}>
                      <Sparkles size={13} className="text-white" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md border shadow-sm"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)',
                        borderColor: 'var(--border-primary)',
                        backdropFilter: 'blur(8px)'
                      }}>
                      <div className="flex items-center gap-2.5">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#6366f1', animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#8b5cf6', animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#a855f7', animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-secondary">Đang phân tích...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions (when chatting) */}
      {hasMessages && !isLoading && (
        <div className="shrink-0 relative z-10 px-3 sm:px-6 py-2"
          style={{ borderTop: '1px solid var(--border-primary)' }}>
          <div className="max-w-3xl mx-auto flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border transition-all hover:scale-105 active:scale-95"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
                  borderColor: 'var(--border-primary)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = s.color
                  e.currentTarget.style.color = s.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                <s.icon size={12} /> {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 relative z-10"
        style={{ borderTop: hasMessages ? 'none' : '1px solid var(--border-primary)' }}>
        <div className="max-w-3xl mx-auto">
          {/* New chat button */}
          {hasMessages && (
            <div className="flex justify-center mb-2">
              <button onClick={() => setMessages([])}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all hover:scale-105"
                style={{
                  color: 'var(--text-tertiary)',
                  backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 60%, transparent)',
                  backdropFilter: 'blur(8px)',
                }}>
                <Trash2 size={11} /> Cuộc hội thoại mới
              </button>
            </div>
          )}

          {/* Input box */}
          <div className={`flex items-end gap-1.5 sm:gap-2 rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 transition-all duration-300 ${isListening ? 'ring-2 ring-red-400/40' : ''}`}
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)',
              border: `1.5px solid ${isListening ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-primary)'}`,
              backdropFilter: 'blur(16px)',
              boxShadow: isListening
                ? '0 0 20px rgba(239, 68, 68, 0.08)'
                : '0 2px 12px rgba(0,0,0,0.04)'
            }}>
            {speechSupported && (
              <button type="button" onClick={toggleVoice}
                className="p-2 sm:p-2.5 rounded-xl shrink-0 transition-all active:scale-90"
                style={{
                  backgroundColor: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  color: isListening ? '#ef4444' : 'var(--text-tertiary)',
                }}>
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening
                ? '🎙️ Đang nghe...'
                : role === 'ADMIN'
                  ? 'Nhập nội dung...'
                  : 'HNhập nội dung...'}
              rows={1}
              className="flex-1 bg-transparent outline-none border-none focus:ring-0 text-sm py-2 sm:py-2.5 px-1 leading-relaxed resize-none no-scrollbar"
              style={{ color: 'var(--text-primary)', maxHeight: '120px' }}
              disabled={isLoading}
            />

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="p-2 sm:p-2.5 rounded-xl shrink-0 transition-all duration-200 disabled:opacity-30 active:scale-90 hover:shadow-md"
              style={{
                background: input.trim() ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
                color: input.trim() ? 'white' : 'var(--text-tertiary)',
              }}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-tertiary text-center mt-2 opacity-50">
            Enter ↵ gửi • Shift+Enter xuống dòng
          </p>
        </div>
      </div>
    </div>
  )
}
