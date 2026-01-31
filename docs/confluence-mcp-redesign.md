# Confluence MCP Server 再設計書

## 概要

本ドキュメントは、`src/confluence`のTypeScript実装を`src/referer/confluence`のPython実装を参照して完全に再設計する計画を示します。

## 目的

- Python実装の全機能をTypeScriptに移行
- 既存のファイル構成とNode.js実行環境を維持
- MCP Serverの機能を完全に置き換え
- **既存のツールを全て削除し、Python実装と完全に一致させる**

## Python実装の機能分析

### 1. pages.py (ページ操作)
- `get_page_content` - ページコンテンツ取得（Markdown変換オプション付き）
- `get_page_ancestors` - ページの祖先（親ページ）取得
- `get_page_by_title` - タイトルでページ検索
- `get_space_pages` - スペース内の全ページ取得
- `create_page` - 新規ページ作成（Markdownサポート）
- `update_page` - ページ更新（バージョン管理付き）
- `get_page_children` - 子ページ取得
- `delete_page` - ページ削除

### 2. search.py (検索操作)
- `search` - CQL（Confluence Query Language）検索
- `search_user` - ユーザー検索

### 3. comments.py (コメント操作)
- `get_page_comments` - ページのコメント一覧取得
- `add_comment` - コメント追加（Markdown→Storage形式変換）

### 4. spaces.py (スペース操作)
- `get_spaces` - 全スペース取得
- `get_user_contributed_spaces` - ユーザーが貢献したスペース取得

### 5. labels.py (ラベル操作)
- `get_page_labels` - ページのラベル一覧取得
- `add_page_label` - ページにラベル追加

### 6. users.py (ユーザー操作)
- `get_user_details_by_accountid` - アカウントIDでユーザー詳細取得
- `get_user_details_by_username` - ユーザー名でユーザー詳細取得
- `get_current_user_info` - 現在のユーザー情報取得

## 新設計（Python実装との完全一致）

### MCPツール一覧（22ツール）

#### ページ操作（Pages） - 8ツール
1. `confluence_get_page_content` - ページコンテンツ取得
2. `confluence_get_page_ancestors` - ページの祖先取得
3. `confluence_get_page_by_title` - タイトルでページ検索
4. `confluence_get_space_pages` - スペース内のページ一覧
5. `confluence_create_page` - ページ作成
6. `confluence_update_page` - ページ更新
7. `confluence_get_page_children` - 子ページ取得
8. `confluence_delete_page` - ページ削除

#### 検索操作（Search） - 2ツール
9. `confluence_search` - CQL検索
10. `confluence_search_user` - ユーザー検索

#### コメント操作（Comments） - 2ツール
11. `confluence_get_page_comments` - コメント取得
12. `confluence_add_comment` - コメント追加

#### スペース操作（Spaces） - 2ツール
13. `confluence_get_spaces` - スペース一覧取得
14. `confluence_get_user_contributed_spaces` - ユーザー貢献スペース取得

#### ラベル操作（Labels） - 2ツール
15. `confluence_get_page_labels` - ページラベル取得
16. `confluence_add_page_label` - ページラベル追加

#### ユーザー操作（Users） - 3ツール
17. `confluence_get_user_details_by_accountid` - アカウントIDでユーザー取得
18. `confluence_get_user_details_by_username` - ユーザー名でユーザー取得
19. `confluence_get_current_user_info` - 現在のユーザー情報取得

#### アタッチメント操作（Attachments） - 3ツール
20. `confluence_get_page_attachments` - ページのアタッチメント一覧取得
21. `confluence_attach_file` - ファイル添付
22. `confluence_delete_attachment` - アタッチメント削除

### ファイル構成（変更なし）

```
src/confluence/
├── index.ts       # MCPサーバーエントリーポイント
├── service.ts     # Confluenceサービスクラス
└── types.ts       # 型定義
```

### 型定義（types.ts）

Python実装に合わせた型定義：

