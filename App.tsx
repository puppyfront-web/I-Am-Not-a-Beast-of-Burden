
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Profession, FloatingText, GameAction, SceneType, Dialogue, OriginType } from './types';
import { JOBS, GET_SCENE_ACTIONS, BOSS_QUOTES, SEAFOOD_INSULTS, NPCS, ORIGINS, SKILLS } from './constants';
import OfficeScene from './components/OfficeScene';
import CharacterSelection from './components/CharacterSelection';
import SkillTree from './components/SkillTree';
import { Flame, Map, Users, Briefcase, AlertCircle, X, RotateCcw, Wallet, Brain, Share2, Save } from 'lucide-react';

const SAVE_KEY = 'niuma_save_v1';

const DEFAULT_GAME_STATE: GameState = {
  level: 1,
  profession: Profession.INTERN,
  origin: 'GRINDER',
  money: 0,
  favor: 0,
  maxFavor: 100,
  rage: 0,
  maxRage: 500,
  skillPoints: 0,
  skills: {},
  isPlaying: false,
  hasSelectedCharacter: false,
  bossHealth: 1000,
  bossMaxHealth: 1000,
  dialogue: null,
  lastActionId: null,
  currentScene: 'HR',
  isResigning: false,
  upgrades: [],
  ending: null
};

