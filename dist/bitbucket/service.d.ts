import { ApiResponse } from '../shared/types.js';
import { Repository, RepositoriesResponse, CommitsResponse, PullRequest, PullRequestsResponse, FileContent, RepoStructure, Comment, CommentsResponse, ActivitiesResponse, Task, TasksResponse, BranchModel, DefaultReviewersResponse, Participant } from './types.js';
export declare class BitbucketService {
    private client;
    private static readonly MAX_REPOS_LIMIT;
    private static readonly MAX_COMMITS_LIMIT;
    private static readonly MAX_PRS_LIMIT;
    private static readonly MAX_ACTIVITIES_LIMIT;
    private static readonly MAX_COMMENTS_LIMIT;
    constructor();
    /**
     * Validate and cap limit to maximum allowed value
     */
    private validateLimit;
    /**
     * Build URL with properly encoded path parameters
     * Handles special characters like ~ in personal repositories
     */
    private buildUrl;
    getRepos(projectKey: string, startIndex?: number, limit?: number): Promise<ApiResponse<RepositoriesResponse>>;
    getCommits(projectKey: string, repoSlug: string, branchName: string, startIndex?: number, limit?: number): Promise<ApiResponse<CommitsResponse>>;
    getPullRequests(projectKey: string, repoSlug: string, startIndex?: number, limit?: number): Promise<ApiResponse<PullRequestsResponse>>;
    getFileContent(projectKey: string, repoSlug: string, filePath: string): Promise<ApiResponse<FileContent>>;
    getRepoStructure(projectKey: string, repoSlug: string, path?: string, maxDepth?: number): Promise<ApiResponse<RepoStructure>>;
    getPullRequestDiff(projectKey: string, repoSlug: string, pullRequestId: number): Promise<string>;
    getRepository(projectKey: string, repoSlug: string): Promise<ApiResponse<Repository>>;
    createPullRequest(projectKey: string, repoSlug: string, title: string, description: string, sourceBranch: string, targetBranch: string, sourceRepoSlug?: string, reviewers?: string[]): Promise<ApiResponse<PullRequest>>;
    getPullRequest(projectKey: string, repoSlug: string, pullRequestId: number): Promise<ApiResponse<PullRequest>>;
    updatePullRequest(projectKey: string, repoSlug: string, pullRequestId: number, version: number, title?: string, description?: string): Promise<ApiResponse<PullRequest>>;
    approvePullRequest(projectKey: string, repoSlug: string, pullRequestId: number): Promise<ApiResponse<Participant>>;
    unapprovePullRequest(projectKey: string, repoSlug: string, pullRequestId: number): Promise<ApiResponse<Participant>>;
    declinePullRequest(projectKey: string, repoSlug: string, pullRequestId: number, version: number): Promise<ApiResponse<PullRequest>>;
    mergePullRequest(projectKey: string, repoSlug: string, pullRequestId: number, version: number): Promise<ApiResponse<PullRequest>>;
    getPullRequestActivity(projectKey: string, repoSlug: string, pullRequestId: number, startIndex?: number, limit?: number): Promise<ApiResponse<ActivitiesResponse>>;
    getPullRequestCommits(projectKey: string, repoSlug: string, pullRequestId: number, startIndex?: number, limit?: number): Promise<ApiResponse<CommitsResponse>>;
    getPullRequestPatch(projectKey: string, repoSlug: string, pullRequestId: number): Promise<string>;
    getPullRequestComments(projectKey: string, repoSlug: string, pullRequestId: number, startIndex?: number, limit?: number): Promise<ApiResponse<CommentsResponse>>;
    getPullRequestComment(projectKey: string, repoSlug: string, pullRequestId: number, commentId: number): Promise<ApiResponse<Comment>>;
    addPullRequestComment(projectKey: string, repoSlug: string, pullRequestId: number, text: string, parentId?: number, line?: number, filePath?: string, lineType?: 'ADDED' | 'REMOVED' | 'CONTEXT', fromHash?: string, toHash?: string, severity?: 'NORMAL' | 'BLOCKER'): Promise<ApiResponse<Comment>>;
    updatePullRequestComment(projectKey: string, repoSlug: string, pullRequestId: number, commentId: number, text: string, version: number, severity?: 'NORMAL' | 'BLOCKER', state?: 'OPEN' | 'RESOLVED'): Promise<ApiResponse<Comment>>;
    deletePullRequestComment(projectKey: string, repoSlug: string, pullRequestId: number, commentId: number, version: number): Promise<ApiResponse<void>>;
    getPullRequestTasks(projectKey: string, repoSlug: string, pullRequestId: number): Promise<ApiResponse<TasksResponse>>;
    /**
     * Legacy method for older Bitbucket versions or fallback
     */
    private getPullRequestTasksLegacy;
    /**
     * Alternative method to extract task-like information from PR
     * when native Task API is not available
     */
    private getPullRequestTasksAlternative;
    createPullRequestTask(projectKey: string, repoSlug: string, pullRequestId: number, text: string, _commentId?: number): Promise<ApiResponse<Task>>;
    getPullRequestTask(taskId: number, projectKey: string, repoSlug: string, pullRequestId: number): Promise<ApiResponse<Task>>;
    updatePullRequestTask(taskId: number, text?: string, state?: 'OPEN' | 'RESOLVED', projectKey?: string, repoSlug?: string, pullRequestId?: number): Promise<ApiResponse<Task>>;
    private commentToTask;
    deletePullRequestTask(taskId: number): Promise<ApiResponse<void>>;
    getRepositoryBranchingModel(projectKey: string, repoSlug: string): Promise<ApiResponse<BranchModel>>;
    updateRepositoryBranchingModelSettings(projectKey: string, repoSlug: string, development?: {
        refId?: string;
        useDefault: boolean;
    }, production?: {
        refId?: string;
        useDefault: boolean;
    }, types?: Array<{
        id: string;
        displayName: string;
        prefix: string;
    }>): Promise<ApiResponse<BranchModel>>;
    getEffectiveDefaultReviewers(projectKey: string, repoSlug: string, _sourceRef?: string, _targetRef?: string): Promise<ApiResponse<DefaultReviewersResponse>>;
    getPendingReviewPRs(projectKey: string, repoSlug?: string): Promise<ApiResponse<PullRequest[]>>;
}
//# sourceMappingURL=service.d.ts.map