// QLearningEnvironment.ts

export type CellType = 'empty' | 'start' | 'goal' | 'hazard';
export type Action = 'up' | 'down' | 'left' | 'right';
export type Position = { row: number; col: number };

export interface Cell {
  type: CellType;
  qValues: Record<Action, number>;
}

export interface RewardPosition {
  position: Position;
  reward: number;
}

export interface QLearningConfigWithExtras extends QLearningConfig {
  rewardPositions: RewardPosition[];
  epsilonDecay: number;
  minEpsilon: number;
  convergenceThreshold: number;
  maxEpisodes: number;
  maxStepsPerEpisode: number;
}

export interface QLearningConfig {
  gridSize: number;
  startPosition: Position;
  goalPosition: Position;
  hazardPositions: Position[];
  rewardPositions?: RewardPosition[]; // Optional for backward compatibility
  
  // learning params
  learningRate: number;        // α
  discountFactor: number;      // γ
  epsilon: number;             // initial ε
  epsilonDecay?: number;       // e.g. 0.995 per episode
  minEpsilon?: number;         // floor for ε

  // reward shaping
  rewards: {
    goal: number;
    hazard: number;
    step: number;
  };

  // directional heuristics
  useDirectionalHeuristics?: boolean;  // Enable goal-directed heuristics
  heuristicWeight?: number;            // Weight for heuristic reward (0-1)
  heuristicMethod?: 'manhattan' | 'euclidean' | 'chebyshev'; // Distance metric

  // extras
  normalizeRewards?: boolean;  // scale reward into [0,1]
  normalizationMethod?: 'minmax' | 'zscore';
  convergenceThreshold?: number; // stop training if avg ΔQ per episode < this

  maxEpisodes?: number;        // for training loop
  maxStepsPerEpisode?: number; // default fallback
}

export const DEFAULT_CONFIG: QLearningConfig = {
  gridSize: 8,
  startPosition: { row: 0, col: 0 },
  goalPosition: { row: 7, col: 7 },
  hazardPositions: [
    { row: 2, col: 2 },
    { row: 3, col: 4 },
    { row: 5, col: 3 },
    { row: 6, col: 6 }
  ],
  learningRate: 0.1,
  discountFactor: 0.9,
  epsilon: 0.1,
  epsilonDecay: 0.995,
  minEpsilon: 0.01,
  rewards: {
    goal: 500,
    hazard: -100,
    step: -1
  },
  useDirectionalHeuristics: false,
  heuristicWeight: 0.1,
  heuristicMethod: 'manhattan',
  normalizeRewards: false,
  normalizationMethod: 'minmax',
  convergenceThreshold: 1e-4,
  maxEpisodes: 1000,
  maxStepsPerEpisode: 100
};

export const CHALLENGING_CONFIG: QLearningConfig = {
  gridSize: 10,
  startPosition: { row: 0, col: 0 },
  goalPosition: { row: 5, col: 7 },
  hazardPositions: [
    // Top-left bottleneck
    { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 1 }, 

    // Mid-grid traps, leaving only one winding corridor
    { row: 3, col: 3 }, { row: 3, col: 4 },
    { row: 4, col: 4 }, { row: 4, col: 5 },
    { row: 5, col: 5 }, { row: 5, col: 6 },
    { row: 6, col: 6 }, 

    // Right-side detour hazards
    { row: 2, col: 8 }, { row: 3, col: 8 },
    { row: 4, col: 8 }, { row: 5, col: 8 },

    // Bottom-right choke
    { row: 8, col: 9 }, { row: 9, col: 9 },
    { row: 9, col: 10 }, { row: 10, col: 9 },

    // Strategic edge hazards to discourage hugging walls
    { row: 0, col: 6 }, { row: 0, col: 7 },
    { row: 6, col: 0 }, { row: 7, col: 0 },
    { row: 9, col: 6 }, { row: 9, col: 7 },
    { row: 6, col: 9 }, { row: 7, col: 9 }
  ],
  learningRate: 0.15,
  discountFactor: 0.95,
  epsilon: 0.2,
  epsilonDecay: 0.998,
  minEpsilon: 0.05,
  rewards: {
    goal: 1000,
    hazard: -200,
    step: -2
  },
  useDirectionalHeuristics: true,
  heuristicWeight: 0.2,
  heuristicMethod: 'manhattan',
  normalizeRewards: true,
  normalizationMethod: 'minmax',
  convergenceThreshold: 1e-5,
  maxEpisodes: 2000,
  maxStepsPerEpisode: 200
};

