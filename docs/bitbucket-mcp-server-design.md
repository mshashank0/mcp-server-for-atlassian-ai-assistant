# Bitbucket MCP Server 設計書

## 概要

Bitbucket Server (Data Center) REST API 1.0を使用したModel Context Protocol (MCP) サーバーの実装設計書です。

### 目的

- Bitbucket Serverのリポジトリ、プルリクエスト、コメント、タスクなどの操作をMCP経由で提供
- 型安全性とエラーハンドリングを備えた堅牢な実装
- 危険な操作（削除、マージなど）に対する保護機能
- ページネーション、ロギング、設定のカスタマイズ性

### 参照実装との違い

参照実装（src/referer/bitbucket）はBitbucket Cloud API 2.0をターゲットとしていますが、本実装はBitbucket Server API 1.0を使用します。

**主な違い**:
- **API Base**: Cloud `/2.0/` → Server `/rest/api/1.0/`
- **パラメータ**: `workspace` → `project_key`
- **ページネーション**: `pagelen/page/next` → `start/limit/nextPageStart`
- **非対応機能**: Pipelines (8ツール), Draft PRs (3ツール), Pending Comments (2ツール)等

## アーキテクチャ

### ファイル構成

```
src/bitbucket/
├── index.ts        # MCP server setup, tool registration, logging
├── service.ts      # Business logic, API calls
├── types.ts        # TypeScript type definitions
└── pagination.ts   # Pagination helper for Server API
```

### レイヤー構造

1. **MCP Layer** (index.ts)
   - Tool定義とスキーマ
   - リクエストハンドリング
   - エラーハンドリングとロギング
   - 危険なコマンド保護

2. **Service Layer** (service.ts)
   - API呼び出し
   - レスポンス変換
   - ビジネスロジック

3. **Type Layer** (types.ts)
   - Server API型定義
   - 共通インターフェース

4. **Utility Layer** (pagination.ts)
   - ページネーション処理
   - "fetch all" 機能

## 実装ツール一覧（31ツール）

### 1. リポジトリ管理（2ツール）

#### 1.1 bitbucket_list_repositories
リポジトリ一覧を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `start` (number, optional): 開始位置（デフォルト: 0）
- `limit` (number, optional): 取得数（デフォルト: 25, 最大: 100）
- `all` (boolean, optional): 全件取得フラグ

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos`

**レスポンス**: Repository[]

#### 1.2 bitbucket_get_repository
特定リポジトリの詳細を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}`

**レスポンス**: Repository

### 2. Pull Request管理（11ツール）

#### 2.1 bitbucket_get_pull_requests
プルリクエスト一覧を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `state` (string, optional): 状態フィルタ（OPEN, MERGED, DECLINED, SUPERSEDED）
- `start` (number, optional): 開始位置
- `limit` (number, optional): 取得数

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests`

**レスポンス**: PullRequest[]

#### 2.2 bitbucket_create_pull_request
新規プルリクエストを作成

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `title` (string, required): PRタイトル
- `description` (string, optional): PR説明
- `source_branch` (string, required): ソースブランチ名
- `target_branch` (string, required): ターゲットブランチ名
- `source_repo_slug` (string, optional): ソースリポジトリスラグ（フォークPR用）
- `reviewers` (string[], optional): レビュアーのユーザー名配列

**API Endpoint**: `POST /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests`

**ペイロード構造**:
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

**レスポンス**: PullRequest

#### 2.3 bitbucket_get_pull_request
特定プルリクエストの詳細を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}`

**レスポンス**: PullRequest

#### 2.4 bitbucket_update_pull_request
プルリクエストのタイトル・説明を更新

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `version` (number, required): PRバージョン（楽観的ロック用）
- `title` (string, optional): 新しいタイトル
- `description` (string, optional): 新しい説明

**API Endpoint**: `PUT /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}`

**レスポンス**: PullRequest

#### 2.5 bitbucket_approve_pull_request
プルリクエストを承認

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID

