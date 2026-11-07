'use client';

import { useState } from 'react';

export default function Home() {
  const [taskName, setTaskName] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const submitJob = async () => {
    if (!taskName) return;
    setLoading(true);
    setStatusData(null);
    try {
      const res = await fetch(`${API_BASE}/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName }),
      });
      const data = await res.json();
      setJobId(data.jobId);
      pollStatus(data.jobId);
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setLoading(false);
    }
  };

  const pollStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${id}`);
        const data = await res.json();
        setStatusData(data);

        if (data.state === 'completed' || data.state === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling failed', err);
        clearInterval(interval);
      }
    }, 1000);
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Cloud Engineering Task Processor</h1>
      <p>Submit a task to the NestJS backend, enqueue in Redis, and watch the worker process it.</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="e.g. Generate Analytical Report"
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          onClick={submitJob}
          disabled={loading || !taskName}
          style={{ padding: '0.5rem 1rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Submitting...' : 'Submit Job'}
        </button>
      </div>

      {jobId && (
        <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '6px' }}>
          <h3>Job Details</h3>
          <p><strong>Job ID:</strong> {jobId}</p>
          <p>
            <strong>Status:</strong>{' '}
            <span style={{
              fontWeight: 'bold',
              color: statusData?.state === 'completed' ? 'green' : statusData?.state === 'active' ? 'orange' : '#333'
            }}>
              {statusData?.state ? statusData.state.toUpperCase() : 'QUEUED'}
            </span>
          </p>

          {statusData?.returnvalue && (
            <div style={{ marginTop: '1rem', background: '#e6fffa', padding: '0.75rem', borderRadius: '4px' }}>
              <strong>Result:</strong>
              <pre>{JSON.stringify(statusData.returnvalue, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </main>
  );
}