export const LOCAL_MINIMA_CONFIG: QLearningConfigWithExtras = {
  gridSize: 10,
  startPosition: { row: 0, col: 0 },
  goalPosition: { row: 9, col: 9 },

  // Hazards form fences around each reward-island with multiple entrances
  hazardPositions: [
    // funnel out of the start
    { row: 1, col: 0 }, 

    // Island 1 @ (2,2) - multiple entrances
    { row: 1, col: 2 }, { row: 2, col: 1 }, 
    /* entrance at (2,3) */
    { row: 3, col: 2 },
    /* entrance at (2,4) */
    { row: 1, col: 4 }, { row: 3, col: 4 },

    // barrier row at y=4, openings only at x=3 and x=6
    { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 },
    /* gap at (4,3) */ 
    { row: 4, col: 4 }, { row: 4, col: 5 },
    /* gap at (4,6) */
    { row: 4, col: 7 }, { row: 4, col: 8 },

    // Island 2 @ (5,5) - multiple entrances
    { row: 5, col: 4 }, 
    /* entrance at (5,6) */
    { row: 6, col: 5 },
    /* entrance at (6,6) */
    { row: 5, col: 7 }, { row: 7, col: 5 },

    // Island 3 @ (7,2) - multiple entrances  
    { row: 6, col: 2 }, { row: 7, col: 1 }, 
    /* entrance at (7,3) */
    { row: 8, col: 2 },
    /* entrance at (8,3) */
    { row: 6, col: 4 }, { row: 8, col: 4 },

    // hazards near final goal to create a choke
    { row: 8, col: 9 }, { row: 9, col: 8 },

    // a couple of extra decoys
    { row: 3, col: 7 }, { row: 6, col: 7 }
  ],

  // Multiple rewards inside each island (local maxima)
  rewardPositions: [
    // Island 1 rewards (2,2 area)
    { position: { row: 2, col: 2 }, reward: 30 },
    { position: { row: 2, col: 3 }, reward: 25 },
    { position: { row: 3, col: 2 }, reward: 25 },
    { position: { row: 2, col: 4 }, reward: 20 },
    { position: { row: 3, col: 3 }, reward: 15 },

    // Island 2 rewards (5,5 area)
    { position: { row: 5, col: 5 }, reward: 40 },
    { position: { row: 5, col: 6 }, reward: 35 },
    { position: { row: 6, col: 5 }, reward: 35 },
    { position: { row: 6, col: 6 }, reward: 30 },
    { position: { row: 5, col: 7 }, reward: 25 },

    // Island 3 rewards (7,2 area)
    { position: { row: 7, col: 2 }, reward: 35 },
    { position: { row: 7, col: 3 }, reward: 30 },
    { position: { row: 8, col: 2 }, reward: 30 },
    { position: { row: 8, col: 3 }, reward: 25 },
    { position: { row: 7, col: 4 }, reward: 20 }
  ],

  // Final goal is worth substantially more
  rewards: {
    goal:   500,
    hazard: -100,
    step:   -2
  },

  learningRate:     0.1,
  discountFactor:   0.8,    // undervalues long-term enough to trap on locals
  epsilon:          0.2,
  epsilonDecay:     0.995,
  minEpsilon:       0.01,

  // Heuristics can help, but the island traps still create real local optima
  useDirectionalHeuristics: true,
  heuristicWeight:          0.2,
  heuristicMethod:          'manhattan',

  normalizeRewards:   true,
  normalizationMethod: 'minmax',

  convergenceThreshold: 1e-5,
  maxEpisodes:         5000,
  maxStepsPerEpisode:  200
};

