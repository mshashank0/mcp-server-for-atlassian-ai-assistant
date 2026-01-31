# Jira MCP Server Redesign Document

## Overview

This document outlines the complete redesign of the TypeScript implementation in `src/jira`, referencing the Python implementation in `src/referer/jira`.

## Objectives

- Migrate all features from Python implementation to TypeScript
- Maintain existing file structure and Node.js runtime environment
- Completely replace MCP Server functionality
- **Delete all existing tools and achieve complete alignment with Python implementation**

## Python Implementation Feature Analysis

### 1. issues.py (Issue Operations)
- `get_issue` - Get issue details (with detailed options like expand, comment_limit, fields, etc.)
- `create_issue` - Create issue (Epic support, components, custom fields)
- `update_issue` - Update issue (status changes, attachment support)
- `delete_issue` - Delete issue
- `batch_create_issues` - Batch create issues
- `batch_get_changelogs` - Batch get changelogs (Cloud only)

### 2. search.py (Search Operations)
- `search_issues` - JQL search (Cloud v3 API support, pagination)
- `get_board_issues` - Get board issues
- `get_sprint_issues` - Get sprint issues

### 3. comments.py (Comment Operations)
- `get_issue_comments` - Get comment list
- `add_comment` - Add comment (Markdown support)

### 4. projects.py (Project Operations)
- `get_all_projects` - Get all projects
- `get_project` - Get project details
- `get_project_model` - Get project model
- `project_exists` - Check project existence
- `get_project_components` - Get component list
- `get_project_versions` - Get version list
- `get_project_roles` - Get role list
- `get_project_role_members` - Get role members
- `get_project_permission_scheme` - Get permission scheme
- `get_project_notification_scheme` - Get notification scheme
- `get_project_issue_types` - Get issue type list
- `get_project_issues_count` - Get issue count
- `get_project_issues` - Get project issues
- `create_project_version` - Create version

### 5. epics.py (Epic Operations)
- `link_issue_to_epic` - Link issue to Epic
- `get_epic_issues` - Get Epic issues
- `prepare_epic_fields` - Prepare Epic fields (internal method)
- `update_epic_fields` - Update Epic-specific fields (internal method)

### 6. sprints.py (Sprint Operations)
- `get_all_sprints_from_board` - Get board sprint list
- `get_all_sprints_from_board_model` - Get sprint model list
- `update_sprint` - Update sprint
- `create_sprint` - Create sprint

### 7. boards.py (Board Operations)
- `get_all_agile_boards` - Get agile board list
- `get_all_agile_boards_model` - Get board model list

### 8. worklog.py (Worklog Operations)
- `add_worklog` - Add worklog
- `get_worklog` - Get worklog data
- `get_worklog_models` - Get worklog model list
- `get_worklogs` - Get worklog list

### 9. transitions.py (Transition Operations)
- `get_available_transitions` - Get available transitions
- `get_transitions` - Get transition data
- `get_transitions_models` - Get transition model list
- `transition_issue` - Execute issue transition

### 10. fields.py (Field Operations)
- `get_fields` - Get all fields
- `get_field_id` - Get field ID
- `get_field_by_id` - Get field definition
- `get_custom_fields` - Get custom field list
- `get_required_fields` - Get required fields
- `get_field_ids_to_epic` - Get Epic-related field IDs
- `search_fields` - Search fields (fuzzy matching)

## New Design (Complete Alignment with Python Implementation)

### MCP Tools List (48 tools)

#### Issue Operations (Issues) - 6 Tools
1. `get_issue` - Get issue details
2. `create_issue` - Create issue
3. `update_issue` - Update issue
4. `delete_issue` - Delete issue
5. `batch_create_issues` - Batch create issues
6. `batch_get_changelogs` - Batch get changelogs (Cloud only)

#### Search Operations (Search) - 3 Tools
7. `search_issues` - JQL search
8. `get_board_issues` - Get board issues
9. `get_sprint_issues` - Get sprint issues

