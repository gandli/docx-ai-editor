/**
 * WebMCP Integration Utilities for DOCX-AI-Editor
 * 
 * This module provides utilities for testing WebMCP (Web Model Context Protocol) 
 * integration in the DOCX-AI-Editor application.
 */

/**
 * Checks if WebMCP is available in the current browser context
 * @returns {Promise<boolean>} True if WebMCP is available, false otherwise
 */
async function isWebMCPAvailable() {
  return typeof window !== 'undefined' && 
         window.navigator && 
         window.navigator.modelContext &&
         typeof window.navigator.modelContext.request === 'function';
}

/**
 * Discovers available WebMCP tools
 * @returns {Promise<Array>} Array of available tools
 */
async function discoverWebMCPTools() {
  if (!await isWebMCPAvailable()) {
    throw new Error('WebMCP is not available in this context');
  }

  try {
    const response = await window.navigator.modelContext.request({
      type: 'list-tools'
    });
    return response.tools || response.available_tools || [];
  } catch (error) {
    console.error('Error discovering WebMCP tools:', error);
    return [];
  }
}

/**
 * Invokes a WebMCP tool
 * @param {string} toolName - Name of the tool to invoke
 * @param {Object} parameters - Parameters for the tool
 * @returns {Promise<any>} Result of the tool invocation
 */
async function invokeWebMCPTool(toolName, parameters = {}) {
  if (!await isWebMCPAvailable()) {
    throw new Error('WebMCP is not available in this context');
  }

  try {
    const response = await window.navigator.modelContext.request({
      type: 'tool-call',
      name: toolName,
      arguments: parameters
    });
    return response;
  } catch (error) {
    console.error(`Error invoking WebMCP tool ${toolName}:`, error);
    return { error: error.message };
  }
}

/**
 * Gets WebMCP capabilities
 * @returns {Promise<Object>} Object containing WebMCP capabilities
 */
async function getWebMCPCapabilities() {
  if (!await isWebMCPAvailable()) {
    return { available: false };
  }

  try {
    const capabilities = await window.navigator.modelContext.request({
      type: 'capabilities'
    });
    return { available: true, ...capabilities };
  } catch (error) {
    console.error('Error getting WebMCP capabilities:', error);
    return { available: true, error: error.message };
  }
}

/**
 * Sends a message through WebMCP for AI processing
 * @param {string} message - Message to send
 * @param {Object} options - Additional options for the request
 * @returns {Promise<any>} Response from the WebMCP service
 */
async function sendWebMCPMessage(message, options = {}) {
  if (!await isWebMCPAvailable()) {
    throw new Error('WebMCP is not available in this context');
  }

  try {
    const response = await window.navigator.modelContext.request({
      type: 'chat',
      message: message,
      ...options
    });
    return response;
  } catch (error) {
    console.error('Error sending WebMCP message:', error);
    return { error: error.message };
  }
}

/**
 * Validates if the current document can be processed via WebMCP
 * @param {Object} document - Document object to validate
 * @returns {Promise<boolean>} True if document can be processed via WebMCP
 */
async function canProcessDocumentViaWebMCP(document) {
  if (!await isWebMCPAvailable()) {
    return false;
  }

  try {
    // Check if there's a document processing tool available
    const tools = await discoverWebMCPTools();
    const hasDocumentProcessor = tools.some(tool => 
      tool.name.includes('document') || 
      tool.name.includes('parse') || 
      tool.name.includes('analyze')
    );
    
    return hasDocumentProcessor;
  } catch (error) {
    console.error('Error checking document processing capability:', error);
    return false;
  }
}

/**
 * Processes a document using WebMCP tools
 * @param {Object} document - Document object to process
 * @param {string} task - Task to perform on the document
 * @returns {Promise<any>} Result of the document processing
 */
async function processDocumentViaWebMCP(document, task = 'analyze') {
  if (!await canProcessDocumentViaWebMCP(document)) {
    throw new Error('Document cannot be processed via WebMCP');
  }

  try {
    const tools = await discoverWebMCPTools();
    
    // Find the most appropriate tool for document processing
    let toolName = null;
    if (task === 'analyze') {
      toolName = tools.find(t => t.name.includes('analyze'))?.name || 
                 tools.find(t => t.name.includes('document'))?.name ||
                 tools.find(t => t.name.includes('review'))?.name;
    } else if (task === 'parse') {
      toolName = tools.find(t => t.name.includes('parse'))?.name;
    }
    
    if (!toolName) {
      throw new Error('No suitable WebMCP tool found for document processing');
    }

    const response = await invokeWebMCPTool(toolName, {
      document: document,
      task: task,
      format: 'structured'
    });

    return response;
  } catch (error) {
    console.error('Error processing document via WebMCP:', error);
    return { error: error.message };
  }
}

export {
  isWebMCPAvailable,
  discoverWebMCPTools,
  invokeWebMCPTool,
  getWebMCPCapabilities,
  sendWebMCPMessage,
  canProcessDocumentViaWebMCP,
  processDocumentViaWebMCP
};

/**
 * WebMCP Mock Implementation for Testing
 * 
 * This provides a mock implementation of WebMCP for testing purposes
 * when the real WebMCP API is not available.
 */
export const WebMCPMock = {
  available: true,
  
  async request(request) {
    console.log('WebMCP Mock Request:', request);
    
    switch (request.type) {
      case 'list-tools':
        return {
          tools: [
            {
              name: 'document-analyzer',
              description: 'Analyzes documents for issues and recommendations',
              parameters: {
                document: { type: 'string', description: 'Document content to analyze' },
                task: { type: 'string', description: 'Task to perform' }
              }
            },
            {
              name: 'procurement-reviewer',
              description: 'Reviews procurement documents specifically',
              parameters: {
                document: { type: 'string', description: 'Document to review' },
                criteria: { type: 'array', description: 'Review criteria' }
              }
            }
          ]
        };
      
      case 'tool-call':
        if (request.name === 'document-analyzer') {
          return {
            status: 'success',
            results: [
              { type: 'compliance', issue: 'Missing approval signature', severity: 'high' },
              { type: 'budget', issue: 'Budget section incomplete', severity: 'medium' }
            ]
          };
        } else if (request.name === 'procurement-reviewer') {
          return {
            status: 'success',
            findings: [
              { category: 'timeline', issue: 'Missing milestone dates', recommendation: 'Add specific dates' }
            ]
          };
        }
        return { status: 'unknown-tool' };
      
      case 'chat':
        return {
          response: `Mock response to: ${request.message}`,
          sources: ['mock-data']
        };
      
      case 'capabilities':
        return {
          version: '1.0.0',
          supported_types: ['text', 'document'],
          available_features: ['tools', 'chat', 'analysis']
        };
      
      default:
        return { error: 'Unknown request type' };
    }
  }
};