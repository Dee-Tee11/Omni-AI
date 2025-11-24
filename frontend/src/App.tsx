import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { FlashcardViewer } from './components/Flashcard/FlashcardViewer';
import { QuizView } from './components/Quiz/QuizView';
import MyClasses from './components/MyClasses';
import { SummariesView } from './components/Summaries/SummariesView';
import Sidebar from './components/SideBar/Sidebar';
import { GamificationProvider } from './context/GamificationContext';
import './index.css';

const App: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarMini, setSidebarMini] = useState(false);

    return (
        <GamificationProvider>
            <Router>
                <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
                    {/* Desktop Sidebar */}
                    <Sidebar
                        onUploadClick={() => { }}
                        isOpen={sidebarOpen}
                        isMini={sidebarMini}
                        onClose={() => setSidebarOpen(false)}
                        onToggleMini={() => setSidebarMini(!sidebarMini)}
                    />

                    {/* Main Content Area */}
                    <main className={`w-full pb-24 md:pb-8 transition-all duration-300 ${sidebarOpen
                        ? sidebarMini
                            ? 'md:pl-20'
                            : 'md:pl-[280px]'
                        : 'flex items-center justify-center'
                        }`}>
                        {/* Hamburger Toggle Button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors hidden md:flex items-center justify-center"
                            aria-label="Toggle Sidebar"
                        >
                            {sidebarOpen ? <X size={24} className="text-gray-700" /> : <Menu size={24} className="text-gray-700" />}
                        </button>

                        <div className={`${!sidebarOpen ? 'max-w-7xl mx-auto px-4' : 'w-full'}`}>
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

                    {/* Mobile Navigation - Commented out as it is missing */}
                    {/* <MobileNav onUploadClick={() => { }} /> */}
                </div>
            </Router>
        </GamificationProvider>
    );
}

export default App;
