import React, { useState } from 'react';
// Change from:
import { analyzePhoto } from '../services/apiService';

// To:
import { apiService } from '../services/apiService';

// And update the usage in handleAnalyze function:
const result = await apiService.analyzePhoto(maintenanceRequestId, imageUrl);

interface PhotoAnalysisProps {
  maintenanceRequestId: string;
}

const PhotoAnalysis: React.FC<PhotoAnalysisProps> = ({ maintenanceRequestId }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!imageUrl) {
      setError('Image URL is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await apiService.analyzePhoto(maintenanceRequestId, imageUrl);
      setAnalysisResult(result);
    } catch (err) {
      setError('Failed to analyze photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Photo Analysis</h3>
      <input
        type="text"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Enter image URL"
      />
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Photo'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {analysisResult && (
        <div>
          <h4>Analysis Result</h4>
          <p>
            <strong>Issues Detected:</strong>{' '}
            {analysisResult.issuesDetected.join(', ')}
          </p>
          <p>
            <strong>Severity:</strong> {analysisResult.severity}
          </p>
          <p>
            <strong>Recommendations:</strong> {analysisResult.recommendations}
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoAnalysis;
