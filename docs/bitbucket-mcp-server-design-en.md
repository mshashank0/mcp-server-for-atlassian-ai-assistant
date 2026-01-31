# Bitbucket MCP Server Design Document

## Overview

Design document for Model Context Protocol (MCP) server implementation using Bitbucket Server (Data Center) REST API 1.0.

### Purpose

- Provide operations for Bitbucket Server repositories, pull requests, comments, tasks, etc. via MCP
- Robust implementation with type safety and error handling
- Protection mechanism for dangerous operations (delete, merge, etc.)
- Customizable pagination, logging, and configuration

### Differences from Reference Implementation

The reference implementation (src/referer/bitbucket) targets Bitbucket Cloud API 2.0, while this implementation uses Bitbucket Server API 1.0.

**Key Differences**:
- **API Base**: Cloud `/2.0/` → Server `/rest/api/1.0/`
- **Parameters**: `workspace` → `project_key`
- **Pagination**: `pagelen/page/next` → `start/limit/nextPageStart`
- **Unsupported Features**: Pipelines (8 tools), Draft PRs (3 tools), Pending Comments (2 tools), etc.

## Architecture

### File Structure

```
src/bitbucket/
├── index.ts        # MCP server setup, tool registration, logging
├── service.ts      # Business logic, API calls
├── types.ts        # TypeScript type definitions
└── pagination.ts   # Pagination helper for Server API
```

### Layer Structure

1. **MCP Layer** (index.ts)
   - Tool definitions and schemas
   - Request handling
   - Error handling and logging
   - Dangerous command protection

2. **Service Layer** (service.ts)
   - API calls
   - Response transformation
   - Business logic

3. **Type Layer** (types.ts)
   - Server API type definitions
   - Common interfaces

4. **Utility Layer** (pagination.ts)
   - Pagination processing
   - "fetch all" functionality

## Implemented Tools (31 Tools)

### 1. Repository Management (2 Tools)

#### 1.1 bitbucket_list_repositories
List repositories

**Parameters**:
- `project_key` (string, required): Project key
- `start` (number, optional): Start index (default: 0)
- `limit` (number, optional): Limit (default: 25, max: 100)
- `all` (boolean, optional): Fetch all flag

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos`

**Response**: Repository[]

#### 1.2 bitbucket_get_repository
Get details of a specific repository

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}`

**Response**: Repository

### 2. Pull Request Management (11 Tools)

#### 2.1 bitbucket_get_pull_requests
List pull requests

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `state` (string, optional): State filter (OPEN, MERGED, DECLINED, SUPERSEDED)
- `start` (number, optional): Start index
- `limit` (number, optional): Limit

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests`

**Response**: PullRequest[]

#### 2.2 bitbucket_create_pull_request
Create a new pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `title` (string, required): PR title
- `description` (string, optional): PR description
- `source_branch` (string, required): Source branch name
- `target_branch` (string, required): Target branch name
- `source_repo_slug` (string, optional): Source repository slug (for fork PRs)
- `reviewers` (string[], optional): Array of reviewer usernames

**API Endpoint**: `POST /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests`

**Payload Structure**:
```json
{
  "title": "PR Title",
  "description": "PR Description",
  "fromRef": {
    "id": "refs/heads/source-branch",
    "repository": {
      "slug": "source-repo",
      "project": { "key": "PROJECT" }
    }
  },
  "toRef": {
    "id": "refs/heads/target-branch",
    "repository": {
      "slug": "target-repo",
      "project": { "key": "PROJECT" }
    }
  },
  "reviewers": [
    { "user": { "name": "username" } }
  ]
}
```

**Response**: PullRequest

#### 2.3 bitbucket_get_pull_request
Get details of a specific pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}`

**Response**: PullRequest

#### 2.4 bitbucket_update_pull_request
Update pull request title or description

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `version` (number, required): PR version (for optimistic locking)
- `title` (string, optional): New title
- `description` (string, optional): New description

**API Endpoint**: `PUT /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}`

**Response**: PullRequest

#### 2.5 bitbucket_approve_pull_request
Approve a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID

**API Endpoint**: `POST /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/approve`

**Response**: Participant

