import React, { useState } from 'react';
import { Brain, Target, FileText } from 'lucide-react';
import { FlashcardQuickView } from './FlashcardQuickView';
import { QuizView } from './QuizView';
import { SummaryView } from './SummaryView';
import './StudyTabs.css';

interface StudyTabsProps {
    documentId: string;
    onOpenFlashcardModal?: () => void;
}

type TabType = 'flashcards' | 'quiz' | 'summary';

export const StudyTabs: React.FC<StudyTabsProps> = ({ documentId, onOpenFlashcardModal }) => {
    const [activeTab, setActiveTab] = useState<TabType>('flashcards');

    const tabs = [
        { id: 'flashcards' as TabType, label: 'Flashcards', icon: Brain },
        { id: 'quiz' as TabType, label: 'Quiz', icon: Target },
        { id: 'summary' as TabType, label: 'Resumo', icon: FileText },
    ];

    return (
        <div className="study-tabs-container">
            {/* Tab Headers */}
            <div className="tab-headers">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`tab-header ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'flashcards' && (
                    <FlashcardQuickView
                        documentId={documentId}
                        onOpenFullView={onOpenFlashcardModal}
                    />
                )}
                {activeTab === 'quiz' && <QuizView documentId={documentId} />}
                {activeTab === 'summary' && <SummaryView documentId={documentId} />}
            </div>
        </div>
    );
};
