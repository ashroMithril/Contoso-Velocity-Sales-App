import React from 'react';
import { LayoutGrid, BarChart2, History, Settings, Bot, Layers } from 'lucide-react';
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
      className={`p-3 rounded-xl mb-4 transition-all duration-300 group relative flex justify-center w-10 h-10 items-center ${
        currentView === mode 
          ? 'bg-black text-white shadow-lg scale-105' 
          : 'text-gray-400 hover:bg-gray-100 hover:text-black'
      }`}
    >
      <Icon className="w-5 h-5" strokeWidth={currentView === mode ? 2.5 : 2} />
      <span className="absolute left-14 bg-black text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md">
        {label}
      </span>
    </button>
  );

  return (
    <div className="w-20 bg-white border-r border-gray-100 flex flex-col items-center py-6 z-20 shrink-0 h-full">
      <div className="mb-10">
        <button 
            onClick={onToggleCopilot}
            className="w-10 h-10 bg-black rounded-xl grid place-items-center shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Toggle Copilot"
        >
             <Bot className="w-5 h-5 text-white" />
        </button>
      </div>

      <nav className="flex-1 w-full px-2 flex flex-col items-center">
        <NavItem mode={WorkspaceMode.DASHBOARD} icon={LayoutGrid} label="Workspace" />
        <NavItem mode={WorkspaceMode.ARTIFACTS} icon={Layers} label="Artifacts" />
        <NavItem mode={WorkspaceMode.HISTORY} icon={History} label="History" />
        <button
            onClick={() => {}} 
            className="p-3 rounded-xl mb-4 text-gray-400 hover:bg-gray-100 hover:text-black transition-all flex justify-center w-10 h-10 items-center"
        >
            <BarChart2 className="w-5 h-5" strokeWidth={2} />
        </button>
      </nav>

      <div className="mt-auto px-2 flex flex-col items-center gap-4">
         <button className="p-2 text-gray-400 hover:text-black transition-colors">
             <Settings className="w-5 h-5" />
         </button>
         <div className="mb-4 w-8 h-8 bg-gray-100 text-gray-900 rounded-full grid place-items-center text-xs font-bold border border-gray-200">
            JD
         </div>
      </div>
    </div>
  );
};

export default Navigation;