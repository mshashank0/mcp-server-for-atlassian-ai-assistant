import type { AxiosInstance } from 'axios';
import type winston from 'winston';
export declare const BITBUCKET_DEFAULT_LIMIT = 25;
export declare const BITBUCKET_MAX_LIMIT = 100;
export declare const BITBUCKET_ALL_ITEMS_CAP = 1000;
export interface PaginationRequestOptions {
    start?: number;
    limit?: number;
    all?: boolean;
    params?: Record<string, any>;
    defaultLimit?: number;
    maxItems?: number;
    description?: string;
}
export interface PaginatedResult<T> {
    values: T[];
    start?: number;
    limit: number;
    size: number;
    isLastPage: boolean;
    nextPageStart?: number;
    fetchedPages: number;
    totalFetched: number;
}
export declare class BitbucketPaginator {
    private readonly api;
    private readonly logger?;
    constructor(api: AxiosInstance, logger?: winston.Logger);
    fetchValues<T>(path: string, options?: PaginationRequestOptions): Promise<PaginatedResult<T>>;
    private performRequest;
    private extractValues;
    private normalizeLimit;
}
//# sourceMappingURL=pagination.d.ts.map