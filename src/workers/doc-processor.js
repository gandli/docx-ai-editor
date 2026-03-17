/**
 * 文档处理 Web Worker
 * 在后台线程处理大文档，避免阻塞主线程
 */

self.onmessage = async function(e) {
  const { file, operation = 'extract' } = e.data
  
  try {
    let result
    
    switch (operation) {
      case 'extract':
        result = await extractTextFromDocx(file)
        break
      case 'analyze':
        result = await analyzeDocumentStructure(file)
        break
      case 'chunk':
        result = await chunkDocument(file)
        break
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
    
    self.postMessage({ success: true, data: result })
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error.message 
    })
  }
}

// 从 DOCX 提取文本
async function extractTextFromDocx(file) {
  // 使用 JSZip 或其他库在 worker 中处理
  // 这里简化处理
  const arrayBuffer = await readFileAsArrayBuffer(file)
  
  // 模拟处理延迟
  await sleep(10)
  
  return {
    text: 'Document content extracted',
    wordCount: arrayBuffer.byteLength / 2,
    processedAt: Date.now()
  }
}

// 分析文档结构
async function analyzeDocumentStructure(file) {
  const arrayBuffer = await readFileAsArrayBuffer(file)
  
  // 模拟分析
  await sleep(20)
  
  return {
    sections: 1,
    paragraphs: 10,
    images: 0,
    tables: 0
  }
}

// 分块处理文档
async function chunkDocument(file, chunkSize = 1024 * 1024) {
  const chunks = []
  let offset = 0
  
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize)
    const buffer = await chunk.arrayBuffer()
    chunks.push({
      offset,
      size: buffer.byteLength,
      data: buffer
    })
    offset += chunkSize
    
    // 定期报告进度
    if (offset % (chunkSize * 5) === 0) {
      self.postMessage({ 
        type: 'progress', 
        progress: (offset / file.size) * 100 
      })
    }
  }
  
  return { chunks, totalChunks: chunks.length }
}

// 辅助函数
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
