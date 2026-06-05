import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDeclarations, deleteDeclaration, type DeclarationDto } from '@/api/declarations';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

export default function DeclarationsPage() {
  const user = useAuthStore((s) => s.user);
  const [declarations, setDeclarations] = useState<DeclarationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'DECLARANT') return;
    const controller = new AbortController();
    getDeclarations(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setDeclarations(data);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (!controller.signal.aborted) setError('Failed to load declarations');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user?.role]);

  const handleDelete = async (id: number, declNumber: string) => {
    if (!confirm(`Delete declaration ${declNumber}? This cannot be undone.`)) return;
    setError('');
    try {
      await deleteDeclaration(id);
      setDeclarations(declarations.filter((d) => d.id !== id));
    } catch {
      setError('Failed to delete declaration');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-primary-600 hover:underline">&larr; Dashboard</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">Declarations</h1>
          </div>
          {user?.role === 'DECLARANT' && (
            <Link to="/declarations/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors">
              + New Declaration
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        {/* My Declarations */}
        {user?.role === 'DECLARANT' && (
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">My Declarations</h2>
              <p className="text-xs text-gray-500 mt-0.5">{declarations.length} declaration{declarations.length !== 1 ? 's' : ''}</p>
            </div>
            {declarations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No declarations yet. Click "+ New Declaration" to create one.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-700">Declaration #</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-700">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-700">Goods Lines</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-700">Total Value</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-700">Total Duty</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-700">Total VAT</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {declarations.map((decl) => (
                    <tr key={decl.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-900">{decl.declarationNumber}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          decl.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                          decl.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                          decl.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700' :
                          decl.status === 'INFO_REQUESTED' ? 'bg-purple-100 text-purple-700' :
                          decl.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {decl.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{decl.lineItems.length}</td>
                      <td className="px-4 py-2.5 text-right text-gray-900">
                        {decl.totalValue != null ? `${decl.totalValue.toFixed(2)} ${decl.lineItems[0]?.currency || 'MAD'}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-900">
                        {decl.totalDuty != null ? decl.totalDuty.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-900">
                        {decl.totalVat != null ? decl.totalVat.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-2">
                        <Link
                          to={`/declarations/${decl.id}`}
                          className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                        >
                          View
                        </Link>
                        {(decl.status === 'DRAFT' || decl.status === 'REJECTED' || decl.status === 'INFO_REQUESTED') && (
                          <>
                            <Link
                              to={`/declarations/${decl.id}/edit`}
                              className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded hover:bg-primary-100 transition-colors"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(decl.id, decl.declarationNumber)}
                              className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {user?.role !== 'DECLARANT' && (
          <section className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
            <p>Declaration management is available for DECLARANT users only.</p>
          </section>
        )}

        <p className="text-xs text-gray-400 text-center pt-2">
          Only draft declarations can be edited or deleted. Submit a declaration to proceed with review.
        </p>
      </main>
    </div>
  );
}