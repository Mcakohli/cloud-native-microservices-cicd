'use client';

import { useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setLoading(true);
    setStatus('Submitting job to queue...');

    try {
      const response = await fetch('/api/jobs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Task triggered from Web UI' }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setStatus(`Success! Job enqueued with ID: ${data.id || 'Processed'}`);
    } catch (err: any) {
      setStatus(`Error submitting job: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Cloud Engineering Task Processor</h1>
      <p>Submit a task to the NestJS backend, enqueue in Redis, and watch the worker process it.</p>
      
      <button 
        onClick={handleSubmit} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        {loading ? 'Processing...' : 'Submit Job'}
      </button>

      {status && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          borderRadius: '4px',
          backgroundColor: status.startsWith('Success') ? '#e6fffa' : '#ffebe6',
          color: status.startsWith('Success') ? '#006d5b' : '#c53030',
          border: `1px solid ${status.startsWith('Success') ? '#79d2b9' : '#feb2b2'}`
        }}>
          {status}
        </div>
      )}
    </main>
  );
}