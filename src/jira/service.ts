import { HttpClient } from '../shared/http-client.js';
import { getJiraConfig } from '../shared/config.js';
import { ApiResponse, ErrorResponse } from '../shared/types.js';
import {
  IssueSearchResponse,
  IssueDetail,
  CreateIssueResponse,
  UpdateIssueResponse,
  IssueCommentsResponse,
  SearchOptions,
  GetIssueOptions,
  IssueFields,
  JiraComment,
  JiraChangelog,
} from './types.js';

const DEFAULT_READ_JIRA_FIELDS = [
  'summary',
  'description',
  'issuetype',
  'project',
  'status',
  'assignee',
  'reporter',
  'created',
  'updated',
  'priority',
  'labels',
  'components',
  'fixVersions',
  'comment',
];

export class JiraService {
  private client: HttpClient;
  private editableIssues: string[] = ['CAB-3034'];
  private fieldIdsCache: any[] | null = null;

  constructor() {
    const config = getJiraConfig();
    this.client = new HttpClient(
      config.baseUrl,
      config.apiToken
    );
  }

  // ========================================
  // Phase 1: Core Functions (Issues, Search, Comments)
  // ========================================

  /**
   * Get a Jira issue by key with detailed options
   */
  async getIssue(issueKey: string, options?: GetIssueOptions): Promise<IssueDetail> {
    try {
      const {
        expand,
        comment_limit = 10,
        fields,
        properties,
        update_history = true,
      } = options || {};

      // Determine fields parameter
      let fieldsParam: string;
      if (fields === null || fields === undefined) {
        fieldsParam = DEFAULT_READ_JIRA_FIELDS.join(',');
      } else if (Array.isArray(fields)) {
        fieldsParam = fields.join(',');
      } else {
        fieldsParam = fields as string;
      }

      const params: any = {
        fields: fieldsParam,
      };

      if (expand) {
        params.expand = expand;
      }

      if (properties) {
        params.properties = Array.isArray(properties) ? properties.join(',') : properties;
      }

      if (update_history !== undefined) {
        params.updateHistory = update_history;
      }

      const url = `/rest/api/2/issue/${issueKey}`;
      const response = await this.client.get<any>(url, { params });

      const responseFields = response.fields || {};
      const projectInfo = responseFields.project || {};
      const issuetypeInfo = responseFields.issuetype || {};
      const statusInfo = responseFields.status || {};
      const assigneeInfo = responseFields.assignee || {};
      const reporterInfo = responseFields.reporter || {};
      const timetrackingInfo = responseFields.timetracking || {};

      return {
        key: response.key,
        summary: responseFields.summary,
        description: responseFields.description,
        issuetype: issuetypeInfo.name,
        project: {
          key: projectInfo.key,
          name: projectInfo.name,
        },
        status: statusInfo.name,
        assignee: {
          displayName: assigneeInfo?.displayName || '',
          emailAddress: assigneeInfo?.emailAddress || '',
        },
        reporter: {
          displayName: reporterInfo?.displayName || '',
          emailAddress: reporterInfo?.emailAddress || '',
        },
        timespent: responseFields.timespent,
        aggregatetimeestimate: responseFields.aggregatetimeestimate,
        aggregatetimeoriginalestimate: responseFields.aggregatetimeoriginalestimate,
        timetracking: {
          remainingEstimate: timetrackingInfo?.remainingEstimate,
          timeSpent: timetrackingInfo?.timeSpent,
          remainingEstimateSeconds: timetrackingInfo?.remainingEstimateSeconds,
          timeSpentSeconds: timetrackingInfo?.timeSpentSeconds,
        },
        ...responseFields,
      };
    } catch (error) {
      throw new Error(`Error retrieving issue ${issueKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new Jira issue
   */
  async createIssue(fields: IssueFields): Promise<CreateIssueResponse> {
    try {
      const url = '/rest/api/2/issue/';
      const data = { fields };
      const response = await this.client.post<any>(url, data);

      if (response.key) {
        this.editableIssues.push(response.key);
      }

      return {
        id: response.id,
        key: response.key,
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Update a Jira issue
   */
  async updateIssue(issueKey: string, fields: Record<string, any>): Promise<UpdateIssueResponse> {
    try {
      const url = `/rest/api/2/issue/${issueKey}`;
      const data = { fields };
      await this.client.put<any>(url, data);

      return { success: true };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Delete a Jira issue
   */
  async deleteIssue(issueKey: string): Promise<boolean> {
    try {
      const url = `/rest/api/2/issue/${issueKey}`;
      await this.client.delete(url);
      return true;
    } catch (error) {
      throw new Error(`Error deleting issue ${issueKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Search for issues using JQL
   */
  async searchIssues(jql: string, options?: SearchOptions): Promise<IssueSearchResponse> {
    try {
      const {
        fields,
        start = 0,
        limit = 50,
        expand,
        projects_filter,
      } = options || {};

      let finalJql = jql;

      // Apply projects filter if present
      if (projects_filter) {
        const projects = projects_filter.split(',').map(p => p.trim());
        const projectQuery = projects.length === 1
          ? `project = "${projects[0]}"`
          : `project IN (${projects.map(p => `"${p}"`).join(', ')})`;

        if (!finalJql) {
          finalJql = projectQuery;
        } else if (finalJql.trim().toUpperCase().startsWith('ORDER BY')) {
          finalJql = `${projectQuery} ${finalJql}`;
        } else if (!finalJql.includes('project = ') && !finalJql.includes('project IN')) {
          finalJql = `(${finalJql}) AND ${projectQuery}`;
        }
      }

      const fieldsParam = fields
        ? (Array.isArray(fields) ? fields.join(',') : fields)
        : DEFAULT_READ_JIRA_FIELDS.join(',');

      const params: any = {
        jql: finalJql,
        startAt: start,
        maxResults: Math.min(limit, 100),
        fields: fieldsParam,
      };

      if (expand) {
        params.expand = expand;
      }

      const url = '/rest/api/2/search';
      const response = await this.client.get<any>(url, { params });

      const issues = (response.issues || []).map((issue: any) => ({
        key: issue.key,
        title: issue.fields?.summary,
        fields: issue.fields,
      }));

      return {
        startAt: response.startAt,
        maxResults: response.maxResults,
        total: response.total,
        issues,
      };
    } catch (error) {
      throw new Error(`Error searching issues with JQL '${jql}': ${(error as Error).message}`);
    }
  }

  /**
   * Get issues for a specific board
   */
  async getBoardIssues(boardId: string, jql: string, options?: SearchOptions): Promise<IssueSearchResponse> {
    try {
      const {
        fields,
        start = 0,
        limit = 50,
        expand,
      } = options || {};

      const fieldsParam = fields
        ? (Array.isArray(fields) ? fields.join(',') : fields)
        : DEFAULT_READ_JIRA_FIELDS.join(',');

      const params: any = {
        jql,
        startAt: start,
        maxResults: Math.min(limit, 100),
        fields: fieldsParam,
      };

      if (expand) {
        params.expand = expand;
      }

      const url = `/rest/agile/1.0/board/${boardId}/issue`;
      const response = await this.client.get<any>(url, { params });

      const issues = (response.issues || []).map((issue: any) => ({
        key: issue.key,
        title: issue.fields?.summary,
        fields: issue.fields,
      }));

      return {
        startAt: response.startAt,
        maxResults: response.maxResults,
        total: response.total,
        issues,
      };
    } catch (error) {
      throw new Error(`Error getting board issues: ${(error as Error).message}`);
    }
  }

  /**
   * Get issues for a specific sprint
   */
  async getSprintIssues(sprintId: string, options?: SearchOptions): Promise<IssueSearchResponse> {
    try {
      const {
        fields,
        start = 0,
        limit = 50,
      } = options || {};

      const fieldsParam = fields
        ? (Array.isArray(fields) ? fields.join(',') : fields)
        : DEFAULT_READ_JIRA_FIELDS.join(',');

      const params: any = {
        startAt: start,
        maxResults: Math.min(limit, 100),
      };

      const url = `/rest/agile/1.0/sprint/${sprintId}/issue`;
      const response = await this.client.get<any>(url, { params });

      const issues = (response.issues || []).map((issue: any) => ({
        key: issue.key,
        title: issue.fields?.summary,
        fields: issue.fields,
      }));

      return {
        startAt: response.startAt,
        maxResults: response.maxResults,
        total: response.total,
        issues,
      };
    } catch (error) {
      throw new Error(`Error getting sprint issues: ${(error as Error).message}`);
    }
  }

  /**
   * Get comments for a specific issue
   */
  async getIssueComments(issueKey: string, limit: number = 50): Promise<JiraComment[]> {
    try {
      const url = `/rest/api/2/issue/${issueKey}/comment`;
      const response = await this.client.get<any>(url, {
        params: { maxResults: Math.min(limit, 100) },
      });

      const comments = (response.comments || []).slice(0, limit).map((comment: any) => ({
        id: comment.id,
        body: this.cleanText(comment.body || ''),
        created: comment.created,
        updated: comment.updated,
        author: comment.author?.displayName || 'Unknown',
      }));

      return comments;
    } catch (error) {
      throw new Error(`Error getting comments for issue ${issueKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueKey: string, comment: string): Promise<JiraComment> {
    try {
      const jiraFormattedComment = this.markdownToJira(comment);
      const url = `/rest/api/2/issue/${issueKey}/comment`;
      const data = { body: jiraFormattedComment };
      const result = await this.client.post<any>(url, data);

      return {
        id: result.id,
        body: this.cleanText(result.body || ''),
        created: result.created,
        updated: result.updated || result.created,
        author: result.author?.displayName || 'Unknown',
      };
    } catch (error) {
      throw new Error(`Error adding comment to issue ${issueKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Create multiple issues in a batch
   */
  async batchCreateIssues(issues: IssueFields[], validateOnly: boolean = false): Promise<CreateIssueResponse[]> {
    if (!issues || issues.length === 0) {
      return [];
    }

    try {
      const issueUpdates = issues.map(issue => ({ fields: issue }));

      if (validateOnly) {
        return issueUpdates.map(() => ({ id: 'validated', key: 'validated' }));
      }

      const url = '/rest/api/2/issue/bulk';
      const response = await this.client.post<any>(url, { issueUpdates });

      const createdIssues: CreateIssueResponse[] = [];
      for (const issueInfo of response.issues || []) {
        if (issueInfo.key) {
          this.editableIssues.push(issueInfo.key);
          createdIssues.push({
            id: issueInfo.id,
            key: issueInfo.key,
          });
        }
      }

      if (response.errors && response.errors.length > 0) {
        console.error('Bulk creation errors:', response.errors);
      }

      return createdIssues;
    } catch (error) {
      throw new Error(`Error in bulk issue creation: ${(error as Error).message}`);
    }
  }

  /**
   * Get changelog for a specific issue (Server/Data Center compatible)
   * @param issueKey - The issue key (e.g., PROJ-123)
   * @param startAt - Starting index for pagination (default: 0)
   * @param maxResults - Maximum number of changelog entries to return (default: 100)
   */
  async getIssueChangelog(issueKey: string, startAt: number = 0, maxResults: number = 100): Promise<any> {
    try {
      const url = `/rest/api/2/issue/${issueKey}?expand=changelog`;
      const response = await this.client.get<any>(url, {
        params: { startAt, maxResults }
      });

      const histories = response.changelog?.histories || [];
      return {
        issueKey,
        total: response.changelog?.total || 0,
        startAt: response.changelog?.startAt || 0,
        maxResults: response.changelog?.maxResults || 0,
        histories: histories.map((history: any) => ({
          id: history.id,
          author: {
            name: history.author?.name || history.author?.username,
            displayName: history.author?.displayName,
          },
          created: history.created,
          items: history.items || [],
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get issue changelog: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Phase 2: Project Management Functions
  // ========================================

  /**
   * Get all projects
   */
  async getAllProjects(includeArchived: boolean = false): Promise<any[]> {
    try {
      const params: any = {};
      if (!includeArchived) {
        params.status = 'live';
      }

      const url = '/rest/api/2/project';
      const response = await this.client.get<any>(url, { params });

      return Array.isArray(response) ? response : [];
    } catch (error) {
      throw new Error(`Error getting all projects: ${(error as Error).message}`);
    }
  }

  /**
   * Get project details
   */
  async getProject(projectKey: string): Promise<any | null> {
    try {
      const url = `/rest/api/2/project/${projectKey}`;
      const response = await this.client.get<any>(url);
      return response;
    } catch (error) {
      if ((error as Error).message.includes('404')) {
        return null;
      }
      throw new Error(`Error getting project ${projectKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get project model
   */
  async getProjectModel(projectKey: string): Promise<any | null> {
    return this.getProject(projectKey);
  }

  /**
   * Check if project exists
   */
  async projectExists(projectKey: string): Promise<boolean> {
    try {
      const project = await this.getProject(projectKey);
      return project !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get project components
   */
  async getProjectComponents(projectKey: string): Promise<any[]> {
    try {
      const url = `/rest/api/2/project/${projectKey}/components`;
      const response = await this.client.get<any>(url);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      throw new Error(`Error getting components for project ${projectKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get project versions
   */
  async getProjectVersions(projectKey: string): Promise<any[]> {
    try {
      const url = `/rest/api/2/project/${projectKey}/versions`;
      const response = await this.client.get<any>(url);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      throw new Error(`Error getting versions for project ${projectKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get project roles
   * Note: Direct access to /rest/api/2/project/{key}/role requires admin permissions (401)
   * Instead, we get roles from the project object which is accessible to regular users
   */
  async getProjectRoles(projectKey: string): Promise<any> {
    try {
      const project = await this.getProject(projectKey);
      return project.roles || {};
    } catch (error) {
      throw new Error(`Error getting roles for project ${projectKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get project role members
   * NOTE: This endpoint requires admin permissions (401 Unauthorized)
   * - /rest/api/2/project/{projectKey}/role/{roleId} returns 401 for non-admin users
   * - /rest/api/2/role/{roleId} returns 403 Forbidden
   * - No alternative method found to get role members without admin permissions
   */
  // async getProjectRoleMembers(projectKey: string, roleId: string): Promise<any[]> {
  //   try {
  //     const url = `/rest/api/2/project/${projectKey}/role/${roleId}`;
  //     const response = await this.client.get<any>(url);
  //     return response.actors || [];
  //   } catch (error) {
  //     throw new Error(`Error getting role members for project ${projectKey}, role ${roleId}: ${(error as Error).message}`);
  //   }
  // }

  /**
   * Get my permissions for a project
   * Returns all permissions that the current user has for the specified project
   * This replaces getProjectPermissionScheme which requires admin permissions
   */
  async getMyProjectPermissions(projectKey: string): Promise<any> {
    try {
      const url = `/rest/api/2/mypermissions`;
      const response = await this.client.get<any>(url, {
        params: { projectKey }
      });
      return response;
    } catch (error) {
      throw new Error(`Error getting my permissions for project ${projectKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get project notification scheme
   * NOTE: This endpoint is not supported in Jira Server 9.4
   * - /rest/api/2/project/{key}/notificationscheme returns 400 Bad Request
   * - /rest/api/2/notificationscheme/project returns 404 Not Found
   * - No alternative method found to map projects to notification schemes
   * - This feature appears to be Jira Cloud only or requires admin permissions
   */
  // async getProjectNotificationScheme(projectKey: string): Promise<any> {
  //   try {
  //     const url = `/rest/api/2/project/${projectKey}/notificationscheme`;
  //     const response = await this.client.get<any>(url);
  //     return response;
  //   } catch (error) {
  //     throw new Error(`Error getting notification scheme for project ${projectKey}: ${(error as Error).message}`);
  //   }
  // }

  /**
   * Get project issue types
   */
  async getProjectIssueTypes(projectKey: string): Promise<any[]> {
    try {
      const project = await this.getProject(projectKey);
      if (!project) {
        return [];
      }
      return project.issueTypes || [];
    } catch (error) {
      throw new Error(`Error getting issue types for project ${projectKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get project issues count
   */
  async getProjectIssuesCount(projectKey: string): Promise<number> {
    try {
      const jql = `project = "${projectKey}"`;
      const url = '/rest/api/2/search';
      const response = await this.client.get<any>(url, {
        params: {
          jql,
          maxResults: 0,
        },
      });
      return response.total || 0;
    } catch (error) {
      throw new Error(`Error getting issues count for project ${projectKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get project statuses
   * Returns all statuses available for a project
   */
  async getProjectStatuses(projectKey: string): Promise<any[]> {
    try {
      const url = `/rest/api/2/project/${projectKey}/statuses`;
      const response = await this.client.get<any>(url);
      return response || [];
    } catch (error) {
      throw new Error(`Error getting statuses for project ${projectKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get project priorities
   * Returns all priorities available in the Jira instance
   */
  async getProjectPriorities(): Promise<any[]> {
    try {
      const url = '/rest/api/2/priority';
      const response = await this.client.get<any>(url);
      return response || [];
    } catch (error) {
      throw new Error(`Error getting priorities: ${(error as Error).message}`);
    }
  }

  /**
   * Get project resolutions
   * Returns all resolutions available in the Jira instance
   */
  async getProjectResolutions(): Promise<any[]> {
    try {
      const url = '/rest/api/2/resolution';
      const response = await this.client.get<any>(url);
      return response || [];
    } catch (error) {
      throw new Error(`Error getting resolutions: ${(error as Error).message}`);
    }
  }

  /**
   * Get project issues
   */
  async getProjectIssues(projectKey: string, start: number = 0, limit: number = 50): Promise<IssueSearchResponse> {
    try {
      const jql = `project = "${projectKey}"`;
      return await this.searchIssues(jql, { start, limit });
    } catch (error) {
      throw new Error(`Error getting issues for project ${projectKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Create project version
   */
  async createProjectVersion(
    projectKey: string,
    name: string,
    startDate?: string,
    releaseDate?: string,
    description?: string
  ): Promise<any> {
    try {
      const url = '/rest/api/2/version';
      const data: any = {
        name,
        project: projectKey,
      };

      if (startDate) {
        data.startDate = startDate;
      }
      if (releaseDate) {
        data.releaseDate = releaseDate;
      }
      if (description) {
        data.description = description;
      }

      const response = await this.client.post<any>(url, data);
      return response;
    } catch (error) {
      throw new Error(`Error creating version for project ${projectKey}: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Phase 3: Agile Features (Epics, Sprints, Boards)
  // ========================================

  /**
   * Link issue to epic
   */
  async linkIssueToEpic(issueKey: string, epicKey: string): Promise<any> {
    try {
      const epicLinkFields = await this.getFieldIdsToEpic();
      const epicLinkField = epicLinkFields.epic_link;

      if (!epicLinkField) {
        throw new Error('Epic Link field not found');
      }

      const updateData: any = {
        fields: {
          [epicLinkField]: epicKey,
        },
      };

      await this.updateIssue(issueKey, updateData.fields);
      return await this.getIssue(issueKey);
    } catch (error) {
      throw new Error(`Error linking issue ${issueKey} to epic ${epicKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get epic issues
   */
  async getEpicIssues(epicKey: string, start: number = 0, limit: number = 50): Promise<any[]> {
    try {
      // Note: For epic link queries, we use the field name "Epic Link" instead of the field ID
      // because Jira's JQL requires the field name for epic link fields
      const jql = `"Epic Link" = "${epicKey}"`;
      const result = await this.searchIssues(jql, { start, limit });

      return result.issues.map(issue => ({
        key: issue.key,
        ...issue.fields,
      }));
    } catch (error) {
      throw new Error(`Error getting issues for epic ${epicKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get all sprints from board
   */
  async getAllSprintsFromBoard(boardId: string, state?: string, start: number = 0, limit: number = 50): Promise<any[]> {
    try {
      const params: any = {
        startAt: start,
        maxResults: Math.min(limit, 100),
      };

      if (state) {
        params.state = state;
      }

      const url = `/rest/agile/1.0/board/${boardId}/sprint`;
      const response = await this.client.get<any>(url, { params });

      return response.values || [];
    } catch (error) {
      throw new Error(`Error getting sprints for board ${boardId}: ${(error as Error).message}`);
    }
  }

  /**
   * Get all sprints from board model
   */
  async getAllSprintsFromBoardModel(boardId: string, state?: string, start: number = 0, limit: number = 50): Promise<any[]> {
    return this.getAllSprintsFromBoard(boardId, state, start, limit);
  }

  /**
   * Update sprint
   */
  async updateSprint(
    sprintId: string,
    sprintName?: string,
    state?: string,
    startDate?: string,
    endDate?: string,
    goal?: string
  ): Promise<any | null> {
    try {
      const url = `/rest/agile/1.0/sprint/${sprintId}`;
      const data: any = {};

      if (sprintName) {
        data.name = sprintName;
      }
      if (state) {
        data.state = state;
      }
      if (startDate) {
        data.startDate = startDate;
      }
      if (endDate) {
        data.endDate = endDate;
      }
      if (goal !== undefined) {
        data.goal = goal;
      }

      const response = await this.client.put<any>(url, data);
      return response;
    } catch (error) {
      throw new Error(`Error updating sprint ${sprintId}: ${(error as Error).message}`);
    }
  }

  /**
   * Create sprint
   */
  async createSprint(boardId: string, sprint: any): Promise<any> {
    try {
      const url = '/rest/agile/1.0/sprint';
      const data: any = {
        name: sprint.name || sprint.sprint_name,
        startDate: sprint.start_date,
        endDate: sprint.end_date,
        originBoardId: parseInt(boardId),
      };

      if (sprint.goal) {
        data.goal = sprint.goal;
      }

      const response = await this.client.post<any>(url, data);
      return response;
    } catch (error) {
      throw new Error(`Error creating sprint on board ${boardId}: ${(error as Error).message}`);
    }
  }

  /**
   * Get all active sprints
   * Returns all active sprints across all boards
   */
  async getAllActiveSprints(start: number = 0, limit: number = 50): Promise<any[]> {
    try {
      // Get all boards first
      const boards = await this.getAllAgileBoards();
      const activeSprints: any[] = [];

      // Get active sprints from each board
      for (const board of boards) {
        const boardId = board.id?.toString();
        if (boardId) {
          try {
            // Only scrum boards support sprints, skip kanban boards
            if (board.type === 'scrum') {
              const sprints = await this.getAllSprintsFromBoard(boardId, 'active', start, limit);
              activeSprints.push(...sprints);
            }
          } catch (error) {
            // Skip boards that don't support sprints or have permission issues
            continue;
          }
        }
      }

      return activeSprints;
    } catch (error) {
      throw new Error(`Error getting active sprints: ${(error as Error).message}`);
    }
  }

  /**
   * Get sprint details
   * Returns detailed information about a specific sprint
   */
  async getSprintDetails(sprintId: string): Promise<any> {
    try {
      const url = `/rest/agile/1.0/sprint/${sprintId}`;
      const response = await this.client.get<any>(url);
      return response;
    } catch (error) {
      throw new Error(`Error getting sprint details for ${sprintId}: ${(error as Error).message}`);
    }
  }

  /**
   * Start sprint
   * Transitions a sprint to active state
   */
  async startSprint(sprintId: string): Promise<any> {
    try {
      return await this.updateSprint(sprintId, undefined, 'active');
    } catch (error) {
      throw new Error(`Error starting sprint ${sprintId}: ${(error as Error).message}`);
    }
  }

  /**
   * Complete sprint
   * Transitions a sprint to closed state
   */
  async completeSprint(sprintId: string): Promise<any> {
    try {
      return await this.updateSprint(sprintId, undefined, 'closed');
    } catch (error) {
      throw new Error(`Error completing sprint ${sprintId}: ${(error as Error).message}`);
    }
  }

  /**
   * Get all agile boards
   */
  async getAllAgileBoards(options?: any): Promise<any[]> {
    try {
      const {
        board_name,
        project_key,
        board_type,
        start = 0,
        limit = 50,
      } = options || {};

      const params: any = {
        startAt: start,
        maxResults: Math.min(limit, 100),
      };

      if (board_name) {
        params.name = board_name;
      }
      if (project_key) {
        params.projectKeyOrId = project_key;
      }
      if (board_type) {
        params.type = board_type;
      }

      const url = '/rest/agile/1.0/board';
      const response = await this.client.get<any>(url, { params });

      return response.values || [];
    } catch (error) {
      throw new Error(`Error getting agile boards: ${(error as Error).message}`);
    }
  }

  /**
   * Get all agile boards model
   */
  async getAllAgileBoardsModel(options?: any): Promise<any[]> {
    return this.getAllAgileBoards(options);
  }

  // ========================================
  // Phase 4: Advanced Features (Worklogs, Transitions, Fields)
  // ========================================

  /**
   * Add worklog
   */
  async addWorklog(issueKey: string, worklog: any): Promise<any> {
    try {
      const url = `/rest/api/2/issue/${issueKey}/worklog`;
      const data: any = {
        timeSpent: worklog.time_spent,
      };

      if (worklog.comment) {
        data.comment = worklog.comment;
      }
      if (worklog.started) {
        data.started = worklog.started;
      }
      if (worklog.original_estimate) {
        data.originalEstimate = worklog.original_estimate;
      }
      if (worklog.remaining_estimate) {
        data.remainingEstimate = worklog.remaining_estimate;
      }

      const response = await this.client.post<any>(url, data);
      return response;
    } catch (error) {
      throw new Error(`Error adding worklog to issue ${issueKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get worklog
   */
  async getWorklog(issueKey: string): Promise<any> {
    try {
      const url = `/rest/api/2/issue/${issueKey}/worklog`;
      const response = await this.client.get<any>(url);
      return response;
    } catch (error) {
      throw new Error(`Error getting worklog for issue ${issueKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get worklog models
   */
  async getWorklogModels(issueKey: string): Promise<any[]> {
    try {
      const response = await this.getWorklog(issueKey);
      return response.worklogs || [];
    } catch (error) {
      throw new Error(`Error getting worklog models for issue ${issueKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get worklogs
   */
  async getWorklogs(issueKey: string): Promise<any[]> {
    return this.getWorklogModels(issueKey);
  }

  /**
   * Get available transitions
   */
  async getAvailableTransitions(issueKey: string): Promise<any[]> {
    try {
      const url = `/rest/api/2/issue/${issueKey}/transitions`;
      const response = await this.client.get<any>(url);
      return response.transitions || [];
    } catch (error) {
      throw new Error(`Error getting transitions for issue ${issueKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get transitions
   */
  async getTransitions(issueKey: string): Promise<any[]> {
    return this.getAvailableTransitions(issueKey);
  }

  /**
   * Get transitions models
   */
  async getTransitionsModels(issueKey: string): Promise<any[]> {
    return this.getAvailableTransitions(issueKey);
  }

  /**
   * Transition issue
   */
  async transitionIssue(issueKey: string, transitionId: string | number, fields?: any, comment?: string): Promise<any> {
    try {
      const url = `/rest/api/2/issue/${issueKey}/transitions`;
      const data: any = {
        transition: {
          id: transitionId.toString(),
        },
      };

      if (fields) {
        data.fields = fields;
      }

      if (comment) {
        data.update = {
          comment: [
            {
              add: {
                body: this.markdownToJira(comment),
              },
            },
          ],
        };
      }

      await this.client.post<any>(url, data);
      return await this.getIssue(issueKey);
    } catch (error) {
      throw new Error(`Error transitioning issue ${issueKey}: ${(error as Error).message}`);
    }
  }

  /**
   * Get fields
   */
  async getFields(refresh: boolean = false): Promise<any[]> {
    try {
      if (this.fieldIdsCache && !refresh) {
        return this.fieldIdsCache;
      }

      const url = '/rest/api/2/field';
      const response = await this.client.get<any>(url);
      this.fieldIdsCache = Array.isArray(response) ? response : [];
      return this.fieldIdsCache;
    } catch (error) {
      throw new Error(`Error getting fields: ${(error as Error).message}`);
    }
  }

  /**
   * Get field ID
   */
  async getFieldId(fieldName: string, refresh: boolean = false): Promise<string | null> {
    try {
      const fields = await this.getFields(refresh);
      const field = fields.find((f: any) =>
        f.name.toLowerCase() === fieldName.toLowerCase() ||
        (f.clauseNames && f.clauseNames.some((cn: string) => cn.toLowerCase() === fieldName.toLowerCase()))
      );
      return field ? field.id : null;
    } catch (error) {
      throw new Error(`Error getting field ID for ${fieldName}: ${(error as Error).message}`);
    }
  }

  /**
   * Get field by ID
   */
  async getFieldById(fieldId: string, refresh: boolean = false): Promise<any | null> {
    try {
      const fields = await this.getFields(refresh);
      const field = fields.find((f: any) => f.id === fieldId);
      return field || null;
    } catch (error) {
      throw new Error(`Error getting field by ID ${fieldId}: ${(error as Error).message}`);
    }
  }

  /**
   * Get custom fields
   */
  async getCustomFields(refresh: boolean = false): Promise<any[]> {
    try {
      const fields = await this.getFields(refresh);
      return fields.filter((f: any) => f.custom === true);
    } catch (error) {
      throw new Error(`Error getting custom fields: ${(error as Error).message}`);
    }
  }

  /**
   * Get required fields
   */
  async getRequiredFields(issueType: string, projectKey: string): Promise<any> {
    try {
      // Note: Jira Server 9.0+ uses new createmeta endpoints
      // Old endpoint /rest/api/2/issue/createmeta was removed in Jira 9.0
      // New endpoints: /rest/api/2/issue/createmeta/{projectKey}/issuetypes/{issueTypeId}

      // Step 1: Get project to find issue type ID
      const project = await this.client.get<any>(`/rest/api/2/project/${projectKey}`);

      if (!project.issueTypes || project.issueTypes.length === 0) {
        return {};
      }

      // Find the issue type by name
      const issueTypeData = project.issueTypes.find(
        (type: any) => type.name.toLowerCase() === issueType.toLowerCase()
      );

      if (!issueTypeData) {
        return {};
      }

      // Step 2: Get field metadata for this issue type
      const fieldsResponse = await this.client.get<any>(
        `/rest/api/2/issue/createmeta/${projectKey}/issuetypes/${issueTypeData.id}`
      );

      if (!fieldsResponse.values || fieldsResponse.values.length === 0) {
        return {};
      }

      // Step 3: Extract required fields
      const requiredFields: any = {};
      for (const field of fieldsResponse.values) {
        if (field.required) {
          requiredFields[field.fieldId] = {
            name: field.name,
            required: field.required,
            schema: field.schema,
            fieldId: field.fieldId,
          };
        }
      }

      return requiredFields;
    } catch (error) {
      throw new Error(`Error getting required fields: ${(error as Error).message}`);
    }
  }

  /**
   * Get field IDs to epic
   */
  async getFieldIdsToEpic(): Promise<Record<string, string>> {
    try {
      const fields = await this.getFields();
      const result: Record<string, string> = {};

      // Epic Link field
      const epicLinkField = fields.find((f: any) =>
        f.name.toLowerCase().includes('epic link') ||
        f.id === 'customfield_10014' ||
        (f.schema && f.schema.custom && f.schema.custom.includes('epic-link'))
      );
      if (epicLinkField) {
        result.epic_link = epicLinkField.id;
      }

      // Epic Name field
      const epicNameField = fields.find((f: any) =>
        f.name.toLowerCase().includes('epic name') ||
        f.id === 'customfield_10011' ||
        (f.schema && f.schema.custom && f.schema.custom.includes('epic-name'))
      );
      if (epicNameField) {
        result.epic_name = epicNameField.id;
      }

      return result;
    } catch (error) {
      throw new Error(`Error getting epic field IDs: ${(error as Error).message}`);
    }
  }

  /**
   * Search fields
   */
  async searchFields(keyword: string, limit: number = 10, refresh: boolean = false): Promise<any[]> {
    try {
      const fields = await this.getFields(refresh);
      const lowerKeyword = keyword.toLowerCase();

      const matches = fields.filter((f: any) => {
        const nameMatch = f.name.toLowerCase().includes(lowerKeyword);
        const idMatch = f.id.toLowerCase().includes(lowerKeyword);
        const clauseMatch = f.clauseNames && f.clauseNames.some((cn: string) =>
          cn.toLowerCase().includes(lowerKeyword)
        );
        return nameMatch || idMatch || clauseMatch;
      });

      return matches.slice(0, limit);
    } catch (error) {
      throw new Error(`Error searching fields with keyword '${keyword}': ${(error as Error).message}`);
    }
  }

  /**
   * COMMENTED OUT: Create custom field
   * NOTE: This is a dangerous operation that modifies the Jira schema
   * - Creates a new custom field across the entire Jira instance
   * - Cannot be easily undone
   * - Requires admin permissions
   */
  // async createCustomField(name: string, description: string, type: string, searcherKey: string): Promise<any> {
  //   try {
  //     const url = '/rest/api/2/field';
  //     const data = {
  //       name,
  //       description,
  //       type,
  //       searcherKey,
  //     };
  //     const response = await this.client.post<any>(url, data);
  //     return response;
  //   } catch (error) {
  //     throw new Error(`Error creating custom field: ${(error as Error).message}`);
  //   }
  // }

  /**
   * COMMENTED OUT: Update custom field
   * NOTE: This is a dangerous operation
   * - Modifies existing custom field definition
   * - May affect all issues using this field
   * - Requires admin permissions
   */
  // async updateCustomField(fieldId: string, name: string, description: string): Promise<any> {
  //   try {
  //     const url = `/rest/api/2/field/${fieldId}`;
  //     const data = {
  //       name,
  //       description,
  //     };
  //     const response = await this.client.put<any>(url, data);
  //     return response;
  //   } catch (error) {
  //     throw new Error(`Error updating custom field ${fieldId}: ${(error as Error).message}`);
  //   }
  // }

  /**
   * COMMENTED OUT: Delete custom field
   * NOTE: This is an extremely dangerous operation
   * - Permanently deletes a custom field from the entire Jira instance
   * - All data in this field across all issues will be lost
   * - Cannot be undone
   * - Requires admin permissions
   */
  // async deleteCustomField(fieldId: string): Promise<boolean> {
  //   try {
  //     const url = `/rest/api/2/field/${fieldId}`;
  //     await this.client.delete(url);
  //     return true;
  //   } catch (error) {
  //     throw new Error(`Error deleting custom field ${fieldId}: ${(error as Error).message}`);
  //   }
  // }

  /**
   * Get issue picker suggestions
   * Returns issue suggestions based on a query string (for issue picker fields)
   */
  async getIssuePickerSuggestions(query: string, currentIssueKey?: string, currentProjectId?: string): Promise<any> {
    try {
      const url = '/rest/api/2/issue/picker';
      const params: any = {
        query,
      };
      if (currentIssueKey) {
        params.currentIssueKey = currentIssueKey;
      }
      if (currentProjectId) {
        params.currentProjectId = currentProjectId;
      }
      const response = await this.client.get<any>(url, { params });
      return response;
    } catch (error) {
      throw new Error(`Error getting issue picker suggestions: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Helper Methods
  // ========================================

  private cleanText(text: string): string {
    if (!text) return '';
    // Basic text cleaning - can be enhanced later
    return text.trim();
  }

  private markdownToJira(markdownText: string): string {
    if (!markdownText) return '';
    // Basic markdown to Jira markup conversion - can be enhanced later
    let jiraText = markdownText;
    
    // Headers
    jiraText = jiraText.replace(/^### (.*$)/gim, 'h3. $1');
    jiraText = jiraText.replace(/^## (.*$)/gim, 'h2. $1');
    jiraText = jiraText.replace(/^# (.*$)/gim, 'h1. $1');
    
    // Bold
    jiraText = jiraText.replace(/\*\*(.*?)\*\*/g, '*$1*');
    
    // Italic
    jiraText = jiraText.replace(/\*(.*?)\*/g, '_$1_');
    
    // Code
    jiraText = jiraText.replace(/`(.*?)`/g, '{{$1}}');
    
    // Links
    jiraText = jiraText.replace(/\[(.*?)\]\((.*?)\)/g, '[$1|$2]');
    
    return jiraText;
  }
}