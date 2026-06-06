import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" state={{ accessDenied: true, requiredRoles: ['ADMIN'] }} replace />;
  }

  return <>{children}</>;
}