export function generateRandomBinomialHazardsConfig(seed: number = Date.now()): QLearningConfig {
  // Helper for seeded random
  function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }
  const rand = mulberry32(seed);
  const gridSize = 10;
  const startPosition = { row: 0, col: 0 };
  // Binomial distribution parameters
  const centers = [
    { row: 3, col: 3 },
    { row: 7, col: 7 }
  ];
  const stddev = 1.5;
  const hazardPositions: Position[] = [];
  // For each cell, decide if it's a hazard
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Don't put hazard at start
      if (row === startPosition.row && col === startPosition.col) continue;
      // Calculate probability from both centers
      let prob = 0;
      for (const center of centers) {
        const d2 = (row - center.row) ** 2 + (col - center.col) ** 2;
        prob += Math.exp(-d2 / (2 * stddev * stddev));
      }
      prob = Math.min(prob, 0.7); // Cap probability
      if (rand() < prob) {
        hazardPositions.push({ row, col });
      }
    }
  }
  // Pick a random goal location not at start or hazard
  let goalPosition: Position = { row: 9, col: 9 };
  const freeCells = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if ((row !== startPosition.row || col !== startPosition.col) &&
          !hazardPositions.some(h => h.row === row && h.col === col)) {
        freeCells.push({ row, col });
      }
    }
  }
  if (freeCells.length > 0) {
    goalPosition = freeCells[Math.floor(rand() * freeCells.length)];
  }
  return {
    gridSize,
    startPosition,
    goalPosition,
    hazardPositions,
    learningRate: 0.15,
    discountFactor: 0.95,
    epsilon: 0.2,
    epsilonDecay: 0.998,
    minEpsilon: 0.05,
    rewards: {
      goal: 1000,
      hazard: -200,
      step: -2
    },
    useDirectionalHeuristics: true,
    heuristicWeight: 0.2,
    heuristicMethod: 'manhattan',
    normalizeRewards: true,
    normalizationMethod: 'minmax',
    convergenceThreshold: 1e-5,
    maxEpisodes: 2000,
    maxStepsPerEpisode: 200
  };
}

export interface StepResult {
  state: Position;
  action: Action;
  nextState: Position;
  reward: number;
  normalizedReward?: number;
  reachedGoal: boolean;
  hitHazard: boolean;
}

export interface EpisodeResult {
  episode: number;
  steps: number;
  totalReward: number;
  totalNormalizedReward?: number;
  reachedGoal: boolean;
  hitHazard: boolean;
  averageQChange: number;
  history: StepResult[];
}

export class QLearningEnvironment {
  private grid: Cell[][];
  private config: QLearningConfig;
  private minRewardSeen = Infinity;
  private maxRewardSeen = -Infinity;
  private rewardHistory: number[] = [];
  private currentPosition: Position;

  constructor(config: QLearningConfig) {
    this.config = { 
      normalizeRewards: false,
      normalizationMethod: 'minmax',
      epsilonDecay: 1,
      minEpsilon: 0,
      convergenceThreshold: 1e-4,
      maxEpisodes: 1000,
      maxStepsPerEpisode: 100,
      ...config
    };
    this.grid = this.initializeGrid();
    this.currentPosition = { ...this.config.startPosition };
  }

  // Public methods for UI interaction
  public getGrid(): Cell[][] {
    return this.grid.map(row => row.map(cell => ({ ...cell })));
  }

  public getCurrentPosition(): Position {
    return { ...this.currentPosition };
  }

