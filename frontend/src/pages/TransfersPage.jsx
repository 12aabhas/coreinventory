import { useEffect, useState } from 'react';
import { getTransfers, createTransfer, validateTransfer } from '../api/operations';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import FormInput from '../components/FormInput';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    fromLocationId: '',
    toLocationId: '',
    notes: '',
    lines: [{ productId: '', quantity: 1 }],
  });
  const [errors, setErrors] = useState({});

  function fetchAll() {
    setLoading(true);
    Promise.all([
      getTransfers(statusFilter ? { status: statusFilter } : {}),
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
      .then(([trans, prod, locs]) => {
        setTransfers(trans.data);
        setProducts(prod.data);
        setLocations(locs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAll();
  }, [statusFilter]);

  function addLine() {
    setForm((p) => ({ ...p, lines: [...p.lines, { productId: '', quantity: 1 }] }));
  }

  function removeLine(index) {
    setForm((p) => ({ ...p, lines: p.lines.filter((_, i) => i !== index) }));
  }

  function updateLine(index, field, value) {
    setForm((p) => {
      const lines = [...p.lines];
      lines[index] = {
        ...lines[index],
        [field]: field === 'quantity' ? Number(value) : value,
      };
      return { ...p, lines };
    });
  }

  function resetForm() {
    setForm({
      fromLocationId: '',
      toLocationId: '',
      notes: '',
      lines: [{ productId: '', quantity: 1 }],
    });
    setErrors({});
  }

  async function handleCreate(e) {
    e.preventDefault();
    const newErrors = {};

    if (!form.fromLocationId) newErrors.fromLocationId = 'Please select a source location';
    if (!form.toLocationId) newErrors.toLocationId = 'Please select a destination location';
    if (form.fromLocationId && form.toLocationId && form.fromLocationId === form.toLocationId) {
      newErrors.toLocationId = 'Destination must be different from source';
    }
    form.lines.forEach((line, i) => {
      if (!line.productId) newErrors[`line_${i}_product`] = 'Select a product';
      if (!line.quantity || line.quantity <= 0)
        newErrors[`line_${i}_qty`] = 'Quantity must be greater than 0';
    });
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    const toastId = toast.loading('Creating transfer...');
    try {
      await createTransfer(form);
      toast.success('Transfer created!', { id: toastId });
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
        toast.error(err.response?.data?.error ?? 'Failed to create transfer');
    }
  }

  async function handleValidate(id) {
    if (!window.confirm('Validate this transfer? Stock will move between locations.')) return;
    const toastId = toast.loading('Validating...');
    try {
      await validateTransfer(id);
      toast.success('Transfer validated — stock moved!', { id: toastId });
      fetchAll();
    } catch (err) {
      toast.error(
        err.response?.data?.error ?? 'Validation failed. Not enough stock?',
        { id: toastId }
      );
    }
  }

  // Helper to get location display name
  function getLocationName(id) {
    const loc = locations.find((l) => l.id === id);
    return loc ? `${loc.warehouseName} — ${loc.name}` : id ?? '—';
  }

  const columns = [
    {
      key: 'id',
      label: 'Transfer ID',
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
      key: 'from',
      label: 'From',
      render: (row) => (
        <span style={{ fontSize: '13px' }}>
          {getLocationName(row.fromLocationId)}
        </span>
      ),
    },
    {
      key: 'to',
      label: 'To',
      render: (row) => (
        <span style={{ fontSize: '13px' }}>
          {getLocationName(row.toLocationId)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'lines',
      label: 'Items',
      render: (row) => `${row.lines?.length ?? 0} item(s)`,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status !== 'done' && row.status !== 'canceled' && (
            <button
              onClick={() => handleValidate(row.id)}
              style={btnStyle('var(--color-success)')}
            >
              ✓ Validate
            </button>
          )}
          {row.status === 'done' && (
            <span style={{ fontSize: '12px', color: 'var(--color-gray-400)' }}>
              ✓ Done
            </span>
          )}
          {row.status === 'canceled' && (
            <span style={{ fontSize: '12px', color: 'var(--color-gray-400)' }}>
              Cancelled
            </span>
          )}
        </div>
      ),
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
            Transfers
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-gray-400)',
              marginTop: '4px',
            }}
          >
            Move stock between warehouses and locations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={btnStyle('var(--color-primary)')}
        >
          + New Transfer
        </button>
      </div>

      {/* Status Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        {['', 'draft', 'waiting', 'ready', 'done', 'canceled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              border: '1px solid',
              borderColor:
                statusFilter === s
                  ? 'var(--color-primary)'
                  : 'var(--color-gray-200)',
              background:
                statusFilter === s ? 'var(--color-primary-light)' : '#fff',
              color:
                statusFilter === s
                  ? 'var(--color-primary)'
                  : 'var(--color-gray-600)',
              transition: 'all 0.15s',
            }}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Transfers Table */}
      <Table
        columns={columns}
        data={transfers}
        loading={loading}
        emptyMessage="No transfers yet. Click '+ New Transfer' to move stock between locations."
      />

      {/* Create Transfer Modal */}
      {showModal && (
        <Modal
          title="New Transfer"
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          width="560px"
        >
          <form onSubmit={handleCreate}>

            {/* From Location */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>From Location</label>
              <select
                value={form.fromLocationId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fromLocationId: e.target.value }))
                }
                style={selectStyle(errors.fromLocationId)}
              >
                <option value="">Where is stock coming from?</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.warehouseName} — {l.name}
                  </option>
                ))}
              </select>
              {errors.fromLocationId && (
                <span style={errorStyle}>{errors.fromLocationId}</span>
              )}
            </div>

            {/* Arrow indicator */}
            <div style={{ textAlign: 'center', fontSize: '20px', marginBottom: '16px', color: 'var(--color-gray-400)' }}>
              ↓
            </div>

            {/* To Location */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>To Location</label>
              <select
                value={form.toLocationId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, toLocationId: e.target.value }))
                }
                style={selectStyle(errors.toLocationId)}
              >
                <option value="">Where is stock going?</option>
                {locations.map((l) => (
                  <option
                    key={l.id}
                    value={l.id}
                    disabled={l.id === form.fromLocationId}
                  >
                    {l.warehouseName} — {l.name}
                    {l.id === form.fromLocationId ? ' (same as source)' : ''}
                  </option>
                ))}
              </select>
              {errors.toLocationId && (
                <span style={errorStyle}>{errors.toLocationId}</span>
              )}
            </div>

            {/* Total stock note */}
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#166534',
              }}
            >
              ℹ️ Total stock unchanged — only the location will be updated.
            </div>

            {/* Product Lines */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <label style={labelStyle}>Product Lines</label>
                <button
                  type="button"
                  onClick={addLine}
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-primary)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  + Add Line
                </button>
              </div>

              {form.lines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Product selector */}
                  <div style={{ flex: 2 }}>
                    <select
                      value={line.productId}
                      onChange={(e) =>
                        updateLine(i, 'productId', e.target.value)
                      }
                      style={selectStyle(errors[`line_${i}_product`])}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                    {errors[`line_${i}_product`] && (
                      <span style={errorStyle}>
                        {errors[`line_${i}_product`]}
                      </span>
                    )}
                  </div>

                  {/* Quantity input */}
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={line.quantity}
                      min="0.01"
                      step="any"
                      placeholder="Qty"
                      onChange={(e) =>
                        updateLine(i, 'quantity', e.target.value)
                      }
                      style={{
                        padding: '8px',
                        border: `1px solid ${
                          errors[`line_${i}_qty`]
                            ? 'var(--color-danger)'
                            : 'var(--color-gray-200)'
                        }`,
                        borderRadius: 'var(--radius-md)',
                        width: '100%',
                        fontSize: '14px',
                      }}
                    />
                    {errors[`line_${i}_qty`] && (
                      <span style={errorStyle}>{errors[`line_${i}_qty`]}</span>
                    )}
                  </div>

                  {/* Remove line */}
                  {form.lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: 'var(--color-danger)',
                        fontSize: '20px',
                        cursor: 'pointer',
                        paddingTop: '4px',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <FormInput
              label="Notes (optional)"
              name="notes"
              placeholder="e.g. Moving to production floor for processing"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
            />

            {/* Submit */}
            <button
              type="submit"
              style={{
                ...btnStyle('var(--color-primary)'),
                width: '100%',
                padding: '11px',
                fontSize: '14px',
                marginTop: '4px',
              }}
            >
              Create Transfer
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