import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { FlashcardViewer } from './components/Flashcard/FlashcardViewer';
import { QuizView } from './components/Quiz/QuizView';
import MyClasses from './components/MyClasses';
import { SummariesView } from './components/Summaries/SummariesView';
import Sidebar from './components/SideBar/Sidebar';
import { setAuthToken } from './services/api';
import './index.css';

const AppContent: React.FC = () => {
    const { getToken } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarMini, setSidebarMini] = useState(false);

    // Initialize auth token for API requests
    useEffect(() => {
        setAuthToken(getToken);
    }, [getToken]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Desktop Sidebar */}
            <Sidebar
                onUploadClick={() => { }}
                isOpen={sidebarOpen}
                isMini={sidebarMini}
                onClose={() => setSidebarOpen(false)}
                onToggleMini={() => setSidebarMini(!sidebarMini)}
            />

            {/* Hamburger Toggle Button - Only show when sidebar is closed */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors hidden md:flex items-center justify-center"
                    aria-label="Open Sidebar"
                >
                    <Menu size={24} className="text-gray-700" />
                </button>
            )}

            {/* Main Content Area */}
            <main className={`main-content ${sidebarOpen
                ? sidebarMini
                    ? 'sidebar-mini-open'
                    : 'sidebar-full-open'
                : 'sidebar-closed'
                }`}>
                <div className="w-full px-4">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/library" element={<div className="p-8">Library (Coming Soon)</div>} />
                        <Route path="/classes" element={<MyClasses />} />
                        <Route path="/flashcards" element={<FlashcardViewer />} />
                        <Route path="/quiz" element={<QuizView />} />
                        <Route path="/summaries" element={<SummariesView />} />
                        <Route path="/stats" element={<div className="p-8">Stats (Coming Soon)</div>} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
            <SignedIn>
                <AppContent />
            </SignedIn>
        </Router>
    );
};

export default App;