**API Endpoint**: `POST /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/approve`

**レスポンス**: Participant

#### 2.6 bitbucket_unapprove_pull_request
プルリクエストの承認を取り消し

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID

**API Endpoint**: `DELETE /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/approve`

**レスポンス**: Participant

#### 2.7 bitbucket_decline_pull_request ⚠️ DANGEROUS
プルリクエストを却下

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `version` (number, required): PRバージョン

**API Endpoint**: `POST /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/decline`

**注意**: `BITBUCKET_ENABLE_DANGEROUS=true` が必要

**レスポンス**: PullRequest

#### 2.8 bitbucket_merge_pull_request ⚠️ DANGEROUS
プルリクエストをマージ

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `version` (number, required): PRバージョン

**API Endpoint**: `POST /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/merge`

**注意**: `BITBUCKET_ENABLE_DANGEROUS=true` が必要

**レスポンス**: PullRequest

#### 2.9 bitbucket_get_pull_request_activity
プルリクエストのアクティビティログを取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `start` (number, optional): 開始位置
- `limit` (number, optional): 取得数

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/activities`

**レスポンス**: Activity[]

#### 2.10 bitbucket_get_pull_request_commits
プルリクエストのコミット一覧を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `start` (number, optional): 開始位置
- `limit` (number, optional): 取得数

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/commits`

**レスポンス**: Commit[]

#### 2.11 bitbucket_get_pull_request_diff
プルリクエストのdiffを取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/diff`

**レスポンス**: string (diff text)

### 3. PR詳細（1ツール）

#### 3.1 bitbucket_get_pull_request_patch
プルリクエストのpatchファイルを取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}.patch`

**レスポンス**: string (patch text)

### 4. コメント管理（5ツール）

#### 4.1 bitbucket_get_pull_request_comments
プルリクエストのコメント一覧を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `start` (number, optional): 開始位置
- `limit` (number, optional): 取得数

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/activities`

**注意**: アクティビティからコメントをフィルタリング（action === 'COMMENTED'）

**レスポンス**: Comment[]

#### 4.2 bitbucket_get_pull_request_comment
特定コメントの詳細を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `comment_id` (number, required): コメントID

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/comments/{commentId}`

**レスポンス**: Comment

#### 4.3 bitbucket_add_pull_request_comment
プルリクエストにコメントを追加

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `text` (string, required): コメント本文
- `parent_id` (number, optional): 親コメントID（返信の場合）
- `line` (number, optional): 行番号（インラインコメント用）
- `file_path` (string, optional): ファイルパス（インラインコメント用）
- `line_type` (string, optional): 行タイプ（ADDED, REMOVED, CONTEXT）
- `from_hash` (string, optional): ソースコミットハッシュ
- `to_hash` (string, optional): ターゲットコミットハッシュ

**API Endpoint**: `POST /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/comments`

**ペイロード構造（一般コメント）**:
```json
{
  "text": "Comment text",
  "parent": { "id": 123 }
}
```

**ペイロード構造（インラインコメント）**:
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

**レスポンス**: Comment

#### 4.4 bitbucket_update_pull_request_comment
コメントを更新

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `comment_id` (number, required): コメントID
- `text` (string, required): 新しいコメント本文
- `version` (number, required): コメントバージョン

**API Endpoint**: `PUT /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/comments/{commentId}`

**レスポンス**: Comment

#### 4.5 bitbucket_delete_pull_request_comment ⚠️ DANGEROUS
コメントを削除

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `comment_id` (number, required): コメントID
- `version` (number, required): コメントバージョン

**API Endpoint**: `DELETE /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/comments/{commentId}`

**注意**: `BITBUCKET_ENABLE_DANGEROUS=true` が必要

**レスポンス**: 成功時は空

### 5. タスク管理（5ツール）

