# Jira MCP Server 再設計書

## 概要

本文書は、`src/referer/jira`のPython実装を参照し、`src/jira`のTypeScript実装を全面的に刷新する設計書です。

## 目的

- Python実装の全機能をTypeScriptに移植する
- 既存のファイル構成とNode.js実行環境は維持する
- MCP Serverとしての機能を完全に置き換える
- **既存のツールは全て削除し、Python実装と完全に一致させる**

## Python実装の機能分析

### 1. issues.py (課題操作)
- `get_issue` - 課題の詳細取得 (expand, comment_limit, fields等の詳細オプション)
- `create_issue` - 課題の作成 (Epic対応、コンポーネント、カスタムフィールド対応)
- `update_issue` - 課題の更新 (ステータス変更、添付ファイル対応)
- `delete_issue` - 課題の削除
- `batch_create_issues` - 課題の一括作成
- `batch_get_changelogs` - 変更履歴の一括取得 (Cloud専用)

### 2. search.py (検索操作)
- `search_issues` - JQL検索 (Cloud v3 API対応、ページネーション)
- `get_board_issues` - ボード課題の取得
- `get_sprint_issues` - スプリント課題の取得

### 3. comments.py (コメント操作)
- `get_issue_comments` - コメント一覧の取得
- `add_comment` - コメントの追加 (Markdown対応)

### 4. projects.py (プロジェクト操作)
- `get_all_projects` - 全プロジェクトの取得
- `get_project` - プロジェクト詳細の取得
- `get_project_model` - プロジェクトモデルの取得
- `project_exists` - プロジェクトの存在確認
- `get_project_components` - コンポーネント一覧の取得
- `get_project_versions` - バージョン一覧の取得
- `get_project_roles` - ロール一覧の取得
- `get_project_role_members` - ロールメンバーの取得
- `get_project_permission_scheme` - 権限スキームの取得
- `get_project_notification_scheme` - 通知スキームの取得
- `get_project_issue_types` - 課題タイプ一覧の取得
- `get_project_issues_count` - 課題数の取得
- `get_project_issues` - プロジェクト課題の取得
- `create_project_version` - バージョンの作成

### 5. epics.py (Epic操作)
- `link_issue_to_epic` - 課題をEpicにリンク
- `get_epic_issues` - Epic配下の課題取得
- `prepare_epic_fields` - Epic作成時のフィールド準備 (内部メソッド)
- `update_epic_fields` - Epic固有フィールドの更新 (内部メソッド)

### 6. sprints.py (スプリント操作)
- `get_all_sprints_from_board` - ボードのスプリント一覧取得
- `get_all_sprints_from_board_model` - スプリントモデル一覧取得
- `update_sprint` - スプリントの更新
- `create_sprint` - スプリントの作成

### 7. boards.py (ボード操作)
- `get_all_agile_boards` - アジャイルボード一覧取得
- `get_all_agile_boards_model` - ボードモデル一覧取得

### 8. worklog.py (作業ログ操作)
- `add_worklog` - 作業ログの追加
- `get_worklog` - 作業ログデータの取得
- `get_worklog_models` - 作業ログモデル一覧取得
- `get_worklogs` - 作業ログ一覧の取得

### 9. transitions.py (トランジション操作)
- `get_available_transitions` - 利用可能なトランジション取得
- `get_transitions` - トランジションデータ取得
- `get_transitions_models` - トランジションモデル一覧取得
- `transition_issue` - 課題のトランジション実行

### 10. fields.py (フィールド操作)
- `get_fields` - 全フィールドの取得
- `get_field_id` - フィールドIDの取得
- `get_field_by_id` - フィールド定義の取得
- `get_custom_fields` - カスタムフィールド一覧の取得
- `get_required_fields` - 必須フィールドの取得
- `get_field_ids_to_epic` - Epic関連フィールドIDの取得
- `search_fields` - フィールドの検索 (ファジーマッチング)

## 新しい設計 (Python実装と完全一致)

### MCP Toolsツール一覧 (48個)

#### 課題操作 (Issues) - 6ツール
1. `get_issue` - 課題の詳細取得
2. `create_issue` - 課題の作成
3. `update_issue` - 課題の更新
4. `delete_issue` - 課題の削除
5. `batch_create_issues` - 課題の一括作成
6. `batch_get_changelogs` - 変更履歴の一括取得 (Cloud専用)

