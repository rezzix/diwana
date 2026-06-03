export default function AccessDenied({ requiredRoles }: { requiredRoles?: string[] }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center space-y-3">
        <div className="text-4xl">🚫</div>
        <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-sm text-gray-500">
          You do not have permission to view this page.
        </p>
        {requiredRoles && (
          <p className="text-xs text-gray-400">
            Required role{requiredRoles.length > 1 ? 's' : ''}: {requiredRoles.join(', ')}
          </p>
        )}
        <a
          href="/"
          className="inline-block mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
