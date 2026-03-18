import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppShell } from '../AppShell';

// Mock child components
vi.mock('../../components/DocumentEditor', () => ({
  DocumentEditor: () => <div data-testid="document-editor">Document Editor</div>,
}));

vi.mock('../../components/FileUpload', () => ({
  FileUpload: ({ onFileSelect, disabled }) => (
    <div data-testid="file-upload">
      <button
        onClick={() => onFileSelect?.({ name: 'test.docx', size: 1000, lastModified: Date.now() })}
        disabled={disabled}
      >
        Upload
      </button>
    </div>
  ),
}));

vi.mock('../../components/DualPanelLayout', () => ({
  DualPanelLayout: ({ leftPanel, rightPanel }) => (
    <div data-testid="dual-panel-layout">
      <div data-testid="left-panel-wrapper">{leftPanel}</div>
      <div data-testid="right-panel-wrapper">{rightPanel}</div>
    </div>
  ),
}));

vi.mock('../../components/ChatPanel', () => ({
  ChatPanel: () => <div data-testid="chat-panel-mock">Chat Panel</div>,
}));

vi.mock('../../domains/review/components/FindingsPanel', () => ({
  default: ({ findings, onSelectFinding }) => (
    <div data-testid="findings-panel">
      <span>Findings: {findings.length}</span>
      {findings.map((f) => (
        <button key={f.id} onClick={() => onSelectFinding?.(f)}>
          {f.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../domains/review/components/FindingDetail', () => ({
  default: ({ finding, onLocate }) => (
    <div data-testid="finding-detail">
      {finding ? <span>{finding.title}</span> : <span>No finding</span>}
      {finding && <button onClick={() => onLocate?.(finding.id)}>Locate</button>}
    </div>
  ),
}));

vi.mock('../../domains/report/components/ReportPreviewPanel', () => ({
  default: ({ report }) => (
    <div data-testid="report-preview-panel">
      {report ? <span>Report: {report.documentName}</span> : <span>No report</span>}
    </div>
  ),
}));

describe('AppShell', () => {
  const defaultProps = {
    document: null,
    findings: [],
    selectedFinding: null,
    report: null,
    isProcessing: false,
    onFileUpload: vi.fn(),
    onClearDocument: vi.fn(),
    onSelectFinding: vi.fn(),
    onFilterChange: vi.fn(),
    onLocateFinding: vi.fn(),
    onCopySuggestion: vi.fn(),
    onApplySuggestion: vi.fn(),
    onDismissFinding: vi.fn(),
    onAcceptFinding: vi.fn(),
    onExportReport: vi.fn(),
    onSendMessage: vi.fn(),
  };

  it('renders upload placeholder when no document', () => {
    render(<AppShell {...defaultProps} />);

    expect(screen.getByTestId('upload-placeholder')).toBeInTheDocument();
    expect(screen.getByText('上传采购文档')).toBeInTheDocument();
  });

  it('renders document container when document is provided', () => {
    const document = { name: 'test.docx', size: 1000 };
    render(<AppShell {...defaultProps} document={document} />);

    expect(screen.getByTestId('document-container')).toBeInTheDocument();
    expect(screen.getByText('test.docx')).toBeInTheDocument();
  });

  it('renders findings placeholder when no document', () => {
    render(<AppShell {...defaultProps} />);

    expect(screen.getByTestId('findings-placeholder')).toBeInTheDocument();
    expect(screen.getByText('审查结果')).toBeInTheDocument();
  });

  it('renders findings workspace when document is provided', () => {
    const document = { name: 'test.docx', size: 1000 };
    const findings = [
      { id: '1', title: 'Finding 1', severity: 'high' },
      { id: '2', title: 'Finding 2', severity: 'medium' },
    ];

    render(<AppShell {...defaultProps} document={document} findings={findings} />);

    expect(screen.getByTestId('findings-workspace')).toBeInTheDocument();
    expect(screen.getByText('Findings: 2')).toBeInTheDocument();
  });

  it('shows finding detail when finding is selected', () => {
    const document = { name: 'test.docx', size: 1000 };
    const findings = [{ id: '1', title: 'Test Finding', severity: 'high' }];
    const selectedFinding = findings[0];

    render(
      <AppShell
        {...defaultProps}
        document={document}
        findings={findings}
        selectedFinding={selectedFinding}
      />
    );

    expect(screen.getByTestId('finding-detail')).toBeInTheDocument();
    // Check that finding detail shows the finding title (within the detail component)
    const detail = screen.getByTestId('finding-detail');
    expect(detail.textContent).toContain('Test Finding');
  });

  it('calls onSelectFinding when finding is clicked', () => {
    const document = { name: 'test.docx', size: 1000 };
    const findings = [{ id: '1', title: 'Test Finding', severity: 'high' }];
    const onSelectFinding = vi.fn();

    render(
      <AppShell
        {...defaultProps}
        document={document}
        findings={findings}
        onSelectFinding={onSelectFinding}
      />
    );

    fireEvent.click(screen.getByText('Test Finding'));
    expect(onSelectFinding).toHaveBeenCalledWith(findings[0]);
  });

  it('calls onClearDocument when clear button is clicked', () => {
    const document = { name: 'test.docx', size: 1000 };
    const onClearDocument = vi.fn();

    render(
      <AppShell {...defaultProps} document={document} onClearDocument={onClearDocument} />
    );

    fireEvent.click(screen.getByTitle('清除文档'));
    expect(onClearDocument).toHaveBeenCalled();
  });

  it('shows toolbar buttons when document is present', () => {
    const document = { name: 'test.docx', size: 1000 };
    render(<AppShell {...defaultProps} document={document} />);

    expect(screen.getByText('📜 规则')).toBeInTheDocument();
    expect(screen.getByText('📊 报告')).toBeInTheDocument();
    expect(screen.getByText('💬 助手')).toBeInTheDocument();
  });

  it('toggles chat panel when chat button is clicked', () => {
    const document = { name: 'test.docx', size: 1000 };
    render(<AppShell {...defaultProps} document={document} />);

    const chatButton = screen.getByText('💬 助手');
    fireEvent.click(chatButton);

    expect(screen.getByTestId('chat-auxiliary-panel')).toBeInTheDocument();
  });

  it('opens report drawer when report button is clicked', () => {
    const document = { name: 'test.docx', size: 1000 };
    render(<AppShell {...defaultProps} document={document} />);

    const reportButton = screen.getByText('📊 报告');
    fireEvent.click(reportButton);

    expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument();
  });

  it('closes drawer when close button is clicked', () => {
    const document = { name: 'test.docx', size: 1000 };
    render(<AppShell {...defaultProps} document={document} />);

    // Open drawer
    fireEvent.click(screen.getByText('📊 报告'));
    expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument();

    // Close drawer
    fireEvent.click(screen.getByTitle('关闭'));
    expect(screen.queryByTestId('drawer-overlay')).not.toBeInTheDocument();
  });

  it('displays document status with findings count', () => {
    const document = { name: 'test.docx', size: 1000 };
    const findings = [
      { id: '1', title: 'Finding 1', severity: 'high' },
      { id: '2', title: 'Finding 2', severity: 'medium' },
    ];

    render(<AppShell {...defaultProps} document={document} findings={findings} />);

    expect(screen.getByText('2 个发现')).toBeInTheDocument();
  });

  it('calls onLocateFinding when locate button is clicked', () => {
    const document = { name: 'test.docx', size: 1000 };
    const findings = [{ id: '1', title: 'Test Finding', severity: 'high' }];
    const selectedFinding = findings[0];
    const onLocateFinding = vi.fn();

    render(
      <AppShell
        {...defaultProps}
        document={document}
        findings={findings}
        selectedFinding={selectedFinding}
        onLocateFinding={onLocateFinding}
      />
    );

    fireEvent.click(screen.getByText('Locate'));
    expect(onLocateFinding).toHaveBeenCalledWith('1');
  });

  it('renders app shell with correct structure', () => {
    render(<AppShell {...defaultProps} />);

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(screen.getByTestId('app-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('dual-panel-layout')).toBeInTheDocument();
  });

  it('shows correct title in toolbar', () => {
    render(<AppShell {...defaultProps} />);

    expect(screen.getByText('📝 采购文档审查')).toBeInTheDocument();
  });
});