const App: React.FC = () => {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>(() => {
    // Load from local storage on init
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with default to ensure new fields are present if schema updates
        return { ...DEFAULT_GAME_STATE, ...parsed, dialogue: null, lastActionId: null }; 
      }
    } catch (e) {
      console.error("Failed to load save", e);
    }
    return DEFAULT_GAME_STATE;
  });

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [actionCooldowns, setActionCooldowns] = useState<Record<string, number>>({});
  const [showSkillTree, setShowSkillTree] = useState(false);
  const actionResetTimeoutRef = useRef<number | null>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    if (gameState.hasSelectedCharacter && !gameState.ending) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  // --- HELPERS ---
  const spawnText = (text: string, color: string, type: 'TEXT' | 'HIT_EFFECT' | 'SEAFOOD' | 'RARE' = 'TEXT', x?: number, y?: number) => {
    const id = Date.now() + Math.random();
    const tx = x || window.innerWidth / 2 + (Math.random() - 0.5) * 100;
    const ty = y || window.innerHeight / 3 + (Math.random() - 0.5) * 50;
    setFloatingTexts(prev => [...prev, { id, text, color, x: tx, y: ty, life: 1, type }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1000);
  };

  const showDialogue = (speaker: string, text: string, choices?: { label: string; action: () => void }[]) => {
    setGameState(prev => ({ ...prev, dialogue: { speaker, text, choices } }));
  };

  const closeDialogue = () => {
    setGameState(prev => ({ ...prev, dialogue: null }));
  };

  // --- SHARE FUNCTION ---
  const handleShare = async () => {
    const jobTitle = JOBS[gameState.profession].title;
    const originName = ORIGINS[gameState.origin].name;
    const text = `我在《我不是牛马》中扮演${originName}，已经混到了【${jobTitle}】！\n当前身价：$${gameState.money.toLocaleString()}\n怒气值：${gameState.rage}/${gameState.maxRage}\n来试试你能活过几集？`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '我不是牛马 - 职场生存模拟',
          text: text,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        spawnText("已复制战绩到剪贴板!", "#22c55e", 'RARE');
      } catch (err) {
        spawnText("分享失败", "#ef4444");
      }
    }
  };

  // --- CHARACTER SELECTION ---
  const handleCharacterSelect = (origin: OriginType) => {
      const config = ORIGINS[origin];
      setGameState(prev => ({
          ...prev,
          origin: origin,
          money: config.baseStats.money,
          hasSelectedCharacter: true,
          isPlaying: true,
          skillPoints: 1, // Start with 1 point
          skills: {}
      }));
  };

  // --- SKILL LOGIC ---
  const unlockSkill = (skillId: string) => {
      setGameState(prev => {
          const skill = SKILLS.find(s => s.id === skillId);
          if (!skill || prev.skillPoints < skill.cost) return prev;
          
          const currentLevel = prev.skills[skillId] || 0;
          if (currentLevel >= skill.maxLevel) return prev;

          return {
              ...prev,
              skillPoints: prev.skillPoints - skill.cost,
              skills: {
                  ...prev.skills,
                  [skillId]: currentLevel + 1
              },
              // Apply Instant Effects
              maxRage: skillId === 'sur_zen' ? prev.maxRage + 100 : prev.maxRage
          };
      });
      spawnText("Skill Upgraded!", "#a855f7");
  };

  const getSkillLevel = (id: string) => gameState.skills[id] || 0;


  // --- GAME LOOP ---
  useEffect(() => {
    if (!gameState.isPlaying || gameState.ending) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        // Passive rage gain
        let rageGain = 1 + Math.floor(prev.rage / 100);
        if (prev.origin === 'GRINDER') rageGain += 1; 
        
        // Auto Work Skill
        const autoLevel = prev.skills['eff_auto'] || 0;
        let autoFavor = 0;
        if (autoLevel > 0) {
            autoFavor = 2; // 2 Favor per second
        }

        return { 
            ...prev, 
            rage: Math.min(prev.maxRage, prev.rage + rageGain),
            favor: Math.min(prev.maxFavor, prev.favor + autoFavor)
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.ending, gameState.origin, gameState.skills]);

  // --- ACTIONS ---
  const handleAction = (action: GameAction) => {
    const now = Date.now();
    
    // Skill: Coffee (Reduce Cooldown)
    let cooldown = action.cooldown;
    const coffeeLevel = getSkillLevel('eff_coffee');
    if (coffeeLevel > 0) {
        cooldown = Math.floor(cooldown * (1 - coffeeLevel * 0.1));
    }

    if (actionCooldowns[action.id] && now < actionCooldowns[action.id]) return;
    if (action.type === 'VIOLENCE' && gameState.rage < (action.cost || 0)) {
      if (gameState.origin === 'HEIR' && gameState.money > 1000) {
          // Heir check
      } else {
        spawnText("怒气不足!", "#94a3b8");
        return;
      }
    }

    setActionCooldowns(prev => ({ ...prev, [action.id]: now + cooldown }));

    // Handle Logic
    setGameState(prev => {
      let newFavor = prev.favor;
      let newRage = prev.rage;
      let newBossHealth = prev.bossHealth;
      let newIsResigning = prev.isResigning;
      let newMoney = prev.money;
      let newSkillPoints = prev.skillPoints;

      // Origin Modifiers
      let valMultiplier = 1;
      if (prev.origin === 'GRINDER' && action.type === 'WORK') valMultiplier = 1.2;
      if (prev.origin === 'SOCIALITE' && (action.type === 'TALK' || action.type === 'PLEASE')) valMultiplier = 2.0;

      // Skill Modifiers
      if (action.type === 'WORK') {
          valMultiplier += (prev.skills['eff_typing'] || 0) * 0.2;
      }
      if (action.type === 'PLEASE' || action.id === 'report' || action.id === 'tea') {
          valMultiplier += (prev.skills['pol_smile'] || 0) * 0.25;
          // Master Politician Crit
          if ((prev.skills['pol_master'] || 0) > 0 && Math.random() > 0.7) {
              valMultiplier *= 2;
              spawnText("画饼暴击!", "#a855f7", 'RARE');
          }
      }
      if (action.type === 'VIOLENCE') {
          valMultiplier += (prev.skills['sur_gym'] || 0) * 0.3;
      }

      const finalValue = Math.floor(action.value * valMultiplier);

      // Action Effects
      if (action.type === 'PLEASE') newFavor += finalValue;
      if (action.type === 'REBEL') newRage += finalValue;
      if (action.type === 'WORK') { 
          newFavor += finalValue; 
          newRage += 5; 
          // Chance for SP drop
          if (Math.random() < 0.02) {
              newSkillPoints += 1;
              spawnText("+1 Skill Point", "#a855f7", 'RARE');
          }
      }
      if (action.type === 'TALK') { 
          newRage += finalValue; 
          spawnText("摸鱼中...", "#60a5fa");
          
          // Gossip Skill
          if ((prev.skills['pol_gossip'] || 0) > 0) {
              newFavor += 5 * (prev.skills['pol_gossip'] || 1);
          }
      }

      if (action.type === 'VIOLENCE') {
        newRage -= (action.cost || 0);
        newBossHealth = Math.max(0, prev.bossHealth - finalValue * 10);
        spawnText(`-${finalValue * 10}`, "#ef4444", "HIT_EFFECT");
        
        if (prev.currentScene === 'HR') {
             newIsResigning = true; 
        }
      }

      // Special Actions
      if (action.id === 'resign') {
          // Law Skill Check
          const hasLaw = (prev.skills['sur_law'] || 0) > 0;
          
          showDialogue("HR Linda", "离职？好的，请填写这张申请表，这张承诺书，还有这个竞业协议...", [
              { label: hasLaw ? "赔钱! (N+1)" : "我签！(Sign)", action: () => { 
                  closeDialogue();
                  if (hasLaw) {
                       setGameState(p => ({...p, money: p.money + 50000, ending: 'RESIGNED'}));
                  } else {
                       setGameState(p => ({...p, ending: 'RESIGNED'}));
                  }
              }},
              { label: "再想想", action: () => closeDialogue() }
          ]);
          newIsResigning = true;
      }
      
      if (action.id === 'onboard') {
          spawnText("入职成功", "#22c55e");
      }

      if (actionResetTimeoutRef.current) clearTimeout(actionResetTimeoutRef.current);
      actionResetTimeoutRef.current = window.setTimeout(() => {
        setGameState(p => ({...p, lastActionId: null}));
      }, 100);

      return {
        ...prev,
        favor: newFavor,
        rage: Math.min(prev.maxRage, newRage),
        money: newMoney,
        bossHealth: newBossHealth,
        skillPoints: newSkillPoints,
        lastActionId: action.id,
        isResigning: newIsResigning
      };
    });

    handleDialogueResponse(action);

    // Check Promotion
    setTimeout(() => {
        setGameState(curr => {
             if (curr.favor >= curr.maxFavor) {
                 if (curr.currentScene !== 'BOSS_OFFICE') {
                     spawnText("可以晋升了! 去找老板!", "#fbbf24");
                 } else {
                     handlePromotion(curr);
                 }
                 return curr;
             }
             return curr;
        })
    }, 500);
  };

  const handleWorkEarn = (amount: number) => {
      setGameState(prev => {
          let favorGain = Math.floor(amount / 10);
          
          // Typing Skill Boost
          if ((prev.skills['eff_typing'] || 0) > 0) {
              favorGain = Math.floor(favorGain * (1 + prev.skills['eff_typing'] * 0.2));
          }

          // Money calculation
          let moneyGain = amount / 10; 
          if (prev.origin === 'HEIR') moneyGain *= 2; 
          
          return { 
              ...prev, 
              favor: prev.favor + favorGain,
              money: prev.money + Math.floor(moneyGain) 
          };
      });
      spawnText(`+${Math.floor(amount/10)} Favor`, "#fbbf24", 'TEXT');
  };

  const handleDialogueResponse = (action: GameAction) => {
      if (gameState.currentScene === 'BOSS_OFFICE') {
           if (action.type === 'VIOLENCE') {
               showDialogue(JOBS[gameState.profession].bossName, "保安！保安在哪里？！");
           } else if (action.type === 'PLEASE') {
               if (Math.random() > 0.7) showDialogue(JOBS[gameState.profession].bossName, BOSS_QUOTES[Math.floor(Math.random() * BOSS_QUOTES.length)]);
           }
      }
      if (gameState.currentScene === 'WORKSTATION') {
           if (action.type === 'TALK') {
               showDialogue(NPCS.COLLEAGUE.name, NPCS.COLLEAGUE.dialogues[Math.floor(Math.random() * NPCS.COLLEAGUE.dialogues.length)]);
           }
      }
  };

  const handlePromotion = (currentState: GameState) => {
      const jobKeys = Object.keys(JOBS) as Profession[];
      const currentIndex = jobKeys.indexOf(currentState.profession);
      if (currentIndex < jobKeys.length - 1) {
        const nextJob = jobKeys[currentIndex + 1];
        showDialogue("System", `恭喜晋升! 你现在是 ${JOBS[nextJob].title}`, [
            { label: "谢谢老板!", action: () => closeDialogue() }
        ]);
        setGameState(prev => ({
          ...prev,
          profession: nextJob,
          level: prev.level + 1,
          favor: 0,
          maxFavor: JOBS[nextJob].maxFavor,
          bossHealth: 1000,
          rage: Math.max(0, prev.rage - 50),
          money: prev.money + 5000,
          skillPoints: prev.skillPoints + 2 // Grant SP on promotion
        }));
      } else {
         setGameState(prev => ({...prev, ending: 'RICH'}));
      }
  };

  const changeScene = (scene: SceneType) => {
      setGameState(prev => ({ ...prev, currentScene: scene }));
      if (scene === 'HR') spawnText("人事部", "#ec4899");
      if (scene === 'WORKSTATION') spawnText("苦逼工位", "#3b82f6");
      if (scene === 'BOSS_OFFICE') spawnText("老板办公室", "#ef4444");
  };

  const restartGame = () => {
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
  };

  // --- RENDER ENDING ---
  if (gameState.ending) {
      const isResigned = gameState.ending === 'RESIGNED';
      return (
          <div className={`w-full h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden ${isResigned ? 'bg-slate-200' : 'bg-yellow-100'}`}>
               <h1 className="text-6xl font-black mb-4">{isResigned ? "你离职了!" : "人生巅峰!"}</h1>
               <p className="text-2xl text-slate-600 mb-8 max-w-lg">
                   {isResigned ? "恭喜你脱离了苦海。" : "你成为了公司的主宰。"}
               </p>
               <div className="mb-8 p-4 bg-white rounded-lg shadow-lg">
                    <div className="text-slate-500 text-sm uppercase tracking-widest">Final Net Worth</div>
                    <div className="text-4xl font-black text-green-600">${gameState.money.toLocaleString()}</div>
               </div>
               
               <div className="flex gap-4">
                  <button onClick={handleShare} className="flex items-center gap-2 bg-sky-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg">
                      <Share2 /> 分享战绩
                  </button>
                  <button onClick={restartGame} className="flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg">
                      <RotateCcw /> 重新开始
                  </button>
               </div>
          </div>
      )
  }

  // --- RENDER SELECTION ---
  if (!gameState.isPlaying) {
      if (!gameState.hasSelectedCharacter) {
          return <CharacterSelection onSelect={handleCharacterSelect} />;
      }
  }

  const currentJob = JOBS[gameState.profession];
  const sceneActions = GET_SCENE_ACTIONS(gameState.profession, gameState.currentScene);
  const activeNPC = gameState.currentScene === 'HR' ? NPCS.HR : gameState.currentScene === 'WORKSTATION' ? NPCS.COLLEAGUE : undefined;

  return (
    <div className="w-full h-screen flex flex-col bg-slate-800 overflow-hidden">
      
      {/* HUD */}
      <div className="absolute top-0 w-full p-2 z-40 flex justify-between pointer-events-none">
         {/* Left: Career */}
         <div className="bg-white/90 border-2 border-slate-800 rounded-lg p-2 flex flex-col w-32 pointer-events-auto shadow-lg">
            <div className="text-[10px] font-black text-slate-500">CAREER PATH</div>
            <div className="text-sm font-bold text-sky-700">{currentJob.title}</div>
            <div className="w-full h-2 bg-slate-200 mt-1 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 transition-all duration-500" style={{width: `${Math.min(100, (gameState.favor / gameState.maxFavor)*100)}%`}}></div>
            </div>
         </div>

         {/* Center: Money & Origin & Controls */}
         <div className="flex flex-col items-center gap-1 pointer-events-auto">
            <div className="bg-slate-800/90 border-2 border-yellow-500 rounded-lg px-4 py-2 flex items-center gap-3 text-white shadow-lg">
                <div className="flex flex-col items-center">
                    <div className="text-[10px] font-black text-yellow-400 uppercase">{ORIGINS[gameState.origin].name}</div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 font-bold text-green-400">
                            <Wallet size={14} />
                            <span>${gameState.money.toLocaleString()}</span>
                        </div>
                        <button 
                            onClick={() => setShowSkillTree(true)}
                            className="bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded flex items-center gap-1 text-xs font-bold animate-pulse border border-purple-400"
                        >
                            <Brain size={12} /> {gameState.skillPoints} SP
                        </button>
                    </div>
                </div>
            </div>
            {/* Utility Buttons */}
            <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  className="bg-sky-600/90 hover:bg-sky-500 p-1.5 rounded-full text-white shadow-lg border border-sky-400 flex items-center justify-center transition-transform hover:scale-110"
                  title="Share Progress"
                >
                  <Share2 size={14} />
                </button>
            </div>
         </div>

         {/* Right: Rage */}
         <div className="bg-slate-900/90 border-2 border-red-900 rounded-lg p-2 flex flex-col w-32 pointer-events-auto shadow-lg">
            <div className="text-[10px] font-black text-red-400 flex items-center gap-1"><Flame size={10}/> ANGER LEVEL</div>
            <div className="text-sm font-bold text-red-500">{gameState.rage} / {gameState.maxRage}</div>
            <div className="w-full h-2 bg-slate-800 mt-1 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${gameState.rage>200?'bg-red-600 animate-pulse':'bg-orange-500'}`} style={{width: `${(gameState.rage/gameState.maxRage)*100}%`}}></div>
            </div>
         </div>
      </div>

      {/* SCENE AREA */}
      <div className="flex-1 relative">
        <OfficeScene 
          gameState={gameState} 
          jobConfig={currentJob} 
          npcConfig={activeNPC}
          onHitBoss={(x,y) => spawnText("Bang!", "#fff", 'HIT_EFFECT', x, y)} 
          floatingTexts={floatingTexts}
          onSelectAction={handleAction}
          onEarn={handleWorkEarn}
        />

        {/* NAVIGATION OVERLAY */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-40">
            <button onClick={() => changeScene('HR')} className={`p-3 rounded-full border-4 shadow-lg transition-all ${gameState.currentScene === 'HR' ? 'bg-pink-500 border-pink-700 text-white scale-110' : 'bg-white border-slate-300 text-slate-400 hover:scale-105'}`}>
                <AlertCircle size={24} />
            </button>
            <button onClick={() => changeScene('WORKSTATION')} className={`p-3 rounded-full border-4 shadow-lg transition-all ${gameState.currentScene === 'WORKSTATION' ? 'bg-sky-500 border-sky-700 text-white scale-110' : 'bg-white border-slate-300 text-slate-400 hover:scale-105'}`}>
                <Users size={24} />
            </button>
            <button onClick={() => changeScene('BOSS_OFFICE')} className={`p-3 rounded-full border-4 shadow-lg transition-all ${gameState.currentScene === 'BOSS_OFFICE' ? 'bg-red-600 border-red-800 text-white scale-110' : 'bg-white border-slate-300 text-slate-400 hover:scale-105'}`}>
                <Briefcase size={24} />
            </button>
        </div>
      </div>

      {/* SKILL TREE MODAL */}
      {showSkillTree && (
          <SkillTree 
            gameState={gameState} 
            onUnlock={unlockSkill} 
            onClose={() => setShowSkillTree(false)}
          />
      )}

      {/* DIALOGUE OVERLAY */}
      {gameState.dialogue && (
          <div className="absolute inset-0 z-[70] bg-black/40 flex items-end md:items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-2xl rounded-2xl border-4 border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10">
                  <div className="bg-slate-800 text-white px-4 py-2 font-black text-lg flex justify-between items-center">
                      <span>{gameState.dialogue.speaker}</span>
                      {!gameState.dialogue.choices && <button onClick={closeDialogue}><X size={20}/></button>}
                  </div>
                  <div className="p-6 text-slate-800 text-lg font-medium leading-relaxed">
                      {gameState.dialogue.text}
                  </div>
                  {gameState.dialogue.choices && (
                      <div className="p-4 bg-slate-100 flex gap-2 justify-end border-t-2 border-slate-200">
                          {gameState.dialogue.choices.map((choice, i) => (
                              <button key={i} onClick={choice.action} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-lg border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all">
                                  {choice.label}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* ACTION PANEL */}
      <div className="h-auto bg-white border-t-8 border-slate-800 z-30">
         <div className="grid grid-cols-3 md:grid-cols-4 gap-2 p-2">
            {sceneActions.map(action => {
              const isOnCooldown = (actionCooldowns[action.id] || 0) > Date.now();
              const isViolence = action.type === 'VIOLENCE';
              
              // Render visual cost if violent
              const costDisplay = isViolence ? `-${action.cost} Rage` : '';

              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  disabled={isOnCooldown || (isViolence && gameState.rage < (action.cost || 0))}
                  className={`
                    relative flex flex-col items-center p-2 rounded-lg border-b-4 transition-all active:translate-y-1 active:border-b-0
                    ${isOnCooldown ? 'bg-slate-200 border-slate-300 text-slate-400' : 
                      isViolence ? 'bg-red-100 border-red-300 text-red-900' : 'bg-sky-100 border-sky-300 text-sky-900'}
                  `}
                >
                   <span className="font-black text-sm">{action.label}</span>
                   <span className="text-[10px] opacity-70">{action.description}</span>
                   {costDisplay && <span className="text-[8px] text-red-600 font-bold">{costDisplay}</span>}
                </button>
              );
            })}
         </div>
      </div>

    </div>
  );
};

export default App;
