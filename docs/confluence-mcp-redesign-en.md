# Confluence MCP Server Redesign Document

## Overview

This document outlines the complete redesign of the TypeScript implementation in `src/confluence`, referencing the Python implementation in `src/referer/confluence`.

## Objectives

- Migrate all features from Python implementation to TypeScript
- Maintain existing file structure and Node.js runtime environment
- Completely replace MCP Server functionality
- **Delete all existing tools and achieve complete alignment with Python implementation**

## Python Implementation Feature Analysis

### 1. pages.py (Page Operations)
- `get_page_content` - Get page content (with Markdown conversion option)
- `get_page_ancestors` - Get page ancestors (parent pages)
- `get_page_by_title` - Search page by title
- `get_space_pages` - Get all pages from a space
- `create_page` - Create new page (Markdown support)
- `update_page` - Update page (with version management)
- `get_page_children` - Get child pages
- `delete_page` - Delete page

### 2. search.py (Search Operations)
- `search` - CQL (Confluence Query Language) search
- `search_user` - User search

### 3. comments.py (Comment Operations)
- `get_page_comments` - Get page comments list
- `add_comment` - Add comment (Markdown → Storage format conversion)

### 4. spaces.py (Space Operations)
- `get_spaces` - Get all spaces
- `get_user_contributed_spaces` - Get spaces the user contributed to

### 5. labels.py (Label Operations)
- `get_page_labels` - Get page labels list
- `add_page_label` - Add label to page

### 6. users.py (User Operations)
- `get_user_details_by_accountid` - Get user details by account ID
- `get_user_details_by_username` - Get user details by username
- `get_current_user_info` - Get current user information

## New Design (Complete Alignment with Python Implementation)

### MCP Tools List (22 tools)

#### Page Operations (Pages) - 8 Tools
1. `confluence_get_page_content` - Get page content
2. `confluence_get_page_ancestors` - Get page ancestors
3. `confluence_get_page_by_title` - Search page by title
4. `confluence_get_space_pages` - Get pages from space
5. `confluence_create_page` - Create page
6. `confluence_update_page` - Update page
7. `confluence_get_page_children` - Get child pages
8. `confluence_delete_page` - Delete page

#### Search Operations (Search) - 2 Tools
9. `confluence_search` - CQL search
10. `confluence_search_user` - User search

#### Comment Operations (Comments) - 2 Tools
11. `confluence_get_page_comments` - Get comments
12. `confluence_add_comment` - Add comment

#### Space Operations (Spaces) - 2 Tools
13. `confluence_get_spaces` - Get spaces list
14. `confluence_get_user_contributed_spaces` - Get user contributed spaces

#### Label Operations (Labels) - 2 Tools
15. `confluence_get_page_labels` - Get page labels
16. `confluence_add_page_label` - Add page label

#### User Operations (Users) - 3 Tools
17. `confluence_get_user_details_by_accountid` - Get user by account ID
18. `confluence_get_user_details_by_username` - Get user by username
19. `confluence_get_current_user_info` - Get current user info

#### Attachment Operations (Attachments) - 3 Tools
20. `confluence_get_page_attachments` - Get page attachments list
21. `confluence_attach_file` - Attach file
22. `confluence_delete_attachment` - Delete attachment

### File Structure (Unchanged)

```
src/confluence/
├── index.ts       # MCP server entry point
├── service.ts     # Confluence service class
└── types.ts       # Type definitions
```

### Type Definitions (types.ts)

Type definitions aligned with Python implementation:

