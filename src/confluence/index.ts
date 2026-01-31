#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ConfluenceService } from './service.js';

const server = new Server(
  {
    name: 'confluence-mcp',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const confluence = new ConfluenceService();

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ========================================
      // Phase 1: Page Operations (8 tools)
      // ========================================
      {
        name: 'confluence_get_page_content',
        description: 'Get content of a specific Confluence page by ID',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The Confluence page ID',
            },
            convert_to_markdown: {
              type: 'boolean',
              description: 'Convert HTML content to Markdown format. Note: If you plan to update the page later, set this to false to get HTML format directly.',
              default: false,
            },
            enable_heading_anchors: {
              type: 'boolean',
              description: 'Add anchors to headings in Markdown output',
              default: false,
            },
          },
          required: ['page_id'],
        },
      },
      {
        name: 'confluence_get_page_ancestors',
        description: 'Get ancestors (parent pages) of a specific Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The Confluence page ID',
            },
          },
          required: ['page_id'],
        },
      },
      {
        name: 'confluence_get_page_by_title',
        description: 'Get a Confluence page by its title from a specific space',
        inputSchema: {
          type: 'object',
          properties: {
            space_key: {
              type: 'string',
              description: 'The Confluence space key',
            },
            title: {
              type: 'string',
              description: 'The page title',
            },
            convert_to_markdown: {
              type: 'boolean',
              description: 'Convert HTML content to Markdown format. Note: If you plan to update the page later, set this to false to get HTML format directly.',
              default: false,
            },
            enable_heading_anchors: {
              type: 'boolean',
              description: 'Add anchors to headings in Markdown output',
              default: false,
            },
          },
          required: ['space_key', 'title'],
        },
      },
      {
        name: 'confluence_get_space_pages',
        description: 'Get all pages from a specific Confluence space',
        inputSchema: {
          type: 'object',
          properties: {
            space_key: {
              type: 'string',
              description: 'The Confluence space key',
            },
            start: {
              type: 'number',
              description: 'Starting index for pagination',
              default: 0,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25)',
              default: 25,
            },
            convert_to_markdown: {
              type: 'boolean',
              description: 'Convert HTML content to Markdown format. Note: If you plan to update pages later, set this to false to get HTML format directly.',
              default: false,
            },
            enable_heading_anchors: {
              type: 'boolean',
              description: 'Add anchors to headings in Markdown output',
              default: false,
            },
          },
          required: ['space_key'],
        },
      },
      {
        name: 'confluence_create_page',
        description: 'Create a new Confluence page in a space',
        inputSchema: {
          type: 'object',
          properties: {
            space_key: {
              type: 'string',
              description: 'The Confluence space key',
            },
            title: {
              type: 'string',
              description: 'The page title',
            },
            body: {
              type: 'string',
              description: 'The page body content. If is_markdown=true, provide Markdown text (will be auto-converted). If is_markdown=false, provide Confluence Storage Format (HTML)',
            },
            parent_id: {
              type: 'string',
              description: 'Optional parent page ID',
            },
            is_markdown: {
              type: 'boolean',
              description: 'Set to true if body is Markdown (will be auto-converted to Confluence Storage Format). Set to false if body is already in Confluence Storage Format (HTML)',
              default: false,
            },
            enable_heading_anchors: {
              type: 'boolean',
              description: 'Add anchors to headings when converting from Markdown',
              default: false,
            },
          },
          required: ['space_key', 'title', 'body'],
        },
      },
      {
        name: 'confluence_update_page',
        description: `Update an existing Confluence page.

IMPORTANT: By default, this replaces the entire page content (updateMode='replace').
To add content to an existing page without replacing it:
- Set updateMode='append' to add your content at the end of the existing content
- Set updateMode='prepend' to add your content at the beginning of the existing content

Examples:
- Adding a new section: use updateMode='append'
- Adding a header/banner: use updateMode='prepend'
- Complete rewrite: use updateMode='replace' (or omit updateMode)`,
        inputSchema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The Confluence page ID',
            },
            title: {
              type: 'string',
              description: 'The page title',
            },
            body: {
              type: 'string',
              description: 'The page body content. If is_markdown=true, provide Markdown text (will be auto-converted). If is_markdown=false, provide Confluence Storage Format (HTML)',
            },
            update_mode: {
              type: 'string',
              enum: ['replace', 'append', 'prepend'],
              description: "Update mode: 'replace' (default) replaces entire content, 'append' adds to end, 'prepend' adds to beginning",
              default: 'replace',
            },
            version_comment: {
              type: 'string',
              description: 'Optional version comment',
            },
            is_minor_edit: {
              type: 'boolean',
              description: 'Whether this is a minor edit',
              default: false,
            },
            is_markdown: {
              type: 'boolean',
              description: 'Set to true if body is Markdown (will be auto-converted to Confluence Storage Format). Set to false if body is already in Confluence Storage Format (HTML). IMPORTANT: Do not send raw Markdown with is_markdown=false, as this will cause 400 errors',
              default: false,
            },
            enable_heading_anchors: {
              type: 'boolean',
              description: 'Add anchors to headings when converting from Markdown',
              default: false,
            },
          },
          required: ['page_id', 'title', 'body'],
        },
      },
      {
        name: 'confluence_get_page_children',
        description: 'Get child pages of a specific Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The Confluence page ID',
            },
            start: {
              type: 'number',
              description: 'Starting index for pagination',
              default: 0,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25)',
              default: 25,
            },
            expand: {
              type: 'string',
              description: 'Fields to expand in the response',
              default: 'version',
            },
            convert_to_markdown: {
              type: 'boolean',
              description: 'Convert HTML content to Markdown format. Note: If you plan to update pages later, set this to false to get HTML format directly.',
              default: false,
            },
            enable_heading_anchors: {
              type: 'boolean',
              description: 'Add anchors to headings in Markdown output',
              default: false,
            },
          },
          required: ['page_id'],
        },
      },
      // COMMENTED OUT: Delete page functionality
      // {
      //   name: 'confluence_delete_page',
      //   description: 'Delete a Confluence page by ID',
      //   inputSchema: {
      //     type: 'object',
      //     properties: {
      //       page_id: {
      //         type: 'string',
      //         description: 'The Confluence page ID',
      //       },
      //     },
      //     required: ['page_id'],
      //   },
      // },

      // ========================================
      // Phase 1: Search Operations (2 tools)
      // ========================================
      {
        name: 'confluence_search',
        description: 'Search Confluence content using CQL (Confluence Query Language)',
        inputSchema: {
          type: 'object',
          properties: {
            cql: {
              type: 'string',
              description: 'The CQL query string',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25)',
              default: 25,
            },
            start: {
              type: 'number',
              description: 'Starting index for pagination',
              default: 0,
            },
            spaces_filter: {
              type: 'string',
              description: 'Optional comma-separated list of space keys to filter by',
            },
          },
          required: ['cql'],
        },
      },
      {
        name: 'confluence_search_user',
        description: 'Search Confluence users using CQL',
        inputSchema: {
          type: 'object',
          properties: {
            cql: {
              type: 'string',
              description: 'The CQL query string for user search',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
              default: 10,
            },
          },
          required: ['cql'],
        },
      },

      // ========================================
      // Phase 2: Comment Operations (2 tools)
      // ========================================
      {
        name: 'confluence_get_page_comments',
        description: 'Get all comments for a specific Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The Confluence page ID',
            },
            return_markdown: {
              type: 'boolean',
              description: 'Whether to return content in markdown format',
              default: true,
            },
          },
          required: ['page_id'],
        },
      },
      {
        name: 'confluence_add_comment',
        description: 'Add a comment to a Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The Confluence page ID',
            },
            content: {
              type: 'string',
              description: 'The comment content. If is_markdown=true, provide Markdown text (will be auto-converted). If is_markdown=false, provide Confluence Storage Format (HTML)',
            },
            is_markdown: {
              type: 'boolean',
              description: 'Set to true if content is Markdown (will be auto-converted to Confluence Storage Format). Set to false if content is already in Confluence Storage Format (HTML)',
              default: false,
            },
          },
          required: ['page_id', 'content'],
        },
      },

      // ========================================
      // Phase 2: Label Operations (2 tools)
      // ========================================
      {
        name: 'confluence_get_page_labels',
        description: 'Get all labels for a specific Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The Confluence page ID',
            },
          },
          required: ['page_id'],
        },
      },
      {
        name: 'confluence_add_page_label',
        description: 'Add a label to a Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The Confluence page ID',
            },
            label_name: {
              type: 'string',
              description: 'The label name',
            },
          },
          required: ['page_id', 'label_name'],
        },
      },

      // ========================================
      // Phase 3: Space Operations (2 tools)
      // ========================================
      {
        name: 'confluence_get_spaces',
        description: 'Get all available Confluence spaces',
        inputSchema: {
          type: 'object',
          properties: {
            start: {
              type: 'number',
              description: 'Starting index for pagination',
              default: 0,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25)',
              default: 25,
            },
          },
        },
      },
      {
        name: 'confluence_get_user_contributed_spaces',
        description: 'Get spaces the current user has contributed to',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 250)',
              default: 250,
            },
          },
        },
      },

      // ========================================
      // Phase 3: User Operations (2 tools)
      // ========================================
      {
        name: 'confluence_get_user_details_by_username',
        description: 'Get Confluence user details by username',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'The username',
            },
            expand: {
              type: 'string',
              description: 'Optional fields to expand (e.g., "status")',
            },
          },
          required: ['username'],
        },
      },
      {
        name: 'confluence_get_current_user_info',
        description: 'Get current user information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // ========================================
      // Phase 3: Attachment Operations (3 tools)
      // ========================================
      {
        name: 'confluence_get_page_attachments',
        description: 'Get all attachments for a specific Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The Confluence page ID',
            },
            start: {
              type: 'number',
              description: 'Starting index for pagination',
              default: 0,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25)',
              default: 25,
            },
          },
          required: ['page_id'],
        },
      },
      {
        name: 'confluence_attach_file',
        description: 'Attach a file to a Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: {
              type: 'string',
              description: 'The Confluence page ID',
            },
            file_path: {
              type: 'string',
              description: 'The file path',
            },
            comment: {
              type: 'string',
              description: 'Optional comment',
            },
          },
          required: ['page_id', 'file_path'],
        },
      },
      // COMMENTED OUT: Delete attachment functionality
      // {
      //   name: 'confluence_delete_attachment',
      //   description: 'Delete an attachment from Confluence',
      //   inputSchema: {
      //     type: 'object',
      //     properties: {
      //       attachment_id: {
      //         type: 'string',
      //         description: 'The attachment ID',
      //       },
      //     },
      //     required: ['attachment_id'],
      //   },
      // },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ========================================
      // Page Operations
      // ========================================
      case 'confluence_get_page_content': {
        if (!args.page_id) {
          throw new Error('page_id is required');
        }
        const result = await confluence.getPageContent(
          args.page_id as string,
          {
            convertToMarkdown: args.convert_to_markdown as boolean,
            enableHeadingAnchors: args.enable_heading_anchors as boolean,
          }
        );

        return {
          content: result.map((item) => {
            if (item.type === 'image') {
              return {
                type: 'image',
                data: item.data,
                mimeType: item.mimeType,
              };
            } else {
              return {
                type: 'text',
                text: item.text,
              };
            }
          }),
        };
      }

      case 'confluence_get_page_ancestors': {
        const result = await confluence.getPageAncestors(args.page_id as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_get_page_by_title': {
        const result = await confluence.getPageByTitle(
          args.space_key as string,
          args.title as string,
          {
            convertToMarkdown: args.convert_to_markdown as boolean,
            enableHeadingAnchors: args.enable_heading_anchors as boolean,
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_get_space_pages': {
        const result = await confluence.getSpacePages(
          args.space_key as string,
          args.start as number,
          args.limit as number,
          {
            convertToMarkdown: args.convert_to_markdown as boolean,
            enableHeadingAnchors: args.enable_heading_anchors as boolean,
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_create_page': {
        if (!args.space_key || !args.title || !args.body) {
          throw new Error('space_key, title, and body are required');
        }
        const result = await confluence.createPage({
          spaceKey: args.space_key as string,
          title: args.title as string,
          body: args.body as string,
          parentId: args.parent_id as string | undefined,
          isMarkdown: args.is_markdown as boolean,
          enableHeadingAnchors: args.enable_heading_anchors as boolean,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_update_page': {
        if (!args.page_id || !args.title || !args.body) {
          throw new Error('page_id, title, and body are required');
        }
        const result = await confluence.updatePage({
          pageId: args.page_id as string,
          title: args.title as string,
          body: args.body as string,
          updateMode: args.update_mode as 'replace' | 'append' | 'prepend' | undefined,
          versionComment: args.version_comment as string | undefined,
          isMinorEdit: args.is_minor_edit as boolean | undefined,
          isMarkdown: args.is_markdown as boolean,
          enableHeadingAnchors: args.enable_heading_anchors as boolean,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_get_page_children': {
        const result = await confluence.getPageChildren(
          args.page_id as string,
          args.start as number,
          args.limit as number,
          args.expand as string,
          {
            convertToMarkdown: args.convert_to_markdown as boolean,
            enableHeadingAnchors: args.enable_heading_anchors as boolean,
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // COMMENTED OUT: Delete page functionality
      // case 'confluence_delete_page': {
      //   const result = await confluence.deletePage(args.page_id as string);
      //   return {
      //     content: [
      //       {
      //         type: 'text',
      //         text: JSON.stringify({ success: result }, null, 2),
      //       },
      //     ],
      //   };
      // }

      // ========================================
      // Search Operations
      // ========================================
      case 'confluence_search': {
        const result = await confluence.search(args.cql as string, {
          limit: args.limit as number,
          start: args.start as number,
          spacesFilter: args.spaces_filter as string | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_search_user': {
        const result = await confluence.searchUser(
          args.cql as string,
          args.limit as number
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========================================
      // Comment Operations
      // ========================================
      case 'confluence_get_page_comments': {
        const result = await confluence.getPageComments(
          args.page_id as string,
          args.return_markdown as boolean
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_add_comment': {
        if (!args.page_id || !args.content) {
          throw new Error('page_id and content are required');
        }
        const result = await confluence.addComment(
          args.page_id as string,
          args.content as string,
          args.is_markdown as boolean
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========================================
      // Label Operations
      // ========================================
      case 'confluence_get_page_labels': {
        const result = await confluence.getPageLabels(args.page_id as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_add_page_label': {
        const result = await confluence.addPageLabel(
          args.page_id as string,
          args.label_name as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========================================
      // Space Operations
      // ========================================
      case 'confluence_get_spaces': {
        const result = await confluence.getSpaces(
          args.start as number,
          args.limit as number
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_get_user_contributed_spaces': {
        const result = await confluence.getUserContributedSpaces(
          args.limit as number
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========================================
      // User Operations
      // ========================================
      case 'confluence_get_user_details_by_username': {
        const result = await confluence.getUserDetailsByUsername(
          args.username as string,
          args.expand as string | undefined
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_get_current_user_info': {
        const result = await confluence.getCurrentUserInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========================================
      // Attachment Operations
      // ========================================
      case 'confluence_get_page_attachments': {
        const result = await confluence.getPageAttachments(
          args.page_id as string,
          args.start as number,
          args.limit as number
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_attach_file': {
        if (!args.page_id || !args.file_path) {
          throw new Error('page_id and file_path are required');
        }
        const result = await confluence.attachFile(
          args.page_id as string,
          args.file_path as string,
          args.comment as string | undefined
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // COMMENTED OUT: Delete attachment functionality
      // case 'confluence_delete_attachment': {
      //   const result = await confluence.deleteAttachment(
      //     args.attachment_id as string
      //   );
      //   return {
      //     content: [
      //       {
      //         type: 'text',
      //         text: JSON.stringify({ success: result }, null, 2),
      //       },
      //     ],
      //   };
      // }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: (error as Error).message }),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Confluence MCP server v2.0.0 running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});