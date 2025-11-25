
export enum Profession {
  INTERN = 'INTERN',
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR'
}

export type SceneType = 'HR' | 'WORKSTATION' | 'BOSS_OFFICE';
export type OriginType = 'GRINDER' | 'HEIR' | 'SOCIALITE';

export type ActionType = 'PLEASE' | 'REBEL' | 'VIOLENCE' | 'WORK' | 'TALK';

export interface GameAction {
  id: string;
  label: string;
  description: string;
  type: ActionType;
  cost?: number; // Rage cost for violence
  value: number; // Amount of Favor or Rage gained/damage dealt
  cooldown: number; // In ms
  targetScene?: SceneType; // Where this action is available
}

export interface NPCConfig {
  id: string;
  name: string;
  role: 'HR' | 'COLLEAGUE' | 'BOSS';
  avatarColor: string;
  dialogues: string[];
}

export interface JobConfig {
  id: Profession;
  title: string;
  bossName: string;
  bossAvatarColor: string;
  playerAvatarColor: string;
  maxFavor: number; // Needed to promote
  actions: GameAction[];
  enemyTexts: string[];
  color: string;
  machineName: string;
}

export interface OriginConfig {
  id: OriginType;
  name: string;
  title: string;
  description: string;
  passive: string;
  avatarStyle: {
    skin: string;
    hair: string;
    accessory: 'GLASSES' | 'SUNGLASSES' | 'JEWELRY' | 'NONE';
  };
  baseStats: {
    money: number;
    charm: number;
    intellect: number;
  };
}

export type SkillCategory = 'EFFICIENCY' | 'POLITICS' | 'SURVIVAL';

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  cost: number; // Skill Points
  maxLevel: number;
  icon: string; // Lucide icon name
  reqId?: string; // Prerequisite skill ID
}

export interface GameState {
  level: number;
  profession: Profession;
  origin: OriginType; // The player's background
  money: number;
  favor: number; // Progress to promotion
  maxFavor: number;
  rage: number; // Currency for attacks
  maxRage: number;
  
  // Skill System
  skillPoints: number;
  skills: Record<string, number>; // skillId -> level

  isPlaying: boolean;
  hasSelectedCharacter: boolean; // New flag for character selection
  bossHealth: number; // Visual satisfaction only
  bossMaxHealth: number;
  dialogue: Dialogue | null; // Structured dialogue
  lastActionId: string | null; // To trigger animations
  currentScene: SceneType;
  isResigning: boolean;
  upgrades: Upgrade[]; // For the mini-game (Legacy, can be removed or repurposed)
  ending: 'RESIGNED' | 'FIRED' | 'RICH' | null;
}

export interface Dialogue {
  speaker: string;
  text: string;
  choices?: { label: string; action: () => void }[];
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  type?: 'TEXT' | 'HIT_EFFECT' | 'SEAFOOD' | 'RARE'; 
  scale?: number;
  rotation?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export type Emotion = 'NEUTRAL' | 'HAPPY' | 'ANGRY' | 'PAIN' | 'SHOCK' | 'DEAD' | 'KO' | 'SUSPICIOUS';
export type CharacterAction = 'IDLE' | 'WALK' | 'ATTACK' | 'WORK' | 'BOW' | 'SIT' | 'TYPE';

export interface WorkItem {
  id: number;
  x: number;
  y: number;
  z: number;
  type: 'GOLD' | 'NORMAL';
  label: string;
  health: number;
  maxHealth: number;
  color: string;
  processed: boolean;
}

export interface Upgrade {
  id: string;
  level: number;
}
