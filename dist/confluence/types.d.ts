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
    /**
     * Update hint for MCP clients
     * @internal
     */
    _mcpUpdateHint?: string;
}
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
export interface ConfluenceComment {
    id: string;
    title: string;
    body: string;
    created: string;
    createdBy: {
        username: string;
        displayName: string;
    };
    version: {
        number: number;
    };
}
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
export interface ConfluenceLabel {
    id: string;
    name: string;
    prefix: string;
}
export interface ConfluenceUser {
    username: string;
    email?: string;
    publicName: string;
    displayName: string;
    active: boolean;
}
export interface ConfluenceAttachment {
    id: string;
    title: string;
    mediaType: string;
    fileSize: number;
    comment?: string;
    created: string;
    downloadUrl: string;
}
export interface PageOptions {
    convertToMarkdown?: boolean;
    isMarkdown?: boolean;
    enableHeadingAnchors?: boolean;
    contentRepresentation?: 'storage' | 'wiki';
}
export interface SearchOptions {
    limit?: number;
    start?: number;
    spacesFilter?: string;
}
export interface CreatePageInput {
    spaceKey: string;
    title: string;
    body: string;
    parentId?: string;
    isMarkdown?: boolean;
    enableHeadingAnchors?: boolean;
}
export type PageUpdateMode = 'replace' | 'append' | 'prepend';
export interface UpdatePageInput {
    pageId: string;
    title: string;
    body: string;
    isMinorEdit?: boolean;
    versionComment?: string;
    isMarkdown?: boolean;
    parentId?: string;
    enableHeadingAnchors?: boolean;
    updateMode?: PageUpdateMode;
}
export interface ImageContent {
    type: 'image';
    data: string;
    mimeType: string;
}
export interface TextContent {
    type: 'text';
    text: string;
}
export type PageContentResult = (TextContent | ImageContent)[];
//# sourceMappingURL=types.d.ts.map