'use client';

import { useEffect, useState } from 'react';

interface EnvironmentVariableCheck {
  exists: boolean;
  [key: string]: boolean | string | undefined;
}

interface DiagnosticsData {
  timestamp: string;
  environment: string;
  checks: {
    environmentVariables: Record<string, EnvironmentVariableCheck>;
    expectedCallbackUrls: Record<string, string>;
    configurationFiles: Record<string, string>;
  };
  status: string;
  issues: string[];
  recommendations: string[];
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/diagnostics')
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errorData) => {
            throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load diagnostics');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
        <h1>Loading diagnostics...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ padding: '40px', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}
      >
        <h1 style={{ color: '#DC2626', marginBottom: '20px' }}>❌ Error loading diagnostics</h1>
        <div
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <p style={{ margin: 0, fontSize: '16px', color: '#991B1B' }}>{error}</p>
        </div>
        <div style={{ backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>Possible causes:</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>Environment variables are not configured in AWS Amplify</li>
            <li>The application failed to start due to missing configuration</li>
            <li>Network error connecting to the API</li>
          </ul>
          <h3>Next steps:</h3>
          <ol style={{ lineHeight: '1.8' }}>
            <li>Check AWS Amplify Console → Environment Variables</li>
            <li>View application logs in Amplify Console</li>
            <li>
              Try accessing the API directly:{' '}
              <a
                href="/api/auth/diagnostics"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4285F4' }}
              >
                /api/auth/diagnostics
              </a>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statusColor =
    data.status === 'healthy' ? '#16A34A' : data.status === 'warning' ? '#F59E0B' : '#DC2626';

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '10px' }}>🔍 Authentication Diagnostics</h1>
      <p style={{ color: '#6B7280', marginBottom: '30px' }}>
        Environment: <strong>{data.environment}</strong> | {data.timestamp}
      </p>

      {/* Status Badge */}
      <div
        style={{
          padding: '15px 20px',
          backgroundColor: statusColor,
          color: 'white',
          borderRadius: '8px',
          marginBottom: '30px',
          fontSize: '18px',
          fontWeight: 'bold',
        }}
      >
        Status: {data.status.toUpperCase()}
      </div>

      {/* Issues */}
      {data.issues.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#DC2626' }}>❌ Issues Found ({data.issues.length})</h2>
          <ul
            style={{
              backgroundColor: '#FEE2E2',
              padding: '20px',
              borderRadius: '8px',
              lineHeight: '1.8',
            }}
          >
            {data.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2563EB' }}>💡 Recommendations</h2>
          <ol
            style={{
              backgroundColor: '#DBEAFE',
              padding: '20px',
              borderRadius: '8px',
              lineHeight: '1.8',
            }}
          >
            {data.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Environment Variables */}
      <div style={{ marginBottom: '30px' }}>
        <h2>📋 Environment Variables</h2>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#E5E7EB' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #D1D5DB' }}>
                Variable
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #D1D5DB' }}>
                Status
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #D1D5DB' }}>
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.checks.environmentVariables).map(([key, value]) => (
              <tr key={key} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {key}
                </td>
                <td style={{ padding: '12px' }}>{value.exists ? '✅' : '❌'}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  {Object.entries(value)
                    .filter(([k]) => k !== 'exists')
                    .map(([k, v]) => (
                      <div key={k}>
                        {k}: {typeof v === 'boolean' ? (v ? '✅' : '❌') : String(v)}
                      </div>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expected Callback URLs */}
      <div style={{ marginBottom: '30px' }}>
        <h2>🔗 Expected OAuth Callback URLs</h2>
        <div style={{ backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '8px' }}>
          {Object.entries(data.checks.expectedCallbackUrls).map(([provider, url]) => (
            <div key={provider} style={{ marginBottom: '10px' }}>
              <strong style={{ textTransform: 'capitalize' }}>{provider}:</strong>
              <br />
              <code
                style={{
                  backgroundColor: '#E5E7EB',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '5px',
                  fontSize: '14px',
                }}
              >
                {url}
              </code>
            </div>
          ))}
          <p style={{ marginTop: '15px', fontSize: '14px', color: '#6B7280' }}>
            ⚠️ Make sure these URLs are configured in your Google Cloud Console under
            &quot;Authorized redirect URIs&quot;
          </p>
        </div>
      </div>

      {/* Raw Data */}
      <details style={{ marginTop: '30px' }}>
        <summary
          style={{ cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}
        >
          🔍 Raw JSON Data
        </summary>
        <pre
          style={{
            backgroundColor: '#1F2937',
            color: '#F9FAFB',
            padding: '20px',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '12px',
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
