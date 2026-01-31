import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class HttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string, token: string) {
    this.client = axios.create({
      baseURL: baseURL.replace(/\/$/, ''),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || error.message;
        throw new Error(`HTTP GET Error: ${errorMsg} (Status: ${error.response?.status})`);
      }
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`HTTP POST Error: ${error.message}`);
      }
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`HTTP PUT Error: ${error.message}`);
      }
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`HTTP DELETE Error: ${error.message}`);
      }
      throw error;
    }
  }

  // Custom method for getting text responses (for diffs)
  async getText(url: string, config?: AxiosRequestConfig): Promise<string> {
    try {
      const response: AxiosResponse<string> = await this.client.get(url, {
        ...config,
        headers: {
          ...config?.headers,
          'Accept': 'text/plain',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`HTTP GET Text Error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get the underlying axios instance for special cases (e.g., multipart/form-data)
  getClient(): AxiosInstance {
    return this.client;
  }
}