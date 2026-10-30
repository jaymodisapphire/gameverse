'use client';

import { GameEngine, GameEngineOptions } from './types';
import { gameAudio } from './audio';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  isPickup?: boolean;
}

interface RoadStripe {
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

export class NeonRacerEngine implements GameEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private options: GameEngineOptions | null = null;

  // Player Vehicle
  private player = {
    x: 240,
    y: 400,
    targetX: 240,
    width: 34,
    height: 54,
    speed: 7,
  };

  private roadStripes: RoadStripe[] = [];
  private obstacles: Obstacle[] = [];
  private particles: Particle[] = [];

  private roadLeft = 80;
  private roadRight = 400;

  private score = 0;
  private distance = 0;
  private currentSpeed = 6;
  private maxSpeed = 16;
  private startTime = 0;

  private isRunning = false;
  private isPaused = false;
  private isGameOver = false;

  private lastSpawnTime = 0;
  private spawnInterval = 1200;

  private keys: Record<string, boolean> = {};
  private animationFrameId: number | null = null;

  public init(canvas: HTMLCanvasElement, options: GameEngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;

    this.resize();
    this.setupControls();
    this.initRoad();
    this.reset();
  }

  private resize() {
    if (!this.canvas) return;
    this.canvas.width = 480;
    this.canvas.height = 520;
    this.roadLeft = 70;
    this.roadRight = 410;
  }

  private initRoad() {
    this.roadStripes = [];
    for (let y = 0; y < 520; y += 45) {
      this.roadStripes.push({ y });
    }
  }

