export default function FormInput({ label, name, type = 'text', value, onChange, error, placeholder, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
      {label && (
        <label htmlFor={name} style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-gray-600)' }}>
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          padding: '8px 12px',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-gray-200)'}`,
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          background: disabled ? 'var(--color-gray-100)' : '#fff',
        }}
      />
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-danger)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
