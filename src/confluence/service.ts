import { HttpClient } from '../shared/http-client.js';
import { getConfluenceConfig, ServiceConfig } from '../shared/config.js';
import {
  ConfluencePage,
  SearchResult,
  PageOptions,
  SearchOptions,
  CreatePageInput,
  UpdatePageInput,
  ImageContent,
  TextContent,
  PageContentResult,
  ConfluenceComment,
  ConfluenceSpace,
  ConfluenceLabel,
} from './types.js';
import { ContentPreprocessor } from './preprocessor.js';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

export class ConfluenceService {
  private client: HttpClient;
  private preprocessor: ContentPreprocessor;
  private config: ServiceConfig;

  constructor() {
    this.config = getConfluenceConfig();
    this.client = new HttpClient(
      this.config.baseUrl,
      this.config.apiToken
    );
    this.preprocessor = new ContentPreprocessor();
  }

  // ========================================
  // Phase 1: Page Operations
  // ========================================

  /**
   * Get page content by ID
   * @param pageId - The Confluence page ID
   * @param options - Page options (convertToMarkdown, etc.)
   * @returns Page content result (text + images)
   */
  async getPageContent(
    pageId: string,
    options?: PageOptions
  ): Promise<PageContentResult> {
    const url = `/rest/api/content/${pageId}`;
    const response = await this.client.get<any>(url, {
      params: {
        expand: 'body.storage,body.export_view,version,space,children.attachment'
      },
    });

    const spaceKey = response.space?.key || '';
    let bodyHtml = response.body?.export_view?.value ||
                   response.body?.storage?.value || '';

    // Process content based on options
    if (options?.convertToMarkdown) {
      const baseUrl = this.config.baseUrl;
      bodyHtml = this.preprocessor.processPageContent(
        bodyHtml,
        true,
        baseUrl,
        options.enableHeadingAnchors
      );
    }

    // Create text content
    const textResult: TextContent = {
      type: 'text',
      text: JSON.stringify({
        id: response.id,
        title: response.title,
        type: response.type || 'page',
        status: response.status || 'current',
        space: {
          key: spaceKey,
          name: response.space?.name || spaceKey,
        },
        version: {
          number: response.version?.number || 1,
          when: response.version?.when || new Date().toISOString(),
        },
        body: bodyHtml,
        url: `${this.config.baseUrl}/pages/?pageId=${pageId}`,
      }),
    };

    // Get images if present
    const imageResults = await this.getPageImages(pageId, bodyHtml);

    return [textResult, ...imageResults];
  }

  /**
   * Get page ancestors (parent pages)
   * @param pageId - The Confluence page ID
   * @returns List of ancestor pages
   */
  async getPageAncestors(pageId: string): Promise<ConfluencePage[]> {
    try {
      const url = `/rest/api/content/${pageId}`;
      const response = await this.client.get<any>(url, {
        params: { expand: 'ancestors,space' },
      });

      const ancestors = response.ancestors || [];
      return ancestors.map((ancestor: any) => ({
        id: ancestor.id,
        title: ancestor.title,
        type: ancestor.type || 'page',
        status: ancestor.status || 'current',
        space: {
          key: response.space?.key || '',
          name: response.space?.name || '',
        },
        version: {
          number: ancestor.version?.number || 1,
          when: ancestor.version?.when || new Date().toISOString(),
        },
        url: `${this.config.baseUrl}/pages/?pageId=${ancestor.id}`,
      }));
    } catch (error) {
      throw new Error(`Failed to get page ancestors: ${(error as Error).message}`);
    }
  }

