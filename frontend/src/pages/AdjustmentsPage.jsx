import { useEffect, useState } from 'react';
import { getAdjustments, createAdjustment } from '../api/operations';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentQty, setCurrentQty] = useState(null);
  const [form, setForm] = useState({
    productId: '',
    locationId: '',
    countedQuantity: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  function fetchAll() {
    setLoading(true);
    Promise.all([
      getAdjustments(),
      apiClient.get('/products'),
      apiClient
        .get('/warehouses')
        .then((r) =>
          r.data.flatMap((w) =>
            (w.locations ?? []).map((l) => ({ ...l, warehouseName: w.name }))
          )
        )
        .catch(() => []),
    ])
      .then(([adj, prod, locs]) => {
        setAdjustments(adj.data);
        setProducts(prod.data);
        setLocations(locs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // Fetch current stock when product + location are both selected
  useEffect(() => {
    if (!form.productId || !form.locationId) {
      setCurrentQty(null);
      return;
    }
    apiClient
      .get('/products')
      .then((res) => {
        const product = res.data.find((p) => p.id === form.productId);
        const stock = product?.stockItems?.find(
          (s) => s.locationId === form.locationId
        );
        setCurrentQty(stock?.quantity ?? 0);
      })
      .catch(() => setCurrentQty(null));
  }, [form.productId, form.locationId]);

  function resetForm() {
    setForm({ productId: '', locationId: '', countedQuantity: '', notes: '' });
    setErrors({});
    setCurrentQty(null);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.productId) newErrors.productId = 'Please select a product';
    if (!form.locationId) newErrors.locationId = 'Please select a location';
    if (form.countedQuantity === '' || form.countedQuantity < 0)
      newErrors.countedQuantity = 'Please enter a valid quantity (0 or more)';
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    const toastId = toast.loading('Saving adjustment...');
    try {
      await createAdjustment({
        productId: form.productId,
        locationId: form.locationId,
        countedQuantity: Number(form.countedQuantity),
        notes: form.notes,
      });
      toast.success('Adjustment saved — stock updated!', { id: toastId });
      setShowModal(false);
      resetForm();
      fetchAll();
    } catch (err) {
      toast.dismiss(toastId);
      const apiErrors = err.response?.data?.errors ?? [];
      const mapped = {};
      apiErrors.forEach((e) => {
        mapped[e.field] = e.message;
      });
      setErrors(mapped);
      if (!apiErrors.length)
        toast.error(err.response?.data?.error ?? 'Failed to save adjustment');
    }
  }

  const delta =
    currentQty !== null && form.countedQuantity !== ''
      ? Number(form.countedQuantity) - currentQty
      : null;

  const columns = [
    {
      key: 'id',
      label: 'Adjustment ID',
      render: (row) => (
        <code
          style={{
            fontSize: '11px',
            background: 'var(--color-gray-100)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {row.id.slice(0, 8)}…
        </code>
      ),
    },
    {
      key: 'product',
      label: 'Product',
      render: (row) => (
        <span style={{ fontWeight: '500' }}>
          {row.product?.name ?? row.productId ?? '—'}
        </span>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => {
        const loc = locations.find((l) => l.id === row.locationId);
        return loc ? `${loc.warehouseName} — ${loc.name}` : row.locationId ?? '—';
      },
    },
    {
      key: 'delta',
      label: 'Change',
      render: (row) => {
        const d = row.delta ?? row.quantityChange;
        if (d === undefined || d === null) return '—';
        return (
          <strong
            style={{ color: d >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
          >
            {d >= 0 ? '+' : ''}
            {d}
          </strong>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status ?? 'done'} />,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>
            Adjustments
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-gray-400)',
              marginTop: '4px',
            }}
          >
            Fix mismatches between recorded and physical stock
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={btnStyle('var(--color-primary)')}
        >
          + New Adjustment
        </button>
      </div>

      {/* Adjustments Table */}
      <Table
        columns={columns}
        data={adjustments}
        loading={loading}
        emptyMessage="No adjustments yet. Click '+ New Adjustment' to fix a stock count."
      />

      {/* Create Adjustment Modal */}
      {showModal && (
        <Modal
          title="New Stock Adjustment"
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          width="500px"
        >
          <form onSubmit={handleCreate}>

            {/* Product */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Product</label>
              <select
                value={form.productId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, productId: e.target.value }))
                }
                style={selectStyle(errors.productId)}
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              {errors.productId && (
                <span style={errorStyle}>{errors.productId}</span>
              )}
            </div>

            {/* Location */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Location</label>
              <select
                value={form.locationId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, locationId: e.target.value }))
                }
                style={selectStyle(errors.locationId)}
              >
                <option value="">Select a location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.warehouseName} — {l.name}
                  </option>
                ))}
              </select>
              {errors.locationId && (
                <span style={errorStyle}>{errors.locationId}</span>
              )}
            </div>

            {/* Counted Quantity */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Actual Counted Quantity</label>
              <input
                type="number"
                value={form.countedQuantity}
                min="0"
                step="any"
                placeholder="Enter the physical count"
                onChange={(e) =>
                  setForm((p) => ({ ...p, countedQuantity: e.target.value }))
                }
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${
                    errors.countedQuantity
                      ? 'var(--color-danger)'
                      : 'var(--color-gray-200)'
                  }`,
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  fontSize: '14px',
                }}
              />
              {errors.countedQuantity && (
                <span style={errorStyle}>{errors.countedQuantity}</span>
              )}
            </div>

            {/* Live Delta Preview */}
            {delta !== null && (
              <div
                style={{
                  background: delta === 0 ? 'var(--color-gray-50)' : delta > 0 ? '#F0FDF4' : '#FFF5F5',
                  border: `1px solid ${delta === 0 ? 'var(--color-gray-200)' : delta > 0 ? '#BBF7D0' : '#FCA5A5'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginBottom: '16px',
                }}
              >
                <p style={{ fontSize: '13px', color: 'var(--color-gray-600)', margin: 0 }}>
                  📦 Stock preview:
                </p>
                <p style={{ fontSize: '15px', fontWeight: '600', marginTop: '6px', marginBottom: 0 }}>
                  <span style={{ color: 'var(--color-gray-600)' }}>
                    Current: <strong>{currentQty}</strong>
                  </span>
                  <span style={{ margin: '0 10px', color: 'var(--color-gray-400)' }}>→</span>
                  <span style={{ color: 'var(--color-gray-800)' }}>
                    New: <strong>{form.countedQuantity}</strong>
                  </span>
                  <span
                    style={{
                      marginLeft: '10px',
                      color: delta > 0 ? 'var(--color-success)' : delta < 0 ? 'var(--color-danger)' : 'var(--color-gray-400)',
                      fontWeight: '700',
                    }}
                  >
                    ({delta > 0 ? '+' : ''}{delta})
                  </span>
                </p>
                {delta === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--color-gray-400)', marginTop: '4px', marginBottom: 0 }}>
                    No change — stock count matches.
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Reason / Notes (optional)</label>
              <textarea
                value={form.notes}
                placeholder="e.g. 3 units found damaged during inspection"
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={3}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={{
                ...btnStyle('var(--color-primary)'),
                width: '100%',
                padding: '11px',
                fontSize: '14px',
              }}
            >
              Save Adjustment
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function btnStyle(bg) {
  return {
    padding: '7px 14px',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  };
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: 'var(--color-gray-600)',
  marginBottom: '4px',
};

const errorStyle = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--color-danger)',
  marginTop: '3px',
};

const selectStyle = (err) => ({
  padding: '8px 12px',
  border: `1px solid ${err ? 'var(--color-danger)' : 'var(--color-gray-200)'}`,
  borderRadius: 'var(--radius-md)',
  width: '100%',
  fontSize: '14px',
  background: '#fff',
});