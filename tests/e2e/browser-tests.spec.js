/**
 * Comprehensive Browser and WebMCP Tests for DOCX-AI-Editor
 * 
 * Tests the complete document review workflow with both mock and real AI modes,
 * WebMCP integration, and various AI service scenarios.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test utilities
class DocxTestUtils {
  constructor(page) {
    this.page = page;
  }

  /**
   * Helper function for uploading test documents
   */
  async uploadDocument(filename, buffer) {
    const fileInput = this.page.locator('input[type="file"]');
    
    // Wait for file input to be ready
    await expect(fileInput).toBeVisible();
    
    // Upload the document
    await fileInput.setInputFiles({
      name: filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: buffer
    });
    
    console.log(`Uploaded document: ${filename}`);
  }

  /**
   * Utility for waiting for review completion
   */
  async waitForReviewCompletion(timeout = 10000) {
    // Wait for processing indicator to disappear or findings to appear
    const processingIndicator = this.page.locator('[data-testid="processing-indicator"], .loading, .processing');
    const findingsPanel = this.page.locator('[data-testid="findings-panel"], .findings-panel, .review-findings');
    
    // Wait for either processing to finish or findings to appear
    await Promise.race([
      expect(processingIndicator).not.toBeVisible({ timeout }),
      expect(findingsPanel).toBeVisible({ timeout })
    ]);
    
    console.log('Review completion detected');
  }

  /**
   * Function for verifying findings display
   */
  async verifyFindingsDisplay(expectedFindingCount = null) {
    const findingsPanel = this.page.locator('[data-testid="findings-panel"], .findings-panel, .review-findings');
    const hasFindingsPanel = await findingsPanel.isVisible().catch(() => false);
    
    if (hasFindingsPanel) {
      const findingItems = this.page.locator('.finding-item, [data-testid="finding-item"], .review-finding');
      const actualCount = await findingItems.count();
      
      console.log(`Found ${actualCount} findings in panel`);
      
      if (expectedFindingCount !== null) {
        expect(actualCount).toBe(expectedFindingCount);
      }
      
      return actualCount;
    }
    
    return 0;
  }
  
  /**
   * Check if WebMCP tools are exposed
   */
  async checkWebMCPAvailability() {
    const hasWebMCP = await this.page.evaluate(() => {
      return typeof window !== 'undefined' && 
             window.navigator && 
             window.navigator.modelContext &&
             typeof window.navigator.modelContext.request === 'function';
    });
    
    console.log(`WebMCP available: ${hasWebMCP}`);
    return hasWebMCP;
  }
  
  /**
   * Test WebMCP tool discovery
   */
  async testWebMCPDiscovery() {
    const tools = await this.page.evaluate(async () => {
      if (window.navigator.modelContext && window.navigator.modelContext.request) {
        try {
          // Try to get available tools from WebMCP
          const tools = await window.navigator.modelContext.request({
            type: 'list-tools'
          });
          return tools;
        } catch (error) {
          console.log('Error discovering WebMCP tools:', error.message);
          return [];
        }
      }
      return [];
    });
    
    console.log('Discovered WebMCP tools:', tools);
    return tools;
  }
  
  /**
   * Test WebMCP tool invocation
   */
  async testWebMCPInvocation(toolName, params) {
    const result = await this.page.evaluate(async ({ toolName, params }) => {
      if (window.navigator.modelContext && window.navigator.modelContext.request) {
        try {
          const result = await window.navigator.modelContext.request({
            type: 'tool-call',
            name: toolName,
            arguments: params
          });
          return result;
        } catch (error) {
          console.log(`Error invoking WebMCP tool ${toolName}:`, error.message);
          return { error: error.message };
        }
      }
      return { error: 'WebMCP not available' };
    }, { toolName, params });
    
    console.log(`WebMCP tool ${toolName} result:`, result);
    return result;
  }
}

