import React, { useState, useCallback } from 'react';
import { DualPanelLayout } from '../components/DualPanelLayout';
import { DocumentEditor } from '../components/DocumentEditor';
import { FileUpload } from '../components/FileUpload';
import FindingsPanel from '../domains/review/components/FindingsPanel';
import FindingDetail from '../domains/review/components/FindingDetail';
import ReportPreviewPanel from '../domains/report/components/ReportPreviewPanel';
import { ChatPanel } from '../components/ChatPanel';
import './AppShell.css';

/**
 * AppShell - Main application shell for procurement review workflow
 * Layout: Document (left) | Findings (right) with auxiliary chat and secondary drawers
 */
export function AppShell({
  document,
  findings = [],
  selectedFinding = null,
  report = null,
  isProcessing = false,
  onFileUpload,
  onClearDocument,
  onSelectFinding,
  onFilterChange,
  onLocateFinding,
  onCopySuggestion,
  onApplySuggestion,
  onDismissFinding,
  onAcceptFinding,
  onExportReport,
  onSendMessage,
}) {
  // Drawer states
  const [activeDrawer, setActiveDrawer] = useState(null); // 'report', 'rules', or null
  const [showChat, setShowChat] = useState(false);

  // Toggle drawer
  const toggleDrawer = useCallback((drawerName) => {
    setActiveDrawer((current) => (current === drawerName ? null : drawerName));
  }, []);

  // Toggle chat panel
  const toggleChat = useCallback(() => {
    setShowChat((prev) => !prev);
  }, []);

  // Handle finding selection with locate callback
  const handleSelectFinding = useCallback((finding) => {
    onSelectFinding?.(finding);
    if (finding && onLocateFinding) {
      onLocateFinding(finding);
    }
  }, [onSelectFinding, onLocateFinding]);

  // Render left panel content (Document)
  const renderDocumentPanel = () => {
    return (
      <div className="document-container" data-testid="document-container">
        {!document ? (
          <div className="upload-placeholder" data-testid="upload-placeholder">
            <FileUpload onFileSelect={onFileUpload} disabled={isProcessing} />
            <div className="upload-info">
              <h3>上传采购文档</h3>
              <p>支持 .docx 格式文件</p>
              <p className="upload-tip">💡 上传后可进行智能审查</p>
            </div>
          </div>
        ) : (
          <>
            <div className="document-info">
              <span className="document-name">{document.name}</span>
              <div className="document-actions">
                <button
                  className={`action-btn ${showChat ? 'active' : ''}`}
                  onClick={toggleChat}
                  title={showChat ? '隐藏聊天' : '显示聊天'}
                >
                  💬
                </button>
                <button
                  className="clear-doc-btn"
                  onClick={onClearDocument}
                  title="清除文档"
                >
                  ✕
                </button>
              </div>
            </div>
            <DocumentEditor document={document} disabled={isProcessing} />
          </>
        )}
      </div>
    );
  };

  // Render right panel content (Findings)
  const renderFindingsPanel = () => {
    return (
      <div className="findings-workspace" data-testid="findings-workspace">
        {/* Findings List */}
        <div className="findings-list-container">
          <FindingsPanel
            findings={findings}
            selectedFinding={selectedFinding}
            onSelectFinding={handleSelectFinding}
            onFilterChange={onFilterChange}
          />
        </div>

        {/* Finding Detail */}
        {selectedFinding && (
          <div className="finding-detail-container">
            <FindingDetail
              finding={selectedFinding}
              onLocate={onLocateFinding}
              onCopySuggestion={onCopySuggestion}
              onApply={onApplySuggestion}
              onDismiss={onDismissFinding}
              onAccept={onAcceptFinding}
            />
          </div>
        )}

        {/* Show empty state only when no document and no findings exist */}
        {!document && findings.length === 0 && !selectedFinding && (
          <div className="findings-placeholder" data-testid="findings-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">📋</div>
              <h3>审查结果</h3>
              <p>上传文档后将显示审查结果</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render drawer content
  const renderDrawer = () => {
    if (!activeDrawer) return null;

    return (
      <div className="drawer-overlay" data-testid="drawer-overlay">
        <div className="drawer-container">
          <div className="drawer-header">
            <h3>
              {activeDrawer === 'report' && '📊 审查报告'}
              {activeDrawer === 'rules' && '📜 规则配置'}
            </h3>
            <button
              className="drawer-close-btn"
              onClick={() => setActiveDrawer(null)}
              title="关闭"
            >
              ✕
            </button>
          </div>
          <div className="drawer-content">
            {activeDrawer === 'report' && (
              <ReportPreviewPanel report={report} onExport={onExportReport} />
            )}
            {activeDrawer === 'rules' && (
              <div className="rules-placeholder">
                <p>规则配置面板</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render auxiliary chat panel
  const renderChatPanel = () => {
    if (!showChat || !document) return null;

    return (
      <div
        className="chat-auxiliary-panel"
        data-testid="chat-auxiliary-panel"
      >
        <div className="chat-panel-header">
          <span>AI 助手</span>
          <button
            className="chat-collapse-btn"
            onClick={toggleChat}
            title="关闭聊天"
          >
            ✕
          </button>
        </div>
        <div className="chat-panel-content">
          <ChatPanel
            onSendMessage={onSendMessage}
            isLoading={isProcessing}
            disabled={!document}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="app-shell" data-testid="app-shell">
      {/* Toolbar */}
      <header className="app-toolbar" data-testid="app-toolbar">
        <div className="toolbar-content">
          <div className="toolbar-left">
            <h1 className="app-title">📝 采购文档审查</h1>
            {document && (
              <span className="document-status">
                {findings.length > 0 ? `${findings.length} 个发现` : '就绪'}
              </span>
            )}
          </div>
          <div className="toolbar-right">
            {document && (
              <>
                <button
                  className={`toolbar-btn ${activeDrawer === 'rules' ? 'active' : ''}`}
                  onClick={() => toggleDrawer('rules')}
                  title="规则配置"
                >
                  📜 规则
                </button>
                <button
                  className={`toolbar-btn ${activeDrawer === 'report' ? 'active' : ''}`}
                  onClick={() => toggleDrawer('report')}
                  title="审查报告"
                >
                  📊 报告
                </button>
                <button
                  className={`toolbar-btn ${showChat ? 'active' : ''}`}
                  onClick={toggleChat}
                  title="AI 助手"
                >
                  💬 助手
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        <DualPanelLayout
          leftPanel={renderDocumentPanel()}
          rightPanel={renderFindingsPanel()}
          leftMinWidth={320}
          rightMinWidth={280}
          initialLeftWidth={55}
        />

        {/* Auxiliary Chat Panel */}
        {renderChatPanel()}

        {/* Secondary Drawers */}
        {renderDrawer()}
      </main>
    </div>
  );
}

export default AppShell;
