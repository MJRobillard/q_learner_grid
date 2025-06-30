import React from 'react';
import { Cell, Position, Action, QLearningEnvironment, RewardPosition } from '@/lib/qLearning';
import { RLEnvironment } from '@/lib/rlAlgorithms';

interface GridVisualizationProps {
  grid: Cell[][];
  agentPosition: Position;
  startPosition: Position;
  goalPosition: Position;
  hazardPositions: Position[];
  rewardPositions?: RewardPosition[];
  environment: QLearningEnvironment | RLEnvironment;
  onCellClick?: (row: number, col: number) => void;
  useHeuristics?: boolean;
  heuristicMethod?: string;
  episode?: number;
  totalReward?: number;
  isRunning?: boolean;
  onRunEpisode?: () => void;
  onRunMultipleEpisodes?: (count: number) => void;
  onReset?: () => void;
}

export default function GridVisualization({
  grid,
  agentPosition,
  startPosition,
  goalPosition,
  hazardPositions,
  rewardPositions,
  environment,
  onCellClick,
  useHeuristics,
  heuristicMethod,
  episode,
  totalReward,
  isRunning,
  onRunEpisode,
  onRunMultipleEpisodes,
  onReset
}: GridVisualizationProps) {
  // Type guard to check if environment is QLearningEnvironment
  const isQLearningEnv = (env: any): env is QLearningEnvironment => {
    return env && typeof env.getMaxValidQValue === 'function' && typeof env.getValidActions === 'function';
  };

  // Helper functions with fallbacks
  const getMaxValidQValue = (pos: Position): number => {
    if (isQLearningEnv(environment)) {
      return environment.getMaxValidQValue(pos);
    }
    // For RLEnvironment, get the max Q-value from all actions
    const qValues = environment.getQValuesForPosition(pos);
    if (!qValues || typeof qValues !== 'object') return 0;
    return Math.max(...Object.values(qValues));
  };

  const getValidActions = (pos: Position): Action[] => {
    if (isQLearningEnv(environment)) {
      return environment.getValidActions(pos);
    }
    // For RLEnvironment, assume all actions are valid (simplified)
    return ['up', 'down', 'left', 'right'];
  };

  const getBestValidAction = (pos: Position): Action | null => {
    if (isQLearningEnv(environment)) {
      return environment.getBestValidAction(pos);
    }
    // For RLEnvironment, find the best action from Q-values
    const qValues = environment.getQValuesForPosition(pos);
    if (!qValues || typeof qValues !== 'object') return null;
    const bestAction = Object.entries(qValues).reduce((best, [action, value]) => 
      value > best.value ? { action: action as Action, value } : best, 
      { action: 'up' as Action, value: -Infinity }
    );
    return bestAction.value > -Infinity ? bestAction.action : null;
  };

  const getCellColor = (row: number, col: number) => {
    const cell = grid[row]?.[col];
    if (!cell) return 'bg-gray-200';
    
    const isAgentHere = agentPosition.row === row && agentPosition.col === col;
    
    if (isAgentHere) return 'bg-blue-500';
    
    // Check for reward position first
    const isRewardPosition = rewardPositions?.some(rp => rp.position.row === row && rp.position.col === col);
    if (isRewardPosition) return 'bg-purple-300';
    
    // Get Q-value for coloring (like heatmap) - use valid actions only
    const maxQValue = getMaxValidQValue({ row, col });
    
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
    const maxQValue = getMaxValidQValue({ row, col });
    const validActions = getValidActions({ row, col });
    
    // Add null check for qValues
    const qValuesString = qValues && typeof qValues === 'object' 
      ? Object.entries(qValues).map(([action, value]) => 
          `${action}: ${value.toFixed(2)}${!validActions.includes(action as any) ? ' (invalid)' : ''}`
        ).join(', ')
      : 'No Q-values available';
    
    return `Cell (${row}, ${col})
Type: ${cell.type}
Max Valid Q-Value: ${maxQValue.toFixed(2)}
Valid Actions: ${validActions.join(', ')}
Q-Values: ${qValuesString}`;
  };

  const getBestAction = (row: number, col: number): Action | null => {
    return getBestValidAction({ row, col });
  };

  // Add state for dropdown
  const [batchCount, setBatchCount] = React.useState(10);

  // Detect mobile (tailwind: sm = 640px)
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      {/* Episode Controls and Stats - Mobile optimized */}
      {(typeof episode === 'number' && typeof totalReward === 'number') && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-row gap-4 justify-between sm:justify-start">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{episode}</div>
              <div className="text-xs text-gray-500">Episode</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{totalReward}</div>
              <div className="text-xs text-gray-500">Total Reward</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={onRunEpisode}
              disabled={isRunning}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isRunning ? 'Running...' : 'Run 1 Episode'}
            </button>
            <div className="flex flex-row gap-2 items-center">
              <select
                value={batchCount}
                onChange={e => setBatchCount(Number(e.target.value))}
                className="rounded border-gray-300 px-2 py-1 text-sm"
                disabled={isRunning}
              >
                {[10, 25, 50, 100].map(count => (
                  <option key={count} value={count}>{count} Episodes</option>
                ))}
              </select>
              <button
                onClick={() => onRunMultipleEpisodes && onRunMultipleEpisodes(batchCount)}
                disabled={isRunning}
                className="bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isRunning ? 'Running...' : `Run ${batchCount}`}
              </button>
            </div>
            <button
              onClick={onReset}
              disabled={isRunning}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Reset Environment
            </button>
          </div>
        </div>
      )}
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
              const maxQValue = cell ? getMaxValidQValue({ row, col }) : 0;
              const isAgentHere = agentPosition.row === row && agentPosition.col === col;
              const isStart = row === startPosition.row && col === startPosition.col;
              const isGoal = row === goalPosition.row && col === goalPosition.col;
              const isHazard = hazardPositions.some(h => h.row === row && h.col === col);
              const isReward = rewardPositions?.some(rp => rp.position.row === row && rp.position.col === col);

              // Compute gradient background for Q-value cells
              let cellStyle = {};
              if (!isAgentHere && !isStart && !isGoal && !isHazard && !isReward) {
                // Q-value cell
                let color = '#e5e7eb'; // default gray
                if (maxQValue > 0) {
                  // Green gradient for positive Q
                  const intensity = Math.min(maxQValue / 50, 1);
                  if (isMobile) {
                    // More saturated and opaque for mobile
                    if (intensity > 0.66) color = 'rgba(16,185,129,0.95)'; // emerald-500
                    else if (intensity > 0.33) color = 'rgba(52,211,153,0.85)'; // emerald-400
                    else color = 'rgba(110,231,183,0.75)'; // emerald-300
                  } else {
                    color = `rgba(34,197,94,${0.15 + 0.65 * intensity})`;
                  }
                } else if (maxQValue < 0) {
                  // Red gradient for negative Q
                  const intensity = Math.min(Math.abs(maxQValue) / 50, 1);
                  if (isMobile) {
                    if (intensity > 0.66) color = 'rgba(239,68,68,0.95)'; // red-500
                    else if (intensity > 0.33) color = 'rgba(252,165,165,0.85)'; // red-300
                    else color = 'rgba(254,202,202,0.75)'; // red-200
                  } else {
                    color = `rgba(239,68,68,${0.15 + 0.65 * intensity})`;
                  }
                }
                cellStyle = { background: color };
              }

              return (
                <div
                  key={`${row}-${col}`}
                  className={`w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 flex flex-col items-center justify-center text-xs font-mono cursor-pointer hover:opacity-80 transition-opacity
                    ${isAgentHere ? 'bg-blue-500' : ''}
                    ${isStart && !isAgentHere ? 'bg-green-300' : ''}
                    ${isGoal && !isAgentHere ? 'bg-yellow-300' : ''}
                    ${isHazard && !isAgentHere ? 'bg-red-300' : ''}
                    ${isReward && !isAgentHere ? 'bg-purple-300' : ''}
                  `}
                  style={cellStyle}
                  onClick={() => onCellClick?.(row, col)}
                  title={getCellTitle(row, col)}
                >
                  {isAgentHere && <span className="text-xs sm:text-sm">🤖</span>}
                  {isStart && !isAgentHere && <span className="text-xs sm:text-sm">🚀</span>}
                  {isGoal && !isAgentHere && <span className="text-xs sm:text-sm">🎯</span>}
                  {isHazard && !isAgentHere && <span className="text-xs sm:text-sm">💀</span>}
                  {isReward && !isAgentHere && <span className="text-xs sm:text-sm">💰</span>}
                  {/* Always show Q-value and best action for regular cells */}
                  {!isAgentHere && !isStart && !isGoal && !isHazard && !isReward && (
                    <>
                      <div className="font-bold text-xs">{maxQValue.toFixed(1)}</div>
                      {bestAction && (
                        <div className="text-xs">
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
        <div className="mb-2 text-xs sm:text-sm">🤖 Agent | 🚀 Start | 🎯 Goal | 💀 Hazard | 💰 Reward</div>
        
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