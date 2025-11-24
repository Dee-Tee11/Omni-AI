import React from 'react';
import {
    Home,
    BookOpen,
    Trophy,
    Backpack,
    Zap,
    Flame,
    Sparkles,
    Settings,
    ChevronLeft,
    ChevronRight,
    Brain,
    Target,
    FileText
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useGamification } from '../../context/GamificationContext';
import './Sidebar.css';

interface SidebarProps {
    onUploadClick: () => void;
    isOpen: boolean;
    isMini: boolean;
    onClose: () => void;
    onToggleMini: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onUploadClick, isOpen, isMini, onClose, onToggleMini }) => {
    const location = useLocation();
    const { streak } = useGamification();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className={`sidebar ${isOpen ? '' : '-translate-x-full'} ${isMini ? 'sidebar-mini' : ''} hidden md:flex`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    {!isMini && (
                        <>
                            <span className="text-emerald-600">Omni</span>
                            <span className="text-gray-800">AI</span>
                        </>
                    )}
                    {isMini && <span className="text-emerald-600 text-2xl font-bold">O</span>}
                </div>

                {/* Collapse Arrow Button */}
                <button
                    onClick={onToggleMini}
                    className="collapse-btn"
                    title={isMini ? "Expandir sidebar" : "Minimizar sidebar"}
                >
                    {isMini ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {!isMini && (
                <button onClick={onUploadClick} className="generate-btn">
                    <Sparkles size={18} />
                    Gerar novas perguntas
                </button>
            )}

            {isMini && (
                <button onClick={onUploadClick} className="generate-btn-mini" title="Gerar novas perguntas">
                    <Sparkles size={20} />
                </button>
            )}

            <nav className="nav-menu">
                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} title={isMini ? "Página inicial" : ""}>
                    <Home />
                    {!isMini && "Página inicial"}
                </Link>

                <Link to="/classes" className={`nav-link ${isActive('/classes') ? 'active' : ''}`} title={isMini ? "Minhas aulas" : ""}>
                    <BookOpen />
                    {!isMini && "Minhas aulas"}
                </Link>

                <Link to="/flashcards" className={`nav-link ${isActive('/flashcards') ? 'active' : ''}`} title={isMini ? "Flashcards" : ""}>
                    <Brain />
                    {!isMini && "Flashcards"}
                </Link>

                <Link to="/quiz" className={`nav-link ${isActive('/quiz') ? 'active' : ''}`} title={isMini ? "Quiz" : ""}>
                    <Target />
                    {!isMini && "Quiz"}
                </Link>

                <Link to="/summaries" className={`nav-link ${isActive('/summaries') ? 'active' : ''}`} title={isMini ? "Resumos" : ""}>
                    <FileText />
                    {!isMini && "Resumos"}
                </Link>

                <Link to="/stats" className={`nav-link ${isActive('/stats') ? 'active' : ''}`} title={isMini ? "Placar" : ""}>
                    <Trophy />
                    {!isMini && "Placar"}
                </Link>

                <Link to="/inventory" className={`nav-link ${isActive('/inventory') ? 'active' : ''}`} title={isMini ? "Mochila" : ""}>
                    <Backpack />
                    {!isMini && "Mochila"}
                </Link>

                <Link to="/updates" className={`nav-link ${isActive('/updates') ? 'active' : ''}`} title={isMini ? "Atualizar" : ""}>
                    <Zap />
                    {!isMini && "Atualizar"}
                </Link>

                {!isMini && (
                    <div className="streak-widget">
                        <Flame className="streak-fire" size={20} fill="currentColor" />
                        <span>{streak} sequência de dias</span>
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">🦁</div>
                    <div className="user-info">
                        <span className="user-name">Explorador</span>
                    </div>
                    <Settings size={16} className="ml-auto text-gray-400" />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
