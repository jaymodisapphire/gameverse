'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import { ChevronRight, Play, Zap, Users, Cpu } from 'lucide-react';
import * as THREE from 'three';

function FloatingOrb({ position, color, speed, distort }: {
  position: [number, number, number];
  color: string;
  speed: number;
  distort: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
    meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.5;
  });
  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </Sphere>
    </Float>
  );
}

function FloatingDie({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.4;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.6;
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.3;
  });
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial
        color="#8b5cf6"
        roughness={0.1}
        metalness={0.9}
        emissive="#4c1d95"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#8b5cf6" />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#3b82f6" />
      <pointLight position={[0, 5, -5]} intensity={1} color="#06b6d4" />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <FloatingOrb position={[3.5, 0, -2]} color="#6d28d9" speed={0.8} distort={0.4} />
      <FloatingOrb position={[-3, 1, -3]} color="#1d4ed8" speed={0.6} distort={0.3} />
      <FloatingOrb position={[1, -2, -4]} color="#0891b2" speed={1} distort={0.5} />
      <FloatingDie position={[-4, 2, -2]} />
      <FloatingDie position={[5, -1, -3]} />
    </>
  );
}

const FEATURES = [
  { icon: Zap, label: 'Multiplayer Ready', color: 'text-violet-400' },
  { icon: Users, label: 'Play with Friends', color: 'text-blue-400' },
  { icon: Cpu, label: 'Intelligent AI', color: 'text-cyan-400' },
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const rotateX = useTransform(springY, [-300, 300], [5, -5]);
  const rotateY = useTransform(springX, [-300, 300], [-5, 5]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0">
        {mounted && (
          <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ antialias: true, alpha: true }}>
            <HeroScene />
          </Canvas>
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 z-1 bg-gradient-to-r from-black via-black/80 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent z-1" />

      {/* Animated Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-600/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <motion.div
          style={{ rotateX, rotateY }}
          className="max-w-2xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300 text-xs font-bold tracking-widest uppercase">Premium Gaming Platform</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight mb-6"
          >
            <span className="block text-white">YOUR WORLD.</span>
            <span className="block bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              YOUR GAMES.
            </span>
            <span className="block text-white">YOUR VICTORY.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white/60 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl"
          >
            Challenge your friends. Compete against intelligent AI. Experience gaming without limits.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(139,92,246,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('quick-play')}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-violet-500/30 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              PLAY NOW
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('games')}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-violet-500/50 text-white font-bold text-base transition-all"
            >
              EXPLORE GAMES
            </motion.button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            {FEATURES.map(({ icon: Icon, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10"
              >
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-white/70 text-sm font-medium">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
        >
          <div className="w-1 h-2.5 rounded-full bg-violet-400" />
        </motion.div>
        <span className="text-white/30 text-xs tracking-widest uppercase">Scroll</span>
      </motion.div>
    </section>
  );
}
