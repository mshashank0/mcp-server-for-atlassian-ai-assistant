export interface SearchOptions {
    fields?: string[];
    start?: number;
    limit?: number;
    expand?: string;
    projects_filter?: string;
}
export interface GetIssueOptions {
    expand?: string;
    comment_limit?: number | string;
    fields?: string | string[];
    properties?: string | string[];
    update_history?: boolean;
}
export interface IssueSearchResult {
    key: string;
    title: string;
    fields?: any;
}
export interface IssueSearchResponse {
    startAt: number;
    maxResults: number;
    total: number;
    issues: IssueSearchResult[];
}
export interface IssueProject {
    key: string;
    name: string;
}
export interface IssueAssignee {
    displayName: string;
    emailAddress: string;
}
export interface IssueReporter {
    displayName: string;
    emailAddress: string;
}
export interface IssueTimeTracking {
    remainingEstimate?: string;
    timeSpent?: string;
    remainingEstimateSeconds?: number;
    timeSpentSeconds?: number;
}
export interface IssueDetail {
    key: string;
    summary: string;
    description: string;
    issuetype: string;
    project: IssueProject;
    status: string;
    assignee: IssueAssignee;
    reporter: IssueReporter;
    timespent?: number;
    aggregatetimeestimate?: number;
    aggregatetimeoriginalestimate?: number;
    timetracking: IssueTimeTracking;
    'customfield_12810 (Epic Issue)'?: string;
    [key: string]: any;
}
export interface CreateIssueResponse {
    id?: string;
    key?: string;
    error?: string;
}
export interface UpdateIssueResponse {
    error?: string;
    success?: boolean;
}
export interface IssueFields {
    project: {
        key: string;
    };
    summary: string;
    issuetype: {
        name: string;
    };
    description?: string;
    assignee?: {
        name: string;
    };
    components?: Array<{
        name: string;
    }>;
    [key: string]: any;
}
export interface JiraComment {
    id: string;
    body: string;
    created: string;
    updated: string;
    author: string;
}
export interface IssueCommentsResponse {
    comments?: any[];
    error?: string;
}
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
export interface JiraProject {
    key: string;
    name: string;
    id: string;
    description?: string;
    lead?: any;
    projectTypeKey?: string;
    simplified?: boolean;
    style?: string;
    isPrivate?: boolean;
    [key: string]: any;
}
export interface JiraComponent {
    id: string;
    name: string;
    description?: string;
    lead?: any;
    assigneeType?: string;
    assignee?: any;
    realAssigneeType?: string;
    realAssignee?: any;
    isAssigneeTypeValid?: boolean;
    project?: string;
    projectId?: number;
}
export interface JiraVersion {
    id: string;
    name: string;
    released: boolean;
    releaseDate?: string;
    startDate?: string;
    description?: string;
    archived?: boolean;
    overdue?: boolean;
    projectId?: number;
}
export interface JiraRole {
    id: string;
    name: string;
    description?: string;
    actors?: any[];
}
export interface JiraIssueType {
    id: string;
    name: string;
    description?: string;
    subtask: boolean;
    iconUrl?: string;
}
export interface JiraPermissionScheme {
    id: string;
    name: string;
    description?: string;
    permissions?: any[];
}
export interface JiraNotificationScheme {
    id: string;
    name: string;
    description?: string;
    notificationSchemeEvents?: any[];
}
export interface JiraSprint {
    id: number;
    name: string;
    state: 'future' | 'active' | 'closed';
    startDate?: string;
    endDate?: string;
    completeDate?: string;
    goal?: string;
    originBoardId?: number;
}
export interface SprintInput {
    name: string;
    start_date: string;
    end_date: string;
    goal?: string;
}
export interface JiraBoard {
    id: number;
    name: string;
    type: string;
    location?: any;
}
export interface BoardOptions {
    board_name?: string;
    project_key?: string;
    board_type?: string;
    start?: number;
    limit?: number;
}
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
export interface JiraTransition {
    id: string;
    name: string;
    to?: any;
    hasScreen?: boolean;
    isGlobal?: boolean;
    isInitial?: boolean;
    isConditional?: boolean;
    fields?: any;
}
export interface JiraField {
    id: string;
    name: string;
    custom: boolean;
    orderable?: boolean;
    navigable?: boolean;
    searchable?: boolean;
    schema?: {
        type: string;
        custom?: string;
        customId?: number;
    };
    clauseNames?: string[];
}
//# sourceMappingURL=types.d.ts.map