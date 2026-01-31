#!/usr/bin/env node
import { ConfluenceService } from '../service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const confluence = new ConfluenceService();

// Test configuration
const TEST_SPACE_KEY = 'GORA';
const TEST_PAGE_ID = '6404279544'; // 指定されたテストページID

// Check if write tests should be run
const ENABLE_WRITE_TESTS = process.argv.includes('-w') || process.argv.includes('--write');

async function runTests() {
  console.log('='.repeat(60));
  console.log('Confluence MCP Server - Local Testing');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Test 1: Get current user info
    console.log('Test 1: Get current user info');
    console.log('-'.repeat(60));
    const userInfo = await confluence.getCurrentUserInfo();
    console.log('✓ User:', userInfo.displayName || userInfo.username);
    console.log('');

    // Test 2: Get specified test page
    console.log('Test 2: Get specified test page');
    console.log('-'.repeat(60));
    const pageContent1 = await confluence.getPageContent(TEST_PAGE_ID, {
      convertToMarkdown: false
    });
    const textContent1 = pageContent1.find(item => item.type === 'text') as any;
    if (!textContent1) {
      throw new Error('No text content found in page');
    }
    const pageData1 = JSON.parse(textContent1.text);
    const TEST_PAGE_TITLE = pageData1.title;
    
    console.log('✓ Test page:', TEST_PAGE_TITLE);
    console.log('✓ Page ID:', TEST_PAGE_ID);
    console.log('✓ URL: <your-confluence-server>/confluence/pages/?pageId=' + TEST_PAGE_ID);
    console.log('');

    // Test 3: Get page content (HTML format)
    console.log('Test 3: Get page content (HTML format)');
    console.log('-'.repeat(60));
    const pageContent = await confluence.getPageContent(TEST_PAGE_ID, {
      convertToMarkdown: false
    });
    const textContent = pageContent.find(item => item.type === 'text') as any;
    if (!textContent) {
      throw new Error('No text content found in page content result');
    }
    const pageData = JSON.parse(textContent.text);
    console.log('✓ Page ID:', pageData.id || 'N/A');
    console.log('✓ Title:', pageData.title || 'N/A');
    console.log('✓ Version:', pageData.version?.number || 'N/A');
    console.log('✓ Content length:', (pageData.body || '').length, 'characters');
    console.log('');

    // Test 4: Get page content in Markdown
    console.log('Test 4: Get page content (Markdown format)');
    console.log('-'.repeat(60));
    const pageMarkdown = await confluence.getPageContent(TEST_PAGE_ID, {
      convertToMarkdown: true
    });
    const textMdContent = pageMarkdown.find(item => item.type === 'text') as any;
    if (!textMdContent) {
      throw new Error('No text content found in markdown result');
    }
    const pageMdData = JSON.parse(textMdContent.text);
    console.log('✓ Title:', pageMdData.title || 'N/A');
    console.log('✓ Markdown content length:', (pageMdData.body || '').length, 'characters');
    console.log('');

    // Test 5: Get page ancestors
    console.log('Test 5: Get page ancestors');
    console.log('-'.repeat(60));
    const ancestors = await confluence.getPageAncestors(TEST_PAGE_ID);
    console.log('✓ Ancestors count:', ancestors.length);
    if (ancestors.length > 0) {
      console.log('✓ Parent page:', ancestors[ancestors.length - 1].title);
    }
    console.log('');

    // Test 6: Get page by title
    console.log('Test 6: Get page by title');
    console.log('-'.repeat(60));
    const pageByTitle = await confluence.getPageByTitle(
      TEST_SPACE_KEY,
      TEST_PAGE_TITLE
    );
    if (pageByTitle) {
      console.log('✓ Found page:', pageByTitle.title);
      console.log('✓ Page ID:', pageByTitle.id);
    } else {
      console.log('✗ Page not found');
    }
    console.log('');

    // Test 7: Get page children
    console.log('Test 7: Get page children');
    console.log('-'.repeat(60));
    const children = await confluence.getPageChildren(TEST_PAGE_ID, 0, 5);
    console.log('✓ Children count:', children.length);
    if (children.length > 0) {
      children.forEach((child, idx) => {
        console.log(`  ${idx + 1}. ${child.title} (${child.id})`);
      });
    }
    console.log('');

    // Test 8: Search content
    console.log('Test 8: Search content');
    console.log('-'.repeat(60));
    const searchResults = await confluence.search('type=page AND space=GORA', {
      limit: 5
    });
    console.log('✓ Search results:', searchResults.length);
    searchResults.forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.title}`);
    });
    console.log('');

    // Test 9: Get page comments
    console.log('Test 9: Get page comments');
    console.log('-'.repeat(60));
    const comments = await confluence.getPageComments(TEST_PAGE_ID);
    console.log('✓ Comments count:', comments.length);
    if (comments.length > 0) {
      console.log(`  Latest comment by: ${comments[0].createdBy.displayName}`);
    }
    console.log('');

    // Test 10: Get page labels
    console.log('Test 10: Get page labels');
    console.log('-'.repeat(60));
    const labels = await confluence.getPageLabels(TEST_PAGE_ID);
    console.log('✓ Labels count:', labels.length);
    if (labels.length > 0) {
      labels.forEach((label, idx) => {
        console.log(`  ${idx + 1}. ${label.name}`);
      });
    }
    console.log('');

    // Test 11: Get spaces
    console.log('Test 11: Get spaces (first 5)');
    console.log('-'.repeat(60));
    const spaces = await confluence.getSpaces(0, 5);
    console.log('✓ Spaces count:', spaces.length);
    spaces.forEach((space, idx) => {
      console.log(`  ${idx + 1}. ${space.name} (${space.key})`);
    });
    console.log('');

    // Test 12: Get page attachments
    console.log('Test 12: Get page attachments');
    console.log('-'.repeat(60));
    const attachments = await confluence.getPageAttachments(TEST_PAGE_ID);
    console.log('✓ Attachments count:', attachments.length);
    if (attachments.length > 0) {
      attachments.forEach((att, idx) => {
        console.log(`  ${idx + 1}. ${att.title}`);
      });
    }
    console.log('');

    // Test 13: Search user
    console.log('Test 13: Search user');
    console.log('-'.repeat(60));
    const userSearchResults = await confluence.searchUser('user~kei');
    console.log('✓ User search results:', userSearchResults.length);
    if (userSearchResults.length > 0) {
      userSearchResults.forEach((user, idx) => {
        console.log(`  ${idx + 1}. ${user.displayName} (${user.username})`);
      });
    }
    console.log('');

    // Test 14: Get user contributed spaces
    console.log('Test 14: Get user contributed spaces');
    console.log('-'.repeat(60));
    const contributedSpaces = await confluence.getUserContributedSpaces();
    console.log('✓ Contributed spaces count:', contributedSpaces.length);
    if (contributedSpaces.length > 0) {
      contributedSpaces.slice(0, 5).forEach((space, idx) => {
        console.log(`  ${idx + 1}. ${space.name} (${space.key})`);
      });
    }
    console.log('');

    // Test 15: Get user details by username
    console.log('Test 15: Get user details by username');
    console.log('-'.repeat(60));
    const testUsername = userInfo.username;
    const userDetails = await confluence.getUserDetailsByUsername(testUsername);
    console.log('✓ User details retrieved');
    console.log('✓ Display name:', userDetails.displayName);
    console.log('✓ Email:', userDetails.email || 'N/A');
    console.log('✓ User key:', userDetails.userKey || 'N/A');
    console.log('');

    // WRITE TESTS (only if -w flag is provided)
    if (ENABLE_WRITE_TESTS) {
      console.log('='.repeat(60));
      console.log('WRITE TESTS - Modifying Test Page');
      console.log('='.repeat(60));
      console.log('');

      // Test 16: Add a comment
      console.log('Test 16: Add a comment (Markdown)');
      console.log('-'.repeat(60));
      const testComment = `**Test Comment** - Generated at ${new Date().toISOString()}\n\nThis is a test comment from MCP server local testing.`;
      const addedComment = await confluence.addComment(TEST_PAGE_ID, testComment, true);
      console.log('✓ Comment added successfully');
      console.log('✓ Comment ID:', addedComment.id);
      console.log('');

      // Test 17: Add a label
      console.log('Test 17: Add a label');
      console.log('-'.repeat(60));
      const testLabel = `mcp-test-${Date.now()}`;
      const updatedLabels = await confluence.addPageLabel(TEST_PAGE_ID, testLabel);
      console.log('✓ Label added successfully');
      console.log('✓ Total labels:', updatedLabels.length);
      console.log('');

      // Test 18: Update page (append mode)
      console.log('Test 18: Update page (append mode)');
      console.log('-'.repeat(60));
      const appendContent = `<h2>MCP Test Section - ${new Date().toISOString()}</h2>\n<p>This section was added by MCP server local testing using <strong>append mode</strong>.</p>\n<ul>\n<li>Test item 1</li>\n<li>Test item 2</li>\n<li>Test item 3</li>\n</ul>`;
      
      const updatedPage = await confluence.updatePage({
        pageId: TEST_PAGE_ID,
        title: TEST_PAGE_TITLE,
        body: appendContent,
        updateMode: 'append',
        versionComment: 'MCP local test - append mode',
        isMinorEdit: true,
        isMarkdown: false
      });
      console.log('✓ Page updated successfully (append mode)');
      console.log('✓ New version:', updatedPage.version.number);
      console.log('');

      // Test 19: Attach a file
      console.log('Test 19: Attach a file');
      console.log('-'.repeat(60));

      // Create a unique test file with timestamp
      const timestamp = Date.now();
      const testFileName = `test-attachment-${timestamp}.txt`;
      const testFileContent = `Test attachment created at ${new Date().toISOString()}\n\nThis file was created by the Confluence MCP server test.`;
      const fs = await import('fs');
      fs.writeFileSync(testFileName, testFileContent);

      let attachedFile: any;
      try {
        attachedFile = await confluence.attachFile(
          TEST_PAGE_ID,
          `./${testFileName}`,
          'Test attachment from MCP server'
        );
        console.log('✓ File attached successfully');
        console.log('✓ Attachment ID:', attachedFile.id);
        console.log('✓ File name:', attachedFile.title);
      } finally {
        // Clean up the temporary test file
        fs.unlinkSync(testFileName);
      }
      console.log('');

      // Test 20: Create a new page
      console.log('Test 20: Create a new page');
      console.log('-'.repeat(60));
      const newPageTitle = `MCP Test Page - ${new Date().toISOString()}`;
      const newPageContent = `# Test Page from MCP