```typescript
// ページ型
export interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  status: string;
  space: {
    key: string;
    name: string;
  };
  version: {
    number: number;
    when: string;
  };
  content?: string;
  contentFormat?: 'storage' | 'markdown';
  url: string;
}

// 検索結果型
export interface SearchResult {
  id: string;
  title: string;
  type: string;
  excerpt: string;
  url: string;
  space?: {
    key: string;
    name: string;
  };
}

// コメント型
export interface ConfluenceComment {
  id: string;
  title: string;
  body: string;
  created: string;
  createdBy: {
    accountId: string;
    displayName: string;
  };
  version: {
    number: number;
  };
}

// スペース型
export interface ConfluenceSpace {
  key: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  homepage?: {
    id: string;
  };
}

// ラベル型
export interface ConfluenceLabel {
  id: string;
  name: string;
  prefix: string;
}

// ユーザー型
export interface ConfluenceUser {
  accountId: string;
  accountType: string;
  email?: string;
  publicName: string;
  displayName: string;
  active: boolean;
}

// アタッチメント型
export interface ConfluenceAttachment {
  id: string;
  title: string;
  mediaType: string;
  fileSize: number;
  comment?: string;
  created: string;
  downloadUrl: string;
}

// ページ作成/更新オプション
export interface PageOptions {
  convertToMarkdown?: boolean;
  isMarkdown?: boolean;
  enableHeadingAnchors?: boolean;
  contentRepresentation?: 'storage' | 'wiki';
}

// 検索オプション
export interface SearchOptions {
  limit?: number;
  start?: number;
  spacesFilter?: string;
}

// ページ作成入力
export interface CreatePageInput {
  spaceKey: string;
  title: string;
  body: string;
  parentId?: string;
  isMarkdown?: boolean;
  enableHeadingAnchors?: boolean;
}

// ページ更新入力
export interface UpdatePageInput {
  pageId: string;
  title: string;
  body: string;
  isMinorEdit?: boolean;
  versionComment?: string;
  isMarkdown?: boolean;
  parentId?: string;
  enableHeadingAnchors?: boolean;
}
```

### サービスクラス（service.ts）

Python実装の全メソッドを実装：

```typescript
export class ConfluenceService {
  // ページ操作
  async getPageContent(pageId: string, options?: PageOptions): Promise<ConfluencePage>
  async getPageAncestors(pageId: string): Promise<ConfluencePage[]>
  async getPageByTitle(spaceKey: string, title: string, options?: PageOptions): Promise<ConfluencePage | null>
  async getSpacePages(spaceKey: string, start?: number, limit?: number, options?: PageOptions): Promise<ConfluencePage[]>
  async createPage(input: CreatePageInput): Promise<ConfluencePage>
  async updatePage(input: UpdatePageInput): Promise<ConfluencePage>
  async getPageChildren(pageId: string, start?: number, limit?: number, options?: PageOptions): Promise<ConfluencePage[]>
  async deletePage(pageId: string): Promise<boolean>

  // 検索操作
  async search(cql: string, options?: SearchOptions): Promise<SearchResult[]>
  async searchUser(cql: string, limit?: number): Promise<ConfluenceUser[]>

  // コメント操作
  async getPageComments(pageId: string, returnMarkdown?: boolean): Promise<ConfluenceComment[]>
  async addComment(pageId: string, content: string): Promise<ConfluenceComment>

  // スペース操作
  async getSpaces(start?: number, limit?: number): Promise<ConfluenceSpace[]>
  async getUserContributedSpaces(limit?: number): Promise<Record<string, ConfluenceSpace>>

  // ラベル操作
  async getPageLabels(pageId: string): Promise<ConfluenceLabel[]>
  async addPageLabel(pageId: string, labelName: string): Promise<ConfluenceLabel[]>

  // ユーザー操作
  async getUserDetailsByAccountId(accountId: string, expand?: string): Promise<ConfluenceUser>
  async getUserDetailsByUsername(username: string, expand?: string): Promise<ConfluenceUser>
  async getCurrentUserInfo(): Promise<ConfluenceUser>

  // アタッチメント操作
  async getPageAttachments(pageId: string, start?: number, limit?: number): Promise<ConfluenceAttachment[]>
  async attachFile(pageId: string, filePath: string, comment?: string): Promise<ConfluenceAttachment>
  async deleteAttachment(attachmentId: string): Promise<boolean>
}
```

## 実装優先順位とフェーズ詳細

### フェーズ1: コア機能（Pages, Search） - 10ツール

**ページ操作（8ツール）**
1. `confluence_get_page_content` - ページコンテンツ取得
   - パラメータ: page_id, convert_to_markdown?
2. `confluence_get_page_ancestors` - ページの祖先取得
   - パラメータ: page_id
3. `confluence_get_page_by_title` - タイトルでページ検索
   - パラメータ: space_key, title, convert_to_markdown?
4. `confluence_get_space_pages` - スペース内のページ一覧
   - パラメータ: space_key, start?, limit?, convert_to_markdown?
5. `confluence_create_page` - ページ作成
   - パラメータ: space_key, title, body, parent_id?, is_markdown?, enable_heading_anchors?
6. `confluence_update_page` - ページ更新
   - パラメータ: page_id, title, body, is_minor_edit?, version_comment?, is_markdown?, parent_id?
7. `confluence_get_page_children` - 子ページ取得
   - パラメータ: page_id, start?, limit?, expand?, convert_to_markdown?
8. `confluence_delete_page` - ページ削除
   - パラメータ: page_id

**検索操作（2ツール）**
9. `confluence_search` - CQL検索
   - パラメータ: cql, limit?, spaces_filter?
