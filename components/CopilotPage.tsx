import React, { useState, useEffect, useRef } from 'react';
import { Message, Lead } from '../types';
import { copilotService } from '../services/geminiService';
import { saveSession } from '../services/historyService';
import { getLeads, getNewsForCompany } from '../services/dataService';
import { Send, Bot, FileText, Presentation, Edit2, Share2, Sparkles, Loader2, TrendingUp, ShieldAlert, DollarSign, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CopilotPageProps {
  activeLead: Lead | null;
}

interface ArtifactData {
    documentContent: string;
    presentationContent: string;
}

interface ActionSuggestion {
    id: string;
    company: string;
    headline: string;
    actionLabel: string;
    prompt: string;
    icon: any;
}

const CopilotPage: React.FC<CopilotPageProps> = ({ activeLead }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "I am your sales orchestrator. I've scanned your accounts and found some actionable insights based on recent news. How would you like to proceed?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ActionSuggestion[]>([]);
  
  // Artifact State
  const [artifacts, setArtifacts] = useState<ArtifactData | null>(null);
  const [viewMode, setViewMode] = useState<'doc' | 'ppt'>('doc');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Generate Dynamic Actions on Mount
  useEffect(() => {
    const leads = getLeads();
    // Shuffle leads to get random ones each time
    const shuffledLeads = [...leads].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    const newSuggestions: ActionSuggestion[] = shuffledLeads.map((lead, index) => {
        const news = getNewsForCompany(lead.companyName);
        // Get a random headline if available, otherwise generic
        const headline = news.length > 0 ? news[Math.floor(Math.random() * news.length)] : "Recent market activity detected";
        
        // Simple keyword logic for creativity
        let actionLabel = "Analyze Impact";
        let icon = Lightbulb;
        let promptType = "strategy";

        const hLower = headline.toLowerCase();
        if (hLower.includes("expansion") || hLower.includes("growth") || hLower.includes("plant")) {
            actionLabel = "Pitch Expansion Support";
            icon = TrendingUp;
            promptType = "expansion";
        } else if (hLower.includes("breach") || hLower.includes("security") || hLower.includes("hack")) {
            actionLabel = "Propose Security Audit";
            icon = ShieldAlert;
            promptType = "security";
        } else if (hLower.includes("funding") || hLower.includes("profit") || hLower.includes("acquisition")) {
            actionLabel = "Draft Upsell Proposal";
            icon = DollarSign;
            promptType = "finance";
        }

        return {
            id: `sugg-${index}`,
            company: lead.companyName,
            headline: headline,
            actionLabel: actionLabel,
            icon: icon,
            prompt: `Draft a proposal for ${lead.companyName}. Context: The news headline is "${headline}". The goal is to ${actionLabel} and address their specific industry needs.`
        };
    });

    setSuggestions(newSuggestions);
  }, []); // Run once on mount

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
      
      // Parse Artifacts
      let finalMessage = responseText;
      const artifactRegex = /<artifact_payload>([\s\S]*?)<\/artifact_payload>/;
      const match = responseText.match(artifactRegex);

      if (match && match[1]) {
          try {
              const jsonContent = JSON.parse(match[1].trim());
              setArtifacts(jsonContent);
              
              // Remove artifact from chat text to keep it clean
              finalMessage = responseText.replace(artifactRegex, '').trim();
              if (!finalMessage) finalMessage = "I've generated the proposal assets. You can view them on the right.";
          } catch (e) {
              console.error("Failed to parse artifact JSON", e);
          }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: finalMessage,
        timestamp: new Date()
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

  return (
    <div className="flex h-full bg-white text-gray-900 font-sans">
        
        {/* LEFT PANEL: CHAT INTERFACE */}
        <div className={`flex flex-col transition-all duration-500 ease-in-out border-r border-gray-100 ${artifacts ? 'w-[40%]' : 'w-full max-w-3xl mx-auto border-r-0'}`}>
            
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-200' : 'bg-black text-white'}`}>
                            {msg.role === 'user' ? <span className="text-xs font-bold">YOU</span> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`max-w-[80%] pt-1 leading-relaxed text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <ReactMarkdown className="prose prose-sm max-w-none prose-p:text-gray-800 prose-headings:font-medium prose-strong:font-bold">
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                     <div className="flex gap-4">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                             <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                             <span className="text-xs text-gray-400 tracking-wider">THINKING...</span>
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Dynamic Suggestions (Empty State) */}
            {!artifacts && messages.length === 1 && !isLoading && (
                <div className="px-6 pb-6">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-4">Recommended Actions (Live Intelligence)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {suggestions.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => handleSend(action.prompt)}
                                className="text-left group flex flex-col p-4 rounded-xl border border-gray-200 hover:border-black hover:shadow-md transition-all bg-gray-50 hover:bg-white"
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                                        <action.icon className="w-3 h-3" />
                                        {action.company}
                                    </div>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Sparkles className="w-3 h-3 text-black" />
                                    </span>
                                </div>
                                <h4 className="font-semibold text-sm text-gray-900 mb-1">{action.actionLabel}</h4>
                                <p className="text-xs text-gray-500 line-clamp-1 italic">"{action.headline}"</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-6 bg-white">
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
            <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right-10 duration-500">
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
                         <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                            <Edit2 className="w-4 h-4" />
                         </button>
                         <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                            <Share2 className="w-4 h-4" />
                         </button>
                    </div>
                </div>

                {/* Content Viewer */}
                <div className="flex-1 overflow-y-auto p-10 flex justify-center">
                    {viewMode === 'doc' ? (
                        <div className="bg-white shadow-xl w-[816px] min-h-[1056px] p-12 text-gray-800">
                             <article className="prose prose-sm max-w-none prose-headings:font-serif">
                                <ReactMarkdown>{artifacts.documentContent}</ReactMarkdown>
                            </article>
                        </div>
                    ) : (
                         <div className="w-full max-w-4xl space-y-8">
                             {artifacts.presentationContent.split('---').map((slide, idx) => {
                                 if(!slide.trim()) return null;
                                 return (
                                     <div key={idx} className="bg-white aspect-video p-12 shadow-lg border border-gray-200 rounded-xl flex flex-col justify-between">
                                          <div className="prose prose-slate max-w-none">
                                              <ReactMarkdown>{slide}</ReactMarkdown>
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