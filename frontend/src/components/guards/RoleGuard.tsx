import AccessDenied from '@/components/common/AccessDenied';
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
    return <AccessDenied requiredRoles={roles} />;
  }

  return <>{children}</>;
}
