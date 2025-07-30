import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';

/**
 * 用户信息接口
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar_url?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 认证状态接口
 */
interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastLoginTime: string | null;
  
  // 操作方法
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  checkAuthStatus: () => Promise<boolean>;
  refreshUserProfile: () => Promise<void>;
}

/**
 * 认证状态管理
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      lastLoginTime: null,

      // 设置用户信息
      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
        });
      },

      // 设置token
      setToken: (token: string) => {
        set({ token });
      },

      // 登录
      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          lastLoginTime: new Date().toISOString(),
        });
      },

      // 注销
      logout: async () => {
        try {
          // 调用后端注销API
          await authService.logout();
        } catch (error) {
          console.error('注销API调用失败:', error);
        } finally {
          // 无论API调用是否成功，都清除本地状态
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            lastLoginTime: null,
          });
        }
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // 更新用户信息
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      // 检查认证状态
      checkAuthStatus: async (): Promise<boolean> => {
        const { token } = get();
        if (!token) {
          return false;
        }

        try {
          const result = await authService.validateToken();
          if (result.isValid && result.user) {
            set({
              user: result.user,
              isAuthenticated: true,
            });
            return true;
          } else {
            // Token无效，清除状态
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
            return false;
          }
        } catch (error) {
          console.error('检查认证状态失败:', error);
          // 出错时清除状态
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      // 刷新用户信息
      refreshUserProfile: async (): Promise<void> => {
        const { isAuthenticated } = get();
        if (!isAuthenticated) {
          return;
        }

        try {
          const userProfile = await authService.getProfile();
          set({
            user: userProfile,
          });
        } catch (error) {
          console.error('刷新用户信息失败:', error);
          // 如果获取用户信息失败，可能是token过期，清除认证状态
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage', // 本地存储键名
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastLoginTime: state.lastLoginTime,
      }),
    }
  )
);