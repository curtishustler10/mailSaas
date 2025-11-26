'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Block {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  shopDomain: string;
}

export default function BlocksPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const response = await fetch('/api/blocks');
      if (!response.ok) throw new Error('Failed to fetch blocks');
      const data = await response.json();
      setBlocks(data.blocks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return;

    try {
      const response = await fetch(`/api/blocks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete block');

      // Refresh the list
      fetchBlocks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete block');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading blocks...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Blocks</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href="/blocks/test"
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Test Renderer
          </Link>
          <Link
            href="/blocks/new"
            style={{
              backgroundColor: '#0070f3',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            New Block
          </Link>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fee',
            color: '#c00',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      {blocks.length === 0 ? (
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '3rem',
            textAlign: 'center',
            borderRadius: '8px',
          }}
        >
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>No blocks yet</p>
          <Link
            href="/blocks/new"
            style={{
              color: '#0070f3',
              textDecoration: 'underline',
            }}
          >
            Create your first block
          </Link>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>
                  Name
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>
                  Type
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>
                  Shop
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>
                  Created
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #dee2e6' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '1rem' }}>
                    <Link
                      href={`/blocks/${block.id}`}
                      style={{ color: '#0070f3', textDecoration: 'none', fontWeight: '500' }}
                    >
                      {block.name}
                    </Link>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        backgroundColor: '#e7f3ff',
                        color: '#0070f3',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                      }}
                    >
                      {block.type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#6c757d' }}>{block.shopDomain}</td>
                  <td style={{ padding: '1rem', color: '#6c757d' }}>
                    {new Date(block.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        href={`/blocks/${block.id}`}
                        style={{
                          color: '#0070f3',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/blocks/${block.id}/analytics`}
                        style={{
                          color: '#28a745',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        Analytics
                      </Link>
                      <Link
                        href={`/api/render/${block.id}?preview=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#17a2b8',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(block.id)}
                        style={{
                          color: '#dc3545',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
