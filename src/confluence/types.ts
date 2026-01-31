import { ErrorResponse } from '../shared/types.js';

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
  /**
   * Update hint for MCP clients
   * @internal
   */
  _mcpUpdateHint?: string;
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
    username: string;
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
  username: string;
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

// Page update mode
export type PageUpdateMode = 'replace' | 'append' | 'prepend';

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
  updateMode?: PageUpdateMode; // 'replace' (default), 'append', or 'prepend'
}

// Internal types for backward compatibility
export interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

export interface TextContent {
  type: 'text';
  text: string;
}

export type PageContentResult = (TextContent | ImageContent)[];