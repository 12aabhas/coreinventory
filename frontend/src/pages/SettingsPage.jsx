import { useEffect, useState } from 'react';
import { getWarehouses, createWarehouse, createLocation } from '../api/warehouses';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWarehouse, setNewWarehouse] = useState('');
  const [addingWarehouse, setAddingWarehouse] = useState(false);
  const [newLocations, setNewLocations] = useState({});
  const [addingLocation, setAddingLocation] = useState({});

  function fetchWarehouses() {
    setLoading(true);
    getWarehouses()
      .then((res) => setWarehouses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchWarehouses();
  }, []);

  async function handleAddWarehouse(e) {
    e.preventDefault();
    if (!newWarehouse.trim()) return;
    setAddingWarehouse(true);
    const toastId = toast.loading('Adding warehouse...');
    try {
      await createWarehouse({ name: newWarehouse.trim() });
      toast.success('Warehouse added!', { id: toastId });
      setNewWarehouse('');
      fetchWarehouses();
    } catch (err) {
      toast.error(
        err.response?.data?.error ?? 'Failed to add warehouse',
        { id: toastId }
      );
    } finally {
      setAddingWarehouse(false);
    }
  }

  async function handleAddLocation(warehouseId) {
    const name = newLocations[warehouseId];
    if (!name?.trim()) return;
    setAddingLocation((p) => ({ ...p, [warehouseId]: true }));
    const toastId = toast.loading('Adding location...');
    try {
      await createLocation(warehouseId, { name: name.trim() });
      toast.success('Location added!', { id: toastId });
      setNewLocations((p) => ({ ...p, [warehouseId]: '' }));
      fetchWarehouses();
    } catch (err) {
      toast.error(
        err.response?.data?.error ?? 'Failed to add location',
        { id: toastId }
      );
    } finally {
      setAddingLocation((p) => ({ ...p, [warehouseId]: false }));
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>
          Settings
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-gray-400)',
            marginTop: '4px',
          }}
        >
          Manage warehouses and their storage locations
        </p>
      </div>

      {/* Add Warehouse Card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--color-gray-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '24px',
          maxWidth: '520px',
        }}
      >
        <h2
          style={{
            fontSize: '15px',
            fontWeight: '600',
            marginBottom: '4px',
            margin: 0,
          }}
        >
          🏭 Add New Warehouse
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-gray-400)',
            marginBottom: '14px',
            marginTop: '4px',
          }}
        >
          Create a new warehouse to store inventory
        </p>
        <form
          onSubmit={handleAddWarehouse}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            value={newWarehouse}
            onChange={(e) => setNewWarehouse(e.target.value)}
            placeholder="e.g. Main Warehouse, Production Floor"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            disabled={addingWarehouse || !newWarehouse.trim()}
            style={{
              padding: '8px 18px',
              background: !newWarehouse.trim()
                ? 'var(--color-gray-200)'
                : 'var(--color-primary)',
              color: !newWarehouse.trim() ? 'var(--color-gray-400)' : '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: !newWarehouse.trim() ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.15s',
            }}
          >
            {addingWarehouse ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      {/* Warehouse List */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--color-gray-400)',
            fontSize: '14px',
          }}
        >
          Loading warehouses...
        </div>
      ) : warehouses.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            border: '2px dashed var(--color-gray-200)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-gray-400)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏭</div>
          <p style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
            No warehouses yet
          </p>
          <p style={{ fontSize: '13px' }}>
            Add your first warehouse above to get started.
          </p>
        </div>
      ) : (
        <div>
          <h2
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-gray-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            {warehouses.length} Warehouse{warehouses.length !== 1 ? 's' : ''}
          </h2>

          {warehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              style={{
                background: '#fff',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                marginBottom: '12px',
              }}
            >
              {/* Warehouse name + location count */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  🏭 {warehouse.name}
                </h2>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-gray-400)',
                    background: 'var(--color-gray-100)',
                    padding: '2px 10px',
                    borderRadius: '20px',
                  }}
                >
                  {warehouse.locations?.length ?? 0} location
                  {(warehouse.locations?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Location list */}
              <div style={{ marginBottom: '14px' }}>
                {!warehouse.locations || warehouse.locations.length === 0 ? (
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-gray-400)',
                      fontStyle: 'italic',
                    }}
                  >
                    No locations yet — add one below.
                  </p>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    {warehouse.locations.map((loc) => (
                      <div
                        key={loc.id}
                        style={{
                          background: 'var(--color-gray-50)',
                          border: '1px solid var(--color-gray-200)',
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>📍</span>
                        <span>{loc.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div
                style={{
                  borderTop: '1px solid var(--color-gray-100)',
                  marginBottom: '14px',
                }}
              />

              {/* Add location input */}
              <div>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'var(--color-gray-500)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  Add Location
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={newLocations[warehouse.id] ?? ''}
                    onChange={(e) =>
                      setNewLocations((p) => ({
                        ...p,
                        [warehouse.id]: e.target.value,
                      }))
                    }
                    placeholder="e.g. Rack A, Shelf B2, Cold Storage"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLocation(warehouse.id);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      border: '1px solid var(--color-gray-200)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                    }}
                  />
                  <button
                    onClick={() => handleAddLocation(warehouse.id)}
                    disabled={
                      addingLocation[warehouse.id] ||
                      !newLocations[warehouse.id]?.trim()
                    }
                    style={{
                      padding: '7px 16px',
                      background: !newLocations[warehouse.id]?.trim()
                        ? 'var(--color-gray-200)'
                        : 'var(--color-primary)',
                      color: !newLocations[warehouse.id]?.trim()
                        ? 'var(--color-gray-400)'
                        : '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: !newLocations[warehouse.id]?.trim()
                        ? 'not-allowed'
                        : 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.15s',
                    }}
                  >
                    {addingLocation[warehouse.id] ? 'Adding...' : '+ Location'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}