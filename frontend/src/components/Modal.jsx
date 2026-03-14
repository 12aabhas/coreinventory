export default function Modal({ title, onClose, children, width = '480px' }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        width, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--color-gray-200)',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600' }}>{title}</h2>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', fontSize: '20px',
            color: 'var(--color-gray-400)',
          }}>×</button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}
