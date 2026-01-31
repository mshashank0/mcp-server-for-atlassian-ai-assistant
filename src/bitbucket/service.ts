import { HttpClient } from '../shared/http-client.js';
import { getBitbucketConfig } from '../shared/config.js';
import { ApiResponse } from '../shared/types.js';
import {
  Repository,
  RepositoriesResponse,
  Commit,
  CommitsResponse,
  PullRequest,
  PullRequestsResponse,
  FileContent,
  RepoStructure,
  Comment,
  CommentsResponse,
  Activity,
  ActivitiesResponse,
  Task,
  TasksResponse,
  BranchModel,
  DefaultReviewersResponse,
  Participant,
} from './types.js';

export class BitbucketService {
  private client: HttpClient;

  // API Limits
  private static readonly MAX_REPOS_LIMIT = 100;
  private static readonly MAX_COMMITS_LIMIT = 30;
  private static readonly MAX_PRS_LIMIT = 30;
  private static readonly MAX_ACTIVITIES_LIMIT = 100;
  private static readonly MAX_COMMENTS_LIMIT = 100;

  constructor() {
    const config = getBitbucketConfig();
    this.client = new HttpClient(
      config.baseUrl,
      config.apiToken
    );
  }

  /**
   * Validate and cap limit to maximum allowed value
   */
  private validateLimit(limit: number, maxLimit: number): number {
    return Math.min(limit, maxLimit);
  }

