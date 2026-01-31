import { HttpClient } from '../shared/http-client.js';
import { getBitbucketConfig } from '../shared/config.js';
export class BitbucketService {
    client;
    // API Limits
    static MAX_REPOS_LIMIT = 100;
    static MAX_COMMITS_LIMIT = 30;
    static MAX_PRS_LIMIT = 30;
    static MAX_ACTIVITIES_LIMIT = 100;
    static MAX_COMMENTS_LIMIT = 100;
    constructor() {
        const config = getBitbucketConfig();
        this.client = new HttpClient(config.baseUrl, config.apiToken);
    }
    /**
     * Validate and cap limit to maximum allowed value
     */
    validateLimit(limit, maxLimit) {
        return Math.min(limit, maxLimit);
    }
    /**
     * Build URL with properly encoded path parameters
     * Handles special characters like ~ in personal repositories
     */
    buildUrl(template, params) {
        return template.replace(/\{(\w+)\}/g, (_, key) => {
            const value = params[key];
            return value !== undefined ? encodeURIComponent(String(value)) : '';
        });
    }
    async getRepos(projectKey, startIndex = 0, limit = 100) {
        try {
            const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_REPOS_LIMIT);
            const url = this.buildUrl('/rest/api/1.0/projects/{projectKey}/repos', { projectKey });
            const response = await this.client.get(url, {
                params: { start: startIndex, limit: validatedLimit },
            });
            if (response.values) {
                // Extract only slug and name for each repository
                const filteredRepos = response.values.map((repo) => ({
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
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getCommits(projectKey, repoSlug, branchName, startIndex = 0, limit = 30) {
        try {
            const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_COMMITS_LIMIT);
            const url = this.buildUrl('/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/commits', {
                projectKey,
                repoSlug,
            });
            const response = await this.client.get(url, {
                params: { start: startIndex, limit: validatedLimit, until: branchName },
            });
            if (response.values) {
                const filteredCommits = response.values.map((commit) => ({
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
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getPullRequests(projectKey, repoSlug, startIndex = 0, limit = 30) {
        try {
            const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_PRS_LIMIT);
            const url = this.buildUrl('/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/pull-requests', {
                projectKey,
                repoSlug,
            });
            const response = await this.client.get(url, {
                params: { start: startIndex, limit: validatedLimit, state: 'OPEN' },
            });
            if (response.values) {
                const filteredPullRequests = response.values.map((pr) => {
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
                        reviewers: (pr.reviewers || []).map((r) => ({
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
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getFileContent(projectKey, repoSlug, filePath) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/browse/${filePath}`;
            const response = await this.client.get(url);
            if (response.lines) {
                const content = response.lines.map((line) => line.text || '').join('\n');
                return {
                    path: filePath,
                    content,
                    size: response.size || 0,
                    isLastPage: response.isLastPage !== false,
                };
            }
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getRepoStructure(projectKey, repoSlug, path = '', maxDepth = 10) {
        try {
            // For safety
            if (maxDepth > 10) {
                maxDepth = 10;
            }
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/files/${path}`;
            const response = await this.client.get(url, {
                params: {
                    limit: 100,
                    max_depth: maxDepth,
                },
            });
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getPullRequestDiff(projectKey, repoSlug, pullRequestId) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/diff`;
            const diff = await this.client.getText(url);
            return diff;
        }
        catch (error) {
            return `Error: ${error.message}`;
        }
    }
    // ============ Repository Management ============
    async getRepository(projectKey, repoSlug) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}`;
            const response = await this.client.get(url);
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    // ============ Pull Request Management ============
    async createPullRequest(projectKey, repoSlug, title, description, sourceBranch, targetBranch, sourceRepoSlug, reviewers) {
        try {
            const payload = {
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
            const response = await this.client.post(url, payload);
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getPullRequest(projectKey, repoSlug, pullRequestId) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`;
            const response = await this.client.get(url);
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async updatePullRequest(projectKey, repoSlug, pullRequestId, version, title, description) {
        try {
            const payload = {
                version,
            };
            if (title !== undefined)
                payload.title = title;
            if (description !== undefined)
                payload.description = description;
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}`;
            const response = await this.client.put(url, payload);
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async approvePullRequest(projectKey, repoSlug, pullRequestId) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/approve`;
            const response = await this.client.post(url, {});
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async unapprovePullRequest(projectKey, repoSlug, pullRequestId) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/approve`;
            const response = await this.client.delete(url);
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async declinePullRequest(projectKey, repoSlug, pullRequestId, version) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/decline`;
            const response = await this.client.post(url, { version });
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async mergePullRequest(projectKey, repoSlug, pullRequestId, version) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/merge`;
            const response = await this.client.post(url, { version });
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getPullRequestActivity(projectKey, repoSlug, pullRequestId, startIndex = 0, limit = 25) {
        try {
            const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_ACTIVITIES_LIMIT);
            const url = this.buildUrl('/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/pull-requests/{pullRequestId}/activities', { projectKey, repoSlug, pullRequestId });
            const response = await this.client.get(url, {
                params: { start: startIndex, limit: validatedLimit },
            });
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getPullRequestCommits(projectKey, repoSlug, pullRequestId, startIndex = 0, limit = 25) {
        try {
            const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_COMMITS_LIMIT);
            const url = this.buildUrl('/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/pull-requests/{pullRequestId}/commits', { projectKey, repoSlug, pullRequestId });
            const response = await this.client.get(url, {
                params: { start: startIndex, limit: validatedLimit },
            });
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getPullRequestPatch(projectKey, repoSlug, pullRequestId) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}.patch`;
            const patch = await this.client.getText(url);
            return patch;
        }
        catch (error) {
            return `Error: ${error.message}`;
        }
    }
    // ============ Comment Management ============
    async getPullRequestComments(projectKey, repoSlug, pullRequestId, startIndex = 0, limit = 25) {
        try {
            const validatedLimit = this.validateLimit(limit, BitbucketService.MAX_COMMENTS_LIMIT);
            // Get activities and filter for comments
            const url = this.buildUrl('/rest/api/1.0/projects/{projectKey}/repos/{repoSlug}/pull-requests/{pullRequestId}/activities', { projectKey, repoSlug, pullRequestId });
            const response = await this.client.get(url, {
                params: { start: startIndex, limit: validatedLimit },
            });
            if (!response.values) {
                return { error: 'No activities found' };
            }
            // Filter activities to only include comments
            const comments = response.values
                .filter((activity) => activity.action === 'COMMENTED' && activity.comment)
                .map((activity) => activity.comment);
            return {
                values: comments,
                size: comments.length,
                isLastPage: response.isLastPage,
            };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getPullRequestComment(projectKey, repoSlug, pullRequestId, commentId) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments/${commentId}`;
            const response = await this.client.get(url);
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async addPullRequestComment(projectKey, repoSlug, pullRequestId, text, parentId, line, filePath, lineType, fromHash, toHash, severity) {
        try {
            const payload = { text };
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
            const response = await this.client.post(url, payload);
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async updatePullRequestComment(projectKey, repoSlug, pullRequestId, commentId, text, version, severity, state) {
        try {
            const payload = { text, version };
            if (severity !== undefined) {
                payload.severity = severity;
            }
            if (state !== undefined) {
                payload.state = state;
            }
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments/${commentId}`;
            const response = await this.client.put(url, payload);
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async deletePullRequestComment(projectKey, repoSlug, pullRequestId, commentId, version) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/comments/${commentId}`;
            await this.client.delete(url, { params: { version } });
            return { success: true };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    // ============ Task Management ============
    async getPullRequestTasks(projectKey, repoSlug, pullRequestId) {
        try {
            // Bitbucket Server 7.0+ uses blocker comments as tasks
            // Try the modern blocker-comments endpoint first (8.9 current version)
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/blocker-comments`;
            const response = await this.client.get(url);
            // Convert blocker comments to task format
            if (response.values && Array.isArray(response.values)) {
                const tasks = response.values.map((comment) => ({
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
                };
            }
            return response;
        }
        catch (error) {
            // If blocker-comments endpoint fails, try legacy task API or alternative method
            return this.getPullRequestTasksLegacy(projectKey, repoSlug, pullRequestId);
        }
    }
    /**
     * Legacy method for older Bitbucket versions or fallback
     */
    async getPullRequestTasksLegacy(projectKey, repoSlug, pullRequestId) {
        try {
            // Try old tasks endpoint (pre-7.0)
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${pullRequestId}/tasks`;
            const response = await this.client.get(url);
            return response;
        }
        catch (error) {
            // If all APIs fail, use alternative method
            return this.getPullRequestTasksAlternative(projectKey, repoSlug, pullRequestId);
        }
    }
    /**
     * Alternative method to extract task-like information from PR
     * when native Task API is not available
     */
    async getPullRequestTasksAlternative(projectKey, repoSlug, pullRequestId) {
        try {
            // Get PR details to extract pseudo-tasks
            const pr = await this.getPullRequest(projectKey, repoSlug, pullRequestId);
            if ('error' in pr) {
                return { error: pr.error };
            }
            const tasks = [];
            // Method 1: Extract pending reviewer approvals as tasks
            const unapprovedReviewers = pr.reviewers?.filter((r) => r.status !== 'APPROVED') || [];
            if (unapprovedReviewers.length > 0) {
                unapprovedReviewers.forEach((reviewer, idx) => {
                    tasks.push({
                        id: -(idx + 1), // Negative IDs to distinguish from real tasks
                        text: `Get approval from ${reviewer.user?.displayName || reviewer.user?.name}`,
                        state: 'OPEN',
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
                        state: match[1].toLowerCase() === 'x' ? 'RESOLVED' : 'OPEN',
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
            };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async createPullRequestTask(projectKey, repoSlug, pullRequestId, text, _commentId) {
        try {
            const payload = {
                anchor: { id: pullRequestId, type: 'PULL_REQUEST' },
                text,
            };
            return await this.client.post('/rest/api/1.0/tasks', payload);
        }
        catch (error) {
            // Fallback: Bitbucket 7.0+ uses BLOCKER comments as tasks
            const comment = await this.addPullRequestComment(projectKey, repoSlug, pullRequestId, text, undefined, undefined, undefined, undefined, undefined, undefined, 'BLOCKER');
            if ('error' in comment) {
                return { error: `Failed to create task: ${comment.error}` };
            }
            return this.commentToTask(comment, pullRequestId, 'OPEN');
        }
    }
    async getPullRequestTask(taskId, projectKey, repoSlug, pullRequestId) {
        try {
            const url = `/rest/api/1.0/tasks/${taskId}`;
            const response = await this.client.get(url);
            return response;
        }
        catch (error) {
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
    async updatePullRequestTask(taskId, text, state, projectKey, repoSlug, pullRequestId) {
        try {
            const payload = {};
            if (text !== undefined)
                payload.text = text;
            if (state !== undefined)
                payload.state = state;
            return await this.client.put(`/rest/api/1.0/tasks/${taskId}`, payload);
        }
        catch (error) {
            // Fallback: Bitbucket 7.0+ uses BLOCKER comments as tasks
            if (!projectKey || !repoSlug || !pullRequestId) {
                return { error: 'Project key, repo slug, and PR ID required' };
            }
            const comment = await this.getPullRequestComment(projectKey, repoSlug, pullRequestId, taskId);
            if ('error' in comment) {
                return { error: `Task not found: ${comment.error}` };
            }
            const updatedComment = await this.updatePullRequestComment(projectKey, repoSlug, pullRequestId, taskId, text ?? comment.text ?? '', comment.version, 'BLOCKER', // Severity must remain BLOCKER for tasks
            state);
            if ('error' in updatedComment) {
                return { error: `Failed to update task: ${updatedComment.error}` };
            }
            return this.commentToTask(updatedComment, pullRequestId, state ?? 'OPEN');
        }
    }
    commentToTask(comment, pullRequestId, state) {
        return {
            id: comment.id,
            text: comment.text,
            state,
            author: comment.author,
            anchor: {
                id: pullRequestId,
                type: 'PULL_REQUEST',
            },
        };
    }
    async deletePullRequestTask(taskId) {
        try {
            const url = `/rest/api/1.0/tasks/${taskId}`;
            await this.client.delete(url);
            return { success: true };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    // ============ Branch Model ============
    async getRepositoryBranchingModel(projectKey, repoSlug) {
        try {
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branchmodel/configuration`;
            const response = await this.client.get(url);
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async updateRepositoryBranchingModelSettings(projectKey, repoSlug, development, production, types) {
        try {
            const payload = {};
            if (development)
                payload.development = development;
            if (production)
                payload.production = production;
            if (types)
                payload.types = types;
            const url = `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branchmodel/configuration`;
            const response = await this.client.put(url, payload);
            return response;
        }
        catch (error) {
            return { error: error.message };
        }
    }
    // ============ Default Reviewers ============
    async getEffectiveDefaultReviewers(projectKey, repoSlug, _sourceRef, _targetRef) {
        try {
            // Use /conditions endpoint instead of /reviewers
            // This endpoint returns all default reviewer conditions/rules for the repository
            // Note: sourceRef and targetRef parameters are not used by the /conditions endpoint
            const url = `/rest/default-reviewers/1.0/projects/${projectKey}/repos/${repoSlug}/conditions`;
            const response = await this.client.get(url);
            // Response is an array of conditions
            if (Array.isArray(response)) {
                return { conditions: response };
            }
            return { conditions: [] };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    // ============ Pending Review PRs ============
    async getPendingReviewPRs(projectKey, repoSlug) {
        try {
            // Get current user info (would need to be implemented)
            // For now, return all open PRs
            const url = repoSlug
                ? `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests`
                : `/rest/api/1.0/projects/${projectKey}/repos`;
            if (repoSlug) {
                const response = await this.client.get(url, {
                    params: { state: 'OPEN' },
                });
                return response.values || [];
            }
            else {
                // Get all repos and then all PRs
                const reposResponse = await this.client.get(`/rest/api/1.0/projects/${projectKey}/repos`);
                if (!reposResponse.values) {
                    return [];
                }
                const allPRs = [];
                for (const repo of reposResponse.values) {
                    const prsResponse = await this.client.get(`/rest/api/1.0/projects/${projectKey}/repos/${repo.slug}/pull-requests`, { params: { state: 'OPEN', limit: 100 } });
                    if (prsResponse.values) {
                        allPRs.push(...prsResponse.values);
                    }
                }
                return allPRs;
            }
        }
        catch (error) {
            return { error: error.message };
        }
    }
}
//# sourceMappingURL=service.js.map