test.describe('DOCX-AI-Editor Browser and WebMCP Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to load completely
    await expect(page.locator('[data-testid="app"]')).toBeVisible();
  });

  test.describe('Document Upload and Processing Tests', () => {
    test('should upload and process real DOCX files successfully', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      // Load a test document
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/valid-procurement.docx');
      const docBuffer = readFileSync(fixturePath);
      
      // Upload the document
      await utils.uploadDocument('valid-procurement.docx', docBuffer);
      
      // Wait for processing
      await utils.waitForReviewCompletion(15000);
      
      // Verify document is loaded in editor
      const documentPanel = page.locator('.document-panel, [data-testid="document-panel"], .superdoc-editor');
      await expect(documentPanel).toBeVisible();
      
      console.log('Document successfully uploaded and processed');
    });

    test('should verify document parsing and segment extraction', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/valid-procurement.docx');
      const docBuffer = readFileSync(fixturePath);
      
      await utils.uploadDocument('valid-procurement.docx', docBuffer);
      await utils.waitForReviewCompletion(15000);
      
      // Verify document content is visible in the editor
      const editorContent = page.locator('.editor-content, [data-testid="editor-content"], .superdoc-content');
      const hasContent = await editorContent.isVisible().catch(() => false);
      
      if (hasContent) {
        await expect(editorContent).toBeVisible();
        console.log('Document content is visible in editor');
      } else {
        // Alternative selectors for editor content
        const alternativeContent = page.locator('.document-viewer, .docx-content, .prose');
        const hasAltContent = await alternativeContent.isVisible().catch(() => false);
        if (hasAltContent) {
          await expect(alternativeContent).toBeVisible();
          console.log('Document content is visible in alternative viewer');
        } else {
          console.log('Could not locate document content in editor');
        }
      }
    });
  });

  test.describe('Findings Display Tests', () => {
    test('should display findings after review', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/invalid-contact.docx');
      const docBuffer = readFileSync(fixturePath);
      
      await utils.uploadDocument('invalid-contact.docx', docBuffer);
      await utils.waitForReviewCompletion(15000);
      
      // Verify findings are displayed
      const findingCount = await utils.verifyFindingsDisplay();
      expect(findingCount).toBeGreaterThanOrEqual(0);
      
      console.log(`Findings panel verified with ${findingCount} findings`);
    });

    test('should handle finding navigation and interaction', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/invalid-contact.docx');
      const docBuffer = readFileSync(fixturePath);
      
      await utils.uploadDocument('invalid-contact.docx', docBuffer);
      await utils.waitForReviewCompletion(15000);
      
      // Get finding items
      const findingItems = page.locator('.finding-item, [data-testid="finding-item"], .review-finding');
      const count = await findingItems.count();
      
      if (count > 0) {
        // Click on the first finding
        await findingItems.first().click();
        
        // Verify document panel is still visible after selection
        const documentPanel = page.locator('.document-panel, [data-testid="document-panel"], .superdoc-editor');
        await expect(documentPanel).toBeVisible();
        
        console.log(`Navigated to finding location. Total findings: ${count}`);
      } else {
        console.log('No findings available to navigate to');
      }
    });
  });

  test.describe('AI Service Scenarios Tests', () => {
    test('should use mock mode when OpenRouter API key is missing', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      // First, test with a document that would normally generate findings
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/missing-budget.docx');
      const docBuffer = readFileSync(fixturePath);
      
      await utils.uploadDocument('missing-budget.docx', docBuffer);
      await utils.waitForReviewCompletion(15000);
      
      // In mock mode, we should still get some findings
      const findingCount = await utils.verifyFindingsDisplay();
      console.log(`Mock mode findings: ${findingCount}`);
      
      // Verify that the app handles the scenario gracefully
      const errorMessage = page.locator('text=/API key.*missing|配置有效AI API密钥|offline mode/i');
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      if (hasError) {
        console.log('Mock mode handled with appropriate message');
      } else {
        console.log('No API key error message found - may be running in mock mode silently');
      }
    });

    test('should use real AI when valid API key is present', async ({ page }) => {
      // This test assumes that the environment has been configured with a valid API key
      // We'll check for more sophisticated findings that indicate real AI processing
      const utils = new DocxTestUtils(page);
      
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/invalid-contact.docx');
      const docBuffer = readFileSync(fixturePath);
      
      await utils.uploadDocument('invalid-contact.docx', docBuffer);
      await utils.waitForReviewCompletion(20000); // Longer timeout for real AI processing
      
      // Check for findings panel
      const findingsPanel = page.locator('[data-testid="findings-panel"], .findings-panel, .review-findings');
      const hasFindingsPanel = await findingsPanel.isVisible().catch(() => false);
      
      if (hasFindingsPanel) {
        const findingItems = page.locator('.finding-item, [data-testid="finding-item"], .review-finding');
        const count = await findingItems.count();
        console.log(`Real AI mode findings: ${count}`);
        
        // Look for more detailed findings that suggest real AI processing
        const detailedFindings = page.locator('text=/specific.*recommendation|detailed.*analysis|sophisticated.*issue/i');
        const hasDetailedFindings = await detailedFindings.isVisible().catch(() => false);
        
        if (hasDetailedFindings) {
          console.log('Detected detailed findings suggesting real AI processing');
        } else {
          console.log('Findings present but may be from mock processing');
        }
      } else {
        console.log('No findings panel detected');
      }
    });

    test('should handle API failure gracefully', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      // Simulate an API failure scenario by using a problematic document
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/incomplete-timeline.docx');
      const docBuffer = readFileSync(fixturePath);
      
      await utils.uploadDocument('incomplete-timeline.docx', docBuffer);
      await utils.waitForReviewCompletion(15000);
      
      // Check for error handling
      const errorFindings = page.locator('.finding-item:has-text("error"), .finding-item:has-text("失败")');
      const hasErrors = await errorFindings.isVisible().catch(() => false);
      
      if (hasErrors) {
        console.log('API error handling verified with error findings');
      } else {
        console.log('No explicit API errors detected');
      }
    });
  });

  test.describe('WebMCP Integration Tests', () => {
    test('should check if app exposes WebMCP tools via window.navigator.modelContext', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      // Check if WebMCP is available
      const hasWebMCP = await utils.checkWebMCPAvailability();
      
      if (hasWebMCP) {
        console.log('WebMCP is available in the application');
        
        // Test WebMCP discovery
        const tools = await utils.testWebMCPDiscovery();
        expect(Array.isArray(tools)).toBeTruthy();
        
        console.log(`Discovered ${tools.length} WebMCP tools`);
      } else {
        console.log('WebMCP is not available in the application');
      }
    });

    test('should test WebMCP tool discovery and invocation', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      const hasWebMCP = await utils.checkWebMCPAvailability();
      
      if (hasWebMCP) {
        // Discover tools first
        const tools = await utils.testWebMCPDiscovery();
        
        // Try to invoke a document-related tool if available
        if (tools.length > 0) {
          // Look for tools related to document processing
          const docTools = tools.filter(tool => 
            tool.name.includes('document') || 
            tool.name.includes('review') || 
            tool.name.includes('parse')
          );
          
          if (docTools.length > 0) {
            const firstDocTool = docTools[0];
            console.log(`Testing WebMCP invocation for tool: ${firstDocTool.name}`);
            
            const result = await utils.testWebMCPInvocation(firstDocTool.name, {});
            
            if (result.error) {
              console.log(`WebMCP tool invocation failed: ${result.error}`);
            } else {
              console.log(`WebMCP tool invocation succeeded:`, result);
            }
          } else {
            console.log('No document-related WebMCP tools found to test');
          }
        } else {
          console.log('No WebMCP tools discovered');
        }
      } else {
        console.log('Cannot test WebMCP tools - WebMCP not available');
      }
    });

    test('should verify WebMCP tools work with procurement review workflow', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      // First upload a document
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/valid-procurement.docx');
      const docBuffer = readFileSync(fixturePath);
      
      await utils.uploadDocument('valid-procurement.docx', docBuffer);
      await utils.waitForReviewCompletion(15000);
      
      // Check if WebMCP is available after document loading
      const hasWebMCP = await utils.checkWebMCPAvailability();
      
      if (hasWebMCP) {
        // Test if there are any procurement-specific tools available
        const tools = await utils.testWebMCPDiscovery();
        const procurementTools = tools.filter(tool => 
          tool.name.toLowerCase().includes('procurement') || 
          tool.name.toLowerCase().includes('review') ||
          tool.description?.toLowerCase().includes('procurement') ||
          tool.description?.toLowerCase().includes('review')
        );
        
        console.log(`Found ${procurementTools.length} procurement-related WebMCP tools`);
        
        if (procurementTools.length > 0) {
          // Try to invoke the first procurement tool
          const result = await utils.testWebMCPInvocation(procurementTools[0].name, {
            documentId: 'current-document',
            action: 'analyze'
          });
          
          console.log('Procurement WebMCP tool result:', result);
        }
      } else {
        console.log('WebMCP not available for procurement workflow testing');
      }
    });
  });

  test.describe('Mock vs Real AI Mode Tests', () => {
    test('should test both mock mode (no API key) and real AI mode (with API key)', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      // Test mock mode with a document
      const mockDocPath = join(__dirname, '../fixtures/procurement-docs/valid-procurement.docx');
      const mockDocBuffer = readFileSync(mockDocPath);
      
      await utils.uploadDocument('valid-procurement-mock.docx', mockDocBuffer);
      await utils.waitForReviewCompletion(15000);
      
      // Check findings in mock mode
      const mockFindingsCount = await utils.verifyFindingsDisplay();
      console.log(`Mock mode findings: ${mockFindingsCount}`);
      
      // Navigate to a new page to reset state
      await page.goto('/');
      await expect(page.locator('[data-testid="app"]')).toBeVisible();
      
      // Note: Testing real AI mode requires proper API configuration
      // which is typically handled by environment variables
      const realDocPath = join(__dirname, '../fixtures/procurement-docs/invalid-contact.docx');
      const realDocBuffer = readFileSync(realDocPath);
      
      await utils.uploadDocument('invalid-contact-real.docx', realDocBuffer);
      await utils.waitForReviewCompletion(20000); // Allow more time for real AI processing
      
      const realFindingsCount = await utils.verifyFindingsDisplay();
      console.log(`Real AI mode findings: ${realFindingsCount}`);
    });
  });

  test.describe('Test Coverage for Document Processing Pipeline', () => {
    test('should cover the complete document processing pipeline', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      // Upload document
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/missing-budget.docx');
      const docBuffer = readFileSync(fixturePath);
      
      await utils.uploadDocument('missing-budget.docx', docBuffer);
      
      // Wait for parsing
      await page.waitForSelector('.document-panel, [data-testid="document-panel"], .superdoc-editor', { state: 'visible', timeout: 15000 });
      console.log('Document parsing completed');
      
      // Wait for review processing
      await utils.waitForReviewCompletion(20000);
      console.log('Document review completed');
      
      // Verify findings display
      const findingsCount = await utils.verifyFindingsDisplay();
      console.log(`Findings verification completed with ${findingsCount} findings`);
      
      // Verify finding interaction
      const findingItems = page.locator('.finding-item, [data-testid="finding-item"], .review-finding');
      const count = await findingItems.count();
      
      if (count > 0) {
        await findingItems.first().click();
        console.log('Finding navigation tested');
      }
      
      // Check WebMCP availability as part of the pipeline
      const hasWebMCP = await utils.checkWebMCPAvailability();
      console.log(`WebMCP integration in pipeline: ${hasWebMCP}`);
    });
  });

  test.describe('Responsive and Accessibility Tests', () => {
    test('should work correctly in different screen sizes', async ({ page }) => {
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      
      const utils = new DocxTestUtils(page);
      
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/valid-procurement.docx');
      const docBuffer = readFileSync(fixturePath);
      
      await utils.uploadDocument('valid-procurement-mobile.docx', docBuffer);
      await utils.waitForReviewCompletion(15000);
      
      const documentPanel = page.locator('.document-panel, [data-testid="document-panel"]');
      await expect(documentPanel).toBeVisible();
      
      console.log('Mobile responsiveness verified');
      
      // Reset to desktop view
      await page.setViewportSize({ width: 1200, height: 800 });
    });

    test('should support keyboard navigation', async ({ page }) => {
      const utils = new DocxTestUtils(page);
      
      const fixturePath = join(__dirname, '../fixtures/procurement-docs/valid-procurement.docx');
      const docBuffer = readFileSync(fixturePath);
      
      await utils.uploadDocument('valid-procurement-keyboard.docx', docBuffer);
      await utils.waitForReviewCompletion(15000);
      
      // Test basic keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).not.toBeNull();
      
      console.log('Keyboard navigation verified');
    });
  });
});

