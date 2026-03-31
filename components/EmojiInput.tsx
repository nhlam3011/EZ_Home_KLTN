'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { Emoji, EmojiStyle } from 'emoji-picker-react'
import { charToUnified } from './EmojiText'

interface EmojiInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  maxHeight?: string
  onEnter?: () => void
  onPaste?: (e: React.ClipboardEvent) => void
}

export const EmojiInput: React.FC<EmojiInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
  maxHeight = '150px',
  onEnter,
  onPaste
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)

  // Robust emoji regex including compound emojis (ZWJ)
  const EMOJI_REGEX = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}])/gu

  // Function to convert Unicode text to HTML with Facebook emojis
  const textToHtml = useCallback((text: string) => {
    if (!text) return ''
    return text.replace(EMOJI_REGEX, (match) => {
      const unified = charToUnified(match)
      // We use a simplified IMG tag that mimics the Emoji component's output
      // so it renders correctly inside the contentEditable
      return `<img src="https://cdn.jsdelivr.net/npm/emoji-datasource-facebook/img/facebook/64/${unified}.png" 
                   alt="${match}" 
                   class="inline-block w-5 h-5 align-middle mx-[1px]" 
                   data-emoji="${match}" 
                   data-unified="${unified}" />`
    })
  }, [])

  // Sync state -> editor (only when NOT changed internally)
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }

    if (editorRef.current) {
      const selection = window.getSelection()
      let cursorPosition = 0
      if (selection && selection.rangeCount > 0) {
        // This is a complex problem (maintaining cursor in rich text).
        // For simplicity, if value changes externally, we update content.
        // In chat apps, this usually only happens when sending (clear) or when picker is used.
      }

      editorRef.current.innerHTML = textToHtml(value) || (placeholder && value === '' ? `<span class="text-tertiary opacity-50 pointer-events-none">${placeholder}</span>` : '')
    }
  }, [value, textToHtml, placeholder])

  const handleInput = () => {
    if (!editorRef.current) return

    // Convert back from HTML to plain text
    // Emojis are stored as <img> tags with data-emoji attribute
    const html = editorRef.current.innerHTML

    // Simplified parser to get text content while preserving emoji characters
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    // Replace images with their Unicode representation before getting text
    const imgs = tempDiv.querySelectorAll('img[data-emoji]')
    imgs.forEach(img => {
      const emojiChar = img.getAttribute('data-emoji')
      if (emojiChar) {
        const textNode = document.createTextNode(emojiChar)
        img.parentNode?.replaceChild(textNode, img)
      }
    })

    // Handle line breaks (br tags to \n)
    const brs = tempDiv.querySelectorAll('br')
    brs.forEach(br => {
      br.parentNode?.replaceChild(document.createTextNode('\n'), br)
    })

    const newText = tempDiv.innerText || tempDiv.textContent || ''

    isInternalChange.current = true
    onChange(newText)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onEnter?.()
    }
  }

  const handlePasteEvent = (e: React.ClipboardEvent) => {
    // If native onPaste provided, use it
    if (onPaste) {
      onPaste(e)
    }

    // Default paste behavior for text: ensure it's plain text then transform
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertHTML', false, textToHtml(text))
  }

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePasteEvent}
      className={`outline-none overflow-y-auto break-words whitespace-pre-wrap ${className}`}
      style={{ maxHeight }}
      onFocus={(e) => {
        // Remove placeholder if it's there
        if (value === '' && placeholder) {
          editorRef.current!.innerHTML = ''
        }
      }}
      onBlur={(e) => {
        // Restore placeholder if empty
        if (value === '' && placeholder) {
          editorRef.current!.innerHTML = `<span class="text-tertiary opacity-50 pointer-events-none">${placeholder}</span>`
        }
      }}
    />
  )
}
