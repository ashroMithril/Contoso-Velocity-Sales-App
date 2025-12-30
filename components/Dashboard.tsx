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
    X,
    Filter,
    TrendingUp,
    RefreshCw,
    MoreHorizontal
} from 'lucide-react';

interface DashboardProps {
  onSelectLead: (lead: Lead) => void;
  onRunAction: (prompt: string, leadContext?: Lead) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectLead, onRunAction }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [wayfinderInput, setWayfinderInput] = useState('');

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

  const quickActions = [
      { label: "Daily Brief", icon: FileText, prompt: "Draft daily briefing" },
      { label: "Deal Room", icon: MessageSquare, prompt: "Show deal room intelligence" },
      { label: "Inbox Audit", icon: Mail, prompt: "Summarize recent emails" },
      { label: "Compliance", icon: Shield, prompt: "Check compliance status for all active deals" },
  ];

  // Logic to identify risks
  const renewalRisks = leads.filter(l => l.signals?.some(s => s.type === 'warning' || s.text.toLowerCase().includes('contract') || s.text.toLowerCase().includes('expires')));
  const buyingSignals = leads.filter(l => l.signals?.some(s => s.type === 'positive' || s.text.toLowerCase().includes('budget') || s.text.toLowerCase().includes('acquisition') || s.text.toLowerCase().includes('opening')));

  const renderAccountsTable = () => (
      <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                      <th className="px-6 py-4 font-semibold text-gray-900">Company</th>
                      <th className="px-6 py-4 font-semibold text-gray-900 hidden md:table-cell">Contact</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 font-semibold text-gray-900 hidden md:table-cell">Value</th>
                      <th className="px-6 py-4 font-semibold text-gray-900 hidden lg:table-cell">Last Activity</th>
                      <th className="px-6 py-4 font-semibold text-gray-900 text-right">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {leads.map(lead => (
                      <tr key={lead.id} onClick={() => onSelectLead(lead)} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                          <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                  {lead.companyName}
                                  {lead.signals?.some(s => s.type === 'warning') && <span className="w-2 h-2 rounded-full bg-amber-500" title="Risk Detected"></span>}
                              </div>
                              <div className="text-xs text-gray-500">{lead.industry}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{lead.contactName}</td>
                          <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                  lead.status === 'Negotiation' ? 'bg-purple-100 text-purple-700' :
                                  lead.status === 'Proposal' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                              }`}>
                                  {lead.status}
                              </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-600 hidden md:table-cell">${lead.estimatedValue.toLocaleString()}</td>
                          <td className="px-6 py-4 text-gray-500 text-xs hidden lg:table-cell truncate max-w-[200px]">{lead.lastInteraction}</td>
                          <td className="px-6 py-4 text-right">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onRunAction(`Analyze ${lead.companyName}`, lead); }}
                                className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                              >
                                  <Sparkles className="w-4 h-4" />
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      
      {/* 1. STICKY AI WAYFINDER HEADER */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 px-4 md:px-8 py-4 shadow-sm transition-all">
          <div className="max-w-7xl mx-auto space-y-4">
              {/* Input Row */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  {/* Wayfinder branding removed */}
                  
                  <div className="flex-1 relative group w-full">
                     <form onSubmit={handleWayfinderSubmit} className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            value={wayfinderInput}
                            onChange={(e) => setWayfinderInput(e.target.value)}
                            placeholder="Try '@Velocity draft proposal'..."
                            className="w-full bg-white border border-gray-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 rounded-xl py-3 pl-11 pr-4 text-sm transition-all outline-none placeholder-gray-400 shadow-sm hover:border-gray-300"
                        />
                     </form>
                  </div>
              </div>

              {/* Quick Actions Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {quickActions.map((action, idx) => (
                      <button 
                        key={idx}
                        onClick={() => onRunAction(action.prompt)}
                        className="shrink-0 flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200 hover:border-indigo-600 hover:text-indigo-600 hover:shadow-sm rounded-full text-xs font-semibold text-gray-600 transition-all active:scale-95"
                      >
                          <action.icon className="w-3.5 h-3.5" />
                          {action.label}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8">

              {/* KPI Stats - CRISP CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Total Pipeline */}
                   <div className="p-5 bg-white border border-gray-200 rounded-2xl relative overflow-hidden">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                          <Building2 className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Total Pipeline</span>
                      </div>
                      <div className="text-2xl font-light text-gray-900">${leads.reduce((acc, curr) => acc + curr.estimatedValue, 0).toLocaleString()}</div>
                      <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> +12% vs last month
                      </div>
                  </div>

                  {/* Renewal Risk Alert */}
                  <div className="p-5 bg-white border border-gray-200 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-amber-300 transition-colors" onClick={() => onRunAction("Show renewal risks")}>
                      <div className="flex items-center gap-2 text-amber-600 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Renewal Risks</span>
                      </div>
                      <div className="text-2xl font-light text-gray-900">{renewalRisks.length}</div>
                      <div className="mt-2 text-xs text-gray-500">Accounts at risk</div>
                  </div>

                  {/* Buying Signals */}
                  <div className="p-5 bg-white border border-gray-200 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-green-300 transition-colors" onClick={() => onRunAction("Show buying signals")}>
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                          <Zap className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Buying Signals</span>
                      </div>
                      <div className="text-2xl font-light text-gray-900">{buyingSignals.length}</div>
                      <div className="mt-2 text-xs text-gray-500">High intent detected</div>
                  </div>

                  {/* Pending Actions Card */}
                  <div className="p-5 bg-white border border-gray-200 rounded-2xl relative overflow-hidden">
                        <div className="flex items-center gap-2.5 text-indigo-600 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Pending Actions</span>
                        </div>
                        <div className="text-2xl font-light text-gray-900">{leads.filter(l => l.suggestedAction).length}</div>
                        <div className="mt-2 text-xs text-gray-500">Tasks in queue</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. Priority Action List (Restoring "list of actions") */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Priority Action Queue
                            </h3>
                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View All</button>
                        </div>
                        <div className="divide-y divide-gray-100 flex-1">
                            {leads.filter(l => l.suggestedAction).slice(0, 5).map(lead => (
                                <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${lead.status === 'Negotiation' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{lead.suggestedAction}</p>
                                            <p className="text-xs text-gray-500">{lead.companyName} • {lead.meetingTime || 'No meeting scheduled'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onRunAction(lead.suggestedAction!, lead)} 
                                        className="text-xs font-bold text-white bg-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                                    >
                                        Execute
                                    </button>
                                </div>
                            ))}
                            {leads.filter(l => l.suggestedAction).length === 0 && (
                                <div className="p-8 text-center text-gray-400 text-sm">No pending actions. You're all caught up!</div>
                            )}
                        </div>
                    </div>

                    {/* 3. Risks & Signals Detail (The "another section") */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 bg-amber-50/30 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Risks & Signals
                            </h3>
                        </div>
                        <div className="p-2 space-y-1 flex-1 bg-gray-50/30">
                             {/* Combined list of high priority signals */}
                             {[...renewalRisks, ...buyingSignals].slice(0, 4).map(lead => (
                                 <div key={lead.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer" onClick={() => onSelectLead(lead)}>
                                     <div className="mt-1 shrink-0">
                                        {renewalRisks.includes(lead) 
                                            ? <RefreshCw className="w-4 h-4 text-amber-500" /> 
                                            : <Zap className="w-4 h-4 text-green-500" />
                                        }
                                     </div>
                                     <div>
                                         <div className="text-xs font-bold text-gray-900">{lead.companyName}</div>
                                         <div className="text-xs text-gray-600 mt-1 leading-snug">
                                             {lead.signals?.find(s => s.type === 'warning' || s.type === 'positive')?.text}
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             {[...renewalRisks, ...buyingSignals].length === 0 && (
                                 <div className="p-8 text-center text-gray-400 text-sm">No active alerts.</div>
                             )}
                        </div>
                    </div>
              </div>

              {/* 4. Total Account List (Restoring "Total account list") */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                       <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                           <Building2 className="w-5 h-5 text-gray-400" /> All Accounts
                       </h3>
                       <div className="flex gap-2">
                           <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"><Filter className="w-4 h-4" /></button>
                           <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                       </div>
                  </div>
                  {renderAccountsTable()}
              </div>

          </div>
      </div>

    </div>
  );
};

export default Dashboard;