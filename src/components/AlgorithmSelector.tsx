import React, { useState } from 'react';
import { LearningMethod, algorithmInfo } from '@/lib/rlAlgorithms';

interface AlgorithmSelectorProps {
  currentMethod: LearningMethod;
  onMethodChange: (method: LearningMethod) => void;
}

export default function AlgorithmSelector({ currentMethod, onMethodChange }: AlgorithmSelectorProps) {
  const [showInfo, setShowInfo] = useState(false);

  const methods: LearningMethod[] = ['qlearning', 'sarsa'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Learning Algorithm</h3>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showInfo ? 'Hide Info' : 'Show Info'}
        </button>
      </div>

      {/* Algorithm Selection */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {methods.map((method) => {
          const info = algorithmInfo[method];
          const isSelected = currentMethod === method;
          
          return (
            <button
              key={method}
              onClick={() => onMethodChange(method)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold mb-1">{info.name}</div>
                <div className="text-xs opacity-75">
                  {method === 'qlearning' ? 'Off-policy' : 'On-policy'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Algorithm Information */}
      {showInfo && (
        <div className="border-t border-gray-200 pt-4">
          {methods.map((method) => {
            const info = algorithmInfo[method];
            const isSelected = currentMethod === method;
            
            return (
              <div
                key={method}
                className={`mb-4 p-4 rounded-lg ${
                  isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <h4 className="font-semibold text-gray-800 mb-2">{info.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                
                {/* Formula */}
                <div className="bg-gray-100 p-3 rounded mb-3">
                  <div className="font-mono text-sm text-gray-800">{info.formula}</div>
                </div>

                {/* Pros and Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Advantages</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {info.pros.map((pro, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-red-700 mb-2">Limitations</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {info.cons.map((con, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 mr-2">✗</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Best For */}
                <div className="mt-3">
                  <h5 className="font-medium text-blue-700 mb-2">Best For</h5>
                  <div className="flex flex-wrap gap-2">
                    {info.bestFor.map((useCase, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Key Differences Summary */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-800 mb-3">Key Differences</h4>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-800 space-y-2">
            <div className="flex items-start">
              <span className="font-medium mr-2">Q-Learning:</span>
              <span>Uses max Q-value for next state (off-policy), can be more aggressive</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">SARSA:</span>
              <span>Uses actual next action Q-value (on-policy), generally more conservative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 