#### Comment Operations (Comments) - 2 Tools
10. `get_issue_comments` - Get comment list
11. `add_comment` - Add comment

#### Project Operations (Projects) - 14 Tools
12. `get_all_projects` - Get all projects
13. `get_project` - Get project details
14. `get_project_model` - Get project model
15. `project_exists` - Check project existence
16. `get_project_components` - Get component list
17. `get_project_versions` - Get version list
18. `get_project_roles` - Get role list
19. `get_project_role_members` - Get role members
20. `get_project_permission_scheme` - Get permission scheme
21. `get_project_notification_scheme` - Get notification scheme
22. `get_project_issue_types` - Get issue type list
23. `get_project_issues_count` - Get issue count
24. `get_project_issues` - Get project issues
25. `create_project_version` - Create version

#### Epic Operations (Epics) - 2 Tools
26. `link_issue_to_epic` - Link issue to Epic
27. `get_epic_issues` - Get Epic issues

#### Sprint Operations (Sprints) - 4 Tools
28. `get_all_sprints_from_board` - Get board sprint list
29. `get_all_sprints_from_board_model` - Get sprint model list
30. `update_sprint` - Update sprint
31. `create_sprint` - Create sprint

#### Board Operations (Boards) - 2 Tools
32. `get_all_agile_boards` - Get agile board list
33. `get_all_agile_boards_model` - Get board model list

#### Worklog Operations (Worklogs) - 4 Tools
34. `add_worklog` - Add worklog
35. `get_worklog` - Get worklog data
36. `get_worklog_models` - Get worklog model list
37. `get_worklogs` - Get worklog list

#### Transition Operations (Transitions) - 4 Tools
38. `get_available_transitions` - Get available transitions
39. `get_transitions` - Get transition data
40. `get_transitions_models` - Get transition model list
41. `transition_issue` - Execute issue transition

#### Field Operations (Fields) - 7 Tools
42. `get_fields` - Get all fields
43. `get_field_id` - Get field ID
44. `get_field_by_id` - Get field definition
45. `get_custom_fields` - Get custom field list
46. `get_required_fields` - Get required fields
47. `get_field_ids_to_epic` - Get Epic-related field IDs
48. `search_fields` - Search fields

### File Structure (Unchanged)

```
src/jira/
├── index.ts       # MCP server entry point
├── service.ts     # Jira service class
└── types.ts       # Type definitions
```

### Type Definitions (types.ts)

Type definitions aligned with Python implementation:

```typescript
// Search options
export interface SearchOptions {
  fields?: string[];
  start?: number;
  limit?: number;
  expand?: string;
  projects_filter?: string;
}

// Get issue options
export interface GetIssueOptions {
  expand?: string;
  comment_limit?: number | string;
  fields?: string | string[];
  properties?: string | string[];
  update_history?: boolean;
}

// Project types
export interface JiraProject {
  key: string;
  name: string;
  id: string;
  description?: string;
  lead?: any;
}

// Component types
export interface JiraComponent {
  id: string;
  name: string;
  description?: string;
}

// Version types
export interface JiraVersion {
  id: string;
  name: string;
  released: boolean;
  releaseDate?: string;
  startDate?: string;
  description?: string;
}

// Sprint types
export interface JiraSprint {
  id: number;
  name: string;
  state: 'future' | 'active' | 'closed';
  startDate?: string;
  endDate?: string;
  goal?: string;
}

// Board types
export interface JiraBoard {
  id: number;
  name: string;
  type: string;
}

// Worklog types
export interface JiraWorklog {
  id: string;
  author: string;
  comment?: string;
  timeSpent: string;
  timeSpentSeconds: number;
  started: string;
  created: string;
  updated: string;
}

export interface WorklogInput {
  time_spent: string;
  comment?: string;
  started?: string;
  original_estimate?: string;
  remaining_estimate?: string;
}

// Transition types
export interface JiraTransition {
  id: string;
  name: string;
  to_status?: string;
}

// Field types
export interface JiraField {
  id: string;
  name: string;
  custom: boolean;
  schema?: {
    type: string;
    custom?: string;
  };
  clauseNames?: string[];
}

// Changelog types
export interface JiraChangelog {
  id: string;
  author: any;
  created: string;
  items: JiraChangelogItem[];
}

export interface JiraChangelogItem {
  field: string;
  fieldtype: string;
  from?: string;
  fromString?: string;
  to?: string;
  toString?: string;
}

// Issue types
export interface IssueFields {
  project: { key: string };
  summary: string;
  issuetype: { name: string };
  description?: string;
  assignee?: { accountId: string } | { name: string };
  components?: Array<{ name: string }>;
  [key: string]: any;
}

// Sprint input
export interface SprintInput {
  name: string;
  start_date: string;
  end_date: string;
  goal?: string;
}

// Board options
export interface BoardOptions {
  board_name?: string;
  project_key?: string;
  board_type?: string;
  start?: number;
  limit?: number;
}

// Comment
export interface JiraComment {
  id: string;
  body: string;
  created: string;
  updated: string;
  author: string;
}
```

