import React, { useState, useCallback, useEffect } from 'react';
import { AppShell } from './app/AppShell';
import { runReviewSession } from './domains/review/services/review-orchestrator';
import { parseFileToDocument } from './api/document-parser';
import { defaultRules } from './domains/review/model/review-models';
import { analyzeDocument, isApiKeyConfigured } from './api/llm';
import { isWebMCPAvailable, discoverWebMCPTools, invokeWebMCPTool } from './utils/webmcp-utils';
import './App.css';

/**
 * DOCX AI Editor - Procurement Review Workspace
 * Main entry point that delegates to AppShell for the review workflow
 */
function App() {
  const [document, setDocument] = useState(null);
  const [findings, setFindings] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [report, setReport] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [webMCPEnabled, setWebMCPEnabled] = useState(false);
  const [webMCPTools, setWebMCPTools] = useState([]);

  // Initialize WebMCP support
  useEffect(() => {
    const initWebMCP = async () => {
      const available = await isWebMCPAvailable();
      setWebMCPEnabled(available);
      
      if (available) {
        try {
          const tools = await discoverWebMCPTools();
          setWebMCPTools(tools);
          console.log('WebMCP initialized with tools:', tools);
        } catch (error) {
          console.error('Error discovering WebMCP tools:', error);
        }
      } else {
        console.log('WebMCP not available in this environment');
      }
    };

    initWebMCP();
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    setIsProcessing(true);
    try {
      console.log('File uploaded:', file);
      
      // Parse the document into structured format with segments
      const parsedDocument = await parseFileToDocument(file);
      
      // Update document state with parsed content
      setDocument({
        ...parsedDocument,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      });
      
      // Clear previous findings when new document is uploaded
      setFindings([]);
      setSelectedFinding(null);
      setReport(null);
      
      // Determine if we should use mock mode based on API key configuration
      const useMockMode = !isApiKeyConfigured();
      
      // Check if WebMCP is available and preferred for this operation
      let reviewResult;
      if (webMCPEnabled && useMockMode) {
        // If WebMCP is available and we're in mock mode, consider using WebMCP
        try {
          // Check if there's a document review tool available via WebMCP
          const hasReviewTool = webMCPTools.some(tool => 
            tool.name.includes('review') || tool.name.includes('analyze')
          );
          
          if (hasReviewTool) {
            console.log('Using WebMCP for document review');
            // Find and use the review tool
            const reviewTool = webMCPTools.find(tool => 
              tool.name.includes('review') || tool.name.includes('analyze')
            );
            
            if (reviewTool) {
              const webMCPResult = await invokeWebMCPTool(reviewTool.name, {
                document: parsedDocument,
                task: 'procurement-document-review',
                criteria: defaultRules
              });
              
              // Transform WebMCP result to match our expected format
              reviewResult = {
                findings: webMCPResult.results || webMCPResult.findings || []
              };
            }
          }
        } catch (webMCPError) {
          console.warn('WebMCP review failed, falling back to standard method:', webMCPError);
        }
      }
      
      // If WebMCP wasn't used or failed, use the standard method
      if (!reviewResult) {
        // Now run the review session with the parsed document
        console.log('Running review session...', { useMockMode });
        reviewResult = await runReviewSession({
          document: parsedDocument,
          rules: defaultRules,
          useMock: useMockMode,
          aiReviewer: async (doc, mockMode = useMockMode) => {
            // Use the analyzeDocument function to get AI review
            // Pass the mockMode flag to determine whether to use mock implementation
            const aiResponse = await analyzeDocument(file, '请审查此文档并指出任何问题或改进建议', undefined, mockMode);
            return aiResponse;
          }
        });
      }
      
      console.log('Review completed:', reviewResult);
      setFindings(reviewResult.findings);
      
    } catch (error) {
      console.error('File upload or processing error:', error);
      // Show a user-friendly error message in the UI
      setFindings([{
        id: 'error-finding',
        type: 'system_error',
        severity: 'high',
        title: '文档处理失败',
        description: `处理文档时发生错误: ${error.message || '未知错误'}`,
        suggestions: [
          '请检查文件格式是否正确',
          '确保您已配置有效的AI API密钥',
          '如需离线使用，请注意当前为模拟模式'
        ],
        context: '文档处理',
        status: 'open',
        category: 'system',
        priority: 2
      }]);
      setSelectedFinding(null);
      setReport(null);
    } finally {
      setIsProcessing(false);
    }
  }, [webMCPEnabled, webMCPTools]);

  // Clear document
  const handleClearDocument = useCallback(() => {
    setDocument(null);
    setFindings([]);
    setSelectedFinding(null);
    setReport(null);
  }, []);

  // Select a finding
  const handleSelectFinding = useCallback((finding) => {
    setSelectedFinding(finding);
  }, []);

  // Filter change handler
  const handleFilterChange = useCallback((filters) => {
    console.log('Filter changed:', filters);
    // TODO: Implement filter logic
  }, []);

  // Locate finding in document
  const handleLocateFinding = useCallback((finding) => {
    console.log('Locate finding:', finding);
    // TODO: Implement document navigation to finding location
  }, []);

  // Copy suggestion
  const handleCopySuggestion = useCallback((suggestion) => {
    if (suggestion) {
      navigator.clipboard.writeText(suggestion);
    }
  }, []);

  // Apply suggestion
  const handleApplySuggestion = useCallback((findingId) => {
    console.log('Apply suggestion for finding:', findingId);
    // TODO: Implement suggestion application
  }, []);

  // Dismiss finding
  const handleDismissFinding = useCallback((findingId) => {
    setFindings((prev) =>
      prev.map((f) =>
        f.id === findingId ? { ...f, status: 'dismissed' } : f
      )
    );
    if (selectedFinding?.id === findingId) {
      setSelectedFinding(null);
    }
  }, [selectedFinding]);

  // Accept finding
  const handleAcceptFinding = useCallback((findingId) => {
    setFindings((prev) =>
      prev.map((f) =>
        f.id === findingId ? { ...f, status: 'accepted' } : f
      )
    );
  }, []);

  // Export report
  const handleExportReport = useCallback(({ includeDismissed }) => {
    console.log('Export report:', { includeDismissed });
    // TODO: Implement report export
  }, []);

  // Send message to AI
  const handleSendMessage = useCallback(async (message) => {
    if (!document) {
      return '请先上传文档';
    }

    setIsProcessing(true);
    try {
      // TODO: Connect to actual AI service
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return `收到您的消息：${message}\n\n这是一个示例响应。请配置实际的 AI 服务来获取真实响应。`;
    } catch (error) {
      console.error('AI response error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [document]);

  return (
    <div className="app" data-testid="app">
      <AppShell
        document={document}
        findings={findings}
        selectedFinding={selectedFinding}
        report={report}
        isProcessing={isProcessing}
        onFileUpload={handleFileUpload}
        onClearDocument={handleClearDocument}
        onSelectFinding={handleSelectFinding}
        onFilterChange={handleFilterChange}
        onLocateFinding={handleLocateFinding}
        onCopySuggestion={handleCopySuggestion}
        onApplySuggestion={handleApplySuggestion}
        onDismissFinding={handleDismissFinding}
        onAcceptFinding={handleAcceptFinding}
        onExportReport={handleExportReport}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default App;