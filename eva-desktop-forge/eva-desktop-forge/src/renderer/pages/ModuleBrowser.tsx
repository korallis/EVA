import React from 'react';

const ModuleBrowser: React.FC = () => {
  return (
    <div className="page-container">
      <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
        <h1 className="text-hero">Module Browser</h1>
        <p className="text-body" style={{ marginTop: 'var(--space-lg)', opacity: 0.8 }}>
          Explore modules, weapons, and equipment
        </p>
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <button className="btn btn-primary">Coming Soon</button>
        </div>
      </div>
    </div>
  );
};

export default ModuleBrowser;