```typescript
// Page types
export interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  status: string;
  space: {
    key: string;
    name: string;
  };
  version: {
    number: number;
    when: string;
  };
  content?: string;
  contentFormat?: 'storage' | 'markdown';
  url: string;
}

// Search result types
export interface SearchResult {
  id: string;
  title: string;
  type: string;
  excerpt: string;
  url: string;
  space?: {
    key: string;
    name: string;
  };
}

// Comment types
export interface ConfluenceComment {
  id: string;
  title: string;
  body: string;
  created: string;
  createdBy: {
    accountId: string;
    displayName: string;
  };
  version: {
    number: number;
  };
}

// Space types
export interface ConfluenceSpace {
  key: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  homepage?: {
    id: string;
  };
}

// Label types
export interface ConfluenceLabel {
  id: string;
  name: string;
  prefix: string;
}

// User types
export interface ConfluenceUser {
  accountId: string;
  accountType: string;
  email?: string;
  publicName: string;
  displayName: string;
  active: boolean;
}

// Attachment types
export interface ConfluenceAttachment {
  id: string;
  title: string;
  mediaType: string;
  fileSize: number;
  comment?: string;
  created: string;
  downloadUrl: string;
}

// Page creation/update options
export interface PageOptions {
  convertToMarkdown?: boolean;
  isMarkdown?: boolean;
  enableHeadingAnchors?: boolean;
  contentRepresentation?: 'storage' | 'wiki';
}

// Search options
export interface SearchOptions {
  limit?: number;
  start?: number;
  spacesFilter?: string;
}

// Page creation input
export interface CreatePageInput {
  spaceKey: string;
  title: string;
  body: string;
  parentId?: string;
  isMarkdown?: boolean;
  enableHeadingAnchors?: boolean;
}

// Page update input
export interface UpdatePageInput {
  pageId: string;
  title: string;
  body: string;
  isMinorEdit?: boolean;
  versionComment?: string;
  isMarkdown?: boolean;
  parentId?: string;
  enableHeadingAnchors?: boolean;
}
```

### Service Class (service.ts)

Implementation of all methods from Python:

```typescript
export class ConfluenceService {
  // Page operations
  async getPageContent(pageId: string, options?: PageOptions): Promise<ConfluencePage>
  async getPageAncestors(pageId: string): Promise<ConfluencePage[]>
  async getPageByTitle(spaceKey: string, title: string, options?: PageOptions): Promise<ConfluencePage | null>
  async getSpacePages(spaceKey: string, start?: number, limit?: number, options?: PageOptions): Promise<ConfluencePage[]>
  async createPage(input: CreatePageInput): Promise<ConfluencePage>
  async updatePage(input: UpdatePageInput): Promise<ConfluencePage>
  async getPageChildren(pageId: string, start?: number, limit?: number, options?: PageOptions): Promise<ConfluencePage[]>
  async deletePage(pageId: string): Promise<boolean>

  // Search operations
  async search(cql: string, options?: SearchOptions): Promise<SearchResult[]>
  async searchUser(cql: string, limit?: number): Promise<ConfluenceUser[]>

  // Comment operations
  async getPageComments(pageId: string, returnMarkdown?: boolean): Promise<ConfluenceComment[]>
  async addComment(pageId: string, content: string): Promise<ConfluenceComment>

  // Space operations
  async getSpaces(start?: number, limit?: number): Promise<ConfluenceSpace[]>
  async getUserContributedSpaces(limit?: number): Promise<Record<string, ConfluenceSpace>>

  // Label operations
  async getPageLabels(pageId: string): Promise<ConfluenceLabel[]>
  async addPageLabel(pageId: string, labelName: string): Promise<ConfluenceLabel[]>

  // User operations
  async getUserDetailsByAccountId(accountId: string, expand?: string): Promise<ConfluenceUser>
  async getUserDetailsByUsername(username: string, expand?: string): Promise<ConfluenceUser>
  async getCurrentUserInfo(): Promise<ConfluenceUser>

  // Attachment operations
  async getPageAttachments(pageId: string, start?: number, limit?: number): Promise<ConfluenceAttachment[]>
  async attachFile(pageId: string, filePath: string, comment?: string): Promise<ConfluenceAttachment>
  async deleteAttachment(attachmentId: string): Promise<boolean>
}
```

## Implementation Priorities and Phase Details

### Phase 1: Core Features (Pages, Search) - 10 Tools

**Page Operations (8 Tools)**
1. `confluence_get_page_content` - Get page content
   - Parameters: page_id, convert_to_markdown?
2. `confluence_get_page_ancestors` - Get page ancestors
   - Parameters: page_id
3. `confluence_get_page_by_title` - Search page by title
   - Parameters: space_key, title, convert_to_markdown?
4. `confluence_get_space_pages` - Get pages from space
   - Parameters: space_key, start?, limit?, convert_to_markdown?
5. `confluence_create_page` - Create page
   - Parameters: space_key, title, body, parent_id?, is_markdown?, enable_heading_anchors?
6. `confluence_update_page` - Update page
   - Parameters: page_id, title, body, is_minor_edit?, version_comment?, is_markdown?, parent_id?
7. `confluence_get_page_children` - Get child pages
   - Parameters: page_id, start?, limit?, expand?, convert_to_markdown?
8. `confluence_delete_page` - Delete page
   - Parameters: page_id

**Search Operations (2 Tools)**
9. `confluence_search` - CQL search
   - Parameters: cql, limit?, spaces_filter?
