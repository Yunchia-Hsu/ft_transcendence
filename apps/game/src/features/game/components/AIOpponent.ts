// AIOpponent.ts - Advanced AI system for Pong game
// Updated AI system that works with your engine structure
import type { State, Vec } from "./engine";
interface AIDecision {
  direction: -1 | 0 | 1;
  usePowerUp: boolean;
  confidence: number;
}

class PongAI {
  private lastUpdateTime: number = 0;
  private lastStrategyCheck: number = 0;
  private updateInterval: number = 1000; // Ball analysis once per second (expensive)
  private strategyInterval: number = 250; // Strategy check every 250ms (fast)
  private currentDecision: AIDecision = { direction: 0, usePowerUp: false, confidence: 0 };
  private predictedY: number = 0.5;
  private difficulty: number = 0.8;
  private strategyMode: string = 'adaptive';
  private reactionBuffer: (-1 | 0 | 1)[] = [];
  private lastReactionTime: number = 0;
  private onStrategyChange?: (strategy: string) => void; // Callback for strategy changes

  constructor(difficulty: number = 0.8) {
    this.setDifficulty(difficulty);
  }

/*每秒分析一次遊戲狀態（球的軌跡、分數狀況）。
把方向決策丟到 reactionBuffer，模擬人類延遲。
處理緩衝區，將「延遲後」的方向更新到 currentDecision。*/  
  update(gameState: State, currentTime: number): AIDecision {
    // Check strategy every 250ms (fast)
    if (currentTime - this.lastStrategyCheck >= this.strategyInterval) {
      this.checkStrategy(gameState);
      this.lastStrategyCheck = currentTime;
    }

    // Full ball analysis only once per second (project requirement)
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      console.log("AI ANALYZING BALL TRAJECTORY NOW!");
      this.analyzeBallTrajectory(gameState);
      this.lastUpdateTime = currentTime;
    }

    // Process reaction buffer to simulate human-like keyboard input
    this.processReactionBuffer(currentTime);

