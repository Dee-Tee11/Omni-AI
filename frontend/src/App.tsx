import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { FlashcardViewer } from './components/FlashcardViewer';
import './index.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/chat" element={<ChatInterface />} />
                <Route path="/flashcards" element={<FlashcardViewer />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
