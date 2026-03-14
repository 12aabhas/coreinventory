import { useEffect, useState } from 'react';
import { getMoveHistory } from '../api/operations';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';

export default function MoveHistoryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ reason: '', from: '', to: '' });

  function fetchHistory() {
    setLoading(true);
    getMoveHistory(filters)
      .then((res) => setEntries(res.data.entries ?? res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  function clearFilters() {
    setFilters({ reason: '', from: '', to: '' });
  }

  const hasActiveFilters = filters.reason || filters.from || filters.to;

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (row) => (
        <div>
          <span style={{ fontWeight: '500', fontSize: '13px' }}>
            {row.product?.name ?? '—'}
          </span>
          {row.product?.sku && (
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                color: 'var(--color-gray-400)',
                marginTop: '2px',
              }}
            >
              {row.product.sku}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'delta',
      label: 'Change',
      render: (row) => (
        <strong
          style={{
            color:
              row.delta >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            fontSize: '14px',
          }}
        >
          {row.delta >= 0 ? '+' : ''}
          {row.delta}
        </strong>
      ),
    },
    {
      key: 'reason',
      label: 'Type',
      render: (row) => <StatusBadge status={row.reason} />,
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => (
        <span style={{ fontSize: '13px', color: 'var(--color-gray-600)' }}>
          {row.location?.name ?? row.locationId ?? '—'}
        </span>
      ),
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (row) =>
        row.referenceId ? (
          <code
            style={{
              fontSize: '11px',
              background: 'var(--color-gray-100)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {row.referenceId.slice(0, 8)}…
          </code>
        ) : (
          <span style={{ color: 'var(--color-gray-300)' }}>—</span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      render: (row) => (
        <span style={{ fontSize: '13px', color: 'var(--color-gray-600)' }}>
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>
          Move History
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-gray-400)',
            marginTop: '4px',
          }}
        >
          Full audit log of every stock movement
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: '#fff',
          border: '1px solid var(--color-gray-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
        }}
      >
        {/* Movement type filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>Movement Type</label>
          <select
            value={filters.reason}
            onChange={(e) =>
              setFilters((p) => ({ ...p, reason: e.target.value }))
            }
            style={selectStyle}
          >
            <option value="">All types</option>
            <option value="receipt">Receipt</option>
            <option value="delivery">Delivery</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        {/* Date from */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>From Date</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) =>
              setFilters((p) => ({ ...p, from: e.target.value }))
            }
            style={selectStyle}
          />
        </div>

        {/* Date to */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>To Date</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
            style={selectStyle}
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              alignSelf: 'flex-end',
              padding: '7px 14px',
              background: 'none',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--color-gray-600)',
              cursor: 'pointer',
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Summary strip when filters are active */}
      {hasActiveFilters && !loading && (
        <div
          style={{
            fontSize: '13px',
            color: 'var(--color-gray-500)',
            marginBottom: '12px',
          }}
        >
          Showing <strong>{entries.length}</strong> result
          {entries.length !== 1 ? 's' : ''} with active filters
        </div>
      )}

      {/* Move History Table */}
      <Table
        columns={columns}
        data={entries}
        loading={loading}
        emptyMessage="No stock movements recorded yet. Movements appear here after receipts, deliveries, transfers, and adjustments are validated."
      />
    </div>
  );
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: '500',
  color: 'var(--color-gray-400)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const selectStyle = {
  padding: '7px 12px',
  border: '1px solid var(--color-gray-200)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px',
  background: '#fff',
  color: 'var(--color-gray-700)',
};