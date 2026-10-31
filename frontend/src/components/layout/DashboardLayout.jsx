import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { QuickInspectionModal } from './QuickInspectionModal';
import { GlobalSearchModal } from './GlobalSearchModal';
import { AICopilotDrawer } from '../ai-copilot/AICopilotDrawer';
import { infrastructureService } from '../../services/infrastructureService';

export const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isQuickInspectionOpen, setIsQuickInspectionOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [infrastructures, setInfrastructures] = useState([]);
  const location = useLocation();

  useEffect(() => {
    infrastructureService.getAll().then((data) => {
      setInfrastructures(data || []);
    });
  }, []);

  // Keyboard shortcut Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-navy-900 bg-tech-grid flex">
      {/* Collapsible Left Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Topbar
          onOpenQuickInspection={() => setIsQuickInspectionOpen(true)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet context={{ infrastructures }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating AI Structural Copilot Trigger */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="relative group p-3.5 rounded-2xl bg-gradient-to-br from-cyan via-cyan-500 to-blue-600 text-navy-950 font-bold shadow-cyan-glow-lg hover:shadow-cyan-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          title="Open AI Structural Copilot"
        >
          <Bot className="w-6 h-6 text-navy-950" />
          <span className="hidden md:inline font-mono text-xs font-black tracking-wide pr-1">
            COPILOT
          </span>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-healthy animate-ping" />
        </button>
      </div>

      {/* Modals & Drawers */}
      <QuickInspectionModal
        isOpen={isQuickInspectionOpen}
        onClose={() => setIsQuickInspectionOpen(false)}
        infrastructures={infrastructures}
      />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        infrastructures={infrastructures}
      />

      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        infrastructures={infrastructures}
      />
    </div>
  );
};