  /**
   * Get page by title from a space
   * @param spaceKey - The space key
   * @param title - The page title
   * @param options - Page options
   * @returns Page content or null if not found
   */
  async getPageByTitle(
    spaceKey: string,
    title: string,
    options?: PageOptions
  ): Promise<ConfluencePage | null> {
    try {
      const url = '/rest/api/content';
      const response = await this.client.get<any>(url, {
        params: {
          spaceKey,
          title,
          expand: 'body.storage,body.export_view,version,space',
        },
      });

      const results = response.results || [];
      if (results.length === 0) {
        return null;
      }

      const page = results[0];
      let bodyHtml = page.body?.export_view?.value ||
                     page.body?.storage?.value || '';

      // Process content based on options
      let contentFormat: 'storage' | 'markdown' = 'storage';
      if (options?.convertToMarkdown) {
        const baseUrl = this.config.baseUrl;
        bodyHtml = this.preprocessor.processPageContent(
          bodyHtml,
          true,
          baseUrl,
          options.enableHeadingAnchors
        );
        contentFormat = 'markdown';
      }

      const result: ConfluencePage = {
        id: page.id,
        title: page.title,
        type: page.type || 'page',
        status: page.status || 'current',
        space: {
          key: page.space?.key || spaceKey,
          name: page.space?.name || spaceKey,
        },
        version: {
          number: page.version?.number || 1,
          when: page.version?.when || new Date().toISOString(),
        },
        content: bodyHtml,
        contentFormat,
        url: `${this.config.baseUrl}/pages/?pageId=${page.id}`,
      };

      // Add MCP update hint for Markdown-converted content
      if (contentFormat === 'markdown') {
        result._mcpUpdateHint = 'IMPORTANT: This content is in Markdown format (converted from HTML for readability). To update this page, you MUST re-fetch with convertToMarkdown=false to get HTML, then use isMarkdown=false in updatePage. Do NOT use isMarkdown=true with this Markdown content.';
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all pages from a space
   * @param spaceKey - The space key
   * @param start - Starting index for pagination
   * @param limit - Maximum number of results
   * @param options - Page options
   * @returns List of pages
   */
  async getSpacePages(
    spaceKey: string,
    start: number = 0,
    limit: number = 25,
    options?: PageOptions
  ): Promise<ConfluencePage[]> {
    try {
      const url = '/rest/api/content';
      const response = await this.client.get<any>(url, {
        params: {
          spaceKey,
          type: 'page',
          start,
          limit,
          expand: 'body.storage,version,space',
        },
      });

      const results = response.results || [];
      const baseUrl = this.config.baseUrl;
      
      return results.map((page: any) => {
        let content = page.body?.storage?.value || '';
        let contentFormat: 'storage' | 'markdown' = 'storage';
        
        // Process content based on options
        if (options?.convertToMarkdown) {
          content = this.preprocessor.processPageContent(
            content,
            true,
            baseUrl,
            options.enableHeadingAnchors
          );
          contentFormat = 'markdown';
        }
        
        const result: ConfluencePage = {
          id: page.id,
          title: page.title,
          type: page.type || 'page',
          status: page.status || 'current',
          space: {
            key: page.space?.key || spaceKey,
            name: page.space?.name || spaceKey,
          },
          version: {
            number: page.version?.number || 1,
            when: page.version?.when || new Date().toISOString(),
          },
          content,
          contentFormat,
          url: `${baseUrl}/pages/?pageId=${page.id}`,
        };

        // Add MCP update hint for Markdown-converted content
        if (contentFormat === 'markdown') {
          result._mcpUpdateHint = 'IMPORTANT: This content is in Markdown format (converted from HTML for readability). To update this page, you MUST re-fetch with convertToMarkdown=false to get HTML, then use isMarkdown=false in updatePage. Do NOT use isMarkdown=true with this Markdown content.';
        }

        return result;
      });
    } catch (error) {
      throw new Error(`Failed to get space pages: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new page
   * @param input - Page creation input
   * @returns The created page
   */
  async createPage(input: CreatePageInput): Promise<ConfluencePage> {
    try {
      const url = '/rest/api/content/';
      
      // Process content based on format
      let bodyContent = input.body;
      if (input.isMarkdown) {
        bodyContent = this.preprocessor.processInputContent(input.body, true);
      }
      
      const data: any = {
        type: 'page',
        title: input.title,
        space: { key: input.spaceKey },
        body: {
          storage: {
            value: bodyContent,
            representation: 'storage',
          },
        },
      };

      if (input.parentId) {
        data.ancestors = [{ id: input.parentId }];
      }

      const response = await this.client.post<any>(url, data);

      return {
        id: response.id,
        title: response.title,
        type: response.type || 'page',
        status: response.status || 'current',
        space: {
          key: response.space?.key || input.spaceKey,
          name: response.space?.name || input.spaceKey,
        },
        version: {
          number: response.version?.number || 1,
          when: response.version?.when || new Date().toISOString(),
        },
        url: `${this.config.baseUrl}/pages/?pageId=${response.id}`,
      };
    } catch (error) {
      throw new Error(`Failed to create page: ${(error as Error).message}`);
    }
  }

  /**
   * Update an existing page
   * @param input - Page update input
   * @returns The updated page
   */
  async updatePage(input: UpdatePageInput): Promise<ConfluencePage> {
    try {
      // Validate input content format
      if (input.isMarkdown) {
        const validation = this.validateContentFormat(input.body, true);
        if (!validation.isValid) {
          console.warn(`Content format warning: ${validation.message}`);
          console.warn('Suggestion: Set is_markdown=false if content is HTML.');
        }
      }

      // Determine if we need to fetch existing content
      const updateMode = input.updateMode || 'replace';
      const needsExistingContent = updateMode === 'append' || updateMode === 'prepend';
      
      // Get current version and optionally existing content
      const expand = needsExistingContent ? 'version,body.storage' : 'version';
      const urlGet = `/rest/api/content/${input.pageId}?expand=${expand}`;
      const pageInfo = await this.client.get<any>(urlGet);
      
      const currentVersion = pageInfo.version?.number;
      if (currentVersion === undefined) {
        throw new Error('Could not retrieve current version number');
      }

      // Process new content based on format
      let newContent = input.body;
      if (input.isMarkdown) {
        try {
          newContent = this.preprocessor.processInputContent(input.body, true);
        } catch (conversionError) {
          throw new Error(
            `Failed to convert Markdown to HTML: ${(conversionError as Error).message}\n` +
            `Tip: If your content is already HTML, set is_markdown=false`
          );
        }
      }

      // Merge content based on update mode
      let finalContent = newContent;
      if (needsExistingContent) {
        const existingContent = pageInfo.body?.storage?.value || '';
        
        if (updateMode === 'append') {
          finalContent = existingContent + '\n' + newContent;
        } else if (updateMode === 'prepend') {
          finalContent = newContent + '\n' + existingContent;
        }
      }

      // Validate final content before sending
      const contentValidation = this.validateFinalContent(finalContent);
      if (!contentValidation.isValid) {
        throw new Error(
          `Content validation failed: ${contentValidation.message}\n` +
          `This may cause a 400 error from Confluence API.`
        );
      }

      // Update page
      const urlPut = `/rest/api/content/${input.pageId}`;
      const data: any = {
        id: input.pageId,
        type: 'page',
        title: input.title,
        version: { number: currentVersion + 1 },
        body: {
          storage: {
            value: finalContent,
            representation: 'storage',
          },
        },
      };

      if (input.versionComment) {
        data.version.message = input.versionComment;
      }

      if (input.isMinorEdit !== undefined) {
        data.version.minorEdit = input.isMinorEdit;
      }

      const response = await this.client.put<any>(urlPut, data);

      return {
        id: response.id,
        title: response.title,
        type: response.type || 'page',
        status: response.status || 'current',
        space: {
          key: response.space?.key || '',
          name: response.space?.name || '',
        },
        version: {
          number: response.version?.number || currentVersion + 1,
          when: response.version?.when || new Date().toISOString(),
        },
        url: `${this.config.baseUrl}/pages/?pageId=${response.id}`,
      };
    } catch (error) {
      // Enhanced error message with helpful suggestions
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        throw new Error(
          `Failed to update page: ${errorMessage}\n\n` +
          `Common causes:\n` +
          `1. is_markdown=true but content is HTML → Set is_markdown=false\n` +
          `2. Content contains escaped characters → Use raw HTML instead\n` +
          `3. Incomplete page content → Use updateMode='append' or 'prepend'\n` +
          `4. Invalid HTML structure → Verify HTML syntax\n\n` +
          `If you're adding content to an existing page:\n` +
          `- Set updateMode='append' to add content at the end\n` +
          `- Set updateMode='prepend' to add content at the beginning\n` +
          `- Or use updateMode='replace' (default) to replace entire content`
        );
      }
      throw new Error(`Failed to update page: ${errorMessage}`);
    }
  }

  /**
   * Validate content format
   */
  private validateContentFormat(content: string, isMarkdown: boolean): { isValid: boolean; message: string } {
    if (isMarkdown) {
      // Check if content contains HTML tags
      if (/<[a-z][\s\S]*>/i.test(content)) {
        return {
          isValid: false,
          message: 'Content contains HTML tags but is_markdown=true. HTML content should use is_markdown=false.'
        };
      }
      
      // Check for escaped characters
      if (/\\\\n|\\\\r|\\\\t/g.test(content)) {
        return {
          isValid: false,
          message: 'Content contains escaped characters. This may indicate it is not raw Markdown.'
        };
      }
    }
    
    return { isValid: true, message: 'Content format appears valid.' };
  }

  /**
   * Validate final content before sending to API
   */
  private validateFinalContent(content: string): { isValid: boolean; message: string } {
    // Check for empty content
    if (!content || content.trim().length === 0) {
      return {
        isValid: false,
        message: 'Content is empty or whitespace only.'
      };
    }

    // Check for excessively large content
    if (content.length > 10000000) { // 10MB limit
      return {
        isValid: false,
        message: 'Content exceeds maximum size limit (10MB).'
      };
    }

    return { isValid: true, message: 'Content is valid.' };
  }

  /**
   * Get child pages of a page
   * @param pageId - The parent page ID
   * @param start - Starting index for pagination
   * @param limit - Maximum number of results
   * @param expand - Fields to expand
   * @param options - Page options
   * @returns List of child pages
   */
  async getPageChildren(
    pageId: string,
    start: number = 0,
    limit: number = 25,
    expand: string = 'version',
    options?: PageOptions
  ): Promise<ConfluencePage[]> {
    try {
      const url = `/rest/api/content/${pageId}/child/page`;
      const response = await this.client.get<any>(url, {
        params: { start, limit, expand: `${expand},space,body.storage` },
      });

      const results = response.results || [];
      const baseUrl = this.config.baseUrl;
      
      return results.map((page: any) => {
        let content = page.body?.storage?.value || '';
        let contentFormat: 'storage' | 'markdown' = 'storage';
        
        // Process content based on options
        if (options?.convertToMarkdown && content) {
          content = this.preprocessor.processPageContent(
            content,
            true,
            baseUrl,
            options.enableHeadingAnchors
          );
          contentFormat = 'markdown';
        }
        
        const result: ConfluencePage = {
          id: page.id,
          title: page.title,
          type: page.type || 'page',
          status: page.status || 'current',
          space: {
            key: page.space?.key || '',
            name: page.space?.name || '',
          },
          version: {
            number: page.version?.number || 1,
            when: page.version?.when || new Date().toISOString(),
          },
          content,
          contentFormat,
          url: `${baseUrl}/pages/?pageId=${page.id}`,
        };

        // Add MCP update hint for Markdown-converted content
        if (contentFormat === 'markdown') {
          result._mcpUpdateHint = 'IMPORTANT: This content is in Markdown format (converted from HTML for readability). To update this page, you MUST re-fetch with convertToMarkdown=false to get HTML, then use isMarkdown=false in updatePage. Do NOT use isMarkdown=true with this Markdown content.';
        }

        return result;
      });
    } catch (error) {
      throw new Error(`Failed to get page children: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a page
   * @param pageId - The page ID to delete
   * @returns True if successful
   */
  async deletePage(pageId: string): Promise<boolean> {
    try {
      const url = `/rest/api/content/${pageId}`;
      await this.client.delete(url);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete page: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Phase 1: Search Operations
  // ========================================

  /**
   * Search content using CQL
   * @param cql - Confluence Query Language string
   * @param options - Search options
   * @returns List of search results
   */
  async search(cql: string, options?: SearchOptions): Promise<SearchResult[]> {
    try {
      const limit = options?.limit || 25;
      const start = options?.start || 0;

      // Apply spaces filter if provided
      let fullCql = cql;
      if (options?.spacesFilter) {
        const spaces = options.spacesFilter.split(',').map(s => s.trim());
        const spaceQuery = spaces.map(space => `space = "${space}"`).join(' OR ');
        fullCql = `(${cql}) AND (${spaceQuery})`;
      }

      const url = '/rest/api/content/search';
      const response = await this.client.get<any>(url, {
        params: {
          cql: fullCql,
          limit,
          start,
          expand: 'space',
        },
      });

      const results = response.results || [];
      return results.map((result: any) => ({
        id: result.content?.id || result.id,
        title: result.content?.title || result.title,
        type: result.content?.type || result.type || 'page',
        excerpt: result.excerpt || '',
        url: result.url || `${this.config.baseUrl}/pages/?pageId=${result.content?.id || result.id}`,
        space: result.resultGlobalContainer?.title ? {
          key: result.resultGlobalContainer.title,
          name: result.resultGlobalContainer.title,
        } : result.content?.space ? {
          key: result.content.space.key,
          name: result.content.space.name || result.content.space.key,
        } : undefined,
      }));
    } catch (error) {
      throw new Error(`Failed to search: ${(error as Error).message}`);
    }
  }

  /**
   * Search users using CQL query
   * Note: Confluence Server/Data Center has limited user search capabilities
   * This method tries multiple approaches to find users
   * @param query - Search query (can be username or CQL)
   * @param limit - Maximum number of results
   * @returns List of user search results
   */
  async searchUser(query: string, limit: number = 10): Promise<any[]> {
    try {
      // Try approach 1: Direct user search by username
      try {
        const url1 = '/rest/api/user';
        const response1 = await this.client.get<any>(url1, {
          params: { username: query },
        });
        // If single user found, return as array
        if (response1 && response1.username) {
          return [response1];
        }
      } catch (e) {
        // Continue to next approach
      }

      // Try approach 2: Search in content and extract unique contributors
      try {
        const cql = `contributor ~ "${query}" OR creator ~ "${query}"`;
        const url2 = '/rest/api/content/search';
        const response2 = await this.client.get<any>(url2, {
          params: { cql, limit: Math.min(limit * 5, 100) },
        });

        const users: Record<string, any> = {};
        const results = response2.results || [];

        for (const result of results) {
          // Extract creator info
          if (result.history?.createdBy) {
            const creator = result.history.createdBy;
            const username = creator.username || creator.name;
            if (username && username.toLowerCase().includes(query.toLowerCase())) {
              if (!users[username]) {
                users[username] = {
                  username,
                  displayName: creator.displayName || username,
                  userKey: creator.userKey,
                };
              }
            }
          }
          
          // Extract last modifier info
          if (result.version?.by) {
            const modifier = result.version.by;
            const username = modifier.username || modifier.name;
            if (username && username.toLowerCase().includes(query.toLowerCase())) {
              if (!users[username]) {
                users[username] = {
                  username,
                  displayName: modifier.displayName || username,
                  userKey: modifier.userKey,
                };
              }
            }
          }
        }

        const userArray = Object.values(users).slice(0, limit);
        if (userArray.length > 0) {
          return userArray;
        }
      } catch (e) {
        // Continue to next approach
      }

      // If no results found, return empty array
      return [];
    } catch (error) {
      throw new Error(`Failed to search users: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Phase 2: Comment Operations
  // ========================================

  /**
   * Get all comments for a page
   * @param pageId - The page ID
   * @param returnMarkdown - Whether to return markdown format
   * @returns List of comments
   */
  async getPageComments(pageId: string, returnMarkdown: boolean = true): Promise<ConfluenceComment[]> {
    try {
      const url = `/rest/api/content/${pageId}/child/comment`;
      const response = await this.client.get<any>(url, {
        params: {
          expand: 'body.view.value,body.storage.value,version,history.createdBy',
          depth: 'all',
        },
      });

      const results = response.results || [];
      const baseUrl = this.config.baseUrl;
      
      return results.map((comment: any) => {
        let body = comment.body?.view?.value || comment.body?.storage?.value || '';
        
        // Convert to Markdown if requested
        if (returnMarkdown && body) {
          body = this.preprocessor.htmlToMarkdown(body, baseUrl);
        }
        
        return {
          id: comment.id,
          title: comment.title || '',
          body,
          created: comment.history?.createdDate || new Date().toISOString(),
          createdBy: {
            username: comment.history?.createdBy?.username || comment.history?.createdBy?.name || '',
            displayName: comment.history?.createdBy?.displayName || 'Unknown',
          },
          version: {
            number: comment.version?.number || 1,
          },
        };
      });
    } catch (error) {
      throw new Error(`Failed to get page comments: ${(error as Error).message}`);
    }
  }

  /**
   * Add a comment to a page
   * @param pageId - The page ID
   * @param content - The comment content (Confluence Storage Format or Markdown)
   * @param isMarkdown - Whether the content is in Markdown format
   * @returns The created comment
   */
  async addComment(pageId: string, content: string, isMarkdown: boolean = false): Promise<ConfluenceComment> {
    try {
      const url = `/rest/api/content`;
      
      // Process content based on format
      let bodyContent = content;
      if (isMarkdown) {
        bodyContent = this.preprocessor.markdownToHtml(content);
      }
      
      const data = {
        type: 'comment',
        container: {
          id: pageId,
          type: 'page',
        },
        body: {
          storage: {
            value: bodyContent,
            representation: 'storage',
          },
        },
      };

      const response = await this.client.post<any>(url, data);
      return {
        id: response.id,
        title: response.title || '',
        body: response.body?.storage?.value || bodyContent,
        created: response.history?.createdDate || new Date().toISOString(),
        createdBy: {
          username: response.history?.createdBy?.username || response.history?.createdBy?.name || '',
          displayName: response.history?.createdBy?.displayName || 'Unknown',
        },
        version: {
          number: response.version?.number || 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to add comment: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Phase 2: Label Operations
  // ========================================

  /**
   * Get all labels for a page
   * @param pageId - The page ID
   * @returns List of labels
   */
  async getPageLabels(pageId: string): Promise<ConfluenceLabel[]> {
    try {
      const url = `/rest/api/content/${pageId}/label`;
      const response = await this.client.get<any>(url);

      const results = response.results || [];
      return results.map((label: any) => ({
        id: label.id,
        name: label.name,
        prefix: label.prefix || 'global',
      }));
    } catch (error) {
      throw new Error(`Failed to get page labels: ${(error as Error).message}`);
    }
  }

  /**
   * Add a label to a page
   * @param pageId - The page ID
   * @param labelName - The label name
   * @returns List of updated labels
   */
  async addPageLabel(pageId: string, labelName: string): Promise<ConfluenceLabel[]> {
    try {
      const url = `/rest/api/content/${pageId}/label`;
      const data = [
        {
          prefix: 'global',
          name: labelName,
        },
      ];

      await this.client.post<any>(url, data);
      
      // Return updated labels list
      return await this.getPageLabels(pageId);
    } catch (error) {
      throw new Error(`Failed to add page label: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Phase 3: Space Operations
  // ========================================

  /**
   * Get all spaces
   * @param start - Starting index for pagination
   * @param limit - Maximum number of results
   * @returns List of spaces
   */
  async getSpaces(start: number = 0, limit: number = 25): Promise<ConfluenceSpace[]> {
    try {
      const url = '/rest/api/space';
      const response = await this.client.get<any>(url, {
        params: { start, limit, expand: 'description.plain,homepage' },
      });

      const results = response.results || [];
      return results.map((space: any) => ({
        key: space.key,
        name: space.name,
        type: space.type || 'global',
        status: space.status || 'current',
        description: space.description?.plain?.value,
        homepage: space.homepage ? { id: space.homepage.id } : undefined,
      }));
    } catch (error) {
      throw new Error(`Failed to get spaces: ${(error as Error).message}`);
    }
  }

  /**
   * Get spaces the current user has contributed to
   * @param limit - Maximum number of results
   * @returns Array of spaces
   */
  async getUserContributedSpaces(limit: number = 250): Promise<Array<{ key: string; name: string }>> {
    try {
      const cql = 'contributor = currentUser() order by lastmodified DESC';
      const url = '/rest/api/content/search';
      const response = await this.client.get<any>(url, {
        params: { cql, limit },
      });

      const spacesMap: Record<string, any> = {};
      const results = response.results || [];

      for (const result of results) {
        let spaceKey = null;
        let spaceName = null;

        // Try to extract space from container
        if (result.resultGlobalContainer) {
          const container = result.resultGlobalContainer;
          spaceName = container.title;
          const displayUrl = container.displayUrl || '';
          if (displayUrl && displayUrl.includes('/spaces/')) {
            spaceKey = displayUrl.split('/spaces/')[1].split('/')[0];
          }
        }

        // Try to extract from content
        if (!spaceKey && result.content && result.content._expandable) {
          const expandable = result.content._expandable;
          const spacePath = expandable.space || '';
          if (spacePath && spacePath.startsWith('/rest/api/space/')) {
            spaceKey = spacePath.split('/rest/api/space/')[1];
          }
        }

        if (spaceKey && !spacesMap[spaceKey]) {
          spacesMap[spaceKey] = {
            key: spaceKey,
            name: spaceName || `Space ${spaceKey}`,
          };
        }
      }

      // Convert map to array
      return Object.values(spacesMap);
    } catch (error) {
      throw new Error(`Failed to get user contributed spaces: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Phase 3: User Operations
  // ========================================

  /**
   * Get user details by username
   * @param username - The username
   * @param expand - Optional fields to expand
   * @returns User details
   */
  async getUserDetailsByUsername(username: string, expand?: string): Promise<any> {
    try {
      const url = '/rest/api/user';
      const params: any = { username };
      if (expand) {
        params.expand = expand;
      }

      const response = await this.client.get<any>(url, { params });
      return response;
    } catch (error) {
      throw new Error(`Failed to get user details: ${(error as Error).message}`);
    }
  }

  /**
   * Get current user information
   * @returns Current user details
   */
  async getCurrentUserInfo(): Promise<any> {
    try {
      const url = '/rest/api/user/current';
      const response = await this.client.get<any>(url);
      return response;
    } catch (error) {
      throw new Error(`Failed to get current user info: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Phase 3: Attachment Operations
  // ========================================

  /**
   * Get all attachments for a page
   * @param pageId - The page ID
   * @param start - Starting index for pagination
   * @param limit - Maximum number of results
   * @returns List of attachments
   */
  async getPageAttachments(pageId: string, start: number = 0, limit: number = 25): Promise<any[]> {
    try {
      const url = `/rest/api/content/${pageId}/child/attachment`;
      const response = await this.client.get<any>(url, {
        params: { start, limit },
      });

      return response.results || [];
    } catch (error) {
      throw new Error(`Failed to get page attachments: ${(error as Error).message}`);
    }
  }

  /**
   * Attach a file to a page
   * @param pageId - The page ID
   * @param filePath - The file path
   * @param comment - Optional comment
   * @returns The attachment details
   */
  async attachFile(pageId: string, filePath: string, comment?: string): Promise<any> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const url = `/rest/api/content/${pageId}/child/attachment`;
      const fileName = path.basename(filePath);

      // Create form data
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath), fileName);

      if (comment) {
        form.append('comment', comment);
      }

      // Use axios instance directly to override Content-Type header
      const axiosClient = this.client.getClient();
      const response = await axiosClient.post(url, form, {
        headers: {
          ...form.getHeaders(),
          'X-Atlassian-Token': 'no-check',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const results = response.data.results || [];
      if (results.length > 0) {
        return results[0];
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : '';
      throw new Error(
        `Failed to attach file: ${errorMessage}${errorDetails ? `\nDetails: ${errorDetails}` : ''}`
      );
    }
  }

  /**
   * Delete an attachment
   * @param attachmentId - The attachment ID
   * @returns True if successful
   */
  async deleteAttachment(attachmentId: string): Promise<boolean> {
    try {
      const url = `/rest/api/content/${attachmentId}`;
      await this.client.delete(url);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete attachment: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private async getPageImages(pageId: string, bodyHtml: string): Promise<ImageContent[]> {
    try {
      const url = `/rest/api/content/${pageId}/child/attachment`;
      const response = await this.client.get<any>(url, {
        params: { limit: 10 },
      });

      const attachments = response.results || [];
      const imageResources: ImageContent[] = [];

      for (const attachment of attachments) {
        const mediaType = attachment.extensions?.mediaType || '';
        if (mediaType.startsWith('image/')) {
          const fileName = encodeURIComponent(attachment.title);
          if (fileName && bodyHtml.includes(fileName)) {
            const downloadUrl = this.config.baseUrl + attachment._links?.thumbnail;

            try {
              const imageResponse = await fetch(downloadUrl, {
                headers: {
                  Authorization: `Bearer ${this.config.apiToken}`,
                },
              });

              if (imageResponse.ok) {
                const imageBuffer = await imageResponse.arrayBuffer();
                const base64Image = Buffer.from(imageBuffer).toString('base64');
                imageResources.push({
                  type: 'image',
                  data: base64Image,
                  mimeType: mediaType,
                });
              } else {
                console.warn(`Failed to fetch image ${fileName}: HTTP ${imageResponse.status}`);
              }
            } catch (imageError) {
              console.warn(`Failed to fetch image ${fileName}: ${(imageError as Error).message}`);
            }
          }
        }
      }

      return imageResources;
    } catch (error) {
      console.warn(`Failed to get page attachments for image extraction: ${(error as Error).message}`);
      return [];
    }
  }
}