#### 5.1 bitbucket_get_pull_request_tasks
プルリクエストのタスク一覧を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{id}/tasks`

**レスポンス**: Task[]

#### 5.2 bitbucket_create_pull_request_task
タスクを作成

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `pull_request_id` (number, required): プルリクエストID
- `text` (string, required): タスク内容
- `comment_id` (number, optional): 紐づけるコメントID

**API Endpoint**: `POST /rest/api/1.0/tasks`

**ペイロード構造**:
```json
{
  "anchor": {
    "id": 123,  // comment or PR id
    "type": "COMMENT"  // or "PULL_REQUEST"
  },
  "text": "Task description"
}
```

**レスポンス**: Task

#### 5.3 bitbucket_get_pull_request_task
特定タスクの詳細を取得

**パラメータ**:
- `task_id` (number, required): タスクID

**API Endpoint**: `GET /rest/api/1.0/tasks/{taskId}`

**レスポンス**: Task

#### 5.4 bitbucket_update_pull_request_task
タスクを更新

**パラメータ**:
- `task_id` (number, required): タスクID
- `text` (string, optional): 新しいタスク内容
- `state` (string, optional): 新しい状態（OPEN, RESOLVED）

**API Endpoint**: `PUT /rest/api/1.0/tasks/{taskId}`

**レスポンス**: Task

#### 5.5 bitbucket_delete_pull_request_task ⚠️ DANGEROUS
タスクを削除

**パラメータ**:
- `task_id` (number, required): タスクID

**API Endpoint**: `DELETE /rest/api/1.0/tasks/{taskId}`

**注意**: `BITBUCKET_ENABLE_DANGEROUS=true` が必要

**レスポンス**: 成功時は空

### 6. その他（7ツール）

#### 6.1 bitbucket_get_commits
リポジトリのコミット一覧を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `branch_name` (string, optional): ブランチ名
- `start` (number, optional): 開始位置
- `limit` (number, optional): 取得数

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/commits`

**レスポンス**: Commit[]

#### 6.2 bitbucket_get_file_content
ファイルの内容を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `file_path` (string, required): ファイルパス

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/browse/{filePath}`

**レスポンス**: FileContent

#### 6.3 bitbucket_get_repo_structure
リポジトリ構造を取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `path` (string, optional): パス（デフォルト: ルート）
- `max_depth` (number, optional): 最大深度（デフォルト: 10）

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/files/{path}`

**レスポンス**: RepoStructure

#### 6.4 bitbucket_get_repository_branching_model
リポジトリのブランチモデルを取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ

**API Endpoint**: `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/branchmodel/configuration`

**レスポンス**: BranchModel

#### 6.5 bitbucket_update_repository_branching_model_settings
リポジトリのブランチモデル設定を更新

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `development` (object, optional): 開発ブランチ設定
  - `refId` (string): ブランチ参照ID
  - `useDefault` (boolean): デフォルト使用フラグ
- `production` (object, optional): プロダクションブランチ設定
- `types` (array, optional): ブランチタイプ配列

**API Endpoint**: `PUT /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/branchmodel/configuration`

**レスポンス**: BranchModel

#### 6.6 bitbucket_get_effective_default_reviewers
デフォルトレビュアーを取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, required): リポジトリスラグ
- `source_ref` (string, optional): ソース参照
- `target_ref` (string, optional): ターゲット参照

**API Endpoint**: `GET /rest/default-reviewers/1.0/projects/{project_key}/repos/{repo_slug}/reviewers`

**注意**: `/rest/api/1.0/` ではなく `/rest/default-reviewers/1.0/` を使用

**レスポンス**: DefaultReviewerCondition[]

#### 6.7 bitbucket_get_pending_review_prs
レビュー待ちのプルリクエストを取得

**パラメータ**:
- `project_key` (string, required): プロジェクトキー
- `repo_slug` (string, optional): リポジトリスラグ（指定時はそのリポジトリのみ）

**実装**: クライアント側フィルタリング
1. `GET /rest/api/1.0/projects/{project_key}/repos` で全リポジトリ取得
2. 各リポジトリで `GET /rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests?state=OPEN`
3. 現在のユーザーがreviewerで、まだapproveしていないPRをフィルタ

