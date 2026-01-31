import { IssueSearchResponse, IssueDetail, CreateIssueResponse, UpdateIssueResponse, SearchOptions, GetIssueOptions, IssueFields, JiraComment } from './types.js';
export declare class JiraService {
    private client;
    private editableIssues;
    private fieldIdsCache;
    constructor();
    /**
     * Get a Jira issue by key with detailed options
     */
    getIssue(issueKey: string, options?: GetIssueOptions): Promise<IssueDetail>;
    /**
     * Create a new Jira issue
     */
    createIssue(fields: IssueFields): Promise<CreateIssueResponse>;
    /**
     * Update a Jira issue
     */
    updateIssue(issueKey: string, fields: Record<string, any>): Promise<UpdateIssueResponse>;
    /**
     * Delete a Jira issue
     */
    deleteIssue(issueKey: string): Promise<boolean>;
    /**
     * Search for issues using JQL
     */
    searchIssues(jql: string, options?: SearchOptions): Promise<IssueSearchResponse>;
    /**
     * Get issues for a specific board
     */
    getBoardIssues(boardId: string, jql: string, options?: SearchOptions): Promise<IssueSearchResponse>;
    /**
     * Get issues for a specific sprint
     */
    getSprintIssues(sprintId: string, options?: SearchOptions): Promise<IssueSearchResponse>;
    /**
     * Get comments for a specific issue
     */
    getIssueComments(issueKey: string, limit?: number): Promise<JiraComment[]>;
    /**
     * Add a comment to an issue
     */
    addComment(issueKey: string, comment: string): Promise<JiraComment>;
    /**
     * Create multiple issues in a batch
     */
    batchCreateIssues(issues: IssueFields[], validateOnly?: boolean): Promise<CreateIssueResponse[]>;
    /**
     * Get changelog for a specific issue (Server/Data Center compatible)
     * @param issueKey - The issue key (e.g., PROJ-123)
     * @param startAt - Starting index for pagination (default: 0)
     * @param maxResults - Maximum number of changelog entries to return (default: 100)
     */
    getIssueChangelog(issueKey: string, startAt?: number, maxResults?: number): Promise<any>;
    /**
     * Get all projects
     */
    getAllProjects(includeArchived?: boolean): Promise<any[]>;
    /**
     * Get project details
     */
    getProject(projectKey: string): Promise<any | null>;
    /**
     * Get project model
     */
    getProjectModel(projectKey: string): Promise<any | null>;
    /**
     * Check if project exists
     */
    projectExists(projectKey: string): Promise<boolean>;
    /**
     * Get project components
     */
    getProjectComponents(projectKey: string): Promise<any[]>;
    /**
     * Get project versions
     */
    getProjectVersions(projectKey: string): Promise<any[]>;
    /**
     * Get project roles
     * Note: Direct access to /rest/api/2/project/{key}/role requires admin permissions (401)
     * Instead, we get roles from the project object which is accessible to regular users
     */
    getProjectRoles(projectKey: string): Promise<any>;
    /**
     * Get project role members
     * NOTE: This endpoint requires admin permissions (401 Unauthorized)
     * - /rest/api/2/project/{projectKey}/role/{roleId} returns 401 for non-admin users
     * - /rest/api/2/role/{roleId} returns 403 Forbidden
     * - No alternative method found to get role members without admin permissions
     */
    /**
     * Get my permissions for a project
     * Returns all permissions that the current user has for the specified project
     * This replaces getProjectPermissionScheme which requires admin permissions
     */
    getMyProjectPermissions(projectKey: string): Promise<any>;
    /**
     * Get project notification scheme
     * NOTE: This endpoint is not supported in Jira Server 9.4
     * - /rest/api/2/project/{key}/notificationscheme returns 400 Bad Request
     * - /rest/api/2/notificationscheme/project returns 404 Not Found
     * - No alternative method found to map projects to notification schemes
     * - This feature appears to be Jira Cloud only or requires admin permissions
     */
    /**
     * Get project issue types
     */
    getProjectIssueTypes(projectKey: string): Promise<any[]>;
    /**
     * Get project issues count
     */
    getProjectIssuesCount(projectKey: string): Promise<number>;
    /**
     * Get project statuses
     * Returns all statuses available for a project
     */
    getProjectStatuses(projectKey: string): Promise<any[]>;
    /**
     * Get project priorities
     * Returns all priorities available in the Jira instance
     */
    getProjectPriorities(): Promise<any[]>;
    /**
     * Get project resolutions
     * Returns all resolutions available in the Jira instance
     */
    getProjectResolutions(): Promise<any[]>;
    /**
     * Get project issues
     */
    getProjectIssues(projectKey: string, start?: number, limit?: number): Promise<IssueSearchResponse>;
    /**
     * Create project version
     */
    createProjectVersion(projectKey: string, name: string, startDate?: string, releaseDate?: string, description?: string): Promise<any>;
    /**
     * Link issue to epic
     */
    linkIssueToEpic(issueKey: string, epicKey: string): Promise<any>;
    /**
     * Get epic issues
     */
    getEpicIssues(epicKey: string, start?: number, limit?: number): Promise<any[]>;
    /**
     * Get all sprints from board
     */
    getAllSprintsFromBoard(boardId: string, state?: string, start?: number, limit?: number): Promise<any[]>;
    /**
     * Get all sprints from board model
     */
    getAllSprintsFromBoardModel(boardId: string, state?: string, start?: number, limit?: number): Promise<any[]>;
    /**
     * Update sprint
     */
    updateSprint(sprintId: string, sprintName?: string, state?: string, startDate?: string, endDate?: string, goal?: string): Promise<any | null>;
    /**
     * Create sprint
     */
    createSprint(boardId: string, sprint: any): Promise<any>;
    /**
     * Get all active sprints
     * Returns all active sprints across all boards
     */
    getAllActiveSprints(start?: number, limit?: number): Promise<any[]>;
    /**
     * Get sprint details
     * Returns detailed information about a specific sprint
     */
    getSprintDetails(sprintId: string): Promise<any>;
    /**
     * Start sprint
     * Transitions a sprint to active state
     */
    startSprint(sprintId: string): Promise<any>;
    /**
     * Complete sprint
     * Transitions a sprint to closed state
     */
    completeSprint(sprintId: string): Promise<any>;
    /**
     * Get all agile boards
     */
    getAllAgileBoards(options?: any): Promise<any[]>;
    /**
     * Get all agile boards model
     */
    getAllAgileBoardsModel(options?: any): Promise<any[]>;
    /**
     * Add worklog
     */
    addWorklog(issueKey: string, worklog: any): Promise<any>;
    /**
     * Get worklog
     */
    getWorklog(issueKey: string): Promise<any>;
    /**
     * Get worklog models
     */
    getWorklogModels(issueKey: string): Promise<any[]>;
    /**
     * Get worklogs
     */
    getWorklogs(issueKey: string): Promise<any[]>;
    /**
     * Get available transitions
     */
    getAvailableTransitions(issueKey: string): Promise<any[]>;
    /**
     * Get transitions
     */
    getTransitions(issueKey: string): Promise<any[]>;
    /**
     * Get transitions models
     */
    getTransitionsModels(issueKey: string): Promise<any[]>;
    /**
     * Transition issue
     */
    transitionIssue(issueKey: string, transitionId: string | number, fields?: any, comment?: string): Promise<any>;
    /**
     * Get fields
     */
    getFields(refresh?: boolean): Promise<any[]>;
    /**
     * Get field ID
     */
    getFieldId(fieldName: string, refresh?: boolean): Promise<string | null>;
    /**
     * Get field by ID
     */
    getFieldById(fieldId: string, refresh?: boolean): Promise<any | null>;
    /**
     * Get custom fields
     */
    getCustomFields(refresh?: boolean): Promise<any[]>;
    /**
     * Get required fields
     */
    getRequiredFields(issueType: string, projectKey: string): Promise<any>;
    /**
     * Get field IDs to epic
     */
    getFieldIdsToEpic(): Promise<Record<string, string>>;
    /**
     * Search fields
     */
    searchFields(keyword: string, limit?: number, refresh?: boolean): Promise<any[]>;
    /**
     * COMMENTED OUT: Create custom field
     * NOTE: This is a dangerous operation that modifies the Jira schema
     * - Creates a new custom field across the entire Jira instance
     * - Cannot be easily undone
     * - Requires admin permissions
     */
    /**
     * COMMENTED OUT: Update custom field
     * NOTE: This is a dangerous operation
     * - Modifies existing custom field definition
     * - May affect all issues using this field
     * - Requires admin permissions
     */
    /**
     * COMMENTED OUT: Delete custom field
     * NOTE: This is an extremely dangerous operation
     * - Permanently deletes a custom field from the entire Jira instance
     * - All data in this field across all issues will be lost
     * - Cannot be undone
     * - Requires admin permissions
     */
    /**
     * Get issue picker suggestions
     * Returns issue suggestions based on a query string (for issue picker fields)
     */
    getIssuePickerSuggestions(query: string, currentIssueKey?: string, currentProjectId?: string): Promise<any>;
    private cleanText;
    private markdownToJira;
}
//# sourceMappingURL=service.d.ts.map