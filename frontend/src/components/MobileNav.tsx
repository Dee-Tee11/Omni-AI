import React from 'react';
import { Home, BookOpen, Sparkles, Trophy, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './MobileNav.css';

interface MobileNavProps {
    onUploadClick: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ onUploadClick }) => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="mobile-nav md:hidden">
            <div className="mobile-nav-content">
                <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                    <Home size={24} />
                    {isActive('/') && <motion.div layoutId="nav-dot" className="nav-dot" />}
                </Link>

                <Link to="/library" className={`nav-item ${isActive('/library') ? 'active' : ''}`}>
                    <BookOpen size={24} />
                    {isActive('/library') && <motion.div layoutId="nav-dot" className="nav-dot" />}
                </Link>

                <button
                    onClick={onUploadClick}
                    className="fab-button"
                >
                    <Sparkles size={28} />
                </button>

                <Link to="/stats" className={`nav-item ${isActive('/stats') ? 'active' : ''}`}>
                    <Trophy size={24} />
                    {isActive('/stats') && <motion.div layoutId="nav-dot" className="nav-dot" />}
                </Link>

                <button className="nav-item">
                    <Menu size={24} />
                </button>
            </div>
        </div>
    );
};

export default MobileNav;