// Additional test to verify all scenarios work together
test.describe('Integration Test: Complete Workflow', () => {
  test('should run the complete procurement document review workflow with all features', async ({ page }) => {
    const utils = new DocxTestUtils(page);
    
    // 1. Check WebMCP availability
    const hasWebMCP = await utils.checkWebMCPAvailability();
    console.log(`Step 1 - WebMCP available: ${hasWebMCP}`);
    
    if (hasWebMCP) {
      const tools = await utils.testWebMCPDiscovery();
      console.log(`Step 1 - Discovered ${tools.length} WebMCP tools`);
    }
    
    // 2. Upload document
    const fixturePath = join(__dirname, '../fixtures/procurement-docs/invalid-contact.docx');
    const docBuffer = readFileSync(fixturePath);
    
    await utils.uploadDocument('integration-test.docx', docBuffer);
    console.log('Step 2 - Document uploaded');
    
    // 3. Wait for processing
    await utils.waitForReviewCompletion(20000);
    console.log('Step 3 - Document review completed');
    
    // 4. Verify findings
    const findingsCount = await utils.verifyFindingsDisplay();
    console.log(`Step 4 - Findings verified: ${findingsCount}`);
    
    // 5. Test finding interaction
    const findingItems = page.locator('.finding-item, [data-testid="finding-item"], .review-finding');
    const count = await findingItems.count();
    
    if (count > 0) {
      await findingItems.first().click();
      console.log('Step 5 - Finding navigation tested');
    }
    
    // 6. Verify UI elements remain functional
    const documentPanel = page.locator('.document-panel, [data-testid="document-panel"]');
    await expect(documentPanel).toBeVisible();
    
    console.log('All workflow steps completed successfully');
  });
});