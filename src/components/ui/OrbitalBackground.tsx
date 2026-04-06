'use client';

import { useTheme } from 'next-themes';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

interface OrbitConfig {
  rx: number;
  ry: number;
  rotation: number;
  duration: number;
  nodes: { angle: number; size: number }[];
}

const ORBIT_COUNT = 6;

function generateOrbits(width: number, height: number): OrbitConfig[] {
  const cx = width / 2;
  const cy = height / 2;
  const baseRadius = Math.min(cx, cy) * 0.8;

  return Array.from({ length: ORBIT_COUNT }, (_, i) => {
    const progress = (i + 1) / ORBIT_COUNT;
    const rx = baseRadius * (0.3 + progress * 0.7);
    const ry = rx * (0.35 + Math.random() * 0.25);
    const rotation = (i * 180) / ORBIT_COUNT + Math.random() * 30;
    const duration = 20 + i * 8 + Math.random() * 10;
    const nodeCount = 2 + Math.floor(Math.random() * 3);
    const nodes = Array.from({ length: nodeCount }, () => ({
      angle: Math.random() * 360,
      size: 2 + Math.random() * 3,
    }));

    return { rx, ry, rotation, duration, nodes };
  });
}

export default function OrbitalBackground() {
  const { theme } = useTheme();
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const update = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    };
  }, []);

  // 默认浅色，避免 hydration 不匹配导致黑屏
  // 在 SSR 时 theme 为 undefined，统一使用浅色配色
  const isDark = theme === 'dark';
  const orbitColor = isDark ? 'rgba(140, 160, 200, 0.18)' : 'rgba(60, 80, 120, 0.15)';
  const nodeColor = isDark ? 'rgba(180, 200, 240, 0.6)' : 'rgba(40, 60, 100, 0.5)';
  const glowColor = isDark ? 'rgba(120, 180, 255, 0.3)' : 'rgba(60, 120, 200, 0.25)';

  const orbits = useMemo(
    () => generateOrbits(dimensions.width, dimensions.height),
    [dimensions],
  );

  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      viewBox={'0 0 ' + String(dimensions.width) + ' ' + String(dimensions.height)}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {orbits.map((orbit, oi) => {
        const cx = dimensions.width / 2;
        const cy = dimensions.height / 2;

        return (
          <motion.g
            key={String(oi)}
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              duration: orbit.duration,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ originX: cx, originY: cy, transformOrigin: String(cx) + 'px ' + String(cy) + 'px' }}
          >
            <ellipse
              cx={cx}
              cy={cy}
              rx={orbit.rx}
              ry={orbit.ry}
              fill="none"
              stroke={orbitColor}
              strokeWidth={1}
              transform={'rotate(' + String(orbit.rotation) + ' ' + String(cx) + ' ' + String(cy) + ')'}
            />
            {orbit.nodes.map((node, ni) => {
              const rad = ((node.angle + orbit.rotation) * Math.PI) / 180;
              const nx = cx + orbit.rx * Math.cos(rad);
              const ny = cy + orbit.ry * Math.sin(rad);

              return (
                <g key={String(oi) + '-' + String(ni)}>
                  <circle cx={nx} cy={ny} r={node.size + 4} fill={glowColor} />
                  <circle cx={nx} cy={ny} r={node.size} fill={nodeColor} />
                </g>
              );
            })}
          </motion.g>
        );
      })}
    </svg>
  );
}