**レスポンス**: PullRequest[]

## サポートされないツール（18ツール）

### Bitbucket Pipelines（8ツール）

Bitbucket ServerはPipelinesをサポートしていません。Jenkins、Bamboo等の外部CI/CDツールを使用してください。

- `listPipelineRuns` - Jenkins/Bamboo REST APIを使用
- `getPipelineRun` - Jenkins/Bamboo REST APIを使用
- `runPipeline` - Jenkins/Bamboo REST APIを使用
- `stopPipeline` - Jenkins/Bamboo REST APIを使用
- `getPipelineSteps` - Jenkins/Bamboo REST APIを使用
- `getPipelineStep` - Jenkins/Bamboo REST APIを使用
- `getPipelineStepLogs` - Jenkins/Bamboo REST APIを使用

### Draft Pull Requests（3ツール）

Bitbucket Serverにはdraft PRの概念がありません。

- `createDraftPullRequest` → 通常のPRを作成してください
- `publishDraftPullRequest` → 利用不可
- `convertToDraft` → 利用不可

### Pending Comments（2ツール）

Bitbucket Serverではコメントは即座に公開されます。

- `addPendingPullRequestComment` → `addPullRequestComment`を使用（即座に公開）
- `publishPendingComments` → 利用不可

### Comment Resolution（2ツール）

Bitbucket Serverではコメント解決の代わりにタスクを使用します。

- `resolveComment` → タスクの状態を"RESOLVED"に更新
- `reopenComment` → タスクの状態を"OPEN"に更新

### その他（3ツール）

- `getPullRequestStatuses` - Build Status APIが異なる実装
- `getPullRequestDiffStat` - エンドポイントが存在しない
- Project-level Branching Models (3 tools) - Server APIは異なる実装

## 型定義

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

## 環境変数

### 必須

#### BITBUCKET_BASE_URL
Bitbucket ServerのベースURL

**例**: `https://bitbucket.yourcompany.com`

#### BITBUCKET_API_TOKEN
Personal Access Token

**取得方法**: Bitbucket Server → Profile → Manage account → Personal access tokens

### オプション

#### BITBUCKET_DEFAULT_PROJECT
デフォルトのプロジェクトキー。各ツールでproject_keyを省略した場合に使用。

**例**: `PROJ`

#### BITBUCKET_ENABLE_DANGEROUS
危険な操作を有効化するフラグ。

**有効な値**: `true`, `1`, `yes`, `on`

**対象ツール**:
- `deletePullRequestComment`
- `deletePullRequestTask`
- `declinePullRequest`
- `mergePullRequest`

#### BITBUCKET_LOG_FILE
ログファイルの絶対パス

**例**: `/var/log/bitbucket-mcp/bitbucket.log`

#### BITBUCKET_LOG_DIR
ログディレクトリのベースパス

**デフォルト**:
- **Windows**: `%LOCALAPPDATA%/bitbucket-mcp`
- **macOS**: `~/Library/Logs/bitbucket-mcp`
- **Linux**: `$XDG_STATE_HOME/bitbucket-mcp` または `~/.local/state/bitbucket-mcp`

#### BITBUCKET_LOG_DISABLE
ファイルロギングを無効化

**有効な値**: `true`, `1`, `yes`, `on`

#### BITBUCKET_LOG_PER_CWD
作業ディレクトリごとに別々のログファイルを作成

**有効な値**: `true`, `1`, `yes`, `on`

## ページネーション

### Server API のページネーション

Bitbucket Server APIは以下のページネーション方式を使用：

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

### パラメータ

- `start`: 開始位置（0ベース）
- `limit`: 1ページあたりの取得数（デフォルト: 25, 最大: 100）

### "all" オプション

`all=true` を指定すると、全件を自動取得（最大1000件）

**使用例**:
```json
{
  "project_key": "PROJ",
  "limit": 50,
  "all": true
}
```

