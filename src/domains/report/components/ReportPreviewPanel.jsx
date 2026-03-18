import React, { useState, useMemo } from 'react';
import './ReportPreviewPanel.css';

// Helper function to get severity class and label
const getSeverityInfo = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return { class: 'severity-critical', label: 'Critical', color: '#dc3545' };
    case 'high':
      return { class: 'severity-high', label: 'High', color: '#fd7e14' };
    case 'medium':
      return { class: 'severity-medium', label: 'Medium', color: '#ffc107' };
    case 'low':
      return { class: 'severity-low', label: 'Low', color: '#6c757d' };
    default:
      return { class: 'severity-info', label: 'Info', color: '#17a2b8' };
  }
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const ReportPreviewPanel = ({ report, onExport = () => {} }) => {
  const [includeDismissed, setIncludeDismissed] = useState(true);

  // Filter findings based on includeDismissed toggle
  const filteredFindings = useMemo(() => {
    if (!report?.findings) return [];
    if (includeDismissed) return report.findings;
    return report.findings.filter((f) => f.status !== 'dismissed');
  }, [report?.findings, includeDismissed]);

  // Calculate displayed counts
  const displayCounts = useMemo(() => {
    if (!report?.summary) {
      return { total: 0, open: 0, dismissed: 0 };
    }
    const total = filteredFindings.length;
    const open = filteredFindings.filter((f) => f.status === 'open').length;
    const dismissed = filteredFindings.filter((f) => f.status === 'dismissed').length;
    return { total, open, dismissed };
  }, [filteredFindings, report?.summary]);

  // Handle export button click
  const handleExport = () => {
    onExport({ includeDismissed });
  };

  // Handle toggle change
  const handleToggleChange = () => {
    setIncludeDismissed((prev) => !prev);
  };

  // Render empty state
  if (!report) {
    return (
      <div className="report-preview-panel">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No report available</h3>
          <p>Run a review to generate a report</p>
          <button className="export-button" disabled>
            Export Report
          </button>
        </div>
      </div>
    );
  }

  const { summary, highRiskFindings = [], metadata, documentName, generatedAt } = report;
  const severityOrder = ['critical', 'high', 'medium', 'low'];

  return (
    <div className="report-preview-panel">
      {/* Header */}
      <div className="report-header">
        <h2 className="report-title">Review Report</h2>
        <div className="document-name">{documentName || 'Untitled Document'}</div>
        <div className="report-meta">
          <span className="report-date">Generated: {formatDate(generatedAt)}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-section">
        <h3 className="section-title">Summary</h3>
        <div className="stats-grid">
          <div className="stat-card total" data-testid="stat-total">
            <div className="stat-value">{displayCounts.total}</div>
            <div className="stat-label">Total Findings</div>
          </div>
          <div className="stat-card open" data-testid="stat-open">
            <div className="stat-value">{displayCounts.open}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-card dismissed" data-testid="stat-dismissed">
            <div className="stat-value">{displayCounts.dismissed}</div>
            <div className="stat-label">Dismissed</div>
          </div>
          <div className="stat-card rules" data-testid="stat-rules">
            <div className="stat-value">{metadata?.totalRules || 0}</div>
            <div className="stat-label">Rules Applied</div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="severity-breakdown">
          <h4>Severity Breakdown</h4>
          <div className="severity-bars">
            {severityOrder.map((severity) => {
              const count = summary?.bySeverity?.[severity] || 0;
              const { label, class: severityClass } = getSeverityInfo(severity);
              return (
                <div key={severity} className="severity-bar-item">
                  <span className={`severity-label ${severityClass}`}>{label}</span>
                  <span className="severity-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* High Risk Findings */}
      <div className="high-risk-section">
        <h3 className="section-title">High Risk Findings</h3>
        {highRiskFindings.length === 0 ? (
          <div className="no-high-risk">No high-risk findings</div>
        ) : (
          <div className="high-risk-list">
            {highRiskFindings.map((finding) => {
              const { label, class: severityClass } = getSeverityInfo(finding.severity);
              const isVisible = includeDismissed || finding.status !== 'dismissed';
              
              if (!isVisible) return null;
              
              return (
                <div key={finding.id} className="high-risk-item">
                  <div className="high-risk-header">
                    <span className={`severity-badge ${severityClass}`}>{label}</span>
                    {finding.status === 'dismissed' && (
                      <span className="status-badge dismissed">Dismissed</span>
                    )}
                  </div>
                  <h4 className="finding-title">{finding.title}</h4>
                  <p className="finding-description">{finding.description}</p>
                  {finding.category && (
                    <span className="category-tag">{finding.category}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Findings List */}
      <div className="findings-list-section">
        <h3 className="section-title">All Findings</h3>
        <div className="findings-list">
          {filteredFindings.length === 0 ? (
            <div className="no-findings">No findings to display</div>
          ) : (
            filteredFindings.map((finding) => {
              const { label, class: severityClass } = getSeverityInfo(finding.severity);
              return (
                <div key={finding.id} className="finding-item">
                  <div className="finding-header">
                    <span className={`severity-badge ${severityClass}`}>{label}</span>
                    <span className={`status-badge ${finding.status}`}>
                      {finding.status}
                    </span>
                  </div>
                  <h4 className="finding-title">{finding.title}</h4>
                  <p className="finding-description">{finding.description}</p>
                  {finding.category && (
                    <span className="category-tag">{finding.category}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="report-controls">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={includeDismissed}
            onChange={handleToggleChange}
            aria-label="Include dismissed findings"
          />
          <span>Include dismissed findings</span>
        </label>
        <button className="export-button" onClick={handleExport}>
          Export Report
        </button>
      </div>
    </div>
  );
};

export default ReportPreviewPanel;