10. `confluence_search_user` - User search
    - Parameters: cql, limit?

### Phase 2: Collaboration Features (Comments, Labels) - 4 Tools

**Comment Operations (2 Tools)**
11. `confluence_get_page_comments` - Get comments
    - Parameters: page_id, return_markdown?
12. `confluence_add_comment` - Add comment
    - Parameters: page_id, content

**Label Operations (2 Tools)**
15. `confluence_get_page_labels` - Get page labels
    - Parameters: page_id
16. `confluence_add_page_label` - Add page label
    - Parameters: page_id, label_name

### Phase 3: Management Features (Spaces, Users, Attachments) - 8 Tools

**Space Operations (2 Tools)**
13. `confluence_get_spaces` - Get spaces list
    - Parameters: start?, limit?
14. `confluence_get_user_contributed_spaces` - Get user contributed spaces
    - Parameters: limit?

**User Operations (3 Tools)**
17. `confluence_get_user_details_by_accountid` - Get user by account ID
    - Parameters: account_id, expand?
18. `confluence_get_user_details_by_username` - Get user by username
    - Parameters: username, expand?
19. `confluence_get_current_user_info` - Get current user info
    - Parameters: none

**Attachment Operations (3 Tools)**
20. `confluence_get_page_attachments` - Get page attachments list
    - Parameters: page_id, start?, limit?
21. `confluence_attach_file` - Attach file
    - Parameters: page_id, file_path, comment?
22. `confluence_delete_attachment` - Delete attachment
    - Parameters: attachment_id

## Important Implementation Notes

1. **Complete Replacement**: Delete all existing tools and achieve complete alignment with Python implementation
2. **Naming Convention**: Use Python function names as-is (snake_case), tool names with `confluence_` prefix
3. **Error Handling**: Faithfully reproduce Python implementation's error handling
4. **Authentication Errors**: Handle 401/403 errors appropriately
5. **Cloud/Server Support**: Consider differences between Cloud and Server (especially API v2 support)
6. **Markdown Conversion**: Support bidirectional conversion between Markdown and Confluence Storage format
7. **Image Processing**: Encode images in pages as base64 and return them
8. **CQL Filtering**: Filtering capability to exclude specific spaces
9. **Pagination**: Support pagination with start/limit parameters
10. **Version Management**: Manage version numbers when updating pages
11. **Content Processing**: Convert HTML to Markdown, preprocessing functionality
12. **OAuth Support**: Use v2 API when OAuth authentication is used

## Key Differences from Existing Implementation

### Removed Existing Tools (6 tools)
1. ~~`confluence_search_pages`~~ → Merged/expanded into `confluence_search`
2. ~~`confluence_get_page`~~ → Renamed and expanded to `confluence_get_page_content`
3. ~~`confluence_get_page_children`~~ → Reimplemented with expanded functionality
4. ~~`confluence_get_page_ancestors`~~ → Reimplemented with expanded functionality
5. ~~`confluence_create_page`~~ → Reimplemented with Markdown support
6. ~~`confluence_update_page`~~ → Reimplemented with version management

### Newly Added Major Features
- Bidirectional conversion between Markdown and Storage format
- User search and management functions
- Space management functions
- Label management functions
- Attachment management functions
- Enhanced comment management functions
- More detailed search options
- HTML preprocessing for content

## Markdown Conversion Feature Design

### Overview

In the Python implementation, the `preprocessor.py` module handles HTML↔Markdown conversion. The TypeScript implementation needs to provide equivalent functionality.

### Required Features

#### 1. HTML → Markdown Conversion (`process_html_content`)

**Purpose**: Convert HTML content to Markdown when retrieving pages

**Processing Flow**:
1. Receive Confluence Storage format HTML
2. Clean up HTML (remove unnecessary tags, normalize)
3. Convert relative URLs to absolute URLs
4. Convert HTML to Markdown
5. Process images (base64 encoding)

**Affected Functions**:
- `getPageContent()` - `convert_to_markdown` parameter
- `getPageByTitle()` - `convert_to_markdown` parameter
- `getSpacePages()` - `convert_to_markdown` parameter
- `getPageChildren()` - `convert_to_markdown` parameter
- `getPageComments()` - `return_markdown` parameter

#### 2. Markdown → Storage Format Conversion (`markdown_to_confluence_storage`)

**Purpose**: Convert Markdown to Confluence Storage format when creating/updating pages

**Processing Flow**:
1. Receive Markdown text
2. Parse Markdown
3. Convert to Confluence Storage format HTML
4. Generate heading anchors (optional)

