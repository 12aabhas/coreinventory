import { useEffect, useState } from 'react';
import { getDashboard } from '../api/dashboard';
import LowStockBanner from '../components/LowStockBanner';

function KpiCard({ label, value, color = 'var(--color-gray-800)' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      border: '1px solid var(--color-gray-200)', boxShadow: 'var(--shadow-sm)',
    }}>
      <p style={{ fontSize: '13px', color: 'var(--color-gray-400)', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '32px', fontWeight: '700', color }}>{value ?? '—'}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px' }}>Dashboard</h1>
      <LowStockBanner />
      {loading ? (
        <p style={{ color: 'var(--color-gray-400)' }}>Loading...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <KpiCard label="Total Products" value={data?.totalProducts} />
          <KpiCard label="Low Stock" value={data?.lowStock} color="var(--color-warning)" />
          <KpiCard label="Out of Stock" value={data?.outOfStock} color="var(--color-danger)" />
          <KpiCard label="Pending Receipts" value={data?.pendingReceipts} color="var(--color-info)" />
          <KpiCard label="Pending Deliveries" value={data?.pendingDeliveries} color="var(--color-primary)" />
        </div>
      )}
    </div>
  );
}
