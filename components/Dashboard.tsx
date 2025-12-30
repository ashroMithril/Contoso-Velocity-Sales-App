import React, { useEffect, useState } from 'react';
import { Lead } from '../types';
import { getLeads } from '../services/dataService';
import { 
    Sparkles, 
    ArrowRight, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    AlertTriangle, 
    Info, 
    Building2,
    Zap,
    MessageSquare,
    Search,
    FileText,
    Mail,
    Shield,
    X
} from 'lucide-react';

interface DashboardProps {
  onSelectLead: (lead: Lead) => void;
  onRunAction: (prompt: string, leadContext?: Lead) => void;
}

type DrilldownView = 'ACCOUNTS' | 'MEETINGS' | 'ACTIONS' | null;

const Dashboard: React.FC<DashboardProps> = ({ onSelectLead, onRunAction }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [wayfinderInput, setWayfinderInput] = useState('');
  const [drilldownView, setDrilldownView] = useState<DrilldownView>(null);

  useEffect(() => {
    setLeads(getLeads());
  }, []);

  const handleWayfinderSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(wayfinderInput.trim()) {
          onRunAction(wayfinderInput);
          setWayfinderInput('');
      }
  };

  const getSignalIcon = (type: string) => {
      switch(type) {
          case 'positive': return <CheckCircle2 className="w-3.5 h-3.5 text-gray-900" />;
          case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />;
          default: return <Info className="w-3.5 h-3.5 text-gray-400" />;
      }
  };

  const quickActions = [
      { label: "Daily Brief", icon: FileText, prompt: "Draft daily briefing" },
      { label: "Inbox Audit", icon: Mail, prompt: "Summarize recent emails" },
      { label: "Stakeholders", icon: UsersIcon, prompt: "Find key stakeholders for my top accounts" },
      { label: "Compliance", icon: Shield, prompt: "Check compliance status for all active deals" },
      { label: "Pricing", icon: DollarIcon, prompt: "Generate pricing comparison for new products" },
  ];

  // --- Drilldown Renderers ---

  const renderAccountsTable = () => (
      <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                      <th className="px-6 py-4 font-semibold text-gray-900">Company</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Contact</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Value</th>
                      <th className="px-6 py-4 font-semibold text-gray-900 text-right">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{lead.companyName}</div>
                              <div className="text-xs text-gray-500">{lead.industry}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{lead.contactName}</td>
                          <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                  {lead.status}
                              </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-600">${lead.estimatedValue.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                              <button onClick={() => { setDrilldownView(null); onSelectLead(lead); }} className="text-indigo-600 hover:text-indigo-900 font-medium text-xs">View</button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  );

  const renderCalendarList = () => {
      const meetings = leads.filter(l => l.meetingTime);
      return (
          <div className="space-y-4">
              {meetings.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">No upcoming meetings scheduled.</div>
              ) : (
                  meetings.map(lead => (
                      <div key={lead.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors bg-white">
                          <div className="flex-shrink-0 w-16 text-center bg-gray-50 rounded-lg p-2 border border-gray-200">
                              <div className="text-xs font-bold text-gray-400 uppercase">{lead.meetingTime?.split(',')[0]}</div>
                              <div className="text-sm font-bold text-gray-900 mt-1">{lead.meetingTime?.split(',')[1].replace(' ', '')}</div>
                          </div>
                          <div className="flex-1">
                              <h4 className="font-bold text-gray-900">{lead.companyName}</h4>
                              <p className="text-sm text-gray-500 mt-0.5">Sync regarding {lead.needs[0]}</p>
                              <div className="mt-3 flex gap-2">
                                  <button 
                                    onClick={() => { setDrilldownView(null); onRunAction(`Prepare meeting brief for ${lead.companyName}`, lead); }}
                                    className="text-xs bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
                                  >
                                      Prep Brief
                                  </button>
                                  <button 
                                    onClick={() => { setDrilldownView(null); onRunAction(`Reschedule meeting with ${lead.companyName}`, lead); }}
                                    className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                                  >
                                      Reschedule
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      );
  };

  const renderActionsList = () => {
      const actions = leads.filter(l => l.suggestedAction);
      return (
          <div className="space-y-3">
              {actions.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Zap className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                              <div className="text-sm font-semibold text-gray-900">{lead.suggestedAction}</div>
                              <div className="text-xs text-gray-500">For <span className="font-medium text-gray-700">{lead.companyName}</span></div>
                          </div>
                      </div>
                      <button 
                        onClick={() => { setDrilldownView(null); onRunAction(lead.suggestedAction || '', lead); }}
                        className="flex-shrink-0 bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                        title="Execute Action in Copilot"
                      >
                          <ArrowRight className="w-4 h-4" />
                      </button>
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      
      {/* 1. STICKY AI WAYFINDER HEADER (Minimalist) */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 px-8 py-6">
          <div className="max-w-6xl mx-auto space-y-4">
              {/* Input Row */}
              <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 flex items-center gap-3">
                      <div className="w-8 h-8 bg-black text-white rounded-md flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-lg tracking-tight text-gray-900">Wayfinder</span>
                  </div>
                  
                  <div className="flex-1 relative group">
                     <form onSubmit={handleWayfinderSubmit}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                        <input 
                            type="text" 
                            value={wayfinderInput}
                            onChange={(e) => setWayfinderInput(e.target.value)}
                            placeholder="Ask Copilot to analyze, draft, or research..."
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-black focus:ring-0 rounded-lg py-3 pl-10 pr-4 text-sm transition-all outline-none placeholder-gray-400"
                        />
                     </form>
                  </div>
              </div>

              {/* Quick Actions Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar ml-12">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-2 shrink-0">Quick Actions</span>
                  {quickActions.map((action, idx) => (
                      <button 
                        key={idx}
                        onClick={() => onRunAction(action.prompt)}
                        className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-black hover:bg-gray-50 rounded-full text-xs font-medium text-gray-600 hover:text-black transition-all"
                      >
                          <action.icon className="w-3 h-3" />
                          {action.label}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-10">

              {/* KPI Stats (Black & White) - INTERACTIVE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-100 rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-100 bg-white">
                  
                  {/* Active Accounts Card */}
                  <div 
                    onClick={() => setDrilldownView('ACCOUNTS')}
                    className="p-8 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 text-gray-400">
                            <Building2 className="w-4 h-4 group-hover:text-black transition-colors" />
                            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-black transition-colors">Active Accounts</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                      <div className="text-3xl font-light text-gray-900">{leads.length}</div>
                  </div>

                  {/* Upcoming Meetings Card */}
                  <div 
                    onClick={() => setDrilldownView('MEETINGS')}
                    className="p-8 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 text-gray-400">
                            <Calendar className="w-4 h-4 group-hover:text-black transition-colors" />
                            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-black transition-colors">Upcoming Meetings</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                      <div className="text-3xl font-light text-gray-900">{leads.filter(l => l.meetingTime).length}</div>
                  </div>

                  {/* Pending Actions Card */}
                  <div 
                    onClick={() => setDrilldownView('ACTIONS')}
                    className="p-8 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 text-gray-400">
                            <Clock className="w-4 h-4 group-hover:text-black transition-colors" />
                            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-black transition-colors">Pending Actions</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                      <div className="text-3xl font-light text-gray-900">{leads.filter(l => l.suggestedAction).length}</div>
                  </div>

              </div>

              {/* Context Banner (Monochrome) */}
              <div className="bg-black text-white rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                  <div className="flex gap-4 items-center">
                      <div className="p-3 bg-white/10 rounded-full">
                          <Info className="w-5 h-5 text-white" />
                      </div>
                      <div>
                          <h3 className="font-semibold text-base">Preparation needed for TechStart Inc</h3>
                          <p className="text-gray-400 font-light text-sm">
                              Meeting Thursday at 11:00 AM. New Q4 earnings data available.
                          </p>
                      </div>
                  </div>
                  <button 
                    onClick={() => {
                        const lead = leads.find(l => l.companyName === 'TechStart Inc');
                        onRunAction("Prepare demo brief for TechStart Inc meeting on Thursday", lead);
                    }}
                    className="bg-white text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap w-full md:w-auto text-center"
                  >
                      Generate Brief
                  </button>
              </div>

              {/* Accounts Feed */}
              <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                      <Zap className="w-4 h-4 text-black" />
                      <span className="text-xs font-bold uppercase tracking-widest text-black">Priority Accounts</span>
                  </div>

                  {leads.map((lead) => (
                      <div key={lead.id} className="bg-white group border border-gray-200 rounded-xl hover:border-black transition-colors duration-300">
                          
                          {/* Header */}
                          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center font-bold text-sm text-gray-900">
                                      {lead.companyName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-lg text-gray-900">{lead.companyName}</h3>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                          <span>{lead.industry}</span>
                                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                          <span className="font-medium text-black">${lead.estimatedValue.toLocaleString()}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  {lead.meetingTime && (
                                     <span className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                                         <Calendar className="w-3 h-3" /> {lead.meetingTime}
                                     </span>
                                  )}
                              </div>
                          </div>

                          {/* Content Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                              {/* Left: Intelligence */}
                              <div className="p-6 border-b md:border-b-0 md:border-r border-gray-50">
                                  <div className="mb-4">
                                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                                          <Sparkles className="w-3 h-3" /> AI Summary
                                      </div>
                                      <p className="text-sm text-gray-700 leading-relaxed">
                                          {lead.aiSummary}
                                      </p>
                                  </div>
                                  <div className="space-y-2">
                                      {lead.signals?.map((signal, idx) => (
                                          <div key={idx} className="flex items-start gap-2 text-xs text-gray-500">
                                              <div className="mt-0.5">{getSignalIcon(signal.type)}</div>
                                              <span>{signal.text}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              {/* Right: Action */}
                              <div className="p-6 bg-gray-50/30 flex flex-col justify-center">
                                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                      Suggested Action
                                  </div>
                                  <button 
                                      onClick={() => onRunAction(lead.suggestedAction || `Analyze ${lead.companyName}`, lead)}
                                      className="w-full text-left bg-white border border-gray-200 hover:border-black hover:shadow-lg p-4 rounded-lg transition-all group/btn mb-3"
                                  >
                                      <div className="flex justify-between items-center">
                                          <span className="font-semibold text-sm text-gray-900">{lead.suggestedAction}</span>
                                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover/btn:text-black transition-colors" />
                                      </div>
                                  </button>
                                  <div className="flex gap-2">
                                      <button onClick={() => onRunAction(`Research ${lead.companyName}`, lead)} className="flex-1 py-2 text-xs font-medium text-gray-500 hover:text-black hover:bg-white border border-transparent hover:border-gray-200 rounded transition-all text-center">
                                          Research
                                      </button>
                                      <button onClick={() => onSelectLead(lead)} className="flex-1 py-2 text-xs font-medium text-gray-500 hover:text-black hover:bg-white border border-transparent hover:border-gray-200 rounded transition-all text-center">
                                          Details
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Drilldown Modal Overlay */}
      {drilldownView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <h3 className="text-lg font-bold text-gray-900">
                          {drilldownView === 'ACCOUNTS' && 'Active Accounts Directory'}
                          {drilldownView === 'MEETINGS' && 'Upcoming Meetings Calendar'}
                          {drilldownView === 'ACTIONS' && 'Pending Actions Queue'}
                      </h3>
                      <button onClick={() => setDrilldownView(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                          <X className="w-5 h-5 text-gray-500" />
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      {drilldownView === 'ACCOUNTS' && renderAccountsTable()}
                      {drilldownView === 'MEETINGS' && renderCalendarList()}
                      {drilldownView === 'ACTIONS' && renderActionsList()}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

// Helper Icons
const UsersIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const DollarIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

export default Dashboard;