#### 検索操作 (Search) - 3ツール
7. `search_issues` - JQL検索
8. `get_board_issues` - ボード課題の取得
9. `get_sprint_issues` - スプリント課題の取得

#### コメント操作 (Comments) - 2ツール
10. `get_issue_comments` - コメント一覧の取得
11. `add_comment` - コメントの追加

#### プロジェクト操作 (Projects) - 14ツール
12. `get_all_projects` - 全プロジェクトの取得
13. `get_project` - プロジェクト詳細の取得
14. `get_project_model` - プロジェクトモデルの取得
15. `project_exists` - プロジェクトの存在確認
16. `get_project_components` - コンポーネント一覧の取得
17. `get_project_versions` - バージョン一覧の取得
18. `get_project_roles` - ロール一覧の取得
19. `get_project_role_members` - ロールメンバーの取得
20. `get_project_permission_scheme` - 権限スキームの取得
21. `get_project_notification_scheme` - 通知スキームの取得
22. `get_project_issue_types` - 課題タイプ一覧の取得
23. `get_project_issues_count` - 課題数の取得
24. `get_project_issues` - プロジェクト課題の取得
25. `create_project_version` - バージョンの作成

#### Epic操作 (Epics) - 2ツール
26. `link_issue_to_epic` - 課題をEpicにリンク
27. `get_epic_issues` - Epic配下の課題取得

#### スプリント操作 (Sprints) - 4ツール
28. `get_all_sprints_from_board` - ボードのスプリント一覧取得
29. `get_all_sprints_from_board_model` - スプリントモデル一覧取得
30. `update_sprint` - スプリントの更新
31. `create_sprint` - スプリントの作成

#### ボード操作 (Boards) - 2ツール
32. `get_all_agile_boards` - アジャイルボード一覧取得
33. `get_all_agile_boards_model` - ボードモデル一覧取得

#### 作業ログ操作 (Worklogs) - 4ツール
34. `add_worklog` - 作業ログの追加
35. `get_worklog` - 作業ログデータの取得
36. `get_worklog_models` - 作業ログモデル一覧取得
37. `get_worklogs` - 作業ログ一覧の取得

#### トランジション操作 (Transitions) - 4ツール
38. `get_available_transitions` - 利用可能なトランジション取得
39. `get_transitions` - トランジションデータ取得
40. `get_transitions_models` - トランジションモデル一覧取得
41. `transition_issue` - 課題のトランジション実行

#### フィールド操作 (Fields) - 7ツール
42. `get_fields` - 全フィールドの取得
43. `get_field_id` - フィールドIDの取得
44. `get_field_by_id` - フィールド定義の取得
45. `get_custom_fields` - カスタムフィールド一覧の取得
46. `get_required_fields` - 必須フィールドの取得
47. `get_field_ids_to_epic` - Epic関連フィールドIDの取得
48. `search_fields` - フィールドの検索

### ファイル構成 (変更なし)

```
src/jira/
├── index.ts       # MCPサーバーのエントリーポイント
├── service.ts     # Jiraサービスクラス
└── types.ts       # 型定義
```

### 型定義 (types.ts)

Python実装に合わせた型定義を追加:

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

### サービスクラス (service.ts)

Python実装の全メソッドを実装:

