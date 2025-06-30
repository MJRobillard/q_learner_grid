import React, { useState } from 'react';
import { Cell, Position, Action, QLearningEnvironment, RewardPosition } from '@/lib/qLearning';
import { RLEnvironment, LearningMethod } from '@/lib/rlAlgorithms';
import AlgorithmSelector from './AlgorithmSelector';
import HyperparameterModal from './HyperparameterModal';

interface SimulationComponentProps {
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
  // Simulation control props
  episode: number;
  totalReward: number;
  isRunning: boolean;
  onRunEpisode: () => void;
  onRunMultipleEpisodes: (count: number) => void;
  onReset: () => void;
  // Algorithm selection props
  currentMethod: LearningMethod;
  onMethodChange: (method: LearningMethod) => void;
  // Config props for modal
  config: any;
  onConfigChange: (config: any) => void;
}

export default function SimulationComponent({
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
  // Simulation control props
  episode,
  totalReward,
  isRunning,
  onRunEpisode,
  onRunMultipleEpisodes,
  onReset,
  // Algorithm selection props
  currentMethod,
  onMethodChange,
  // Config props for modal
  config,
  onConfigChange
}: SimulationComponentProps) {
  const [showGoalQValues, setShowGoalQValues] = useState(false);
  const [goalReached, setGoalReached] = useState(false);
  const [showHyperparameterModal, setShowHyperparameterModal] = useState(false);

  // Check if agent reached goal
  const isAtGoal = agentPosition.row === goalPosition.row && agentPosition.col === goalPosition.col;
  
  // Update goal reached state
  React.useEffect(() => {
    if (isAtGoal && !goalReached) {
      setGoalReached(true);
      setShowGoalQValues(true);
      // Auto-hide after 5 seconds
      setTimeout(() => setShowGoalQValues(false), 5000);
    } else if (!isAtGoal) {
      setGoalReached(false);
    }
  }, [isAtGoal, goalReached]);

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

  const getQValuesForPosition = (pos: Position): Record<Action, number> => {
    return environment.getQValuesForPosition(pos);
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

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Simulation Environment</h2>
      
      {/* Algorithm Selector and Controls */}
      <div className="mb-6 space-y-4">
        {/* Algorithm Selector */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Learning Algorithm</h3>
          <AlgorithmSelector
            currentMethod={currentMethod}
            onMethodChange={onMethodChange}
          />
        </div>

        {/* Hyperparameter Button */}
        <div>
          <button
            onClick={() => setShowHyperparameterModal(true)}
            className="w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors font-medium"
          >
            ⚙️ Configure Hyperparameters
          </button>
        </div>
      </div>
      
      {/* Statistics Section */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Current Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{episode}</div>
            <div className="text-xs text-gray-500">Episode</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{totalReward}</div>
            <div className="text-xs text-gray-500">Total Reward</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mb-6 space-y-3">
        {/* Single Episode Control */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Single Episode</h3>
          <button
            onClick={onRunEpisode}
            disabled={isRunning}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isRunning ? 'Running...' : 'Run 1 Episode'}
          </button>
        </div>
        
        {/* Batch Episode Controls */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Batch Episodes</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onRunMultipleEpisodes(10)}
              disabled={isRunning}
              className="bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isRunning ? 'Running...' : 'Run 10'}
            </button>
            <button
              onClick={() => onRunMultipleEpisodes(50)}
              disabled={isRunning}
              className="bg-purple-500 text-white py-2 px-3 rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isRunning ? 'Running...' : 'Run 50'}
            </button>
          </div>
        </div>
        
        {/* Reset Control */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Environment</h3>
          <button
            onClick={onReset}
            disabled={isRunning}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Reset Environment
          </button>
        </div>
      </div>

      {/* Goal Reached Q-Values Display */}
      {showGoalQValues && isAtGoal && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600 text-lg">🎯</span>
            <h3 className="font-semibold text-yellow-800">Goal Reached! Q-Values at Goal State:</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(getQValuesForPosition(goalPosition)).map(([action, value]) => (
              <div key={action} className="flex justify-between items-center">
                <span className="font-medium text-gray-700">
                  {action === 'up' && '↑ Up'}
                  {action === 'down' && '↓ Down'}
                  {action === 'left' && '← Left'}
                  {action === 'right' && '→ Right'}
                </span>
                <span className={`font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-yellow-600">
            This shows the learned Q-values for each action at the goal state. Higher values indicate better learned policies.
          </div>
        </div>
      )}
      
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
                  {rewardPositions?.some(rp => rp.position.row === row && rp.position.col === col) && !isAgentHere && <span className="text-xs sm:text-sm">💰</span>}
                  
                  {/* Show Q-value and best action for non-special cells */}
                  {!isAgentHere && 
                   (row !== startPosition.row || col !== startPosition.col) &&
                   (row !== goalPosition.row || col !== goalPosition.col) &&
                   !hazardPositions.some(h => h.row === row && h.col === col) &&
                   !rewardPositions?.some(rp => rp.position.row === row && rp.position.col === col) && (
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

      {/* Hyperparameter Modal */}
      <HyperparameterModal
        isOpen={showHyperparameterModal}
        onClose={() => setShowHyperparameterModal(false)}
        config={config}
        onConfigChange={onConfigChange}
        currentMethod={currentMethod}
      />
    </div>
  );
} 