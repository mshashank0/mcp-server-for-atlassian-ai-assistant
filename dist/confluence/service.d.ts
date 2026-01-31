import { ConfluencePage, SearchResult, PageOptions, SearchOptions, CreatePageInput, UpdatePageInput, PageContentResult, ConfluenceComment, ConfluenceSpace, ConfluenceLabel } from './types.js';
export declare class ConfluenceService {
    private client;
    private preprocessor;
    private config;
    constructor();
    /**
     * Get page content by ID
     * @param pageId - The Confluence page ID
     * @param options - Page options (convertToMarkdown, etc.)
     * @returns Page content result (text + images)
     */
    getPageContent(pageId: string, options?: PageOptions): Promise<PageContentResult>;
    /**
     * Get page ancestors (parent pages)
     * @param pageId - The Confluence page ID
     * @returns List of ancestor pages
     */
    getPageAncestors(pageId: string): Promise<ConfluencePage[]>;
    /**
     * Get page by title from a space
     * @param spaceKey - The space key
     * @param title - The page title
     * @param options - Page options
     * @returns Page content or null if not found
     */
    getPageByTitle(spaceKey: string, title: string, options?: PageOptions): Promise<ConfluencePage | null>;
    /**
     * Get all pages from a space
     * @param spaceKey - The space key
     * @param start - Starting index for pagination
     * @param limit - Maximum number of results
     * @param options - Page options
     * @returns List of pages
     */
    getSpacePages(spaceKey: string, start?: number, limit?: number, options?: PageOptions): Promise<ConfluencePage[]>;
    /**
     * Create a new page
     * @param input - Page creation input
     * @returns The created page
     */
    createPage(input: CreatePageInput): Promise<ConfluencePage>;
    /**
     * Update an existing page
     * @param input - Page update input
     * @returns The updated page
     */
    updatePage(input: UpdatePageInput): Promise<ConfluencePage>;
    /**
     * Validate content format
     */
    private validateContentFormat;
    /**
     * Validate final content before sending to API
     */
    private validateFinalContent;
    /**
     * Get child pages of a page
     * @param pageId - The parent page ID
     * @param start - Starting index for pagination
     * @param limit - Maximum number of results
     * @param expand - Fields to expand
     * @param options - Page options
     * @returns List of child pages
     */
    getPageChildren(pageId: string, start?: number, limit?: number, expand?: string, options?: PageOptions): Promise<ConfluencePage[]>;
    /**
     * Delete a page
     * @param pageId - The page ID to delete
     * @returns True if successful
     */
    deletePage(pageId: string): Promise<boolean>;
    /**
     * Search content using CQL
     * @param cql - Confluence Query Language string
     * @param options - Search options
     * @returns List of search results
     */
    search(cql: string, options?: SearchOptions): Promise<SearchResult[]>;
    /**
     * Search users using CQL query
     * Note: Confluence Server/Data Center has limited user search capabilities
     * This method tries multiple approaches to find users
     * @param query - Search query (can be username or CQL)
     * @param limit - Maximum number of results
     * @returns List of user search results
     */
    searchUser(query: string, limit?: number): Promise<any[]>;
    /**
     * Get all comments for a page
     * @param pageId - The page ID
     * @param returnMarkdown - Whether to return markdown format
     * @returns List of comments
     */
    getPageComments(pageId: string, returnMarkdown?: boolean): Promise<ConfluenceComment[]>;
    /**
     * Add a comment to a page
     * @param pageId - The page ID
     * @param content - The comment content (Confluence Storage Format or Markdown)
     * @param isMarkdown - Whether the content is in Markdown format
     * @returns The created comment
     */
    addComment(pageId: string, content: string, isMarkdown?: boolean): Promise<ConfluenceComment>;
    /**
     * Get all labels for a page
     * @param pageId - The page ID
     * @returns List of labels
     */
    getPageLabels(pageId: string): Promise<ConfluenceLabel[]>;
    /**
     * Add a label to a page
     * @param pageId - The page ID
     * @param labelName - The label name
     * @returns List of updated labels
     */
    addPageLabel(pageId: string, labelName: string): Promise<ConfluenceLabel[]>;
    /**
     * Get all spaces
     * @param start - Starting index for pagination
     * @param limit - Maximum number of results
     * @returns List of spaces
     */
    getSpaces(start?: number, limit?: number): Promise<ConfluenceSpace[]>;
    /**
     * Get spaces the current user has contributed to
     * @param limit - Maximum number of results
     * @returns Array of spaces
     */
    getUserContributedSpaces(limit?: number): Promise<Array<{
        key: string;
        name: string;
    }>>;
    /**
     * Get user details by username
     * @param username - The username
     * @param expand - Optional fields to expand
     * @returns User details
     */
    getUserDetailsByUsername(username: string, expand?: string): Promise<any>;
    /**
     * Get current user information
     * @returns Current user details
     */
    getCurrentUserInfo(): Promise<any>;
    /**
     * Get all attachments for a page
     * @param pageId - The page ID
     * @param start - Starting index for pagination
     * @param limit - Maximum number of results
     * @returns List of attachments
     */
    getPageAttachments(pageId: string, start?: number, limit?: number): Promise<any[]>;
    /**
     * Attach a file to a page
     * @param pageId - The page ID
     * @param filePath - The file path
     * @param comment - Optional comment
     * @returns The attachment details
     */
    attachFile(pageId: string, filePath: string, comment?: string): Promise<any>;
    /**
     * Delete an attachment
     * @param attachmentId - The attachment ID
     * @returns True if successful
     */
    deleteAttachment(attachmentId: string): Promise<boolean>;
    private getPageImages;
}
//# sourceMappingURL=service.d.ts.map