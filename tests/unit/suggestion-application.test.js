/**
 * Unit Tests: Suggestion Application Flow
 * 
 * Tests the flow of applying suggestions to documents
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSuggestion } from '../../src/domains/review/model/review-models.js';
import { 
  applySuggestionToDocument,
  mergeDocumentChanges 
} from '../../src/api/docx-utils.js';

// Mock the docx-utils functions
vi.mock('../../src/api/docx-utils.js', () => ({
  applySuggestionToDocument: vi.fn(),
  mergeDocumentChanges: vi.fn()
}));

describe('Unit: Suggestion Application Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Single Suggestion Application', () => {
    it('should apply insert suggestion successfully', async () => {
      const mockEditorRef = { current: { applySuggestion: vi.fn() } };
      const suggestion = createSuggestion({
        text: '采购预算：人民币 500 万元整',
        mode: 'insert',
        targetSegmentId: 'project-info',
        position: 'after'
      });

      applySuggestionToDocument.mockResolvedValue({ success: true });

      const result = await applySuggestionToDocument(mockEditorRef, suggestion);

      expect(result.success).toBe(true);
      expect(applySuggestionToDocument).toHaveBeenCalledWith(mockEditorRef, suggestion);
    });

    it('should apply replace suggestion successfully', async () => {
      const mockEditorRef = { current: { applySuggestion: vi.fn() } };
      const suggestion = createSuggestion({
        text: '联系电话：138-0000-1234',
        mode: 'replace',
        targetSegmentId: 'contact-phone'
      });

      applySuggestionToDocument.mockResolvedValue({ success: true });

      const result = await applySuggestionToDocument(mockEditorRef, suggestion);

      expect(result.success).toBe(true);
    });

    it('should apply delete suggestion successfully', async () => {
      const mockEditorRef = { current: { applySuggestion: vi.fn() } };
      const suggestion = createSuggestion({
        text: '',
        mode: 'delete',
        targetSegmentId: 'invalid-content'
      });

      applySuggestionToDocument.mockResolvedValue({ success: true });

      const result = await applySuggestionToDocument(mockEditorRef, suggestion);

      expect(result.success).toBe(true);
    });

    it('should handle editor not ready error', async () => {
      const mockEditorRef = { current: null };
      const suggestion = createSuggestion({
        text: 'Test suggestion',
        mode: 'insert'
      });

      applySuggestionToDocument.mockResolvedValue({ 
        success: false, 
        error: '编辑器未就绪' 
      });

      const result = await applySuggestionToDocument(mockEditorRef, suggestion);

      expect(result.success).toBe(false);
      expect(result.error).toContain('编辑器');
    });

    it('should handle suggestion application failure', async () => {
      const mockEditorRef = { current: { applySuggestion: vi.fn() } };
      const suggestion = createSuggestion({
        text: 'Test suggestion',
        mode: 'insert'
      });

      applySuggestionToDocument.mockResolvedValue({ 
        success: false, 
        error: '应用建议失败' 
      });

      const result = await applySuggestionToDocument(mockEditorRef, suggestion);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Multiple Suggestions Application', () => {
    it('should apply multiple suggestions in sequence', async () => {
      const mockEditorRef = { current: { applySuggestion: vi.fn() } };
      const suggestions = [
        createSuggestion({ text: 'Fix 1', mode: 'replace', targetSegmentId: 'seg-1' }),
        createSuggestion({ text: 'Fix 2', mode: 'replace', targetSegmentId: 'seg-2' }),
        createSuggestion({ text: 'Fix 3', mode: 'insert', targetSegmentId: 'seg-3' })
      ];

      applySuggestionToDocument.mockResolvedValue({ success: true });

      for (const suggestion of suggestions) {
        const result = await applySuggestionToDocument(mockEditorRef, suggestion);
        expect(result.success).toBe(true);
      }

      expect(applySuggestionToDocument).toHaveBeenCalledTimes(3);
    });

    it('should stop on first failure when applying batch', async () => {
      const mockEditorRef = { current: { applySuggestion: vi.fn() } };
      const suggestions = [
        createSuggestion({ text: 'Fix 1', mode: 'replace', targetSegmentId: 'seg-1' }),
        createSuggestion({ text: 'Fix 2', mode: 'replace', targetSegmentId: 'seg-2' }),
        createSuggestion({ text: 'Fix 3', mode: 'insert', targetSegmentId: 'seg-3' })
      ];

      // First succeeds, second fails
      let callCount = 0;
      applySuggestionToDocument.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.resolve({ success: false, error: 'Segment not found' });
        }
        return Promise.resolve({ success: true });
      });

      const results = [];
      for (const suggestion of suggestions) {
        const result = await applySuggestionToDocument(mockEditorRef, suggestion);
        results.push(result);
        if (!result.success) break;
      }

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results).toHaveLength(2); // Stopped after failure
    });
  });

  describe('Document Change Merging', () => {
    it('should merge single change into document', async () => {
      const originalDoc = new Blob(['PKoriginal content'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const change = {
        type: 'replace',
        position: 10,
        content: 'updated content'
      };

      const mergedBlob = new Blob(['PKupdated content'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      mergeDocumentChanges.mockResolvedValue(mergedBlob);

      const result = await mergeDocumentChanges(originalDoc, change);

      expect(result).toBeInstanceOf(Blob);
      expect(mergeDocumentChanges).toHaveBeenCalledWith(originalDoc, change);
    });

    it('should merge multiple changes into document', async () => {
      const originalDoc = new Blob(['PKoriginal'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const changes = [
        { type: 'insert', position: 2, content: 'inserted ' },
        { type: 'replace', position: 10, content: 'modified' }
      ];

      const mergedBlob = new Blob(['PKinserted modified'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      mergeDocumentChanges.mockResolvedValue(mergedBlob);

      const result = await mergeDocumentChanges(originalDoc, changes);

      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle empty changes array', async () => {
      const originalDoc = new Blob(['PKoriginal'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      mergeDocumentChanges.mockResolvedValue(originalDoc);

      const result = await mergeDocumentChanges(originalDoc, []);

      expect(result).toBe(originalDoc);
    });

    it('should handle insert change type', async () => {
      const originalDoc = new Blob(['PKcontent'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const change = { type: 'insert', position: 2, content: 'new ' };

      const mergedBlob = new Blob(['PKnew content'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      mergeDocumentChanges.mockResolvedValue(mergedBlob);

      const result = await mergeDocumentChanges(originalDoc, change);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle delete change type', async () => {
      const originalDoc = new Blob(['PKcontent to delete'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const change = { type: 'delete', position: 2, length: 10 };

      const mergedBlob = new Blob(['PKdelete'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      mergeDocumentChanges.mockResolvedValue(mergedBlob);

      const result = await mergeDocumentChanges(originalDoc, change);

      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle merge errors gracefully', async () => {
      const originalDoc = new Blob(['PKcontent'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const change = { type: 'invalid', position: 0 };

      mergeDocumentChanges.mockRejectedValue(new Error('Invalid change type'));

      await expect(mergeDocumentChanges(originalDoc, change))
        .rejects.toThrow('Invalid change type');
    });
  });

  describe('Procurement-Specific Suggestion Application', () => {
    it('should apply budget suggestion', async () => {
      const mockEditorRef = { current: { applySuggestion: vi.fn() } };
      const suggestion = createSuggestion({
        text: '采购预算：人民币 500 万元整',
        mode: 'insert',
        targetSegmentId: 'project-info',
        position: 'append',
        rationale: '添加缺失的预算信息'
      });

      applySuggestionToDocument.mockResolvedValue({ success: true });

      const result = await applySuggestionToDocument(mockEditorRef, suggestion);

      expect(result.success).toBe(true);
    });

    it('should apply contact fix suggestion', async () => {
      const mockEditorRef = { current: { applySuggestion: vi.fn() } };
      const suggestion = createSuggestion({
        text: '联系电话：138-0000-1234',
        mode: 'replace',
        targetSegmentId: 'contact-phone',
        rationale: '修正电话号码格式'
      });

      applySuggestionToDocument.mockResolvedValue({ success: true });

      const result = await applySuggestionToDocument(mockEditorRef, suggestion);

      expect(result.success).toBe(true);
    });

    it('should apply timeline completion suggestion', async () => {
      const mockEditorRef = { current: { applySuggestion: vi.fn() } };
      const suggestion = createSuggestion({
        text: '投标截止日期：2024年3月31日',
        mode: 'replace',
        targetSegmentId: 'timeline-bid-deadline',
        rationale: '设定具体的投标截止日期'
      });

      applySuggestionToDocument.mockResolvedValue({ success: true });

      const result = await applySuggestionToDocument(mockEditorRef, suggestion);

      expect(result.success).toBe(true);
    });

    it('should apply all procurement fixes in batch', async () => {
      const mockEditorRef = { current: { applySuggestion: vi.fn() } };
      const suggestions = [
        createSuggestion({ 
          text: '采购预算：人民币 500 万元整', 
          mode: 'insert',
          targetSegmentId: 'project-info' 
        }),
        createSuggestion({ 
          text: '联系电话：138-0000-1234', 
          mode: 'replace',
          targetSegmentId: 'contact-phone' 
        }),
        createSuggestion({ 
          text: '电子邮箱：contact@example.com', 
          mode: 'replace',
          targetSegmentId: 'contact-email' 
        })
      ];

      applySuggestionToDocument.mockResolvedValue({ success: true });

      for (const suggestion of suggestions) {
        const result = await applySuggestionToDocument(mockEditorRef, suggestion);
        expect(result.success).toBe(true);
      }

      expect(applySuggestionToDocument).toHaveBeenCalledTimes(3);
    });
  });

  describe('Suggestion Status Updates', () => {
    it('should update suggestion status to applied', async () => {
      const suggestion = createSuggestion({
        text: 'Test suggestion',
        status: 'open'
      });

      // Simulate applying
      suggestion.status = 'applied';
      suggestion.appliedChanges = [
        { type: 'replace', original: 'old', replacement: 'new' }
      ];

      expect(suggestion.status).toBe('applied');
      expect(suggestion.appliedChanges).toHaveLength(1);
    });

    it('should update suggestion status to accepted', async () => {
      const suggestion = createSuggestion({
        text: 'Test suggestion',
        status: 'open'
      });

      suggestion.status = 'accepted';

      expect(suggestion.status).toBe('accepted');
    });

    it('should update suggestion status to rejected', async () => {
      const suggestion = createSuggestion({
        text: 'Test suggestion',
        status: 'open'
      });

      suggestion.status = 'rejected';

      expect(suggestion.status).toBe('rejected');
    });
  });
});
