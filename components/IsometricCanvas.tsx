import React, { useRef, useEffect, useCallback } from 'react';
import { JobConfig, WorkItem, Particle, Upgrade } from '../types';

interface IsometricCanvasProps {
  job: JobConfig;
  upgrades: Upgrade[];
  onEarn: (amount: number) => void;
  triggerShake: boolean;
  isRampaging: boolean;
}

const IsometricCanvas: React.FC<IsometricCanvasProps> = ({ job, upgrades, onEarn, triggerShake, isRampaging }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game Loop Refs
  const itemsRef = useRef<WorkItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastAutoClickTimeRef = useRef<number>(0);
  const machineYRef = useRef<number>(0); // For machine animation
  const screenShakeRef = useRef<{x: number, y: number}>({x:0, y:0});
  
  // Sync prop to ref for game loop usage
  const isRampagingRef = useRef(isRampaging);
  useEffect(() => {
    isRampagingRef.current = isRampaging;
  }, [isRampaging]);

  // Derived Stats
  const getSpawnRate = () => {
    if (isRampagingRef.current) return 100; // Crazy spawn rate
    return Math.max(300, 2000 - (upgrades.find(u => u.id === 'crusher_speed')?.level || 1) * 50);
  };

  const getClickPower = () => (upgrades.find(u => u.id === 'click_power')?.level || 1) * 10;
  
  const getAutoRate = () => {
    if (isRampagingRef.current) return 50; // Crazy auto click rate
    return 1000 / Math.max(0.1, (upgrades.find(u => u.id === 'auto_reject')?.level || 0));
  };
  
  const hasAuto = () => isRampagingRef.current || (upgrades.find(u => u.id === 'auto_reject')?.level || 0) > 0;

  // Helper: Isometric Projection
  const toIso = (x: number, y: number, z: number = 0) => {
    const angle = 0.5; // Angle of projection
    return {
      x: (x - y) * Math.cos(angle),
      y: (x + y) * Math.sin(angle) - z
    };
  };

  const drawCube = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, height: number = 10) => {
    const leftColor = adjustColor(color, -20);
    const rightColor = adjustColor(color, -40);
    const topColor = color;

    // Top Face
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(x, y - height);
    ctx.lineTo(x + size, y - size * 0.5 - height);
    ctx.lineTo(x, y - size - height);
    ctx.lineTo(x - size, y - size * 0.5 - height);
    ctx.closePath();
    ctx.fill();

    // Right Face
    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(x, y - height);
    ctx.lineTo(x + size, y - size * 0.5 - height);
    ctx.lineTo(x + size, y - size * 0.5);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();

    // Left Face
    ctx.fillStyle = leftColor;
    ctx.beginPath();
    ctx.moveTo(x, y - height);
    ctx.lineTo(x - size, y - size * 0.5 - height);
    ctx.lineTo(x - size, y - size * 0.5);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    
    // Edge highlight
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const adjustColor = (color: string, amount: number) => {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }

  const spawnParticle = (x: number, y: number, color: string) => {
    const count = isRampagingRef.current ? 10 : 5;
    for(let i=0; i<count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        life: 1.0,
        color: color,
        size: Math.random() * 5 + 2
      });
    }
  };

  const handleProcessItem = useCallback((item: WorkItem) => {
    item.processed = true;
    item.health = 0;
    
    // Visuals
    spawnParticle(item.x, item.y, item.color);
    
    // Add intense shake if rampaging
    const shakeIntensity = isRampagingRef.current ? 20 : 10;
    screenShakeRef.current = { 
      x: (Math.random() - 0.5) * shakeIntensity, 
      y: (Math.random() - 0.5) * shakeIntensity 
    };
    machineYRef.current = isRampagingRef.current ? 20 : 10;

    // Reward
    const baseReward = item.type === 'GOLD' ? 500 : 100;
    onEarn(baseReward);
  }, [onEarn]);

  const processClick = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const activeItems = itemsRef.current.filter(i => !i.processed);
    if (activeItems.length > 0) {
      // Sort by closest to the crusher (lowest X visually on belt)
      activeItems.sort((a, b) => b.x - a.x); // Sorts descending X, but movement is decrementing X...
      // Actually we spawn at 250 and move to -150. 
      // The item closest to the crusher (x=-150) has the LOWEST x value.
      // We want to kill the one with lowest X that is > -200.
      activeItems.sort((a, b) => a.x - b.x); 

      // Find first item that is hittable (near crusher) OR just the closest one if user taps anywhere
      // Let's just hit the one closest to the crusher (smallest X)
      const target = activeItems[0];
      
      // Distance check relaxed for UX
      if (target) {
         target.health -= getClickPower();
         // Hit effect
         spawnParticle(target.x, target.y - 20, '#ffffff');
         if (target.health <= 0) {
           handleProcessItem(target);
         }
      }
    }
  }, [getClickPower, handleProcessItem]);

  // Trigger shake from prop
  useEffect(() => {
    if (triggerShake) {
      screenShakeRef.current = { x: (Math.random() - 0.5) * 15, y: (Math.random() - 0.5) * 15 };
    }
  }, [triggerShake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Reset Shake
      screenShakeRef.current.x *= 0.9;
      screenShakeRef.current.y *= 0.9;
      machineYRef.current *= 0.8;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      
      // Apply Camera & Shake
      const centerX = width / 2 + screenShakeRef.current.x;
      const centerY = height / 3 + screenShakeRef.current.y;
      ctx.translate(centerX, centerY);

      // --- DRAW BACKGROUND ---
      // Change floor color slightly based on rage
      const floorColor = isRampagingRef.current ? '#7f1d1d' : '#334155';
      drawCube(ctx, 0, 300, 400, floorColor, 20);

      // --- DRAW CONVEYOR BELT ---
      const beltSpeed = isRampagingRef.current ? (time / 2) % 40 : (time / 5) % 40;
      for (let i = -10; i < 12; i++) {
        const beltX = i * 40 + beltSpeed;
        const isoPos = toIso(beltX, 0);
        if (beltX > -200 && beltX < 220) {
           drawCube(ctx, isoPos.x, isoPos.y, 18, isRampagingRef.current ? '#ef4444' : '#475569', 5);
        }
      }
      
      // Rails
      const railStart = toIso(-200, -30);
      const railEnd = toIso(220, -30);
      ctx.lineWidth = 8;
      ctx.strokeStyle = isRampagingRef.current ? '#fca5a5' : '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(railStart.x, railStart.y);
      ctx.lineTo(railEnd.x, railEnd.y);
      ctx.stroke();
      
      const railStart2 = toIso(-200, 30);
      const railEnd2 = toIso(220, 30);
      ctx.beginPath();
      ctx.moveTo(railStart2.x, railStart2.y);
      ctx.lineTo(railEnd2.x, railEnd2.y);
      ctx.stroke();


      // --- SPAWN LOGIC ---
      if (time - lastSpawnTimeRef.current > getSpawnRate()) {
        // Pick random text for job
        const text = job.enemyTexts[Math.floor(Math.random() * job.enemyTexts.length)];
        
        itemsRef.current.push({
          id: Date.now(),
          x: 250,
          y: 0,
          z: 200,
          type: Math.random() > 0.9 ? 'GOLD' : 'NORMAL',
          label: text,
          health: 10,
          maxHealth: 10,
          color: Math.random() > 0.9 ? '#ffd700' : job.color,
          processed: false
        });
        lastSpawnTimeRef.current = time;
      }

      // --- AUTO CLICK LOGIC ---
      if (hasAuto() && time - lastAutoClickTimeRef.current > getAutoRate()) {
         const activeItems = itemsRef.current.filter(i => !i.processed && i.x < 200 && i.x > -150);
         if (activeItems.length > 0) {
            // Auto crush the closest one
            const target = activeItems[activeItems.length - 1]; // Last one is usually smallest X (closest) because of how we push/splice? No, we splice.
            // Actually sort is safer
            activeItems.sort((a, b) => a.x - b.x);
            const closest = activeItems[0];
            
            handleProcessItem(closest);
            lastAutoClickTimeRef.current = time;
         }
      }

      // --- UPDATE & DRAW ITEMS ---
      itemsRef.current.forEach((item, index) => {
        const speed = isRampagingRef.current ? 8 : (1.5 + (upgrades.find(u => u.id === 'crusher_speed')?.level || 1) * 0.1);
        
        // Movement
        if (item.z > 0) {
          item.z -= 15; 
          if (item.z < 0) item.z = 0;
        } else if (!item.processed) {
          item.x -= speed;
        }

        // Cleanup
        if (item.x < -250) {
           itemsRef.current.splice(index, 1);
           return; 
        }
        if (item.processed && item.z < -100) {
           itemsRef.current.splice(index, 1);
           return;
        }
        
        if (item.processed) {
           item.z -= 10;
           item.x -= 2;
        }

        const isoPos = toIso(item.x, item.y, item.z);
        
        // Shadow
        if (item.z > 0) {
           const shadowPos = toIso(item.x, item.y, 0);
           ctx.fillStyle = 'rgba(0,0,0,0.3)';
           ctx.beginPath();
           ctx.ellipse(shadowPos.x, shadowPos.y, 15, 8, 0, 0, Math.PI*2);
           ctx.fill();
        }

        // Draw Item
        if (!item.processed || item.z > -50) {
           drawCube(ctx, isoPos.x, isoPos.y, 15, item.color, 25);
           
           // Draw Text Label on Cube
           if (item.z === 0 && !item.processed) {
              ctx.save();
              ctx.translate(isoPos.x, isoPos.y - 25); // Top of cube
              ctx.fillStyle = 'rgba(255,255,255,0.9)';
              ctx.font = 'bold 10px Roboto';
              ctx.textAlign = 'center';
              // Rotate slightly to match iso? Nah plain text is readable
              ctx.fillText(item.label, 0, 0);
              ctx.restore();
           }
        }
      });

      // --- DRAW CRUSHER MACHINE ---
      const machineX = -160;
      const machineBaseIso = toIso(machineX, 0);
      const bounce = machineYRef.current;
      const machineColor = isRampagingRef.current ? '#b91c1c' : '#1e293b';
      
      // Machine Frame
      drawCube(ctx, machineBaseIso.x, machineBaseIso.y - bounce, 40, machineColor, 120); 
      
      // The Smasher
      drawCube(ctx, machineBaseIso.x, machineBaseIso.y - 60 - bounce, 45, '#ef4444', 20); 
      
      // UI Text on Machine
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Roboto';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(job.machineName, machineBaseIso.x, machineBaseIso.y - 120 - bounce);
      ctx.shadowBlur = 0;


      // --- PARTICLES ---
      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        p.vy += 0.5; 

        if (p.life > 0) {
           const pIso = toIso(p.x, p.y, -p.y * 0.5); 
           ctx.fillStyle = p.color;
           ctx.globalAlpha = p.life;
           ctx.beginPath();
           ctx.arc(pIso.x + machineBaseIso.x, pIso.y + machineBaseIso.y - 50, p.size, 0, Math.PI * 2);
           ctx.fill();
           ctx.globalAlpha = 1.0;
        } else {
           particlesRef.current.splice(i, 1);
        }
      });

      ctx.restore();
      frameRef.current = requestAnimationFrame(loop);
    };

    const resize = () => {
       canvas.width = window.innerWidth;
       canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    
    frameRef.current = requestAnimationFrame(loop);
    canvas.addEventListener('mousedown', processClick);
    canvas.addEventListener('touchstart', processClick);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', processClick);
      canvas.removeEventListener('touchstart', processClick);
    };
  }, [job, upgrades, hasAuto, getSpawnRate, getAutoRate, processClick]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute top-0 left-0 w-full h-full cursor-pointer transition-colors duration-500 ${isRampaging ? 'bg-red-900' : 'bg-sky-300'}`}
      style={{ touchAction: 'none' }}
    />
  );
};

export default IsometricCanvas;