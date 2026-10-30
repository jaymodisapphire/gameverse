'use client';

import { GameEngine, GameEngineOptions } from './types';
import { gameAudio } from './audio';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  color: string;
  points: number;
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

export class SpaceDefenderEngine implements GameEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private options: GameEngineOptions | null = null;

  // Starfighter Player
  private player = {
    x: 240,
    y: 420,
    width: 32,
    height: 36,
    speed: 5.5,
    health: 3,
    maxHealth: 3,
  };

  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private particles: Particle[] = [];
  private stars: { x: number; y: number; speed: number; size: number }[] = [];

  private score = 0;
  private wave = 1;
  private startTime = 0;

  private isRunning = false;
  private isPaused = false;
  private isGameOver = false;

  private lastFireTime = 0;
  private fireRate = 180; // ms between shots
  private lastSpawnTime = 0;
  private spawnInterval = 1400;

  private keys: Record<string, boolean> = {};
  private animationFrameId: number | null = null;

  public init(canvas: HTMLCanvasElement, options: GameEngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;

    this.resize();
    this.setupControls();
    this.initStars();
    this.reset();
  }

  private resize() {
    if (!this.canvas) return;
    this.canvas.width = 480;
    this.canvas.height = 520;
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * 480,
        y: Math.random() * 520,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 1.5 + 0.5,
      });
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
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
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
    if (action === 'up') this.keys['ArrowUp'] = active;
    if (action === 'down') this.keys['ArrowDown'] = active;
    if (action === 'shoot') this.keys['Space'] = active;
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
      y: 440,
      width: 32,
      height: 36,
      speed: 5.5,
      health: 3,
      maxHealth: 3,
    };
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.score = 0;
    this.wave = 1;
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
    const w = this.canvas?.width || 480;
    const h = this.canvas?.height || 520;

    // Move Stars
    this.stars.forEach((s) => {
      s.y += s.speed;
      if (s.y > h) {
        s.y = 0;
        s.x = Math.random() * w;
      }
    });

    // Player Movement
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.x = Math.max(20, this.player.x - this.player.speed);
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.x = Math.min(w - 20, this.player.x + this.player.speed);
    }
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.player.y = Math.max(100, this.player.y - this.player.speed);
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      this.player.y = Math.min(h - 30, this.player.y + this.player.speed);
    }

    // Auto-firing or Space firing
    if (this.keys['Space'] || this.keys['shoot'] || true) {
      if (currentTime - this.lastFireTime >= this.fireRate) {
        this.fireLasers();
        this.lastFireTime = currentTime;
      }
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      if (b.y < -10) {
        this.bullets.splice(i, 1);
      }
    }

    // Spawn Enemies
    if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnEnemy();
      this.lastSpawnTime = currentTime;
    }

    // Update Enemies & Collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e.vx;
      e.y += e.vy;

      // Bullet Collisions
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (
          b.x >= e.x - e.width / 2 &&
          b.x <= e.x + e.width / 2 &&
          b.y >= e.y - e.height / 2 &&
          b.y <= e.y + e.height / 2
        ) {
          e.hp -= 1;
          this.bullets.splice(j, 1);
          this.createSparks(b.x, b.y, '#8b5cf6');

          if (e.hp <= 0) {
            this.score += e.points;
            this.options?.onScoreUpdate(this.score);
            gameAudio.playExplosionSound();
            this.createExplosion(e.x, e.y, e.color);
            this.enemies.splice(i, 1);
            break;
          }
        }
      }

      // Player Collision
      if (
        Math.abs(this.player.x - e.x) < this.player.width / 2 + e.width / 2 &&
        Math.abs(this.player.y - e.y) < this.player.height / 2 + e.height / 2
      ) {
        this.createExplosion(e.x, e.y, '#ef4444');
        this.enemies.splice(i, 1);
        this.player.health -= 1;
        gameAudio.playExplosionSound();

        if (this.player.health <= 0) {
          this.triggerGameOver();
          return;
        }
      }

      // Offscreen
      if (e.y > h + 40) {
        this.enemies.splice(i, 1);
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

  private fireLasers() {
    this.bullets.push(
      { x: this.player.x - 8, y: this.player.y - 12, vx: 0, vy: -11, radius: 3, color: '#a855f7' },
      { x: this.player.x + 8, y: this.player.y - 12, vx: 0, vy: -11, radius: 3, color: '#a855f7' }
    );
    gameAudio.playLaserSound();
  }

  private spawnEnemy() {
    const w = this.canvas?.width || 480;
    const types = [
      { width: 26, height: 26, hp: 1, color: '#06b6d4', points: 25, speed: 2.2 },
      { width: 34, height: 32, hp: 2, color: '#ec4899', points: 50, speed: 1.8 },
      { width: 44, height: 38, hp: 4, color: '#eab308', points: 100, speed: 1.2 },
    ];
    const chosen = types[Math.floor(Math.random() * types.length)];

    this.enemies.push({
      x: Math.random() * (w - 80) + 40,
      y: -30,
      vx: (Math.random() - 0.5) * 0.8,
      vy: chosen.speed + (this.score / 1500),
      width: chosen.width,
      height: chosen.height,
      hp: chosen.hp,
      maxHp: chosen.hp,
      color: chosen.color,
      points: chosen.points,
    });
  }

  private createSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2 + 1,
        life: 0,
        maxLife: 12,
      });
    }
  }

  private createExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 1,
        life: 0,
        maxLife: 25,
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

    // Deep Space Background
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = '#ffffff';
    this.stars.forEach((s) => {
      ctx.globalAlpha = s.speed / 2.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Glowing Lasers
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#c084fc';
    ctx.fillStyle = '#e9d5ff';
    this.bullets.forEach((b) => {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.radius, b.radius * 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Enemies
    this.enemies.forEach((e) => {
      ctx.shadowBlur = 14;
      ctx.shadowColor = e.color;
      ctx.fillStyle = e.color;

      ctx.beginPath();
      ctx.moveTo(e.x, e.y + e.height / 2);
      ctx.lineTo(e.x - e.width / 2, e.y - e.height / 2);
      ctx.lineTo(e.x + e.width / 2, e.y - e.height / 2);
      ctx.closePath();
      ctx.fill();
    });

    // Draw Player Starfighter
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#8b5cf6';
    ctx.fillStyle = '#a855f7';

    // Ship Cockpit
    ctx.beginPath();
    ctx.moveTo(this.player.x, this.player.y - this.player.height / 2);
    ctx.lineTo(this.player.x - this.player.width / 2, this.player.y + this.player.height / 2);
    ctx.lineTo(this.player.x, this.player.y + this.player.height / 3);
    ctx.lineTo(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
    ctx.closePath();
    ctx.fill();

    // Thruster Flames
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#06b6d4';
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.arc(
      this.player.x,
      this.player.y + this.player.height / 2 + 4,
      Math.random() * 3 + 3,
      0,
      Math.PI * 2
    );
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

    // Health HUD (Shield Bars)
    for (let i = 0; i < this.player.maxHealth; i++) {
      ctx.fillStyle = i < this.player.health ? '#10b981' : '#374151';
      ctx.fillRect(15 + i * 16, 15, 12, 6);
    }

    // Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, w, h);

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#8b5cf6';
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION FAILED', w / 2, h / 2 - 20);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Final Score: ${this.score}`, w / 2, h / 2 + 15);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px sans-serif';
      ctx.fillText('Press RESTART to launch again', w / 2, h / 2 + 45);
    }
  }
}
