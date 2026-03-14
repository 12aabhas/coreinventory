import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/products', label: '📦 Products' },
  { to: '/receipts', label: '📥 Receipts' },
  { to: '/deliveries', label: '📤 Deliveries' },
  { to: '/transfers', label: '🔄 Transfers' },
  { to: '/adjustments', label: '⚖️ Adjustments' },
  { to: '/move-history', label: '📋 Move History' },
  { to: '/settings', label: '⚙️ Settings' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 'var(--sidebar-width)', background: '#1E293B', color: '#fff',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0,
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '18px', fontWeight: '700' }}>📦 CoreInventory</span>
        </div>
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'block', padding: '10px 16px', fontSize: '14px',
              color: isActive ? '#fff' : '#94A3B8',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
            })}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '8px' }}>
            {user.name ?? 'User'}
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius-md)', background: 'transparent', color: '#94A3B8',
            fontSize: '13px', cursor: 'pointer',
          }}>
            Log out
          </button>
        </div>
      </aside>
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
