#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { BitbucketService } from './service.js';
// =========== LOGGER SETUP ==========
function getDefaultLogDirectory() {
    if (process.platform === 'win32') {
        const base = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
        return path.join(base, 'bitbucket-mcp');
    }
    if (process.platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Logs', 'bitbucket-mcp');
    }
    const xdgStateHome = process.env.XDG_STATE_HOME;
    if (xdgStateHome && xdgStateHome.length > 0) {
        return path.join(xdgStateHome, 'bitbucket-mcp');
    }
    return path.join(os.homedir(), '.local', 'state', 'bitbucket-mcp');
}
function isTruthyEnv(value) {
    if (value === undefined || value === null)
        return false;
    const normalized = String(value).toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
}
function getLogFilePath() {
    if (isTruthyEnv(process.env.BITBUCKET_LOG_DISABLE)) {
        return undefined;
    }
    const explicitFile = process.env.BITBUCKET_LOG_FILE;
    if (explicitFile && explicitFile.trim().length > 0) {
        return explicitFile;
    }
    const baseDir = process.env.BITBUCKET_LOG_DIR &&
        process.env.BITBUCKET_LOG_DIR.trim().length > 0
        ? process.env.BITBUCKET_LOG_DIR
        : getDefaultLogDirectory();
    let effectiveDir = baseDir;
    if (isTruthyEnv(process.env.BITBUCKET_LOG_PER_CWD)) {
        const sanitizedCwd = process
            .cwd()
            .replace(/[\\/]/g, '_')
            .replace(/[:*?"<>|]/g, '');
        effectiveDir = path.join(baseDir, sanitizedCwd);
    }
    try {
        fs.mkdirSync(effectiveDir, { recursive: true });
    }
    catch {
        return undefined;
    }
    return path.join(effectiveDir, 'bitbucket.log');
}
const resolvedLogFile = getLogFilePath();
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: resolvedLogFile
        ? [new winston.transports.File({ filename: resolvedLogFile })]
        : [],
});
// =========== DANGEROUS TOOLS PROTECTION ==========
const DANGEROUS_TOOLS = new Set([
    'bitbucket_delete_pull_request_comment',
    'bitbucket_delete_pull_request_task',
    'bitbucket_decline_pull_request',
    'bitbucket_merge_pull_request',
]);
function isDangerousTool(name) {
    if (DANGEROUS_TOOLS.has(name))
        return true;
    if (/^bitbucket_delete/i.test(name))
        return true;
    return false;
}
// =========== MCP SERVER ==========
const server = new Server({
    name: 'bitbucket-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
const bitbucket = new BitbucketService();
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    const allTools = [
        // ========== Repository Management ==========
        {
            name: 'bitbucket_list_repositories',
            description: 'List repositories in a Bitbucket project',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    start: { type: 'number', description: 'Start index (default: 0)' },
                    limit: { type: 'number', description: 'Limit (default: 25, max: 100)' },
                },
                required: ['project_key'],
            },
        },
        {
            name: 'bitbucket_get_repository',
            description: 'Get details of a specific repository',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                },
                required: ['project_key', 'repo_slug'],
            },
        },
        // ========== Pull Request Management ==========
        {
            name: 'bitbucket_get_pull_requests',
            description: 'List pull requests in a repository',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    start: { type: 'number', description: 'Start index (default: 0)' },
                    limit: { type: 'number', description: 'Limit (default: 25, max: 100)' },
                },
                required: ['project_key', 'repo_slug'],
            },
        },
        {
            name: 'bitbucket_create_pull_request',
            description: 'Create a new pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    title: { type: 'string', description: 'PR title' },
                    description: { type: 'string', description: 'PR description' },
                    source_branch: { type: 'string', description: 'Source branch name' },
                    target_branch: { type: 'string', description: 'Target branch name' },
                    source_repo_slug: { type: 'string', description: 'Source repository slug (for fork PRs)' },
                    reviewers: { type: 'array', items: { type: 'string' }, description: 'Reviewer usernames' },
                },
                required: ['project_key', 'repo_slug', 'title', 'description', 'source_branch', 'target_branch'],
            },
        },
        {
            name: 'bitbucket_get_pull_request',
            description: 'Get details of a specific pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id'],
            },
        },
        {
            name: 'bitbucket_update_pull_request',
            description: 'Update pull request title or description',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    version: { type: 'number', description: 'PR version (for optimistic locking)' },
                    title: { type: 'string', description: 'New title' },
                    description: { type: 'string', description: 'New description' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id', 'version'],
            },
        },
        {
            name: 'bitbucket_approve_pull_request',
            description: 'Approve a pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id'],
            },
        },
        {
            name: 'bitbucket_unapprove_pull_request',
            description: 'Remove approval from a pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id'],
            },
        },
        {
            name: 'bitbucket_decline_pull_request',
            description: 'Decline a pull request (DANGEROUS - requires BITBUCKET_ENABLE_DANGEROUS=true)',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    version: { type: 'number', description: 'PR version' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id', 'version'],
            },
        },
        {
            name: 'bitbucket_merge_pull_request',
            description: 'Merge a pull request (DANGEROUS - requires BITBUCKET_ENABLE_DANGEROUS=true)',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    version: { type: 'number', description: 'PR version' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id', 'version'],
            },
        },
        {
            name: 'bitbucket_get_pull_request_activity',
            description: 'Get activity log for a pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    start: { type: 'number', description: 'Start index (default: 0)' },
                    limit: { type: 'number', description: 'Limit (default: 25)' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id'],
            },
        },
        {
            name: 'bitbucket_get_pull_request_commits',
            description: 'Get commits for a pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    start: { type: 'number', description: 'Start index (default: 0)' },
                    limit: { type: 'number', description: 'Limit (default: 25)' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id'],
            },
        },
        {
            name: 'bitbucket_get_pull_request_diff',
            description: 'Get diff for a pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id'],
            },
        },
        {
            name: 'bitbucket_get_pull_request_patch',
            description: 'Get patch file for a pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id'],
            },
        },
        // ========== Comment Management ==========
        {
            name: 'bitbucket_get_pull_request_comments',
            description: 'Get comments for a pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    start: { type: 'number', description: 'Start index (default: 0)' },
                    limit: { type: 'number', description: 'Limit (default: 25)' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id'],
            },
        },
        {
            name: 'bitbucket_get_pull_request_comment',
            description: 'Get a specific comment',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    comment_id: { type: 'number', description: 'Comment ID' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id', 'comment_id'],
            },
        },
        {
            name: 'bitbucket_add_pull_request_comment',
            description: 'Add a comment to a pull request (supports inline comments)',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    text: { type: 'string', description: 'Comment text' },
                    parent_id: { type: 'number', description: 'Parent comment ID (for replies)' },
                    line: { type: 'number', description: 'Line number (for inline comments)' },
                    file_path: { type: 'string', description: 'File path (for inline comments)' },
                    line_type: { type: 'string', enum: ['ADDED', 'REMOVED', 'CONTEXT'], description: 'Line type' },
                    from_hash: { type: 'string', description: 'Source commit hash' },
                    to_hash: { type: 'string', description: 'Target commit hash' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id', 'text'],
            },
        },
        {
            name: 'bitbucket_update_pull_request_comment',
            description: 'Update a comment',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    comment_id: { type: 'number', description: 'Comment ID' },
                    text: { type: 'string', description: 'New comment text' },
                    version: { type: 'number', description: 'Comment version' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id', 'comment_id', 'text', 'version'],
            },
        },
        {
            name: 'bitbucket_delete_pull_request_comment',
            description: 'Delete a comment (DANGEROUS - requires BITBUCKET_ENABLE_DANGEROUS=true)',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    comment_id: { type: 'number', description: 'Comment ID' },
                    version: { type: 'number', description: 'Comment version' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id', 'comment_id', 'version'],
            },
        },
        // ========== Task Management ==========
        {
            name: 'bitbucket_get_pull_request_tasks',
            description: 'Get tasks for a pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id'],
            },
        },
        {
            name: 'bitbucket_create_pull_request_task',
            description: 'Create a task',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    pull_request_id: { type: 'number', description: 'Pull request ID' },
                    text: { type: 'string', description: 'Task text' },
                    comment_id: { type: 'number', description: 'Comment ID to attach task to' },
                },
                required: ['project_key', 'repo_slug', 'pull_request_id', 'text'],
            },
        },
        {
            name: 'bitbucket_get_pull_request_task',
            description: 'Get a specific task',
            inputSchema: {
                type: 'object',
                properties: {
                    task_id: { type: 'number', description: 'Task ID' },
                    project_key: { type: 'string', description: 'Project key (required for comment-based tasks)' },
                    repo_slug: { type: 'string', description: 'Repository slug (required for comment-based tasks)' },
                    pull_request_id: { type: 'number', description: 'Pull request ID (required for comment-based tasks)' },
                },
                required: ['task_id', 'project_key', 'repo_slug', 'pull_request_id'],
            },
        },
        {
            name: 'bitbucket_update_pull_request_task',
            description: 'Update a task',
            inputSchema: {
                type: 'object',
                properties: {
                    task_id: { type: 'number', description: 'Task ID' },
                    project_key: { type: 'string', description: 'Project key (required for markdown-based tasks)' },
                    repo_slug: { type: 'string', description: 'Repository slug (required for markdown-based tasks)' },
                    pull_request_id: { type: 'number', description: 'Pull request ID (required for markdown-based tasks)' },
                    text: { type: 'string', description: 'New task text' },
                    state: { type: 'string', enum: ['OPEN', 'RESOLVED'], description: 'Task state' },
                },
                required: ['task_id'],
            },
        },
        {
            name: 'bitbucket_delete_pull_request_task',
            description: 'Delete a task (DANGEROUS - requires BITBUCKET_ENABLE_DANGEROUS=true)',
            inputSchema: {
                type: 'object',
                properties: {
                    task_id: { type: 'number', description: 'Task ID' },
                },
                required: ['task_id'],
            },
        },
        // ========== Other Operations ==========
        {
            name: 'bitbucket_get_commits',
            description: 'Get commits for a repository',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    branch_name: { type: 'string', description: 'Branch name' },
                    start: { type: 'number', description: 'Start index (default: 0)' },
                    limit: { type: 'number', description: 'Limit (default: 25)' },
                },
                required: ['project_key', 'repo_slug', 'branch_name'],
            },
        },
        {
            name: 'bitbucket_get_file_content',
            description: 'Get file content from a repository',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    file_path: { type: 'string', description: 'File path' },
                },
                required: ['project_key', 'repo_slug', 'file_path'],
            },
        },
        {
            name: 'bitbucket_get_repo_structure',
            description: 'Get repository structure',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    path: { type: 'string', description: 'Path (default: root)' },
                    max_depth: { type: 'number', description: 'Max depth (default: 10, max: 10)' },
                },
                required: ['project_key', 'repo_slug'],
            },
        },
        {
            name: 'bitbucket_get_repository_branching_model',
            description: 'Get repository branching model configuration',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                },
                required: ['project_key', 'repo_slug'],
            },
        },
        {
            name: 'bitbucket_update_repository_branching_model_settings',
            description: 'Update repository branching model settings',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    development: {
                        type: 'object',
                        properties: {
                            refId: { type: 'string' },
                            useDefault: { type: 'boolean' },
                        },
                    },
                    production: {
                        type: 'object',
                        properties: {
                            refId: { type: 'string' },
                            useDefault: { type: 'boolean' },
                        },
                    },
                    types: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                displayName: { type: 'string' },
                                prefix: { type: 'string' },
                            },
                        },
                    },
                },
                required: ['project_key', 'repo_slug'],
            },
        },
        {
            name: 'bitbucket_get_effective_default_reviewers',
            description: 'Get default reviewers for a repository',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug' },
                    source_ref: { type: 'string', description: 'Source ref' },
                    target_ref: { type: 'string', description: 'Target ref' },
                },
                required: ['project_key', 'repo_slug'],
            },
        },
        {
            name: 'bitbucket_get_pending_review_prs',
            description: 'Get open PRs pending review',
            inputSchema: {
                type: 'object',
                properties: {
                    project_key: { type: 'string', description: 'Project key' },
                    repo_slug: { type: 'string', description: 'Repository slug (optional)' },
                },
                required: ['project_key'],
            },
        },
    ];
    // Filter out dangerous tools if not enabled
    const enableDangerous = isTruthyEnv(process.env.BITBUCKET_ENABLE_DANGEROUS);
    const tools = enableDangerous
        ? allTools
        : allTools.filter((tool) => !isDangerousTool(tool.name));
    return { tools };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        // Check dangerous operations
        if (isDangerousTool(name) && !isTruthyEnv(process.env.BITBUCKET_ENABLE_DANGEROUS)) {
            throw new McpError(ErrorCode.InvalidRequest, `Tool ${name} is disabled. Set BITBUCKET_ENABLE_DANGEROUS=true to enable.`);
        }
        logger.info(`Executing tool: ${name}`, { args });
        let result;
        switch (name) {
            // ========== Repository Management ==========
            case 'bitbucket_list_repositories':
                result = await bitbucket.getRepos(args.project_key, args.start, args.limit);
                break;
            case 'bitbucket_get_repository':
                result = await bitbucket.getRepository(args.project_key, args.repo_slug);
                break;
            // ========== Pull Request Management ==========
            case 'bitbucket_get_pull_requests':
                result = await bitbucket.getPullRequests(args.project_key, args.repo_slug, args.start, args.limit);
                break;
            case 'bitbucket_create_pull_request':
                result = await bitbucket.createPullRequest(args.project_key, args.repo_slug, args.title, args.description, args.source_branch, args.target_branch, args.source_repo_slug, args.reviewers);
                break;
            case 'bitbucket_get_pull_request':
                result = await bitbucket.getPullRequest(args.project_key, args.repo_slug, args.pull_request_id);
                break;
            case 'bitbucket_update_pull_request':
                result = await bitbucket.updatePullRequest(args.project_key, args.repo_slug, args.pull_request_id, args.version, args.title, args.description);
                break;
            case 'bitbucket_approve_pull_request':
                result = await bitbucket.approvePullRequest(args.project_key, args.repo_slug, args.pull_request_id);
                break;
            case 'bitbucket_unapprove_pull_request':
                result = await bitbucket.unapprovePullRequest(args.project_key, args.repo_slug, args.pull_request_id);
                break;
            case 'bitbucket_decline_pull_request':
                result = await bitbucket.declinePullRequest(args.project_key, args.repo_slug, args.pull_request_id, args.version);
                break;
            case 'bitbucket_merge_pull_request':
                result = await bitbucket.mergePullRequest(args.project_key, args.repo_slug, args.pull_request_id, args.version);
                break;
            case 'bitbucket_get_pull_request_activity':
                result = await bitbucket.getPullRequestActivity(args.project_key, args.repo_slug, args.pull_request_id, args.start, args.limit);
                break;
            case 'bitbucket_get_pull_request_commits':
                result = await bitbucket.getPullRequestCommits(args.project_key, args.repo_slug, args.pull_request_id, args.start, args.limit);
                break;
            case 'bitbucket_get_pull_request_diff':
                result = await bitbucket.getPullRequestDiff(args.project_key, args.repo_slug, args.pull_request_id);
                break;
            case 'bitbucket_get_pull_request_patch':
                result = await bitbucket.getPullRequestPatch(args.project_key, args.repo_slug, args.pull_request_id);
                break;
            // ========== Comment Management ==========
            case 'bitbucket_get_pull_request_comments':
                result = await bitbucket.getPullRequestComments(args.project_key, args.repo_slug, args.pull_request_id, args.start, args.limit);
                break;
            case 'bitbucket_get_pull_request_comment':
                result = await bitbucket.getPullRequestComment(args.project_key, args.repo_slug, args.pull_request_id, args.comment_id);
                break;
            case 'bitbucket_add_pull_request_comment':
                result = await bitbucket.addPullRequestComment(args.project_key, args.repo_slug, args.pull_request_id, args.text, args.parent_id, args.line, args.file_path, args.line_type, args.from_hash, args.to_hash);
                break;
            case 'bitbucket_update_pull_request_comment':
                result = await bitbucket.updatePullRequestComment(args.project_key, args.repo_slug, args.pull_request_id, args.comment_id, args.text, args.version);
                break;
            case 'bitbucket_delete_pull_request_comment':
                result = await bitbucket.deletePullRequestComment(args.project_key, args.repo_slug, args.pull_request_id, args.comment_id, args.version);
                break;
            // ========== Task Management ==========
            case 'bitbucket_get_pull_request_tasks':
                result = await bitbucket.getPullRequestTasks(args.project_key, args.repo_slug, args.pull_request_id);
                break;
            case 'bitbucket_create_pull_request_task':
                result = await bitbucket.createPullRequestTask(args.project_key, args.repo_slug, args.pull_request_id, args.text, args.comment_id);
                break;
            case 'bitbucket_get_pull_request_task':
                result = await bitbucket.getPullRequestTask(args.task_id, args.project_key, args.repo_slug, args.pull_request_id);
                break;
            case 'bitbucket_update_pull_request_task':
                result = await bitbucket.updatePullRequestTask(args.task_id, args.text, args.state, args.project_key, args.repo_slug, args.pull_request_id);
                break;
            case 'bitbucket_delete_pull_request_task':
                result = await bitbucket.deletePullRequestTask(args.task_id);
                break;
            // ========== Other Operations ==========
            case 'bitbucket_get_commits':
                result = await bitbucket.getCommits(args.project_key, args.repo_slug, args.branch_name, args.start, args.limit);
                break;
            case 'bitbucket_get_file_content':
                result = await bitbucket.getFileContent(args.project_key, args.repo_slug, args.file_path);
                break;
            case 'bitbucket_get_repo_structure':
                result = await bitbucket.getRepoStructure(args.project_key, args.repo_slug, args.path, args.max_depth);
                break;
            case 'bitbucket_get_repository_branching_model':
                result = await bitbucket.getRepositoryBranchingModel(args.project_key, args.repo_slug);
                break;
            case 'bitbucket_update_repository_branching_model_settings':
                result = await bitbucket.updateRepositoryBranchingModelSettings(args.project_key, args.repo_slug, args.development, args.production, args.types);
                break;
            case 'bitbucket_get_effective_default_reviewers':
                result = await bitbucket.getEffectiveDefaultReviewers(args.project_key, args.repo_slug, args.source_ref, args.target_ref);
                break;
            case 'bitbucket_get_pending_review_prs':
                result = await bitbucket.getPendingReviewPRs(args.project_key, args.repo_slug);
                break;
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
        logger.info(`Tool ${name} completed successfully`);
        return {
            content: [
                {
                    type: 'text',
                    text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    catch (error) {
        logger.error(`Tool ${name} failed`, { error });
        throw new McpError(ErrorCode.InternalError, `Failed to execute ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Bitbucket MCP server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map