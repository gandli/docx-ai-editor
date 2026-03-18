import React from 'react';
import './FindingDetail.css';
import RuleSource from './common/RuleSource';

const FindingDetail = ({ finding, onLocate, onCopySuggestion, onApply, onDismiss, onAccept }) => {
  if (!finding) {
    return (
      <div className="finding-detail">
        <p>No finding selected</p>
      </div>
    );
  }

  const { id, title, description, evidence, severity, suggestion, rule } = finding;

  const getSeverityClass = (severityLevel) => {
    switch (severityLevel?.toLowerCase()) {
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return '';
    }
  };

  const getSeverityDisplay = (severityLevel) => {
    switch (severityLevel?.toLowerCase()) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Info';
    }
  };

  const handleLocate = () => {
    if (onLocate) {
      onLocate(id);
    }
  };

  const handleCopySuggestion = () => {
    if (onCopySuggestion && suggestion) {
      onCopySuggestion(suggestion);
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply(id);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept(id);
    }
  };

  return (
    <div className="finding-detail">
      <header className="finding-header">
        <h2 className="finding-title">
          {title}
          <span className={`finding-severity ${getSeverityClass(severity)}`}>
            {getSeverityDisplay(severity)}
          </span>
        </h2>
      </header>

      <section className="finding-description">
        <p>{description}</p>
      </section>

      {rule && (
        <section className="rule-source-section">
          <RuleSource source={rule.source} />
        </section>
      )}

      {evidence && evidence.length > 0 && (
        <section className="evidence-section">
          <h3 className="evidence-title">Evidence</h3>
          <div className="evidence-list">
            {evidence.map((item, index) => (
              <div key={index} className="evidence-item">
                <strong>Page {item.page || 'N/A'}, Offset {item.offset || 'N/A'}:</strong> {item.paragraph}
              </div>
            ))}
          </div>
        </section>
      )}

      {suggestion && (
        <section className="suggestion-section">
          <h3 className="suggestion-title">Suggested Action</h3>
          <div className="suggestion-content">{suggestion}</div>
        </section>
      )}

      <div className="actions-container">
        <button className="action-button locate-button" onClick={handleLocate}>
          Locate in Document
        </button>
        
        {suggestion && (
          <button className="action-button copy-button" onClick={handleCopySuggestion}>
            Copy Suggestion
          </button>
        )}
        
        <button className="action-button apply-button" onClick={handleApply}>
          Apply Fix
        </button>
        
        <button className="action-button dismiss-button" onClick={handleDismiss}>
          Dismiss
        </button>
        
        <button className="action-button accept-button" onClick={handleAccept}>
          Accept
        </button>
      </div>
    </div>
  );
};

export default FindingDetail;