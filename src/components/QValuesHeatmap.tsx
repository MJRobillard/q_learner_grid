import React from 'react';
import { Cell, Action } from '@/lib/qLearning';

interface QValuesHeatmapProps {
  grid: Cell[][];
}

export default function QValuesHeatmap({ grid }: QValuesHeatmapProps) {
  const getBestAction = (row: number, col: number): Action | null => {
    const cell = grid[row]?.[col];
    if (!cell) return null;
    
    const qValues = cell.qValues;
    const actions: Action[] = ['up', 'down', 'left', 'right'];
    let bestAction = actions[0];
    let bestValue = qValues[bestAction];
    
    for (const action of actions) {
      if (qValues[action] > bestValue) {
        bestValue = qValues[action];
        bestAction = action;
      }
    }
    
    return bestValue > 0 ? bestAction : null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Q-Values Heatmap</h2>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)` }}>
        {Array.from({ length: grid.length }, (_, row) =>
          Array.from({ length: grid[0].length }, (_, col) => {
            const cell = grid[row]?.[col];
            const bestAction = getBestAction(row, col);
            const maxQValue = cell ? Math.max(...Object.values(cell.qValues)) : 0;
            
            return (
              <div
                key={`q-${row}-${col}`}
                className="w-12 h-12 border border-gray-300 flex flex-col items-center justify-center text-xs"
                style={{
                  backgroundColor: maxQValue > 0 ? `rgba(0, 255, 0, ${Math.min(maxQValue / 50, 1)})` : 'white'
                }}
                title={`Cell (${row}, ${col}): Max Q-value = ${maxQValue.toFixed(2)}`}
              >
                <div className="font-bold">{maxQValue.toFixed(1)}</div>
                {bestAction && (
                  <div className="text-xs">
                    {bestAction === 'up' && '↑'}
                    {bestAction === 'down' && '↓'}
                    {bestAction === 'left' && '←'}
                    {bestAction === 'right' && '→'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Green intensity shows Q-value strength. Arrows show best actions.
      </div>
    </div>
  );
} 