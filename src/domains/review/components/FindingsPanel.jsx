import React, { useState } from 'react';
import './FindingsPanel.css';

// Helper function to get severity class and label
const getSeverityInfo = (severity) => {
  switch (severity.toLowerCase()) {
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

// Helper function to get source badge
const getSourceBadge = (source) => {
  switch (source.toLowerCase()) {
    case 'document':
      return { label: 'DOC', title: 'Document Analysis' };
    case 'compliance':
      return { label: 'CMP', title: 'Compliance Check' };
    case 'policy':
      return { label: 'POL', title: 'Policy Review' };
    default:
      return { label: 'N/A', title: 'Unknown Source' };
  }
};

const FindingsPanel = ({ 
  findings = [], 
  selectedFinding = null, 
  onSelectFinding = () => {},
  onFilterChange = () => {}
}) => {
  const [filters, setFilters] = useState({
    critical: true,
    high: true,
    medium: true,
    low: true,
    document: true,
    compliance: true,
    policy: true
  });

  // Apply filters to findings
  const filteredFindings = findings.filter(finding => {
    const severityMatch = filters[finding.severity.toLowerCase()];
    const sourceMatch = filters[finding.source.toLowerCase()];
    return severityMatch && sourceMatch;
  });

  // Group findings by severity
  const groupedFindings = filteredFindings.reduce((acc, finding) => {
    const severity = finding.severity.toLowerCase();
    if (!acc[severity]) {
      acc[severity] = [];
    }
    acc[severity].push(finding);
    return acc;
  }, {});

  // Sort severities: critical, high, medium, low
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const sortedSeverities = severityOrder.filter(severity => groupedFindings[severity]?.length > 0);

  // Handle filter toggle
  const toggleFilter = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: !filters[filterType] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Render empty state
  if (findings.length === 0) {
    return (
      <div className="findings-panel">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No findings yet</h3>
          <p>Run a review to identify issues in the document</p>
        </div>
      </div>
    );
  }

  return (
    <div className="findings-panel">
      {/* Filter Controls */}
      <div className="findings-filters">
        <div className="filter-section">
          <h4>Severity</h4>
          <div className="filter-options">
            {['critical', 'high', 'medium', 'low'].map(severity => {
              const { label } = getSeverityInfo(severity);
              return (
                <label key={severity} className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters[severity]}
                    onChange={() => toggleFilter(severity, filters[severity])}
                    aria-label={label}
                  />
                  <span 
                    className={`severity-badge ${getSeverityInfo(severity).class}`}
                    title={`${label} severity`}
                  >
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        
        <div className="filter-section">
          <h4>Source</h4>
          <div className="filter-options">
            {['document', 'compliance', 'policy'].map(source => {
              const sourceBadge = getSourceBadge(source);
              return (
                <label key={source} className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters[source]}
                    onChange={() => toggleFilter(source, filters[source])}
                    aria-label={sourceBadge.title}
                  />
                  <span 
                    className="source-badge"
                    title={sourceBadge.title}
                  >
                    {sourceBadge.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="findings-list">
        {sortedSeverities.length === 0 ? (
          <div className="no-results">
            <p>No findings match the current filters</p>
          </div>
        ) : (
          sortedSeverities.map(severity => {
            const severityGroup = groupedFindings[severity];
            const { label, class: severityClass } = getSeverityInfo(severity);
            
            return (
              <div key={severity} className="severity-group">
                <div className={`severity-header ${severityClass}`}>
                  <h4>{label} Findings ({severityGroup.length})</h4>
                </div>
                <div className="findings-items">
                  {severityGroup.map(finding => {
                    const isSelected = selectedFinding && selectedFinding.id === finding.id;
                    const sourceBadge = getSourceBadge(finding.source);
                    
                    return (
                      <div
                        key={finding.id}
                        className={`finding-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => onSelectFinding(finding)}
                      >
                        <div className="finding-header">
                          <h5 className="finding-title">{finding.title}</h5>
                          <div className="finding-meta">
                            <span 
                              className={`severity-badge ${getSeverityInfo(finding.severity).class}`}
                              title={`${getSeverityInfo(finding.severity).label} severity`}
                            >
                              {getSeverityInfo(finding.severity).label}
                            </span>
                            <span 
                              className="source-badge"
                              title={sourceBadge.title}
                            >
                              {sourceBadge.label}
                            </span>
                          </div>
                        </div>
                        <p className="finding-description">{finding.description}</p>
                        <div className="finding-category">
                          <span className="category-tag">{finding.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FindingsPanel;