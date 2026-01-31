import TurndownService from 'turndown';
import MarkdownIt from 'markdown-it';
import { JSDOM } from 'jsdom';

/**
 * ContentPreprocessor class for converting between Confluence Storage Format (HTML) and Markdown
 */
export class ContentPreprocessor {
  private turndownService: TurndownService;
  private markdownIt: MarkdownIt;

  constructor() {
    // Initialize Turndown for HTML to Markdown conversion
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      bulletListMarker: '-',
    });

    // Custom rules for Confluence-specific elements
    this.setupTurndownRules();

    // Initialize markdown-it for Markdown to HTML conversion
    this.markdownIt = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });
  }

  /**
   * Setup custom Turndown rules for Confluence-specific elements
   */
  private setupTurndownRules(): void {
    // Preserve Confluence macros
    this.turndownService.addRule('confluenceMacro', {
      filter: (node) => {
        return node.nodeName === 'AC:STRUCTURED-MACRO' || 
               (node.nodeName === 'DIV' && node.classList?.contains('confluence-macro'));
      },
      replacement: (content, node) => {
        return `<!-- Confluence Macro: ${(node as Element).getAttribute('ac:name') || 'unknown'} -->\n${content}\n`;
      },
    });

    // Handle code blocks with language specification
    this.turndownService.addRule('codeBlock', {
      filter: (node: any) => {
        return (node.nodeName === 'PRE' && node.querySelector('code')) ? node : null;
      },
      replacement: (content: string, node: any) => {
        const codeNode = node.querySelector('code');
        const language = codeNode?.className?.replace('language-', '') || '';
        return `\`\`\`${language}\n${codeNode?.textContent || ''}\n\`\`\`\n`;
      },
    });

    // Handle tables
    this.turndownService.addRule('table', {
      filter: 'table',
      replacement: (content, node) => {
        const table = node as HTMLTableElement;
        let markdown = '\n';
        
        // Process table rows
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length === 0) return '';

        // Process header row
        const headerCells = Array.from(rows[0].querySelectorAll('th, td'));
        if (headerCells.length > 0) {
          markdown += '| ' + headerCells.map(cell => cell.textContent?.trim() || '').join(' | ') + ' |\n';
          markdown += '| ' + headerCells.map(() => '---').join(' | ') + ' |\n';
        }

        // Process data rows
        for (let i = headerCells.length > 0 ? 1 : 0; i < rows.length; i++) {
          const cells = Array.from(rows[i].querySelectorAll('td, th'));
          if (cells.length > 0) {
            markdown += '| ' + cells.map(cell => cell.textContent?.trim() || '').join(' | ') + ' |\n';
          }
        }

        return markdown + '\n';
      },
    });
  }

  /**
   * Clean and normalize HTML content
   */
  private cleanHtml(html: string): string {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove script tags
    document.querySelectorAll('script').forEach((el: Element) => el.remove());

    // Remove style tags
    document.querySelectorAll('style').forEach((el: Element) => el.remove());

    // Remove empty paragraphs
    document.querySelectorAll('p').forEach((el: Element) => {
      if (!el.textContent?.trim()) {
        el.remove();
      }
    });

    // Normalize whitespace
    const body = document.body.innerHTML;
    return body.replace(/\s+/g, ' ').trim();
  }

  /**
   * Normalize URLs in HTML content
   */
  private normalizeUrls(html: string, baseUrl: string): string {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Normalize image URLs
    document.querySelectorAll('img').forEach((img: Element) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http')) {
        img.setAttribute('src', new URL(src, baseUrl).toString());
      }
    });

    // Normalize link URLs
    document.querySelectorAll('a').forEach((a: Element) => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        a.setAttribute('href', new URL(href, baseUrl).toString());
      }
    });

    return document.body.innerHTML;
  }

  /**
   * Convert HTML to Markdown
   */
  public htmlToMarkdown(html: string, baseUrl?: string, enableHeadingAnchors: boolean = false): string {
    if (!html) return '';

    // Clean HTML
    let cleanedHtml = this.cleanHtml(html);

    // Normalize URLs if baseUrl provided
    if (baseUrl) {
      cleanedHtml = this.normalizeUrls(cleanedHtml, baseUrl);
    }

    // Convert to Markdown
    let markdown = this.turndownService.turndown(cleanedHtml);

    // Add heading anchors if enabled
    if (enableHeadingAnchors) {
      markdown = this.addHeadingAnchors(markdown);
    }

    return markdown.trim();
  }

  /**
   * Convert Markdown to Confluence Storage Format (HTML)
   */
  public markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    // Detect and unescape escaped strings
    let processedMarkdown = markdown;
    
    // Check if the input contains escaped characters (likely already HTML or escaped Markdown)
    if (this.isEscapedString(markdown)) {
      console.warn('Warning: Input appears to be an escaped string. Attempting to unescape...');
      processedMarkdown = this.unescapeString(markdown);
    }

    // Convert Markdown to HTML
    const html = this.markdownIt.render(processedMarkdown);

    return html.trim();
  }

  /**
   * Check if string contains escaped characters
   */
  private isEscapedString(str: string): boolean {
    // Check for common escape patterns
    return /\\\\n|\\\\"|\\\\'/g.test(str);
  }

  /**
   * Unescape escaped string
   */
  private unescapeString(str: string): string {
    return str
      .replace(/\\\\n/g, '\n')
      .replace(/\\\\r/g, '\r')
      .replace(/\\\\t/g, '\t')
      .replace(/\\\\"/g, '"')
      .replace(/\\\\'/g, "'")
      .replace(/\\\\\\\\/g, '\\');
  }

  /**
   * Add anchors to headings in Markdown
   */
  private addHeadingAnchors(markdown: string): string {
    const lines = markdown.split('\n');
    const result: string[] = [];

    for (const line of lines) {
      if (line.match(/^#{1,6}\s+/)) {
        const heading = line.replace(/^#{1,6}\s+/, '').trim();
        const anchor = heading
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        result.push(`${line} {#${anchor}}`);
      } else {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * Process page content based on format options
   */
  public processPageContent(
    content: string,
    convertToMarkdown: boolean = false,
    baseUrl?: string,
    enableHeadingAnchors: boolean = false
  ): string {
    if (convertToMarkdown) {
      return this.htmlToMarkdown(content, baseUrl, enableHeadingAnchors);
    }
    return content;
  }

  /**
   * Process input content for create/update operations
   */
  public processInputContent(content: string, isMarkdown: boolean = false): string {
    if (isMarkdown) {
      // Validate and detect content type
      const validation = this.validateMarkdownInput(content);
      
      if (!validation.isValid) {
        console.warn(`Warning: ${validation.message}`);
        console.warn('Treating content as HTML instead of Markdown.');
        return content;
      }
      
      return this.markdownToHtml(content);
    }
    return content;
  }

  /**
   * Validate Markdown input and detect potential issues
   */
  private validateMarkdownInput(content: string): { isValid: boolean; message: string } {
    // Check if content is actually HTML
    if (this.isHtmlContent(content)) {
      return {
        isValid: false,
        message: 'Content appears to be HTML, not Markdown. Use is_markdown=false for HTML content.'
      };
    }

    // Check if content contains escaped characters
    if (this.isEscapedString(content)) {
      return {
        isValid: false,
        message: 'Content contains escaped characters. This may indicate it is already processed HTML.'
      };
    }

    // Check if content contains Confluence Storage Format elements
    if (this.isConfluenceStorageFormat(content)) {
      return {
        isValid: false,
        message: 'Content appears to be Confluence Storage Format (HTML). Use is_markdown=false.'
      };
    }

    return { isValid: true, message: 'Content appears to be valid Markdown.' };
  }

  /**
   * Check if content is HTML
   */
  private isHtmlContent(content: string): boolean {
    // Check for common HTML tags
    const htmlPattern = /<\/?[a-z][\s\S]*>/i;
    return htmlPattern.test(content);
  }

  /**
   * Check if content is Confluence Storage Format
   */
  private isConfluenceStorageFormat(content: string): boolean {
    // Check for Confluence-specific elements
    const confluencePatterns = [
      /<ac:/i,
      /<ri:/i,
      /confluence-embedded-/i,
      /<structured-macro/i
    ];
    
    return confluencePatterns.some(pattern => pattern.test(content));
  }
}