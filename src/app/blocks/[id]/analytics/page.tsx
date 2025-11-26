'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface AnalyticsData {
  totalRenders: number;
  last24HoursRenders: number;
  rendersByDate: Array<{
    date: string;
    count: number;
  }>;
}

export default function BlockAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const blockId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [blockId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/blocks/${blockId}/analytics`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: '#666' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
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
        <Link
          href="/blocks"
          style={{
            color: '#0070f3',
            textDecoration: 'none',
          }}
        >
          ← Back to Blocks
        </Link>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Find max count for chart scaling
  const maxCount = Math.max(...analytics.rendersByDate.map((d) => d.count), 1);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/blocks"
          style={{
            color: '#0070f3',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          ← Back to Blocks
        </Link>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Block Analytics
      </h1>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>
            Total Renders
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#212529' }}>
            {analytics.totalRenders.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>
            Last 24 Hours
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0070f3' }}>
            {analytics.last24HoursRenders.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Renders Over Time (Last 30 Days)
        </h2>

        {analytics.rendersByDate.length === 0 ? (
          <p style={{ color: '#6c757d', textAlign: 'center', padding: '2rem' }}>
            No render data available yet.
          </p>
        ) : (
          <div style={{ width: '100%' }}>
            {/* Simple bar chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {analytics.rendersByDate.map((item) => {
                const percentage = (item.count / maxCount) * 100;
                const date = new Date(item.date);
                const formattedDate = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={item.date}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <div
                      style={{
                        width: '80px',
                        fontSize: '0.875rem',
                        color: '#6c757d',
                        flexShrink: 0,
                      }}
                    >
                      {formattedDate}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: '32px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: '#0070f3',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '0.5rem',
                          transition: 'width 0.3s ease',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: percentage > 20 ? '#fff' : 'transparent',
                          }}
                        >
                          {item.count}
                        </span>
                      </div>
                      {percentage <= 20 && (
                        <span
                          style={{
                            position: 'absolute',
                            left: `calc(${percentage}% + 0.5rem)`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#495057',
                          }}
                        >
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Block Info */}
      <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#6c757d' }}>
        <p>Block ID: {blockId}</p>
        <p style={{ marginTop: '0.5rem' }}>
          Analytics are updated in real-time as your block is rendered.
        </p>
      </div>
    </div>
  );
}