#### 2.6 bitbucket_unapprove_pull_request
Remove approval from a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID

**API Endpoint**: `DELETE /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/approve`

**Response**: Participant

#### 2.7 bitbucket_decline_pull_request ⚠️ DANGEROUS
Decline a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `version` (number, required): PR version

**API Endpoint**: `POST /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/decline`

**Note**: Requires `BITBUCKET_ENABLE_DANGEROUS=true`

**Response**: PullRequest

#### 2.8 bitbucket_merge_pull_request ⚠️ DANGEROUS
Merge a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `version` (number, required): PR version

**API Endpoint**: `POST /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/merge`

**Note**: Requires `BITBUCKET_ENABLE_DANGEROUS=true`

**Response**: PullRequest

#### 2.9 bitbucket_get_pull_request_activity
Get activity log for a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `start` (number, optional): Start index
- `limit` (number, optional): Limit

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/activities`

**Response**: Activity[]

#### 2.10 bitbucket_get_pull_request_commits
Get commits for a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `start` (number, optional): Start index
- `limit` (number, optional): Limit

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/commits`

**Response**: Commit[]

#### 2.11 bitbucket_get_pull_request_diff
Get diff for a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/diff`

**Response**: string (diff text)

### 3. PR Details (1 Tool)

#### 3.1 bitbucket_get_pull_request_patch
Get patch file for a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}.patch`

**Response**: string (patch text)

### 4. Comment Management (5 Tools)

#### 4.1 bitbucket_get_pull_request_comments
Get comments for a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `start` (number, optional): Start index
- `limit` (number, optional): Limit

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/activities`

**Note**: Filters activities for comments (action === 'COMMENTED')

**Response**: Comment[]

#### 4.2 bitbucket_get_pull_request_comment
Get a specific comment

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `comment_id` (number, required): Comment ID

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/comments/{commentId}`

**Response**: Comment

#### 4.3 bitbucket_add_pull_request_comment
Add a comment to a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `text` (string, required): Comment text
- `parent_id` (number, optional): Parent comment ID (for replies)
- `line` (number, optional): Line number (for inline comments)
- `file_path` (string, optional): File path (for inline comments)
- `line_type` (string, optional): Line type (ADDED, REMOVED, CONTEXT)
- `from_hash` (string, optional): Source commit hash
- `to_hash` (string, optional): Target commit hash

**API Endpoint**: `POST /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/comments`

**Payload Structure (general comment)**:
```json
{
  "text": "Comment text",
  "parent": { "id": 123 }
}
```

**Payload Structure (inline comment)**:
```json
{
  "text": "Inline comment",
  "anchor": {
    "diffType": "EFFECTIVE",
    "fromHash": "abc123",
    "toHash": "def456",
    "line": 42,
    "lineType": "ADDED",
    "fileType": "TO",
    "path": "src/example.ts"
  }
}
```

**Response**: Comment

#### 4.4 bitbucket_update_pull_request_comment
Update a comment

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `comment_id` (number, required): Comment ID
- `text` (string, required): New comment text
- `version` (number, required): Comment version

**API Endpoint**: `PUT /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/comments/{commentId}`

**Response**: Comment

#### 4.5 bitbucket_delete_pull_request_comment ⚠️ DANGEROUS
Delete a comment

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `comment_id` (number, required): Comment ID
- `version` (number, required): Comment version

**API Endpoint**: `DELETE /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/comments/{commentId}`

**Note**: Requires `BITBUCKET_ENABLE_DANGEROUS=true`

**Response**: Success on empty response

### 5. Task Management (5 Tools)

