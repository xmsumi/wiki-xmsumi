import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Spin } from 'antd';
import { useAuthStore } from '@/store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'editor' | 'viewer';
  fallback?: React.ReactNode;
}

/**
 * 认证守卫组件
 * 用于保护需要登录或特定权限的页面
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requiredRole,
  fallback
}) => {
  const router = useRouter();
  const { isAuthenticated, user, checkAuthStatus, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!requireAuth) {
        setIsChecking(false);
        return;
      }

      try {
        // 检查认证状态
        const isValid = await checkAuthStatus();
        
        if (!isValid) {
          // 未认证，跳转到登录页面
          const currentPath = router.asPath;
          router.replace(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        // 检查角色权限
        if (requiredRole && user) {
          const hasPermission = checkRolePermission(user.role, requiredRole);
          if (!hasPermission) {
            // 权限不足，跳转到403页面或首页
            router.replace('/403');
            return;
          }
        }
      } catch (error) {
        console.error('认证检查失败:', error);
        // 认证检查失败，跳转到登录页面
        router.replace('/auth/login');
        return;
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [requireAuth, requiredRole, router, checkAuthStatus, user]);

  // 检查角色权限
  const checkRolePermission = (userRole: string, requiredRole: string): boolean => {
    const roleHierarchy = {
      'admin': 3,
      'editor': 2,
      'viewer': 1
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  };

  // 如果不需要认证，直接渲染子组件
  if (!requireAuth) {
    return <>{children}</>;
  }

  // 正在检查认证状态或加载中
  if (isChecking || isLoading) {
    return (
      fallback || (
        <div className="flex justify-center items-center min-h-screen">
          <Spin size="large" tip="正在验证身份..." />
        </div>
      )
    );
  }

  // 已认证且有权限，渲染子组件
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 其他情况返回空
  return null;
};