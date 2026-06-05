import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getPendingReviewDeclarations, type DeclarationDto } from '@/api/declarations';
import { useAuthStore } from '@/stores/authStore';

export default function ControlDeskPage() {
  const user = useAuthStore((s) => s.user);
  const [declarations, setDeclarations] = useState<DeclarationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getPendingReviewDeclarations(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setDeclarations(data);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (!controller.signal.aborted) setError('Failed to load pending declarations');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const refresh = async () => {
    setError('');
    try {
      const data = await getPendingReviewDeclarations();
      setDeclarations(data);
    } catch {
      setError('Failed to refresh declarations');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>;
  }

  const submitted = declarations.filter((d) => d.status === 'SUBMITTED');
  const underReview = declarations.filter((d) => d.status === 'UNDER_REVIEW');
  const infoRequested = declarations.filter((d) => d.status === 'INFO_REQUESTED');

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-primary-600 hover:underline">&larr; Dashboard</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">Control Desk</h1>
            {user?.customsOfficeName && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">{user.customsOfficeName}</span>
              </>
            )}
          </div>
          <button onClick={refresh}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700">{submitted.length}</div>
            <div className="text-sm text-blue-600">Submitted — awaiting review</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-700">{underReview.length}</div>
            <div className="text-sm text-amber-600">Under Review</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-700">{infoRequested.length}</div>
            <div className="text-sm text-purple-600">Info Requested</div>
          </div>
        </div>

        {declarations.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
            No declarations pending review.
          </div>
        ) : (
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Declarations Pending Review</h2>
              <p className="text-xs text-gray-500 mt-0.5">{declarations.length} declaration{declarations.length !== 1 ? 's' : ''} — sorted by submission date (oldest first)</p>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">Declaration #</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">Declarant</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">Company</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-700">Total Value</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-700">Goods Lines</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {declarations.map((decl) => (
                  <tr key={decl.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-900">{decl.declarationNumber}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        decl.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                        decl.status === 'INFO_REQUESTED' ? 'bg-purple-100 text-purple-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {decl.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{decl.declarantName}</td>
                    <td className="px-4 py-2.5 text-gray-700">{decl.companyName}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900">
                      {decl.totalValue != null ? `${decl.totalValue.toFixed(2)} ${decl.lineItems[0]?.currency || 'MAD'}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{decl.lineItems.length}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        to={`/declarations/${decl.id}`}
                        className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded hover:bg-primary-100 transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}