import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportPreviewPanel from '../ReportPreviewPanel';

const createMockReport = (overrides = {}) => ({
  documentId: 'doc-123',
  documentName: '采购档案-2024-001.docx',
  status: 'completed',
  findings: [
    {
      id: 'finding-1',
      title: 'Missing budget section',
      description: 'Document lacks required budget information',
      severity: 'high',
      status: 'open',
      sourceType: 'system_rule',
      category: 'compliance',
      location: 'section-3',
      evidence: ['Evidence A'],
    },
    {
      id: 'finding-2',
      title: 'Incomplete vendor info',
      description: 'Vendor contact information is incomplete',
      severity: 'medium',
      status: 'open',
      sourceType: 'ai_review',
      category: 'completeness',
      location: 'section-5',
      evidence: ['Evidence B'],
    },
    {
      id: 'finding-3',
      title: 'Critical approval missing',
      description: 'Required approval signature not found',
      severity: 'critical',
      status: 'open',
      sourceType: 'hybrid',
      category: 'approval',
      location: 'section-1',
      evidence: ['Evidence C'],
    },
    {
      id: 'finding-4',
      title: 'Minor formatting issue',
      description: 'Header formatting is inconsistent',
      severity: 'low',
      status: 'dismissed',
      sourceType: 'ai_review',
      category: 'formatting',
      location: 'section-2',
      evidence: ['Evidence D'],
    },
  ],
  summary: {
    totalFindings: 4,
    openFindings: 3,
    dismissedFindings: 1,
    bySeverity: { critical: 1, high: 1, medium: 1, low: 1 },
    byStatus: { open: 3, in_progress: 0, resolved: 0, dismissed: 1 },
  },
  highRiskFindings: [
    {
      id: 'finding-3',
      title: 'Critical approval missing',
      description: 'Required approval signature not found',
      severity: 'critical',
      status: 'open',
      sourceType: 'hybrid',
      category: 'approval',
      location: 'section-1',
      evidence: ['Evidence C'],
    },
    {
      id: 'finding-1',
      title: 'Missing budget section',
      description: 'Document lacks required budget information',
      severity: 'high',
      status: 'open',
      sourceType: 'system_rule',
      category: 'compliance',
      location: 'section-3',
      evidence: ['Evidence A'],
    },
  ],
  ruleSets: [
    { id: 'ruleset-1', name: '采购合规规则集', source: 'system', rules: [{ id: 'rule-1' }, { id: 'rule-2' }] },
  ],
  metadata: { ruleSourceCounts: { system: 1, user: 0 }, totalRules: 2 },
  generatedAt: '2024-03-18T10:00:00Z',
  completedAt: '2024-03-18T10:05:00Z',
  ...overrides,
});

describe('ReportPreviewPanel', () => {
  const defaultProps = { report: null, onExport: () => {} };

  describe('summary stats rendering', () => {
    it('renders empty state when no report is provided', () => {
      render(<ReportPreviewPanel {...defaultProps} />);
      expect(screen.getByText('No report available')).toBeInTheDocument();
      expect(screen.getByText('Run a review to generate a report')).toBeInTheDocument();
    });

    it('renders document name in header', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      expect(screen.getByText('采购档案-2024-001.docx')).toBeInTheDocument();
    });

    it('renders total findings count', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      const totalStat = screen.getByTestId('stat-total');
      expect(totalStat).toHaveTextContent('4');
      expect(totalStat).toHaveTextContent('Total Findings');
    });

    it('renders open findings count', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      const openStat = screen.getByTestId('stat-open');
      expect(openStat).toHaveTextContent('3');
      expect(openStat).toHaveTextContent('Open');
    });

    it('renders severity breakdown', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      // Severity labels appear multiple times (in breakdown and badges), use getAllByText
      expect(screen.getAllByText('Critical').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('High').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Medium').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Low').length).toBeGreaterThanOrEqual(1);
    });

    it('renders rule metadata', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      expect(screen.getByText('Rules Applied')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('high-risk section rendering', () => {
    it('renders high-risk findings section', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      expect(screen.getByText('High Risk Findings')).toBeInTheDocument();
    });

    it('renders high-risk finding titles', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      // Titles appear in both high-risk and all findings sections
      expect(screen.getAllByText('Critical approval missing').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Missing budget section').length).toBeGreaterThanOrEqual(1);
    });

    it('renders high-risk finding descriptions', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      // Use getAllByText since descriptions appear in both high-risk and all findings sections
      expect(screen.getAllByText('Required approval signature not found').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Document lacks required budget information').length).toBeGreaterThanOrEqual(1);
    });

    it('renders message when no high-risk findings exist', () => {
      const report = createMockReport({
        highRiskFindings: [],
        findings: [{ id: 'f1', title: 'Low issue', severity: 'low', status: 'open', sourceType: 'ai_review' }],
        summary: { totalFindings: 1, openFindings: 1, dismissedFindings: 0, bySeverity: { critical: 0, high: 0, medium: 0, low: 1 }, byStatus: { open: 1, in_progress: 0, resolved: 0, dismissed: 0 } },
      });
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      expect(screen.getByText('No high-risk findings')).toBeInTheDocument();
    });
  });

  describe('include/exclude dismissed toggle', () => {
    it('renders dismissed toggle checkbox', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      expect(screen.getByLabelText('Include dismissed findings')).toBeInTheDocument();
    });

    it('toggle is checked by default', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      const toggle = screen.getByLabelText('Include dismissed findings');
      expect(toggle).toBeChecked();
    });

    it('updates total count when toggle is unchecked', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      const totalStat = screen.getByTestId('stat-total');
      expect(totalStat).toHaveTextContent('4');
      const toggle = screen.getByLabelText('Include dismissed findings');
      fireEvent.click(toggle);
      expect(totalStat).toHaveTextContent('3');
    });

    it('hides dismissed findings when toggle is unchecked', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      // Initially the dismissed finding should be visible (appears multiple times - in high-risk check and all findings)
      expect(screen.getAllByText('Minor formatting issue').length).toBeGreaterThanOrEqual(1);
      const toggle = screen.getByLabelText('Include dismissed findings');
      fireEvent.click(toggle);
      // After unchecking, the dismissed finding should be hidden
      expect(screen.queryByText('Minor formatting issue')).not.toBeInTheDocument();
    });
  });

  describe('export action callback', () => {
    it('renders export button', () => {
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} />);
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });

    it('calls onExport when export button is clicked', () => {
      const mockOnExport = vi.fn();
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} onExport={mockOnExport} />);
      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);
      expect(mockOnExport).toHaveBeenCalledTimes(1);
    });

    it('passes current includeDismissed state to onExport', () => {
      const mockOnExport = vi.fn();
      const report = createMockReport();
      render(<ReportPreviewPanel {...defaultProps} report={report} onExport={mockOnExport} />);
      const toggle = screen.getByLabelText('Include dismissed findings');
      fireEvent.click(toggle);
      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);
      expect(mockOnExport).toHaveBeenCalledWith({ includeDismissed: false });
    });

    it('export button is disabled when no report is provided', () => {
      render(<ReportPreviewPanel {...defaultProps} />);
      const exportButton = screen.getByText('Export Report');
      expect(exportButton).toBeDisabled();
    });
  });
});