#### 5.1 bitbucket_get_pull_request_tasks
Get tasks for a pull request

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/tasks`

**Response**: Task[]

#### 5.2 bitbucket_create_pull_request_task
Create a task

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `pull_request_id` (number, required): Pull request ID
- `text` (string, required): Task text
- `comment_id` (number, optional): Comment ID to attach task to

**API Endpoint**: `POST /rest/api/1.0/tasks`

**Payload Structure**:
```json
{
  "anchor": {
    "id": 123,  // comment or PR id
    "type": "COMMENT"  // or "PULL_REQUEST"
  },
  "text": "Task description"
}
```

**Response**: Task

#### 5.3 bitbucket_get_pull_request_task
Get a specific task

**Parameters**:
- `task_id` (number, required): Task ID

**API Endpoint**: `GET /rest/api/1.0/tasks/{taskId}`

**Response**: Task

#### 5.4 bitbucket_update_pull_request_task
Update a task

**Parameters**:
- `task_id` (number, required): Task ID
- `text` (string, optional): New task text
- `state` (string, optional): New state (OPEN, RESOLVED)

**API Endpoint**: `PUT /rest/api/1.0/tasks/{taskId}`

**Response**: Task

#### 5.5 bitbucket_delete_pull_request_task ⚠️ DANGEROUS
Delete a task

**Parameters**:
- `task_id` (number, required): Task ID

**API Endpoint**: `DELETE /rest/api/1.0/tasks/{taskId}`

**Note**: Requires `BITBUCKET_ENABLE_DANGEROUS=true`

**Response**: Success on empty response

### 6. Other Operations (7 Tools)

#### 6.1 bitbucket_get_commits
Get commits for a repository

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `branch_name` (string, optional): Branch name
- `start` (number, optional): Start index
- `limit` (number, optional): Limit

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/commits`

**Response**: Commit[]

#### 6.2 bitbucket_get_file_content
Get file content from a repository

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `file_path` (string, required): File path

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/browse/{filePath}`

**Response**: FileContent

#### 6.3 bitbucket_get_repo_structure
Get repository structure

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `path` (string, optional): Path (default: root)
- `max_depth` (number, optional): Max depth (default: 10)

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/files/{path}`

**Response**: RepoStructure

#### 6.4 bitbucket_get_repository_branching_model
Get repository branching model

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/branchmodel/configuration`

**Response**: BranchModel

#### 6.5 bitbucket_update_repository_branching_model_settings
Update repository branching model settings

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `development` (object, optional): Development branch settings
  - `refId` (string): Branch reference ID
  - `useDefault` (boolean): Use default flag
- `production` (object, optional): Production branch settings
- `types` (array, optional): Branch type array

**API Endpoint**: `PUT /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/branchmodel/configuration`

**Response**: BranchModel

#### 6.6 bitbucket_get_effective_default_reviewers
Get default reviewers

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, required): Repository slug
- `source_ref` (string, optional): Source ref
- `target_ref` (string, optional): Target ref

**API Endpoint**: `GET /rest/default-reviewers/1.0/projects/{project_key}/repos/{repo_slug}/reviewers`

**Note**: Uses `/rest/default-reviewers/1.0/` not `/rest/api/1.0/`

**Response**: DefaultReviewerCondition[]

#### 6.7 bitbucket_get_pending_review_prs
Get open PRs pending review

**Parameters**:
- `project_key` (string, required): Project key
- `repo_slug` (string, optional): Repository slug (when specified, only that repository)

**Implementation**: Client-side filtering
1. Get all repositories with `GET /rest/api/1.0/projects/{project_key}/repos`
2. For each repository: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests?state=OPEN`
3. Filter PRs where current user is reviewer and hasn't approved

**Response**: PullRequest[]

## Unsupported Tools (18 Tools)

### Bitbucket Pipelines (8 Tools)

Bitbucket Server doesn't support Pipelines. Use external CI/CD tools like Jenkins or Bamboo.

- `listPipelineRuns` - Use Jenkins/Bamboo API
- `getPipelineRun` - Use Jenkins/Bamboo API
- `runPipeline` - Use Jenkins/Bamboo API
- `stopPipeline` - Use Jenkins/Bamboo API
- `getPipelineSteps` - Use Jenkins/Bamboo API
- `getPipelineStep` - Use Jenkins/Bamboo API
- `getPipelineStepLogs` - Use Jenkins/Bamboo API

### Draft Pull Requests (3 Tools)

Bitbucket Server doesn't have the draft PR concept.

- `createDraftPullRequest` → Create regular PR instead
- `publishDraftPullRequest` → Not applicable
- `convertToDraft` → Not applicable

### Pending Comments (2 Tools)

Bitbucket Server publishes comments immediately.

