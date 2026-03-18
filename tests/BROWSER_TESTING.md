# Running Browser and WebMCP Tests

This document explains how to run the comprehensive browser and WebMCP tests for the DOCX-AI-Editor.

## Prerequisites

- Node.js/Bun installed
- Playwright browsers installed: `npx playwright install`
- The application should be built or have a development server running

## Running the Tests

### Basic Test Execution

```bash
# Run all Playwright tests in headless mode
bun run test:e2e

# Run tests in headed mode (to see the browser)
bun run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/browser-tests.spec.js
```

### Test Configuration

The tests are configured in `playwright.config.js` and will:

- Start the development server automatically
- Run tests in Chromium, Firefox, and WebKit browsers
- Take screenshots on failures
- Record traces for debugging

## API Key Configuration

The tests cover both mock and real AI modes:

### Mock Mode (No API Key Required)
- Set environment variable: `OPENROUTER_API_KEY=""` or don't set it
- The app will use mock responses
- Tests will run without external API calls

### Real AI Mode (With Valid API Key)
- Set environment variable: `OPENROUTER_API_KEY="your-valid-api-key"`
- The app will use real AI processing
- Tests will make actual API calls (costs may apply)

## WebMCP Testing Requirements

To test WebMCP functionality:

1. Ensure your browser supports WebMCP (Chrome with appropriate flags or experimental support)
2. The application should expose WebMCP tools via `window.navigator.modelContext`
3. WebMCP tools should be implemented in the application code

## Test Structure

The tests are organized into several categories:

### Document Processing Tests
- Document upload with real DOCX files
- Document parsing and segment extraction
- Editor loading verification

### Findings Tests
- Findings display after review
- Finding navigation and interaction
- Multiple finding handling

### AI Service Tests
- Mock mode functionality
- Real AI mode functionality  
- Error handling for API failures

### WebMCP Integration Tests
- WebMCP availability detection
- Tool discovery
- Tool invocation
- Procurement workflow integration

### Integration Tests
- Complete end-to-end workflow
- Cross-feature functionality
- Responsive design verification

## Common Issues and Troubleshooting

### Test Timeout Errors
- Increase timeout values in the test configuration
- Ensure sufficient processing time for document analysis
- Check that the development server is responsive

### Missing Test Documents
- Ensure test fixtures are in `tests/fixtures/procurement-docs/`
- Verify document files exist and are readable

### WebMCP Not Available
- Check browser compatibility
- Verify WebMCP implementation in the application
- Look for WebMCP polyfills if needed

## Development Workflow

When developing new tests:

1. Add new test cases to `tests/e2e/browser-tests.spec.js`
2. Use the `DocxTestUtils` class for common operations
3. Follow the existing test patterns and structure
4. Ensure tests are independent and deterministic
5. Test both positive and negative scenarios

## Continuous Integration

The tests can be integrated into CI/CD pipelines:

```bash
# Install dependencies
bun install

# Install Playwright browsers
npx playwright install --with-deps

# Run tests
bun run test:e2e
```

## Performance Considerations

- Tests include appropriate wait strategies for asynchronous operations
- Document processing may take time; adjust timeouts accordingly
- Real AI mode tests may take longer due to API calls
- Mock mode tests should run faster