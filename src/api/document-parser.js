/**
 * Document Parser - Parse DOCX content into structured segments
 * Converts extracted text into segments that can be analyzed by the review orchestrator
 */

/**
 * Parses extracted document text into structured segments
 * @param {string} textContent - Raw text content extracted from DOCX
 * @returns {Array} Array of structured segments
 */
export function parseDocumentContent(textContent) {
  if (!textContent || typeof textContent !== 'string') {
    return []
  }

  // Split content into lines for processing
  const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  const segments = []
  let currentParagraph = ''
  let segmentId = 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Detect headings (lines starting with # or other heading patterns)
    if (line.startsWith('#')) {
      // If there's a pending paragraph, save it first
      if (currentParagraph) {
        segments.push({
          id: `seg-${segmentId++}`,
          type: 'paragraph',
          text: currentParagraph.trim(),
          position: segments.length
        })
        currentParagraph = ''
      }
      
      // Count heading level
      const headingLevel = line.match(/^#+/)?.[0].length || 1
      const headingText = line.replace(/^#+\s*/, '')
      
      segments.push({
        id: `seg-${segmentId++}`,
        type: 'heading',
        level: Math.min(headingLevel, 6), // Limit to h1-h6
        text: headingText,
        position: segments.length
      })
    } 
    // Detect list items (starting with -, *, or numbered)
    else if (line.match(/^[\-\*\d\.]+\s+/)) {
      // If there's a pending paragraph, save it first
      if (currentParagraph) {
        segments.push({
          id: `seg-${segmentId++}`,
          type: 'paragraph',
          text: currentParagraph.trim(),
          position: segments.length
        })
        currentParagraph = ''
      }
      
      segments.push({
        id: `seg-${segmentId++}`,
        type: 'list_item',
        text: line,
        position: segments.length
      })
    }
    // Regular paragraph content
    else {
      if (currentParagraph) {
        currentParagraph += ' ' + line
      } else {
        currentParagraph = line
      }
    }
  }
  
  // Don't forget the last paragraph if it exists
  if (currentParagraph) {
    segments.push({
      id: `seg-${segmentId++}`,
      type: 'paragraph',
      text: currentParagraph.trim(),
      position: segments.length
    })
  }

  return segments
}

/**
 * Enhanced document parser that handles more complex structures
 * @param {string} textContent - Raw text content extracted from DOCX
 * @returns {Object} Document object with metadata and segments
 */
export function parseDocumentWithMetadata(textContent) {
  const segments = parseDocumentContent(textContent)
  
  // Calculate basic document metrics
  const wordCount = segments.reduce((count, segment) => {
    return count + (segment.text?.split(/\s+/).length || 0)
  }, 0)
  
  const charCount = segments.reduce((count, segment) => {
    return count + (segment.text?.length || 0)
  }, 0)
  
  const headingCount = segments.filter(segment => segment.type === 'heading').length
  const paragraphCount = segments.filter(segment => segment.type === 'paragraph').length
  const listItemCount = segments.filter(segment => segment.type === 'list_item').length
  
  return {
    id: `doc-${Date.now()}`,
    segments,
    metadata: {
      wordCount,
      charCount,
      headingCount,
      paragraphCount,
      listItemCount,
      createdAt: new Date().toISOString(),
      segmentCount: segments.length
    }
  }
}

/**
 * Parse a file object into structured document format
 * @param {File} file - The uploaded DOCX file
 * @returns {Promise<Object>} Parsed document with segments
 */
export async function parseFileToDocument(file) {
  if (!file) {
    throw new Error('File is required')
  }
  
  // Import extractTextFromDocx dynamically to avoid circular dependencies
  const { extractTextFromDocx } = await import('./docx-utils.js')
  
  // Extract text content from the file
  const textContent = await extractTextFromDocx(file)
  
  // Parse the content into structured format
  return parseDocumentWithMetadata(textContent)
}