- `addPendingPullRequestComment` → Use `addPullRequestComment` (publishes immediately)
- `publishPendingComments` → Not applicable

### Comment Resolution (2 Tools)

Bitbucket Server uses tasks instead of comment resolution.

- `resolveComment` → Update task state to "RESOLVED"
- `reopenComment` → Update task state to "OPEN"

### Other (3 Tools)

- `getPullRequestStatuses` - Different build status API
- `getPullRequestDiffStat` - Endpoint doesn't exist
- Project-level Branching Models (3 tools) - Different implementation

## Type Definitions

### Repository
```typescript
export interface Repository {
  id: number;
  slug: string;
  name: string;
  description?: string;
  scmId: string;
  state: string;
  statusMessage?: string;
  forkable: boolean;
  project: Project;
  public: boolean;
  links: Links;
}
```

### Project
```typescript
export interface Project {
  id: number;
  key: string;
  name: string;
  description?: string;
  public: boolean;
  type: string;
  links: Links;
}
```

### PullRequest
```typescript
export interface PullRequest {
  id: number;
  version: number;
  title: string;
  description?: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  open: boolean;
  closed: boolean;
  createdDate: number;
  updatedDate: number;
  fromRef: RefObject;
  toRef: RefObject;
  locked: boolean;
  author: Participant;
  reviewers: Reviewer[];
  participants: Participant[];
  links: Links;
}
```

### RefObject
```typescript
export interface RefObject {
  id: string;
  displayId: string;
  latestCommit: string;
  repository: Repository;
}
```

### User
```typescript
export interface User {
  name: string;
  emailAddress: string;
  id: number;
  displayName: string;
  active: boolean;
  slug: string;
  type: 'NORMAL' | 'SERVICE';
  links: Links;
}
```

### Participant
```typescript
export interface Participant {
  user: User;
  role: 'AUTHOR' | 'REVIEWER' | 'PARTICIPANT';
  approved: boolean;
  status: 'UNAPPROVED' | 'NEEDS_WORK' | 'APPROVED';
  lastReviewedCommit?: string;
}
```

### Reviewer
```typescript
export interface Reviewer extends Participant {
  role: 'REVIEWER';
}
```

### Comment
```typescript
export interface Comment {
  id: number;
  version: number;
  text: string;
  author: User;
  createdDate: number;
  updatedDate: number;
  comments?: Comment[];
  tasks?: Task[];
  permittedOperations: {
    editable: boolean;
    deletable: boolean;
  };
  anchor?: CommentAnchor;
}
```

### CommentAnchor
```typescript
export interface CommentAnchor {
  diffType: string;
  fromHash: string;
  toHash: string;
  line: number;
  lineType: 'ADDED' | 'REMOVED' | 'CONTEXT';
  fileType: 'FROM' | 'TO';
  path: string;
  srcPath?: string;
}
```

### Task
```typescript
export interface Task {
  id: number;
  text: string;
  state: 'OPEN' | 'RESOLVED';
  author: User;
  createdDate: number;
  permittedOperations: {
    deletable: boolean;
    editable: boolean;
    transitionable: boolean;
  };
}
```

### Activity
```typescript
export interface Activity {
  id: number;
  createdDate: number;
  user: User;
  action: 'COMMENTED' | 'OPENED' | 'UPDATED' | 'APPROVED' | 'UNAPPROVED' |
          'DECLINED' | 'MERGED' | 'RESCOPED' | 'REVIEWED';
  commentAction?: 'ADDED' | 'UPDATED' | 'DELETED';
  comment?: Comment;
  commentAnchor?: CommentAnchor;
  diff?: any;
  commit?: Commit;
  addedReviewers?: User[];
  removedReviewers?: User[];
}
```

### Commit
```typescript
export interface Commit {
  id: string;
  displayId: string;
  message: string;
  author?: User;
  authorTimestamp?: number;
  committer?: User;
  committerTimestamp?: number;
  parents?: Array<{ id: string; displayId: string }>;
}
```

### BranchModel
```typescript
export interface BranchModel {
  development: {
    refId?: string;
    useDefault: boolean;
  };
  production: {
    refId?: string;
    useDefault: boolean;
  };
  types: Array<{
    id: string;
    displayName: string;
    prefix: string;
  }>;
}
```

