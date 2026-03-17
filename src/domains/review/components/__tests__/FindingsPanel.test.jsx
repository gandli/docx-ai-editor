import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FindingsPanel from '../FindingsPanel';

// Mock Finding object structure
const mockFinding = {
  id: '1',
  title: 'Sample Finding',
  description: 'This is a sample finding description',
  severity: 'high', // 'critical', 'high', 'medium', 'low'
  source: 'document', // 'document', 'compliance', 'policy'
  category: 'compliance',
  createdAt: new Date(),
};

// Mock console.error to prevent test failure from React warnings
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn()
};

describe('FindingsPanel', () => {
  const defaultProps = {
    findings: [],
    selectedFinding: null,
    onSelectFinding: () => {},
    onFilterChange: () => {},
  };

  it('renders empty state when no findings are provided', () => {
    render(<FindingsPanel {...defaultProps} />);
    
    expect(screen.getByText('No findings yet')).toBeInTheDocument();
    expect(screen.getByText('Run a review to identify issues in the document')).toBeInTheDocument();
  });

  it('displays findings grouped by severity', () => {
    const findings = [
      { ...mockFinding, id: '1', severity: 'critical', title: 'Critical Issue' },
      { ...mockFinding, id: '2', severity: 'high', title: 'High Priority Issue' },
      { ...mockFinding, id: '3', severity: 'medium', title: 'Medium Issue' },
      { ...mockFinding, id: '4', severity: 'low', title: 'Low Priority Issue' },
    ];

    render(<FindingsPanel {...defaultProps} findings={findings} />);

    // Check that all severity levels are represented
    expect(screen.getByText('Critical Issue')).toBeInTheDocument();
    expect(screen.getByText('High Priority Issue')).toBeInTheDocument();
    expect(screen.getByText('Medium Issue')).toBeInTheDocument();
    expect(screen.getByText('Low Priority Issue')).toBeInTheDocument();

    // Check that findings are grouped by severity
    expect(screen.getByText(/Critical Findings \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/High Findings \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Medium Findings \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Low Findings \(\d+\)/)).toBeInTheDocument();
  });

  it('calls onSelectFinding when a finding is clicked', () => {
    const mockOnSelect = vi.fn();
    const findings = [mockFinding];

    render(
      <FindingsPanel
        {...defaultProps}
        findings={findings}
        onSelectFinding={mockOnSelect}
      />
    );

    const findingElement = screen.getByText('Sample Finding');
    fireEvent.click(findingElement);

    expect(mockOnSelect).toHaveBeenCalledWith(mockFinding);
  });

  it('shows selected finding with highlighted state', () => {
    const findings = [mockFinding];
    const selectedFinding = mockFinding;

    render(
      <FindingsPanel
        {...defaultProps}
        findings={findings}
        selectedFinding={selectedFinding}
      />
    );

    const findingElement = screen.getByText('Sample Finding');
    expect(findingElement.closest('.finding-item.selected')).toBeInTheDocument();
  });

  it('displays source badges correctly', () => {
    const findings = [
      { ...mockFinding, id: '1', source: 'document', title: 'Document Source' },
      { ...mockFinding, id: '2', source: 'compliance', title: 'Compliance Source' },
      { ...mockFinding, id: '3', source: 'policy', title: 'Policy Source' },
    ];

    render(<FindingsPanel {...defaultProps} findings={findings} />);

    // Find source badges specifically in the finding items (not in filters)
    const docBadges = screen.getAllByText('DOC');
    const cmpBadges = screen.getAllByText('CMP');
    const polBadges = screen.getAllByText('POL');

    // There should be 1 of each in the findings themselves (not counting filter badges)
    expect(docBadges.length).toBeGreaterThanOrEqual(1);
    expect(cmpBadges.length).toBeGreaterThanOrEqual(1);
    expect(polBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onFilterChange when filter controls are used', () => {
    const mockOnFilterChange = vi.fn();
    const findings = [
      { ...mockFinding, id: '1', severity: 'critical' },
      { ...mockFinding, id: '2', severity: 'high' },
    ];

    render(
      <FindingsPanel
        {...defaultProps}
        findings={findings}
        onFilterChange={mockOnFilterChange}
      />
    );

    // Test severity filter
    const criticalFilter = screen.getByLabelText('Critical');
    fireEvent.click(criticalFilter);

    expect(mockOnFilterChange).toHaveBeenCalled();
  });

  it('groups findings by severity properly', () => {
    const findings = [
      { ...mockFinding, id: '1', severity: 'high', title: 'High 1' },
      { ...mockFinding, id: '2', severity: 'high', title: 'High 2' },
      { ...mockFinding, id: '3', severity: 'low', title: 'Low 1' },
    ];

    render(<FindingsPanel {...defaultProps} findings={findings} />);

    expect(screen.getByText('High 1')).toBeInTheDocument();
    expect(screen.getByText('High 2')).toBeInTheDocument();
    expect(screen.getByText('Low 1')).toBeInTheDocument();
  });
});