  /**
   * Build URL with properly encoded path parameters
   * Handles special characters like ~ in personal repositories
   */
  private buildUrl(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const value = params[key];
      return value !== undefined ? encodeURIComponent(String(value)) : '';
    });
  }

  async getRepos(
    projectKey: string,
    startIndex: number = 0,
    limit: number = 100
  ): Promise<ApiResponse<RepositoriesResponse>> {
    try {
      const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_REPOS_LIMIT);
      const url = this.buildUrl('/rest/api/1.0/projects/{projectKey}/repos', { projectKey });
      const response = await this.client.get<any>(url, {
        params: { start: startIndex, limit: validatedLimit },
      });

      if (response.values) {
        // Extract only slug and name for each repository
        const filteredRepos: Repository[] = response.values.map((repo: any) => ({
          slug: repo.slug,
          name: repo.name,
        }));

        return {
          values: filteredRepos,
          size: response.size,
          isLastPage: response.isLastPage,
          nextPageStart: response.nextPageStart,
        };
      }

      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getCommits(
    projectKey: string,
    repoSlug: string,
    branchName: string,
    startIndex: number = 0,
    limit: number = 30
  ): Promise<ApiResponse<CommitsResponse>> {
    try {
      const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_COMMITS_LIMIT);
      const url = this.buildUrl('/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/commits', {
        projectKey,
        repoSlug,
      });
      const response = await this.client.get<any>(url, {
        params: { start: startIndex, limit: validatedLimit, until: branchName },
      });

      if (response.values) {
        const filteredCommits: Commit[] = response.values.map((commit: any) => ({
          id: commit.id,
          displayId: commit.displayId,
          message: commit.message,
        }));

        return {
          values: filteredCommits,
          size: response.size,
          isLastPage: response.isLastPage,
          nextPageStart: response.nextPageStart,
        };
      }

      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getPullRequests(
    projectKey: string,
    repoSlug: string,
    startIndex: number = 0,
    limit: number = 30
  ): Promise<ApiResponse<PullRequestsResponse>> {
    try {
      const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_PRS_LIMIT);
      const url = this.buildUrl('/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/pull-requests', {
        projectKey,
        repoSlug,
      });
      const response = await this.client.get<any>(url, {
        params: { start: startIndex, limit: validatedLimit, state: 'OPEN' },
      });

      if (response.values) {
        const filteredPullRequests: PullRequest[] = response.values.map((pr: any) => {
          const fromRefInfo = pr.fromRef || {};
          const toRefInfo = pr.toRef || {};

          return {
            id: pr.id,
            title: pr.title,
            description: pr.description,
            fromRef: {
              id: fromRefInfo.id,
              displayId: fromRefInfo.displayId,
              repository: {
                slug: fromRefInfo.repository?.slug,
                name: fromRefInfo.repository?.name,
              },
            },
            toRef: {
              id: toRefInfo.id,
              displayId: toRefInfo.displayId,
              repository: {
                slug: toRefInfo.repository?.slug,
                name: toRefInfo.repository?.name,
              },
            },
            reviewers: (pr.reviewers || []).map((r: any) => ({
              user: {
                displayName: r.user?.displayName,
                name: r.user?.name,
              },
              status: r.status,
            })),
            author: {
              user: {
                displayName: pr.author?.user?.displayName,
                name: pr.author?.user?.name,
              },
            },
          };
        });

        return {
          values: filteredPullRequests,
          size: response.size,
          isLastPage: response.isLastPage,
          nextPageStart: response.nextPageStart,
        };
      }

      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getFileContent(
    projectKey: string,
    repoSlug: string,
    filePath: string
  ): Promise<ApiResponse<FileContent>> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/browse/${filePath}`;
      const response = await this.client.get<any>(url);

      if (response.lines) {
        const content = response.lines.map((line: any) => line.text || '').join('\n');
        return {
          path: filePath,
          content,
          size: response.size || 0,
          isLastPage: response.isLastPage !== false,
        };
      }

      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getRepoStructure(
    projectKey: string,
    repoSlug: string,
    path: string = '',
    maxDepth: number = 10
  ): Promise<ApiResponse<RepoStructure>> {
    try {
      // For safety
      if (maxDepth > 10) {
        maxDepth = 10;
      }

      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/files/${path}`;
      const response = await this.client.get<RepoStructure>(url, {
        params: {
          limit: 100,
          max_depth: maxDepth,
        },
      });

      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getPullRequestDiff(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<string> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/diff`;
      const diff = await this.client.getText(url);
      return diff;
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  }

  // ============ Repository Management ============

  async getRepository(
    projectKey: string,
    repoSlug: string
  ): Promise<ApiResponse<Repository>> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}`;
      const response = await this.client.get<Repository>(url);
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // ============ Pull Request Management ============

  async createPullRequest(
    projectKey: string,
    repoSlug: string,
    title: string,
    description: string,
    sourceBranch: string,
    targetBranch: string,
    sourceRepoSlug?: string,
    reviewers?: string[]
  ): Promise<ApiResponse<PullRequest>> {
    try {
      const payload: any = {
        title,
        description,
        state: 'OPEN',
        open: true,
        closed: false,
        fromRef: {
          id: `refs/heads/${sourceBranch}`,
          repository: sourceRepoSlug
            ? {
                slug: sourceRepoSlug,
                project: { key: projectKey },
              }
            : undefined,
        },
        toRef: {
          id: `refs/heads/${targetBranch}`,
          repository: {
            slug: repoSlug,
            project: { key: projectKey },
          },
        },
        reviewers: reviewers?.map((username) => ({
          user: { name: username },
        })),
      };

      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`;
      const response = await this.client.post<PullRequest>(url, payload);
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getPullRequest(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<ApiResponse<PullRequest>> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`;
      const response = await this.client.get<PullRequest>(url);
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async updatePullRequest(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    version: number,
    title?: string,
    description?: string
  ): Promise<ApiResponse<PullRequest>> {
    try {
      const payload: any = {
        version,
      };
      if (title !== undefined) payload.title = title;
      if (description !== undefined) payload.description = description;

      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`;
      const response = await this.client.put<PullRequest>(url, payload);
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async approvePullRequest(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<ApiResponse<Participant>> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/approve`;
      const response = await this.client.post<Participant>(url, {});
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async unapprovePullRequest(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<ApiResponse<Participant>> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/approve`;
      const response = await this.client.delete<Participant>(url);
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async declinePullRequest(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    version: number
  ): Promise<ApiResponse<PullRequest>> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/decline`;
      const response = await this.client.post<PullRequest>(url, { version });
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async mergePullRequest(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    version: number
  ): Promise<ApiResponse<PullRequest>> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/merge`;
      const response = await this.client.post<PullRequest>(url, { version });
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getPullRequestActivity(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    startIndex: number = 0,
    limit: number = 25
  ): Promise<ApiResponse<ActivitiesResponse>> {
    try {
      const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_ACTIVITIES_LIMIT);
      const url = this.buildUrl(
        '/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/pull-requests/{pullRequestId}/activities',
        { projectKey, repoSlug, pullRequestId }
      );
      const response = await this.client.get<ActivitiesResponse>(url, {
        params: { start: startIndex, limit: validatedLimit },
      });
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getPullRequestCommits(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    startIndex: number = 0,
    limit: number = 25
  ): Promise<ApiResponse<CommitsResponse>> {
    try {
      const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_COMMITS_LIMIT);
      const url = this.buildUrl(
        '/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/pull-requests/{pullRequestId}/commits',
        { projectKey, repoSlug, pullRequestId }
      );
      const response = await this.client.get<CommitsResponse>(url, {
        params: { start: startIndex, limit: validatedLimit },
      });
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getPullRequestPatch(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<string> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}.patch`;
      const patch = await this.client.getText(url);
      return patch;
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  }

  // ============ Comment Management ============

  async getPullRequestComments(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    startIndex: number = 0,
    limit: number = 25
  ): Promise<ApiResponse<CommentsResponse>> {
    try {
      const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_COMMENTS_LIMIT);

      // Get activities and filter for comments
      const url = this.buildUrl(
        '/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/pull-requests/{pullRequestId}/activities',
        { projectKey, repoSlug, pullRequestId }
      );
      const response = await this.client.get<ActivitiesResponse>(url, {
        params: { start: startIndex, limit: validatedLimit },
      });

      if (!response.values) {
        return { error: 'No activities found' };
      }

      // Filter activities to only include comments
      const comments: Comment[] = response.values
        .filter((activity: Activity) => activity.action === 'COMMENTED' && activity.comment)
        .map((activity: Activity) => activity.comment!);

      return {
        values: comments,
        size: comments.length,
        isLastPage: response.isLastPage,
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getPullRequestComment(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    commentId: number
  ): Promise<ApiResponse<Comment>> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments/${commentId}`;
      const response = await this.client.get<Comment>(url);
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async addPullRequestComment(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    text: string,
    parentId?: number,
    line?: number,
    filePath?: string,
    lineType?: 'ADDED' | 'REMOVED' | 'CONTEXT',
    fromHash?: string,
    toHash?: string,
    severity?: 'NORMAL' | 'BLOCKER'
  ): Promise<ApiResponse<Comment>> {
    try {
      const payload: any = { text };

      if (parentId) {
        payload.parent = { id: parentId };
      }

      if (severity) {
        payload.severity = severity;
      }

      // Inline comment
      if (line !== undefined && filePath && fromHash && toHash) {
        payload.anchor = {
          diffType: 'EFFECTIVE',
          fromHash,
          toHash,
          line,
          lineType: lineType || 'CONTEXT',
          fileType: 'TO',
          path: filePath,
        };
      }

      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments`;
      const response = await this.client.post<Comment>(url, payload);
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async updatePullRequestComment(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    commentId: number,
    text: string,
    version: number,
    severity?: 'NORMAL' | 'BLOCKER',
    state?: 'OPEN' | 'RESOLVED'
  ): Promise<ApiResponse<Comment>> {
    try {
      const payload: any = { text, version };
      if (severity !== undefined) {
        payload.severity = severity;
      }
      if (state !== undefined) {
        payload.state = state;
      }
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments/${commentId}`;
      const response = await this.client.put<Comment>(url, payload);
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async deletePullRequestComment(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    commentId: number,
    version: number
  ): Promise<ApiResponse<void>> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments/${commentId}`;
      await this.client.delete<void>(url, { params: { version } });
      return { success: true } as any;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // ============ Task Management ============

  async getPullRequestTasks(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<ApiResponse<TasksResponse>> {
    try {
      // Bitbucket Server 7.0+ uses blocker comments as tasks
      // Try the modern blocker-comments endpoint first (8.9 current version)
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/blocker-comments`;
      const response = await this.client.get<any>(url);

      // Convert blocker comments to task format
      if (response.values && Array.isArray(response.values)) {
        const tasks = response.values.map((comment: any) => ({
          id: comment.id,
          text: comment.text,
          state: comment.state, // 'OPEN' or 'RESOLVED'
          author: comment.author,
          createdDate: comment.createdDate,
          updatedDate: comment.updatedDate,
          severity: comment.severity, // 'BLOCKER'
          anchor: {
            id: pullRequestId,
            type: 'PULL_REQUEST',
          },
        }));

        return {
          values: tasks,
          size: response.size,
          isLastPage: response.isLastPage,
        } as TasksResponse;
      }

      return response;
    } catch (error) {
      // If blocker-comments endpoint fails, try legacy task API or alternative method
      return this.getPullRequestTasksLegacy(projectKey, repoSlug, pullRequestId);
    }
  }

  /**
   * Legacy method for older Bitbucket versions or fallback
   */
  private async getPullRequestTasksLegacy(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<ApiResponse<TasksResponse>> {
    try {
      // Try old tasks endpoint (pre-7.0)
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/tasks`;
      const response = await this.client.get<TasksResponse>(url);
      return response;
    } catch (error) {
      // If all APIs fail, use alternative method
      return this.getPullRequestTasksAlternative(projectKey, repoSlug, pullRequestId);
    }
  }

  /**
   * Alternative method to extract task-like information from PR
   * when native Task API is not available
   */
  private async getPullRequestTasksAlternative(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<ApiResponse<TasksResponse>> {
    try {
      // Get PR details to extract pseudo-tasks
      const pr = await this.getPullRequest(projectKey, repoSlug, pullRequestId);
      if ('error' in pr) {
        return { error: pr.error };
      }

      const tasks: any[] = [];

      // Method 1: Extract pending reviewer approvals as tasks
      const unapprovedReviewers = pr.reviewers?.filter(
        (r: any) => r.status !== 'APPROVED'
      ) || [];

      if (unapprovedReviewers.length > 0) {
        unapprovedReviewers.forEach((reviewer: any, idx: number) => {
          tasks.push({
            id: -(idx + 1), // Negative IDs to distinguish from real tasks
            text: `Get approval from ${reviewer.user?.displayName || reviewer.user?.name}`,
            state: 'OPEN' as const,
            author: {
              name: 'system',
              displayName: 'System Generated',
            },
            anchor: {
              id: pullRequestId,
              type: 'PULL_REQUEST',
            },
          });
        });
      }

      // Method 2: Extract markdown task lists from PR description
      if (pr.description) {
        const taskPattern = /^[-*]\s+\[([ xX])\]\s+(.+)$/gm;
        let match;
        let taskId = -(unapprovedReviewers.length + 1);

        while ((match = taskPattern.exec(pr.description)) !== null) {
          tasks.push({
            id: taskId--,
            text: match[2].trim(),
            state: match[1].toLowerCase() === 'x' ? ('RESOLVED' as const) : ('OPEN' as const),
            author: {
              name: pr.author?.user?.name || 'unknown',
              displayName: pr.author?.user?.displayName || 'Unknown',
            },
            anchor: {
              id: pullRequestId,
              type: 'PULL_REQUEST',
            },
          });
        }
      }

      return {
        values: tasks,
        size: tasks.length,
        isLastPage: true,
      } as TasksResponse;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async createPullRequestTask(
    projectKey: string,
    repoSlug: string,
    pullRequestId: number,
    text: string,
    _commentId?: number
  ): Promise<ApiResponse<Task>> {
    try {
      const payload = {
        anchor: { id: pullRequestId, type: 'PULL_REQUEST' as const },
        text,
      };
      return await this.client.post<Task>('/rest/api/1.0/tasks', payload);
    } catch (error) {
      // Fallback: Bitbucket 7.0+ uses BLOCKER comments as tasks
      const comment = await this.addPullRequestComment(
        projectKey,
        repoSlug,
        pullRequestId,
        text,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'BLOCKER'
      );

      if ('error' in comment) {
        return { error: `Failed to create task: ${comment.error}` };
      }

      return this.commentToTask(comment, pullRequestId, 'OPEN');
    }
  }

  async getPullRequestTask(
    taskId: number,
    projectKey: string,
    repoSlug: string,
    pullRequestId: number
  ): Promise<ApiResponse<Task>> {
    try {
      const url = `/rest/api/1.0/tasks/${taskId}`;
      const response = await this.client.get<Task>(url);
      return response;
    } catch (error) {
      // Fallback: Bitbucket 7.0+ uses BLOCKER comments as tasks
      const comment = await this.getPullRequestComment(projectKey, repoSlug, pullRequestId, taskId);
      if ('error' in comment) {
        return { error: `Task not found: ${comment.error}` };
      }

      // Determine task state from comment's tasks array if available
      const taskState = comment.tasks && comment.tasks.length > 0
        ? comment.tasks[0].state
        : 'OPEN';

      return this.commentToTask(comment, pullRequestId, taskState);
    }
  }

  async updatePullRequestTask(
    taskId: number,
    text?: string,
    state?: 'OPEN' | 'RESOLVED',
    projectKey?: string,
    repoSlug?: string,
    pullRequestId?: number
  ): Promise<ApiResponse<Task>> {
    try {
      const payload: any = {};
      if (text !== undefined) payload.text = text;
      if (state !== undefined) payload.state = state;

      return await this.client.put<Task>(`/rest/api/1.0/tasks/${taskId}`, payload);
    } catch (error) {
      // Fallback: Bitbucket 7.0+ uses BLOCKER comments as tasks
      if (!projectKey || !repoSlug || !pullRequestId) {
        return { error: 'Project key, repo slug, and PR ID required' };
      }

      const comment = await this.getPullRequestComment(projectKey, repoSlug, pullRequestId, taskId);
      if ('error' in comment) {
        return { error: `Task not found: ${comment.error}` };
      }

      const updatedComment = await this.updatePullRequestComment(
        projectKey,
        repoSlug,
        pullRequestId,
        taskId,
        text ?? comment.text ?? '',
        comment.version!,
        'BLOCKER', // Severity must remain BLOCKER for tasks
        state
      );

      if ('error' in updatedComment) {
        return { error: `Failed to update task: ${updatedComment.error}` };
      }

      return this.commentToTask(updatedComment, pullRequestId, state ?? 'OPEN');
    }
  }

  private commentToTask(comment: Comment, pullRequestId: number, state: 'OPEN' | 'RESOLVED'): Task {
    return {
      id: comment.id!,
      text: comment.text!,
      state,
      author: comment.author!,
      anchor: {
        id: pullRequestId,
        type: 'PULL_REQUEST',
      },
    } as Task;
  }

  async deletePullRequestTask(taskId: number): Promise<ApiResponse<void>> {
    try {
      const url = `/rest/api/1.0/tasks/${taskId}`;
      await this.client.delete<void>(url);
      return { success: true } as any;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // ============ Branch Model ============

  async getRepositoryBranchingModel(
    projectKey: string,
    repoSlug: string
  ): Promise<ApiResponse<BranchModel>> {
    try {
      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branchmodel/configuration`;
      const response = await this.client.get<BranchModel>(url);
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async updateRepositoryBranchingModelSettings(
    projectKey: string,
    repoSlug: string,
    development?: { refId?: string; useDefault: boolean },
    production?: { refId?: string; useDefault: boolean },
    types?: Array<{ id: string; displayName: string; prefix: string }>
  ): Promise<ApiResponse<BranchModel>> {
    try {
      const payload: any = {};
      if (development) payload.development = development;
      if (production) payload.production = production;
      if (types) payload.types = types;

      const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branchmodel/configuration`;
      const response = await this.client.put<BranchModel>(url, payload);
      return response;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // ============ Default Reviewers ============

  async getEffectiveDefaultReviewers(
    projectKey: string,
    repoSlug: string,
    _sourceRef?: string,
    _targetRef?: string
  ): Promise<ApiResponse<DefaultReviewersResponse>> {
    try {
      // Use /conditions endpoint instead of /reviewers
      // This endpoint returns all default reviewer conditions/rules for the repository
      // Note: sourceRef and targetRef parameters are not used by the /conditions endpoint
      const url = `/rest/default-reviewers/1.0/projects/${projectKey}/repos/${repoSlug}/conditions`;
      const response = await this.client.get<any>(url);

      // Response is an array of conditions
      if (Array.isArray(response)) {
        return { conditions: response };
      }
      return { conditions: [] };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // ============ Pending Review PRs ============

  async getPendingReviewPRs(
    projectKey: string,
    repoSlug?: string
  ): Promise<ApiResponse<PullRequest[]>> {
    try {
      // Get current user info (would need to be implemented)
      // For now, return all open PRs
      const url = repoSlug
        ? `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`
        : `/rest/api/1.0/projects/${projectKey}/repos`;

      if (repoSlug) {
        const response = await this.client.get<PullRequestsResponse>(url, {
          params: { state: 'OPEN' },
        });
        return response.values || [];
      } else {
        // Get all repos and then all PRs
        const reposResponse = await this.client.get<RepositoriesResponse>(
          `/rest/api/1.0/projects/${projectKey}/repos`
        );

        if (!reposResponse.values) {
          return [];
        }

        const allPRs: PullRequest[] = [];
        for (const repo of reposResponse.values) {
          const prsResponse = await this.client.get<PullRequestsResponse>(
            `/rest/api/1.0/projects/${projectKey}/repos/${repo.slug}/pull-requests`,
            { params: { state: 'OPEN', limit: 100 } }
          );
          if (prsResponse.values) {
            allPRs.push(...prsResponse.values);
          }
        }

        return allPRs;
      }
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}