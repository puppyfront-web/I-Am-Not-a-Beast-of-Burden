import React, { useMemo } from 'react';
import { Emotion, Profession, OriginType } from '../types';
import { ORIGINS } from '../constants';

interface CharacterProps {
  role: 'BOSS' | 'PLAYER' | 'HR' | 'COLLEAGUE';
  profession?: Profession;
  emotion: Emotion;
  action?: string;
  originType?: OriginType; // For Player customization
}

const Character: React.FC<CharacterProps> = ({ role, profession, emotion, action, originType }) => {
  
  // --- COLORS & STYLES ---
  const styles = useMemo(() => {
    if (role === 'BOSS') {
      return { skin: '#fca5a5', hair: '#475569', suit: '#1e293b', shirt: '#ffffff', tie: '#ef4444', glasses: false, accessory: 'NONE' };
    }
    if (role === 'HR') {
      return { skin: '#fde047', hair: '#db2777', suit: '#fbcfe8', shirt: '#fff', tie: null, glasses: true, accessory: 'NONE' };
    }
    if (role === 'COLLEAGUE') {
      return { skin: '#ffedd5', hair: '#92400e', suit: '#e2e8f0', shirt: '#3b82f6', tie: null, glasses: true, accessory: 'NONE' };
    }
    
    // PLAYER: Mix Profession colors with Origin styles
    const profColors = (() => {
        switch (profession) {
            case Profession.INTERN: return { suit: '#94a3b8', shirt: '#e2e8f0', tie: null };
            case Profession.JUNIOR: return { suit: '#3b82f6', shirt: '#fff', tie: '#2563eb' };
            case Profession.SENIOR: return { suit: '#475569', shirt: '#f8fafc', tie: '#0f172a' };
            case Profession.MANAGER: return { suit: '#7c2d12', shirt: '#fff7ed', tie: '#ea580c' };
            case Profession.DIRECTOR: return { suit: '#dc2626', shirt: '#000000', tie: '#fbbf24' };
            default: return { suit: '#3b82f6', shirt: '#ffffff', tie: '#2563eb' };
        }
    })();

    // If we have an origin type, override standard look
    if (originType) {
        const originStyle = ORIGINS[originType].avatarStyle;
        return {
            skin: originStyle.skin,
            hair: originStyle.hair,
            suit: profColors.suit,
            shirt: profColors.shirt,
            tie: profColors.tie,
            glasses: originStyle.accessory === 'GLASSES',
            accessory: originStyle.accessory
        };
    }

    // Fallback for default player
    return { skin: '#ffedd5', hair: '#000000', suit: profColors.suit, shirt: profColors.shirt, tie: profColors.tie, glasses: false, accessory: 'NONE' };

  }, [role, profession, originType]);

  // --- COMPONENTS ---
  
  const renderEyes = () => {
    if (emotion === 'KO') return ( <g><path d="M35,45 L45,55 M45,45 L35,55" stroke="#000" strokeWidth="3" /><path d="M55,45 L65,55 M65,45 L55,55" stroke="#000" strokeWidth="3" /></g> );
    if (emotion === 'SUSPICIOUS') return ( <g><rect x="35" y="48" width="10" height="2" fill="#000"/><rect x="55" y="48" width="10" height="2" fill="#000"/></g> );

    // Sunglasses for HEIR
    if (styles.accessory === 'SUNGLASSES' && emotion !== 'SHOCK') {
         return (
             <g>
                 <path d="M30,45 Q50,45 70,45" stroke="#000" strokeWidth="2"/>
                 <path d="M32,45 Q32,55 42,55 Q52,55 52,45 Z" fill="#111" />
                 <path d="M50,45 Q50,55 60,55 Q70,55 70,45 Z" fill="#111" />
                 <path d="M25,45 L30,45" stroke="#111" strokeWidth="2"/>
                 <path d="M72,45 L77,45" stroke="#111" strokeWidth="2"/>
             </g>
         )
    }

    switch (emotion) {
      case 'HAPPY':
        return (<g><path d="M35,45 Q40,40 45,45" fill="none" stroke="#000" strokeWidth="3" /><path d="M55,45 Q60,40 65,45" fill="none" stroke="#000" strokeWidth="3" /></g>);
      case 'ANGRY':
        return (<g><path d="M32,40 L48,45" fill="none" stroke="#000" strokeWidth="3" /><path d="M68,40 L52,45" fill="none" stroke="#000" strokeWidth="3" /><circle cx="40" cy="50" r="3" fill="#000" /><circle cx="60" cy="50" r="3" fill="#000" /></g>);
      case 'SHOCK':
      case 'PAIN':
        return (<g><circle cx="40" cy="48" r="5" fill="#000" /><circle cx="60" cy="48" r="5" fill="#000" /><path d="M75,35 Q70,35 72,45 Q78,45 75,35" fill="#60a5fa" /></g>);
      default:
        // Grinder looks tired with bags under eyes if glasses are on
        if (originType === 'GRINDER') {
            return (<g><circle cx="40" cy="48" r="3" fill="#000" /><circle cx="60" cy="48" r="3" fill="#000" /><path d="M35,55 Q40,58 45,55" stroke="#cbd5e1" fill="none"/><path d="M55,55 Q60,58 65,55" stroke="#cbd5e1" fill="none"/></g>);
        }
        return (<g><circle cx="40" cy="48" r="4" fill="#000" /><circle cx="60" cy="48" r="4" fill="#000" /></g>);
    }
  };

  const renderMouth = () => {
    if (emotion === 'KO') return ( <g><path d="M40,70 Q50,65 60,70" fill="none" stroke="#000" strokeWidth="3" /><path d="M45,70 Q45,85 55,70" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" /></g> );
    if (action === 'scold' || action === 'laugh') return <ellipse cx="50" cy="65" rx="10" ry="8" fill="#000" />;

    switch (emotion) {
      case 'HAPPY': return <path d="M40,65 Q50,75 60,65" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />;
      case 'ANGRY': return <path d="M40,70 Q50,60 60,70" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />;
      case 'SHOCK': return <circle cx="50" cy="68" r="8" fill="#000" />;
      case 'PAIN': return (<g><path d="M40,70 Q50,60 60,70" fill="none" stroke="#000" strokeWidth="3" /><circle cx="35" cy="75" r="2" fill="#dc2626" /><circle cx="38" cy="80" r="1.5" fill="#dc2626" /></g>);
      case 'SUSPICIOUS': return <path d="M45,68 L55,68" fill="none" stroke="#000" strokeWidth="2" />;
      default: return <path d="M42,68 L58,68" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />;
    }
  };

  const renderBody = () => {
    const isPunching = action === 'punch' || action === 'combo';
    const isKicking = action === 'kick';
    const isBowing = action?.includes('please') || action === 'tea';
    
    // Define animation style based on action
    let animStyle = {};
    if (isPunching) animStyle = { animation: 'punch 0.3s ease-in-out infinite' };
    if (isKicking) animStyle = { animation: 'kick 0.4s ease-in-out infinite' };
    if (action === 'tea') animStyle = { animation: 'sip 1s ease-in-out infinite' };
    if (action === 'type') animStyle = { animation: 'typing 0.2s steps(2) infinite' };

    // Female suit shape for HR or Socialite
    if (role === 'HR' || originType === 'SOCIALITE') {
        return (
            <g style={animStyle}>
                <path d="M30,90 Q25,140 30,180 L70,180 Q75,140 70,90" fill={styles.suit} />
                <path d="M50,90 L40,120 L60,120 Z" fill={styles.shirt} />
                 {/* Jewelry for Socialite */}
                 {styles.accessory === 'JEWELRY' && <circle cx="50" cy="95" r="3" fill="#fbbf24" stroke="#b45309" strokeWidth="0.5"/>}
                 
                 {/* Arms Folded if idle */}
                 {!action || action === 'idle' ? (
                    <g>
                        <path d="M30,100 Q10,130 50,135" fill="none" stroke={styles.suit} strokeWidth="10" strokeLinecap="round" />
                        <path d="M70,100 Q90,130 50,125" fill="none" stroke={styles.suit} strokeWidth="10" strokeLinecap="round" />
                    </g>
                 ) : renderArms(isPunching, isKicking)}
            </g>
        )
    }

    return (
      <g transform={isBowing ? "rotate(15, 50, 100)" : ""} style={animStyle}>
        <path d="M25,90 Q20,140 25,180 L75,180 Q80,140 75,90" fill={styles.suit} />
        <path d="M50,90 L35,130 L65,130 Z" fill={styles.shirt} />
        {styles.tie && <path d="M50,90 L45,135 L50,150 L55,135 Z" fill={styles.tie} />}
        {/* Gold Chain for Heir */}
        {originType === 'HEIR' && <path d="M35,90 Q50,110 65,90" fill="none" stroke="#fbbf24" strokeWidth="2" />}
        {renderArms(isPunching, isKicking)}
      </g>
    );
  };

  const renderArms = (isPunching: boolean, isKicking: boolean) => {
    if (isPunching) {
        return <g><path d="M25,100 L-20,70" fill="none" stroke={styles.suit} strokeWidth="12" strokeLinecap="round" /><circle cx="-25" cy="65" r="15" fill={styles.skin} /><rect x="-30" y="60" width="12" height="12" rx="2" fill="rgba(0,0,0,0.1)" transform="rotate(-20)" /><path d="M75,100 L40,130" fill="none" stroke={styles.suit} strokeWidth="12" strokeLinecap="round" /><circle cx="35" cy="135" r="12" fill={styles.skin} /></g>;
    }
    if (isKicking) {
        return <g><path d="M25,100 L0,110" fill="none" stroke={styles.suit} strokeWidth="12" strokeLinecap="round" /><path d="M75,100 L110,80" fill="none" stroke={styles.suit} strokeWidth="12" strokeLinecap="round" /><circle cx="115" cy="75" r="8" fill={styles.suit}/></g>;
    }
    if (action === 'tea') {
        return <g><path d="M25,100 Q10,130 30,140" fill="none" stroke={styles.suit} strokeWidth="10" strokeLinecap="round" /><path d="M75,100 Q90,130 70,140" fill="none" stroke={styles.suit} strokeWidth="10" strokeLinecap="round" /><circle cx="30" cy="140" r="6" fill={styles.skin} /><rect x="25" y="135" width="50" height="5" fill="silver" /><rect x="45" y="125" width="10" height="10" fill="#fff" /></g>;
    }
    if (action === 'type') {
         return (
            <g>
                <path d="M25,100 Q10,130 35,150" fill="none" stroke={styles.suit} strokeWidth="10" strokeLinecap="round" />
                <path d="M75,100 Q90,130 65,150" fill="none" stroke={styles.suit} strokeWidth="10" strokeLinecap="round" />
                <circle cx="35" cy="155" r="6" fill={styles.skin} />
                <circle cx="65" cy="155" r="6" fill={styles.skin} />
            </g>
         );
    }
    
    return <g><path d="M25,100 L20,160" fill="none" stroke={styles.suit} strokeWidth="10" strokeLinecap="round" /><path d="M75,100 L80,160" fill="none" stroke={styles.suit} strokeWidth="10" strokeLinecap="round" /><circle cx="20" cy="165" r="7" fill={styles.skin} /><circle cx="80" cy="165" r="7" fill={styles.skin} /></g>;
  };

  const renderHair = () => {
      if (role === 'BOSS') return <g><path d="M25,35 Q50,20 75,35" fill="none" stroke={styles.hair} strokeWidth="4" /><path d="M20,30 L20,50" fill="none" stroke={styles.hair} strokeWidth="4" /><path d="M80,30 L80,50" fill="none" stroke={styles.hair} strokeWidth="4" /></g>;
      if (role === 'HR') return <path d="M15,40 Q50,-10 85,40 L90,120 L10,120 Z" fill={styles.hair} />;
      if (role === 'COLLEAGUE') return <path d="M20,50 Q50,20 80,50" fill={styles.hair} />;
      
      if (originType === 'HEIR') return <path d="M20,40 Q50,-20 80,40 L80,50 Q50,20 20,50 Z" fill={styles.hair} />;
      if (originType === 'GRINDER') return <path d="M15,45 Q50,30 85,45 Q80,30 50,35 Q20,30 15,45" fill={styles.hair} />;
      if (originType === 'SOCIALITE') return <path d="M15,40 Q50,-10 85,40 L95,110 L80,110 L80,40 Q50,10 20,40 L20,110 L5,110 Z" fill={styles.hair} />;

      // Fallback profession hair
      if (profession === Profession.INTERN) return <path d="M20,40 Q50,-10 80,40" fill={styles.hair} />;
      if (profession === Profession.DIRECTOR) return <path d="M20,40 Q50,10 80,40 L80,30 Q50,0 20,30 Z" fill={styles.hair} />;
      return <path d="M25,40 Q50,10 75,40 Z" fill={styles.hair} />;
  }

  return (
    <svg viewBox="-40 0 180 200" className="w-full h-full overflow-visible">
      <style>
        {`
          @keyframes punch {
            0% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-20px, 0) rotate(-5deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
          @keyframes kick {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg) translate(0, -10px); }
            50% { transform: rotate(-15deg) translate(5px, -15px); }
            100% { transform: rotate(0deg); }
          }
          @keyframes sip {
            0% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
            100% { transform: translateY(0); }
          }
          @keyframes typing {
            0% { transform: translateY(0); }
            50% { transform: translateY(2px); }
            100% { transform: translateY(0); }
          }
        `}
      </style>
      <ellipse cx="50" cy="190" rx="40" ry="10" fill="rgba(0,0,0,0.2)" />
      <g transform={emotion === 'PAIN' ? "rotate(-15, 50, 80)" : emotion === 'KO' ? "rotate(-25, 50, 150)" : ""}>
          {renderBody()}
          <circle cx="50" cy="50" r="35" fill={styles.skin} stroke="#000" strokeWidth="0" />
          {renderHair()}
          {renderEyes()}
          {renderMouth()}
          {styles.glasses && (
              <g>
                  <circle cx="40" cy="50" r="10" fill="none" stroke="#000" strokeWidth="1.5" strokeOpacity="0.7"/>
                  <circle cx="60" cy="50" r="10" fill="none" stroke="#000" strokeWidth="1.5" strokeOpacity="0.7"/>
                  <path d="M50,50 L50,48" stroke="#000" strokeWidth="1.5" />
                  {originType === 'GRINDER' && <path d="M69,50 L80,48" stroke="#000" strokeWidth="1.5"/>}
              </g>
          )}
      </g>
      {emotion === 'ANGRY' && <path d="M80,20 L90,10 M85,25 L100,20" stroke="#ef4444" strokeWidth="3" />}
    </svg>
  );
};

export default Character;