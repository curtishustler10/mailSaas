'use client';

import { useState } from 'react';

export default function TestBlockPage() {
  const [loading, setLoading] = useState(false);
  const [block, setBlock] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createTestBlock = async (type: 'countdown' | 'stock') => {
    setLoading(true);
    setError(null);
    setBlock(null);

    try {
      const endpoint = type === 'stock' ? '/api/blocks/test-stock' : '/api/blocks/test';
      const response = await fetch(endpoint, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setBlock(data.block);
      } else {
        setError(data.error || 'Failed to create test block');
      }
    } catch (err) {
      setError('Failed to create test block');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Test Block Renderer
      </h1>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => createTestBlock('countdown')}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
          }}
        >
          {loading ? 'Creating...' : 'Create Countdown Block'}
        </button>
        <button
          onClick={() => createTestBlock('stock')}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#6c757d' : '#28a745',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
          }}
        >
          {loading ? 'Creating...' : 'Create Stock Block'}
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '4px',
            border: '1px solid #f5c6cb',
          }}
        >
          {error}
        </div>
      )}

      {block && (
        <div
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '1.5rem',
            borderRadius: '4px',
            border: '1px solid #c3e6cb',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            ✅ Test Block Created!
          </h2>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Block ID:</strong> <code>{block.id}</code>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Name:</strong> {block.name}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Type:</strong> {block.type}
          </div>
          {block.product && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Product:</strong> {block.product.title} (ID: {block.product.id})
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <strong>Render URL:</strong>{' '}
            <a
              href={block.renderUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#007bff', textDecoration: 'underline' }}
            >
              {block.renderUrl}
            </a>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <strong>Preview:</strong>
            <div
              style={{
                marginTop: '0.5rem',
                border: '2px solid #c3e6cb',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <img
                src={`${block.renderUrl}&t=${Date.now()}`}
                alt="Block preview"
                style={{ width: '100%', display: 'block' }}
                key={Date.now()}
              />
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '4px',
          marginTop: '2rem',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
          About This Test
        </h3>
        <p style={{ marginBottom: '0.5rem', color: '#6c757d' }}>
          <strong>Countdown Block:</strong> Creates a block with a 24-hour timer.
        </p>
        <p style={{ marginBottom: '0.5rem', color: '#6c757d' }}>
          <strong>Stock Block:</strong> Fetches real inventory from your first Shopify product and displays dynamic copy based on stock levels.
        </p>
        <p style={{ color: '#6c757d' }}>
          Preview mode (?preview=1) disables caching and analytics tracking.
        </p>
      </div>
    </div>
  );
}