  private setupControls() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'KeyP') {
      if (this.isPaused) this.resume();
      else if (this.isRunning) this.pause();
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false;
  }

  public handleInput(action: string, active: boolean) {
    if (action === 'left') this.keys['ArrowLeft'] = active;
    if (action === 'right') this.keys['ArrowRight'] = active;
    if (action === 'boost') this.keys['ArrowUp'] = active;
  }

  public setSoundEnabled(enabled: boolean) {
    gameAudio.setMuted(!enabled);
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.startTime = Date.now();
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
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private reset() {
    this.player = {
      x: 240,
      y: 420,
      targetX: 240,
      width: 32,
      height: 52,
      speed: 7,
    };
    this.obstacles = [];
    this.particles = [];
    this.score = 0;
    this.distance = 0;
    this.currentSpeed = 6;
    this.draw();
  }

  private loop(currentTime: number) {
    if (!this.isRunning || this.isPaused) return;

    this.update(currentTime);
    this.draw();

    if (!this.isGameOver) {
      this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  private update(currentTime: number) {
    const h = this.canvas?.height || 520;

    // Speed adjustment (Boost)
    const isBoosting = this.keys['ArrowUp'] || this.keys['KeyW'];
    const targetSpeed = isBoosting ? this.maxSpeed : 7 + (this.distance / 1200);
    this.currentSpeed += (targetSpeed - this.currentSpeed) * 0.08;

    // Progress distance & score
    this.distance += this.currentSpeed * 0.15;
    this.score = Math.floor(this.distance);
    this.options?.onScoreUpdate(this.score);

    // Scroll Road Stripes
    this.roadStripes.forEach((stripe) => {
      stripe.y += this.currentSpeed;
      if (stripe.y > h) stripe.y = -30;
    });

    // Steer Vehicle
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.x = Math.max(this.roadLeft + 20, this.player.x - this.player.speed);
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.x = Math.min(this.roadRight - 20, this.player.x + this.player.speed);
    }

    // Spawn Obstacles or Pickups
    if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnTraffic();
      this.lastSpawnTime = currentTime;
      this.spawnInterval = Math.max(700, 1300 - this.distance * 0.2);
    }

    // Update Obstacles & Collisions
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += this.currentSpeed - obs.speed;

      // Check Collision with Player
      if (
        Math.abs(this.player.x - obs.x) < this.player.width / 2 + obs.width / 2 - 4 &&
        Math.abs(this.player.y - obs.y) < this.player.height / 2 + obs.height / 2 - 6
      ) {
        if (obs.isPickup) {
          // Battery Energy Boost
          this.distance += 150;
          gameAudio.playPowerupSound();
          this.createBurst(obs.x, obs.y, '#38bdf8');
          this.obstacles.splice(i, 1);
          continue;
        } else {
          // Crash!
          this.createCrash(this.player.x, this.player.y);
          gameAudio.playExplosionSound();
          this.triggerGameOver();
          return;
        }
      }

      // Despawn offscreen
      if (obs.y > h + 60 || obs.y < -120) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update Particles
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

  private spawnTraffic() {
    const isPickup = Math.random() < 0.25;
    const roadWidth = this.roadRight - this.roadLeft - 60;
    const spawnX = this.roadLeft + 30 + Math.random() * roadWidth;

    if (isPickup) {
      this.obstacles.push({
        x: spawnX,
        y: -40,
        width: 22,
        height: 22,
        speed: 1,
        color: '#38bdf8',
        isPickup: true,
      });
    } else {
      const colors = ['#f43f5e', '#eab308', '#a855f7'];
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      this.obstacles.push({
        x: spawnX,
        y: -70,
        width: 32,
        height: 52,
        speed: Math.random() * 2 + 1.5,
        color: chosenColor,
        isPickup: false,
      });
    }
  }

  private createBurst(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
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
        maxLife: 15,
      });
    }
  }

  private createCrash(x: number, y: number) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#f43f5e',
        size: Math.random() * 3.5 + 1.5,
        life: 0,
        maxLife: 30,
      });
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

  private draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark Cyberpunk Ground
    ctx.fillStyle = '#06060f';
    ctx.fillRect(0, 0, w, h);

    // Highway Asphalt
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(this.roadLeft, 0, this.roadRight - this.roadLeft, h);

    // Road Guardrails (Neon Cyan Glow)
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#06b6d4';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(this.roadLeft, 0);
    ctx.lineTo(this.roadLeft, h);
    ctx.moveTo(this.roadRight, 0);
    ctx.lineTo(this.roadRight, h);
    ctx.stroke();

    // Road Stripes
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 2;
    const laneWidth = (this.roadRight - this.roadLeft) / 3;

    this.roadStripes.forEach((stripe) => {
      ctx.beginPath();
      ctx.moveTo(this.roadLeft + laneWidth, stripe.y);
      ctx.lineTo(this.roadLeft + laneWidth, stripe.y + 25);
      ctx.moveTo(this.roadLeft + laneWidth * 2, stripe.y);
      ctx.lineTo(this.roadLeft + laneWidth * 2, stripe.y + 25);
      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    // Draw Obstacles / Traffic
    this.obstacles.forEach((obs) => {
      if (obs.isPickup) {
        // Battery Powerup
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#38bdf8';
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Cyber Car
        ctx.shadowBlur = 12;
        ctx.shadowColor = obs.color;
        ctx.fillStyle = obs.color;

        ctx.beginPath();
        ctx.roundRect(
          obs.x - obs.width / 2,
          obs.y - obs.height / 2,
          obs.width,
          obs.height,
          6
        );
        ctx.fill();

        // Car windshield & taillights
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x - 8, obs.y - 12, 16, 8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x - 12, obs.y + obs.height / 2 - 4, 6, 3);
        ctx.fillRect(obs.x + 6, obs.y + obs.height / 2 - 4, 6, 3);
        ctx.shadowBlur = 0;
      }
    });

    // Draw Player Vehicle
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#06b6d4';
    ctx.fillStyle = '#06b6d4';

    ctx.beginPath();
    ctx.roundRect(
      this.player.x - this.player.width / 2,
      this.player.y - this.player.height / 2,
      this.player.width,
      this.player.height,
      8
    );
    ctx.fill();

    // Windshield & Cyber Cockpit
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(this.player.x - 10, this.player.y - 10, 20, 12);

    // Neon Headlights (Projecting Forward)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.beginPath();
    ctx.moveTo(this.player.x - 12, this.player.y - this.player.height / 2);
    ctx.lineTo(this.player.x - 30, this.player.y - 90);
    ctx.lineTo(this.player.x + 30, this.player.y - 90);
    ctx.lineTo(this.player.x + 12, this.player.y - this.player.height / 2);
    ctx.closePath();
    ctx.fill();

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

    // Speedometer HUD
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(15, 15, 110, 32);
    ctx.strokeStyle = 'rgba(6,182,212,0.4)';
    ctx.strokeRect(15, 15, 110, 32);

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`SPEED: ${Math.round(this.currentSpeed * 12)} KM/H`, 22, 35);

    // Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.fillRect(0, 0, w, h);

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#06b6d4';
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH DETECTED', w / 2, h / 2 - 20);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Distance: ${this.score}m`, w / 2, h / 2 + 15);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px sans-serif';
      ctx.fillText('Press RESTART to race again', w / 2, h / 2 + 45);
    }
  }
}
