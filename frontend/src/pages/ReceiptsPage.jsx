import { useEffect, useState } from 'react';
import { getReceipts, createReceipt, validateReceipt, cancelReceipt } from '../api/receipts';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import FormInput from '../components/FormInput';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    supplier: '',
    destinationLocationId: '',
    notes: '',
    lines: [{ productId: '', quantity: 1 }],
  });
  const [errors, setErrors] = useState({});

  function fetchAll() {
    setLoading(true);
    Promise.all([
      getReceipts(statusFilter ? { status: statusFilter } : {}),
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
      .then(([rec, prod, locs]) => {
        setReceipts(rec.data);
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
      supplier: '',
      destinationLocationId: '',
      notes: '',
      lines: [{ productId: '', quantity: 1 }],
    });
    setErrors({});
  }

  async function handleCreate(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.supplier.trim()) newErrors.supplier = 'Supplier name is required';
    if (!form.destinationLocationId)
      newErrors.destinationLocationId = 'Please select a destination location';
    form.lines.forEach((line, i) => {
      if (!line.productId) newErrors[`line_${i}_product`] = 'Select a product';
      if (!line.quantity || line.quantity <= 0)
        newErrors[`line_${i}_qty`] = 'Quantity must be greater than 0';
    });
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    const toastId = toast.loading('Creating receipt...');
    try {
      await createReceipt(form);
      toast.success('Receipt created!', { id: toastId });
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
        toast.error(err.response?.data?.error ?? 'Failed to create receipt');
    }
  }

  async function handleValidate(id) {
    if (!window.confirm('Validate this receipt? Stock will increase.')) return;
    const toastId = toast.loading('Validating...');
    try {
      await validateReceipt(id);
      toast.success('Receipt validated — stock increased!', { id: toastId });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Validation failed', { id: toastId });
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this receipt?')) return;
    const toastId = toast.loading('Cancelling...');
    try {
      await cancelReceipt(id);
      toast.success('Receipt cancelled.', { id: toastId });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Cancel failed', { id: toastId });
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'Receipt ID',
      render: (row) => (
        <code style={{ fontSize: '11px', background: 'var(--color-gray-100)', padding: '2px 6px', borderRadius: '4px' }}>
          {row.id.slice(0, 8)}…
        </code>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (row) => (
        <span style={{ fontWeight: '500' }}>{row.supplierId ?? row.supplier ?? '—'}</span>
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
            <>
              <button onClick={() => handleValidate(row.id)} style={btnStyle('var(--color-success)')}>
                ✓ Validate
              </button>
              <button onClick={() => handleCancel(row.id)} style={btnStyle('var(--color-danger)')}>
                ✕ Cancel
              </button>
            </>
          )}
          {row.status === 'done' && (
            <span style={{ fontSize: '12px', color: 'var(--color-gray-400)' }}>✓ Done</span>
          )}
          {row.status === 'canceled' && (
            <span style={{ fontSize: '12px', color: 'var(--color-gray-400)' }}>Cancelled</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Receipts</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-gray-400)', marginTop: '4px' }}>
            Manage incoming stock from vendors
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={btnStyle('var(--color-primary)')}>
          + New Receipt
        </button>
      </div>

      {/* Status Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
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
              borderColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-gray-200)',
              background: statusFilter === s ? 'var(--color-primary-light)' : '#fff',
              color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-gray-600)',
              transition: 'all 0.15s',
            }}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Receipts Table */}
      <Table
        columns={columns}
        data={receipts}
        loading={loading}
        emptyMessage="No receipts yet. Click '+ New Receipt' to create your first one."
      />

      {/* Create Receipt Modal */}
      {showModal && (
        <Modal
          title="New Receipt"
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          width="560px"
        >
          <form onSubmit={handleCreate}>
            {/* Supplier */}
            <FormInput
              label="Supplier Name"
              name="supplier"
              placeholder="e.g. Tata Steel Ltd"
              value={form.supplier}
              onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
              error={errors.supplier}
            />

            {/* Destination Location */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Destination Location</label>
              <select
                value={form.destinationLocationId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, destinationLocationId: e.target.value }))
                }
                style={selectStyle(errors.destinationLocationId)}
              >
                <option value="">Select a location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.warehouseName} — {l.name}
                  </option>
                ))}
              </select>
              {errors.destinationLocationId && (
                <span style={errorStyle}>{errors.destinationLocationId}</span>
              )}
            </div>

            {/* Product Lines */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={labelStyle}>Product Lines</label>
                <button
                  type="button"
                  onClick={addLine}
                  style={{ fontSize: '12px', color: 'var(--color-primary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  + Add Line
                </button>
              </div>

              {form.lines.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  {/* Product selector */}
                  <div style={{ flex: 2 }}>
                    <select
                      value={line.productId}
                      onChange={(e) => updateLine(i, 'productId', e.target.value)}
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
                      <span style={errorStyle}>{errors[`line_${i}_product`]}</span>
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
                      onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                      style={{
                        padding: '8px',
                        border: `1px solid ${errors[`line_${i}_qty`] ? 'var(--color-danger)' : 'var(--color-gray-200)'}`,
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
                      style={{ border: 'none', background: 'none', color: 'var(--color-danger)', fontSize: '20px', cursor: 'pointer', paddingTop: '4px', lineHeight: 1 }}
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
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />

            {/* Submit */}
            <button
              type="submit"
              style={{ ...btnStyle('var(--color-primary)'), width: '100%', padding: '11px', fontSize: '14px', marginTop: '4px' }}
            >
              Create Receipt
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
