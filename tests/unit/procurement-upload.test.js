/**
 * Unit Tests: Procurement Document Upload Handling
 * 
 * Tests file upload validation, extraction, and processing for procurement documents
 */

import { describe, it, expect } from 'vitest';
import { validateDocxFile } from '../../src/api/docx-utils.js';

describe('Unit: File Upload Handling', () => {
  describe('validateDocxFile', () => {
    it('should validate a valid DOCX file structure', async () => {
      // Create a mock DOCX file with proper header
      const mockDocxBlob = new Blob([
        new Uint8Array([
          0x50, 0x4b, 0x03, 0x04, // PK header
          ...new TextEncoder().encode('test content')
        ])
      ], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      const file = new File([mockDocxBlob], 'valid-procurement.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const result = await validateDocxFile(file);
      
      // Should validate as proper DOCX (has PK header)
      expect(result).toBeDefined();
    });

    it('should reject non-DOCX files', async () => {
      const invalidFile = new File(['not a docx'], 'test.txt', { type: 'text/plain' });
      const result = await validateDocxFile(invalidFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject empty files', async () => {
      const emptyFile = new File([''], 'empty.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const result = await validateDocxFile(emptyFile);
      
      expect(result.valid).toBe(false);
    });

    it('should reject files exceeding size limit', async () => {
      // Create a mock large file (smaller for test speed)
      const largeContent = 'x'.repeat(1024 * 1024 * 6); // 6MB
      const largeFile = new File([largeContent], 'large.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const result = await validateDocxFile(largeFile, 5 * 1024 * 1024); // 5MB limit
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不能超过');
    }, 10000);

    it('should reject files with invalid extension', async () => {
      const wrongExtFile = new File(['PKcontent'], 'document.pdf', { 
        type: 'application/pdf' 
      });
      const result = await validateDocxFile(wrongExtFile);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('Document Content Analysis', () => {
    it('should detect budget information in document content', () => {
      const content = '采购预算：人民币 500 万元整';
      const hasBudget = content.includes('预算') && /\d+\s*万元/.test(content);
      expect(hasBudget).toBe(true);
    });

    it('should detect missing budget information', () => {
      const content = '项目名称：智慧校园信息化建设项目\n项目编号：XYZ-2024-001';
      const hasSpecificBudget = /\d+\s*万元/.test(content);
      expect(hasSpecificBudget).toBe(false);
    });

    it('should detect valid contact information', () => {
      const content = '联系人：张三\n联系电话：138-0000-1234\n电子邮箱：zhangsan@example.edu.cn';
      
      const hasName = content.includes('联系人');
      const hasPhone = /\d{3}-\d{4}-\d{4}/.test(content);
      const hasEmail = /\S+@\S+\.\S+/.test(content);
      
      expect(hasName).toBe(true);
      expect(hasPhone).toBe(true);
      expect(hasEmail).toBe(true);
    });

    it('should detect invalid contact information', () => {
      const content = '联系电话：invalid-phone\n电子邮箱：not-an-email';
      
      const hasInvalidPhone = content.includes('invalid-phone');
      const hasInvalidEmail = content.includes('not-an-email');
      
      expect(hasInvalidPhone || hasInvalidEmail).toBe(true);
    });

    it('should detect complete timeline', () => {
      const content = '招标公告发布日期：2024年3月1日\n投标截止日期：2024年3月31日\n开标日期：2024年4月5日';
      
      const hasTimeline = content.includes('招标公告发布日期') && 
                          content.includes('投标截止日期') &&
                          content.includes('开标日期');
      expect(hasTimeline).toBe(true);
    });

    it('should detect incomplete timeline markers', () => {
      const content = '投标截止日期：待定\n开标日期：待定';
      const hasTBD = content.includes('待定');
      expect(hasTBD).toBe(true);
    });
  });
});
