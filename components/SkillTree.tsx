
import React from 'react';
import { SKILLS } from '../constants';
import { GameState, SkillConfig } from '../types';
import { Zap, Coffee, Bot, Smile, Radio, Crown, Heart, Dumbbell, Scale, Lock, X, Brain } from 'lucide-react';

interface SkillTreeProps {
  gameState: GameState;
  onUnlock: (skillId: string) => void;
  onClose: () => void;
}

const SkillTree: React.FC<SkillTreeProps> = ({ gameState, onUnlock, onClose }) => {
  
  const renderIcon = (name: string, size: number = 24) => {
    switch(name) {
      case 'Zap': return <Zap size={size}/>;
      case 'Coffee': return <Coffee size={size}/>;
      case 'Bot': return <Bot size={size}/>;
      case 'Smile': return <Smile size={size}/>;
      case 'Radio': return <Radio size={size}/>;
      case 'Crown': return <Crown size={size}/>;
      case 'Heart': return <Heart size={size}/>;
      case 'Dumbbell': return <Dumbbell size={size}/>;
      case 'Scale': return <Scale size={size}/>;
      default: return <Zap size={size}/>;
    }
  }

  const renderSkillNode = (skill: SkillConfig) => {
    const currentLevel = gameState.skills[skill.id] || 0;
    const isUnlocked = currentLevel > 0;
    const isMaxed = currentLevel >= skill.maxLevel;
    const canUnlock = !isMaxed && gameState.skillPoints >= skill.cost && 
                      (!skill.reqId || (gameState.skills[skill.reqId] || 0) > 0);
    
    // Visual State
    let bgClass = "bg-slate-800 border-slate-600 opacity-60";
    if (isUnlocked) bgClass = "bg-sky-900 border-sky-500";
    if (canUnlock) bgClass = "bg-slate-700 border-yellow-400 animate-pulse cursor-pointer hover:bg-slate-600";
    if (isMaxed) bgClass = "bg-sky-600 border-sky-300";

    return (
      <div 
        key={skill.id} 
        onClick={() => canUnlock && onUnlock(skill.id)}
        className={`relative p-3 rounded-xl border-2 flex flex-col gap-2 transition-all w-full ${bgClass}`}
      >
        <div className="flex justify-between items-start">
             <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-500'}`}>
                 {renderIcon(skill.icon)}
             </div>
             <div className="text-xs font-black text-white bg-slate-900 px-2 py-1 rounded">
                 LV {currentLevel}/{skill.maxLevel}
             </div>
        </div>
        
        <div>
            <h4 className={`font-bold ${isUnlocked || canUnlock ? 'text-white' : 'text-slate-500'}`}>{skill.name}</h4>
            <p className="text-[10px] text-slate-300 leading-tight mt-1 h-8 overflow-hidden">{skill.description}</p>
        </div>

        <div className="mt-auto pt-2 border-t border-white/10 flex justify-between items-center">
             {!isMaxed ? (
                 <div className={`text-xs font-bold flex items-center gap-1 ${gameState.skillPoints >= skill.cost ? 'text-yellow-400' : 'text-red-400'}`}>
                    {skill.cost} SP
                    {skill.reqId && (gameState.skills[skill.reqId]||0)===0 && <Lock size={10}/>}
                 </div>
             ) : (
                 <div className="text-xs font-bold text-green-300">MAXED</div>
             )}
             {canUnlock && <div className="text-[10px] bg-yellow-500 text-black px-2 rounded font-bold">UPGRADE</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-5xl h-[90vh] md:h-[80vh] rounded-2xl border-4 border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Brain className="text-pink-500" /> 技能树
                </h2>
                <div className="bg-slate-800 px-3 py-1 rounded-full border border-yellow-500/50">
                    <span className="text-slate-400 text-sm mr-2">Available SP:</span>
                    <span className="text-yellow-400 font-black text-xl">{gameState.skillPoints}</span>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full hover:bg-red-500 transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Branch 1: Efficiency */}
            <div className="flex flex-col gap-4">
                <div className="text-sky-400 font-black uppercase tracking-widest border-b border-sky-900/50 pb-2 mb-2 flex items-center gap-2">
                    <Zap size={16}/> 业务能力
                </div>
                {SKILLS.filter(s => s.category === 'EFFICIENCY').map(renderSkillNode)}
            </div>

            {/* Branch 2: Politics */}
            <div className="flex flex-col gap-4">
                <div className="text-purple-400 font-black uppercase tracking-widest border-b border-purple-900/50 pb-2 mb-2 flex items-center gap-2">
                    <Smile size={16}/> 职场厚黑
                </div>
                {SKILLS.filter(s => s.category === 'POLITICS').map(renderSkillNode)}
            </div>

            {/* Branch 3: Survival */}
            <div className="flex flex-col gap-4">
                <div className="text-green-400 font-black uppercase tracking-widest border-b border-green-900/50 pb-2 mb-2 flex items-center gap-2">
                    <Heart size={16}/> 身心健康
                </div>
                {SKILLS.filter(s => s.category === 'SURVIVAL').map(renderSkillNode)}
            </div>

        </div>
        
        <div className="bg-slate-950 p-2 text-center text-slate-600 text-xs font-mono">
            Gaining promotions grants Skill Points. Work hard (or smart)!
        </div>
      </div>
    </div>
  );
};

export default SkillTree;