### Service Class (service.ts)

Implementation of all methods from Python:

```typescript
export class JiraService {
  // Issue operations
  async getIssue(issueKey: string, options?: GetIssueOptions): Promise<IssueDetail>
  async createIssue(fields: IssueFields): Promise<CreateIssueResponse>
  async updateIssue(issueKey: string, fields: IssueFields): Promise<UpdateIssueResponse>
  async deleteIssue(issueKey: string): Promise<boolean>
  async batchCreateIssues(issues: IssueFields[]): Promise<CreateIssueResponse[]>
  async batchGetChangelogs(issueKeys: string[], fields?: string[]): Promise<JiraChangelog[]>

  // Search operations
  async searchIssues(jql: string, options?: SearchOptions): Promise<IssueSearchResponse>
  async getBoardIssues(boardId: string, jql: string, options?: SearchOptions): Promise<IssueSearchResponse>
  async getSprintIssues(sprintId: string, options?: SearchOptions): Promise<IssueSearchResponse>

  // Comment operations
  async getIssueComments(issueKey: string, limit?: number): Promise<JiraComment[]>
  async addComment(issueKey: string, comment: string): Promise<JiraComment>

  // Project operations
  async getAllProjects(includeArchived?: boolean): Promise<JiraProject[]>
  async getProject(projectKey: string): Promise<JiraProject | null>
  async getProjectModel(projectKey: string): Promise<JiraProject | null>
  async projectExists(projectKey: string): Promise<boolean>
  async getProjectComponents(projectKey: string): Promise<JiraComponent[]>
  async getProjectVersions(projectKey: string): Promise<JiraVersion[]>
  async getProjectRoles(projectKey: string): Promise<any>
  async getProjectRoleMembers(projectKey: string, roleId: string): Promise<any[]>
  async getProjectPermissionScheme(projectKey: string): Promise<any>
  async getProjectNotificationScheme(projectKey: string): Promise<any>
  async getProjectIssueTypes(projectKey: string): Promise<any[]>
  async getProjectIssuesCount(projectKey: string): Promise<number>
  async getProjectIssues(projectKey: string, start?: number, limit?: number): Promise<IssueSearchResponse>
  async createProjectVersion(projectKey: string, name: string, startDate?: string, releaseDate?: string, description?: string): Promise<any>

  // Epic operations
  async linkIssueToEpic(issueKey: string, epicKey: string): Promise<IssueDetail>
  async getEpicIssues(epicKey: string, start?: number, limit?: number): Promise<IssueDetail[]>

  // Sprint operations
  async getAllSprintsFromBoard(boardId: string, state?: string, start?: number, limit?: number): Promise<any[]>
  async getAllSprintsFromBoardModel(boardId: string, state?: string, start?: number, limit?: number): Promise<JiraSprint[]>
  async updateSprint(sprintId: string, sprintName?: string, state?: string, startDate?: string, endDate?: string, goal?: string): Promise<JiraSprint | null>
  async createSprint(boardId: string, sprint: SprintInput): Promise<JiraSprint>

  // Board operations
  async getAllAgileBoards(options?: BoardOptions): Promise<any[]>
  async getAllAgileBoardsModel(options?: BoardOptions): Promise<JiraBoard[]>

  // Worklog operations
  async addWorklog(issueKey: string, worklog: WorklogInput): Promise<any>
  async getWorklog(issueKey: string): Promise<any>
  async getWorklogModels(issueKey: string): Promise<JiraWorklog[]>
  async getWorklogs(issueKey: string): Promise<any[]>

  // Transition operations
  async getAvailableTransitions(issueKey: string): Promise<any[]>
  async getTransitions(issueKey: string): Promise<any[]>
  async getTransitionsModels(issueKey: string): Promise<JiraTransition[]>
  async transitionIssue(issueKey: string, transitionId: string | number, fields?: any, comment?: string): Promise<IssueDetail>

  // Field operations
  async getFields(refresh?: boolean): Promise<JiraField[]>
  async getFieldId(fieldName: string, refresh?: boolean): Promise<string | null>
  async getFieldById(fieldId: string, refresh?: boolean): Promise<JiraField | null>
  async getCustomFields(refresh?: boolean): Promise<JiraField[]>
  async getRequiredFields(issueType: string, projectKey: string): Promise<any>
  async getFieldIdsToEpic(): Promise<Record<string, string>>
  async searchFields(keyword: string, limit?: number, refresh?: boolean): Promise<JiraField[]>
}
```