```typescript
export class JiraService {
  // 課題操作
  async getIssue(issueKey: string, options?: GetIssueOptions): Promise<IssueDetail>
  async createIssue(fields: IssueFields): Promise<CreateIssueResponse>
  async updateIssue(issueKey: string, fields: IssueFields): Promise<UpdateIssueResponse>
  async deleteIssue(issueKey: string): Promise<boolean>
  async batchCreateIssues(issues: IssueFields[]): Promise<CreateIssueResponse[]>
  async batchGetChangelogs(issueKeys: string[], fields?: string[]): Promise<JiraChangelog[]>

  // 検索操作
  async searchIssues(jql: string, options?: SearchOptions): Promise<IssueSearchResponse>
  async getBoardIssues(boardId: string, jql: string, options?: SearchOptions): Promise<IssueSearchResponse>
  async getSprintIssues(sprintId: string, options?: SearchOptions): Promise<IssueSearchResponse>

  // コメント操作
  async getIssueComments(issueKey: string, limit?: number): Promise<JiraComment[]>
  async addComment(issueKey: string, comment: string): Promise<JiraComment>

  // プロジェクト操作
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

  // Epic操作
  async linkIssueToEpic(issueKey: string, epicKey: string): Promise<IssueDetail>
  async getEpicIssues(epicKey: string, start?: number, limit?: number): Promise<IssueDetail[]>

  // スプリント操作
  async getAllSprintsFromBoard(boardId: string, state?: string, start?: number, limit?: number): Promise<any[]>
  async getAllSprintsFromBoardModel(boardId: string, state?: string, start?: number, limit?: number): Promise<JiraSprint[]>
  async updateSprint(sprintId: string, sprintName?: string, state?: string, startDate?: string, endDate?: string, goal?: string): Promise<JiraSprint | null>
  async createSprint(boardId: string, sprint: SprintInput): Promise<JiraSprint>

  // ボード操作
  async getAllAgileBoards(options?: BoardOptions): Promise<any[]>
  async getAllAgileBoardsModel(options?: BoardOptions): Promise<JiraBoard[]>

  // 作業ログ操作
  async addWorklog(issueKey: string, worklog: WorklogInput): Promise<any>
  async getWorklog(issueKey: string): Promise<any>
  async getWorklogModels(issueKey: string): Promise<JiraWorklog[]>
  async getWorklogs(issueKey: string): Promise<any[]>

  // トランジション操作
  async getAvailableTransitions(issueKey: string): Promise<any[]>
  async getTransitions(issueKey: string): Promise<any[]>
  async getTransitionsModels(issueKey: string): Promise<JiraTransition[]>
  async transitionIssue(issueKey: string, transitionId: string | number, fields?: any, comment?: string): Promise<IssueDetail>

  // フィールド操作
  async getFields(refresh?: boolean): Promise<JiraField[]>
  async getFieldId(fieldName: string, refresh?: boolean): Promise<string | null>
  async getFieldById(fieldId: string, refresh?: boolean): Promise<JiraField | null>
  async getCustomFields(refresh?: boolean): Promise<JiraField[]>
  async getRequiredFields(issueType: string, projectKey: string): Promise<any>
  async getFieldIdsToEpic(): Promise<Record<string, string>>
  async searchFields(keyword: string, limit?: number, refresh?: boolean): Promise<JiraField[]>
}
```

## 実装の優先順位と各フェーズの詳細

### Phase 1: コア機能 (Issues, Search, Comments) - 11ツール

**課題操作 (4ツール)**
1. `get_issue` - 課題の詳細取得
   - パラメータ: issue_key, expand?, comment_limit?, fields?, properties?, update_history?
2. `create_issue` - 課題の作成
   - パラメータ: project_key, summary, issue_type, description?, assignee?, components?, **kwargs
3. `update_issue` - 課題の更新
   - パラメータ: issue_key, fields?, **kwargs
4. `delete_issue` - 課題の削除
   - パラメータ: issue_key

**検索操作 (3ツール)**
5. `search_issues` - JQL検索
   - パラメータ: jql, fields?, start?, limit?, expand?, projects_filter?
6. `get_board_issues` - ボード課題の取得
   - パラメータ: board_id, jql, fields?, start?, limit?, expand?
7. `get_sprint_issues` - スプリント課題の取得
   - パラメータ: sprint_id, fields?, start?, limit?

**コメント操作 (2ツール)**
8. `get_issue_comments` - コメント一覧の取得
   - パラメータ: issue_key, limit?
9. `add_comment` - コメントの追加
   - パラメータ: issue_key, comment

**一括操作 (2ツール)**
10. `batch_create_issues` - 課題の一括作成
    - パラメータ: issues, validate_only?
11. `batch_get_changelogs` - 変更履歴の一括取得 (Cloud専用)
    - パラメータ: issue_ids_or_keys, fields?

### Phase 2: プロジェクト管理 - 14ツール

12. `get_all_projects` - 全プロジェクトの取得
    - パラメータ: include_archived?
13. `get_project` - プロジェクト詳細の取得
    - パラメータ: project_key
14. `get_project_model` - プロジェクトモデルの取得
    - パラメータ: project_key
15. `project_exists` - プロジェクトの存在確認
    - パラメータ: project_key
16. `get_project_components` - コンポーネント一覧の取得
    - パラメータ: project_key
17. `get_project_versions` - バージョン一覧の取得
    - パラメータ: project_key
18. `get_project_roles` - ロール一覧の取得
    - パラメータ: project_key
19. `get_project_role_members` - ロールメンバーの取得
    - パラメータ: project_key, role_id
20. `get_project_permission_scheme` - 権限スキームの取得
    - パラメータ: project_key
