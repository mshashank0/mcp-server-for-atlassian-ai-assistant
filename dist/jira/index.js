#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { JiraService } from './service.js';
const server = new Server({
    name: 'jira-mcp',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
const jira = new JiraService();
// List available tools - Phase 1: Core Functions (11 tools)
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'jira_get_issue',
                description: 'Get a Jira issue by key with detailed options',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The Jira issue key',
                        },
                        expand: {
                            type: 'string',
                            description: 'Comma-separated list of fields to expand',
                        },
                        comment_limit: {
                            type: 'number',
                            description: 'Maximum number of comments to retrieve',
                            default: 10,
                        },
                        fields: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of fields to retrieve',
                        },
                        properties: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of properties to retrieve',
                        },
                        update_history: {
                            type: 'boolean',
                            description: 'Whether to update history',
                            default: true,
                        },
                    },
                    required: ['issue_key'],
                },
            },
            {
                name: 'jira_create_issue',
                description: 'Create a new Jira issue',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project: {
                            type: 'object',
                            description: 'Project key or ID',
                            properties: {
                                key: { type: 'string' },
                            },
                            required: ['key'],
                        },
                        summary: {
                            type: 'string',
                            description: 'Issue summary',
                        },
                        issuetype: {
                            type: 'object',
                            description: 'Issue type',
                            properties: {
                                name: { type: 'string' },
                            },
                            required: ['name'],
                        },
                        description: {
                            type: 'string',
                            description: 'Issue description',
                        },
                        assignee: {
                            type: 'object',
                            description: 'Assignee',
                            properties: {
                                name: { type: 'string' },
                            },
                        },
                        reporter: {
                            type: 'object',
                            description: 'Reporter',
                            properties: {
                                name: { type: 'string' },
                            },
                        },
                        labels: {
                            type: 'array',
                            description: 'Issue labels',
                            items: { type: 'string' },
                        },
                        priority: {
                            type: 'object',
                            description: 'Issue priority',
                            properties: {
                                name: { type: 'string' },
                            },
                        },
                        components: {
                            type: 'array',
                            description: 'Components',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                },
                            },
                        },
                        fixVersions: {
                            type: 'array',
                            description: 'Fix versions',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                },
                            },
                        },
                        duedate: {
                            type: 'string',
                            description: 'Due date (YYYY-MM-DD format)',
                        },
                        parent: {
                            type: 'object',
                            description: 'Parent issue (for sub-tasks)',
                            properties: {
                                key: { type: 'string' },
                            },
                        },
                        timetracking: {
                            type: 'object',
                            description: 'Time tracking',
                            properties: {
                                originalEstimate: { type: 'string', description: 'e.g., "3h 30m"' },
                                remainingEstimate: { type: 'string', description: 'e.g., "2h"' },
                            },
                        },
                        environment: {
                            type: 'string',
                            description: 'Environment information',
                        },
                        sprint_id: {
                            type: 'number',
                            description: 'Sprint ID (optional)',
                        },
                        custom_fields: {
                            type: 'object',
                            description: 'Custom fields as key-value pairs (e.g., {"customfield_10001": "value"})',
                        },
                    },
                    required: ['project', 'summary', 'issuetype'],
                },
            },
            // COMMENTED OUT: Update issue functionality
            // {
            //   name: 'update_issue',
            //   description: 'Update a Jira issue',
            //   inputSchema: {
            //     type: 'object',
            //     properties: {
            //       issue_key: {
            //         type: 'string',
            //         description: 'The Jira issue key',
            //       },
            //       fields: {
            //         type: 'object',
            //         description: 'Fields to update',
            //       },
            //     },
            //     required: ['issue_key', 'fields'],
            //   },
            // },
            // COMMENTED OUT: Delete issue functionality
            // {
            //   name: 'delete_issue',
            //   description: 'Delete a Jira issue',
            //   inputSchema: {
            //     type: 'object',
            //     properties: {
            //       issue_key: {
            //         type: 'string',
            //         description: 'The Jira issue key',
            //       },
            //     },
            //     required: ['issue_key'],
            //   },
            // },
            {
                name: 'jira_search_issues',
                description: 'Search for issues using JQL',
                inputSchema: {
                    type: 'object',
                    properties: {
                        jql: {
                            type: 'string',
                            description: 'JQL query string',
                        },
                        fields: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Fields to retrieve',
                        },
                        start: {
                            type: 'number',
                            description: 'Starting index',
                            default: 0,
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 50,
                        },
                        expand: {
                            type: 'string',
                            description: 'Fields to expand',
                        },
                        projects_filter: {
                            type: 'string',
                            description: 'Comma-separated list of project keys to filter',
                        },
                    },
                    required: ['jql'],
                },
            },
            {
                name: 'jira_get_board_issues',
                description: 'Get issues for a specific board',
                inputSchema: {
                    type: 'object',
                    properties: {
                        board_id: {
                            type: 'string',
                            description: 'The board ID',
                        },
                        jql: {
                            type: 'string',
                            description: 'JQL query string',
                        },
                        fields: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Fields to retrieve',
                        },
                        start: {
                            type: 'number',
                            description: 'Starting index',
                            default: 0,
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 50,
                        },
                        expand: {
                            type: 'string',
                            description: 'Fields to expand',
                        },
                    },
                    required: ['board_id', 'jql'],
                },
            },
            {
                name: 'jira_get_sprint_issues',
                description: 'Get issues for a specific sprint',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sprint_id: {
                            type: 'string',
                            description: 'The sprint ID',
                        },
                        fields: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Fields to retrieve',
                        },
                        start: {
                            type: 'number',
                            description: 'Starting index',
                            default: 0,
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 50,
                        },
                    },
                    required: ['sprint_id'],
                },
            },
            {
                name: 'jira_get_issue_comments',
                description: 'Get comments for a specific issue',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The Jira issue key',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of comments',
                            default: 50,
                        },
                    },
                    required: ['issue_key'],
                },
            },
            {
                name: 'jira_add_comment',
                description: 'Add a comment to an issue',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The Jira issue key',
                        },
                        comment: {
                            type: 'string',
                            description: 'Comment text (supports Markdown)',
                        },
                    },
                    required: ['issue_key', 'comment'],
                },
            },
            {
                name: 'jira_batch_create_issues',
                description: 'Create multiple issues in a batch',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issues: {
                            type: 'array',
                            items: { type: 'object' },
                            description: 'Array of issue fields',
                        },
                        validate_only: {
                            type: 'boolean',
                            description: 'Only validate without creating',
                            default: false,
                        },
                    },
                    required: ['issues'],
                },
            },
            {
                name: 'jira_get_issue_changelog',
                description: 'Get changelog history for a specific issue (Server/Data Center compatible)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The issue key (e.g., PROJ-123)',
                        },
                        start_at: {
                            type: 'number',
                            description: 'Starting index for pagination',
                            default: 0,
                        },
                        max_results: {
                            type: 'number',
                            description: 'Maximum number of changelog entries to return',
                            default: 100,
                        },
                    },
                    required: ['issue_key'],
                },
            },
            // Phase 2: Project Management (14 tools)
            {
                name: 'jira_get_all_projects',
                description: 'Get all projects',
                inputSchema: {
                    type: 'object',
                    properties: {
                        include_archived: {
                            type: 'boolean',
                            description: 'Include archived projects',
                            default: false,
                        },
                    },
                },
            },
            {
                name: 'jira_get_project',
                description: 'Get project details',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                    },
                    required: ['project_key'],
                },
            },
            {
                name: 'jira_get_project_model',
                description: 'Get project model',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                    },
                    required: ['project_key'],
                },
            },
            {
                name: 'jira_project_exists',
                description: 'Check if project exists',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                    },
                    required: ['project_key'],
                },
            },
            {
                name: 'jira_get_project_components',
                description: 'Get project components',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                    },
                    required: ['project_key'],
                },
            },
            {
                name: 'jira_get_project_versions',
                description: 'Get project versions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                    },
                    required: ['project_key'],
                },
            },
            {
                name: 'jira_get_project_roles',
                description: 'Get project roles',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                    },
                    required: ['project_key'],
                },
            },
            // NOTE: Disabled - Requires admin permissions (401 Unauthorized)
            // {
            //   name: 'get_project_role_members',
            //   description: 'Get project role members',
            //   inputSchema: {
            //     type: 'object',
            //     properties: {
            //       project_key: {
            //         type: 'string',
            //         description: 'The project key',
            //       },
            //       role_id: {
            //         type: 'string',
            //         description: 'The role ID',
            //       },
            //     },
            //     required: ['project_key', 'role_id'],
            //   },
            // },
            {
                name: 'jira_get_my_project_permissions',
                description: 'Get current user permissions for a project (returns all permissions the user has)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                    },
                    required: ['project_key'],
                },
            },
            // NOTE: Disabled - Not supported in Jira Server 9.4 (returns 400 Bad Request)
            // {
            //   name: 'get_project_notification_scheme',
            //   description: 'Get project notification scheme',
            //   inputSchema: {
            //     type: 'object',
            //     properties: {
            //       project_key: {
            //         type: 'string',
            //         description: 'The project key',
            //       },
            //     },
            //     required: ['project_key'],
            //   },
            // },
            {
                name: 'jira_get_project_issue_types',
                description: 'Get project issue types',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                    },
                    required: ['project_key'],
                },
            },
            {
                name: 'jira_get_project_statuses',
                description: 'Get project statuses',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                    },
                    required: ['project_key'],
                },
            },
            {
                name: 'jira_get_project_priorities',
                description: 'Get all priorities',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'jira_get_project_resolutions',
                description: 'Get all resolutions',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'jira_get_project_issues_count',
                description: 'Get project issues count',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                    },
                    required: ['project_key'],
                },
            },
            {
                name: 'jira_get_project_issues',
                description: 'Get project issues',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                        start: {
                            type: 'number',
                            description: 'Starting index',
                            default: 0,
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 50,
                        },
                    },
                    required: ['project_key'],
                },
            },
            {
                name: 'jira_create_project_version',
                description: 'Create project version',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_key: {
                            type: 'string',
                            description: 'The project key',
                        },
                        name: {
                            type: 'string',
                            description: 'Version name',
                        },
                        start_date: {
                            type: 'string',
                            description: 'Start date (YYYY-MM-DD)',
                        },
                        release_date: {
                            type: 'string',
                            description: 'Release date (YYYY-MM-DD)',
                        },
                        description: {
                            type: 'string',
                            description: 'Version description',
                        },
                    },
                    required: ['project_key', 'name'],
                },
            },
            // Phase 3: Agile Features (8 tools)
            {
                name: 'jira_link_issue_to_epic',
                description: 'Link issue to epic',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The issue key',
                        },
                        epic_key: {
                            type: 'string',
                            description: 'The epic key',
                        },
                    },
                    required: ['issue_key', 'epic_key'],
                },
            },
            {
                name: 'jira_get_epic_issues',
                description: 'Get epic issues',
                inputSchema: {
                    type: 'object',
                    properties: {
                        epic_key: {
                            type: 'string',
                            description: 'The epic key',
                        },
                        start: {
                            type: 'number',
                            description: 'Starting index',
                            default: 0,
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 50,
                        },
                    },
                    required: ['epic_key'],
                },
            },
            {
                name: 'jira_get_all_sprints_from_board',
                description: 'Get all sprints from board',
                inputSchema: {
                    type: 'object',
                    properties: {
                        board_id: {
                            type: 'string',
                            description: 'The board ID',
                        },
                        state: {
                            type: 'string',
                            description: 'Sprint state (future, active, closed)',
                        },
                        start: {
                            type: 'number',
                            description: 'Starting index',
                            default: 0,
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 50,
                        },
                    },
                    required: ['board_id'],
                },
            },
            {
                name: 'jira_get_all_sprints_from_board_model',
                description: 'Get all sprints from board model',
                inputSchema: {
                    type: 'object',
                    properties: {
                        board_id: {
                            type: 'string',
                            description: 'The board ID',
                        },
                        state: {
                            type: 'string',
                            description: 'Sprint state (future, active, closed)',
                        },
                        start: {
                            type: 'number',
                            description: 'Starting index',
                            default: 0,
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 50,
                        },
                    },
                    required: ['board_id'],
                },
            },
            // COMMENTED OUT: Update sprint functionality
            // {
            //   name: 'update_sprint',
            //   description: 'Update sprint',
            //   inputSchema: {
            //     type: 'object',
            //     properties: {
            //       sprint_id: {
            //         type: 'string',
            //         description: 'The sprint ID',
            //       },
            //       sprint_name: {
            //         type: 'string',
            //         description: 'Sprint name',
            //       },
            //       state: {
            //         type: 'string',
            //         description: 'Sprint state',
            //       },
            //       start_date: {
            //         type: 'string',
            //         description: 'Start date',
            //       },
            //       end_date: {
            //         type: 'string',
            //         description: 'End date',
            //       },
            //       goal: {
            //         type: 'string',
            //         description: 'Sprint goal',
            //       },
            //     },
            //     required: ['sprint_id'],
            //   },
            // },
            {
                name: 'jira_create_sprint',
                description: 'Create sprint',
                inputSchema: {
                    type: 'object',
                    properties: {
                        board_id: {
                            type: 'string',
                            description: 'The board ID',
                        },
                        sprint_name: {
                            type: 'string',
                            description: 'Sprint name',
                        },
                        start_date: {
                            type: 'string',
                            description: 'Start date',
                        },
                        end_date: {
                            type: 'string',
                            description: 'End date',
                        },
                        goal: {
                            type: 'string',
                            description: 'Sprint goal',
                        },
                    },
                    required: ['board_id', 'sprint_name', 'start_date', 'end_date'],
                },
            },
            {
                name: 'jira_get_all_active_sprints',
                description: 'Get all active sprints',
                inputSchema: {
                    type: 'object',
                    properties: {
                        start: {
                            type: 'number',
                            description: 'Starting index',
                            default: 0,
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 50,
                        },
                    },
                },
            },
            {
                name: 'jira_get_sprint_details',
                description: 'Get sprint details',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sprint_id: {
                            type: 'string',
                            description: 'The sprint ID',
                        },
                    },
                    required: ['sprint_id'],
                },
            },
            {
                name: 'jira_start_sprint',
                description: 'Start a sprint',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sprint_id: {
                            type: 'string',
                            description: 'The sprint ID',
                        },
                    },
                    required: ['sprint_id'],
                },
            },
            {
                name: 'jira_complete_sprint',
                description: 'Complete a sprint',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sprint_id: {
                            type: 'string',
                            description: 'The sprint ID',
                        },
                    },
                    required: ['sprint_id'],
                },
            },
            {
                name: 'jira_get_all_agile_boards',
                description: 'Get all agile boards',
                inputSchema: {
                    type: 'object',
                    properties: {
                        board_name: {
                            type: 'string',
                            description: 'Board name',
                        },
                        project_key: {
                            type: 'string',
                            description: 'Project key',
                        },
                        board_type: {
                            type: 'string',
                            description: 'Board type',
                        },
                        start: {
                            type: 'number',
                            description: 'Starting index',
                            default: 0,
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 50,
                        },
                    },
                },
            },
            {
                name: 'jira_get_all_agile_boards_model',
                description: 'Get all agile boards model',
                inputSchema: {
                    type: 'object',
                    properties: {
                        board_name: {
                            type: 'string',
                            description: 'Board name',
                        },
                        project_key: {
                            type: 'string',
                            description: 'Project key',
                        },
                        board_type: {
                            type: 'string',
                            description: 'Board type',
                        },
                        start: {
                            type: 'number',
                            description: 'Starting index',
                            default: 0,
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 50,
                        },
                    },
                },
            },
            // Phase 4: Advanced Features (15 tools)
            {
                name: 'jira_add_worklog',
                description: 'Add worklog',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The issue key',
                        },
                        time_spent: {
                            type: 'string',
                            description: 'Time spent (e.g., "3h 30m")',
                        },
                        comment: {
                            type: 'string',
                            description: 'Worklog comment',
                        },
                        started: {
                            type: 'string',
                            description: 'Start time',
                        },
                        original_estimate: {
                            type: 'string',
                            description: 'Original estimate',
                        },
                        remaining_estimate: {
                            type: 'string',
                            description: 'Remaining estimate',
                        },
                    },
                    required: ['issue_key', 'time_spent'],
                },
            },
            {
                name: 'jira_get_worklog',
                description: 'Get worklog',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The issue key',
                        },
                    },
                    required: ['issue_key'],
                },
            },
            {
                name: 'jira_get_worklog_models',
                description: 'Get worklog models',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The issue key',
                        },
                    },
                    required: ['issue_key'],
                },
            },
            {
                name: 'jira_get_worklogs',
                description: 'Get worklogs',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The issue key',
                        },
                    },
                    required: ['issue_key'],
                },
            },
            {
                name: 'jira_get_available_transitions',
                description: 'Get available transitions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The issue key',
                        },
                    },
                    required: ['issue_key'],
                },
            },
            {
                name: 'jira_get_transitions',
                description: 'Get transitions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The issue key',
                        },
                    },
                    required: ['issue_key'],
                },
            },
            {
                name: 'jira_get_transitions_models',
                description: 'Get transitions models',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The issue key',
                        },
                    },
                    required: ['issue_key'],
                },
            },
            {
                name: 'jira_transition_issue',
                description: 'Transition issue',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_key: {
                            type: 'string',
                            description: 'The issue key',
                        },
                        transition_id: {
                            type: 'string',
                            description: 'The transition ID',
                        },
                        fields: {
                            type: 'object',
                            description: 'Fields to update',
                        },
                        comment: {
                            type: 'string',
                            description: 'Transition comment',
                        },
                    },
                    required: ['issue_key', 'transition_id'],
                },
            },
            {
                name: 'jira_get_fields',
                description: 'Get fields',
                inputSchema: {
                    type: 'object',
                    properties: {
                        refresh: {
                            type: 'boolean',
                            description: 'Refresh cache',
                            default: false,
                        },
                    },
                },
            },
            {
                name: 'jira_get_field_id',
                description: 'Get field ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        field_name: {
                            type: 'string',
                            description: 'Field name',
                        },
                        refresh: {
                            type: 'boolean',
                            description: 'Refresh cache',
                            default: false,
                        },
                    },
                    required: ['field_name'],
                },
            },
            {
                name: 'jira_get_field_by_id',
                description: 'Get field by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        field_id: {
                            type: 'string',
                            description: 'Field ID',
                        },
                        refresh: {
                            type: 'boolean',
                            description: 'Refresh cache',
                            default: false,
                        },
                    },
                    required: ['field_id'],
                },
            },
            {
                name: 'jira_get_custom_fields',
                description: 'Get custom fields',
                inputSchema: {
                    type: 'object',
                    properties: {
                        refresh: {
                            type: 'boolean',
                            description: 'Refresh cache',
                            default: false,
                        },
                    },
                },
            },
            {
                name: 'jira_get_required_fields',
                description: 'Get required fields',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue_type: {
                            type: 'string',
                            description: 'Issue type',
                        },
                        project_key: {
                            type: 'string',
                            description: 'Project key',
                        },
                    },
                    required: ['issue_type', 'project_key'],
                },
            },
            {
                name: 'jira_get_field_ids_to_epic',
                description: 'Get field IDs to epic',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'jira_search_fields',
                description: 'Search fields',
                inputSchema: {
                    type: 'object',
                    properties: {
                        keyword: {
                            type: 'string',
                            description: 'Search keyword',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results',
                            default: 10,
                        },
                        refresh: {
                            type: 'boolean',
                            description: 'Refresh cache',
                            default: false,
                        },
                    },
                    required: ['keyword'],
                },
            },
            // COMMENTED OUT: Create custom field
            // {
            //   name: 'create_custom_field',
            //   description: 'Create custom field (DISABLED - dangerous operation)',
            //   inputSchema: {
            //     type: 'object',
            //     properties: {
            //       name: {
            //         type: 'string',
            //         description: 'Field name',
            //       },
            //       description: {
            //         type: 'string',
            //         description: 'Field description',
            //       },
            //       type: {
            //         type: 'string',
            //         description: 'Field type',
            //       },
            //       searcher_key: {
            //         type: 'string',
            //         description: 'Searcher key',
            //       },
            //     },
            //     required: ['name', 'type', 'searcher_key'],
            //   },
            // },
            // COMMENTED OUT: Update custom field
            // {
            //   name: 'update_custom_field',
            //   description: 'Update custom field (DISABLED - dangerous operation)',
            //   inputSchema: {
            //     type: 'object',
            //     properties: {
            //       field_id: {
            //         type: 'string',
            //         description: 'Field ID',
            //       },
            //       name: {
            //         type: 'string',
            //         description: 'New field name',
            //       },
            //       description: {
            //         type: 'string',
            //         description: 'New field description',
            //       },
            //     },
            //     required: ['field_id'],
            //   },
            // },
            // COMMENTED OUT: Delete custom field
            // {
            //   name: 'delete_custom_field',
            //   description: 'Delete custom field (DISABLED - extremely dangerous operation)',
            //   inputSchema: {
            //     type: 'object',
            //     properties: {
            //       field_id: {
            //         type: 'string',
            //         description: 'Field ID',
            //       },
            //     },
            //     required: ['field_id'],
            //   },
            // },
            {
                name: 'jira_get_issue_picker_suggestions',
                description: 'Get issue picker suggestions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query',
                        },
                        current_issue_key: {
                            type: 'string',
                            description: 'Current issue key (optional)',
                        },
                        current_project_id: {
                            type: 'string',
                            description: 'Current project ID (optional)',
                        },
                    },
                    required: ['query'],
                },
            },
        ],
    };
});
// Handle tool calls - Phase 1: Core Functions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'jira_get_issue': {
                const result = await jira.getIssue(args.issue_key, {
                    expand: args.expand,
                    comment_limit: args.comment_limit,
                    fields: args.fields,
                    properties: args.properties,
                    update_history: args.update_history,
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
            case 'jira_create_issue': {
                const issueData = { ...args };
                // If sprint_id is provided, add it as customfield_10301 (as number)
                if (args.sprint_id) {
                    issueData.customfield_10301 = args.sprint_id;
                    delete issueData.sprint_id; // Remove sprint_id from the issue data
                }
                // Merge custom_fields if provided
                if (args.custom_fields) {
                    Object.assign(issueData, args.custom_fields);
                    delete issueData.custom_fields; // Remove custom_fields wrapper
                }
                const result = await jira.createIssue(issueData);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            // COMMENTED OUT: Update issue functionality
            // case 'jira_update_issue': {
            //   const result = await jira.updateIssue(
            //     args.issue_key as string,
            //     args.fields as Record<string, any>
            //   );
            //   return {
            //     content: [
            //       {
            //         type: 'text',
            //         text: JSON.stringify(result, null, 2),
            //       },
            //     ],
            //   };
            // }
            // COMMENTED OUT: Delete issue functionality
            // case 'jira_delete_issue': {
            //   const result = await jira.deleteIssue(args.issue_key as string);
            //   return {
            //     content: [
            //       {
            //         type: 'text',
            //         text: JSON.stringify({ success: result }, null, 2),
            //       },
            //     ],
            //   };
            // }
            case 'jira_search_issues': {
                const result = await jira.searchIssues(args.jql, {
                    fields: args.fields,
                    start: args.start,
                    limit: args.limit,
                    expand: args.expand,
                    projects_filter: args.projects_filter,
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
            case 'jira_get_board_issues': {
                const result = await jira.getBoardIssues(args.board_id, args.jql, {
                    fields: args.fields,
                    start: args.start,
                    limit: args.limit,
                    expand: args.expand,
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
            case 'jira_get_sprint_issues': {
                const result = await jira.getSprintIssues(args.sprint_id, {
                    fields: args.fields,
                    start: args.start,
                    limit: args.limit,
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
            case 'jira_get_issue_comments': {
                const result = await jira.getIssueComments(args.issue_key, args.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_add_comment': {
                const result = await jira.addComment(args.issue_key, args.comment);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_batch_create_issues': {
                const result = await jira.batchCreateIssues(args.issues, args.validate_only);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_issue_changelog': {
                const { issue_key, start_at = 0, max_results = 100 } = args;
                const result = await jira.getIssueChangelog(issue_key, start_at, max_results);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            // Phase 2: Project Management
            case 'jira_get_all_projects': {
                const result = await jira.getAllProjects(args.include_archived);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_project': {
                const result = await jira.getProject(args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_project_model': {
                const result = await jira.getProjectModel(args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_project_exists': {
                const result = await jira.projectExists(args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ exists: result }, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_project_components': {
                const result = await jira.getProjectComponents(args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_project_versions': {
                const result = await jira.getProjectVersions(args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_project_roles': {
                const result = await jira.getProjectRoles(args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            // NOTE: Disabled - Requires admin permissions
            // case 'jira_get_project_role_members': {
            //   const result = await jira.getProjectRoleMembers(
            //     args.project_key as string,
            //     args.role_id as string
            //   );
            //   return {
            //     content: [
            //       {
            //         type: 'text',
            //         text: JSON.stringify(result, null, 2),
            //       },
            //     ],
            //   };
            // }
            case 'jira_get_my_project_permissions': {
                const result = await jira.getMyProjectPermissions(args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            // NOTE: Disabled - Not supported in Jira Server 9.4
            // case 'jira_get_project_notification_scheme': {
            //   const result = await jira.getProjectNotificationScheme(args.project_key as string);
            //   return {
            //     content: [
            //       {
            //         type: 'text',
            //         text: JSON.stringify(result, null, 2),
            //       },
            //     ],
            //   };
            // }
            case 'jira_get_project_issue_types': {
                const result = await jira.getProjectIssueTypes(args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_project_statuses': {
                const result = await jira.getProjectStatuses(args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_project_priorities': {
                const result = await jira.getProjectPriorities();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_project_resolutions': {
                const result = await jira.getProjectResolutions();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_project_issues_count': {
                const result = await jira.getProjectIssuesCount(args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ count: result }, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_project_issues': {
                const result = await jira.getProjectIssues(args.project_key, args.start, args.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_create_project_version': {
                const result = await jira.createProjectVersion(args.project_key, args.name, args.start_date, args.release_date, args.description);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            // Phase 3: Agile Features
            case 'jira_link_issue_to_epic': {
                const result = await jira.linkIssueToEpic(args.issue_key, args.epic_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_epic_issues': {
                const result = await jira.getEpicIssues(args.epic_key, args.start, args.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_all_sprints_from_board': {
                const result = await jira.getAllSprintsFromBoard(args.board_id, args.state, args.start, args.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_all_sprints_from_board_model': {
                const result = await jira.getAllSprintsFromBoardModel(args.board_id, args.state, args.start, args.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            // COMMENTED OUT: Update sprint functionality
            // case 'jira_update_sprint': {
            //   const result = await jira.updateSprint(
            //     args.sprint_id as string,
            //     args.sprint_name as string | undefined,
            //     args.state as string | undefined,
            //     args.start_date as string | undefined,
            //     args.end_date as string | undefined,
            //     args.goal as string | undefined
            //   );
            //   return {
            //     content: [
            //       {
            //         type: 'text',
            //         text: JSON.stringify(result, null, 2),
            //       },
            //     ],
            //   };
            // }
            case 'jira_create_sprint': {
                const result = await jira.createSprint(args.board_id, {
                    name: args.sprint_name,
                    start_date: args.start_date,
                    end_date: args.end_date,
                    goal: args.goal,
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
            case 'jira_get_all_active_sprints': {
                const result = await jira.getAllActiveSprints(args.start, args.limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_sprint_details': {
                const result = await jira.getSprintDetails(args.sprint_id);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_start_sprint': {
                const result = await jira.startSprint(args.sprint_id);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_complete_sprint': {
                const result = await jira.completeSprint(args.sprint_id);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_all_agile_boards': {
                const result = await jira.getAllAgileBoards({
                    board_name: args.board_name,
                    project_key: args.project_key,
                    board_type: args.board_type,
                    start: args.start,
                    limit: args.limit,
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
            case 'jira_get_all_agile_boards_model': {
                const result = await jira.getAllAgileBoardsModel({
                    board_name: args.board_name,
                    project_key: args.project_key,
                    board_type: args.board_type,
                    start: args.start,
                    limit: args.limit,
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
            // Phase 4: Advanced Features
            case 'jira_add_worklog': {
                const result = await jira.addWorklog(args.issue_key, {
                    time_spent: args.time_spent,
                    comment: args.comment,
                    started: args.started,
                    original_estimate: args.original_estimate,
                    remaining_estimate: args.remaining_estimate,
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
            case 'jira_get_worklog': {
                const result = await jira.getWorklog(args.issue_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_worklog_models': {
                const result = await jira.getWorklogModels(args.issue_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_worklogs': {
                const result = await jira.getWorklogs(args.issue_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_available_transitions': {
                const result = await jira.getAvailableTransitions(args.issue_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_transitions': {
                const result = await jira.getTransitions(args.issue_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_transitions_models': {
                const result = await jira.getTransitionsModels(args.issue_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_transition_issue': {
                const result = await jira.transitionIssue(args.issue_key, args.transition_id, args.fields, args.comment);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_fields': {
                const result = await jira.getFields(args.refresh);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_field_id': {
                const result = await jira.getFieldId(args.field_name, args.refresh);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ field_id: result }, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_field_by_id': {
                const result = await jira.getFieldById(args.field_id, args.refresh);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_custom_fields': {
                const result = await jira.getCustomFields(args.refresh);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_required_fields': {
                const result = await jira.getRequiredFields(args.issue_type, args.project_key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_field_ids_to_epic': {
                const result = await jira.getFieldIdsToEpic();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_search_fields': {
                const result = await jira.searchFields(args.keyword, args.limit, args.refresh);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'jira_get_issue_picker_suggestions': {
                const result = await jira.getIssuePickerSuggestions(args.query, args.current_issue_key, args.current_project_id);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ error: error.message }),
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
    console.error('Jira MCP server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map