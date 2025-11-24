import React, { createContext, useContext, useState, useEffect } from 'react';

interface BiomeElement {
    id: string;
    type: 'grass' | 'tree' | 'flower' | 'water' | 'rock' | 'wildlife';
    position: { x: number; y: number };
    unlockedAt: number; // restoration level required
}

interface GamificationState {
    bioEnergy: number;
    restorationLevel: number; // 0-100
    currentBiome: string;
    unlockedElements: BiomeElement[];
    streak: number;
    studyHistory: string[];
    civilizationXP: number; // Total XP
    currentEra: string; // Current Era Name
    addEnergy: (amount: number) => void;
    unlockElement: (element: BiomeElement) => void;
}

const GamificationContext = createContext<GamificationState | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [bioEnergy, setBioEnergy] = useState(380); // TESTE: Começar com 380 XP para ver ChoppingWoodScene
    const [restorationLevel, setRestorationLevel] = useState(0);
    const [currentBiome, setCurrentBiome] = useState('forest');
    const [unlockedElements, setUnlockedElements] = useState<BiomeElement[]>([]);

    // Streak State
    const [streak, setStreak] = useState(0);
    const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
    const [studyHistory, setStudyHistory] = useState<string[]>([]);

    // Load state from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('omni-gamification');
        if (saved) {
            const parsed = JSON.parse(saved);
            // setBioEnergy(parsed.bioEnergy || 0); // COMENTADO PARA TESTE: Usar valor fixo 250
            setRestorationLevel(parsed.restorationLevel || 0);
            setUnlockedElements(parsed.unlockedElements || []);
            setStreak(parsed.streak || 0);
            setLastStudyDate(parsed.lastStudyDate || null);
            setStudyHistory(parsed.studyHistory || []);
        }
    }, []);

    // Save state on change
    useEffect(() => {
        localStorage.setItem('omni-gamification', JSON.stringify({
            bioEnergy,
            restorationLevel,
            unlockedElements,
            streak,
            lastStudyDate,
            studyHistory
        }));
    }, [bioEnergy, restorationLevel, unlockedElements, streak, lastStudyDate, studyHistory]);

    const checkIn = () => {
        const today = new Date().toISOString().split('T')[0];

        if (lastStudyDate === today) return; // Already checked in today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        setStreak(prev => {
            if (lastStudyDate === yesterdayStr) {
                return prev + 1; // Continue streak
            } else {
                return 1; // Reset streak (or start new)
            }
        });

        setLastStudyDate(today);
        setStudyHistory(prev => {
            if (!prev.includes(today)) {
                return [...prev, today];
            }
            return prev;
        });
    };

    const addEnergy = (amount: number) => {
        checkIn(); // Auto check-in when earning energy
        setBioEnergy(prev => {
            const newEnergy = prev + amount;
            // Calculate restoration progress based on total energy earned
            // Simple formula: every 100 energy = 1% restoration
            const newRestoration = Math.min(100, Math.floor(newEnergy / 100));
            if (newRestoration > restorationLevel) {
                setRestorationLevel(newRestoration);
            }
            return newEnergy;
        });
    };

    const unlockElement = (element: BiomeElement) => {
        setUnlockedElements(prev => [...prev, element]);
    };

    // Derived state for Era
    const getEra = (xp: number) => {
        if (xp < 500) return 'Idade da Pedra';
        if (xp < 1500) return 'Idade do Bronze';
        if (xp < 3000) return 'Idade Média';
        if (xp < 5000) return 'Era Industrial';
        return 'Futuro Solar';
    };

    return (
        <GamificationContext.Provider value={{
            bioEnergy,
            restorationLevel,
            currentBiome,
            unlockedElements,
            streak,
            studyHistory,
            civilizationXP: bioEnergy,
            currentEra: getEra(bioEnergy),
            addEnergy,
            unlockElement
        }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};
