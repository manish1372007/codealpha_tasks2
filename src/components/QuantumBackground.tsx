import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

export default function QuantumBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  // Handle resizing accurately
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track global cursor coordinates for mouse reactive spotlight glow
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Canvas-based high-performance particle simulation (Layer 2)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      speedX: number;
      speedY: number;
      opacity: number;
      pulseDirection: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize 40 high-end subtle neon particles
    const particleCount = 40;
    const colors = [
      "rgba(124, 58, 237, 0.2)",  // Violet
      "rgba(6, 182, 212, 0.2)",   // Cyan
      "rgba(20, 184, 166, 0.15)",  // Teal
      "rgba(255, 255, 255, 0.08)", // Crisp White
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.5 + 0.2,
        pulseDirection: Math.random() > 0.5 ? 1 : -1,
      });
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Move particles
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around borders
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Pulse opacity softly
        particle.opacity += 0.005 * particle.pulseDirection;
        if (particle.opacity > 0.8) particle.pulseDirection = -1;
        if (particle.opacity < 0.15) particle.pulseDirection = 1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${particle.opacity})`);
        ctx.shadowBlur = 4;
        ctx.shadowColor = particle.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    drawParticles();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden bg-[#050816]"
      style={{ zIndex: 0 }}
    >
      {/* LAYER 1: Aurora Gradient Waves (Smooth breathing vector nodes) */}
      <div className="absolute inset-0 opacity-[0.22] mix-blend-screen">
        <motion.div
          animate={{
            scale: [1, 1.15, 0.9, 1],
            x: [0, 40, -30, 0],
            y: [0, -50, 60, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[160px]"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.7) 0%, rgba(124,58,237,0) 70%)",
          }}
        />
        <motion.div
          animate={{
            scale: [1, 0.9, 1.1, 1],
            x: [0, -60, 50, 0],
            y: [0, 40, -40, 0],
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[-15%] right-[-10%] w-[900px] h-[900px] rounded-full blur-[180px]"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.6) 0%, rgba(6,182,212,0) 70%)",
          }}
        />
        <motion.div
          animate={{
            scale: [0.9, 1.05, 0.95, 0.9],
            x: [20, -20, 20],
            y: [-30, 30, -30],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[35%] left-[25%] w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{
            background: "radial-gradient(circle, rgba(20,184,166,0.45) 0%, rgba(20,184,166,0) 75%)",
          }}
        />
      </div>

      {/* LAYER 3: Subtle Animated Tech Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black, transparent 85%)",
        }}
      />

      {/* LAYER 4: Mouse Reactive Spotlight Glow overlay */}
      <div
        className="absolute inset-0 opacity-[0.16] transition-opacity duration-500 ease-in-out"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.45) 0%, rgba(124, 58, 237, 0.1) 50%, transparent 100%)`,
        }}
      />

      {/* LAYER 5: Canvas-based floating particles (Layer 2) and Depth blur overlay masking */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mix-blend-screen" />
      
      {/* Absolute edge vignetter for crisp depth */}
      <div 
        className="absolute inset-0 bg-radial-vignette pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, transparent 30%, rgba(5,8,22,0.85) 100%)",
        }}
      />
    </div>
  );
}