### 実装詳細

`BitbucketPaginator` クラスが以下を処理：
- 単一ページ取得
- 複数ページ自動取得（all=true時）
- nextPageStartを使用した次ページ取得
- 最大件数上限（1000件）

## ロギング

### ログレベル

- `info`: ツール実行開始・終了
- `error`: エラー発生
- `debug`: API呼び出し詳細（実装予定）

### ログ形式

JSON形式でログ出力

```json
{
  "level": "info",
  "message": "Executing tool: bitbucket_create_pull_request",
  "timestamp": "2026-01-06T08:00:00.000Z",
  "args": {...}
}
```

### ログファイル

環境変数で制御可能：
- デフォルトロケーション: プラットフォーム依存
- カスタムパス: `BITBUCKET_LOG_FILE`
- 無効化: `BITBUCKET_LOG_DISABLE=true`
- 作業ディレクトリごと: `BITBUCKET_LOG_PER_CWD=true`

## エラーハンドリング

### McpError

すべてのエラーは `McpError` としてスロー

```typescript
throw new McpError(
  ErrorCode.InternalError,
  `Failed to execute ${toolName}: ${error.message}`
);
```

### エラーコード

- `ErrorCode.InvalidRequest`: パラメータエラー、危険な操作の実行試行
- `ErrorCode.InternalError`: API呼び出しエラー、予期しないエラー

### 危険な操作のエラー

```typescript
if (isDangerousTool(name) && !process.env.BITBUCKET_ENABLE_DANGEROUS) {
  throw new McpError(
    ErrorCode.InvalidRequest,
    `Tool ${name} is disabled. Set BITBUCKET_ENABLE_DANGEROUS=true to enable.`
  );
}
```

## セキュリティ考慮事項

### 危険な操作の保護

以下の操作はデフォルトで無効：
- `deletePullRequestComment`
- `deletePullRequestTask`
- `declinePullRequest`
- `mergePullRequest`
- すべての `delete*` で始まるツール

有効化するには: `BITBUCKET_ENABLE_DANGEROUS=true`

### 認証

Personal Access Token (PAT) をBearer Tokenとして使用

```
Authorization: Bearer {BITBUCKET_API_TOKEN}
```

### バージョン管理（楽観的ロック）

更新・削除操作には `version` パラメータが必要。並行編集を防止。

```typescript
await updatePullRequest(projectKey, repoSlug, prId, {
  title: "New title",
  version: 42  // 必須
});
```

## 使用例

### プルリクエストの作成

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

### インラインコメントの追加

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

### 全リポジトリの取得

```json
{
  "name": "bitbucket_list_repositories",
  "arguments": {
    "project_key": "PROJ",
    "all": true
  }
}
```

### タスクの作成と解決

```json
// タスク作成
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

// タスク解決
{
  "name": "bitbucket_update_pull_request_task",
  "arguments": {
    "task_id": 789,
    "state": "RESOLVED"
  }
}
```

### プルリクエストのマージ（危険な操作）

```bash
# 環境変数設定
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

## 参考資料

### Bitbucket Server REST API Documentation
- [REST API 1.0](https://docs.atlassian.com/bitbucket-server/rest/5.16.0/bitbucket-rest.html)
- [Default Reviewers API](https://docs.atlassian.com/bitbucket-server/rest/5.16.0/bitbucket-default-reviewers-rest.html)
- [Branch Model API](https://docs.atlassian.com/bitbucket-server/rest/7.0.0/bitbucket-branch-rest.html)

### 内部実装参照
- `src/referer/bitbucket/index.ts` - Bitbucket Cloud実装（参照用）
- `src/referer/bitbucket/pagination.ts` - Cloud APIページネーション（参照用）
- `src/shared/http-client.ts` - HTTPクライアント実装
- `src/shared/config.ts` - 設定管理

## 変更履歴

### 2026-01-06
- 初版作成
- 31ツールの設計完了
- 18の非対応ツールを文書化