**Affected Functions**:
- `createPage()` - `is_markdown` parameter
- `updatePage()` - `is_markdown` parameter
- `addComment()` - Automatic Markdown conversion by detection

#### 3. Image Processing

**Processing**:
- Base64 encode images in pages
- Return as MCP `ImageContent` type
- Download and convert images

### Required Libraries

```json
{
  "dependencies": {
    "turndown": "^7.1.2",
    "markdown-it": "^14.0.0",
    "jsdom": "^23.0.0"
  },
  "devDependencies": {
    "@types/turndown": "^5.0.4",
    "@types/markdown-it": "^13.0.7"
  }
}
```

### New File: `src/confluence/preprocessor.ts`

```typescript
import TurndownService from 'turndown';
import MarkdownIt from 'markdown-it';
import { JSDOM } from 'jsdom';

export class ContentPreprocessor {
  private turndown: TurndownService;
  private markdown: MarkdownIt;

  constructor() {
    // HTML → Markdown conversion settings
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    
    // Markdown → HTML conversion settings
    this.markdown = new MarkdownIt();
  }

  /**
   * Convert HTML content to Markdown
   */
  async processHtmlContent(
    html: string,
    spaceKey: string,
    baseUrl: string
  ): Promise<{ processedHtml: string; processedMarkdown: string }> {
    // Clean and normalize HTML
    const cleanedHtml = this.cleanHtml(html);
    
    // Convert relative URLs to absolute URLs
    const absoluteHtml = this.convertRelativeUrls(cleanedHtml, spaceKey, baseUrl);
    
    // Convert to Markdown
    const markdown = this.turndown.turndown(absoluteHtml);
    
    return {
      processedHtml: absoluteHtml,
      processedMarkdown: markdown,
    };
  }

  /**
   * Convert Markdown to Confluence Storage format
   */
  markdownToConfluenceStorage(
    markdown: string,
    enableHeadingAnchors: boolean = false
  ): string {
    // Convert Markdown to HTML
    let html = this.markdown.render(markdown);
    
    // Adapt to Storage format
    html = this.adaptToStorageFormat(html);
    
    // Add heading anchors (optional)
    if (enableHeadingAnchors) {
      html = this.addHeadingAnchors(html);
    }
    
    return html;
  }

  private cleanHtml(html: string): string {
    // HTML cleanup
    // Remove unnecessary tags and styles
    return html;
  }

  private convertRelativeUrls(html: string, spaceKey: string, baseUrl: string): string {
    // Convert relative URLs to absolute URLs
    return html;
  }

  private adaptToStorageFormat(html: string): string {
    // Adapt to Confluence Storage format
    return html;
  }

  private addHeadingAnchors(html: string): string {
    // Add anchors to headings
    return html;
  }
}
```

### Type Definition Extensions

Full use of existing `PageOptions`:

```typescript
export interface PageOptions {
  convertToMarkdown?: boolean;  // Enable HTML→Markdown conversion
  isMarkdown?: boolean;          // Enable Markdown→Storage conversion
  enableHeadingAnchors?: boolean; // Generate heading anchors
  contentRepresentation?: 'storage' | 'wiki'; // Content format
}
```

### Additional Parameters for Tools

#### Page Retrieval Tools

```javascript
{
  name: 'confluence_get_page_content',
  inputSchema: {
    properties: {
      page_id: { type: 'string' },
      convert_to_markdown: {
        type: 'boolean',
        default: true,
        description: 'Convert HTML to Markdown format'
      }
    }
  }
}
```

#### Page Creation/Update Tools

```javascript
{
  name: 'confluence_create_page',
  inputSchema: {
    properties: {
      space_key: { type: 'string' },
      title: { type: 'string' },
      body: { type: 'string' },
      is_markdown: {
        type: 'boolean',
        default: true,
        description: 'Whether body is in Markdown format'
      },
      enable_heading_anchors: {
        type: 'boolean',
        default: false,
        description: 'Generate heading anchors'
      }
    }
  }
}
```

## Summary

This design document outlines a plan to completely migrate all features from the Python implementation to TypeScript. All 6 existing tools will be deleted and replaced with 22 new tools. While maintaining the file structure and Node.js runtime environment, the MCP Server functionality will be completely renewed.

The addition of Markdown conversion features enables:
- Bidirectional conversion between HTML and Markdown
- User-friendly content input/output in Markdown format
- Automatic generation of heading anchors
- Base64 encoding of images