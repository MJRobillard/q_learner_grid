import React, { useState, useEffect } from 'react';
import { QLearningConfig } from '@/lib/qLearning';

interface HighscoreEntry {
  id: string;
  name: string;
  score: number;
  episode: number;
  config: QLearningConfig;
  mode: 'easy' | 'complex';
  timestamp: number;
}

interface HighscoreBoardProps {
  currentScore: number;
  currentEpisode: number;
  currentConfig: QLearningConfig;
  currentMode: 'easy' | 'complex';
  onScoreSubmitted?: () => void;
}

export default function HighscoreBoard({ 
  currentScore, 
  currentEpisode, 
  currentConfig, 
  currentMode, 
  onScoreSubmitted 
}: HighscoreBoardProps) {
  const [localHighscores, setLocalHighscores] = useState<HighscoreEntry[]>([]);
  const [globalHighscores, setGlobalHighscores] = useState<HighscoreEntry[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('global');
  const [modeFilter, setModeFilter] = useState<'all' | 'easy' | 'complex'>('all');

  // Load local highscores from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('qlearning-highscores');
    if (saved) {
      try {
        setLocalHighscores(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load local highscores:', e);
      }
    }
  }, []);

  // Load global highscores from server
  useEffect(() => {
    const loadGlobalHighscores = async () => {
      try {
        const response = await fetch('/api/highscores');
        if (response.ok) {
          const data = await response.json();
          setGlobalHighscores(data);
        }
      } catch (e) {
        console.log('Failed to load global highscores, using local only');
      }
    };

    loadGlobalHighscores();
  }, []);

  // Save local highscores to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('qlearning-highscores', JSON.stringify(localHighscores));
  }, [localHighscores]);

  const submitScore = async () => {
    if (!playerName.trim()) return;

    setIsSubmitting(true);
    
    const newEntry: HighscoreEntry = {
      id: Date.now().toString(),
      name: playerName.trim(),
      score: currentScore,
      episode: currentEpisode,
      config: currentConfig,
      mode: currentMode,
      timestamp: Date.now()
    };

    // Add to local highscores
    const updatedLocalHighscores = [...localHighscores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10

    setLocalHighscores(updatedLocalHighscores);
    setShowSubmitForm(false);
    setPlayerName('');
    setIsSubmitting(false);

    // Try to submit to server
    try {
      const response = await fetch('/api/highscores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Score submitted! Global position: ${result.position}`);
        
        // Refresh global highscores
        const globalResponse = await fetch('/api/highscores');
        if (globalResponse.ok) {
          const globalData = await globalResponse.json();
          setGlobalHighscores(globalData);
        }
      }
    } catch (e) {
      console.log('Server submission failed, but score saved locally');
    }

    onScoreSubmitted?.();
  };

  const canSubmit = currentScore > 0 && !localHighscores.some(h => 
    h.name === playerName.trim() && h.score === currentScore
  );

  const formatConfig = (config: QLearningConfig) => {
    const base = `α:${config.learningRate} γ:${config.discountFactor} ε:${config.epsilon}`;
    const heuristics = config.useDirectionalHeuristics 
      ? ` | H:${config.heuristicWeight || 0.1} (${config.heuristicMethod || 'manhattan'})`
      : ' | No Heuristics';
    return base + heuristics;
  };

  const formatMode = (mode: 'easy' | 'complex') => {
    return mode === 'easy' ? '🟢 Easy (8×8)' : '🔴 Complex (12×12)';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const currentHighscores = activeTab === 'global' ? globalHighscores : localHighscores;
  
  // Filter highscores by mode
  const filteredHighscores = modeFilter === 'all' 
    ? currentHighscores 
    : currentHighscores.filter(entry => entry.mode === modeFilter);

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg border-2 border-yellow-200">
      {/* Header with Trophy Icon */}
      <div className="p-4 border-b border-yellow-200 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🏆</div>
            <h3 className="text-lg font-bold text-gray-800">Hall of Fame</h3>
          </div>
          {currentScore > 0 && (
            <button
              onClick={() => setShowSubmitForm(true)}
              className="text-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Submit Score
            </button>
          )}
        </div>
        
        {/* Current Score Display */}
        {currentScore > 0 && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{currentScore}</div>
              <div className="text-sm text-gray-600">Current Score (Episode {currentEpisode})</div>
            </div>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex mt-3 border-b border-yellow-200">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'global' 
                ? 'border-orange-500 text-orange-600 bg-white rounded-t-lg' 
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🌍 Global ({globalHighscores.length})
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'local' 
                ? 'border-orange-500 text-orange-600 bg-white rounded-t-lg' 
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            💾 Local ({localHighscores.length})
          </button>
        </div>
        
        {/* Mode Filter */}
        <div className="flex mt-2 px-4 pb-2">
          <div className="text-xs text-gray-600 mr-2">Filter:</div>
          <button
            onClick={() => setModeFilter('all')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              modeFilter === 'all' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            All ({currentHighscores.length})
          </button>
          <button
            onClick={() => setModeFilter('easy')}
            className={`px-2 py-1 text-xs rounded transition-colors ml-1 ${
              modeFilter === 'easy' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Easy ({currentHighscores.filter(h => h.mode === 'easy').length})
          </button>
          <button
            onClick={() => setModeFilter('complex')}
            className={`px-2 py-1 text-xs rounded transition-colors ml-1 ${
              modeFilter === 'complex' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Complex ({currentHighscores.filter(h => h.mode === 'complex').length})
          </button>
        </div>
      </div>

      {/* Submit Form */}
      {showSubmitForm && (
        <div className="p-4 border-b border-yellow-200 bg-white">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                maxLength={20}
              />
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              Score: <span className="font-bold text-orange-600">{currentScore}</span> | Episode: {currentEpisode} | {formatMode(currentMode)}
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              <div className="font-medium mb-1">Configuration:</div>
              <div>Learning Rate (α): {currentConfig.learningRate}</div>
              <div>Discount Factor (γ): {currentConfig.discountFactor}</div>
              <div>Epsilon (ε): {currentConfig.epsilon}</div>
              <div>Heuristics: {currentConfig.useDirectionalHeuristics ? 
                `Enabled (${currentConfig.heuristicWeight || 0.1})` : 'Disabled'}</div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={submitScore}
                disabled={!canSubmit || isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-md hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Score'}
              </button>
              <button
                onClick={() => setShowSubmitForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Highscores List */}
      <div className="bg-white rounded-b-lg">
        {filteredHighscores.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <div>
              {currentHighscores.length === 0 
                ? 'No scores yet. Be the first to submit!' 
                : `No scores found for ${modeFilter === 'all' ? 'any' : modeFilter} mode.`
              }
            </div>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {filteredHighscores.map((entry, index) => (
              <div 
                key={entry.id} 
                className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-400 text-white' :
                      index === 1 ? 'bg-gray-300 text-white' :
                      index === 2 ? 'bg-orange-400 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{entry.name}</div>
                      <div className="text-xs text-gray-500">
                        Episode {entry.episode} • {formatDate(entry.timestamp)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {formatMode(entry.mode)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">{entry.score}</div>
                    <div className="text-xs text-gray-500 truncate max-w-32">
                      {formatConfig(entry.config)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 