    return this.currentDecision;
  }

  // Fast strategy check (every 250ms) - only checks score and updates strategy
  private checkStrategy(gameState: State): void {
    const scoreDiff = gameState.score[1] - gameState.score[0];
    const oldStrategy = this.strategyMode;

    if (scoreDiff < 0) {
      this.strategyMode = 'aggressive';
    } else if (scoreDiff > 2) {
      this.strategyMode = 'defensive';
    } else {
      this.strategyMode = 'adaptive';
    }

    // Notify frontend if strategy changed
    if (oldStrategy !== this.strategyMode) {
      console.log(`AI strategy changed from ${oldStrategy} to ${this.strategyMode} (Score: ${gameState.score[0]}-${gameState.score[1]})`);
      this.onStrategyChange?.(this.strategyMode);
    }
  }

  // Full ball trajectory analysis (once per second) - expensive calculations
  private analyzeBallTrajectory(gameState: State): void {
    const ball = gameState.ball;
    const velocity = gameState.vel;
    const myPaddleY = gameState.paddles[1];

    // Predict ball trajectory with physics simulation
    const prediction = this.predictBallTrajectory(ball, velocity);
    this.predictedY = prediction.impactY;

    // Calculate strategic movement
    const strategicMove = this.calculateMove(myPaddleY, prediction, gameState);

    // Add human-like behavior and delays
    this.addToReactionBuffer(strategicMove.direction);

    // Evaluate power-up usage
    const shouldUsePowerUp = this.evaluatePowerUp(gameState, prediction);

    // Update internal decision (will be applied with delay)
    this.currentDecision = {
      direction: 0, // Will be set by reaction buffer
      usePowerUp: shouldUsePowerUp,
      confidence: strategicMove.confidence
    };
  }

  // Public method for manual strategy analysis (called on goals)
  analyzeGameState(gameState: State): void {
    this.checkStrategy(gameState);
    this.analyzeBallTrajectory(gameState);
  }

  private predictBallTrajectory(ball: Vec, velocity: Vec): {
    impactY: number;
    timeToImpact: number;
    confidence: number;
  } {
    // Only predict if ball is moving towards AI paddle (right side)
    if (velocity.x <= 0) {
      return { impactY: 0.5, timeToImpact: Infinity, confidence: 0.1 };
    }

    let simX = ball.x;//模擬中的球位置。
    let simY = ball.y;
    let simVx = velocity.x;//模擬中的球速度。
    let simVy = velocity.y;
    
    const paddleX = 0.97; // AI paddle X position
    let bounceCount = 0;//球反彈的次數（
    let confidence = this.difficulty;
    
    // Simulate physics until ball reaches paddle
    while (simX < paddleX && bounceCount < 3) {
      const timeToReachPaddle = (paddleX - simX) / simVx;//計算到達 paddle 需要的時
      const potentialY = simY + (simVy * timeToReachPaddle);
      
      // Check for wall bounces (top/bottom)會考慮 上、下邊界反彈，最多模擬 3 次。
      if (potentialY < 0 || potentialY > 1) {
        // Calculate time to wall collision
        const timeToWall = potentialY < 0 
          ? -simY / simVy 
          : (1 - simY) / simVy;
        
        // Update position to wall collision point
        simX += simVx * timeToWall;
        simY = potentialY < 0 ? 0 : 1;
        simVy = -simVy; // Ball bounces
        
        bounceCount++;
        confidence *= 0.8; // Reduce confidence with each bounce每次反彈降低信心值（confidence * 0.8）。
      } else {
        // No wall collision, ball will reach paddle
        return {
          impactY: Math.max(0.1, Math.min(0.9, potentialY)),
          timeToImpact: timeToReachPaddle,
          confidence
        };
      }
    }
    
    // Fallback if too many bounces如果無法預測（太多反彈），回傳預設值。
    return { impactY: 0.5, timeToImpact: Infinity, confidence: 0.2 };
  }

  /*
  設定目標 Y (targetY)：依照球落點、分數差調整策略
落後 → aggressive（多加隨機偏移，製造角度）
領先很多 → defensive（偏向防守，板子往中間收）
否則 → adaptive（中庸）
計算目標與拍子位置的差距 → 方向決策（帶死區）。
加入「人類失誤率」：難度越低，越有可能隨機做錯。 */
  private calculateMove(myPaddleY: number, prediction: any, gameState: State): {
    direction: -1 | 0 | 1;
    confidence: number;
  } {
    // Don't move if ball is moving away from AI paddle
    if (gameState.vel.x <= 0) {
      return { direction: 0, confidence: 0.1 };
    }

    let targetY = prediction.impactY;

    // Apply current strategy to target calculation
    if (this.strategyMode === 'aggressive') {
      // Try to hit ball at angles when aggressive
      targetY += (Math.random() - 0.5) * 0.1;
    } else if (this.strategyMode === 'defensive') {
      // Blend towards center when defensive
      targetY = targetY * 0.8 + 0.5 * 0.2;
    }
    // Adaptive mode uses prediction as-is
    
    // Calculate movement direction
    const diff = targetY - myPaddleY;
    const deadzone = 0.03 + ((1 - this.difficulty) * 0.02);
    
    let direction: -1 | 0 | 1 = 0;
    if (diff > deadzone) {
      direction = 1; // Move down
    } else if (diff < -deadzone) {
      direction = -1; // Move up
    }
    
    // Add human-like errors
    const errorRate = (1 - this.difficulty) * 0.15;
    if (Math.random() < errorRate) {
      // Occasionally make wrong moves
      direction = Math.random() < 0.5 ? -1 : 1;
    }
    
    // Calculate confidence
    const confidence = prediction.confidence * (1 - Math.abs(diff) * 2);
    
    return { direction, confidence: Math.max(0, Math.min(1, confidence)) };
  }

  private addToReactionBuffer(direction: -1 | 0 | 1): void { //模擬 反應延遲
    // Simulate human reaction time delay
    const reactionDelay = 100 + ((1 - this.difficulty) * 200); // 100-300ms delay
    
    setTimeout(() => {
      this.reactionBuffer.push(direction);
    }, reactionDelay);
  }

  private processReactionBuffer(currentTime: number): void {
    // Process buffered reactions at ~60fps rate (simulating keyboard polling)
    if (this.reactionBuffer.length > 0 && 
        currentTime - this.lastReactionTime > 16) {
      
      const movement = this.reactionBuffer.shift()!;
      this.currentDecision.direction = movement;
      this.lastReactionTime = currentTime;
      
      // Simulate key hold duration
      if (movement !== 0) {
        const holdTime = 50 + Math.random() * 100; // 50-150ms hold
        setTimeout(() => {
          if (this.reactionBuffer.length === 0) {
            this.currentDecision.direction = 0;
          }
        }, holdTime);
      }
    }
  }

  private evaluatePowerUp(gameState: State, prediction: any): boolean {
    // Power-up strategy based on game situation
    const scoreDiff = gameState.score[1] - gameState.score[0];
    const ballSpeed = Math.sqrt(gameState.vel.x ** 2 + gameState.vel.y ** 2);
    
    // Use power-ups more when losing or in difficult situations
    let useProbability = 0.05; // Base 5% chance
    
    if (scoreDiff < 0) {
      useProbability += 0.1; // Higher when losing
    }
    
    if (prediction.confidence < 0.3) {
      useProbability += 0.15; // Higher when uncertain ：球彈跳很多次，AI 不確定球會去哪裡
    }
    
    if (ballSpeed > 0.6) {
      useProbability += 0.1; // Higher when ball is fast
    }
    
    return Math.random() < useProbability;
  }

  setDifficulty(difficulty: number): void {// how eften ai checks game status
    this.difficulty = Math.max(0.1, Math.min(1, difficulty));
    // Easier AI updates less frequently
    this.updateInterval = 1000 + ((1 - this.difficulty) * 500);
  }

  // Add method to manually override strategy
  forceStrategy(strategy: 'aggressive' | 'defensive' | 'adaptive' | 'auto'): void {
    if (strategy === 'auto') {
      this.strategyMode = 'adaptive'; // Will be overridden by score logic
    } else {
      this.strategyMode = strategy;
    }
    console.log(`AI strategy manually set to: ${this.strategyMode}`);
    this.onStrategyChange?.(this.strategyMode); // Notify frontend
  }

  // Method to set callback for strategy changes
  setOnStrategyChange(callback: (strategy: string) => void): void {
    this.onStrategyChange = callback;
  }

  getDebugInfo(): any {
    return {
      predictedY: this.predictedY,
      strategyMode: this.strategyMode,
      confidence: this.currentDecision.confidence,
      difficulty: this.difficulty,
      reactionBufferLength: this.reactionBuffer.length
    };
  }

  reset(): void {
    this.lastUpdateTime = 0;
    this.lastStrategyCheck = 0;
    this.currentDecision = { direction: 0, usePowerUp: false, confidence: 0 };
    this.reactionBuffer = [];
    this.lastReactionTime = 0;
  }
}

// Replace your aiDirection function with this:
function AIDecision(gameState: State, aiInstance: PongAI, currentTime: number): -1 | 0 | 1 {
  console.log("AIDecision function called!");
  const decision = aiInstance.update(gameState, currentTime);
  return decision.direction;
}

export { PongAI, AIDecision };