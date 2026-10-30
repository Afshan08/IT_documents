import React from 'react';

export default function Alert({ type = 'error', message }) {
  if (!message) return null;

  const isError = type === 'error';
  const bgColor = isError ? '#fef2f2' : '#f0fdf4';
  const borderColor = isError ? '#fecaca' : '#bbf7d0';
  const textColor = isError ? '#991b1b' : '#166534';

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        borderRadius: '6px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
        fontSize: '0.875rem',
        marginBottom: '1rem',
        textAlign: 'left',
        wordBreak: 'break-word',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        {isError ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )}
      </div>
      <div>{message}</div>
    </div>
  );
}
