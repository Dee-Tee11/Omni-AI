import React from 'react';
import { Lock, Tent, Home, Castle, Building2, Rocket } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import StoneAgeScene from '../Paths/StoneAgeScene2';
import './CivilizationPath.css';

const ERAS = [
    { id: 1, name: 'Idade da Pedra', icon: Tent, xpRequired: 0 },
    { id: 2, name: 'Idade do Bronze', icon: Home, xpRequired: 500 },
    { id: 3, name: 'Idade Média', icon: Castle, xpRequired: 1500 },
    { id: 4, name: 'Era Industrial', icon: Building2, xpRequired: 3000 },
    { id: 5, name: 'Futuro Solar', icon: Rocket, xpRequired: 5000 },
];

const CivilizationPath: React.FC = () => {
    const { bioEnergy } = useGamification();

    const getCurrentLevel = () => {
        for (let i = ERAS.length - 1; i >= 0; i--) {
            if (bioEnergy >= ERAS[i].xpRequired) return i + 1;
        }
        return 1;
    };

    const currentLevel = getCurrentLevel();

    return (
        <div className="civilization-path-container">
            <h2 className="text-2xl font-bold mb-6">Caminho da Civilização</h2>

            <div className="path-track">
                {ERAS.map((era, index) => {
                    const isUnlocked = bioEnergy >= era.xpRequired;
                    const isCurrent = currentLevel === era.id;
                    const Icon = era.icon;

                    return (
                        <div
                            key={era.id}
                            className={`level-node ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}
                        >
                            <div className="node-circle">
                                {isUnlocked ? <Icon size={32} /> : <Lock size={24} />}
                            </div>
                            <span className="level-label">{era.name}</span>

                            {isCurrent && (
                                <div className="xp-bar">
                                    <div
                                        className="xp-fill"
                                        style={{
                                            width: `${Math.min(100, ((bioEnergy - era.xpRequired) / (ERAS[index + 1]?.xpRequired - era.xpRequired || 1000)) * 100)}%`
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Cena animada da era atual */}
            <div className="era-scene-container">
                {currentLevel === 1 && <StoneAgeScene />}
                {/* Adicionar outras cenas aqui quando criares */}
            </div>
        </div>
    );
};

export default CivilizationPath;