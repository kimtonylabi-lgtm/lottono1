"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  number: number;
  drawn: boolean;
}

interface LottoMachineProps {
  targetNumbers: number[];
  onComplete: () => void;
}

// Globe (circular dome) parameters
const GLOBE_RADIUS = 110;
const GLOBE_CX = GLOBE_RADIUS;
const GLOBE_CY = GLOBE_RADIUS;
const BALL_R = 13;
const GRAVITY = 0.15;

function getBallColor(n: number): string {
  if (n <= 10) return "#facc15";
  if (n <= 20) return "#3b82f6";
  if (n <= 30) return "#ef4444";
  if (n <= 40) return "#6b7280";
  return "#22c55e";
}

function getTextColor(n: number): string {
  if (n <= 10) return "#713f12";
  return "#fff";
}

export default function LottoMachine({ targetNumbers, onComplete }: LottoMachineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const ballsRef = useRef<Ball[]>([]);
  const [ballsReady, setBallsReady] = useState(false);
  const [drawnBalls, setDrawnBalls] = useState<number[]>([]);
  const [phase, setPhase] = useState<"mixing" | "drawing" | "done">("mixing");
  const [exitingBall, setExitingBall] = useState<number | null>(null);
  const drawIndexRef = useRef(0);
  const frameCountRef = useRef(0);

  // Initialize balls inside circular globe
  useEffect(() => {
    const allNumbers = Array.from({ length: 45 }, (_, i) => i + 1);
    for (let i = allNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
    }
    const displaySet = new Set(targetNumbers);
    for (const n of allNumbers) {
      if (displaySet.size >= 25) break;
      displaySet.add(n);
    }
    const displayNumbers = Array.from(displaySet);
    for (let i = displayNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [displayNumbers[i], displayNumbers[j]] = [displayNumbers[j], displayNumbers[i]];
    }

    // Place balls randomly inside circle
    ballsRef.current = displayNumbers.map((num, id) => {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (GLOBE_RADIUS - BALL_R - 10);
      return {
        id,
        x: GLOBE_CX + Math.cos(angle) * r,
        y: GLOBE_CY + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        number: num,
        drawn: false,
      };
    });

    setBallsReady(true);

    const timer = setTimeout(() => setPhase("drawing"), 4000);
    return () => clearTimeout(timer);
  }, [targetNumbers]);

  // Animation loop
  const animate = useCallback(() => {
    const balls = ballsRef.current;
    frameCountRef.current++;
    const isMixing = phase === "mixing";
    const speed = isMixing ? 1.2 : 0.7;

    for (const ball of balls) {
      if (ball.drawn) continue;

      // Apply gravity (lighter during mixing for more energetic bouncing)
      ball.vy += (isMixing ? GRAVITY * 0.6 : GRAVITY) * speed;

      ball.x += ball.vx * speed;
      ball.y += ball.vy * speed;

      // Circular boundary collision
      const dx = ball.x - GLOBE_CX;
      const dy = ball.y - GLOBE_CY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = GLOBE_RADIUS - BALL_R;

      if (dist > maxDist) {
        // Push ball back inside
        const nx = dx / dist;
        const ny = dy / dist;
        ball.x = GLOBE_CX + nx * maxDist;
        ball.y = GLOBE_CY + ny * maxDist;

        // Reflect velocity along the normal
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 2 * dot * nx * 0.7;
        ball.vy -= 2 * dot * ny * 0.7;
      }

      // Random agitation (simulates machine shaking)
      if (frameCountRef.current % 15 === 0) {
        ball.vx += (Math.random() - 0.5) * (isMixing ? 3.5 : 1.0);
        ball.vy += (Math.random() - 0.5) * (isMixing ? 3.0 : 0.8);
        // Periodic upward kick during mixing (like machine tumbling)
        if (isMixing && frameCountRef.current % 45 === 0) {
          ball.vy -= 2.5 + Math.random() * 2;
          ball.vx += (Math.random() - 0.5) * 3;
        }
        const maxV = isMixing ? 6 : 3;
        ball.vx = Math.max(-maxV, Math.min(maxV, ball.vx));
        ball.vy = Math.max(-maxV, Math.min(maxV, ball.vy));
      }
    }

    // Ball-ball collisions
    for (let i = 0; i < balls.length; i++) {
      if (balls[i].drawn) continue;
      for (let j = i + 1; j < balls.length; j++) {
        if (balls[j].drawn) continue;
        const ddx = balls[j].x - balls[i].x;
        const ddy = balls[j].y - balls[i].y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < BALL_R * 2 && d > 0.01) {
          const nx = ddx / d;
          const ny = ddy / d;
          const overlap = BALL_R * 2 - d;
          balls[i].x -= nx * overlap * 0.5;
          balls[i].y -= ny * overlap * 0.5;
          balls[j].x += nx * overlap * 0.5;
          balls[j].y += ny * overlap * 0.5;
          const dvx = balls[i].vx - balls[j].vx;
          const dvy = balls[i].vy - balls[j].vy;
          const dot = dvx * nx + dvy * ny;
          balls[i].vx -= dot * nx * 0.7;
          balls[i].vy -= dot * ny * 0.7;
          balls[j].vx += dot * nx * 0.7;
          balls[j].vy += dot * ny * 0.7;
        }
      }
    }

    // Render
    const container = containerRef.current;
    if (container) {
      const children = container.children;
      for (let i = 0; i < balls.length; i++) {
        const el = children[i] as HTMLElement;
        if (!el) continue;
        if (balls[i].drawn) {
          el.style.display = "none";
        } else {
          el.style.transform = `translate(${balls[i].x - BALL_R}px, ${balls[i].y - BALL_R}px)`;
        }
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }, [phase]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

  // Drawing phase
  useEffect(() => {
    if (phase !== "drawing") return;

    const interval = setInterval(() => {
      const idx = drawIndexRef.current;
      if (idx >= targetNumbers.length) {
        clearInterval(interval);
        setPhase("done");
        setTimeout(onComplete, 800);
        return;
      }

      const targetNum = targetNumbers[idx];
      const ball = ballsRef.current.find((b) => b.number === targetNum);
      if (ball) ball.drawn = true;

      // Show exit animation
      setExitingBall(targetNum);
      setTimeout(() => {
        setExitingBall(null);
        setDrawnBalls((prev) => [...prev, targetNum]);
      }, 400);

      drawIndexRef.current++;
    }, 900);

    return () => clearInterval(interval);
  }, [phase, targetNumbers, onComplete]);

  const balls = ballsReady ? ballsRef.current : [];
  const globeSize = GLOBE_RADIUS * 2;

  return (
    <div className="flex flex-col items-center">
      {/* Machine body */}
      <div className="relative flex flex-col items-center">
        {/* Top cap */}
        <div
          className="w-16 h-5 rounded-t-full"
          style={{ background: "linear-gradient(180deg, #dc2626, #b91c1c)" }}
        />

        {/* Globe container */}
        <div
          className="relative overflow-hidden"
          style={{
            width: globeSize,
            height: globeSize,
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.95), rgba(240,245,255,0.85) 60%, rgba(200,215,235,0.8))",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.08), 0 0 0 4px #b91c1c, 0 0 0 7px #991b1b, 0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {/* Glass reflection */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "8%",
              left: "15%",
              width: "35%",
              height: "25%",
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(255,255,255,0.6), transparent 70%)",
              transform: "rotate(-20deg)",
            }}
          />

          {/* Balls container */}
          <div ref={containerRef} className="absolute inset-0">
            {balls.map((ball) => (
              <div
                key={ball.id}
                className="absolute flex items-center justify-center rounded-full font-bold select-none"
                style={{
                  width: BALL_R * 2,
                  height: BALL_R * 2,
                  fontSize: 10,
                  background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6), ${getBallColor(ball.number)} 55%)`,
                  color: getTextColor(ball.number),
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25), inset 0 -2px 3px rgba(0,0,0,0.1)",
                  willChange: "transform",
                }}
              >
                {ball.number}
              </div>
            ))}
          </div>

          {/* Mixing label */}
          {phase === "mixing" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <span className="text-xs font-bold text-gray-500 bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm animate-pulse">
                추첨 준비 중...
              </span>
            </div>
          )}
        </div>

        {/* Machine body (below globe) */}
        <div
          className="relative flex flex-col items-center"
          style={{
            width: globeSize * 0.65,
            background: "linear-gradient(180deg, #dc2626, #b91c1c 40%, #991b1b)",
            borderRadius: "0 0 12px 12px",
            padding: "8px 0 12px",
          }}
        >
          {/* Dispensing slot */}
          <div
            className="w-12 h-6 rounded-b-lg flex items-center justify-center overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #1f2937, #111827)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            {/* Exiting ball animation */}
            {exitingBall !== null && (
              <div
                className="animate-scale-in"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5), ${getBallColor(exitingBall)} 55%)`,
                }}
              />
            )}
          </div>

          {/* Coin slot decoration */}
          <div className="w-8 h-1.5 bg-gray-800 rounded-full mt-2" />
        </div>
      </div>

      {/* Drawn balls tray */}
      <div className="flex gap-2 mt-4 h-14 items-center justify-center">
        {drawnBalls.map((n) => (
          <div key={n} className="animate-scale-in">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg select-none"
              style={{
                background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5), ${getBallColor(n)} 50%)`,
                color: getTextColor(n),
                boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.15), 0 3px 10px rgba(0,0,0,0.25)",
              }}
            >
              {n}
            </div>
          </div>
        ))}
        {Array.from({ length: 6 - drawnBalls.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--color-card-border)]"
          />
        ))}
      </div>
    </div>
  );
}