### DefaultReviewer
```typescript
export interface DefaultReviewer {
  id: number;
  user: User;
}
```

### DefaultReviewerCondition
```typescript
export interface DefaultReviewerCondition {
  id: number;
  sourceMatcher: BranchMatcher;
  targetMatcher: BranchMatcher;
  reviewers: DefaultReviewer[];
  requiredApprovals: number;
}

export interface BranchMatcher {
  id: string;
  displayId: string;
  type: {
    id: string;
    name: string;
  };
}
```

### FileContent
```typescript
export interface FileContent {
  path: string;
  content: string;
  size: number;
  isLastPage: boolean;
}
```

### RepoStructure
```typescript
export interface RepoStructure {
  values?: string[];
  size?: number;
  isLastPage?: boolean;
}
```

### Links
```typescript
export interface Links {
  self: Array<{ href: string }>;
  clone?: Array<{ href: string; name: string }>;
}
```

### PaginatedResponse
```typescript
export interface PaginatedResponse<T> {
  values: T[];
  size: number;
  limit: number;
  isLastPage: boolean;
  start: number;
  nextPageStart?: number;
}
```

## Environment Variables

### Required

#### BITBUCKET_BASE_URL
Bitbucket Server base URL

**Example**: `https://bitbucket.yourcompany.com`

#### BITBUCKET_API_TOKEN
Personal Access Token

**How to obtain**: Bitbucket Server → Profile → Manage account → Personal access tokens

### Optional

#### BITBUCKET_DEFAULT_PROJECT
Default project key. Used when project_key is omitted in each tool.

**Example**: `PROJ`

#### BITBUCKET_ENABLE_DANGEROUS
Flag to enable dangerous operations.

**Valid values**: `true`, `1`, `yes`, `on`

**Target tools**:
- `deletePullRequestComment`
- `deletePullRequestTask`
- `declinePullRequest`
- `mergePullRequest`

#### BITBUCKET_LOG_FILE
Absolute path to log file

**Example**: `/var/log/bitbucket-mcp/bitbucket.log`

#### BITBUCKET_LOG_DIR
Base path for log directory

**Default**:
- **Windows**: `%LOCALAPPDATA%/bitbucket-mcp`
- **macOS**: `~/Library/Logs/bitbucket-mcp`
- **Linux**: `$XDG_STATE_HOME/bitbucket-mcp` or `~/.local/state/bitbucket-mcp`

#### BITBUCKET_LOG_DISABLE
Disable file logging

**Valid values**: `true`, `1`, `yes`, `on`

#### BITBUCKET_LOG_PER_CWD
Create separate log files per working directory

**Valid values**: `true`, `1`, `yes`, `on`

## Pagination

### Server API Pagination

Bitbucket Server API uses the following pagination method:

```json
{
  "values": [...],
  "size": 25,
  "limit": 25,
  "isLastPage": false,
  "start": 0,
  "nextPageStart": 25
}
```

### Parameters

- `start`: Start position (0-based)
- `limit`: Number of items per page (default: 25, max: 100)

### "all" Option

Specify `all=true` to automatically fetch all items (max 1000)

**Usage example**:
```json
{
  "project_key": "PROJ",
  "limit": 50,
  "all": true
}
```

### Implementation Details

`BitbucketPaginator` class handles:
- Single page fetch
- Automatic multi-page fetch (when all=true)
- Next page fetch using nextPageStart
- Max item limit (1000 items)

## Logging

### Log Levels

- `info`: Tool execution start/end
- `error`: Error occurrence
- `debug`: API call details (planned)

### Log Format

JSON format output

```json
{
  "level": "info",
  "message": "Executing tool: bitbucket_create_pull_request",
  "timestamp": "2026-01-06T08:00:00.000Z",
  "args": {...}
}
```

### Log Files

Controlled by environment variables:
- Default location: Platform-dependent
- Custom path: `BITBUCKET_LOG_FILE`
- Disable: `BITBUCKET_LOG_DISABLE=true`
- Per working directory: `BITBUCKET_LOG_PER_CWD=true`

