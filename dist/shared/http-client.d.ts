import { AxiosInstance, AxiosRequestConfig } from 'axios';
export declare class HttpClient {
    private client;
    constructor(baseURL: string, token: string);
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    getText(url: string, config?: AxiosRequestConfig): Promise<string>;
    getClient(): AxiosInstance;
}
//# sourceMappingURL=http-client.d.ts.map