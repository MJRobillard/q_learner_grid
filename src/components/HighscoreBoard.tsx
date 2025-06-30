import React, { useState, useEffect } from 'react';
import { QLearningConfig } from '@/lib/qLearning';
import { HighscoreEntry, addHighscore, getHighscores, subscribeToHighscores, signInAsGuest, signInWithGoogle, getCurrentUser, onAuthChange, signOutUser } from '@/lib/firebase';

interface HighscoreBoardProps {
  currentScore: number;
  currentEpisode: number;
  currentConfig: QLearningConfig;
  currentMode: 'easy' | 'complex' | 'localMinima' | 'randomBinomial';
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
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('global');
  const [modeFilter, setModeFilter] = useState<'all' | 'easy' | 'complex' | 'localMinima'>('all');
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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

  // Load global highscores from Firebase and set up real-time subscription
  useEffect(() => {
    const loadGlobalHighscores = async () => {
      try {
        const highscores = await getHighscores();
        setGlobalHighscores(highscores);
        setFirebaseConnected(true);
      } catch (e) {
        console.log('Failed to load global highscores from Firebase, using local only');
        setFirebaseConnected(false);
      }
    };

    loadGlobalHighscores();
  }, []);

  // Set up real-time subscription to Firebase
  useEffect(() => {
    if (!firebaseConnected) return;

    const unsubscribe = subscribeToHighscores((highscores) => {
      setGlobalHighscores(highscores);
    });

    return () => unsubscribe();
  }, [firebaseConnected]);

  // Save local highscores to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('qlearning-highscores', JSON.stringify(localHighscores));
  }, [localHighscores]);

  const handleSignInAsGuest = async () => {
    setIsSigningIn(true);
    const result = await signInAsGuest();
    setIsSigningIn(false);
    
    if (result.success) {
      setShowAuthForm(false);
      setShowSubmitForm(true);
    } else {
      alert('Failed to sign in as guest. Please try again.');
    }
  };

  const handleSignInWithGoogle = async () => {
    setIsSigningIn(true);
    const result = await signInWithGoogle();
    setIsSigningIn(false);
    
    if (result.success) {
      setShowAuthForm(false);
      setShowSubmitForm(true);
      // Pre-fill name with Google display name if available
      const user = getCurrentUser();
      if (user?.displayName) {
        setPlayerName(user.displayName);
      }
    } else {
      alert('Failed to sign in with Google. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setShowSubmitForm(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const submitScore = async () => {
    if (!playerName.trim() || !currentUser) return;

    setIsSubmitting(true);
    
    const newEntry: Omit<HighscoreEntry, 'id'> = {
      name: playerName.trim(),
      score: currentScore,
      episode: currentEpisode,
      config: currentConfig,
      mode: currentMode,
      timestamp: Date.now()
    };

    // Add to local highscores
    const localEntry: HighscoreEntry = {
      id: Date.now().toString(),
      ...newEntry
    };
    
    const updatedLocalHighscores = [...localHighscores, localEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10

    setLocalHighscores(updatedLocalHighscores);

    // Try to submit to Firebase
    try {
      const result = await addHighscore(newEntry);
      
      if (result.success) {
        console.log(`Score submitted! Global position: ${result.position}`);
        // Real-time update will handle the UI update
      } else {
        console.log('Firebase submission failed:', result.error);
      }
    } catch (e) {
      console.log('Firebase submission failed, but score saved locally');
    }

    setShowSubmitForm(false);
    setPlayerName('');
    setIsSubmitting(false);
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

  const formatMode = (mode: 'easy' | 'complex' | 'localMinima' | 'randomBinomial') => {
    if (mode === 'easy') return '🟢 Easy (8×8)';
    if (mode === 'complex') return '🔴 Complex (12×12)';
    if (mode === 'localMinima') return '�� Local Minima';
    if (mode === 'randomBinomial') return '🟩 Random Binomial (10×10)';
    return 'Unknown Mode';
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
            {activeTab === 'global' && (
              <div className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                   title={firebaseConnected ? 'Connected to Firebase' : 'Firebase disconnected'} />
            )}
          </div>
          {currentScore > 0 && !currentUser && (
            <button
              onClick={() => setShowAuthForm(true)}
              className="text-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Submit Score
            </button>
          )}
          {currentUser && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">
                {currentUser.providerData?.[0]?.providerId === 'google.com' 
                  ? `Signed in as ${currentUser.displayName || currentUser.email}`
                  : 'Signed in as Guest'
                }
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
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
          <button
            onClick={() => setModeFilter('localMinima')}
            className={`px-2 py-1 text-xs rounded transition-colors ml-1 ${
              modeFilter === 'localMinima' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Local Minima ({currentHighscores.filter(h => h.mode === 'localMinima').length})
          </button>
        </div>
      </div>

      {/* Authentication Form */}
      {showAuthForm && (
        <div className="p-4 border-b border-yellow-200 bg-white">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl mb-2">🔐</div>
              <h3 className="text-lg font-bold text-gray-800">Sign in to Submit Score</h3>
              <p className="text-sm text-gray-600">Choose how you'd like to submit your score</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleSignInWithGoogle}
                disabled={isSigningIn}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              
              <button
                onClick={handleSignInAsGuest}
                disabled={isSigningIn}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
              >
                {isSigningIn ? 'Signing in...' : 'Continue as Guest'}
              </button>
              
              <div className="text-xs text-gray-500 text-center">
                Guest accounts are anonymous and temporary
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAuthForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Form */}
      {showSubmitForm && currentUser && (
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
                placeholder={currentUser.displayName || "Enter your name"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                maxLength={20}
              />
              {currentUser.providerData?.[0]?.providerId === 'google.com' && (
                <div className="text-xs text-gray-500 mt-1">
                  Using Google account: {currentUser.displayName || currentUser.email}
                </div>
              )}
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