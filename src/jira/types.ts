import { ApiResponse } from '../shared/types.js';

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

// Issue search types
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

// Issue detail types
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

// Create/Update types
export interface CreateIssueResponse {
  id?: string;
  key?: string;
  error?: string;
}

export interface UpdateIssueResponse {
  error?: string;
  success?: boolean;
}

// Issue types
export interface IssueFields {
  project: { key: string };
  summary: string;
  issuetype: { name: string };
  description?: string;
  assignee?: { name: string };
  components?: Array<{ name: string }>;
  [key: string]: any;
}

// Comment types
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

// ========================================
// Phase 2: Project Management Types
// ========================================

// Project types
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

// Component types
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

// Version types
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

// Role types
export interface JiraRole {
  id: string;
  name: string;
  description?: string;
  actors?: any[];
}

// Issue type
export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  subtask: boolean;
  iconUrl?: string;
}

// Scheme types
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

// ========================================
// Phase 3: Agile Features (Epics, Sprints, Boards)
// ========================================

// Sprint types
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

// Board types
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

// ========================================
// Phase 4: Advanced Features (Worklogs, Transitions, Fields)
// ========================================

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
  to?: any;
  hasScreen?: boolean;
  isGlobal?: boolean;
  isInitial?: boolean;
  isConditional?: boolean;
  fields?: any;
}

// Field types
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