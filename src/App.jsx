import React, { useState, useCallback } from 'react';
import { AppShell } from './app/AppShell';
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

  // Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    setIsProcessing(true);
    try {
      console.log('File uploaded:', file);
      setDocument({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        // TODO: Add actual document content parsing
      });
      // Clear previous findings when new document is uploaded
      setFindings([]);
      setSelectedFinding(null);
      setReport(null);
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

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
