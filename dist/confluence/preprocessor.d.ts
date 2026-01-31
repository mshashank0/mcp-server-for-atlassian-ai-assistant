/**
 * ContentPreprocessor class for converting between Confluence Storage Format (HTML) and Markdown
 */
export declare class ContentPreprocessor {
    private turndownService;
    private markdownIt;
    constructor();
    /**
     * Setup custom Turndown rules for Confluence-specific elements
     */
    private setupTurndownRules;
    /**
     * Clean and normalize HTML content
     */
    private cleanHtml;
    /**
     * Normalize URLs in HTML content
     */
    private normalizeUrls;
    /**
     * Convert HTML to Markdown
     */
    htmlToMarkdown(html: string, baseUrl?: string, enableHeadingAnchors?: boolean): string;
    /**
     * Convert Markdown to Confluence Storage Format (HTML)
     */
    markdownToHtml(markdown: string): string;
    /**
     * Check if string contains escaped characters
     */
    private isEscapedString;
    /**
     * Unescape escaped string
     */
    private unescapeString;
    /**
     * Add anchors to headings in Markdown
     */
    private addHeadingAnchors;
    /**
     * Process page content based on format options
     */
    processPageContent(content: string, convertToMarkdown?: boolean, baseUrl?: string, enableHeadingAnchors?: boolean): string;
    /**
     * Process input content for create/update operations
     */
    processInputContent(content: string, isMarkdown?: boolean): string;
    /**
     * Validate Markdown input and detect potential issues
     */
    private validateMarkdownInput;
    /**
     * Check if content is HTML
     */
    private isHtmlContent;
    /**
     * Check if content is Confluence Storage Format
     */
    private isConfluenceStorageFormat;
}
//# sourceMappingURL=preprocessor.d.ts.map