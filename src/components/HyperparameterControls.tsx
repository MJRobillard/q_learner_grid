import React, { useState } from 'react';
import { QLearningConfig } from '@/lib/qLearning';

interface HyperparameterControlsProps {
  config: QLearningConfig;
  onConfigChange: (config: Partial<QLearningConfig>) => void;
}

export default function HyperparameterControls({ config, onConfigChange }: HyperparameterControlsProps) {
  const [expandedSections, setExpandedSections] = useState({
    learning: true,
    heuristics: true,
    rewards: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionHeader = ({ title, section, children }: { title: string; section: keyof typeof expandedSections; children?: React.ReactNode }) => (
    <div 
      className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-t-lg border-b border-gray-200"
      onClick={() => toggleSection(section)}
    >
      <h4 className="font-medium text-gray-700">{title}</h4>
      <div className="flex items-center space-x-2">
        {children}
        <svg 
          className={`w-4 h-4 transition-transform ${expandedSections[section] ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  const FormulaBox = ({ formula, explanation }: { formula: string; explanation: string }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="font-mono text-sm text-blue-800 mb-2">{formula}</div>
      <div className="text-xs text-blue-700">{explanation}</div>
    </div>
  );

  return (
    <div className="divide-y divide-gray-200">
      {/* Learning Parameters Section */}
      <div>
        <SectionHeader title="Learning Parameters" section="learning">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Core</span>
        </SectionHeader>
        
        {expandedSections.learning && (
          <div className="p-4 space-y-4">
            <FormulaBox 
              formula="Q(s,a) ← Q(s,a) + α[r + γ max Q(s',a') - Q(s,a)]"
              explanation="Q-learning update rule: α (learning rate) controls how much new information overrides old Q-values"
            />

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Learning Rate (α): {config.learningRate}
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={config.learningRate}
                onChange={(e) => onConfigChange({ learningRate: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.01</span>
                <span>0.5</span>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                <strong>High (0.3-0.5):</strong> Fast learning, may be unstable<br/>
                <strong>Medium (0.1-0.2):</strong> Balanced learning<br/>
                <strong>Low (0.01-0.05):</strong> Slow but stable learning
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Discount Factor (γ): {config.discountFactor}
              </label>
              <input
                type="range"
                min="0.1"
                max="0.99"
                step="0.01"
                value={config.discountFactor}
                onChange={(e) => onConfigChange({ discountFactor: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.1</span>
                <span>0.99</span>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                <strong>High (0.9-0.99):</strong> Values future rewards highly, long-term planning<br/>
                <strong>Medium (0.7-0.8):</strong> Balanced future vs immediate rewards<br/>
                <strong>Low (0.1-0.3):</strong> Focuses on immediate rewards, short-term thinking
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Epsilon (ε): {config.epsilon}
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={config.epsilon}
                onChange={(e) => onConfigChange({ epsilon: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.01</span>
                <span>0.5</span>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                <strong>High (0.3-0.5):</strong> More exploration, less exploitation<br/>
                <strong>Medium (0.1-0.2):</strong> Balanced exploration/exploitation<br/>
                <strong>Low (0.01-0.05):</strong> More exploitation, less exploration
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Epsilon Decay: {config.epsilonDecay || 0.995}
              </label>
              <input
                type="range"
                min="0.9"
                max="0.999"
                step="0.001"
                value={config.epsilonDecay || 0.995}
                onChange={(e) => onConfigChange({ epsilonDecay: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.9</span>
                <span>0.999</span>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                <strong>Formula:</strong> ε = ε × decay_rate per episode<br/>
                <strong>High (0.999):</strong> Slow decay, long exploration phase<br/>
                <strong>Low (0.9):</strong> Fast decay, quick transition to exploitation
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Directional Heuristics Section */}
      <div>
        <SectionHeader title="Directional Heuristics" section="heuristics">
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Advanced</span>
        </SectionHeader>
        
        {expandedSections.heuristics && (
          <div className="p-4 space-y-4">
            <FormulaBox 
              formula="h(s) = (1 - d(s,goal)/max_distance) × weight"
              explanation="Heuristic reward based on distance to goal. Closer to goal = higher reward"
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useHeuristics"
                checked={config.useDirectionalHeuristics || false}
                onChange={(e) => onConfigChange({ useDirectionalHeuristics: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useHeuristics" className="ml-2 block text-sm text-gray-700">
                Enable goal-aware learning
              </label>
            </div>

            {config.useDirectionalHeuristics && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Heuristic Weight: {config.heuristicWeight || 0.1}
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={config.heuristicWeight || 0.1}
                    onChange={(e) => onConfigChange({ heuristicWeight: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.01</span>
                    <span>0.5</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    <strong>High:</strong> Strong directional guidance, may override Q-values<br/>
                    <strong>Low:</strong> Subtle guidance, preserves Q-learning behavior
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Distance Method
                  </label>
                  <select
                    value={config.heuristicMethod || 'manhattan'}
                    onChange={(e) => onConfigChange({ heuristicMethod: e.target.value as 'manhattan' | 'euclidean' | 'chebyshev' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manhattan">Manhattan Distance</option>
                    <option value="euclidean">Euclidean Distance</option>
                    <option value="chebyshev">Chebyshev Distance</option>
                  </select>
                  <div className="text-xs text-gray-600 mt-2">
                    <strong>Manhattan:</strong> L1 norm, grid-based movement<br/>
                    <strong>Euclidean:</strong> L2 norm, direct line distance<br/>
                    <strong>Chebyshev:</strong> L∞ norm, maximum axis difference
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rewards Section */}
      <div>
        <SectionHeader title="Reward Structure" section="rewards">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Rewards</span>
        </SectionHeader>
        
        {expandedSections.rewards && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Goal Reward: {config.rewards.goal}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={config.rewards.goal}
                onChange={(e) => onConfigChange({ 
                  rewards: { ...config.rewards, goal: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10</span>
                <span>100</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Hazard Penalty: {config.rewards.hazard}
              </label>
              <input
                type="range"
                min="-100"
                max="-10"
                step="5"
                value={config.rewards.hazard}
                onChange={(e) => onConfigChange({ 
                  rewards: { ...config.rewards, hazard: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-100</span>
                <span>-10</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Step Penalty: {config.rewards.step}
              </label>
              <input
                type="range"
                min="-5"
                max="0"
                step="1"
                value={config.rewards.step}
                onChange={(e) => onConfigChange({ 
                  rewards: { ...config.rewards, step: parseInt(e.target.value) }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-5</span>
                <span>0</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 