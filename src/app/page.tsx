'use client';

import { useState, useEffect, useCallback } from 'react';
import { QLearningEnvironment, DEFAULT_CONFIG, CHALLENGING_CONFIG, Position, QLearningConfig } from '@/lib/qLearning';
import GridVisualization from '@/components/GridVisualization';
import ControlsAndStats from '@/components/ControlsAndStats';
import EpisodeHistory from '@/components/EpisodeHistory';
import HyperparameterControls from '@/components/HyperparameterControls';
import HighscoreBoard from '@/components/HighscoreBoard';

export default function QLearningGrid() {
  const [currentConfigType, setCurrentConfigType] = useState<'default' | 'challenging'>('default');
  const [environment] = useState(() => new QLearningEnvironment(DEFAULT_CONFIG));
  const [grid, setGrid] = useState(environment.getGrid());
  const [agentPosition, setAgentPosition] = useState<Position>(DEFAULT_CONFIG.startPosition);
  const [episode, setEpisode] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [episodeHistory, setEpisodeHistory] = useState<number[]>([]);
  const [config, setConfig] = useState<QLearningConfig>(DEFAULT_CONFIG);

  // Switch between configurations
  const switchConfiguration = useCallback((configType: 'default' | 'challenging') => {
    const newConfig = configType === 'default' ? DEFAULT_CONFIG : CHALLENGING_CONFIG;
    environment.updateConfig(newConfig);
    setConfig(environment.getConfig());
    setGrid(environment.getGrid());
    setAgentPosition(environment.getCurrentPosition());
    setCurrentConfigType(configType);
    setEpisode(0);
    setTotalReward(0);
    setEpisodeHistory([]);
  }, [environment]);

  // Update grid from environment
  const updateGrid = useCallback(() => {
    setGrid(environment.getGrid());
  }, [environment]);

  // Handle configuration changes
  const handleConfigChange = useCallback((newConfig: Partial<QLearningConfig>) => {
    environment.updateConfig(newConfig);
    setConfig(environment.getConfig());
  }, [environment]);

  // Reset environment
  const resetEnvironment = useCallback(() => {
    environment.reset();
    environment.resetPosition();
    setGrid(environment.getGrid());
    setAgentPosition(environment.getCurrentPosition());
    setEpisode(0);
    setTotalReward(0);
    setEpisodeHistory([]);
  }, [environment]);

  // Run one episode with visualization
  const runEpisode = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    let episodeReward = 0;
    let steps = 0;
    const maxSteps = 100;
    
    // Reset environment position
    environment.resetPosition();
    setAgentPosition(environment.getCurrentPosition());
    
    while (steps < maxSteps) {
      // Take a step
      const stepResult = environment.step();
      
      if (!stepResult) {
        // Episode finished
        break;
      }
      
      // Update agent position
      setAgentPosition(stepResult.nextState);
      
      // Update reward
      episodeReward += stepResult.reward;
      setTotalReward(episodeReward);
      
      steps++;
      
      // Update grid display
      updateGrid();
      
      // Add delay for visualization
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setEpisode(prev => prev + 1);
    setEpisodeHistory(prev => [...prev, episodeReward]); // Keep all episodes
    setIsRunning(false);
  }, [environment, isRunning, updateGrid]);

  // Run multiple episodes
  const runMultipleEpisodes = useCallback(async (count: number) => {
    if (isRunning) return;
    
    setIsRunning(true);
    for (let i = 0; i < count; i++) {
      const result = environment.runEpisode();
      setEpisode(prev => prev + 1);
      setEpisodeHistory(prev => [...prev, result.totalReward]); // Keep all episodes
      setTotalReward(result.totalReward);
      
      // Update grid display
      updateGrid();
      
      // Small delay between episodes
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    setIsRunning(false);
  }, [environment, isRunning, updateGrid]);

  // Initialize on component mount
  useEffect(() => {
    resetEnvironment();
  }, [resetEnvironment]);

  // Handle cell click (optional feature)
  const handleCellClick = (row: number, col: number) => {
    console.log(`Clicked cell (${row}, ${col})`);
    // You could add features like setting hazards, start/goal positions, etc.
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
            Q-Learning Grid World
          </h1>
        </div>
      </div>

      {/* Configuration Selector */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="text-sm font-medium text-blue-800">Grid Configuration:</span>
            <div className="flex bg-white rounded-lg shadow-sm border border-blue-200">
              <button
                onClick={() => switchConfiguration('default')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  currentConfigType === 'default'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Beginner (8×8)
              </button>
              <button
                onClick={() => switchConfiguration('challenging')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  currentConfigType === 'challenging'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Advanced (12×12)
              </button>
            </div>
            {currentConfigType === 'challenging' && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                Maze-like environment with multiple paths
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Layout: Stacked */}
        <div className="lg:hidden space-y-6">
          {/* Grid Visualization */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <GridVisualization
              grid={grid}
              agentPosition={agentPosition}
              startPosition={config.startPosition}
              goalPosition={config.goalPosition}
              hazardPositions={config.hazardPositions}
              environment={environment}
              onCellClick={handleCellClick}
              useHeuristics={config.useDirectionalHeuristics}
              heuristicMethod={config.heuristicMethod}
            />
          </div>

          {/* Controls and Stats */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <ControlsAndStats
              episode={episode}
              totalReward={totalReward}
              isRunning={isRunning}
              onRunEpisode={runEpisode}
              onRunMultipleEpisodes={runMultipleEpisodes}
              onReset={resetEnvironment}
            />
          </div>

          {/* Highscore Board - Prominent Display */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg border-2 border-yellow-200">
            <HighscoreBoard
              currentScore={totalReward}
              currentEpisode={episode}
              currentConfig={config}
              currentMode={currentConfigType === 'default' ? 'easy' : 'complex'}
            />
          </div>

          {/* Episode History */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <EpisodeHistory episodeHistory={episodeHistory} />
          </div>

          {/* Hyperparameter Controls - Scrollable */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Learning Parameters</h3>
              <p className="text-sm text-gray-600 mt-1">Scroll to configure the Q-learning algorithm</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <HyperparameterControls
                config={config}
                onConfigChange={handleConfigChange}
              />
            </div>
          </div>
        </div>

        {/* Desktop Layout: Grid */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Left Column: Grid and Episode History */}
          <div className="lg:col-span-8 space-y-6">
            {/* Grid Visualization */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <GridVisualization
                grid={grid}
                agentPosition={agentPosition}
                startPosition={config.startPosition}
                goalPosition={config.goalPosition}
                hazardPositions={config.hazardPositions}
                environment={environment}
                onCellClick={handleCellClick}
                useHeuristics={config.useDirectionalHeuristics}
                heuristicMethod={config.heuristicMethod}
              />
            </div>

            {/* Episode History */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <EpisodeHistory episodeHistory={episodeHistory} />
            </div>
          </div>

          {/* Right Column: Controls, Highscores, and Settings */}
          <div className="lg:col-span-4 space-y-6">
            {/* Controls and Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <ControlsAndStats
                episode={episode}
                totalReward={totalReward}
                isRunning={isRunning}
                onRunEpisode={runEpisode}
                onRunMultipleEpisodes={runMultipleEpisodes}
                onReset={resetEnvironment}
              />
            </div>

            {/* Highscore Board - Prominent Display */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg border-2 border-yellow-200">
              <HighscoreBoard
                currentScore={totalReward}
                currentEpisode={episode}
                currentConfig={config}
                currentMode={currentConfigType === 'default' ? 'easy' : 'complex'}
              />
            </div>

            {/* Hyperparameter Controls - Scrollable */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Learning Parameters</h3>
                <p className="text-sm text-gray-600 mt-1">Scroll to configure the Q-learning algorithm</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <HyperparameterControls
                  config={config}
                  onConfigChange={handleConfigChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 