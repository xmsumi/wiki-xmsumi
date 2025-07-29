import { create } from 'zustand';

/**
 * 应用状态接口
 */
interface AppState {
  // UI状态
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  
  // 搜索状态
  searchQuery: string;
  searchResults: any[];
  searchLoading: boolean;
  
  // 当前页面状态
  currentPath: string;
  breadcrumbs: Array<{ title: string; path: string }>;
  
  // 操作方法
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: any[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setCurrentPath: (path: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ title: string; path: string }>) => void;
  reset: () => void;
}

/**
 * 应用状态管理
 */
export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  sidebarCollapsed: false,
  theme: 'light',
  loading: false,
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  currentPath: '/',
  breadcrumbs: [],

  // 设置侧边栏折叠状态
  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  // 设置主题
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
  },

  // 设置全局加载状态
  setLoading: (loading: boolean) => {
    set({ loading });
  },

  // 设置搜索查询
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  // 设置搜索结果
  setSearchResults: (results: any[]) => {
    set({ searchResults: results });
  },

  // 设置搜索加载状态
  setSearchLoading: (loading: boolean) => {
    set({ searchLoading: loading });
  },

  // 设置当前路径
  setCurrentPath: (path: string) => {
    set({ currentPath: path });
  },

  // 设置面包屑导航
  setBreadcrumbs: (breadcrumbs: Array<{ title: string; path: string }>) => {
    set({ breadcrumbs });
  },

  // 重置状态
  reset: () => {
    set({
      sidebarCollapsed: false,
      theme: 'light',
      loading: false,
      searchQuery: '',
      searchResults: [],
      searchLoading: false,
      currentPath: '/',
      breadcrumbs: [],
    });
  },
}));