10. `confluence_search_user` - ユーザー検索
    - パラメータ: cql, limit?

### フェーズ2: コラボレーション機能（Comments, Labels） - 4ツール

**コメント操作（2ツール）**
11. `confluence_get_page_comments` - コメント取得
    - パラメータ: page_id, return_markdown?
12. `confluence_add_comment` - コメント追加
    - パラメータ: page_id, content

**ラベル操作（2ツール）**
15. `confluence_get_page_labels` - ページラベル取得
    - パラメータ: page_id
16. `confluence_add_page_label` - ページラベル追加
    - パラメータ: page_id, label_name

### フェーズ3: 管理機能（Spaces, Users, Attachments） - 8ツール

**スペース操作（2ツール）**
13. `confluence_get_spaces` - スペース一覧取得
    - パラメータ: start?, limit?
14. `confluence_get_user_contributed_spaces` - ユーザー貢献スペース取得
    - パラメータ: limit?

**ユーザー操作（3ツール）**
17. `confluence_get_user_details_by_accountid` - アカウントIDでユーザー取得
    - パラメータ: account_id, expand?
18. `confluence_get_user_details_by_username` - ユーザー名でユーザー取得
    - パラメータ: username, expand?
19. `confluence_get_current_user_info` - 現在のユーザー情報取得
    - パラメータ: なし

**アタッチメント操作（3ツール）**
20. `confluence_get_page_attachments` - ページのアタッチメント一覧取得
    - パラメータ: page_id, start?, limit?
21. `confluence_attach_file` - ファイル添付
    - パラメータ: page_id, file_path, comment?
22. `confluence_delete_attachment` - アタッチメント削除
    - パラメータ: attachment_id

## 重要な実装ポイント

1. **完全な置き換え**: 既存の6ツールを全て削除し、Python実装と完全に一致させる
2. **命名規則**: Python関数名をそのまま使用（snake_case）、ツール名は`confluence_`プレフィックス付き
3. **エラーハンドリング**: Python実装のエラーハンドリングを忠実に再現
4. **認証エラー**: 401/403エラーを適切に処理
5. **Cloud/Serverサポート**: CloudとServerの違いを考慮（特にAPI v2サポート）
6. **Markdown変換**: MarkdownとConfluence Storage形式間の相互変換をサポート
7. **画像処理**: ページ内の画像をbase64エンコードして返す機能
8. **CQLフィルタリング**: 特定のスペースを除外するフィルタリング機能
9. **ページネーション**: start/limitパラメータによるページネーション対応
10. **バージョン管理**: ページ更新時のバージョン番号管理
11. **コンテンツ処理**: HTMLからMarkdownへの変換、前処理機能
12. **OAuth対応**: OAuth認証の場合はv2 APIを使用

## 既存実装との主な違い

### 削除される既存ツール（6ツール）
1. ~~`confluence_search_pages`~~ → `confluence_search`に統合・拡張
2. ~~`confluence_get_page`~~ → `confluence_get_page_content`に名称変更・拡張
3. ~~`confluence_get_page_children`~~ → 機能拡張版を再実装
4. ~~`confluence_get_page_ancestors`~~ → 機能拡張版を再実装
5. ~~`confluence_create_page`~~ → Markdownサポートを追加して再実装
6. ~~`confluence_update_page`~~ → バージョン管理を追加して再実装

### 新規追加される主要機能
- Markdown ↔ Storage形式の相互変換
- ユーザー検索・管理機能
- スペース管理機能
- ラベル管理機能
- アタッチメント管理機能
- コメント管理機能の強化
- より詳細な検索オプション
- コンテンツのHTML前処理

## Markdown変換機能の詳細設計

### 概要

Python実装では`preprocessor.py`モジュールがHTML↔Markdown変換を担当しています。TypeScript実装でも同等の機能を提供する必要があります。

### 必要な機能

#### 1. HTML → Markdown変換 (`process_html_content`)

**用途**: ページ取得時にHTMLコンテンツをMarkdownに変換

**処理フロー**:
1. Confluence Storage形式のHTMLを受け取る
2. HTMLをクリーンアップ（不要なタグ削除、正規化）
3. 相対URLを絶対URLに変換
4. HTMLをMarkdownに変換
5. 画像の処理（base64エンコーディング）

**影響する関数**:
- `getPageContent()` - `convert_to_markdown`パラメータ
- `getPageByTitle()` - `convert_to_markdown`パラメータ
- `getSpacePages()` - `convert_to_markdown`パラメータ
- `getPageChildren()` - `convert_to_markdown`パラメータ
- `getPageComments()` - `return_markdown`パラメータ

#### 2. Markdown → Storage形式変換 (`markdown_to_confluence_storage`)

**用途**: ページ作成・更新時にMarkdownをConfluence Storage形式に変換

