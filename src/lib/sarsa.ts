import { Matrix } from 'ml-matrix';
import { QLearningConfig, Position, Action, CellType, StepResult, EpisodeResult } from './qLearning';

export interface SARSAAgent {
  // Q-table as a 4D tensor: [gridSize, gridSize, 4 actions, 1]
  qTable: Matrix;
  config: QLearningConfig;
  currentPosition: Position;
  currentAction: Action;
  episodeCount: number;
  totalSteps: number;
}

export class SARSAEnvironment {
  private grid: CellType[][];
  private agent: SARSAAgent;
  private config: QLearningConfig;
  private minRewardSeen = Infinity;
  private maxRewardSeen = -Infinity;
  private rewardHistory: number[] = [];

  constructor(config: QLearningConfig) {
    this.config = { ...config };
    this.grid = this.initializeGrid();
    this.agent = this.initializeAgent();
  }

  private initializeGrid(): CellType[][] {
    const grid: CellType[][] = [];
    for (let row = 0; row < this.config.gridSize; row++) {
      grid[row] = [];
      for (let col = 0; col < this.config.gridSize; col++) {
        grid[row][col] = 'empty';
      }
    }

    // Set start, goal, and hazards
    grid[this.config.startPosition.row][this.config.startPosition.col] = 'start';
    grid[this.config.goalPosition.row][this.config.goalPosition.col] = 'goal';
    
    this.config.hazardPositions.forEach(pos => {
      grid[pos.row][pos.col] = 'hazard';
    });

    return grid;
  }

  private initializeAgent(): SARSAAgent {
    // Initialize Q-table with zeros: [gridSize * gridSize * 4, 1]
    const stateActionSize = this.config.gridSize * this.config.gridSize * 4;
    const qTable = Matrix.zeros(stateActionSize, 1);
    
    return {
      qTable,
      config: this.config,
      currentPosition: { ...this.config.startPosition },
      currentAction: this.chooseInitialAction(),
      episodeCount: 0,
      totalSteps: 0
    };
  }

  private chooseInitialAction(): Action {
    const actions: Action[] = ['up', 'down', 'left', 'right'];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  private getStateIndex(pos: Position): number {
    return pos.row * this.config.gridSize + pos.col;
  }

  private getActionIndex(action: Action): number {
    const actionMap: Record<Action, number> = {
      'up': 0,
      'down': 1,
      'left': 2,
      'right': 3
    };
    return actionMap[action];
  }

  private getQTableIndex(pos: Position, action: Action): number {
    const stateIndex = this.getStateIndex(pos);
    const actionIndex = this.getActionIndex(action);
    return stateIndex * 4 + actionIndex;
  }

  public getQValue(pos: Position, action: Action): number {
    const index = this.getQTableIndex(pos, action);
    return this.agent.qTable.get(index, 0);
  }

  public setQValue(pos: Position, action: Action, value: number): void {
    const index = this.getQTableIndex(pos, action);
    this.agent.qTable.set(index, 0, value);
  }

  public getValidActions(pos: Position): Action[] {
    const actions: Action[] = [];
    const { row, col } = pos;
    const size = this.config.gridSize;

    if (row > 0 && this.grid[row - 1][col] !== 'hazard') actions.push('up');
    if (row < size - 1 && this.grid[row + 1][col] !== 'hazard') actions.push('down');
    if (col > 0 && this.grid[row][col - 1] !== 'hazard') actions.push('left');
    if (col < size - 1 && this.grid[row][col + 1] !== 'hazard') actions.push('right');

    return actions;
  }

  private getNextPosition(pos: Position, action: Action): Position {
    const { row, col } = pos;
    switch (action) {
      case 'up': return { row: Math.max(0, row - 1), col };
      case 'down': return { row: Math.min(this.config.gridSize - 1, row + 1), col };
      case 'left': return { row, col: Math.max(0, col - 1) };
      case 'right': return { row, col: Math.min(this.config.gridSize - 1, col + 1) };
    }
  }

  private getReward(pos: Position): number {
    const cellType = this.grid[pos.row][pos.col];
    switch (cellType) {
      case 'goal': return this.config.rewards.goal;
      case 'hazard': return this.config.rewards.hazard;
      default: return this.config.rewards.step;
    }
  }

  private chooseAction(pos: Position, epsilon: number): Action {
    const validActions = this.getValidActions(pos);
    if (validActions.length === 0) return 'up'; // fallback

    // Epsilon-greedy policy
    if (Math.random() < epsilon) {
      // Exploration: random action
      return validActions[Math.floor(Math.random() * validActions.length)];
    } else {
      // Exploitation: best action
      let bestAction = validActions[0];
      let bestQValue = this.getQValue(pos, bestAction);

      for (const action of validActions) {
        const qValue = this.getQValue(pos, action);
        if (qValue > bestQValue) {
          bestQValue = qValue;
          bestAction = action;
        }
      }
      return bestAction;
    }
  }

  private updateQValue(pos: Position, action: Action, nextPos: Position, nextAction: Action, reward: number): number {
    const currentQ = this.getQValue(pos, action);
    const nextQ = this.getQValue(nextPos, nextAction);
    
    // SARSA update rule: Q(s,a) ← Q(s,a) + α[r + γQ(s',a') - Q(s,a)]
    const newQ = currentQ + this.config.learningRate * (
      reward + this.config.discountFactor * nextQ - currentQ
    );
    
    this.setQValue(pos, action, newQ);
    return newQ;
  }

  public step(): StepResult | null {
    const currentPos = this.agent.currentPosition;
    const currentAction = this.agent.currentAction;

    // Check if episode is finished
    const cellType = this.grid[currentPos.row][currentPos.col];
    if (cellType === 'goal' || cellType === 'hazard') {
      return null;
    }

    // Take action and get next state
    const nextPos = this.getNextPosition(currentPos, currentAction);
    const reward = this.getReward(nextPos);
    
    // Update reward tracking for normalization
    this.minRewardSeen = Math.min(this.minRewardSeen, reward);
    this.maxRewardSeen = Math.max(this.maxRewardSeen, reward);
    this.rewardHistory.push(reward);

    // Choose next action (SARSA is on-policy)
    const nextAction = this.chooseAction(nextPos, this.getCurrentEpsilon());

    // Update Q-value using SARSA
    const qChange = this.updateQValue(currentPos, currentAction, nextPos, nextAction, reward);

    // Update agent state
    this.agent.currentPosition = nextPos;
    this.agent.currentAction = nextAction;
    this.agent.totalSteps++;

    return {
      state: currentPos,
      action: currentAction,
      nextState: nextPos,
      reward,
      reachedGoal: this.grid[nextPos.row][nextPos.col] === 'goal',
      hitHazard: this.grid[nextPos.row][nextPos.col] === 'hazard'
    };
  }

  public runEpisode(): EpisodeResult {
    this.resetPosition();
    let steps = 0;
    let totalReward = 0;
    let reachedGoal = false;
    let hitHazard = false;
    const history: StepResult[] = [];
    let totalQChange = 0;

    const maxSteps = this.config.maxStepsPerEpisode || 100;

    while (steps < maxSteps) {
      const stepResult = this.step();
      
      if (!stepResult) {
        // Episode finished
        const finalCell = this.grid[this.agent.currentPosition.row][this.agent.currentPosition.col];
        reachedGoal = finalCell === 'goal';
        hitHazard = finalCell === 'hazard';
        break;
      }

      history.push(stepResult);
      totalReward += stepResult.reward;
      steps++;
    }

    this.agent.episodeCount++;
    
    return {
      episode: this.agent.episodeCount,
      steps,
      totalReward,
      reachedGoal,
      hitHazard,
      averageQChange: totalQChange / Math.max(1, steps),
      history
    };
  }

  private getCurrentEpsilon(): number {
    const decay = this.config.epsilonDecay || 1;
    const minEpsilon = this.config.minEpsilon || 0;
    return Math.max(minEpsilon, this.config.epsilon * Math.pow(decay, this.agent.episodeCount));
  }

  public resetPosition(): void {
    this.agent.currentPosition = { ...this.config.startPosition };
    this.agent.currentAction = this.chooseInitialAction();
  }

  public reset(): void {
    this.grid = this.initializeGrid();
    this.agent = this.initializeAgent();
    this.minRewardSeen = Infinity;
    this.maxRewardSeen = -Infinity;
    this.rewardHistory = [];
  }

  public getGrid(): CellType[][] {
    return this.grid.map(row => [...row]);
  }

  public getCurrentPosition(): Position {
    return { ...this.agent.currentPosition };
  }

  public getCurrentAction(): Action {
    return this.agent.currentAction;
  }

  public getConfig(): QLearningConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<QLearningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.grid = this.initializeGrid();
  }

