import React, { useState } from 'react';
import { QLearningConfig } from '@/lib/qLearning';
import { LearningMethod } from '@/lib/rlAlgorithms';

interface HyperparameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: QLearningConfig;
  onConfigChange: (config: Partial<QLearningConfig>) => void;
  currentMethod: LearningMethod;
}

export default function HyperparameterModal({ 
  isOpen, 
  onClose, 
  config, 
  onConfigChange, 
  currentMethod 
}: HyperparameterModalProps) {
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

  const getLearningFormula = () => {
    if (currentMethod === 'sarsa') {
      return {
        formula: "Q(s,a) ← Q(s,a) + α[r + γ Q(s',a') - Q(s,a)]",
        explanation: "SARSA update rule: Uses actual next action Q-value (on-policy), generally more conservative than Q-learning"
      };
    } else {
      return {
        formula: "Q(s,a) ← Q(s,a) + α[r + γ max Q(s',a') - Q(s,a)]",
        explanation: "Q-learning update rule: Uses maximum Q-value for next state (off-policy), can be more aggressive"
      };
    }
  };

  const learningFormula = getLearningFormula();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Hyperparameter Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="divide-y divide-gray-200">
            <div>
              <SectionHeader title="Learning Parameters" section="learning">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Core</span>
              </SectionHeader>
              
              {expandedSections.learning && (
                <div className="p-4 space-y-4">
                  <FormulaBox 
                    formula={learningFormula.formula}
                    explanation={learningFormula.explanation}
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
                      {currentMethod === 'sarsa' && (
                        <div className="mt-1 text-blue-600">
                          <strong>SARSA Note:</strong> On-policy algorithm - exploration directly affects learned policy
                        </div>
                      )}
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
                      <strong>High (0.99+):</strong> Slow decay, maintains exploration longer<br/>
                      <strong>Medium (0.95-0.99):</strong> Balanced decay rate<br/>
                      <strong>Low (0.9-0.95):</strong> Fast decay, quickly becomes exploitative
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <SectionHeader title="Heuristic Parameters" section="heuristics">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Advanced</span>
              </SectionHeader>
              
              {expandedSections.heuristics && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Heuristic Weight: {config.heuristicWeight || 0.1}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={config.heuristicWeight || 0.1}
                      onChange={(e) => onConfigChange({ heuristicWeight: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>1</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      <strong>High (0.5-1.0):</strong> Strong heuristic influence, faster convergence<br/>
                      <strong>Medium (0.1-0.3):</strong> Balanced heuristic guidance<br/>
                      <strong>Low (0-0.1):</strong> Minimal heuristic influence, pure learning
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Heuristic Decay: {config.epsilonDecay || 0.999}
                    </label>
                    <input
                      type="range"
                      min="0.9"
                      max="0.9999"
                      step="0.0001"
                      value={config.epsilonDecay || 0.999}
                      onChange={(e) => onConfigChange({ epsilonDecay: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.9</span>
                      <span>0.9999</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      <strong>High (0.999+):</strong> Slow decay, maintains heuristic influence<br/>
                      <strong>Medium (0.99-0.999):</strong> Balanced decay<br/>
                      <strong>Low (0.9-0.99):</strong> Fast decay, quickly reduces heuristic influence
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <SectionHeader title="Reward Configuration" section="rewards">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Environment</span>
              </SectionHeader>
              
              {expandedSections.rewards && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Goal Reward: {config.rewards?.goal || 100}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={config.rewards?.goal || 100}
                      onChange={(e) => onConfigChange({ 
                        rewards: { 
                          ...config.rewards, 
                          goal: parseInt(e.target.value) 
                        } 
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10</span>
                      <span>1000</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      <strong>High (500+):</strong> Strong goal motivation, may ignore obstacles<br/>
                      <strong>Medium (100-300):</strong> Balanced goal vs obstacle consideration<br/>
                      <strong>Low (10-50):</strong> Weak goal motivation, may get stuck
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Obstacle Penalty: {config.rewards?.hazard || -10}
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="-1"
                      step="1"
                      value={config.rewards?.hazard || -10}
                      onChange={(e) => onConfigChange({ 
                        rewards: { 
                          ...config.rewards, 
                          hazard: parseInt(e.target.value) 
                        } 
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-100</span>
                      <span>-1</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      <strong>High (-50 to -100):</strong> Strong obstacle avoidance<br/>
                      <strong>Medium (-10 to -30):</strong> Balanced obstacle consideration<br/>
                      <strong>Low (-1 to -5):</strong> Weak obstacle avoidance, may take shortcuts
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Step Penalty: {config.rewards?.step || -1}
                    </label>
                    <input
                      type="range"
                      min="-10"
                      max="0"
                      step="0.1"
                      value={config.rewards?.step || -1}
                      onChange={(e) => onConfigChange({ 
                        rewards: { 
                          ...config.rewards, 
                          step: parseFloat(e.target.value) 
                        } 
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-10</span>
                      <span>0</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      <strong>High (-5 to -10):</strong> Strong preference for shortest paths<br/>
                      <strong>Medium (-1 to -3):</strong> Balanced path length consideration<br/>
                      <strong>Low (0 to -0.5):</strong> Minimal path length preference
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