## Implementation Priorities and Phase Details

### Phase 1: Core Features (Issues, Search, Comments) - 11 Tools

**Issue Operations (4 Tools)**
1. `get_issue` - Get issue details
   - Parameters: issue_key, expand?, comment_limit?, fields?, properties?, update_history?
2. `create_issue` - Create issue
   - Parameters: project_key, summary, issue_type, description?, assignee?, components?, **kwargs
3. `update_issue` - Update issue
   - Parameters: issue_key, fields?, **kwargs
4. `delete_issue` - Delete issue
   - Parameters: issue_key

**Search Operations (3 Tools)**
5. `search_issues` - JQL search
   - Parameters: jql, fields?, start?, limit?, expand?, projects_filter?
6. `get_board_issues` - Get board issues
   - Parameters: board_id, jql, fields?, start?, limit?, expand?
7. `get_sprint_issues` - Get sprint issues
   - Parameters: sprint_id, fields?, start?, limit?

**Comment Operations (2 Tools)**
8. `get_issue_comments` - Get comment list
   - Parameters: issue_key, limit?
9. `add_comment` - Add comment
   - Parameters: issue_key, comment

**Batch Operations (2 Tools)**
10. `batch_create_issues` - Batch create issues
    - Parameters: issues, validate_only?
11. `batch_get_changelogs` - Batch get changelogs (Cloud only)
    - Parameters: issue_ids_or_keys, fields?

### Phase 2: Project Management - 14 Tools

12. `get_all_projects` - Get all projects
    - Parameters: include_archived?
13. `get_project` - Get project details
    - Parameters: project_key
14. `get_project_model` - Get project model
    - Parameters: project_key
15. `project_exists` - Check project existence
    - Parameters: project_key
16. `get_project_components` - Get component list
    - Parameters: project_key
17. `get_project_versions` - Get version list
    - Parameters: project_key
18. `get_project_roles` - Get role list
    - Parameters: project_key
19. `get_project_role_members` - Get role members
    - Parameters: project_key, role_id
20. `get_project_permission_scheme` - Get permission scheme
    - Parameters: project_key
21. `get_project_notification_scheme` - Get notification scheme
    - Parameters: project_key
