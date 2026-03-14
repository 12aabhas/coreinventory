import { useEffect, useState } from 'react';
import { getProducts, deleteProduct } from '../api/products';
import Table from '../components/Table';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', unitOfMeasure: 'unit' });
  const [errors, setErrors] = useState({});

  function fetchProducts() {
    setLoading(true);
    getProducts({ search })
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchProducts(); }, [search]);

  async function handleCreate(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (!form.sku.trim()) newErrors.sku = 'SKU is required';
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    try {
      await apiClient.post('/products', form);
      toast.success('Product created!');
      setShowModal(false);
      setForm({ name: '', sku: '', unitOfMeasure: 'unit' });
      fetchProducts();
    } catch (err) {
      toast.error('Failed to create product');
    }
  }

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category', render: row => row.category?.name ?? '—' },
    { key: 'unitOfMeasure', label: 'Unit' },
    {
      key: 'stock', label: 'Total Stock',
      render: row => {
        const total = row.stockItems?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
        return <strong>{total}</strong>;
      },
    },
    {
      key: 'actions', label: '',
      render: row => (
        <button onClick={async () => { await deleteProduct(row.id); toast.success('Deleted'); fetchProducts(); }}
          style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}>
          Delete
        </button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Products</h1>
        <button onClick={() => setShowModal(true)} style={{
          padding: '8px 16px', background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '500', cursor: 'pointer'
        }}>
          + Add Product
        </button>
      </div>

      <input
        placeholder="Search by name or SKU..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius-md)', width: '280px', marginBottom: '16px' }}
      />

      <Table columns={columns} data={products} loading={loading} emptyMessage="No products found." />

      {showModal && (
        <Modal title="Add New Product" onClose={() => { setShowModal(false); setErrors({}); }}>
          <form onSubmit={handleCreate}>
            <FormInput label="Product Name" name="name" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} error={errors.name} />
            <FormInput label="SKU / Code" name="sku" value={form.sku} onChange={e => setForm(p => ({...p, sku: e.target.value}))} error={errors.sku} />
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Unit of Measure</label>
              <select value={form.unitOfMeasure} onChange={e => setForm(p => ({...p, unitOfMeasure: e.target.value}))}
                style={{ padding: '8px 12px', border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius-md)', width: '100%' }}>
                <option value="unit">Unit</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="liter">Liter</option>
                <option value="box">Box</option>
              </select>
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '500', cursor: 'pointer' }}>
              Create Product
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
