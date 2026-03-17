import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '@superdoc-dev/react/style.css'

// ============ 性能监控 ============
// 记录页面加载性能
if (typeof performance !== 'undefined') {
  window.addEventListener('load', () => {
    // 使用 requestIdleCallback 在非阻塞时上报
    requestIdleCallback(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      if (navigation) {
        const metrics = {
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnection: navigation.connectEnd - navigation.connectStart,
          tlsHandshake: navigation.secureConnectionStart ? 
            navigation.connectEnd - navigation.secureConnectionStart : 0,
          ttfb: navigation.responseStart - navigation.requestStart,
          contentDownload: navigation.responseEnd - navigation.responseStart,
          domProcessing: navigation.domContentLoadedEventEnd - navigation.domLoading,
          pageLoad: navigation.loadEventEnd - navigation.navigationStart
        }
        
        console.log('📊 页面加载性能:', metrics)
        
        // 可以在这里上报到分析服务
        // analytics.track('page-load', metrics)
      }
    })
  })
}

// ============ 错误监控 ============
window.addEventListener('error', (event) => {
  console.error('全局错误:', {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    error: event.error
  })
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason)
})

// ============ 渲染应用 ============
const rootElement = document.getElementById('root')

if (rootElement) {
  // 使用并发模式渲染
  const root = ReactDOM.createRoot(rootElement)
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  
  // 预加载关键资源
  preloadCriticalResources()
} else {
  console.error('未找到 root 元素')
}

// ============ 资源预加载 ============
function preloadCriticalResources() {
  // 预加载关键组件
  const criticalComponents = [
    '/src/components/DocumentEditor.jsx',
    '/src/components/ChatPanel.jsx'
  ]
  
  // 使用 link preload
  criticalComponents.forEach(path => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'script'
    link.href = path
    document.head.appendChild(link)
  })
  
  // 预连接 API 服务器
  const apiServers = [
    'https://coding.dashscope.aliyuncs.com',
    'https://anyrouter.top'
  ]
  
  apiServers.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = url
    document.head.appendChild(link)
  })
}

// ============ Service Worker 注册（可选） ============
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker 注册成功:', registration.scope)
      })
      .catch(error => {
        console.log('Service Worker 注册失败:', error)
      })
  })
}