  public getPolicy(): Record<string, Action> {
    const policy: Record<string, Action> = {};
    
    for (let row = 0; row < this.config.gridSize; row++) {
      for (let col = 0; col < this.config.gridSize; col++) {
        const pos = { row, col };
        const validActions = this.getValidActions(pos);
        
        if (validActions.length > 0) {
          let bestAction = validActions[0];
          let bestQValue = this.getQValue(pos, bestAction);
          
          for (const action of validActions) {
            const qValue = this.getQValue(pos, action);
            if (qValue > bestQValue) {
              bestQValue = qValue;
              bestAction = action;
            }
          }
          
          policy[`${row},${col}`] = bestAction;
        }
      }
    }
    
    return policy;
  }

  public getQValuesForPosition(pos: Position): Record<Action, number> {
    const actions: Action[] = ['up', 'down', 'left', 'right'];
    const qValues: Record<Action, number> = {} as Record<Action, number>;
    
    actions.forEach(action => {
      qValues[action] = this.getQValue(pos, action);
    });
    
    return qValues;
  }

  public getMaxValidQValue(pos: Position): number {
    const validActions = this.getValidActions(pos);
    if (validActions.length === 0) return 0;
    
    let maxQValue = this.getQValue(pos, validActions[0]);
    for (const action of validActions) {
      const qValue = this.getQValue(pos, action);
      if (qValue > maxQValue) {
        maxQValue = qValue;
      }
    }
    return maxQValue;
  }

  public getBestValidAction(pos: Position): Action | null {
    const validActions = this.getValidActions(pos);
    if (validActions.length === 0) return null;
    
    let bestAction = validActions[0];
    let bestQValue = this.getQValue(pos, bestAction);
    
    for (const action of validActions) {
      const qValue = this.getQValue(pos, action);
      if (qValue > bestQValue) {
        bestQValue = qValue;
        bestAction = action;
      }
    }
    
    return bestAction;
  }

  public getMinQValue(): number {
    return this.agent.qTable.min();
  }

  public getMaxQValue(): number {
    return this.agent.qTable.max();
  }

  public getAverageQValue(): number {
    return this.agent.qTable.mean();
  }

  public getEpisodeCount(): number {
    return this.agent.episodeCount;
  }

  public getTotalSteps(): number {
    return this.agent.totalSteps;
  }
} 