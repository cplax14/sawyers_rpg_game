import React, { useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameInstance, isGameLoaded } = useGame();

  useEffect(() => {
    if (isGameLoaded && canvasRef.current && !gameInstance?.canvas) {
      // Replace the canvas element that the vanilla game is expecting
      const existingCanvas = document.getElementById('game-canvas');
      if (existingCanvas && existingCanvas.parentNode) {
        // Replace existing canvas with our React-managed canvas
        canvasRef.current.id = 'game-canvas';
        existingCanvas.parentNode.replaceChild(canvasRef.current, existingCanvas);

        // Update the game instance reference
        if (gameInstance) {
          gameInstance.canvas = canvasRef.current;
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            gameInstance.ctx = ctx;
          }
        }

        console.log('✅ React canvas connected to vanilla game');
      }
    }
  }, [isGameLoaded, gameInstance]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          // Maintain aspect ratio while fitting container
          const aspectRatio = 800 / 600;
          let canvasWidth = containerRect.width;
          let canvasHeight = containerRect.height;

          if (canvasWidth / canvasHeight > aspectRatio) {
            canvasWidth = canvasHeight * aspectRatio;
          } else {
            canvasHeight = canvasWidth / aspectRatio;
          }

          // Set display size
          canvasRef.current.style.width = `${canvasWidth}px`;
          canvasRef.current.style.height = `${canvasHeight}px`;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="game-canvas-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          display: 'block',
          imageRendering: 'pixelated' as const,
        }}
      />
    </div>
  );
};

export default GameCanvas;