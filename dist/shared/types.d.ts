export interface PaginatedResponse<T> {
    values: T[];
    size: number;
    isLastPage: boolean;
    nextPageStart?: number;
}
export interface ErrorResponse {
    error: string;
}
export type ApiResponse<T> = T | ErrorResponse;
export declare function isErrorResponse(response: any): response is ErrorResponse;
//# sourceMappingURL=types.d.ts.map