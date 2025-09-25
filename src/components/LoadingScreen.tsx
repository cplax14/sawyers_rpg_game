import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Initializing Sawyer's RPG Game..."
}) => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const info = [];
      if (typeof window.SawyersRPG !== 'undefined') info.push('✅ SawyersRPG loaded');
      else info.push('❌ SawyersRPG missing');

      if (typeof window.gameState !== 'undefined') info.push('✅ gameState loaded');
      else info.push('❌ gameState missing');

      if (typeof window.GameState !== 'undefined') info.push('✅ GameState loaded');
      else info.push('❌ GameState missing');

      setDebugInfo(info);
    }, 1000);

    return () => clearInterval(checkInterval);
  }, []);
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <h1 className="loading-title">Sawyer's RPG Game</h1>
        <p className="loading-subtitle">A Fantasy Adventure</p>

        <div className="loading-spinner"></div>

        <p className="loading-text">{message}</p>

        <div className="loading-tips" style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.6 }}>
          <p>🎮 Tip: Press F11 for fullscreen mode</p>
          <p>⚔️ Get ready to explore magical realms!</p>
        </div>

        <div className="debug-info" style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.8, textAlign: 'left' }}>
          <strong>Debug Info:</strong>
          {debugInfo.map((info, index) => (
            <div key={index}>{info}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;