import React from 'react';
import { Cell, Position, Action, QLearningEnvironment } from '@/lib/qLearning';

interface GridVisualizationProps {
  grid: Cell[][];
  agentPosition: Position;
  startPosition: Position;
  goalPosition: Position;
  hazardPositions: Position[];
  environment: QLearningEnvironment;
  onCellClick?: (row: number, col: number) => void;
  useHeuristics?: boolean;
  heuristicMethod?: string;
}

export default function GridVisualization({
  grid,
  agentPosition,
  startPosition,
  goalPosition,
  hazardPositions,
  environment,
  onCellClick,
  useHeuristics,
  heuristicMethod
}: GridVisualizationProps) {
  const getCellColor = (row: number, col: number) => {
    const cell = grid[row]?.[col];
    if (!cell) return 'bg-gray-200';
    
    const isAgentHere = agentPosition.row === row && agentPosition.col === col;
    
    if (isAgentHere) return 'bg-blue-500';
    
    // Get Q-value for coloring (like heatmap) - use valid actions only
    const maxQValue = environment.getMaxValidQValue({ row, col });
    
    // Color based on Q-value intensity - handle negative values
    if (maxQValue > 0) {
      const intensity = Math.min(maxQValue / 50, 1);
      return `bg-green-${Math.floor(intensity * 500) + 100}`;
    } else if (maxQValue < 0) {
      const intensity = Math.min(Math.abs(maxQValue) / 50, 1);
      return `bg-red-${Math.floor(intensity * 500) + 100}`;
    }
    
    // Special colors for start, goal, and hazards
    switch (cell.type) {
      case 'start': 
        return 'bg-green-300';
      case 'goal': 
        return 'bg-yellow-300';
      case 'hazard': 
        return 'bg-red-300';
      default: 
        return 'bg-gray-200';
    }
  };

  const getCellTitle = (row: number, col: number) => {
    const cell = grid[row]?.[col];
    if (!cell) return `Cell (${row}, ${col})`;
    
    const qValues = cell.qValues;
    const maxQValue = environment.getMaxValidQValue({ row, col });
    const validActions = environment.getValidActions({ row, col });
    
    return `Cell (${row}, ${col})
Type: ${cell.type}
Max Valid Q-Value: ${maxQValue.toFixed(2)}
Valid Actions: ${validActions.join(', ')}
Q-Values: ${Object.entries(qValues).map(([action, value]) => 
  `${action}: ${value.toFixed(2)}${!validActions.includes(action as any) ? ' (invalid)' : ''}`
).join(', ')}`;
  };

  const getBestAction = (row: number, col: number): Action | null => {
    return environment.getBestValidAction({ row, col });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Environment</h2>
      
      {/* Grid Container with responsive sizing */}
      <div className="flex justify-center">
        <div 
          className="grid gap-1" 
          style={{ 
            gridTemplateColumns: `repeat(${grid.length}, 1fr)`,
            maxWidth: '100%',
            overflow: 'auto'
          }}
        >
          {Array.from({ length: grid.length }, (_, row) =>
            Array.from({ length: grid[0].length }, (_, col) => {
              const cell = grid[row]?.[col];
              const bestAction = getBestAction(row, col);
              const maxQValue = cell ? environment.getMaxValidQValue({ row, col }) : 0;
              const isAgentHere = agentPosition.row === row && agentPosition.col === col;
              
              return (
                <div
                  key={`${row}-${col}`}
                  className={`
                    w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 flex flex-col items-center justify-center text-xs font-mono cursor-pointer
                    ${getCellColor(row, col)}
                    hover:opacity-80 transition-opacity
                  `}
                  onClick={() => onCellClick?.(row, col)}
                  title={getCellTitle(row, col)}
                >
                  {isAgentHere && <span className="text-xs sm:text-sm">🤖</span>}
                  {row === startPosition.row && col === startPosition.col && !isAgentHere && <span className="text-xs sm:text-sm">🚀</span>}
                  {row === goalPosition.row && col === goalPosition.col && !isAgentHere && <span className="text-xs sm:text-sm">🎯</span>}
                  {hazardPositions.some(h => h.row === row && h.col === col) && !isAgentHere && <span className="text-xs sm:text-sm">💀</span>}
                  
                  {/* Show Q-value and best action for non-special cells */}
                  {!isAgentHere && 
                   (row !== startPosition.row || col !== startPosition.col) &&
                   (row !== goalPosition.row || col !== goalPosition.col) &&
                   !hazardPositions.some(h => h.row === row && h.col === col) && (
                    <>
                      <div className="font-bold text-xs hidden sm:block">{maxQValue.toFixed(1)}</div>
                      {bestAction && (
                        <div className="text-xs hidden sm:block">
                          {bestAction === 'up' && '↑'}
                          {bestAction === 'down' && '↓'}
                          {bestAction === 'left' && '←'}
                          {bestAction === 'right' && '→'}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Legend - Mobile optimized */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="mb-2 text-xs sm:text-sm">🤖 Agent | 🚀 Start | 🎯 Goal | 💀 Hazard</div>
        
        {/* Heuristic Status */}
        {useHeuristics && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🧭</span>
              <span className="font-medium text-blue-800 text-xs sm:text-sm">Directional Heuristics Enabled</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Distance metric: {heuristicMethod || 'manhattan'} | Agent knows goal location
            </div>
          </div>
        )}
        
        {/* Q-Value Legend - Hidden on mobile to save space */}
        <div className="hidden sm:block">
          <div className="flex items-center gap-2 text-xs">
            <span>Q-Values:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-600 border border-gray-300"></div>
              <span>High Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 border border-gray-300"></div>
              <span>Medium Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 border border-gray-300"></div>
              <span>Low Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 border border-gray-300"></div>
              <span>Zero</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 border border-gray-300"></div>
              <span>Negative</span>
            </div>
          </div>
          <div className="text-xs mt-1">Numbers show max valid Q-value, arrows show best valid action</div>
        </div>
        
        {/* Mobile legend */}
        <div className="sm:hidden text-xs text-gray-500 mt-2">
          Tap cells to see Q-values. Green intensity shows learning progress.
        </div>
      </div>
    </div>
  );
} 