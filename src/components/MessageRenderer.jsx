import React, { useState, useCallback, useMemo } from 'react'
import './MessageRenderer.css'

/**
 * 简单的 Markdown 解析器
 * 支持：标题、粗体、斜体、代码块、行内代码、列表、链接
 */
function parseMarkdown(text) {
  if (!text) return []

  const lines = text.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeBlockContent = []
  let codeBlockLanguage = ''
  let listItems = []
  let inList = false

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push({ type: 'list', items: [...listItems], key: `list-${elements.length}` })
      listItems = []
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 代码块结束
    if (inCodeBlock && line.trim().startsWith('```')) {
      elements.push({
        type: 'code',
        language: codeBlockLanguage,
        content: codeBlockContent.join('\n'),
        key: `code-${elements.length}`
      })
      inCodeBlock = false
      codeBlockContent = []
      codeBlockLanguage = ''
      continue
    }

    // 代码块开始
    if (!inCodeBlock && line.trim().startsWith('```')) {
      flushList()
      inCodeBlock = true
      codeBlockLanguage = line.trim().slice(3).trim()
      continue
    }

    // 在代码块内
    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    // 空行
    if (line.trim() === '') {
      flushList()
      continue
    }

    // 标题
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headerMatch) {
      flushList()
      elements.push({
        type: 'heading',
        level: headerMatch[1].length,
        content: headerMatch[2],
        key: `heading-${elements.length}`
      })
      continue
    }

    // 列表项
    const listMatch = line.match(/^[\-\*\+]\s+(.+)$/)
    if (listMatch) {
      inList = true
      listItems.push(listMatch[1])
      continue
    }

    // 有序列表
    const orderedListMatch = line.match(/^\d+\.\s+(.+)$/)
    if (orderedListMatch) {
      inList = true
      listItems.push(orderedListMatch[1])
      continue
    }

    // 普通段落
    flushList()
    elements.push({
      type: 'paragraph',
      content: line,
      key: `para-${elements.length}`
    })
  }

  // 处理剩余的列表
  flushList()

  // 处理行内格式
  const processInline = (text) => {
    const parts = []
    let remaining = text
    let key = 0

    while (remaining.length > 0) {
      // 行内代码
      const codeMatch = remaining.match(/`([^`]+)`/)
      if (codeMatch) {
        const idx = remaining.indexOf(codeMatch[0])
        if (idx > 0) {
          parts.push({ type: 'text', content: remaining.slice(0, idx), key: `t-${key++}` })
        }
        parts.push({ type: 'inline-code', content: codeMatch[1], key: `c-${key++}` })
        remaining = remaining.slice(idx + codeMatch[0].length)
        continue
      }

      // 粗体
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
      if (boldMatch) {
        const idx = remaining.indexOf(boldMatch[0])
        if (idx > 0) {
          parts.push({ type: 'text', content: remaining.slice(0, idx), key: `t-${key++}` })
        }
        parts.push({ type: 'bold', content: boldMatch[1], key: `b-${key++}` })
        remaining = remaining.slice(idx + boldMatch[0].length)
        continue
      }

      // 斜体
      const italicMatch = remaining.match(/\*([^*]+)\*/)
      if (italicMatch) {
        const idx = remaining.indexOf(italicMatch[0])
        if (idx > 0) {
          parts.push({ type: 'text', content: remaining.slice(0, idx), key: `t-${key++}` })
        }
        parts.push({ type: 'italic', content: italicMatch[1], key: `i-${key++}` })
        remaining = remaining.slice(idx + italicMatch[0].length)
        continue
      }

      // 链接
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        const idx = remaining.indexOf(linkMatch[0])
        if (idx > 0) {
          parts.push({ type: 'text', content: remaining.slice(0, idx), key: `t-${key++}` })
        }
        parts.push({ 
          type: 'link', 
          text: linkMatch[1], 
          url: linkMatch[2], 
          key: `l-${key++}` 
        })
        remaining = remaining.slice(idx + linkMatch[0].length)
        continue
      }

      // 剩余文本
      parts.push({ type: 'text', content: remaining, key: `t-${key++}` })
      break
    }

    return parts
  }

  return elements.map(el => {
    if (el.type === 'paragraph' || el.type === 'heading') {
      return { ...el, inlineContent: processInline(el.content) }
    }
    if (el.type === 'list') {
      return { ...el, items: el.items.map(item => ({
        type: 'list-item',
        inlineContent: processInline(item),
        key: `li-${el.key}-${item}`
      })) }
    }
    return el
  })
}

/**
 * 代码块组件（带复制功能）
 */
function CodeBlock({ language, content }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [content])

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-language">{language || 'code'}</span>
        <button 
          className="copy-code-btn"
          onClick={handleCopy}
          title="复制代码"
        >
          {copied ? '✓ 已复制' : '📋 复制'}
        </button>
      </div>
      <pre className="code-block">
        <code>{content}</code>
      </pre>
    </div>
  )
}

/**
 * 行内元素渲染
 */
function InlineContent({ content }) {
  if (!content) return null

  return (
    <>
      {content.map((part, index) => {
        switch (part.type) {
          case 'bold':
            return <strong key={part.key}>{part.content}</strong>
          case 'italic':
            return <em key={part.key}>{part.content}</em>
          case 'inline-code':
            return <code key={part.key} className="inline-code">{part.content}</code>
          case 'link':
            return (
              <a 
                key={part.key} 
                href={part.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="markdown-link"
              >
                {part.text}
              </a>
            )
          default:
            return <span key={part.key}>{part.content}</span>
        }
      })}
    </>
  )
}

/**
 * 消息渲染器组件
 * 支持 Markdown 渲染和代码块高亮
 */
export function MessageRenderer({ content, type = 'text' }) {
  const elements = useMemo(() => {
    if (type === 'code') {
      return [{ type: 'code', language: 'text', content }]
    }
    return parseMarkdown(content)
  }, [content, type])

  return (
    <div className="message-renderer" data-testid="message-renderer">
      {elements.map((element, index) => {
        switch (element.type) {
          case 'heading':
            const HeadingTag = `h${element.level}`
            return (
              <HeadingTag key={element.key} className={`heading-${element.level}`}>
                <InlineContent content={element.inlineContent} />
              </HeadingTag>
            )
          
          case 'paragraph':
            return (
              <p key={element.key} className="markdown-paragraph">
                <InlineContent content={element.inlineContent} />
              </p>
            )
          
          case 'code':
            return <CodeBlock key={element.key} language={element.language} content={element.content} />
          
          case 'list':
            return (
              <ul key={element.key} className="markdown-list">
                {element.items.map((item, idx) => (
                  <li key={item.key}>
                    <InlineContent content={item.inlineContent} />
                  </li>
                ))}
              </ul>
            )
          
          default:
            return null
        }
      })}
    </div>
  )
}

/**
 * 纯文本消息组件（用于简单消息）
 */
export function PlainTextMessage({ content }) {
  return (
    <div className="plain-text-message">
      {content}
    </div>
  )
}

export default MessageRenderer
