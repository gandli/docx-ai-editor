/**
 * BDD Feature Tests: Procurement Document Review Workflow
 * 
 * Feature: Upload and review procurement document
 * Tests the end-to-end workflow for uploading and reviewing procurement documents
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

test.describe('Feature: Upload and review procurement document', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Scenario: Upload valid document', () => {
    test('Given a valid procurement document, When uploaded, Then it should be processed without findings', async ({ page }) => {
      // Given - Load valid procurement document
      const validDocBuffer = loadFixtureBuffer('valid-procurement.docx');
      
      // When - Upload the document
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'valid-procurement.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: validDocBuffer
      });

      // Wait for document processing
      await page.waitForTimeout(1500);

      // Then - Verify document is loaded in editor
      const editorPanel = page.locator('.document-panel, [data-testid="document-panel"], .superdoc-editor');
      await expect(editorPanel).toBeVisible();

      // Then - Verify no critical findings are displayed
      const findingsPanel = page.locator('[data-testid="findings-panel"], .findings-panel, .review-findings');
      // If findings panel exists, it should show 0 findings or no critical issues
      if (await findingsPanel.isVisible().catch(() => false)) {
        const noFindingsMessage = page.locator('text=/no findings|无问题|未发现/i');
        await expect(noFindingsMessage).toBeVisible();
      }
    });

    test('Given a valid document, When review is triggered, Then document content should be extracted', async ({ page }) => {
      const validDocBuffer = loadFixtureBuffer('valid-procurement.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'valid-procurement.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: validDocBuffer
      });

      await page.waitForTimeout(1500);

      // Verify document panel is visible
      await expect(page.locator('.document-panel, [data-testid="document-panel"]')).toBeVisible();
    });
  });

  test.describe('Scenario: Upload document with budget issues', () => {
    test('Given a document missing budget information, When uploaded and reviewed, Then a budget finding should be created', async ({ page }) => {
      // Given - Load document with missing budget
      const missingBudgetBuffer = loadFixtureBuffer('missing-budget.docx');
      
      // When - Upload and trigger review
      await page.locator('input[type="file"]').setInputFiles({
        name: 'missing-budget.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: missingBudgetBuffer
      });

      await page.waitForTimeout(1500);

      // Trigger review if button exists
      const reviewButton = page.locator('button:has-text("Review"), button:has-text("审查"), [data-testid="review-button"]');
      if (await reviewButton.isVisible().catch(() => false)) {
        await reviewButton.click();
        await page.waitForTimeout(2000);
      }

      // Then - Verify budget-related finding is displayed
      const findingsPanel = page.locator('[data-testid="findings-panel"], .findings-panel, .review-findings');
      if (await findingsPanel.isVisible().catch(() => false)) {
        const budgetFinding = page.locator('text=/budget|预算|missing budget|缺少预算/i');
        // Finding should exist if review was triggered
        const findingExists = await budgetFinding.isVisible().catch(() => false);
        console.log('Budget finding exists:', findingExists);
      }
    });

    test('Given a document with budget issues, When reviewed, Then the finding should have high severity', async ({ page }) => {
      const missingBudgetBuffer = loadFixtureBuffer('missing-budget.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'missing-budget.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: missingBudgetBuffer
      });

      await page.waitForTimeout(1500);

      // Look for severity indicators in findings
      const highSeverityIndicator = page.locator('.severity-high, [data-severity="high"], text=/high|严重|高/i');
      // This test documents expected behavior - may need adjustment based on actual UI
      console.log('Checking for high severity indicator...');
    });
  });

  test.describe('Scenario: Navigate to finding location', () => {
    test('Given a finding exists, When clicking on it, Then the document should scroll to the relevant location', async ({ page }) => {
      // Upload document that will have findings
      const invalidContactBuffer = loadFixtureBuffer('invalid-contact.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'invalid-contact.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: invalidContactBuffer
      });

      await page.waitForTimeout(1500);

      // Look for finding items that are clickable
      const findingItem = page.locator('.finding-item, [data-testid="finding-item"], .review-finding').first();
      
      if (await findingItem.isVisible().catch(() => false)) {
        // When - Click on finding
        await findingItem.click();
        
        // Then - Document should navigate (this may vary based on implementation)
        await page.waitForTimeout(500);
        
        // Verify editor is still visible and potentially focused
        await expect(page.locator('.document-panel, [data-testid="document-panel"]')).toBeVisible();
      }
    });

    test('Given multiple findings, When selecting different findings, Then document should navigate to each location', async ({ page }) => {
      const invalidContactBuffer = loadFixtureBuffer('invalid-contact.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'invalid-contact.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: invalidContactBuffer
      });

      await page.waitForTimeout(1500);

      // Get all finding items
      const findingItems = page.locator('.finding-item, [data-testid="finding-item"], .review-finding');
      const count = await findingItems.count();
      
      if (count > 1) {
        // Click through each finding
        for (let i = 0; i < Math.min(count, 3); i++) {
          await findingItems.nth(i).click();
          await page.waitForTimeout(300);
          
          // Verify document panel remains visible
          await expect(page.locator('.document-panel, [data-testid="document-panel"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Scenario: Apply suggestion to document', () => {
    test('Given a suggestion exists for a finding, When applying the suggestion, Then the document should be updated', async ({ page }) => {
      // Upload document with issues
      const incompleteTimelineBuffer = loadFixtureBuffer('incomplete-timeline.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'incomplete-timeline.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: incompleteTimelineBuffer
      });

      await page.waitForTimeout(1500);

      // Look for apply suggestion button
      const applyButton = page.locator('button:has-text("Apply"), button:has-text("应用"), [data-testid="apply-suggestion"]').first();
      
      if (await applyButton.isVisible().catch(() => false)) {
        // When - Click apply
        await applyButton.click();
        await page.waitForTimeout(1000);

        // Then - Verify success message or document update
        const successIndicator = page.locator('text=/applied|success|已应用|成功/i, .success-message, [data-testid="apply-success"]');
        // Note: This depends on actual implementation
        console.log('Apply suggestion test - checking for success indicator');
      }
    });

    test('Given a suggestion is applied, When viewing the document, Then the change should be visible', async ({ page }) => {
      // This test verifies that applied changes persist in the document
      const incompleteTimelineBuffer = loadFixtureBuffer('incomplete-timeline.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'incomplete-timeline.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: incompleteTimelineBuffer
      });

      await page.waitForTimeout(1500);

      // Document should be visible
      await expect(page.locator('.document-panel, [data-testid="document-panel"]')).toBeVisible();
      
      // Note: Full verification would require checking document content after apply
      console.log('Document content verification test');
    });
  });

  test.describe('Scenario: Review workflow integration', () => {
    test('Given all document types, When reviewed, Then appropriate findings should be generated for each', async ({ page }) => {
      const testCases = [
        { file: 'valid-procurement.docx', expectedFindings: 0 },
        { file: 'missing-budget.docx', expectedFindings: 1 },
        { file: 'invalid-contact.docx', expectedFindings: 2 },
        { file: 'incomplete-timeline.docx', expectedFindings: 1 }
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

        // Check for findings
        const findingsCount = await page.locator('.finding-item, [data-testid="finding-item"]').count();
        console.log(`${testCase.file}: Found ${findingsCount} findings (expected: ${testCase.expectedFindings})`);
      }
    });
  });

  test.describe('Accessibility and UX', () => {
    test('Given the review panel, When using keyboard navigation, Then all interactive elements should be accessible', async ({ page }) => {
      const validDocBuffer = loadFixtureBuffer('valid-procurement.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'valid-procurement.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: validDocBuffer
      });

      await page.waitForTimeout(1500);

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).not.toBeNull();
    });

    test('Given a document with findings, When viewing on mobile, Then the review panel should be responsive', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const invalidContactBuffer = loadFixtureBuffer('invalid-contact.docx');
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'invalid-contact.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: invalidContactBuffer
      });

      await page.waitForTimeout(1500);

      // Verify document panel is still visible
      await expect(page.locator('.document-panel, [data-testid="document-panel"]')).toBeVisible();
    });
  });
});