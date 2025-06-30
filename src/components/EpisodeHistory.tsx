import React from 'react';

interface EpisodeHistoryProps {
  episodeHistory: number[];
}

export default function EpisodeHistory({ episodeHistory }: EpisodeHistoryProps) {
  if (episodeHistory.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Episode Rewards</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No episodes completed yet. Run some episodes to see the reward history.
        </div>
      </div>
    );
  }

  // Calculate statistics for better scaling
  const minReward = Math.min(...episodeHistory);
  const maxReward = Math.max(...episodeHistory);
  const avgReward = episodeHistory.reduce((sum, reward) => sum + reward, 0) / episodeHistory.length;
  
  // Create a range that includes 0 and has some padding
  const range = maxReward - minReward;
  const padding = range * 0.1;
  const chartMin = Math.min(minReward - padding, 0);
  const chartMax = Math.max(maxReward + padding, 0);
  const chartRange = chartMax - chartMin;

  // Generate Y-axis labels
  const yAxisLabels = [];
  const numYLabels = 6;
  for (let i = 0; i <= numYLabels; i++) {
    const value = chartMin + (chartRange * i / numYLabels);
    yAxisLabels.push(Math.round(value));
  }

  // Generate X-axis labels (episode numbers)
  const xAxisLabels = [];
  const numXLabels = Math.min(10, episodeHistory.length);
  for (let i = 0; i <= numXLabels; i++) {
    const episodeIndex = Math.floor((episodeHistory.length - 1) * i / numXLabels);
    xAxisLabels.push(episodeIndex + 1);
  }

  const getBarHeight = (reward: number) => {
    if (chartRange === 0) return 50; // If all values are the same
    return Math.max(1, ((reward - chartMin) / chartRange) * 100);
  };

  const getBarColor = (reward: number) => {
    if (reward >= 0) {
      return reward > avgReward ? '#10b981' : '#3b82f6'; // Green for above average, blue for below
    }
    return '#ef4444'; // Red for negative
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Episode Rewards</h2>
      
      {/* Statistics Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{episodeHistory.length}</div>
          <div className="text-xs text-gray-600">Total Episodes</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{Math.round(avgReward)}</div>
          <div className="text-xs text-gray-600">Avg Reward</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">{Math.round(maxReward)}</div>
          <div className="text-xs text-gray-600">Best Reward</div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-600">
          {yAxisLabels.reverse().map((label) => (
            <div key={label} className="flex items-center">
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="ml-12 h-64 overflow-x-auto">
          <div className="relative h-full min-w-full">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {yAxisLabels.map((label) => (
                <div key={label} className="border-t border-gray-200"></div>
              ))}
            </div>

            {/* Bars */}
            <div className="relative h-full flex items-end space-x-1">
              {episodeHistory.map((reward, index) => (
                <div
                  key={index}
                  className="min-w-2 transition-all duration-200 hover:opacity-80 cursor-pointer"
                  style={{
                    height: `${getBarHeight(reward)}%`,
                    backgroundColor: getBarColor(reward)
                  }}
                  title={`Episode ${index + 1}: ${reward} (${reward >= 0 ? 'Positive' : 'Negative'})`}
                />
              ))}
            </div>

            {/* Zero line */}
            {chartMin < 0 && chartMax > 0 && (
              <div 
                className="absolute left-0 right-0 border-t-2 border-gray-400 border-dashed"
                style={{ 
                  bottom: `${Math.abs(chartMin) / chartRange * 100}%` 
                }}
              ></div>
            )}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-12 mt-2 flex justify-between text-xs text-gray-600">
          {xAxisLabels.map((episodeNum) => (
            <div key={episodeNum} className="text-center">
              {episodeNum}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 mr-1"></div>
          Above Average
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 mr-1"></div>
          Below Average
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 mr-1"></div>
          Negative
        </div>
        {chartMin < 0 && chartMax > 0 && (
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-gray-400 border-dashed mr-1"></div>
            Zero Line
          </div>
        )}
      </div>
    </div>
  );
} 