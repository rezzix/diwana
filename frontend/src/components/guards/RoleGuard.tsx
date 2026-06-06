import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

type Role = 'ADMIN' | 'DECLARANT' | 'CONTROLLER';

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;

  if (!user || !roles.includes(user.role as Role)) {
    return <Navigate to="/" state={{ accessDenied: true, requiredRoles: roles }} replace />;
  }

  return <>{children}</>;
}