## Error Handling

### McpError

All errors are thrown as `McpError`

```typescript
throw new McpError(
  ErrorCode.InternalError,
  `Failed to execute ${toolName}: ${error.message}`
);
```

### Error Codes

- `ErrorCode.InvalidRequest`: Parameter error, dangerous operation attempt
- `ErrorCode.InternalError`: API call error, unexpected error

### Dangerous Operation Errors

```typescript
if (isDangerousTool(name) && !process.env.BITBUCKET_ENABLE_DANGEROUS) {
  throw new McpError(
    ErrorCode.InvalidRequest,
    `Tool ${name} is disabled. Set BITBUCKET_ENABLE_DANGEROUS=true to enable.`
  );
}
```

## Security Considerations

### Dangerous Operation Protection

The following operations are disabled by default:
- `deletePullRequestComment`
- `deletePullRequestTask`
- `declinePullRequest`
- `mergePullRequest`
- All tools starting with `delete*`

To enable: `BITBUCKET_ENABLE_DANGEROUS=true`

### Authentication

Personal Access Token (PAT) used as Bearer Token

```
Authorization: Bearer {BITBUCKET_API_TOKEN}
```

### Version Management (Optimistic Locking)

Update/delete operations require `version` parameter to prevent concurrent editing.

```typescript
await updatePullRequest(projectKey, repoSlug, prId, {
  title: "New title",
  version: 42  // Required
});
```

## Usage Examples

### Creating a Pull Request

```json
{
  "name": "bitbucket_create_pull_request",
  "arguments": {
    "project_key": "PROJ",
    "repo_slug": "my-repo",
    "title": "Add new feature",
    "description": "This PR adds a new feature",
    "source_branch": "feature/new-feature",
    "target_branch": "develop",
    "reviewers": ["alice", "bob"]
  }
}
```

### Adding an Inline Comment

```json
{
  "name": "bitbucket_add_pull_request_comment",
  "arguments": {
    "project_key": "PROJ",
    "repo_slug": "my-repo",
    "pull_request_id": 123,
    "text": "Consider using const instead of let here",
    "line": 42,
    "file_path": "src/example.ts",
    "line_type": "ADDED",
    "from_hash": "abc123",
    "to_hash": "def456"
  }
}
```

### Fetching All Repositories

```json
{
  "name": "bitbucket_list_repositories",
  "arguments": {
    "project_key": "PROJ",
    "all": true
  }
}
```

### Creating and Resolving a Task

```json
// Create task
{
  "name": "bitbucket_create_pull_request_task",
  "arguments": {
    "project_key": "PROJ",
    "repo_slug": "my-repo",
    "pull_request_id": 123,
    "text": "Update documentation",
    "comment_id": 456
  }
}

// Resolve task
{
  "name": "bitbucket_update_pull_request_task",
  "arguments": {
    "task_id": 789,
    "state": "RESOLVED"
  }
}
```

### Merging a Pull Request (Dangerous Operation)

```bash
# Set environment variable
export BITBUCKET_ENABLE_DANGEROUS=true
```

```json
{
  "name": "bitbucket_merge_pull_request",
  "arguments": {
    "project_key": "PROJ",
    "repo_slug": "my-repo",
    "pull_request_id": 123,
    "version": 5
  }
}
```

## References

### Bitbucket Server REST API Documentation
- [REST API 1.0](https://docs.atlassian.com/bitbucket-server/rest/5.16.0/bitbucket-rest.html)
- [Default Reviewers API](https://docs.atlassian.com/bitbucket-server/rest/5.16.0/bitbucket-default-reviewers-rest.html)
- [Branch Model API](https://docs.atlassian.com/bitbucket-server/rest/7.0.0/bitbucket-branch-rest.html)

### Internal Implementation References
- `src/referer/bitbucket/index.ts` - Bitbucket Cloud implementation (for reference)
- `src/referer/bitbucket/pagination.ts` - Cloud API pagination (for reference)
- `src/shared/http-client.ts` - HTTP client implementation
- `src/shared/config.ts` - Configuration management

## Change History

### 2026-01-06
- Initial version created
- 31 tools design completed
- 18 unsupported tools documented
