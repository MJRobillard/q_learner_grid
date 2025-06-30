import React from 'react';

interface ControlsAndStatsProps {
  episode: number;
  totalReward: number;
  isRunning: boolean;
  onRunEpisode: () => void;
  onRunMultipleEpisodes: (count: number) => void;
  onReset: () => void;
}

export default function ControlsAndStats({
  episode,
  totalReward,
  isRunning,
  onRunEpisode,
  onRunMultipleEpisodes,
  onReset
}: ControlsAndStatsProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">Simulation Controls</h2>
      
      {/* Statistics Section */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Current Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{episode}</div>
            <div className="text-xs text-gray-500">Episode</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{totalReward}</div>
            <div className="text-xs text-gray-500">Total Reward</div>
          </div>
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="space-y-3 sm:space-y-4">
        {/* Single Episode Control */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Single Episode</h3>
          <button
            onClick={onRunEpisode}
            disabled={isRunning}
            className="w-full bg-blue-500 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
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
              className="bg-green-500 text-white py-2 px-2 sm:px-3 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium"
            >
              {isRunning ? 'Running...' : 'Run 10'}
            </button>
            <button
              onClick={() => onRunMultipleEpisodes(50)}
              disabled={isRunning}
              className="bg-purple-500 text-white py-2 px-2 sm:px-3 rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium"
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
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
          >
            Reset Environment
          </button>
        </div>
      </div>
    </div>
  );
} 