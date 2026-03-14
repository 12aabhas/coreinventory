import { useEffect, useState } from 'react';
import { getLowStockAlerts } from '../api/operations';

export default function LowStockBanner() {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getLowStockAlerts()
      .then((res) => setAlerts(res.data ?? []))
      .catch(() => {}); // silently fail — don't break the page if alerts fail
  }, []);

  if (alerts.length === 0 || dismissed) return null;

  return (
    <div
      style={{
        background: '#FEF3C7',
        border: '1px solid #FCD34D',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '10px',
      }}
    >
      {/* Left: icon + content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: '18px', lineHeight: 1.4 }}>⚠️</span>
        <div>
          <p
            style={{
              fontWeight: '600',
              fontSize: '14px',
              color: '#92400E',
              margin: 0,
            }}
          >
            {alerts.length} item{alerts.length > 1 ? 's are' : ' is'} running
            low on stock
          </p>
          <p
            style={{
              fontSize: '13px',
              color: '#B45309',
              marginTop: '3px',
              marginBottom: 0,
            }}
          >
            {alerts
              .slice(0, 3)
              .map((a) => a.product?.name ?? a.productName ?? 'Unknown')
              .join(', ')}
            {alerts.length > 3 && (
              <span style={{ fontStyle: 'italic' }}>
                {' '}and {alerts.length - 3} more
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right: dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          color: '#92400E',
          lineHeight: 1,
          padding: '2px 4px',
          borderRadius: '4px',
          flexShrink: 0,
        }}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}