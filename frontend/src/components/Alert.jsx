import React from 'react';

export default function Alert({ type = 'error', message }) {
  if (!message) return null;

  const isError = type === 'error';
  const bgColor = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)';
  const borderColor = isError ? '#ef4444' : '#22c55e';
  const textColor = isError ? '#fca5a5' : '#86efac';

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
        fontSize: '0.875rem',
        marginBottom: '1rem',
        textAlign: 'left',
        wordBreak: 'break-word',
      }}
    >
      {message}
    </div>
  );
}
