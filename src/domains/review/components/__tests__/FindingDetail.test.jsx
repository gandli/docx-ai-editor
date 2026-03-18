import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FindingDetail from '../FindingDetail';

// Mock the child components
vi.mock('../common/RuleSource', () => ({
  default: ({ source }) => <div data-testid="rule-source">{source}</div>
}));

describe('FindingDetail Component', () => {
  const mockFinding = {
    id: 'finding-1',
    title: 'Sample Finding Title',
    description: 'This is a sample finding description.',
    evidence: [
      { paragraph: 'Evidence paragraph 1', page: 1, offset: 0 },
      { paragraph: 'Evidence paragraph 2', page: 2, offset: 10 }
    ],
    severity: 'high',
    suggestion: 'Apply suggested fix',
    rule: {
      id: 'rule-1',
      title: 'Rule Title',
      description: 'Rule Description',
      source: 'Procurement Policy Section 3.2'
    }
  };

  const defaultProps = {
    finding: mockFinding,
    onLocate: vi.fn(),
    onCopySuggestion: vi.fn(),
    onDismiss: vi.fn(),
    onAccept: vi.fn(),
    onApply: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders finding title and description', () => {
    render(<FindingDetail {...defaultProps} />);
    
    expect(screen.getByText('Sample Finding Title')).toBeInTheDocument();
    expect(screen.getByText('This is a sample finding description.')).toBeInTheDocument();
  });

  test('renders evidence paragraphs', () => {
    render(<FindingDetail {...defaultProps} />);
    
    // Check that evidence items are rendered
    expect(screen.getByText('Evidence paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Evidence paragraph 2')).toBeInTheDocument();
  });

  test('renders rule source correctly', () => {
    render(<FindingDetail {...defaultProps} />);
    
    expect(screen.getByTestId('rule-source')).toHaveTextContent('Procurement Policy Section 3.2');
  });

  test('calls onLocate when locate button is clicked', () => {
    render(<FindingDetail {...defaultProps} />);
    
    const locateButton = screen.getByRole('button', { name: /locate/i });
    fireEvent.click(locateButton);
    
    expect(defaultProps.onLocate).toHaveBeenCalledWith(mockFinding.id);
  });

  test('calls onCopySuggestion when copy suggestion button is clicked', () => {
    render(<FindingDetail {...defaultProps} />);
    
    const copyButton = screen.getByRole('button', { name: /copy suggestion/i });
    fireEvent.click(copyButton);
    
    expect(defaultProps.onCopySuggestion).toHaveBeenCalledWith('Apply suggested fix');
  });

  test('calls onApply when apply button is clicked', () => {
    render(<FindingDetail {...defaultProps} />);
    
    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);
    
    expect(defaultProps.onApply).toHaveBeenCalledWith(mockFinding.id);
  });

  test('calls onDismiss when dismiss button is clicked', () => {
    render(<FindingDetail {...defaultProps} />);
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButton);
    
    expect(defaultProps.onDismiss).toHaveBeenCalledWith(mockFinding.id);
  });

  test('calls onAccept when accept button is clicked', () => {
    render(<FindingDetail {...defaultProps} />);
    
    const acceptButton = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptButton);
    
    expect(defaultProps.onAccept).toHaveBeenCalledWith(mockFinding.id);
  });

  test('does not render suggestion section if no suggestion exists', () => {
    const findingWithoutSuggestion = {
      ...mockFinding,
      suggestion: undefined
    };
    
    render(<FindingDetail {...defaultProps} finding={findingWithoutSuggestion} />);
    
    const suggestionButtons = screen.queryByRole('button', { name: /copy suggestion/i });
    expect(suggestionButtons).not.toBeInTheDocument();
  });

  test('renders severity indicator', () => {
    render(<FindingDetail {...defaultProps} />);
    
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('renders suggestion when available', () => {
    render(<FindingDetail {...defaultProps} />);
    
    expect(screen.getByText('Apply suggested fix')).toBeInTheDocument();
  });
});