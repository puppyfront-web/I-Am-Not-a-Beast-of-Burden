
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FloatingText, GameState, JobConfig, Emotion, GameAction, NPCConfig } from '../types';
import Character from './Character';
import { GET_SCENE_ACTIONS } from '../constants';
import { Code, Coffee } from 'lucide-react';

interface OfficeSceneProps {
  gameState: GameState;
  jobConfig: JobConfig;
  npcConfig?: NPCConfig;
  onHitBoss: (x: number, y: number) => void;
  floatingTexts: FloatingText[];
  onSelectAction?: (action: GameAction) => void;
  onEarn: (amount: number) => void;
}

const OfficeScene: React.FC<OfficeSceneProps> = ({ gameState, jobConfig, npcConfig, onHitBoss, floatingTexts, onSelectAction, onEarn }) => {
  const [npcShake, setNpcShake] = useState(false);
  const [playerAction, setPlayerAction] = useState<string>('idle');
  const [npcEmotion, setNpcEmotion] = useState<Emotion>('NEUTRAL');
  
  // Drag & Drop State
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{x: number, y: number}>({x:0, y:0});
  const playerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, show: boolean} | null>(null);

  // Initialize player position based on scene
  useEffect(() => {
      if (gameState.currentScene === 'WORKSTATION') {
          setPlayerPos({ x: window.innerWidth / 2 - 100, y: 60 }); // Center at desk
      } else if (gameState.currentScene === 'HR') {
          setPlayerPos({ x: 50, y: 20 });
      } else {
          setPlayerPos({ x: 100, y: 0 });
      }
  }, [gameState.currentScene]);

  // Handle Action Animations
  useEffect(() => {
    if (!gameState.lastActionId) return;

    const actionId = gameState.lastActionId;
    
    // Animation Trigger logic
    if (['punch', 'kick', 'combo', 'scold', 'slap', 'argue_hr'].some(s => actionId.includes(s))) {
       setPlayerAction(actionId.includes('kick') ? 'kick' : 'punch');
       setNpcEmotion('PAIN');
       setNpcShake(true);
    } else if (['tea', 'clean', 'gift', 'ot', 'help'].some(s => actionId.includes(s))) {
       setPlayerAction('tea');
       setNpcEmotion('HAPPY');
    } else if (['ignore', 'slack', 'refuse', 'resign'].some(s => actionId.includes(s))) {
       setPlayerAction('rebel');
       setNpcEmotion('ANGRY');
    } else if (['work_hard', 'type'].some(s => actionId.includes(s))) {
        setPlayerAction('type');
    } else {
       setPlayerAction('work');
    }

    const timer = setTimeout(() => {
      setPlayerAction('idle');
      setNpcEmotion('NEUTRAL');
      setNpcShake(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [gameState.lastActionId]);

  // Determine NPC Emotion Display
  const getDisplayEmotion = (): Emotion => {
      if (npcEmotion !== 'NEUTRAL') return npcEmotion;
      if (gameState.currentScene === 'BOSS_OFFICE') {
         if (gameState.bossHealth < 200) return 'KO';
         if (gameState.favor > gameState.maxFavor * 0.8) return 'HAPPY';
         if (gameState.rage > 200) return 'SHOCK';
      }
      if (gameState.currentScene === 'HR' && gameState.isResigning) return 'SUSPICIOUS';
      return 'NEUTRAL';
  };

  // --- DRAG LOGIC ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; 
    if (gameState.currentScene === 'WORKSTATION') return; // Lock player in workstation
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setContextMenu(prev => prev ? { ...prev, show: false } : null);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPlayerPos(prev => ({ x: prev.x + dx, y: prev.y - dy }));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
       window.removeEventListener('mousemove', handleMouseMove);
       window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // --- CONTEXT MENU ---
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, show: true });
  };

  const handleMenuAction = (action: GameAction) => {
     if (onSelectAction) onSelectAction(action);
     setContextMenu(prev => prev ? { ...prev, show: false } : null);
  };

  useEffect(() => {
      const closeMenu = () => setContextMenu(prev => prev ? { ...prev, show: false } : null);
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleDeskClick = () => {
      // Manual work click interaction
      const baseEarn = 100; 
      onEarn(baseEarn);
      setPlayerAction('type');
      
      // Reset animation
      setTimeout(() => setPlayerAction('idle'), 200);
  };


  // --- RENDER HELPERS ---
  const renderBackground = () => {
      switch(gameState.currentScene) {
          case 'HR':
              return (
                  <div className="absolute inset-0 pointer-events-none bg-[#f0f9ff]">
                      <div className="absolute bottom-0 w-full h-1/3 bg-[#e2e8f0] border-t-8 border-[#cbd5e1]"></div>
                      {/* Plants */}
                      <div className="absolute bottom-[25%] left-10 w-20 h-40 bg-green-200 rounded-t-full opacity-50"></div>
                      <div className="absolute top-20 right-20 w-40 h-40 bg-white border-4 border-slate-200 p-4 flex flex-col gap-2">
                          <div className="w-full h-2 bg-slate-200"></div>
                          <div className="w-3/4 h-2 bg-slate-200"></div>
                          <div className="text-[8px] text-slate-400 mt-2">HUMAN RESOURCES</div>
                      </div>
                  </div>
              );
          case 'WORKSTATION':
              return (
                  <div className="absolute inset-0 bg-slate-100">
                       {/* Cubicle Walls */}
                       <div className="absolute bottom-1/3 w-full h-2/3 bg-slate-200 border-b-8 border-slate-300 shadow-inner flex justify-center">
                           <div className="w-2/3 h-full border-x-4 border-slate-300 bg-slate-50 relative">
                               {/* Pinboard */}
                               <div className="absolute top-10 left-10 right-10 h-40 bg-[#fef3c7] border-4 border-[#d97706] opacity-50 shadow-inner"></div>
                               <div className="absolute top-14 left-16 w-20 h-20 bg-yellow-200 shadow rotate-3 p-2 text-[6px] font-mono">TODO: Everything</div>
                               <div className="absolute top-20 right-24 w-20 h-20 bg-pink-200 shadow -rotate-2 p-2 text-[6px] font-mono">Don't forget coffee</div>
                           </div>
                       </div>
                       <div className="absolute bottom-0 w-full h-1/3 bg-slate-300"></div>
                  </div>
              );
          default: // Boss
              return (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 w-full h-1/3 bg-[#cbd5e1] border-t-8 border-[#94a3b8]"></div>
                    <div className="absolute top-0 w-full h-2/3 bg-[#e2e8f0]">
                        <div className="w-full h-full opacity-20" style={{backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                    </div>
                    <div className="absolute top-10 left-20 w-48 h-64 bg-gradient-to-b from-sky-300 to-sky-100 border-8 border-white shadow-lg overflow-hidden">
                        <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-yellow-200 opacity-80 blur-sm"></div>
                        <div className="absolute bottom-0 w-full h-20 bg-white/30 cloud-shape transform scale-150"></div>
                    </div>
                </div>
              )
      }
  }

  const renderDesk = () => {
      if (gameState.currentScene === 'HR') {
          return (
            <div className="absolute bottom-0 w-[120%] h-24 bg-white rounded-xl shadow-2xl border-t-[6px] border-slate-200 flex items-center justify-center z-20 pointer-events-none">
                <div className="bg-pink-100 px-4 py-1 rounded shadow border-b-2 border-pink-300 transform -translate-y-2">
                    <div className="text-pink-800 font-black text-xs tracking-widest uppercase">HR DEPARTMENT</div>
                </div>
            </div>
          )
      }
      if (gameState.currentScene === 'WORKSTATION') {
          // This desk is interactive
          return (
            <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] md:w-[600px] h-48 z-40 cursor-pointer group transition-transform active:scale-95 origin-bottom"
                onClick={handleDeskClick}
            >
                 {/* Table Top */}
                 <div className="absolute bottom-0 w-full h-32 bg-[#e2e8f0] border-t-[12px] border-[#cbd5e1] rounded-t-lg shadow-2xl flex justify-center items-end pb-8">
                      {/* Computer Monitor */}
                      <div className="relative w-48 h-32 bg-slate-800 rounded-t-lg border-4 border-slate-700 p-2 shadow-xl mb-4 transform group-hover:-translate-y-1 transition-transform">
                          <div className="w-full h-full bg-slate-900 rounded overflow-hidden relative">
                              {/* Code Lines Animation */}
                              <div className="absolute inset-0 p-2 font-mono text-[6px] text-green-400 leading-none opacity-80">
                                  {playerAction === 'type' ? (
                                      <>
                                        <div>import Life from 'reality';</div>
                                        <div>while(alive) &#123;</div>
                                        <div>&nbsp;&nbsp;work();</div>
                                        <div>&nbsp;&nbsp;cry();</div>
                                        <div>&#125;</div>
                                        <div className="mt-2 text-yellow-400">// TODO: Fix bugs</div>
                                      </>
                                  ) : (
                                      <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">
                                          <Code size={24} />
                                      </div>
                                  )}
                              </div>
                          </div>
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-8 bg-slate-700"></div>
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-2 bg-slate-600 rounded-full"></div>
                      </div>

                      {/* Coffee Mug */}
                      <div className="absolute right-10 bottom-20">
                          <Coffee className="text-slate-400" size={32} />
                      </div>

                      {/* Papers */}
                      <div className="absolute left-5 bottom-16 w-24 h-4 bg-white shadow rotate-3 border border-slate-200"></div>
                      <div className="absolute left-6 bottom-18 w-24 h-4 bg-white shadow -rotate-2 border border-slate-200"></div>
                 </div>
                 
                 {/* Floating Hint */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-white/80 px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Click to Work!
                 </div>
            </div>
          );
      }
      // Boss
      return (
        <div className="absolute bottom-0 w-[120%] h-24 bg-[#78350f] rounded-xl shadow-2xl border-t-[6px] border-[#92400e] flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-[#fcd34d] px-4 py-1 rounded shadow-lg border-b-4 border-[#b45309] transform -translate-y-2">
            <div className="text-[#78350f] font-black text-xs tracking-widest uppercase">{jobConfig.bossName}</div>
            </div>
            <div className="absolute left-4 top-2 w-16 h-10 bg-white shadow transform -rotate-6 rounded-sm"></div>
            <div className="absolute right-8 top-4 w-12 h-14 bg-white shadow transform rotate-12 rounded-sm"></div>
        </div>
      )
  }

  return (
    <div 
        className="relative w-full h-full bg-slate-100 overflow-hidden select-none perspective-1000 cursor-default"
        onContextMenu={(e) => e.preventDefault()} 
    >
      {renderBackground()}

      {/* NPC AREA (Only visible in HR and Boss Scenes, or background colleague in workstation) */}
      {gameState.currentScene !== 'WORKSTATION' && (
        <div 
            onContextMenu={handleContextMenu}
            className={`absolute top-[15%] md:top-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center transition-transform duration-100 z-10 w-64 md:w-80 cursor-crosshair
            ${npcShake ? 'translate-x-[-48%] rotate-3 brightness-75' : 'hover:scale-105 duration-300'}
            `}
        >
            {/* NPC Character */}
            <div className="relative w-full h-64 md:h-80">
                <Character 
                    role={npcConfig ? npcConfig.role : 'BOSS'} 
                    emotion={getDisplayEmotion()} 
                    action={npcEmotion === 'ANGRY' ? 'scold' : 'idle'}
                />
            </div>
            {renderDesk()}
        </div>
      )}

      {/* Workstation Colleague (Gary) - Appearing randomly or fixed somewhere? Let's put him peeking over the cubicle */}
      {gameState.currentScene === 'WORKSTATION' && (
           <div className="absolute top-[20%] right-[10%] w-40 h-40 z-0 opacity-80 hover:opacity-100 transition-all hover:translate-y-[-10px] cursor-pointer"
                onClick={() => onSelectAction && onSelectAction({id: 'gossip', label: 'Gossip', description: '', type: 'TALK', value: 0, cooldown: 0})}
           >
               <div className="bg-slate-800 text-white text-[10px] p-1 rounded mb-1 text-center opacity-0 hover:opacity-100 transition-opacity">Psst... 摸鱼吗?</div>
               <Character role="COLLEAGUE" emotion="NEUTRAL" action="idle" />
           </div>
      )}

      {/* PLAYER */}
      {/* In Workstation: Fixed behind desk. Elsewhere: Draggable. */}
      <div 
        ref={playerRef}
        onMouseDown={handleMouseDown}
        className={`absolute transition-transform duration-75 
        ${gameState.currentScene === 'WORKSTATION' ? 'z-20 pointer-events-none' : 'z-30 cursor-move'}
        ${isDragging ? 'scale-110 shadow-2xl' : 'scale-100'}
        ${playerAction === 'kick' ? 'origin-bottom -rotate-12' : ''}
        `}
        style={{
            bottom: playerPos.y + 'px',
            left: playerPos.x + 'px',
            transform: `translate(0, 0) ${playerAction === 'punch' ? 'scale(1.2) translateX(100px) translateY(-50px)' : ''}`
        }}
      >
        <div className="relative w-56 h-64 md:w-72 md:h-80 pointer-events-none">
            <Character 
                role="PLAYER" 
                profession={gameState.profession}
                emotion={playerAction === 'punch' || playerAction === 'kick' ? 'ANGRY' : playerAction === 'tea' ? 'HAPPY' : 'NEUTRAL'}
                action={playerAction}
                originType={gameState.origin}
            />
        </div>
        {!isDragging && playerAction === 'idle' && gameState.currentScene !== 'WORKSTATION' && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/80 px-2 py-1 rounded text-xs font-bold animate-bounce">Drag Me!</div>
        )}
        {gameState.currentScene !== 'WORKSTATION' && (
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-center py-1 px-3 font-bold text-sm rounded-full shadow-lg border-2 border-slate-600 whitespace-nowrap">
                {jobConfig.title}
             </div>
        )}
      </div>

      {/* Render Desk Overlay for Workstation */}
      {gameState.currentScene === 'WORKSTATION' && renderDesk()}

      {/* Context Menu */}
      {contextMenu?.show && (
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-2xl border-4 border-slate-800 p-1 min-w-[150px] flex flex-col gap-1 animate-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
              <div className="px-2 py-1 text-xs font-black text-slate-400 uppercase border-b border-slate-100 mb-1">Interaction</div>
              {GET_SCENE_ACTIONS(gameState.profession, gameState.currentScene).map(action => (
                  <button
                    key={action.id}
                    onClick={(e) => { e.stopPropagation(); handleMenuAction(action); }}
                    className={`text-left px-3 py-2 rounded text-sm flex justify-between items-center group font-bold
                        ${action.type === 'VIOLENCE' ? 'text-red-900 hover:bg-red-100' : 'text-slate-700 hover:bg-slate-100'}
                    `}
                  >
                     <span>{action.label}</span>
                     {action.cost && <span className="text-xs bg-red-200 px-1 rounded text-red-800">-{action.cost}</span>}
                  </button>
              ))}
          </div>
      )}

      {/* VFX Layer */}
      {floatingTexts.map(ft => (
          <div key={ft.id} className={`absolute pointer-events-none z-50 
            ${ft.type === 'SEAFOOD' ? 'text-4xl animate-spin' : ft.type === 'RARE' ? 'text-xl animate-bounce shadow-lg bg-yellow-100 p-1 rounded' : 'text-3xl'} 
            font-black`} 
            style={{ left: ft.x, top: ft.y, color: ft.color, textShadow: '1px 1px 0 black' }}>
              {ft.text}
          </div>
      ))}
    </div>
  );
};

export default OfficeScene;
