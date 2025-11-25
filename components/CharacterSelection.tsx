
import React from 'react';
import { ORIGINS } from '../constants';
import { OriginType } from '../types';
import Character from './Character';
import { Wallet, Brain, Sparkles } from 'lucide-react';

interface CharacterSelectionProps {
  onSelect: (origin: OriginType) => void;
}

const CharacterSelection: React.FC<CharacterSelectionProps> = ({ onSelect }) => {
  return (
    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter">
          选择你的<span className="text-sky-400">出身</span>
        </h1>
        <p className="text-slate-400 text-lg">投胎是一门技术活，你想体验哪种牛马人生？</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {(Object.keys(ORIGINS) as OriginType[]).map((key) => {
          const origin = ORIGINS[key];
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="group relative bg-white rounded-2xl p-1 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(56,189,248,0.3)] border-4 border-transparent hover:border-sky-400 focus:outline-none"
            >
              <div className="bg-slate-50 rounded-xl h-full p-6 flex flex-col items-center text-center overflow-hidden relative">
                
                {/* Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white
                  ${key === 'HEIR' ? 'bg-yellow-500' : key === 'SOCIALITE' ? 'bg-pink-500' : 'bg-slate-600'}
                `}>
                  {key === 'HEIR' ? 'Easy Mode' : key === 'SOCIALITE' ? 'Normal' : 'Hard Mode'}
                </div>

                {/* Avatar Preview */}
                <div className="w-40 h-40 mb-4 relative group-hover:scale-110 transition-transform duration-300">
                  <Character role="PLAYER" emotion="NEUTRAL" originType={key} />
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-1">{origin.name}</h3>
                <div className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">{origin.title}</div>
                
                <p className="text-slate-600 text-sm mb-6 min-h-[3rem] leading-relaxed">
                  {origin.description}
                </p>

                {/* Stats */}
                <div className="w-full space-y-3 bg-slate-100 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600 font-bold"><Wallet size={16} className="text-yellow-500"/> 初始资金</span>
                    <span className={origin.baseStats.money < 0 ? "text-red-500 font-mono" : "text-green-600 font-mono"}>
                      {origin.baseStats.money.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600 font-bold"><Sparkles size={16} className="text-pink-500"/> 魅力值</span>
                    <div className="w-20 h-2 bg-slate-300 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500" style={{width: `${origin.baseStats.charm}%`}}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600 font-bold"><Brain size={16} className="text-blue-500"/> 智力/发量</span>
                    <div className="w-20 h-2 bg-slate-300 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{width: `${origin.baseStats.intellect}%`}}></div>
                    </div>
                  </div>
                </div>

                {/* Passive */}
                <div className="w-full bg-sky-50 border border-sky-100 p-3 rounded-lg text-left">
                  <div className="text-xs font-black text-sky-600 uppercase mb-1">Passive Skill</div>
                  <div className="text-xs text-sky-800 font-medium">{origin.passive}</div>
                </div>

                <div className="mt-auto pt-6 w-full">
                  <div className="w-full py-3 bg-slate-800 text-white rounded-lg font-bold group-hover:bg-sky-500 transition-colors">
                    选择此人生
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterSelection;
