import React from 'react';
import { Brain, Target, MessageSquare } from 'lucide-react';
import './StudyTabs.css';

export type TabType = 'chat' | 'flashcards' | 'quiz';

interface StudyTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const StudyTabs: React.FC<StudyTabsProps> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'chat' as TabType, label: 'Chat', icon: MessageSquare },
        { id: 'flashcards' as TabType, label: 'Flashcards', icon: Brain },
        { id: 'quiz' as TabType, label: 'Quiz', icon: Target },
    ];

    return (
        <div className="study-tabs-container">
            <div className="tab-headers">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`tab-header ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                        >
                            <Icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

