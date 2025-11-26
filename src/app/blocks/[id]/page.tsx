'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Block {
  id: string;
  name: string;
  type: string;
  configJson: any;
  shop: {
    id: string;
    shopifyDomain: string;
  };
}

const BLOCK_TYPES = ['HERO', 'COUNTDOWN', 'STOCK', 'RECOMMENDATION'] as const;

export default function EditBlockPage() {
  const router = useRouter();
  const params = useParams();
  const blockId = params.id as string;

  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState<typeof BLOCK_TYPES[number]>('HERO');
  const [configJsonText, setConfigJsonText] = useState('{}');

  useEffect(() => {
    fetchBlock();
  }, [blockId]);

  const fetchBlock = async () => {
    try {
      const response = await fetch(`/api/blocks/${blockId}`);
      if (!response.ok) throw new Error('Failed to fetch block');

      const data = await response.json();
      setBlock(data.block);
      setName(data.block.name);
      setType(data.block.type);
      setConfigJsonText(JSON.stringify(data.block.configJson, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch block');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (!name || !type) {
      setError('Please fill in all required fields');
      setSaving(false);
      return;
    }

    // Validate JSON
    let configJson;
    try {
      configJson = JSON.parse(configJsonText);
    } catch (err) {
      setError('Invalid JSON in config');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/blocks/${blockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          configJson,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update block');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update block');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this block?')) return;

    try {
      const response = await fetch(`/api/blocks/${blockId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete block');

      router.push('/blocks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete block');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading block...</p>
      </div>
    );
  }

  if (!block) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Block not found</p>
        <Link href="/blocks" style={{ color: '#0070f3' }}>
          Back to Blocks
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/blocks"
          style={{ color: '#0070f3', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          ← Back to Blocks
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Edit Block</h1>
        <button
          onClick={handleDelete}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Delete Block
        </button>
      </div>

      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '4px',
        }}
      >
        <p style={{ margin: 0, color: '#6c757d', fontSize: '0.875rem' }}>
          <strong>Shop:</strong> {block.shop.shopifyDomain}
        </p>
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

      {success && (
        <div
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '4px',
          }}
        >
          Block updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="name"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
          >
            Block Name <span style={{ color: '#c00' }}>*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="type"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
          >
            Block Type <span style={{ color: '#c00' }}>*</span>
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof BLOCK_TYPES[number])}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          >
            {BLOCK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="configJson"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
          >
            Configuration (JSON)
          </label>
          <textarea
            id="configJson"
            value={configJsonText}
            onChange={(e) => setConfigJsonText(e.target.value)}
            rows={15}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
            }}
          />
          <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
            Edit the JSON configuration for this block. Make sure it's valid JSON.
          </small>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            backgroundColor: saving ? '#999' : '#0070f3',
            color: 'white',
            padding: '0.75rem',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
