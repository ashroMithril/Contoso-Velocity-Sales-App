
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import CopilotPanel from './components/CopilotPanel';
import ArtifactViewer from './components/ArtifactViewer';
import Analytics from './components/Analytics';
import HistoryView from './components/HistoryView';
import CalendarView from './components/CalendarView';
import RepositoryView from './components/RepositoryView';
import CopilotPage from './components/CopilotPage';
import { WorkspaceMode, Lead, ArtifactData, CalendarEvent } from './types';
import { ChevronLeft } from 'lucide-react';
import { VelocityLogo } from './components/VelocityLogo';
import { createArtifact } from './services/artifactService';
import { getLeads } from './services/dataService';

const App: React.FC = () => {
  const [mode, setMode] = useState<WorkspaceMode>(WorkspaceMode.DASHBOARD);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Controls which artifact to show in viewer (null = List View)
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleRunAction = (prompt: string, leadContext?: Lead) => {
    setPendingPrompt(prompt);
    if (leadContext) {
        setSelectedLead(leadContext);
    }
    setIsCopilotOpen(true);
  };

  // NEW: Handle Calendar Event Click
  const handleEventClick = (event: CalendarEvent) => {
      // 1. Try to find associated lead
      let associatedLead = null;
      if (event.leadId) {
          const leads = getLeads();
          associatedLead = leads.find(l => l.id === event.leadId) || null;
      }
      if (associatedLead) setSelectedLead(associatedLead);

      // 2. Construct context-aware prompt
      let prompt = `I see you selected the event "${event.title}".`;
      
      if (event.type === 'meeting') {
          prompt = `Prepare a meeting brief for the "${event.title}" on ${new Date(event.date).toLocaleDateString()}.`;
          if (associatedLead) prompt += ` It is with ${associatedLead.companyName}.`;
      } else if (event.type === 'deadline') {
           prompt = `Draft a renewal proposal for "${event.companyName || event.title}" before the deadline on ${new Date(event.date).toLocaleDateString()}.`;
      } else {
          prompt = `Help me prepare for "${event.title}".`;
      }

      setPendingPrompt(prompt);
      setIsCopilotOpen(true);
  };

  const handleArtifactGenerated = (data: ArtifactData) => {
    // 1. Persist the new artifact using the service
    const newArtifact = createArtifact(data, { 
        companyName: selectedLead?.companyName || 'New Client', 
        type: 'Generic' // Type inference happens inside createArtifact based on mapping usually, or passed explicitly if we had it
    });
    
    // 2. Set as active
    setActiveArtifactId(newArtifact.id);
    
    // 3. Switch view
    setMode(WorkspaceMode.ARTIFACTS);
    
    // 4. UX refinement for mobile
    if (window.innerWidth < 768) {
        setIsCopilotOpen(false);
    }
  };

  const renderCanvas = () => {
    switch (mode) {
      case WorkspaceMode.COPILOT:
        return <CopilotPage activeLead={selectedLead} />;
      case WorkspaceMode.DASHBOARD:
        return <Dashboard onSelectLead={handleSelectLead} onRunAction={handleRunAction} />;
      case WorkspaceMode.CALENDAR:
        return <CalendarView onEventClick={handleEventClick} />;
      case WorkspaceMode.ARTIFACTS:
        return (
            <ArtifactViewer 
                initialArtifactId={activeArtifactId} 
                onBackToDashboard={() => setMode(WorkspaceMode.DASHBOARD)}
                onRefine={async (sel, inst) => {
                     // The Viewer handles the API call internally via direct import now.
                     return null; 
                }}
            />
        );
      case WorkspaceMode.REPOSITORY:
        return <RepositoryView />;
      case WorkspaceMode.HISTORY:
        return <HistoryView />;
      default: 
        return <Analytics />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans text-slate-900 relative">
      <Navigation 
        currentView={mode} 
        onNavigate={(m) => { 
            setMode(m); 
            setActiveArtifactId(null);
            // If navigating to full screen copilot, close the side panel to avoid duplication
            if (m === WorkspaceMode.COPILOT) {
                setIsCopilotOpen(false);
            }
        }} 
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
      />

      <main className="flex-1 flex flex-col min-w-0 relative z-0 overflow-hidden bg-white mb-16 md:mb-0">
        {renderCanvas()}
      </main>

      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 ${isCopilotOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <CopilotPanel 
            activeLead={selectedLead}
            onArtifactGenerated={handleArtifactGenerated}
            externalPrompt={pendingPrompt}
            onPromptHandled={() => setPendingPrompt(undefined)}
            onClose={() => setIsCopilotOpen(false)}
         />
      </div>

      {!isCopilotOpen && mode !== WorkspaceMode.COPILOT && (
          <button 
            onClick={() => setIsCopilotOpen(true)}
            className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-l-lg shadow-lg hover:bg-gray-800 transition-all z-40 flex-col items-center gap-2 group"
          >
              <VelocityLogo className="w-6 h-6" />
              <div className="writing-vertical-lr text-[10px] font-bold tracking-widest uppercase transform rotate-180 py-2">Copilot</div>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
      )}

      {isCopilotOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 md:bg-black/5 md:backdrop-blur-[1px]" onClick={() => setIsCopilotOpen(false)} />}
    </div>
  );
};

export default App;