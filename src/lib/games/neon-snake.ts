'use client';

import { GameEngine, GameEngineOptions } from './types';
import { gameAudio } from './audio';

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export class NeonSnakeEngine implements GameEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private options: GameEngineOptions | null = null;

  private gridCols = 24;
  private gridRows = 24;
  private cellSize = 20;

  private snake: Point[] = [];
  private direction: Point = { x: 1, y: 0 };
  private nextDirection: Point = { x: 1, y: 0 };

  private food: Point = { x: 12, y: 12 };
  private bonusFood: (Point & { timer: number }) | null = null;

  private score = 0;
  private multiplier = 1;
  private startTime = 0;
  private particles: Particle[] = [];

  private isRunning = false;
  private isPaused = false;
  private isGameOver = false;

  private animationFrameId: number | null = null;
  private lastStepTime = 0;
  private stepInterval = 120; // ms per grid move

  public init(canvas: HTMLCanvasElement, options: GameEngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;

    this.resize();
    this.setupControls();
    this.reset();
  }

  private resize() {
    if (!this.canvas) return;
    // Set internal resolution
    const width = 480;
    const height = 480;
    this.canvas.width = width;
    this.canvas.height = height;
    this.cellSize = width / this.gridCols;
  }

  private setupControls() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (['ArrowUp', 'KeyW'].includes(e.code)) {
      e.preventDefault();
      this.handleInput('up', true);
    } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
      e.preventDefault();
      this.handleInput('down', true);
    } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
      e.preventDefault();
      this.handleInput('left', true);
    } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
      e.preventDefault();
      this.handleInput('right', true);
    } else if (['KeyP', 'Space'].includes(e.code)) {
      e.preventDefault();
      if (this.isPaused) this.resume();
      else if (this.isRunning) this.pause();
    }
  }

  public handleInput(action: string, active: boolean) {
    if (!active) return;
    if (this.isGameOver) return;

    if (action === 'up' && this.direction.y === 0) {
      this.nextDirection = { x: 0, y: -1 };
    } else if (action === 'down' && this.direction.y === 0) {
      this.nextDirection = { x: 0, y: 1 };
    } else if (action === 'left' && this.direction.x === 0) {
      this.nextDirection = { x: -1, y: 0 };
    } else if (action === 'right' && this.direction.x === 0) {
      this.nextDirection = { x: 1, y: 0 };
    }
  }

  public setSoundEnabled(enabled: boolean) {
    gameAudio.setMuted(!enabled);
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.startTime = Date.now();
    this.lastStepTime = performance.now();
    this.options?.onStateChange?.('running');
    this.loop(performance.now());
  }

  public pause() {
    if (!this.isRunning || this.isGameOver) return;
    this.isPaused = true;
    this.options?.onStateChange?.('paused');
  }

  public resume() {
    if (!this.isRunning || this.isGameOver) return;
    this.isPaused = false;
    this.lastStepTime = performance.now();
    this.options?.onStateChange?.('running');
    this.loop(performance.now());
  }

  public restart() {
    this.reset();
    this.start();
  }

  public destroy() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private reset() {
    this.snake = [
      { x: 6, y: 12 },
      { x: 5, y: 12 },
      { x: 4, y: 12 },
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.multiplier = 1;
    this.stepInterval = 120;
    this.particles = [];
    this.spawnFood();
    this.draw();
  }

  private spawnFood() {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * this.gridCols),
        y: Math.floor(Math.random() * this.gridRows),
      };
      const onSnake = this.snake.some((s) => s.x === newFood.x && s.y === newFood.y);
      if (!onSnake) break;
    }
    this.food = newFood;
  }

  private loop(currentTime: number) {
    if (!this.isRunning || this.isPaused) return;

    const delta = currentTime - this.lastStepTime;
    if (delta >= this.stepInterval) {
      this.step();
      this.lastStepTime = currentTime;
    }

    this.updateParticles();
    this.draw();

    if (!this.isGameOver) {
      this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  private step() {
    this.direction = this.nextDirection;
    const head = { ...this.snake[0] };
    head.x += this.direction.x;
    head.y += this.direction.y;

    // Check Wall Collisions
    if (head.x < 0 || head.x >= this.gridCols || head.y < 0 || head.y >= this.gridRows) {
      this.triggerGameOver();
      return;
    }

    // Check Self Collisions
    if (this.snake.some((s) => s.x === head.x && s.y === head.y)) {
      this.triggerGameOver();
      return;
    }

    this.snake.unshift(head);

    // Check Food Collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10 * this.multiplier;
      this.options?.onScoreUpdate(this.score, this.multiplier);
      gameAudio.playEatSound();
      this.createBurst(
        (head.x + 0.5) * this.cellSize,
        (head.y + 0.5) * this.cellSize,
        '#10b981'
      );
      this.spawnFood();

      // Slightly increase speed
      this.stepInterval = Math.max(65, this.stepInterval - 1.5);
    } else {
      this.snake.pop();
    }
  }

  private triggerGameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    gameAudio.playGameOverSound();
    this.options?.onStateChange?.('gameover');
    const duration = Math.max(1, Math.floor((Date.now() - this.startTime) / 1000));
    this.options?.onGameOver(this.score, duration);
  }

  private createBurst(x: number, y: number, color: string) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 1,
        life: 0,
        maxLife: 20 + Math.random() * 10,
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, w, h);

    // Subtle Neon Grid Lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += this.cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += this.cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Glowing Neon Border
    ctx.strokeStyle = '#10b98133';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Draw Food
    const foodX = this.food.x * this.cellSize;
    const foodY = this.food.y * this.cellSize;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#10b981';
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(
      foodX + this.cellSize / 2,
      foodY + this.cellSize / 2,
      this.cellSize / 2.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw Snake Segments
    this.snake.forEach((seg, i) => {
      const isHead = i === 0;
      const x = seg.x * this.cellSize;
      const y = seg.y * this.cellSize;

      ctx.shadowBlur = isHead ? 20 : 8;
      ctx.shadowColor = isHead ? '#34d399' : '#059669';
      ctx.fillStyle = isHead ? '#a7f3d0' : '#10b981';

      ctx.beginPath();
      ctx.roundRect(
        x + 1.5,
        y + 1.5,
        this.cellSize - 3,
        this.cellSize - 3,
        isHead ? 6 : 4
      );
      ctx.fill();
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw Particles
    this.particles.forEach((p) => {
      const alpha = 1 - p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, w, h);

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 20);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Score: ${this.score}`, w / 2, h / 2 + 15);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px sans-serif';
      ctx.fillText('Press RESTART to play again', w / 2, h / 2 + 45);
    }
  }
}
