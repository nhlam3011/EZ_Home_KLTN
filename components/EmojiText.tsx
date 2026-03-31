'use client'

import React from 'react'

interface EmojiTextProps {
  text: string
  className?: string
  emojiSize?: number
}

// Refined regex for emoji detection
const EMOJI_REGEX = /([\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{3297}\u{3299}\u{2139}\u{24C2}\u{23E9}-\u{23EF}\u{23F0}\u{23F3}\u{231A}-\u{231B}][\u{FE00}-\u{FE0F}\u{20D0}-\u{20FF}]?(?:\u{200D}[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}][\u{FE00}-\u{FE0F}\u{20D0}-\u{20FF}]?)*)/gu

export const EmojiText: React.FC<EmojiTextProps> = ({ text, className, emojiSize = 20 }) => {
  if (!text) return null

  const parts = text.split(EMOJI_REGEX)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null

        if (part.match(EMOJI_REGEX)) {
          const unified = charToUnified(part)
          return (
            <span
              key={index}
              className="inline-flex items-center justify-center align-middle mx-[1px] transition-transform hover:scale-110"
              style={{ width: emojiSize, height: emojiSize }}
            >
              <img
                src={`https://cdn.jsdelivr.net/npm/emoji-datasource-facebook@15.1.2/img/facebook/64/${unified}.png`}
                alt={part}
                style={{ width: emojiSize, height: emojiSize, objectFit: 'contain' }}
                loading="eager"
                onError={(e) => {
                  // Fallback: thử bỏ variation selector và thử lại
                  const target = e.currentTarget
                  const simplified = charToUnified(part.replace(/\uFE0F/g, ''))
                  if (simplified !== unified && !target.dataset.retried) {
                    target.dataset.retried = '1'
                    target.src = `https://cdn.jsdelivr.net/npm/emoji-datasource-facebook@15.1.2/img/facebook/64/${simplified}.png`
                  } else {
                    // Cuối cùng: hiển thị native emoji
                    target.style.display = 'none'
                    const span = target.parentElement
                    if (span) span.textContent = part
                  }
                }}
              />
            </span>
          )
        }
        return <React.Fragment key={index}>{part}</React.Fragment>
      })}
    </span>
  )
}

// Convert Unicode character to unified hex code
export function charToUnified(char: string): string {
  if (!char) return ''
  const hexParts: string[] = []
  for (const sym of char) {
    const code = sym.codePointAt(0)
    if (code) {
      hexParts.push(code.toString(16).toLowerCase())
    }
  }
  return hexParts.join('-')
}
