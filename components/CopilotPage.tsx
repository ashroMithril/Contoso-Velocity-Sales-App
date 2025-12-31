
import React, { useState, useEffect, useRef } from 'react';
import { Message, Lead, ArtifactData, Reference } from '../types';
import { copilotService } from '../services/geminiService';
import { saveSession } from '../services/historyService';
import { getLeads } from '../services/dataService';
import { 
    Send, 
    Bot, 
    FileText, 
    Presentation, 
    Edit2, 
    Share2, 
    Sparkles, 
    Loader2, 
    TrendingUp, 
    ShieldAlert, 
    CheckCircle2,
    Clock,
    MessageSquare,
    AlertCircle,
    ArrowRight,
    BrainCircuit,
    ChevronDown,
    ChevronUp,
    Check,
    MessageSquarePlus,
    X,
    Eraser,
    Database,
    Mail,
    File
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CopilotPageProps {
  activeLead: Lead | null;
}

interface ProposalSuggestion {
    id: string;
    company: string;
    value: number;
    reason: string;
    prompt: string;
    trend: 'up' | 'neutral';
}

interface ApprovalItem {
    id: string;
    title: string;
    company: string;
    status: 'In Review' | 'Approved' | 'Changes Requested';
    comments: number;
    stakeholders: string[]; // Initials
    lastActivity: string;
}

// --- Enhanced Reasoning Component ---
const ReasoningDisplay: React.FC<{ steps: string[], references?: Reference[], isComplete: boolean }> = ({ steps, references, isComplete }) => {
    const [isOpen, setIsOpen] = useState(true);

    if ((!steps || steps.length === 0) && (!references || references.length === 0)) return null;

    const getRefIcon = (type: string) => {
        switch(type) {
            case 'crm': return <Database className="w-3 h-3 text-blue-500" />;
            case 'email': return <Mail className="w-3 h-3 text-green-500" />;
            case 'file': return <FileText className="w-3 h-3 text-orange-500" />;
            case 'news': return <TrendingUp className="w-3 h-3 text-purple-500" />;
            default: return <File className="w-3 h-3 text-gray-500" />;
        }
    };

    return (
        <div className="w-full max-w-[85%] mt-2 mb-4">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors mb-2 group"
            >
                <div className={`p-1 rounded-md ${isComplete ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                    <BrainCircuit className="w-3.5 h-3.5" />
                </div>
                <span>{isComplete ? 'Reasoning & Sources' : 'Thinking Process'}</span>
                {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {isOpen && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                    {/* Steps */}
                    <div className="space-y-3">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 fill-mode-forwards" style={{animationDelay: `${idx * 100}ms`}}>
                                <div className="relative flex flex-col items-center mt-0.5">
                                    {/* Line */}
                                    {idx !== steps.length - 1 && (
                                        <div className="absolute top-4 w-px h-6 bg-gray-100" />
                                    )}
                                    {/* Dot */}
                                    {idx === steps.length - 1 && !isComplete ? (
                                        <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200 shadow-sm">
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                    )}
                                </div>
                                <span className={`text-xs ${idx === steps.length - 1 && !isComplete ? 'text-indigo-700 font-medium' : 'text-gray-600'}`}>
                                    {step}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* References Section */}
                    {references && references.length > 0 && (
                        <div className="border-t border-gray-100 pt-3 mt-2">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sources Used</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {references.map((ref, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
                                        <div className="mt-0.5 p-1 bg-white rounded border border-gray-200 shadow-sm">
                                            {getRefIcon(ref.type)}
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-800">{ref.title}</div>
                                            <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">"{ref.keyPoint}"</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const CopilotPage: React.FC<CopilotPageProps> = ({ activeLead }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "I'm your Velocity Copilot. I've analyzed your pipeline and pending approvals. Where should we focus today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Dashboard State
  const [proposalSuggestions, setProposalSuggestions] = useState<ProposalSuggestion[]>([]);
  const [activeApprovals, setActiveApprovals] = useState<ApprovalItem[]>([]);
  
  // Artifact State
  const [artifacts, setArtifacts] = useState<ArtifactData | null>(null);
  const [viewMode, setViewMode] = useState<'doc' | 'ppt'>('doc');
  
  // Editor / Interaction State
  const [toolbarPosition, setToolbarPosition] = useState<{top: number, left: number} | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [editorMode, setEditorMode] = useState<'menu' | 'ai' | 'comment'>('menu');
  const [editorInput, setEditorInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [comments, setComments] = useState<{id: string, text: string, context: string}[]>([]);

  // Email/Sharing State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [shareToast, setShareToast] = useState<{show: boolean, msg: string}>({show: false, msg: ''});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Save history
  useEffect(() => {
      if (messages.length > 1) {
          saveSession(messages);
      }
  }, [messages.length]);

  // Initialize Dashboard Data
  useEffect(() => {
    // 1. Generate Proposal Suggestions (Priority)
    const leads = getLeads().filter(l => l.status === 'Contacted' || l.status === 'Negotiation');
    const suggestions: ProposalSuggestion[] = leads.slice(0, 3).map((lead, idx) => ({
        id: lead.id,
        company: lead.companyName,
        value: lead.estimatedValue,
        reason: lead.aiSummary ? "High intent signals detected" : "Deal velocity slowing",
        prompt: `Draft a proposal for ${lead.companyName}. Focus on ${lead.needs.join(', ')}.`,
        trend: idx === 0 ? 'up' : 'neutral'
    }));
    setProposalSuggestions(suggestions);

    // 2. Mock Active Approvals (Visibility requirement)
    const mockApprovals: ApprovalItem[] = [
        { 
            id: 'app-1', 
            title: 'Cloud Migration SOW', 
            company: 'Acme Corp', 
            status: 'Changes Requested', 
            comments: 4, 
            stakeholders: ['SL', 'JD'], 
            lastActivity: 'Legal Team commented 2h ago' 
        },
        { 
            id: 'app-2', 
            title: 'Renewal Agreement v2', 
            company: 'Global Bank', 
            status: 'Approved', 
            comments: 0, 
            stakeholders: ['MD'], 
            lastActivity: 'Approved by Finance 1d ago' 
        },
        { 
            id: 'app-3', 
            title: 'Q4 Licensing Pack', 
            company: 'Litware Inc', 
            status: 'In Review', 
            comments: 1, 
            stakeholders: ['AL'], 
            lastActivity: 'Sent to VP 30m ago' 
        }
    ];
    setActiveApprovals(mockApprovals);
  }, []);

  // --- EDITOR SELECTION LOGIC ---
  useEffect(() => {
      const handleSelection = () => {
          const selection = window.getSelection();
          if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

          // Check if selection is within our editor container
          if (editorContainerRef.current && selection && !selection.isCollapsed && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              // Ensure selection is inside the editor
              if (editorContainerRef.current.contains(range.commonAncestorContainer)) {
                   const rect = range.getBoundingClientRect();
                   // Calculate position relative to the viewport, but we'll render fixed to avoid overflow issues
                   setToolbarPosition({
                       top: rect.top - 60,
                       left: rect.left + (rect.width / 2)
                   });
                   setSelectedText(selection.toString());
                   setEditorMode('menu');
                   return;
              }
          }
          // Only clear if clicking outside toolbars (we handle close manually in actions)
      };

      // We attach mouseup to document to catch clicks anywhere, 
      // but logic filters for container
      document.addEventListener('mouseup', handleSelection);
      return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const handleRefineArtifact = async () => {
      if (!selectedText || !editorInput || !artifacts) return;
      
      setIsRefining(true);
      const newContent = await copilotService.refineArtifact(
          artifacts.documentContent,
          selectedText,
          editorInput
      );
      
      if (newContent) {
          setArtifacts({
              ...artifacts,
              documentContent: newContent
          });
      }
      
      setIsRefining(false);
      setToolbarPosition(null);
      setEditorInput('');
      window.getSelection()?.removeAllRanges();
  };

  const handleAddComment = () => {
      if (!selectedText || !editorInput) return;
      setComments(prev => [...prev, {
          id: Date.now().toString(),
          text: editorInput,
          context: selectedText
      }]);
      setToolbarPosition(null);
      setEditorInput('');
      window.getSelection()?.removeAllRanges();
  };

  const handleOpenEmail = async () => {
      if (!artifacts) return;
      setShowEmailModal(true);
      setIsGeneratingEmail(true);

      const mockArtifact: any = {
          title: 'Proposal Draft',
          companyName: activeLead?.companyName || 'Client',
          content: artifacts
      };

      const draft = await copilotService.generateEmailForArtifact(mockArtifact);
      setEmailDraft(draft);
      setIsGeneratingEmail(false);
  };

  const handleSendEmail = () => {
      setShowEmailModal(false);
      setShareToast({show: true, msg: 'Email sent successfully!'});
      setTimeout(() => setShareToast({show: false, msg: ''}), 3000);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));
      
      const responseText = await copilotService.sendMessage(history, text);
      
      // Parse Logic
      let finalMessage = responseText;
      let generatedArtifact: ArtifactData | undefined = undefined;
      let reasoningSteps: string[] = [];
      let references: Reference[] = [];

      // 1. Extract Reasoning
      const reasoningRegex = /<reasoning>([\s\S]*?)<\/reasoning>/;
      const reasoningMatch = responseText.match(reasoningRegex);
      if (reasoningMatch && reasoningMatch[1]) {
          const rawReasoning = reasoningMatch[1].trim();
          reasoningSteps = rawReasoning.split('\n')
              .map(line => line.replace(/^-\s*/, '').trim())
              .filter(line => line.length > 0);
          finalMessage = finalMessage.replace(reasoningRegex, '');
      }

      // 2. Extract References
      const referencesRegex = /<references>([\s\S]*?)<\/references>/;
      const referencesMatch = responseText.match(referencesRegex);
      if (referencesMatch && referencesMatch[1]) {
          try {
              references = JSON.parse(referencesMatch[1].trim());
          } catch(e) { console.error("Failed to parse references JSON", e); }
          finalMessage = finalMessage.replace(referencesRegex, '');
      }

      // 3. Extract Artifact
      const artifactRegex = /<artifact_payload>([\s\S]*?)<\/artifact_payload>/;
      const artifactMatch = finalMessage.match(artifactRegex);

      if (artifactMatch && artifactMatch[1]) {
          try {
              const jsonContent = JSON.parse(artifactMatch[1].trim());
              generatedArtifact = jsonContent;
              setArtifacts(jsonContent); // Set global artifact state for right panel
              
              finalMessage = finalMessage.replace(artifactRegex, '').trim();
              if (!finalMessage) finalMessage = "I've generated the proposal assets. You can view them on the right.";
          } catch (e) {
              console.error("Failed to parse artifact JSON", e);
          }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: finalMessage.trim(),
        timestamp: new Date(),
        reasoning: reasoningSteps,
        references: references
      };
      
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, {
           id: Date.now().toString(),
           role: 'model',
           text: "Connection error. Please try again.",
           timestamp: new Date()
       }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
          case 'Changes Requested': return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-amber-100 text-amber-700 border-amber-200';
      }
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'Approved': return <CheckCircle2 className="w-3.5 h-3.5" />;
          case 'Changes Requested': return <AlertCircle className="w-3.5 h-3.5" />;
          default: return <Clock className="w-3.5 h-3.5" />;
      }
  };

  return (
    <div className="flex h-full bg-white text-gray-900 font-sans relative">

        {/* TOAST NOTIFICATION */}
        {shareToast.show && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-4">
                <Check className="w-4 h-4 text-green-400" /> {shareToast.msg}
            </div>
        )}

        {/* EMAIL MODAL */}
        {showEmailModal && (
            <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Compose Email</h3>
                        <button onClick={() => setShowEmailModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto">
                        {isGeneratingEmail ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                <p className="text-gray-500 text-sm">Drafting email context...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm">
                                    <span className="text-gray-500 text-right">To:</span>
                                    <input type="text" className="w-full border-b border-gray-200 focus:border-indigo-600 outline-none py-1" placeholder="Recipient..." defaultValue={activeLead?.email || ''} />
                                </div>
                                <div className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm">
                                    <span className="text-gray-500 text-right">Subject:</span>
                                    <input type="text" className="w-full border-b border-gray-200 focus:border-indigo-600 outline-none py-1" defaultValue={`Review: Proposal for ${activeLead?.companyName || 'Client'}`} />
                                </div>
                                <div className="pt-4">
                                    <textarea 
                                      className="w-full h-64 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed"
                                      value={emailDraft}
                                      onChange={(e) => setEmailDraft(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium">
                                    <FileText className="w-4 h-4" /> Attached: Proposal.pdf
                                </div>
                            </div>
                        )}
                    </div>
                    {!isGeneratingEmail && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                            <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800">Cancel</button>
                            <button onClick={handleSendEmail} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2">
                                <Send className="w-4 h-4" /> Send Email
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {/* REFINEMENT TOOLBAR (FLOATING) */}
        {toolbarPosition && !isRefining && (
             <div 
                className="fixed z-50 transform -translate-x-1/2 animate-in zoom-in-95 duration-200 drop-shadow-2xl"
                style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
             >
                {editorMode === 'menu' && (
                    <div className="flex bg-gray-900 text-white rounded-full p-1.5 border border-gray-700 shadow-xl items-center">
                        <button onClick={() => setEditorMode('ai')} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 rounded-full transition-colors border-r border-gray-700">
                            <Sparkles className="w-4 h-4 text-purple-400" /> <span className="text-xs font-bold whitespace-nowrap">Ask Velocity</span>
                        </button>
                        <button onClick={() => setEditorMode('comment')} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 rounded-full transition-colors">
                            <MessageSquarePlus className="w-4 h-4 text-blue-400" /> <span className="text-xs font-bold">Comment</span>
                        </button>
                        <button onClick={() => { setToolbarPosition(null); window.getSelection()?.removeAllRanges(); }} className="ml-1 p-2 hover:bg-gray-700 rounded-full text-gray-400">
                             <X className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {editorMode === 'ai' && (
                    <div className="bg-gray-900 p-2 rounded-xl w-[320px] border border-gray-700 shadow-xl flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 ml-2" />
                        <input 
                            autoFocus
                            type="text" 
                            className="flex-1 bg-transparent border-none text-xs text-white h-8 focus:ring-0 placeholder-gray-500"
                            placeholder="How should I change this?"
                            value={editorInput}
                            onChange={(e) => setEditorInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRefineArtifact()}
                        />
                        <button onClick={handleRefineArtifact} className="bg-white text-black p-1.5 rounded-lg hover:bg-gray-200">
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {editorMode === 'comment' && (
                    <div className="bg-white p-2 rounded-xl w-[320px] border border-gray-200 shadow-xl flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500 ml-2" />
                        <input 
                            autoFocus
                            type="text" 
                            className="flex-1 bg-transparent border-none text-xs text-gray-900 h-8 focus:ring-0 placeholder-gray-400"
                            placeholder="Add a comment..."
                            value={editorInput}
                            onChange={(e) => setEditorInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button onClick={handleAddComment} className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700">
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
             </div>
        )}

        {/* LOADING OVERLAY FOR REFINEMENT */}
        {isRefining && (
             <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-gray-200 animate-in zoom-in-95">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <span className="font-medium text-sm text-gray-900">Velocity is refining your document...</span>
                </div>
            </div>
        )}
        
        {/* LEFT PANEL: CHAT INTERFACE */}
        <div className={`flex flex-col transition-all duration-500 ease-in-out border-r border-gray-100 ${artifacts ? 'w-[40%]' : 'w-full max-w-5xl mx-auto border-r-0'}`}>
            
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm tracking-wide">COPILOT WORKSPACE</h2>
                        {activeLead ? (
                            <p className="text-xs text-gray-500">Context: {activeLead.companyName}</p>
                        ) : (
                            <p className="text-xs text-gray-500">Orchestrator Mode</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-black text-white'}`}>
                                {msg.role === 'user' ? <span className="text-xs font-bold">YOU</span> : <Bot className="w-4 h-4" />}
                            </div>
                            
                            <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                {/* Reasoning & References Block */}
                                {(msg.reasoning && msg.reasoning.length > 0) || (msg.references && msg.references.length > 0) ? (
                                    <ReasoningDisplay steps={msg.reasoning || []} references={msg.references} isComplete={true} />
                                ) : null}

                                <div className={`leading-relaxed text-sm ${msg.role === 'user' ? 'bg-gray-100 p-3 rounded-2xl rounded-tr-sm inline-block' : ''}`}>
                                    <ReactMarkdown className="prose prose-sm max-w-none prose-p:text-gray-800 prose-headings:font-medium prose-strong:font-bold">
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                     <div className="flex gap-4">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-2 pt-1 w-full max-w-[80%]">
                             <div className="flex items-center gap-2">
                                 <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                 <span className="text-xs text-gray-400 tracking-wider font-medium">VELOCITY IS THINKING...</span>
                             </div>
                             {/* Mock Reasoning Loading State */}
                             <div className="h-2 w-32 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* INITIAL DASHBOARD (Empty State) */}
            {!artifacts && messages.length === 1 && !isLoading && (
                <div className="px-6 pb-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
                    
                    {/* 1. Priority Proposal Suggestions */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Recommended Proposals</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {proposalSuggestions.map((prop) => (
                                <button
                                    key={prop.id}
                                    onClick={() => handleSend(prop.prompt)}
                                    className="text-left group flex flex-col p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all bg-white shadow-sm hover:shadow-md"
                                >
                                    <div className="flex justify-between items-start w-full mb-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        {prop.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                                    </div>
                                    <h4 className="font-bold text-sm text-gray-900">{prop.company}</h4>
                                    <p className="text-xs text-gray-500 mt-1 mb-3">Est. Value: ${prop.value.toLocaleString()}</p>
                                    <div className="mt-auto flex items-center gap-2 text-xs font-medium text-indigo-600 group-hover:underline">
                                        Draft Proposal <ArrowRight className="w-3 h-3" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Active Approvals & Comments */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldAlert className="w-4 h-4 text-gray-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Active Approvals & Reviews</h3>
                        </div>
                        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                            {activeApprovals.map((approval, idx) => (
                                <div key={approval.id} className={`p-4 flex items-center justify-between hover:bg-white transition-colors cursor-pointer ${idx !== activeApprovals.length -1 ? 'border-b border-gray-200' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${approval.status === 'Changes Requested' ? 'bg-red-50 text-red-600' : 'bg-white border border-gray-200 text-gray-500'}`}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-sm text-gray-900">{approval.title}</h4>
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(approval.status)}`}>
                                                    {getStatusIcon(approval.status)} {approval.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">{approval.company} • {approval.lastActivity}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        {/* Stakeholders */}
                                        <div className="flex -space-x-2">
                                            {approval.stakeholders.map((s, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[9px] font-bold text-gray-600">
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Comments Indicator */}
                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${approval.comments > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            <MessageSquare className="w-4 h-4" />
                                            {approval.comments > 0 ? `${approval.comments} Comments` : 'No comments'}
                                        </div>

                                        <button className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-black">
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {/* Input Area */}
            <div className="p-6 bg-white mt-auto">
                <div className="relative group">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type a message or Ask to 'Draft a proposal'..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all resize-none shadow-sm min-h-[60px]"
                        rows={1}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-3 bottom-3 p-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        {/* RIGHT PANEL: ARTIFACT PREVIEW (Only visible if content exists) */}
        {artifacts && (
            <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right-10 duration-500 border-l border-gray-200">
                {/* Toolbar */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setViewMode('doc')}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${viewMode === 'doc' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                        >
                            <FileText className="w-3.5 h-3.5" /> Document
                        </button>
                        <button 
                            onClick={() => setViewMode('ppt')}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${viewMode === 'ppt' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                        >
                            <Presentation className="w-3.5 h-3.5" /> Slides
                        </button>
                    </div>
                    <div className="flex gap-2">
                         <div className="text-xs text-gray-500 flex items-center gap-2 mr-4 bg-gray-50 px-3 rounded-lg border border-gray-100">
                             <Sparkles className="w-3 h-3 text-purple-500" /> Highlight text to edit
                         </div>
                         <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                            <Edit2 className="w-4 h-4" />
                         </button>
                         {/* New Mail Button */}
                         <button 
                             onClick={handleOpenEmail}
                             className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-black transition-colors"
                             title="Email to Customer"
                         >
                            <Mail className="w-4 h-4" />
                         </button>
                         <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                            <Share2 className="w-4 h-4" />
                         </button>
                    </div>
                </div>

                {/* Content Viewer with Interactive Ref */}
                <div 
                    className="flex-1 overflow-y-auto p-10 flex justify-center selection:bg-indigo-100 selection:text-indigo-900"
                    ref={editorContainerRef}
                >
                    {viewMode === 'doc' ? (
                        <div className="bg-white shadow-xl w-[816px] min-h-[1056px] p-12 text-gray-800 relative">
                             <article className="prose prose-sm max-w-none prose-headings:font-serif">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifacts.documentContent}</ReactMarkdown>
                            </article>
                            
                            {/* Render Comments inline (Simplified visualization) */}
                            {comments.map(c => (
                                <div key={c.id} className="absolute right-4 w-48 bg-yellow-50 border border-yellow-200 p-3 rounded-lg shadow-sm text-xs" style={{top: '10%' /* Simplified positioning */}}>
                                    <div className="font-bold text-yellow-800 mb-1">Comment</div>
                                    "{c.context.substring(0, 20)}..." <br/>
                                    <span className="text-gray-600 font-medium">{c.text}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="w-full max-w-4xl space-y-8">
                             {artifacts.presentationContent.split('---').map((slide, idx) => {
                                 if(!slide.trim()) return null;
                                 return (
                                     <div key={idx} className="bg-white aspect-video p-12 shadow-lg border border-gray-200 rounded-xl flex flex-col justify-between">
                                          <div className="prose prose-slate max-w-none">
                                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide}</ReactMarkdown>
                                          </div>
                                          <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-xs text-gray-400">
                                              <span>Contoso Confidential</span>
                                              <span>Slide {idx + 1}</span>
                                          </div>
                                     </div>
                                 )
                             })}
                         </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default CopilotPage;
