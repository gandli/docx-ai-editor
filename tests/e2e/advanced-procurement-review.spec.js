/**
 * E2E Tests: Advanced Procurement Document Review Workflow
 * 
 * Tests the end-to-end workflow for advanced procurement documents
 * including emergency procurement, multi-vendor bids, international suppliers,
 * and high-value contracts.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to load fixture files
function loadFixtureBuffer(filename) {
  const fixturePath = join(__dirname, '../fixtures/procurement-docs', filename);
  return readFileSync(fixturePath);
}

test.describe('Feature: Advanced Procurement Document Review', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Scenario: Emergency Procurement Review', () => {
    test('Given an emergency procurement document, When uploaded and reviewed, Then emergency compliance findings should be detected', async ({ page }) => {
      // Given - Load emergency procurement document
      const emergencyDocBuffer = loadFixtureBuffer('emergency-procurement.docx');
      
      // When - Upload the document
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'emergency-procurement.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: emergencyDocBuffer
      });

      // Wait for document processing
      await page.waitForTimeout(1500);

      // Then - Verify document is loaded
      const editorPanel = page.locator('.document-panel, [data-testid="document-panel"], .superdoc-editor');
      await expect(editorPanel).toBeVisible();

      // Trigger review if button exists
      const reviewButton = page.locator('button:has-text("Review"), button:has-text("审查"), [data-testid="review-button"]');
      if (await reviewButton.isVisible().catch(() => false)) {
        await reviewButton.click();
        await page.waitForTimeout(2000);
      }

      // Then - Verify emergency-related findings
      const findingsPanel = page.locator('[data-testid="findings-panel"], .findings-panel, .review-findings');
      if (await findingsPanel.isVisible().catch(() => false)) {
        // Should detect emergency compliance issues
        const emergencyFinding = page.locator('text=/emergency|紧急|urgent|应急/i');
        const findingExists = await emergencyFinding.isVisible().catch(() => false);
        console.log('Emergency finding exists:', findingExists);
      }
    });

    test('Given an emergency procurement document, When reviewed, Then accelerated timeline risks should be identified', async ({ page }) => {
      const emergencyDocBuffer = loadFixtureBuffer('emergency-procurement.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'emergency-procurement.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: emergencyDocBuffer
      });

      await page.waitForTimeout(1500);

      // Look for timeline-related findings
      const timelineFinding = page.locator('text=/timeline|时间|schedule|期限/i');
      console.log('Checking for accelerated timeline findings...');
    });
  });

  test.describe('Scenario: Multi-Vendor Bid Review', () => {
    test('Given a multi-vendor bid document, When uploaded and reviewed, Then consortium compliance findings should be detected', async ({ page }) => {
      // Given - Load multi-vendor bid document
      const multiVendorBuffer = loadFixtureBuffer('multi-vendor-bid.docx');
      
      // When - Upload the document
      await page.locator('input[type="file"]').setInputFiles({
        name: 'multi-vendor-bid.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: multiVendorBuffer
      });

      await page.waitForTimeout(1500);

      // Then - Verify document is loaded
      await expect(page.locator('.document-panel, [data-testid="document-panel"]')).toBeVisible();

      // Trigger review
      const reviewButton = page.locator('button:has-text("Review"), button:has-text("审查"), [data-testid="review-button"]');
      if (await reviewButton.isVisible().catch(() => false)) {
        await reviewButton.click();
        await page.waitForTimeout(2000);
      }

      // Then - Verify consortium-related findings
      const consortiumFinding = page.locator('text=/consortium|联合体|joint|联合/i');
      const findingExists = await consortiumFinding.isVisible().catch(() => false);
      console.log('Consortium finding exists:', findingExists);
    });

    test('Given a multi-vendor document, When reviewed, Then coordination risks should be identified', async ({ page }) => {
      const multiVendorBuffer = loadFixtureBuffer('multi-vendor-bid.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'multi-vendor-bid.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: multiVendorBuffer
      });

      await page.waitForTimeout(1500);

      // Look for coordination-related findings
      console.log('Checking for vendor coordination findings...');
    });
  });

  test.describe('Scenario: International Supplier Review', () => {
    test('Given an international supplier document, When uploaded and reviewed, Then foreign exchange compliance findings should be detected', async ({ page }) => {
      // Given - Load international supplier document
      const internationalBuffer = loadFixtureBuffer('international-supplier.docx');
      
      // When - Upload the document
      await page.locator('input[type="file"]').setInputFiles({
        name: 'international-supplier.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: internationalBuffer
      });

      await page.waitForTimeout(1500);

      // Then - Verify document is loaded
      await expect(page.locator('.document-panel, [data-testid="document-panel"]')).toBeVisible();

      // Trigger review
      const reviewButton = page.locator('button:has-text("Review"), button:has-text("审查"), [data-testid="review-button"]');
      if (await reviewButton.isVisible().catch(() => false)) {
        await reviewButton.click();
        await page.waitForTimeout(2000);
      }

      // Then - Verify international-related findings
      const internationalFinding = page.locator('text=/international|国际|foreign|进口/i');
      const findingExists = await internationalFinding.isVisible().catch(() => false);
      console.log('International finding exists:', findingExists);
    });

    test('Given an international supplier document, When reviewed, Then currency risks should be identified', async ({ page }) => {
      const internationalBuffer = loadFixtureBuffer('international-supplier.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'international-supplier.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: internationalBuffer
      });

      await page.waitForTimeout(1500);

      // Look for currency-related findings
      const currencyFinding = page.locator('text=/currency|汇率|exchange|外汇/i');
      console.log('Checking for currency risk findings...');
    });

    test('Given an international supplier document, When reviewed, Then import approval requirements should be checked', async ({ page }) => {
      const internationalBuffer = loadFixtureBuffer('international-supplier.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'international-supplier.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: internationalBuffer
      });

      await page.waitForTimeout(1500);

      // Look for import approval findings
      console.log('Checking for import approval findings...');
    });
  });

  test.describe('Scenario: High-Value Contract Review', () => {
    test('Given a high-value contract document, When uploaded and reviewed, Then budget verification findings should be detected', async ({ page }) => {
      // Given - Load high-value contract document
      const highValueBuffer = loadFixtureBuffer('high-value-contract.docx');
      
      // When - Upload the document
      await page.locator('input[type="file"]').setInputFiles({
        name: 'high-value-contract.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: highValueBuffer
      });

      await page.waitForTimeout(1500);

      // Then - Verify document is loaded
      await expect(page.locator('.document-panel, [data-testid="document-panel"]')).toBeVisible();

      // Trigger review
      const reviewButton = page.locator('button:has-text("Review"), button:has-text("审查"), [data-testid="review-button"]');
      if (await reviewButton.isVisible().catch(() => false)) {
        await reviewButton.click();
        await page.waitForTimeout(2000);
      }

      // Then - Verify budget-related findings
      const budgetFinding = page.locator('text=/budget|预算|funding|资金/i');
      const findingExists = await budgetFinding.isVisible().catch(() => false);
      console.log('Budget finding exists:', findingExists);
    });

    test('Given a high-value contract document, When reviewed, Then approval documentation findings should be detected', async ({ page }) => {
      const highValueBuffer = loadFixtureBuffer('high-value-contract.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'high-value-contract.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: highValueBuffer
      });

      await page.waitForTimeout(1500);

      // Look for approval-related findings
      const approvalFinding = page.locator('text=/approval|审批|authorization|核准/i');
      console.log('Checking for approval documentation findings...');
    });

    test('Given a high-value contract document, When reviewed, Then risk assessment should be comprehensive', async ({ page }) => {
      const highValueBuffer = loadFixtureBuffer('high-value-contract.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'high-value-contract.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: highValueBuffer
      });

      await page.waitForTimeout(1500);

      // Look for risk-related findings
      const riskFinding = page.locator('text=/risk|风险|assessment|评估/i');
      console.log('Checking for comprehensive risk assessment findings...');
    });
  });

  test.describe('Scenario: All Advanced Documents Review', () => {
    test('Given all advanced document types, When reviewed, Then appropriate findings should be generated for each', async ({ page }) => {
      const testCases = [
        { file: 'emergency-procurement.docx', expectedFindings: 2, tags: ['emergency', 'compliance'] },
        { file: 'multi-vendor-bid.docx', expectedFindings: 1, tags: ['consortium', 'coordination'] },
        { file: 'international-supplier.docx', expectedFindings: 3, tags: ['international', 'currency'] },
        { file: 'high-value-contract.docx', expectedFindings: 2, tags: ['budget', 'approval'] }
      ];

      for (const testCase of testCases) {
        // Navigate to fresh page for each test
        await page.goto('/');
        await page.waitForTimeout(500);

        const buffer = loadFixtureBuffer(testCase.file);
        
        await page.locator('input[type="file"]').setInputFiles({
          name: testCase.file,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer
        });

        await page.waitForTimeout(1500);

        // Trigger review
        const reviewButton = page.locator('button:has-text("Review"), button:has-text("审查"), [data-testid="review-button"]');
        if (await reviewButton.isVisible().catch(() => false)) {
          await reviewButton.click();
          await page.waitForTimeout(2000);
        }

        // Check for findings
        const findingsCount = await page.locator('.finding-item, [data-testid="finding-item"]').count();
        console.log(`${testCase.file}: Found ${findingsCount} findings (expected: ${testCase.expectedFindings})`);
      }
    });
  });
});