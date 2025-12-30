import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import CopilotPanel from './components/CopilotPanel';
import ArtifactViewer from './components/ArtifactViewer';
import Analytics from './components/Analytics';
import HistoryView from './components/HistoryView';
import { WorkspaceMode, Lead, ArtifactData } from './types';
import { ChevronLeft, Bot } from 'lucide-react';
import { copilotService } from './services/geminiService';

const App: React.FC = () => {
  // State for the Central Workspace
  const [mode, setMode] = useState<WorkspaceMode>(WorkspaceMode.DASHBOARD);
  
  // Data State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [currentArtifact, setCurrentArtifact] = useState<ArtifactData | null>(null);
  
  // Copilot State
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);

  // Handlers
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    // Maybe show details sidebar or just set context
  };

  const handleRunAction = (prompt: string, leadContext?: Lead) => {
    setPendingPrompt(prompt);
    if (leadContext) {
        setSelectedLead(leadContext);
    }
    setIsCopilotOpen(true);
  };

  const handleArtifactGenerated = (data: ArtifactData) => {
    setCurrentArtifact(data);
    setMode(WorkspaceMode.ARTIFACTS);
    // NOTE: We do NOT close copilot here anymore, allowing user to continue chatting
  };

  const handleRefineArtifact = async (selectedText: string, instruction: string): Promise<ArtifactData | null> => {
      if (!currentArtifact) return null;
      
      const updatedDoc = await copilotService.refineArtifact(
          currentArtifact.documentContent, 
          selectedText, 
          instruction
      );

      const newData = { ...currentArtifact, documentContent: updatedDoc };
      setCurrentArtifact(newData);
      return newData;
  };

  const renderCanvas = () => {
    switch (mode) {
      case WorkspaceMode.DASHBOARD:
        return (
          <Dashboard 
            onSelectLead={handleSelectLead} 
            onRunAction={handleRunAction} 
          />
        );
      case WorkspaceMode.ARTIFACTS:
        return currentArtifact ? (
          <ArtifactViewer 
            data={currentArtifact} 
            onBack={() => setMode(WorkspaceMode.DASHBOARD)}
            onRefine={handleRefineArtifact}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">No content generated.</div>
        );
      case WorkspaceMode.HISTORY:
        return <HistoryView />;
      default: 
        return <Analytics />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans text-slate-900 relative">
      
      {/* 1. Left Rail: Navigation */}
      <Navigation 
        currentView={mode} 
        onNavigate={(m) => setMode(m)} 
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
      />

      {/* 2. Middle Rail: Main Canvas */}
      <main className="flex-1 flex flex-col min-w-0 relative z-0 overflow-hidden bg-white">
        {renderCanvas()}
      </main>

      {/* 3. Copilot Overlay Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 ${
            isCopilotOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
         <CopilotPanel 
            activeLead={selectedLead}
            onArtifactGenerated={handleArtifactGenerated}
            externalPrompt={pendingPrompt}
            onPromptHandled={() => setPendingPrompt(undefined)}
            onClose={() => setIsCopilotOpen(false)}
         />
      </div>

      {/* 4. Vertical Toggle Tab (Visible when closed) */}
      {!isCopilotOpen && (
          <button 
            onClick={() => setIsCopilotOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-l-lg shadow-lg hover:bg-gray-800 transition-all z-40 flex flex-col items-center gap-2 group"
          >
              <Bot className="w-5 h-5" />
              <div className="writing-vertical-lr text-[10px] font-bold tracking-widest uppercase transform rotate-180 py-2">
                  Copilot
              </div>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
      )}

      {/* Overlay Backdrop */}
      {isCopilotOpen && (
          <div 
            className="fixed inset-0 bg-black/5 backdrop-blur-[1px] z-40" 
            onClick={() => setIsCopilotOpen(false)}
          />
      )}

    </div>
  );
};

export default App;