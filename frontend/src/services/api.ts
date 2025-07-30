import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/store/authStore';

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string | number;
    details?: any;
  };
  timestamp: string;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * API客户端类
 */
class ApiClient {
  private instance: AxiosInstance;
  private isHandlingAuth = false; // 防止重复处理认证失败
  private authFailureCount = 0; // 认证失败计数器
  private lastAuthFailureTime = 0; // 上次认证失败时间

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 添加认证token
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求时间戳
        config.metadata = { startTime: new Date() };

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 计算请求耗时
        const endTime = new Date();
        const startTime = response.config.metadata?.startTime;
        if (startTime) {
          const duration = endTime.getTime() - startTime.getTime();
          console.log(`API请求耗时: ${duration}ms - ${response.config.url}`);
        }

        // 检查业务状态码
        if (response.data && !response.data.success) {
          const errorMessage = response.data.error?.message || '请求失败';
          // 不在拦截器中显示错误消息，让具体的请求处理
          return Promise.reject(new Error(errorMessage));
        }

        return response;
      },
      (error) => {
        // 处理HTTP错误
        if (error.response) {
          const { status, data } = error.response;

          switch (status) {
            case 401:
              // 检查是否是登录相关的请求
              const isAuthRequest = error.config?.url?.includes('/auth/');

              if (isAuthRequest) {
                // 认证相关请求失败，不需要重定向，让页面自己处理
                break;
              }

              // 检查当前是否已经在登录页面
              if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) {
                break;
              }

              // 使用时间窗口防止重复处理认证失败
              const currentTime = Date.now();
              const timeSinceLastFailure = currentTime - this.lastAuthFailureTime;

              // 如果距离上次认证失败不到5秒，跳过处理避免重复
              if (timeSinceLastFailure < 5000 && this.authFailureCount > 0) {
                this.authFailureCount++;
                break;
              }

              // 防止重复处理认证失败
              if (!this.isHandlingAuth) {
                this.isHandlingAuth = true;
                this.authFailureCount++;
                this.lastAuthFailureTime = currentTime;

                // 清除登录状态
                useAuthStore.getState().logout();

                // 只显示一次错误消息
                if (this.authFailureCount === 1) {
                  message.error('登录已过期，请重新登录');
                }

                // 延迟跳转，避免立即刷新
                setTimeout(() => {
                  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                  }
                }, 1500);

                // 延迟重置标志
                setTimeout(() => {
                  this.isHandlingAuth = false;
                  if (Date.now() - this.lastAuthFailureTime > 10000) {
                    this.authFailureCount = 0;
                  }
                }, 5000);
              }
              break;
            case 403:
              // 不在拦截器中显示错误，让页面处理
              break;
            case 404:
              // 不在拦截器中显示错误，让页面处理
              break;
            case 500:
              message.error('服务器内部错误');
              break;
            default:
              // 其他错误不在拦截器中处理，让具体请求处理
              break;
          }
        } else if (error.request) {
          // 网络错误
          message.error('网络连接失败，请检查网络设置');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  /**
   * 文件上传
   */
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.instance.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data.data as T;
  }

  /**
   * 获取原始axios实例
   */
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// 导出API客户端实例
export const apiClient = new ApiClient();

// 扩展axios配置类型
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}