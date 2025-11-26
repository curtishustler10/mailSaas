'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Shop {
  id: string;
  shopifyDomain: string;
  createdAt: string;
}

interface ShopTestResult {
  shopId: string;
  loading: boolean;
  result?: any;
  error?: string;
}

export default function ShopsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [useCustomApp, setUseCustomApp] = useState(true); // Default to custom app
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ShopTestResult>>({});

  useEffect(() => {
    // Check for success/error messages from OAuth callback
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('Shop connected successfully!');
      // Clear query params
      router.replace('/shops');
    }
    if (searchParams.get('error') === 'oauth_failed') {
      setError('Failed to connect shop. Please try again.');
      router.replace('/shops');
    }

    // Fetch existing shops
    fetchShops();
  }, [searchParams, router]);

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops');
      if (response.ok) {
        const data = await response.json();
        setShops(data.shops || []);
      }
    } catch (err) {
      console.error('Error fetching shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (shopId: string) => {
    setTestResults((prev) => ({
      ...prev,
      [shopId]: { shopId, loading: true },
    }));

    try {
      const response = await fetch(`/api/shopify/test?shopId=${shopId}`);
      const data = await response.json();

      if (response.ok) {
        setTestResults((prev) => ({
          ...prev,
          [shopId]: { shopId, loading: false, result: data },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [shopId]: { shopId, loading: false, error: data.error || 'Test failed' },
        }));
      }
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [shopId]: { shopId, loading: false, error: 'Failed to test connection' },
      }));
    }
  };

  const handleConnectShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!shopDomain.trim()) {
      setError('Please enter a shop domain');
      return;
    }

    // Normalize domain - ensure it ends with .myshopify.com
    let normalizedDomain = shopDomain.trim().toLowerCase();
    if (!normalizedDomain.includes('.')) {
      normalizedDomain = `${normalizedDomain}.myshopify.com`;
    } else if (!normalizedDomain.endsWith('.myshopify.com')) {
      setError('Domain must be a myshopify.com domain');
      return;
    }

    setConnecting(true);

    try {
      if (useCustomApp) {
        // Custom app - use direct access token
        if (!accessToken.trim()) {
          setError('Please enter an access token');
          setConnecting(false);
          return;
        }

        const response = await fetch('/api/shops/custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopDomain: normalizedDomain,
            accessToken: accessToken.trim(),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccessMessage('Shop connected successfully!');
          setShopDomain('');
          setAccessToken('');
          fetchShops();
        } else {
          setError(data.error || 'Failed to connect shop');
        }
        setConnecting(false);
      } else {
        // Partner app - use OAuth flow
        window.location.href = `/api/shopify/oauth?shop=${encodeURIComponent(normalizedDomain)}`;
      }
    } catch (err) {
      setError('Failed to initiate connection');
      setConnecting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Connected Shops
      </h1>

      {/* Success/Error Messages */}
      {successMessage && (
        <div
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '4px',
            border: '1px solid #c3e6cb',
          }}
        >
          {successMessage}
        </div>
      )}

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

      {/* Connect New Shop Form */}
      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Connect a New Shop
        </h2>

        {/* App Type Selection */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              name="appType"
              checked={useCustomApp}
              onChange={() => setUseCustomApp(true)}
              style={{ marginRight: '0.5rem' }}
            />
            <span>Custom App (Direct Token)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              name="appType"
              checked={!useCustomApp}
              onChange={() => setUseCustomApp(false)}
              style={{ marginRight: '0.5rem' }}
            />
            <span>Partner App (OAuth)</span>
          </label>
        </div>

        <form onSubmit={handleConnectShop}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="shopDomain"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
              }}
            >
              Shop Domain
            </label>
            <input
              type="text"
              id="shopDomain"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="mystore.myshopify.com or 2xnb3k-rq"
              disabled={connecting}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
            <small style={{ color: '#6c757d', marginTop: '0.25rem', display: 'block' }}>
              Enter your Shopify store domain (e.g., mystore.myshopify.com or just mystore)
            </small>
          </div>

          {useCustomApp && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="accessToken"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                }}
              >
                Admin API Access Token
              </label>
              <input
                type="password"
                id="accessToken"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx"
                disabled={connecting}
                required={useCustomApp}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'monospace',
                }}
              />
              <small style={{ color: '#6c757d', marginTop: '0.25rem', display: 'block' }}>
                Get this from: Admin → Settings → Apps and sales channels → Develop apps → [Your App] → API credentials
              </small>
            </div>
          )}

          <button
            type="submit"
            disabled={connecting}
            style={{
              backgroundColor: connecting ? '#6c757d' : '#007bff',
              color: 'white',
              padding: '0.5rem 1.5rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: connecting ? 'not-allowed' : 'pointer',
            }}
          >
            {connecting ? 'Connecting...' : useCustomApp ? 'Add Custom App' : 'Connect via OAuth'}
          </button>
        </form>
      </div>

      {/* Existing Shops List */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Your Shops
        </h2>
        {loading ? (
          <p>Loading shops...</p>
        ) : shops.length === 0 ? (
          <p style={{ color: '#6c757d' }}>
            No shops connected yet. Connect your first shop above.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {shops.map((shop) => {
              const testResult = testResults[shop.id];
              return (
                <li
                  key={shop.id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '1.1rem' }}>{shop.shopifyDomain}</strong>
                      <p style={{ color: '#6c757d', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                        Connected on {new Date(shop.createdAt).toLocaleDateString()}
                      </p>

                      {/* Test Result */}
                      {testResult && (
                        <div style={{ marginTop: '0.5rem' }}>
                          {testResult.loading && (
                            <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>Testing connection...</p>
                          )}
                          {testResult.error && (
                            <p style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                              ❌ {testResult.error}
                            </p>
                          )}
                          {testResult.result && (
                            <div style={{ fontSize: '0.875rem', color: '#28a745' }}>
                              <p>✅ Connection successful!</p>
                              <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d' }}>
                                Shop: {testResult.result.shop?.name} ({testResult.result.shop?.plan_name})
                              </p>
                              <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d' }}>
                                Products found: {testResult.result.products?.length || 0}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleTestConnection(shop.id)}
                        disabled={testResult?.loading}
                        style={{
                          backgroundColor: testResult?.loading ? '#6c757d' : '#17a2b8',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          cursor: testResult?.loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {testResult?.loading ? 'Testing...' : 'Test'}
                      </button>
                      <span
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                        }}
                      >
                        Connected
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
