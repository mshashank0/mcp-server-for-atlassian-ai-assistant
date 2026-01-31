# MCP (Model Context Protocol) server implementation for Atlassian products

A comprehensive MCP (Model Context Protocol) server implementation for Atlassian products (Bitbucket, Confluence, Jira). Built with Node.js and TypeScript for maximum type safety and maintainability.

**Author:** [mshashank0](https://github.com/mshashank0)

## 📋 Overview

A production-ready MCP server implementation providing deep integration with Atlassian's core products. Built with TypeScript for maximum type safety and maintainability.

### Available Servers

1. **Bitbucket MCP Server** - 20 tools
   - Target: Bitbucket Server/Data Center (REST API 1.0)
   - Pull request lifecycle management (create, update, approve, merge)
   - Comment and task management
   - Repository operations and file content retrieval
   - Pagination support with configurable limits
   - File-based logging with Winston

2. **Confluence MCP Server** - 7 tools
   - Target: Confluence Server/Data Center (REST API)
   - Page read, create, and update operations
   - Search functionality with CQL support
   - Space management
   - HTML to Markdown conversion
   - Support for both Confluence Storage Format and Markdown

3. **Jira MCP Server** - 25 tools
   - Target: Jira Server/Data Center 9.4 (REST API v2)
   - Issue read and create operations
   - Project management and configuration
   - Agile features: sprints, epics, boards
   - Advanced features: worklogs, transitions, custom fields
   - **Compatibility**: Optimized for Jira Server 9.4

## 🚀 Getting Started

### Prerequisites

- Node.js 22.12.0 or higher
- Yarn 3.2.4

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mshashank0/atlassian-mcp-server.git
   cd atlassian-mcp-server
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Copy the `.env.example` file to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your API credentials:
   ```env
   # Confluence Server/Data Center Configuration
   CONFLUENCE_BASE_URL=https://your-confluence-server.com/confluence
   CONFLUENCE_API_TOKEN=your-api-token

   # Jira Server/Data Center Configuration
   JIRA_BASE_URL=https://your-jira-server.com/jira
   JIRA_API_TOKEN=your-api-token

   # Bitbucket Server/Data Center Configuration
   BITBUCKET_BASE_URL=https://your-bitbucket-server.com/
   BITBUCKET_API_TOKEN=your-api-token
   ```

   **Note**: You only need to configure environment variables for the services you intend to use. Each MCP server (Bitbucket, Confluence, Jira) operates independently and only requires its own environment variables.

### Building

Build the TypeScript code:
```bash
yarn build
```

This will compile TypeScript files from `src/` to JavaScript in `dist/`.

### Configuring MCP Servers in Roo Code or Claude Desktop

After building the project, add the following configuration to your MCP settings file:

**For Roo Code:**
- Location: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json`

**For Claude Desktop:**
- Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following configuration (replace paths with your actual installation path):

```json
{
  "mcpServers": {
    "bitbucket-mcp": {
      "command": "node",
      "args": [
        "/path/to/your/atlassian-mcp-server/dist/bitbucket/index.js"
      ],
      "cwd": "/path/to/your/atlassian-mcp-server/",
      "disabled": false,
      "alwaysAllow": []
    },
    "confluence-mcp": {
      "command": "node",
      "args": [
        "/path/to/your/atlassian-mcp-server/dist/confluence/index.js"
      ],
      "cwd": "/path/to/your/atlassian-mcp-server/",
      "disabled": false,
      "alwaysAllow": []
    },
    "jira-mcp": {
      "command": "node",
      "args": [
        "/path/to/your/atlassian-mcp-server/dist/jira/index.js"
      ],
      "cwd": "/path/to/your/atlassian-mcp-server/",
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

**Configuration Notes:**
- Replace `/path/to/your/atlassian-mcp-server/` with the actual absolute path to your project directory
- `args`: Points to the compiled JavaScript entry point for each MCP server
- `cwd`: Should be the root directory of this project
- `disabled`: Set to `false` to enable the server
- `alwaysAllow`: Array of tool names that don't require user confirmation (leave empty for maximum security)

**Example with absolute paths:**
```json
{
  "mcpServers": {
    "bitbucket-mcp": {
      "command": "node",
      "args": [
        "/Users/yourusername/Documents/atlassian-mcp-server/dist/bitbucket/index.js"
      ],
      "cwd": "/Users/yourusername/Documents/atlassian-mcp-server/",
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

After adding the configuration, restart Roo Code or Claude Desktop for the changes to take effect.

## 📁 Project Structure

```
atlassian-mcp-server/
├── src/
│   ├── bitbucket/              # Bitbucket Server/Data Center MCP
│   │   ├── index.ts           # MCP server, tool definitions, logging
│   │   ├── service.ts         # Business logic and API calls
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── pagination.ts      # Pagination helper utilities
│   │   └── test/              # Bitbucket test scripts
│   │
│   ├── confluence/             # Confluence Server/Data Center MCP
│   │   ├── index.ts           # MCP server and tool definitions
│   │   ├── service.ts         # Business logic and API calls
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── preprocessor.ts    # HTML to Markdown conversion
│   │   └── test/              # Confluence test scripts
│   │
│   ├── jira/                   # Jira Server/Data Center MCP
│   │   ├── index.ts           # MCP server and tool definitions
│   │   ├── service.ts         # Business logic and API calls
│   │   ├── types.ts           # TypeScript type definitions
│   │   └── test/              # Jira test scripts
│   │
│   ├── shared/                 # Shared utilities and configuration
│   │   ├── config.ts          # Environment configuration loader
│   │   ├── http-client.ts     # Shared Axios HTTP client
│   │   └── types.ts           # Common type definitions
│   │
│   └── index.ts               # Multi-server orchestrator
│
├── dist/                       # Compiled JavaScript output (after build)
├── docs/                       # Design documentation
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript compiler configuration
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## 🔧 Available Tools

### Bitbucket MCP Server (20 tools)

**Repository Management** (2 tools)
- `bitbucket_get_repos` - List repositories in a project
- `bitbucket_get_repo` - Get repository details

**Pull Request Management** (10 tools)
- `bitbucket_create_pull_request` - Create a new pull request
- `bitbucket_get_pull_request` - Get pull request details
- `bitbucket_get_pull_requests` - List pull requests with filters
- `bitbucket_update_pull_request` - Update PR title/description
- `bitbucket_approve_pull_request` - Approve a pull request
- `bitbucket_unapprove_pull_request` - Remove approval
- `bitbucket_merge_pull_request` - Merge a pull request
- `bitbucket_can_merge_pull_request` - Check merge ability
- `bitbucket_get_pull_request_activity` - Get PR activity stream
- `bitbucket_get_pull_request_diff` - Get PR diff

**Comment & Task Management** (4 tools)
- `bitbucket_get_pull_request_comments` - Get all PR comments
- `bitbucket_add_pull_request_comment` - Add a new comment
- `bitbucket_get_pull_request_tasks` - Get all PR tasks
- `bitbucket_create_pull_request_task` - Create a new task

**Repository Operations** (4 tools)
- `bitbucket_get_commits` - Get repository commits
- `bitbucket_get_file_content` - Retrieve file contents
- `bitbucket_get_repo_structure` - Get repository file tree
- `bitbucket_get_default_reviewers` - Get default reviewers

### Confluence MCP Server (7 tools)

**Page Operations** (4 tools)
- `confluence_get_page_content` - Get full page content with Markdown conversion
- `confluence_get_page_by_title` - Find page by title in space
- `confluence_create_page` - Create a new page
- `confluence_update_page` - Update page content

**Search & Space Operations** (3 tools)
- `confluence_search_pages` - Search with CQL (Confluence Query Language)
- `confluence_get_spaces` - List all spaces
- `confluence_get_current_user` - Get current authenticated user

### Jira MCP Server (25 tools)

**Core Issue Operations** (6 tools)
- `jira_get_issue` - Get issue details with customizable options
- `jira_create_issue` - Create a new issue
- `jira_search_issues` - Search issues with JQL
- `jira_get_issue_comments` - Get issue comments
- `jira_add_comment` - Add comment to issue
- `jira_get_issue_changelog` - Get changelog for a specific issue

**Project Management** (8 tools)
- `jira_get_all_projects` - List all projects
- `jira_get_project` - Get project details
- `jira_get_project_components` - Get project components
- `jira_get_project_versions` - Get project versions
- `jira_create_project_version` - Create a new version
- `jira_get_project_issue_types` - Get issue types for project
- `jira_get_project_issues_count` - Get issue count
- `jira_get_project_issues` - Get project issues with pagination

**Agile Features** (6 tools)
- `jira_link_issue_to_epic` - Link issue to epic
- `jira_get_epic_issues` - Get issues in an epic
- `jira_get_all_sprints_from_board` - Get all sprints from board
- `jira_create_sprint` - Create a new sprint
- `jira_start_sprint` - Start a sprint
- `jira_get_all_agile_boards` - Get all agile boards

**Advanced Features** (5 tools)
- `jira_add_worklog` - Add worklog to issue
- `jira_get_available_transitions` - Get available transitions
- `jira_transition_issue` - Transition issue to new status
- `jira_get_fields` - Get all Jira fields
- `jira_get_custom_fields` - Get custom fields

## 🔒 Safety Features

### Bitbucket Server/Data Center
- **File-based Logging**: All operations are logged using Winston for audit trails
- **Configurable Logging**: Logs can be disabled or redirected to custom locations
- **Pagination Controls**: Built-in pagination to prevent excessive API calls
- **Input Validation**: Required parameter validation for all operations

### Confluence Server/Data Center
- **Input Validation**: Required parameter validation for all operations
- **HTML to Markdown**: Automatic conversion of Confluence Storage Format to Markdown
- **Multi-format Support**: Accepts both Markdown and Confluence Storage Format
- **Update Modes**: Supports replace, append, and prepend modes for page updates
- **Safe Operations Focus**: Emphasis on safe read, create, and update operations

### Jira Server/Data Center
- **Server 9.4 Optimized**: Fully compatible with Jira Server/Data Center 9.4
- **JQL Safety**: Supports safe Jira Query Language searches
- **Transition Validation**: Checks available transitions before attempting status changes
- **Read-First Approach**: Emphasis on safe read and create operations
- **Batch Operations**: Efficient batch processing for multiple issues

### Type Safety

This project uses strict TypeScript configuration for maximum type safety:
- Strict mode enabled
- All types explicitly defined
- No implicit `any` types
- Comprehensive type definitions for all API responses

## 🛠️ Technology Stack

**Core Framework:**
- `@modelcontextprotocol/sdk` ^1.0.4 - MCP protocol implementation

**HTTP & Communication:**
- `axios` ^1.6.0 - HTTP client for API calls
- `dotenv` ^16.3.0 - Environment configuration
- `form-data` ^4.0.5 - Multipart/form-data for file uploads

**Content Processing:**
- `jsdom` ^23.0.0 - DOM parsing for HTML processing
- `markdown-it` ^14.0.0 - Markdown parsing
- `turndown` ^7.1.0 - HTML to Markdown conversion

**Logging & Monitoring:**
- `winston` ^3.19.0 - File-based logging with rotation

**Development Tools:**
- `typescript` ^5.3.0 - Type checking and compilation
- `tsx` ^4.7.0 - Fast TypeScript execution for development

## 📝 Key Features

### 1. Multi-Server Architecture
Run all three MCP servers (Bitbucket, Confluence, Jira) simultaneously or individually, sharing common utilities and HTTP client configuration. Each server operates independently with lazy configuration loading - only the environment variables for the services you use are required.

### 2. Comprehensive API Coverage
- **52 total tools** across three platforms (20 Bitbucket + 7 Confluence + 25 Jira)
- Read, create, and update operations for all major entities
- Advanced features like pagination, batch operations, and field management
- Server/Data Center optimized for production use

### 3. Production-Ready Logging
Bitbucket server includes Winston-based file logging with:
- Automatic log rotation
- Configurable log levels
- Custom log directory and file path support
- Optional logging disable for development

### 4. Safety Mechanisms
- Field validation before updates
- Transition validation for state changes
- Comprehensive error handling with detailed messages
- Input sanitization and validation

### 5. Content Processing
- HTML to Markdown conversion for Confluence content
- Support for both Confluence Storage Format and Markdown
- File upload with multipart/form-data support
- Inline comment support for Bitbucket

### 6. Developer Experience
- Full TypeScript type definitions
- ES Modules for modern JavaScript
- Fast development mode with `tsx`
- Comprehensive error messages

## 📚 Documentation

Design documentation is available in the `docs/` directory:
- Bitbucket MCP Server Design
- Confluence MCP Redesign
- Jira MCP Redesign


## 📖 Reference

This project was inspired by and references the following repositories:
- [sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian) - Atlassian MCP implementation

## 📊 Project Statistics

- **Total Tools**: 52 (20 Bitbucket + 7 Confluence + 25 Jira)
- **Services**: 3 MCP servers
- **Target Platforms**:
  - Bitbucket Server/Data Center (REST API 1.0)
  - Confluence Server/Data Center (REST API)
  - Jira Server/Data Center 9.4 (REST API v2)
- **Node.js**: ≥22.12.0 required
- **Package Manager**: Yarn 3.2.4

---

**Built with ❤️ by [mshashank0](https://github.com/mshashank0)**
