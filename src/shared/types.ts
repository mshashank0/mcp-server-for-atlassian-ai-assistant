// Common API Response types

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

export function isErrorResponse(response: any): response is ErrorResponse {
  return response && typeof response.error === 'string';
}