import React, { useState, useEffect } from 'react';
import './StartupProgress.css';

interface StartupProgressProps {
  isVisible: boolean;
  onComplete?: () => void;
}

interface StartupSDEProgress {
  stage: 'checking' | 'downloading' | 'parsing' | 'initializing' | 'complete' | 'error';
  progress: number;
  message: string;
  isRequired: boolean;
  canSkip: boolean;
  error?: string;
}

const StartupProgress: React.FC<StartupProgressProps> = ({ isVisible, onComplete }) => {
  const [progress, setProgress] = useState<StartupSDEProgress | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [initialProgress, setInitialProgress] = useState(0);

  // Simulate initial progress while waiting for real data
  useEffect(() => {
    if (!isVisible || progress) return;

    const interval = setInterval(() => {
      setInitialProgress(prev => {
        if (prev >= 100) {
          // Auto-complete when reaching 100%
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 500);
          return 100;
        }
        const increment = prev < 80 ? Math.random() * 12 : Math.random() * 8;
        const newProgress = Math.min(prev + increment, 100);
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isVisible, progress]);

  useEffect(() => {
    if (!isVisible) return;

    // Listen for SDE progress updates
    const handleProgress = (progressData: StartupSDEProgress) => {
      setProgress(progressData);
      
      // Allow proceeding if not required or can skip
      if (!progressData.isRequired || progressData.canSkip) {
        setCanProceed(true);
      }
    };

    const handleComplete = (result: { success: boolean; error?: string }) => {
      setIsComplete(true);
      setCanProceed(true);
      
      if (result.success) {
        setProgress({
          stage: 'complete',
          progress: 100,
          message: 'EVA is ready to launch!',
          isRequired: false,
          canSkip: false
        });
        
        // Auto-close after success
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      } else {
        setProgress({
          stage: 'error',
          progress: 0,
          message: result.error || 'Startup failed',
          isRequired: false,
          canSkip: true,
          error: result.error
        });
      }
    };

    // Set up event listeners
    window.electronAPI.startup.onSDEProgress(handleProgress);
    window.electronAPI.startup.onSDEComplete(handleComplete);

    return () => {
      window.electronAPI.startup.removeSDEListeners();
    };
  }, [isVisible, onComplete]);

  const handleSkip = () => {
    if (canProceed && onComplete) {
      onComplete();
    }
  };

  const handleRetry = async () => {
    setProgress(null);
    setIsComplete(false);
    setCanProceed(false);
    
    try {
      await window.electronAPI.startup.checkSDE();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const handleForceRefresh = async () => {
    setProgress(null);
    setIsComplete(false);
    setCanProceed(false);
    
    try {
      await window.electronAPI.startup.forceSDERefresh();
    } catch (error) {
      console.error('Force refresh failed:', error);
    }
  };

  if (!isVisible) return null;

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'checking': return '🔍';
      case 'downloading': return '📦';
      case 'parsing': return '⚙️';
      case 'initializing': return '🚀';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'checking': return 'Checking SDE Version';
      case 'downloading': return 'Downloading EVE Data';
      case 'parsing': return 'Processing Data';
      case 'initializing': return 'Initializing Database';
      case 'complete': return 'Ready to Launch';
      case 'error': return 'Startup Issue';
      default: return 'Starting EVA';
    }
  };

  return (
    <div className="startup-overlay">
      <div className="startup-container">
        <div className="startup-header">
          <div className="eva-logo">
            <h1>EVA</h1>
            <p>EVE Virtual Assistant</p>
          </div>
        </div>

        <div className="startup-content">
          {progress ? (
            <>
              <div className="progress-section">
                <div className="stage-info">
                  <span className="stage-icon">{getStageIcon(progress.stage)}</span>
                  <div className="stage-details">
                    <h3>{getStageTitle(progress.stage)}</h3>
                    <p className="stage-message">{progress.message}</p>
                  </div>
                </div>

                {progress.stage !== 'complete' && progress.stage !== 'error' && (
                  <div className="progress-display">
                    <div className="loading-spinner-container">
                      <div className="loading-spinner"></div>
                      <div className="loading-percentage">{progress.progress.toFixed(0)}%</div>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {progress.progress.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {progress.stage === 'error' && (
                  <div className="error-section">
                    <div className="error-message">
                      <h4>Startup Issue</h4>
                      <p>{progress.error || progress.message}</p>
                      {!progress.isRequired && (
                        <p className="error-note">
                          This issue is not critical. You can continue using EVA with existing data.
                        </p>
                      )}
                    </div>
                    <div className="error-actions">
                      <button className="retry-btn" onClick={handleRetry}>
                        Retry Check
                      </button>
                      <button className="refresh-btn" onClick={handleForceRefresh}>
                        Force Download
                      </button>
                      {!progress.isRequired && (
                        <button className="skip-btn" onClick={handleSkip}>
                          Continue Anyway
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {progress.stage === 'complete' && (
                  <div className="success-section">
                    <div className="success-message">
                      <h4>Ready to Launch!</h4>
                      <p>EVA is now ready with the latest EVE Online data.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="startup-details">
                <button 
                  className="details-toggle"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
                
                {showDetails && (
                  <div className="details-content">
                    <h4>What's happening?</h4>
                    <ul>
                      <li><strong>Version Check:</strong> Comparing your SDE data with the latest from EVE Online</li>
                      <li><strong>Download:</strong> Getting the complete Static Data Export (~50MB) if needed</li>
                      <li><strong>Processing:</strong> Parsing ship, module, and attribute data</li>
                      <li><strong>Database:</strong> Loading data into EVA's local database</li>
                    </ul>
                    <p className="details-note">
                      This ensures you have access to all EVE Online ships and modules for fitting simulation.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="loading-section">
              <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
                <div className="loading-percentage">{Math.round(initialProgress)}%</div>
              </div>
              <h3>Starting EVA...</h3>
              <p>Checking EVE Online data status</p>
            </div>
          )}
        </div>

        <div className="startup-footer">
          {canProceed && !isComplete && (
            <button className="proceed-btn" onClick={handleSkip}>
              Continue to EVA
            </button>
          )}
          
          <div className="startup-info">
            <p>EVA - EVE Virtual Assistant</p>
            <p>Initializing ship fitting and character management systems</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupProgress;