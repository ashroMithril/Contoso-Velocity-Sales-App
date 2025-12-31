
import React from 'react';
import { LayoutGrid, BarChart2, History, Settings, Layers, Calendar, Database } from 'lucide-react';
import { VelocityLogo } from './VelocityLogo';
import { WorkspaceMode } from '../types';

interface NavigationProps {
  currentView: WorkspaceMode;
  onNavigate: (view: WorkspaceMode) => void;
  onToggleCopilot: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, onToggleCopilot }) => {
  const NavItem = ({ mode, icon: Icon, label }: { mode: any; icon: any; label: string }) => (
    <button
      onClick={() => onNavigate(mode)}
      className={`p-3 md:rounded-xl md:mb-4 transition-all duration-300 group relative flex justify-center items-center md:w-11 md:h-11 ${
        currentView === mode 
          ? 'text-black md:bg-black md:text-white md:shadow-lg md:ring-2 md:ring-black md:ring-offset-2' 
          : 'text-gray-400 hover:text-black md:hover:bg-gray-100'
      }`}
    >
      <Icon className="w-6 h-6 md:w-5 md:h-5" strokeWidth={currentView === mode ? 2.5 : 2} />
      {/* Tooltip for Desktop */}
      <span className="hidden md:block absolute left-16 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl border border-gray-700 -translate-x-2 group-hover:translate-x-0">
        {label}
        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-b border-gray-700"></div>
      </span>
      {/* Label for Mobile (Optional, currently icon only for cleaner look) */}
    </button>
  );

  return (
    <>
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:flex w-[88px] bg-white border-r border-gray-200 flex-col items-center py-6 z-20 shrink-0 h-full shadow-[5px_0_20px_rgba(0,0,0,0.01)]">
            <div className="mb-10">
                <button 
                    onClick={() => onNavigate(WorkspaceMode.COPILOT)}
                    className={`w-11 h-11 rounded-xl grid place-items-center shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 group relative ${
                        currentView === WorkspaceMode.COPILOT 
                        ? 'bg-black text-white ring-2 ring-black ring-offset-2' 
                        : 'bg-indigo-600 text-white hover:shadow-indigo-500/30'
                    }`}
                    title="Open Full Screen Copilot"
                >
                    <VelocityLogo className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 w-full px-2 flex flex-col items-center gap-1">
                <NavItem mode={WorkspaceMode.DASHBOARD} icon={LayoutGrid} label="Workspace" />
                <NavItem mode={WorkspaceMode.CALENDAR} icon={Calendar} label="Calendar" />
                <NavItem mode={WorkspaceMode.ARTIFACTS} icon={Layers} label="Artifacts" />
                <NavItem mode={WorkspaceMode.REPOSITORY} icon={Database} label="Knowledge Base" />
                <NavItem mode={WorkspaceMode.HISTORY} icon={History} label="History" />
                <button className="p-3 rounded-xl mb-4 text-gray-400 hover:bg-gray-100 hover:text-black transition-all flex justify-center w-11 h-11 items-center hover:shadow-sm">
                    <BarChart2 className="w-5 h-5" strokeWidth={2} />
                </button>
            </nav>

            <div className="mt-auto px-2 flex flex-col items-center gap-5">
                <button className="p-2 text-gray-400 hover:text-black transition-colors hover:bg-gray-50 rounded-lg">
                    <Settings className="w-5 h-5" />
                </button>
                <div className="mb-4 w-9 h-9 bg-gray-100 text-gray-900 rounded-full grid place-items-center text-xs font-bold border border-gray-200 ring-2 ring-white shadow-sm">
                    JD
                </div>
            </div>
        </div>

        {/* MOBILE BOTTOM BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex items-center justify-around pb-safe pt-3 pb-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
             <NavItem mode={WorkspaceMode.DASHBOARD} icon={LayoutGrid} label="Home" />
             <NavItem mode={WorkspaceMode.CALENDAR} icon={Calendar} label="Calendar" />
             
             {/* Mobile Copilot Trigger - Keeps toggle functionality for overlay on mobile */}
             <button 
                onClick={onToggleCopilot}
                className="w-12 h-12 bg-black rounded-full grid place-items-center shadow-lg text-white -mt-8 border-4 border-white"
            >
                <VelocityLogo className="w-6 h-6" />
            </button>

             <NavItem mode={WorkspaceMode.ARTIFACTS} icon={Layers} label="Artifacts" />
             <NavItem mode={WorkspaceMode.REPOSITORY} icon={Database} label="KB" />
        </div>
    </>
  );
};

export default Navigation;