21. `get_project_notification_scheme` - 通知スキームの取得
    - パラメータ: project_key
22. `get_project_issue_types` - 課題タイプ一覧の取得
    - パラメータ: project_key
23. `get_project_issues_count` - 課題数の取得
    - パラメータ: project_key
24. `get_project_issues` - プロジェクト課題の取得
    - パラメータ: project_key, start?, limit?
25. `create_project_version` - バージョンの作成
    - パラメータ: project_key, name, start_date?, release_date?, description?

### Phase 3: アジャイル機能 - 8ツール

**Epic操作 (2ツール)**
26. `link_issue_to_epic` - 課題をEpicにリンク
    - パラメータ: issue_key, epic_key
27. `get_epic_issues` - Epic配下の課題取得
    - パラメータ: epic_key, start?, limit?

**スプリント操作 (4ツール)**
28. `get_all_sprints_from_board` - ボードのスプリント一覧取得
    - パラメータ: board_id, state?, start?, limit?
29. `get_all_sprints_from_board_model` - スプリントモデル一覧取得
    - パラメータ: board_id, state?, start?, limit?
30. `update_sprint` - スプリントの更新
    - パラメータ: sprint_id, sprint_name?, state?, start_date?, end_date?, goal?
31. `create_sprint` - スプリントの作成
    - パラメータ: board_id, sprint_name, start_date, end_date, goal?

**ボード操作 (2ツール)**
32. `get_all_agile_boards` - アジャイルボード一覧取得
    - パラメータ: board_name?, project_key?, board_type?, start?, limit?
33. `get_all_agile_boards_model` - ボードモデル一覧取得
    - パラメータ: board_name?, project_key?, board_type?, start?, limit?

### Phase 4: 高度な機能 - 15ツール

**作業ログ操作 (4ツール)**
34. `add_worklog` - 作業ログの追加
    - パラメータ: issue_key, time_spent, comment?, started?, original_estimate?, remaining_estimate?
35. `get_worklog` - 作業ログデータの取得
    - パラメータ: issue_key
36. `get_worklog_models` - 作業ログモデル一覧取得
    - パラメータ: issue_key
37. `get_worklogs` - 作業ログ一覧の取得
    - パラメータ: issue_key

**トランジション操作 (4ツール)**
38. `get_available_transitions` - 利用可能なトランジション取得
    - パラメータ: issue_key
39. `get_transitions` - トランジションデータ取得
    - パラメータ: issue_key
40. `get_transitions_models` - トランジションモデル一覧取得
    - パラメータ: issue_key
41. `transition_issue` - 課題のトランジション実行
    - パラメータ: issue_key, transition_id, fields?, comment?

**フィールド操作 (7ツール)**
42. `get_fields` - 全フィールドの取得
    - パラメータ: refresh?
43. `get_field_id` - フィールドIDの取得
    - パラメータ: field_name, refresh?
44. `get_field_by_id` - フィールド定義の取得
    - パラメータ: field_id, refresh?
45. `get_custom_fields` - カスタムフィールド一覧の取得
    - パラメータ: refresh?
46. `get_required_fields` - 必須フィールドの取得
    - パラメータ: issue_type, project_key
47. `get_field_ids_to_epic` - Epic関連フィールドIDの取得
    - パラメータ: なし
48. `search_fields` - フィールドの検索
    - パラメータ: keyword, limit?, refresh?

## 注意事項

1. **完全置き換え**: 既存のツールは全て削除し、Python実装と完全に一致させる
2. **命名規則**: Python実装の関数名をそのまま使用 (スネークケース)
3. **エラーハンドリング**: Python実装のエラーハンドリングを忠実に再現
4. **認証エラー**: 401/403エラーは適切に処理
5. **Cloud/Server対応**: CloudとServerの違いを考慮 (特にAPI v3対応)
6. **ページネーション**: Cloud環境ではnextPageTokenを使用
7. **フィールド検出**: Epic関連フィールド等は動的に検出
8. **Markdown対応**: コメント等でMarkdownをJiraマークアップに変換
9. **時間パース**: 作業ログの時間文字列解析 (1h 30m等)
10. **ファジーマッチング**: フィールド検索でファジーマッチングを実装

## まとめ

本設計書では、Python実装の全機能をTypeScriptに完全移植する計画を示しました。既存の6個のツールは全て削除し、48個の新しいツールに置き換えます。ファイル構成とNode.js実行環境は維持しつつ、MCP Serverの機能を完全に刷新します。