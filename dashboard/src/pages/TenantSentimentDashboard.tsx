import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface SentimentTrend {
  date: string;
  score: number;
}

interface Issue {
  category: string;
  count: number;
}

interface Warning {
  issue: string;
  confidence: number;
}

const TenantSentimentDashboard: React.FC = () => {
  const [trends, setTrends] = useState<SentimentTrend[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Fetch sentiment trends
    axios.get<SentimentTrend[]>('/api/tenant/sentiment-trends').then(res => setTrends(Array.isArray(res.data) ? res.data : []));
    // Fetch common issues
    axios.get<Issue[]>('/api/tenant/common-issues').then(res => setIssues(Array.isArray(res.data) ? res.data : []));
    // Fetch early warnings
    axios.get<Warning[]>('/api/tenant/early-warnings').then(res => setWarnings(Array.isArray(res.data) ? res.data : []));
    // Fetch proactive suggestions
    axios.get<string[]>('/api/tenant/proactive-suggestions').then(res => setSuggestions(Array.isArray(res.data) ? res.data : []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tenant Sentiment Dashboard</h1>

      {/* Sentiment Trend Analysis */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Sentiment Trends</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[-1, 1]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Issue Tracking */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Common Issues</h2>
        {issues.length ? (
          <ul className="list-disc pl-5">
            {issues.map((i, idx) => (
              <li key={idx}>{i.category} — {i.count}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No issues found.</p>
        )}
      </div>

      {/* Early Warning System */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Early Warnings</h2>
        {warnings.length ? (
          <ul className="list-disc pl-5">
            {warnings.map((w, idx) => (
              <li key={idx}>{w.issue} — Confidence: {(w.confidence * 100).toFixed(1)}%</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No warnings at the moment.</p>
        )}
      </div>

      {/* Proactive Communication Suggestions */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Proactive Communication Suggestions</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          {suggestions.length ? (
            <ul className="list-disc pl-5">
              {suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No suggestions at this time.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantSentimentDashboard;
