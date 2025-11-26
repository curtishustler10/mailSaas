'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Shop {
  id: string;
  shopifyDomain: string;
}

const BLOCK_TYPES = ['HERO', 'COUNTDOWN', 'STOCK', 'RECOMMENDATION'] as const;

export default function NewBlockPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [shopId, setShopId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<typeof BLOCK_TYPES[number]>('HERO');

  // Type-specific config fields
  const [title, setTitle] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops');
      if (!response.ok) throw new Error('Failed to fetch shops');
      const data = await response.json();
      setShops(data.shops || []);
      if (data.shops?.length > 0) {
        setShopId(data.shops[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shops');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!shopId || !name || !type) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Build config based on type
    const configJson: Record<string, any> = {};

    if (type === 'HERO' && title) {
      configJson.title = title;
    } else if (type === 'COUNTDOWN' && (title || endDate)) {
      if (title) configJson.title = title;
      if (endDate) configJson.endDate = endDate;
    }

    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          name,
          type,
          configJson,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create block');
      }

      const data = await response.json();
      router.push(`/blocks/${data.block.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create block');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/blocks"
          style={{ color: '#0070f3', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          ← Back to Blocks
        </Link>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Create New Block
      </h1>

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

      {shops.length === 0 ? (
        <div
          style={{
            backgroundColor: '#fff3cd',
            color: '#856404',
            padding: '1rem',
            borderRadius: '4px',
          }}
        >
          <p>You need to connect a shop first before creating blocks.</p>
          <Link
            href="/shops"
            style={{ color: '#0070f3', textDecoration: 'underline' }}
          >
            Go to Shops
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="shopId"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
            >
              Shop <span style={{ color: '#c00' }}>*</span>
            </label>
            <select
              id="shopId"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            >
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.shopifyDomain}
                </option>
              ))}
            </select>
          </div>

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
              placeholder="My Block"
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

          {/* Type-specific fields */}
          {(type === 'HERO' || type === 'COUNTDOWN') && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="title"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
            </div>
          )}

          {type === 'COUNTDOWN' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="endDate"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
              >
                End Date
              </label>
              <input
                type="datetime-local"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#999' : '#0070f3',
              color: 'white',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create Block'}
          </button>
        </form>
      )}
    </div>
  );
}