22. `get_project_issue_types` - Get issue type list
    - Parameters: project_key
23. `get_project_issues_count` - Get issue count
    - Parameters: project_key
24. `get_project_issues` - Get project issues
    - Parameters: project_key, start?, limit?
25. `create_project_version` - Create version
    - Parameters: project_key, name, start_date?, release_date?, description?

### Phase 3: Agile Features - 8 Tools

**Epic Operations (2 Tools)**
26. `link_issue_to_epic` - Link issue to Epic
    - Parameters: issue_key, epic_key
27. `get_epic_issues` - Get Epic issues
    - Parameters: epic_key, start?, limit?

**Sprint Operations (4 Tools)**
28. `get_all_sprints_from_board` - Get board sprint list
    - Parameters: board_id, state?, start?, limit?
29. `get_all_sprints_from_board_model` - Get sprint model list
    - Parameters: board_id, state?, start?, limit?
30. `update_sprint` - Update sprint
    - Parameters: sprint_id, sprint_name?, state?, start_date?, end_date?, goal?
31. `create_sprint` - Create sprint
    - Parameters: board_id, sprint_name, start_date, end_date, goal?

**Board Operations (2 Tools)**
32. `get_all_agile_boards` - Get agile board list
    - Parameters: board_name?, project_key?, board_type?, start?, limit?
33. `get_all_agile_boards_model` - Get board model list
    - Parameters: board_name?, project_key?, board_type?, start?, limit?

### Phase 4: Advanced Features - 15 Tools

**Worklog Operations (4 Tools)**
34. `add_worklog` - Add worklog
    - Parameters: issue_key, time_spent, comment?, started?, original_estimate?, remaining_estimate?
35. `get_worklog` - Get worklog data
    - Parameters: issue_key
36. `get_worklog_models` - Get worklog model list
    - Parameters: issue_key
37. `get_worklogs` - Get worklog list
    - Parameters: issue_key

**Transition Operations (4 Tools)**
38. `get_available_transitions` - Get available transitions
    - Parameters: issue_key
39. `get_transitions` - Get transition data
    - Parameters: issue_key
40. `get_transitions_models` - Get transition model list
    - Parameters: issue_key
41. `transition_issue` - Execute issue transition
    - Parameters: issue_key, transition_id, fields?, comment?

**Field Operations (7 Tools)**
42. `get_fields` - Get all fields
    - Parameters: refresh?
43. `get_field_id` - Get field ID
    - Parameters: field_name, refresh?
44. `get_field_by_id` - Get field definition
    - Parameters: field_id, refresh?
45. `get_custom_fields` - Get custom field list
    - Parameters: refresh?
46. `get_required_fields` - Get required fields
    - Parameters: issue_type, project_key
47. `get_field_ids_to_epic` - Get Epic-related field IDs
    - Parameters: none
48. `search_fields` - Search fields
    - Parameters: keyword, limit?, refresh?

## Important Notes

1. **Complete Replacement**: Delete all existing tools and achieve complete alignment with Python implementation
2. **Naming Convention**: Use Python function names as-is (snake_case)
3. **Error Handling**: Faithfully reproduce Python implementation's error handling
4. **Authentication Errors**: Handle 401/403 errors appropriately
5. **Cloud/Server Support**: Consider differences between Cloud and Server (especially API v3 support)
6. **Pagination**: Use nextPageToken in Cloud environments
7. **Field Detection**: Dynamically detect Epic-related fields, etc.
8. **Markdown Support**: Convert Markdown to Jira markup for comments, etc.
9. **Time Parsing**: Parse time strings for worklogs (1h 30m, etc.)
10. **Fuzzy Matching**: Implement fuzzy matching for field search

## Summary

This design document outlines a plan to completely migrate all features from the Python implementation to TypeScript. All 6 existing tools will be deleted and replaced with 48 new tools. While maintaining the file structure and Node.js runtime environment, the MCP Server functionality will be completely renewed.