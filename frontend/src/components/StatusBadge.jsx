const STATUS_STYLES = {
  draft:    { bg: 'var(--color-gray-100)', color: 'var(--color-gray-600)' },
  waiting:  { bg: '#FEF3C7', color: '#92400E' },
  ready:    { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  done:     { bg: '#D1FAE5', color: '#065F46' },
  canceled: { bg: '#FEE2E2', color: '#991B1B' },
  low_stock:   { bg: '#FEF3C7', color: '#92400E' },
  out_of_stock: { bg: '#FEE2E2', color: '#991B1B' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      background: style.bg,
      color: style.color,
      textTransform: 'capitalize',
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
