import AccessDenied from '@/components/common/AccessDenied';
import { useAuthStore } from '@/stores/authStore';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;

  if (user?.role !== 'ADMIN') {
    return <AccessDenied requiredRoles={['ADMIN']} />;
  }

  return <>{children}</>;
}
