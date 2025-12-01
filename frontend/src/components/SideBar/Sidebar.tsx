import React from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import {
    Home,
    BookOpen,
    Trophy,
    Backpack,
    Zap,
    Sparkles,
    Settings,
    ChevronLeft,
    ChevronRight,
    Brain,
    Target,
    FileText
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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
    const { user } = useUser();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className={`sidebar ${isOpen ? '' : '-translate-x-full'} ${isMini ? 'sidebar-mini' : ''} hidden md:flex`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    {!isMini && (
                        <>
                            <span className="text-[var(--color-primary)]">Lexis</span>
                        </>
                    )}
                    {isMini && <span className="text-[var(--color-primary)] text-2xl font-bold">L</span>}
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




            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">
                        <UserButton />
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.fullName || user?.firstName || 'User'}</span>
                    </div>
                    <Settings size={16} className="ml-auto text-gray-400" />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