This page was created by the Confluence MCP server during local testing.

## Features Tested
- Page creation
- Markdown to HTML conversion
- Setting parent page

## Test Results
All tests passed successfully!

**Created at:** ${new Date().toISOString()}`;

      const createdPage = await confluence.createPage({
        spaceKey: TEST_SPACE_KEY,
        title: newPageTitle,
        body: newPageContent,
        parentId: TEST_PAGE_ID,
        isMarkdown: true
      });
      console.log('✓ Page created successfully');
      console.log('✓ New page ID:', createdPage.id);
      console.log('✓ New page URL:', createdPage.url);
      console.log('');

      console.log('='.repeat(60));
      console.log('All tests completed successfully! ✓');
      console.log('='.repeat(60));
      console.log('');
      console.log('Summary:');
      console.log('- READ operations: All passed');
      console.log('- WRITE operations: All passed');
      console.log(`- Test page ID: ${TEST_PAGE_ID}`);
      console.log(`- Test page URL: <your-confluence-server>/confluence/pages/?pageId=${TEST_PAGE_ID}`);
      console.log(`- New page created: ${createdPage.id}`);
      console.log(`- Comment added: ${addedComment.id}`);
      console.log(`- Label added: ${testLabel}`);
      console.log(`- File attached: ${attachedFile.id}`);
      console.log('');
    } else {
      console.log('='.repeat(60));
      console.log('All READ tests completed successfully! ✓');
      console.log('='.repeat(60));
      console.log('');
      console.log('Summary:');
      console.log('- READ operations: All passed');
      console.log('- WRITE operations: Skipped (use -w or --write flag to enable)');
      console.log(`- Test page ID: ${TEST_PAGE_ID}`);
      console.log(`- Test page URL: <your-confluence-server>/confluence/pages/?pageId=${TEST_PAGE_ID}`);
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('✗ Test failed with error:');
    console.error('-'.repeat(60));
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// Run tests
runTests();