  public getConfig(): QLearningConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<QLearningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.grid = this.initializeGrid();
  }

  public reset(): void {
    this.grid = this.initializeGrid();
    this.minRewardSeen = Infinity;
    this.maxRewardSeen = -Infinity;
    this.rewardHistory = [];
  }

  public resetPosition(): void {
    this.currentPosition = { ...this.config.startPosition };
  }

  public step(): StepResult | null {
    // Check if episode is finished
    if (this.currentPosition.row === this.config.goalPosition.row && 
        this.currentPosition.col === this.config.goalPosition.col) {
      return null; // Episode finished
    }
    
    if (this.config.hazardPositions.some(h => 
        h.row === this.currentPosition.row && h.col === this.currentPosition.col)) {
      return null; // Hit hazard, episode finished
    }

    // Choose action
    const action = this.chooseAction(this.currentPosition, this.config.epsilon);
    const nextPosition = this.getNextPosition(this.currentPosition, action);
    const baseReward = this.rawReward(nextPosition);
    
    // Calculate heuristic reward
    const heuristicReward = this.calculateHeuristicReward(this.currentPosition, nextPosition);
    const totalReward = baseReward + heuristicReward;
    
    // Update Q-values
    this.updateQ(this.currentPosition, action, nextPosition, totalReward);
    
    // Move to next position
    const oldPosition = { ...this.currentPosition };
    this.currentPosition = nextPosition;
    
    return {
      state: oldPosition,
      action,
      nextState: nextPosition,
      reward: totalReward,
      reachedGoal: nextPosition.row === this.config.goalPosition.row && 
                   nextPosition.col === this.config.goalPosition.col,
      hitHazard: this.config.hazardPositions.some(h => 
        h.row === nextPosition.row && h.col === nextPosition.col)
    };
  }

  public runEpisode(): EpisodeResult {
    let pos = { ...this.config.startPosition };
    const history: StepResult[] = [];
    let totalReward = 0;
    let steps = 0;
    let reachedGoal = false;
    let hitHazard = false;

    while (steps < this.config.maxStepsPerEpisode!) {
      // Check terminal conditions
      if (pos.row === this.config.goalPosition.row && pos.col === this.config.goalPosition.col) {
        reachedGoal = true;
        break;
      }
      if (this.config.hazardPositions.some(h => h.row === pos.row && h.col === pos.col)) {
        hitHazard = true;
        break;
      }

      const action = this.chooseAction(pos, this.config.epsilon);
      const next = this.getNextPosition(pos, action);
      const baseReward = this.rawReward(next);
      const heuristicReward = this.calculateHeuristicReward(pos, next);
      const stepReward = baseReward + heuristicReward;
      
      this.updateQ(pos, action, next, stepReward);
      
      history.push({
        state: pos,
        action,
        nextState: next,
        reward: stepReward,
        reachedGoal: false,
        hitHazard: false
      });
      
      totalReward += stepReward;
      pos = next;
      steps++;
    }

    return {
      episode: 0, // Will be set by caller
      steps,
      totalReward,
      reachedGoal,
      hitHazard,
      averageQChange: 0, // Simplified for now
      history
    };
  }

  // Methods for visualization
  public getStateValue(pos: Position): number {
    const cell = this.grid[pos.row]?.[pos.col];
    if (!cell) return 0;
    
    // Return the maximum Q-value for this state
    return Math.max(...Object.values(cell.qValues));
  }

  public getMinStateValue(): number {
    let minValue = Infinity;
    for (let r = 0; r < this.config.gridSize; r++) {
      for (let c = 0; c < this.config.gridSize; c++) {
        const value = this.getStateValue({ row: r, col: c });
        minValue = Math.min(minValue, value);
      }
    }
    return minValue === Infinity ? 0 : minValue;
  }

  public getMaxStateValue(): number {
    let maxValue = -Infinity;
    for (let r = 0; r < this.config.gridSize; r++) {
      for (let c = 0; c < this.config.gridSize; c++) {
        const value = this.getStateValue({ row: r, col: c });
        maxValue = Math.max(maxValue, value);
      }
    }
    return maxValue === -Infinity ? 0 : maxValue;
  }

  private initializeGrid(): Cell[][] {
    const { gridSize, startPosition, goalPosition, hazardPositions } = this.config;
    const newGrid: Cell[][] = [];
    for (let r = 0; r < gridSize; r++) {
      newGrid[r] = [];
      for (let c = 0; c < gridSize; c++) {
        let type: CellType = 'empty';
        if (r === startPosition.row && c === startPosition.col) type = 'start';
        else if (r === goalPosition.row && c === goalPosition.col) type = 'goal';
        else if (hazardPositions.some(h => h.row === r && h.col === c)) type = 'hazard';

        newGrid[r][c] = {
          type,
          qValues: { up: 0, down: 0, left: 0, right: 0 }
        };
      }
    }
    return newGrid;
  }

  public getValidActions(pos: Position): Action[] {
    const { gridSize } = this.config;
    const acts: Action[] = [];
    if (pos.row > 0) acts.push('up');
    if (pos.row < gridSize - 1) acts.push('down');
    if (pos.col > 0) acts.push('left');
    if (pos.col < gridSize - 1) acts.push('right');
    return acts;
  }

  private getNextPosition(pos: Position, action: Action): Position {
    switch (action) {
      case 'up':    return { row: pos.row - 1, col: pos.col };
      case 'down':  return { row: pos.row + 1, col: pos.col };
      case 'left':  return { row: pos.row,     col: pos.col - 1 };
      case 'right': return { row: pos.row,     col: pos.col + 1 };
    }
  }

  private rawReward(pos: Position): number {
    const { goalPosition, hazardPositions, rewards, rewardPositions } = this.config;
    if (pos.row === goalPosition.row && pos.col === goalPosition.col) return rewards.goal;
    if (hazardPositions.some(h => h.row === pos.row && h.col === pos.col)) return rewards.hazard;
    
    // Check for reward positions (local maxima)
    let rewardBonus = 0;
    if (rewardPositions) {
      const rewardPos = rewardPositions.find(rp => rp.position.row === pos.row && rp.position.col === pos.col);
      if (rewardPos) {
        rewardBonus = rewardPos.reward;
      }
    }
    
    return rewards.step + rewardBonus;
  }

  private normalize(r: number): number {
    if (!this.config.normalizeRewards) return r;
    // update running min/max
    this.minRewardSeen = Math.min(this.minRewardSeen, r);
    this.maxRewardSeen = Math.max(this.maxRewardSeen, r);
    if (this.config.normalizationMethod === 'zscore') {
      this.rewardHistory.push(r);
      const mean = this.rewardHistory.reduce((a,b)=>a+b,0)/this.rewardHistory.length;
      const sd = Math.sqrt(this.rewardHistory.reduce((sum,x)=>sum+Math.pow(x-mean,2),0)/this.rewardHistory.length);
      return sd>0 ? (r-mean)/sd : 0;
    } else {
      // min-max
      const range = this.maxRewardSeen - this.minRewardSeen;
      return range>0 ? (r - this.minRewardSeen)/range : 0;
    }
  }

  private chooseAction(pos: Position, epsilon: number): Action {
    const actions = this.getValidActions(pos);
    const q = this.grid[pos.row][pos.col].qValues;
    if (Math.random() < epsilon) {
      return actions[Math.floor(Math.random()*actions.length)];
    }
    // greedy
    return actions.reduce((best, a) => q[a] > q[best] ? a : best, actions[0]);
  }

  private updateQ(pos: Position, action: Action, next: Position, reward: number): number {
    const cell = this.grid[pos.row][pos.col];
    const currQ = cell.qValues[action];
    
    // Get valid actions for the next position to calculate max Q-value
    const validNextActions = this.getValidActions(next);
    const maxNext = validNextActions.length > 0 
      ? Math.max(...validNextActions.map(a => this.grid[next.row][next.col].qValues[a]))
      : 0;
    
    const delta = this.config.learningRate * (reward + this.config.discountFactor * maxNext - currQ);
    cell.qValues[action] = currQ + delta;
    return Math.abs(delta);
  }

  // Add a method to get the best valid action for a position
  public getBestValidAction(pos: Position): Action | null {
    const validActions = this.getValidActions(pos);
    if (validActions.length === 0) return null;
    
    const qValues = this.grid[pos.row][pos.col].qValues;
    return validActions.reduce((best, action) => 
      qValues[action] > qValues[best] ? action : best, validActions[0]
    );
  }

  // Add a method to get the maximum Q-value for valid actions only
  public getMaxValidQValue(pos: Position): number {
    const validActions = this.getValidActions(pos);
    if (validActions.length === 0) return 0;
    
    const qValues = this.grid[pos.row][pos.col].qValues;
    return Math.max(...validActions.map(action => qValues[action]));
  }

  // Heuristic calculation methods
  private calculateDistance(pos1: Position, pos2: Position): number {
    const { heuristicMethod = 'manhattan' } = this.config;
    
    switch (heuristicMethod) {
      case 'manhattan':
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
      case 'euclidean':
        return Math.sqrt(Math.pow(pos1.row - pos2.row, 2) + Math.pow(pos1.col - pos2.col, 2));
      case 'chebyshev':
        return Math.max(Math.abs(pos1.row - pos2.row), Math.abs(pos1.col - pos2.col));
      default:
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
    }
  }

  private calculateHeuristicReward(currentPos: Position, nextPos: Position): number {
    if (!this.config.useDirectionalHeuristics) return 0;
    
    const currentDistance = this.calculateDistance(currentPos, this.config.goalPosition);
    const nextDistance = this.calculateDistance(nextPos, this.config.goalPosition);
    
    // Reward for getting closer to goal, penalty for moving away
    const distanceImprovement = currentDistance - nextDistance;
    const heuristicReward = distanceImprovement * (this.config.heuristicWeight || 0.1);
    
    return heuristicReward;
  }

  private getTotalReward(pos: Position, baseReward: number): number {
    if (!this.config.useDirectionalHeuristics) return baseReward;
    
    // For heuristic calculation, we need to compare current position with the position we're moving to
    // Since we don't have the current position in this context, we'll calculate heuristic based on
    // the position we're evaluating (this is a simplified approach)
    const distanceToGoal = this.calculateDistance(pos, this.config.goalPosition);
    const maxDistance = this.config.gridSize * 2; // Approximate max distance
    const normalizedDistance = distanceToGoal / maxDistance;
    
    // Heuristic reward: closer to goal = higher reward
    const heuristicReward = (1 - normalizedDistance) * (this.config.heuristicWeight || 0.1);
    
    return baseReward + heuristicReward;
  }

  /** Runs full training loop over many episodes */
  public train(): EpisodeResult[] {
    const results: EpisodeResult[] = [];
    let ε = this.config.epsilon!;
    for (let ep = 1; ep <= this.config.maxEpisodes!; ep++) {
      // reset per-episode state
      let pos = { ...this.config.startPosition };
      this.grid = this.initializeGrid();
      const history: StepResult[] = [];
      let totalR = 0, totalNormR = 0, totalDelta = 0;
      let reached = false, hazard = false;

      for (let step = 0; step < this.config.maxStepsPerEpisode!; step++) {
        // terminal?
        if (pos.row===this.config.goalPosition.row && pos.col===this.config.goalPosition.col) { reached=true; break; }
        if (this.config.hazardPositions.some(h=>h.row===pos.row&&h.col===pos.col)) { hazard=true; break; }

        const action = this.chooseAction(pos, ε);
        const next = this.getNextPosition(pos, action);
        const rawR = this.rawReward(next);
        const heuristicR = this.calculateHeuristicReward(pos, next);
        const stepR = rawR + heuristicR;
        const normR = this.normalize(this.config.normalizeRewards ? stepR : rawR);
        const delta = this.updateQ(pos, action, next, this.config.normalizeRewards ? normR : stepR);

        history.push({ state:pos, action, nextState: next,
                       reward: stepR, normalizedReward: normR,
                       reachedGoal: reached, hitHazard: hazard });
        totalR += stepR;
        totalNormR += normR;
        totalDelta += delta;
        pos = next;
      }

      // decay ε
      ε = Math.max(this.config.minEpsilon!, ε * this.config.epsilonDecay!);

      const avgDelta = totalDelta / history.length;
      results.push({
        episode: ep,
        steps: history.length,
        totalReward: totalR,
        totalNormalizedReward: this.config.normalizeRewards ? totalNormR : undefined,
        reachedGoal: reached,
        hitHazard: hazard,
        averageQChange: avgDelta,
        history
      });

      // convergence check
      if (avgDelta < this.config.convergenceThreshold!) break;
    }
    return results;
  }

  /** Helper to extract policy (best action) at each state */
  public getPolicy(): Record<string,Action> {
    const policy: Record<string,Action> = {};
    for (let r=0; r<this.config.gridSize; r++) {
      for (let c=0; c<this.config.gridSize; c++) {
        const actions = this.getValidActions({row:r,col:c});
        policy[`${r},${c}`] = actions.reduce((b,a) => 
          this.grid[r][c].qValues[a] > this.grid[r][c].qValues[b] ? a : b
        , actions[0]);
      }
    }
    return policy;
  }

  /** Get heuristic information for a position */
  public getHeuristicInfo(pos: Position): {
    distanceToGoal: number;
    heuristicReward: number;
    useHeuristics: boolean;
    method: string;
  } {
    const distanceToGoal = this.calculateDistance(pos, this.config.goalPosition);
    const heuristicReward = this.calculateHeuristicReward(pos, pos); // Simplified
    return {
      distanceToGoal,
      heuristicReward,
      useHeuristics: this.config.useDirectionalHeuristics || false,
      method: this.config.heuristicMethod || 'manhattan'
    };
  }

  // Add methods to match RLEnvironment interface
  public getQValuesForPosition(pos: Position): Record<Action, number> {
    const cell = this.grid[pos.row]?.[pos.col];
    if (!cell) return { up: 0, down: 0, left: 0, right: 0 };
    return { ...cell.qValues };
  }

  public getMinQValue(): number {
    let minQ = Infinity;
    for (let row = 0; row < this.config.gridSize; row++) {
      for (let col = 0; col < this.config.gridSize; col++) {
        const qValues = this.getQValuesForPosition({ row, col });
        const minCellQ = Math.min(...Object.values(qValues));
        minQ = Math.min(minQ, minCellQ);
      }
    }
    return minQ === Infinity ? 0 : minQ;
  }

  public getMaxQValue(): number {
    let maxQ = -Infinity;
    for (let row = 0; row < this.config.gridSize; row++) {
      for (let col = 0; col < this.config.gridSize; col++) {
        const qValues = this.getQValuesForPosition({ row, col });
        const maxCellQ = Math.max(...Object.values(qValues));
        maxQ = Math.max(maxQ, maxCellQ);
      }
    }
    return maxQ === -Infinity ? 0 : maxQ;
  }

  public getAverageQValue(): number {
    let totalQ = 0;
    let count = 0;
    for (let row = 0; row < this.config.gridSize; row++) {
      for (let col = 0; col < this.config.gridSize; col++) {
        const qValues = this.getQValuesForPosition({ row, col });
        totalQ += Object.values(qValues).reduce((sum, q) => sum + q, 0);
        count += Object.keys(qValues).length;
      }
    }
    return count > 0 ? totalQ / count : 0;
  }
}