**処理フロー**:
1. Markdownテキストを受け取る
2. Markdownをパース
3. Confluence Storage形式のHTMLに変換
4. 見出しアンカーの生成（オプション）

**影響する関数**:
- `createPage()` - `is_markdown`パラメータ
- `updatePage()` - `is_markdown`パラメータ
- `addComment()` - 自動検出によるMarkdown変換

#### 3. 画像処理

**処理内容**:
- ページ内の画像をbase64エンコード
- MCPの`ImageContent`型として返す
- 画像のダウンロードと変換

### 実装に必要なライブラリ

```json
{
  "dependencies": {
    "turndown": "^7.1.2",
    "markdown-it": "^14.0.0",
    "jsdom": "^23.0.0"
  },
  "devDependencies": {
    "@types/turndown": "^5.0.4",
    "@types/markdown-it": "^13.0.7"
  }
}
```

### 新規ファイル: `src/confluence/preprocessor.ts`

```typescript
import TurndownService from 'turndown';
import MarkdownIt from 'markdown-it';
import { JSDOM } from 'jsdom';

export class ContentPreprocessor {
  private turndown: TurndownService;
  private markdown: MarkdownIt;

  constructor() {
    // HTML → Markdown変換の設定
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    
    // Markdown → HTML変換の設定
    this.markdown = new MarkdownIt();
  }

  /**
   * HTMLコンテンツをMarkdownに変換
   */
  async processHtmlContent(
    html: string,
    spaceKey: string,
    baseUrl: string
  ): Promise<{ processedHtml: string; processedMarkdown: string }> {
    // HTMLのクリーンアップと正規化
    const cleanedHtml = this.cleanHtml(html);
    
    // 相対URLを絶対URLに変換
    const absoluteHtml = this.convertRelativeUrls(cleanedHtml, spaceKey, baseUrl);
    
    // Markdownに変換
    const markdown = this.turndown.turndown(absoluteHtml);
    
    return {
      processedHtml: absoluteHtml,
      processedMarkdown: markdown,
    };
  }

  /**
   * MarkdownをConfluence Storage形式に変換
   */
  markdownToConfluenceStorage(
    markdown: string,
    enableHeadingAnchors: boolean = false
  ): string {
    // MarkdownをHTMLに変換
    let html = this.markdown.render(markdown);
    
    // Confluence Storage形式に適応
    html = this.adaptToStorageFormat(html);
    
    // 見出しアンカーの追加（オプション）
    if (enableHeadingAnchors) {
      html = this.addHeadingAnchors(html);
    }
    
    return html;
  }

  private cleanHtml(html: string): string {
    // HTMLのクリーンアップ処理
    // 不要なタグやスタイルの削除
    return html;
  }

  private convertRelativeUrls(html: string, spaceKey: string, baseUrl: string): string {
    // 相対URLを絶対URLに変換
    return html;
  }

  private adaptToStorageFormat(html: string): string {
    // Confluence Storage形式への適応
    return html;
  }

  private addHeadingAnchors(html: string): string {
    // 見出しにアンカーを追加
    return html;
  }
}
```

### 型定義の拡張

既存の`PageOptions`を完全に使用：

```typescript
export interface PageOptions {
  convertToMarkdown?: boolean;  // HTML→Markdown変換を有効化
  isMarkdown?: boolean;          // Markdown→Storage形式変換を有効化
  enableHeadingAnchors?: boolean; // 見出しアンカーを生成
  contentRepresentation?: 'storage' | 'wiki'; // コンテンツ形式
}
```

### ツール定義への追加パラメータ

#### ページ取得系ツール

```javascript
{
  name: 'confluence_get_page_content',
  inputSchema: {
    properties: {
      page_id: { type: 'string' },
      convert_to_markdown: {
        type: 'boolean',
        default: true,
        description: 'Convert HTML to Markdown format'
      }
    }
  }
}
```

#### ページ作成・更新ツール

```javascript
{
  name: 'confluence_create_page',
  inputSchema: {
    properties: {
      space_key: { type: 'string' },
      title: { type: 'string' },
      body: { type: 'string' },
      is_markdown: {
        type: 'boolean',
        default: true,
        description: 'Whether body is in Markdown format'
      },
      enable_heading_anchors: {
        type: 'boolean',
        default: false,
        description: 'Generate heading anchors'
      }
    }
  }
}
```

## まとめ

本設計書は、Python実装の全機能をTypeScriptに完全移行する計画を示しています。既存の6ツールは全て削除され、22の新しいツールに置き換えられます。ファイル構成とNode.js実行環境を維持しながら、MCP Serverの機能は完全に刷新されます。

Markdown変換機能の追加により、以下が実現されます：
- HTMLとMarkdown間の双方向変換
- ユーザーフレンドリーなMarkdown形式でのコンテンツ入出力
- 見出しアンカーの自動生成
- 画像のbase64エンコーディング