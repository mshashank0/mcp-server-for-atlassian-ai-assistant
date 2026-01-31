import { PaginatedResponse } from '../shared/types.js';

// ============ Core Types ============

export interface Links {
  self: Array<{ href: string }>;
  clone?: Array<{ href: string; name: string }>;
}

export interface Project {
  id: number;
  key: string;
  name: string;
  description?: string;
  public: boolean;
  type: string;
  links: Links;
}

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

// ============ Repository Types ============

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

export interface RepositoriesResponse extends PaginatedResponse<Repository> {}

// ============ Commit Types ============

export interface Commit {
  id: string;
  displayId: string;
  message: string;
  author?: {
    name: string;
    emailAddress: string;
  };
  authorTimestamp?: number;
  committer?: {
    name: string;
    emailAddress: string;
  };
  committerTimestamp?: number;
  parents?: Array<{ id: string; displayId: string }>;
}

export interface CommitsResponse extends PaginatedResponse<Commit> {}

// ============ Pull Request Types ============

export interface RefObject {
  id: string;
  displayId: string;
  latestCommit: string;
  repository: Repository;
}

export interface Participant {
  user: User;
  role: 'AUTHOR' | 'REVIEWER' | 'PARTICIPANT';
  approved: boolean;
  status: 'UNAPPROVED' | 'NEEDS_WORK' | 'APPROVED';
  lastReviewedCommit?: string;
}

export interface Reviewer extends Participant {
  role: 'REVIEWER';
}

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

export interface PullRequestsResponse extends PaginatedResponse<PullRequest> {}

// ============ Comment Types ============

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
  parent?: {
    id: number;
  };
}

export interface CommentsResponse extends PaginatedResponse<Comment> {}

// ============ Task Types ============

export interface Task {
  id: number;
  text: string;
  state: 'OPEN' | 'RESOLVED';
  author: User;
  createdDate: number;
  anchor?: {
    id: number;
    type: 'COMMENT' | 'PULL_REQUEST';
  };
  permittedOperations: {
    deletable: boolean;
    editable: boolean;
    transitionable: boolean;
  };
}

export interface TasksResponse extends PaginatedResponse<Task> {}

// ============ Activity Types ============

export interface Activity {
  id: number;
  createdDate: number;
  user: User;
  action:
    | 'COMMENTED'
    | 'OPENED'
    | 'UPDATED'
    | 'APPROVED'
    | 'UNAPPROVED'
    | 'DECLINED'
    | 'MERGED'
    | 'RESCOPED'
    | 'REVIEWED';
  commentAction?: 'ADDED' | 'UPDATED' | 'DELETED';
  comment?: Comment;
  commentAnchor?: CommentAnchor;
  diff?: any;
  commit?: Commit;
  addedReviewers?: User[];
  removedReviewers?: User[];
}

export interface ActivitiesResponse extends PaginatedResponse<Activity> {}

// ============ Branch Model Types ============

export interface BranchModelBranch {
  refId?: string;
  useDefault: boolean;
}

export interface BranchModelType {
  id: string;
  displayName: string;
  prefix: string;
}

export interface BranchModel {
  development: BranchModelBranch;
  production: BranchModelBranch;
  types: BranchModelType[];
}

// ============ Default Reviewer Types ============

export interface BranchMatcher {
  id: string;
  displayId: string;
  type: {
    id: string;
    name: string;
  };
}

export interface DefaultReviewer {
  id: number;
  user: User;
}

export interface DefaultReviewerCondition {
  id: number;
  sourceMatcher: BranchMatcher;
  targetMatcher: BranchMatcher;
  reviewers: DefaultReviewer[];
  requiredApprovals: number;
}

export interface DefaultReviewersResponse {
  conditions: DefaultReviewerCondition[];
}

// ============ File Content Types ============

export interface FileContent {
  path: string;
  content: string;
  size: number;
  isLastPage: boolean;
}

// ============ Repository Structure Types ============

export interface RepoStructure {
  values?: string[];
  size?: number;
  isLastPage?: boolean;
}

// ============ Error Types ============

export interface BitbucketError {
  context?: string;
  message: string;
  exceptionName?: string;
  errors?: Array<{
    context?: string;
    message: string;
    exceptionName?: string;
  }>;
}
