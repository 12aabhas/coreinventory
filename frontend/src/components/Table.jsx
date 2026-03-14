export default function Table({ columns, data, loading, emptyMessage = 'No records found.' }) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gray-400)' }}>Loading...</div>;
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-gray-200)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--color-gray-50)' }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: '10px 16px', textAlign: 'left', fontSize: '12px',
                fontWeight: '600', color: 'var(--color-gray-600)',
                textTransform: 'uppercase', borderBottom: '1px solid var(--color-gray-200)',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-gray-400)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id ?? i} style={{ borderBottom: '1px solid var(--color-gray-200)' }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
