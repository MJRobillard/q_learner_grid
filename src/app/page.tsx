'use client';

import { useState, useEffect, useCallback } from 'react';
import { QLearningConfig, DEFAULT_CONFIG, CHALLENGING_CONFIG, LOCAL_MINIMA_CONFIG, Position, Cell, CellType } from '@/lib/qLearning';
import { RLAlgorithmFactory, LearningMethod, RLEnvironment } from '@/lib/rlAlgorithms';
import GridVisualization from '@/components/GridVisualization';
import ControlsAndStats from '@/components/ControlsAndStats';
import EpisodeHistory from '@/components/EpisodeHistory';
import HyperparameterControls from '@/components/HyperparameterControls';
import HighscoreBoard from '@/components/HighscoreBoard';
import AlgorithmSelector from '@/components/AlgorithmSelector';

export default function QLearningGrid() {
  const [currentConfigType, setCurrentConfigType] = useState<'default' | 'challenging' | 'localMinima'>('default');
  const [currentMethod, setCurrentMethod] = useState<LearningMethod>('qlearning');
  const [environment, setEnvironment] = useState<RLEnvironment>(() => 
    RLAlgorithmFactory.createEnvironment('qlearning', DEFAULT_CONFIG)
  );
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [agentPosition, setAgentPosition] = useState<Position>(DEFAULT_CONFIG.startPosition);
  const [episode, setEpisode] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [episodeHistory, setEpisodeHistory] = useState<number[]>([]);
  const [config, setConfig] = useState<QLearningConfig>(DEFAULT_CONFIG);

  // Convert SARSA grid to Q-Learning grid format for compatibility
  const convertGridToCellFormat = useCallback((rlGrid: Cell[][] | CellType[][]): Cell[][] => {
    if (currentMethod === 'qlearning') {
      return rlGrid as Cell[][];
    }
    
    // Convert SARSA grid format to Cell format
    const cellGrid: Cell[][] = [];
    const sarsaGrid = rlGrid as CellType[][];
    
    for (let row = 0; row < sarsaGrid.length; row++) {
      cellGrid[row] = [];
      for (let col = 0; col < sarsaGrid[row].length; col++) {
        const cellType = sarsaGrid[row][col];
        const qValues = environment.getQValuesForPosition({ row, col });
        cellGrid[row][col] = {
          type: cellType,
          qValues
        };
      }
    }
    return cellGrid;
  }, [currentMethod, environment]);

  // Switch between configurations
  const switchConfiguration = useCallback((configType: 'default' | 'challenging' | 'localMinima') => {
    const newConfig = configType === 'default' ? DEFAULT_CONFIG : configType === 'challenging' ? CHALLENGING_CONFIG : LOCAL_MINIMA_CONFIG;
    const newEnvironment = RLAlgorithmFactory.createEnvironment(currentMethod, newConfig);
    setEnvironment(newEnvironment);
    setConfig(newEnvironment.getConfig());
    setGrid(convertGridToCellFormat(newEnvironment.getGrid()));
    setAgentPosition(newEnvironment.getCurrentPosition());
    setCurrentConfigType(configType);
    setEpisode(0);
    setTotalReward(0);
    setEpisodeHistory([]);
  }, [currentMethod, convertGridToCellFormat]);

  // Switch between learning methods
  const switchLearningMethod = useCallback((method: LearningMethod) => {
    const newEnvironment = RLAlgorithmFactory.createEnvironment(method, config);
    setEnvironment(newEnvironment);
    setCurrentMethod(method);
    setGrid(convertGridToCellFormat(newEnvironment.getGrid()));
    setAgentPosition(newEnvironment.getCurrentPosition());
    setEpisode(0);
    setTotalReward(0);
    setEpisodeHistory([]);
  }, [config, convertGridToCellFormat]);

  // Update grid from environment
  const updateGrid = useCallback(() => {
    setGrid(convertGridToCellFormat(environment.getGrid()));
  }, [environment, convertGridToCellFormat]);

  // Handle configuration changes
  const handleConfigChange = useCallback((newConfig: Partial<QLearningConfig>) => {
    environment.updateConfig(newConfig);
    setConfig(environment.getConfig());
  }, [environment]);

  // Reset environment
  const resetEnvironment = useCallback(() => {
    environment.reset();
    environment.resetPosition();
    setGrid(convertGridToCellFormat(environment.getGrid()));
    setAgentPosition(environment.getCurrentPosition());
    setEpisode(0);
    setTotalReward(0);
    setEpisodeHistory([]);
  }, [environment, convertGridToCellFormat]);

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
            Reinforcement Learning Grid World
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Compare Q-Learning and SARSA algorithms
          </p>
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
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentConfigType === 'default'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Beginner (8×8)
              </button>
              <button
                onClick={() => switchConfiguration('challenging')}
                className={`px-4 py-2 text-sm font-medium border-l border-r border-blue-200 transition-colors ${
                  currentConfigType === 'challenging'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Advanced (12×12)
              </button>
              <button
                onClick={() => switchConfiguration('localMinima')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentConfigType === 'localMinima'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Local Minima (10×10)
              </button>
            </div>
            {currentConfigType === 'challenging' && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                Maze-like environment with multiple paths
              </div>
            )}
            {currentConfigType === 'localMinima' && (
              <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
                Reward islands that can trap the agent
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Layout: Stacked */}
        <div className="lg:hidden space-y-6">
          {/* Algorithm Selector */}
          <AlgorithmSelector
            currentMethod={currentMethod}
            onMethodChange={switchLearningMethod}
          />

          {/* Highscore Board - Moved to top */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <HighscoreBoard
              currentScore={totalReward}
              currentEpisode={episode}
              currentConfig={config}
              currentMode={currentConfigType === 'default' ? 'easy' : currentConfigType === 'challenging' ? 'complex' : 'localMinima'}
            />
          </div>

          {/* Grid Visualization */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <GridVisualization
              grid={grid}
              agentPosition={agentPosition}
              startPosition={config.startPosition}
              goalPosition={config.goalPosition}
              hazardPositions={config.hazardPositions}
              rewardPositions={config.rewardPositions}
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

          {/* Hyperparameter Controls */}
          <div className="bg-white rounded-lg shadow-lg">
            <HyperparameterControls
              config={config}
              onConfigChange={handleConfigChange}
              currentMethod={currentMethod}
            />
          </div>

          {/* Episode History */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <EpisodeHistory
              episodeHistory={episodeHistory}
            />
          </div>
        </div>

        {/* Desktop Layout: Two-column with grid and controls on left, hyperparameters on right */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6">
          {/* Left Column: Grid, Algorithm Selector, and Main Controls */}
          <div className="lg:col-span-3 space-y-6">
            {/* Algorithm Selector */}
            <AlgorithmSelector
              currentMethod={currentMethod}
              onMethodChange={switchLearningMethod}
            />

            {/* Grid Visualization */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <GridVisualization
                grid={grid}
                agentPosition={agentPosition}
                startPosition={config.startPosition}
                goalPosition={config.goalPosition}
                hazardPositions={config.hazardPositions}
                rewardPositions={config.rewardPositions}
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

            {/* Highscore Board */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <HighscoreBoard
                currentScore={totalReward}
                currentEpisode={episode}
                currentConfig={config}
                currentMode={currentConfigType === 'default' ? 'easy' : currentConfigType === 'challenging' ? 'complex' : 'localMinima'}
              />
            </div>
          </div>

          {/* Right Column: Hyperparameters and History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hyperparameter Controls */}
            <div className="bg-white rounded-lg shadow-lg">
              <HyperparameterControls
                config={config}
                onConfigChange={handleConfigChange}
                currentMethod={currentMethod}
              />
            </div>

            {/* Episode History */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <EpisodeHistory
                episodeHistory={episodeHistory}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="text-sm text-gray-300 mb-4 sm:mb-0">
              © 2025 Reinforcement Learning Grid World
            </div>
            <div className="flex items-center space-x-6">
              <a 
                href="https://mjrobillard.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                mjrobillard.com
              </a>
              <a 
                href="https://github.com/MJRobillard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 