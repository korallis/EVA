import React from 'react';

const FittingRecommendations: React.FC = () => {
  return (
    <div className="page-container">
      <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
        <h1 className="text-hero">Fitting Assistant</h1>
        <p className="text-body" style={{ marginTop: 'var(--space-lg)', opacity: 0.8 }}>
          AI-powered fitting recommendations and optimization
        </p>
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <button className="btn btn-primary">Coming Soon</button>
        </div>
      </div>
    </div>
  );
};

export default FittingRecommendations;