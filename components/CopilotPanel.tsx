import React, { useState, useEffect, useRef } from 'react';
import { Message, Lead, ArtifactData } from '../types';
import { copilotService } from '../services/geminiService';
import { saveSession } from '../services/historyService';
import { Send, Bot, Sparkles, Loader2, X, Zap, Search, FileText, Calendar, DollarSign, ArrowRight, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CopilotPanelProps {
  activeLead: Lead | null;
  onArtifactGenerated: (data: ArtifactData) => void;
  externalPrompt?: string; 
  onPromptHandled: () => void;
  onClose?: () => void;
}

const QUICK_ACTIONS = [
    { label: "Draft Proposal", icon: FileText, prompt: "Draft a proposal for the active account" },
    { label: "Research", icon: Search, prompt: "Research recent news for this account" },
    { label: "Meeting Prep", icon: Calendar, prompt: "Prepare a meeting brief" },
    { label: "Check Pricing", icon: DollarSign, prompt: "Check pricing for Enterprise Cloud" },
    { label: "Summarize", icon: Sparkles, prompt: "Summarize the latest interactions" },
];

const CopilotPanel: React.FC<CopilotPanelProps> = ({ activeLead, onArtifactGenerated, externalPrompt, onPromptHandled, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "I'm ready. I can help you draft proposals, research accounts, or prepare for meetings.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (externalPrompt) {
        handleSend(externalPrompt);
        onPromptHandled();
    }
  }, [externalPrompt]);

  useEffect(() => {
      if (messages.length > 1) {
          saveSession(messages);
      }
  }, [messages.length]);

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
      
      let finalMessage = responseText;
      let generatedArtifact: ArtifactData | undefined = undefined;

      const artifactRegex = /<artifact_payload>([\s\S]*?)<\/artifact_payload>/;
      const match = responseText.match(artifactRegex);

      if (match && match[1]) {
          try {
              const jsonContent = JSON.parse(match[1].trim());
              generatedArtifact = jsonContent;
              
              // Clean the message
              finalMessage = responseText.replace(artifactRegex, '').trim();
              if (!finalMessage) finalMessage = "I've drafted the documents based on our conversation.";
          } catch (e) {
              console.error("Failed to parse artifact JSON", e);
          }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: finalMessage,
        timestamp: new Date(),
        relatedArtifact: generatedArtifact // Store linkage
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

  const handleQuickAction = (actionPrompt: string) => {
      let prompt = actionPrompt;
      if (activeLead && actionPrompt.includes("active account")) {
          prompt = actionPrompt.replace("active account", activeLead.companyName);
      } else if (activeLead && actionPrompt.includes("this account")) {
          prompt = actionPrompt.replace("this account", activeLead.companyName);
      }
      handleSend(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans border-l border-gray-200">
        
        {/* Header */}
        <div className="h-16 border-b border-gray-100 flex items-center px-6 justify-between shrink-0 bg-white">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-black text-white rounded-md flex items-center justify-center">
                     <Bot className="w-4 h-4" />
                 </div>
                 <div>
                     <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">Copilot</h2>
                     <p className="text-[10px] text-gray-500 font-medium">Assistant</p>
                 </div>
             </div>
             <div className="flex items-center gap-2">
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}
             </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-black border border-gray-200'}`}>
                            {msg.role === 'user' ? <span className="text-[10px] font-bold">ME</span> : <Sparkles className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`text-sm leading-relaxed p-4 rounded-xl shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-black text-white rounded-tr-none' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                        }`}>
                            <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-0 prose-ul:my-1 prose-headings:text-inherit prose-strong:text-inherit prose-a:text-inherit">
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Artifact Link Card */}
                    {msg.relatedArtifact && (
                        <div className="ml-11 max-w-[80%] animate-in zoom-in-95 duration-300">
                            <button 
                                onClick={() => onArtifactGenerated(msg.relatedArtifact!)}
                                className="w-full flex items-center gap-4 bg-gray-50 hover:bg-white border border-gray-200 hover:border-black p-4 rounded-xl transition-all text-left group shadow-sm hover:shadow-md"
                            >
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">Proposal Assets Ready</div>
                                    <div className="text-xs text-gray-500">Includes Document & Slides</div>
                                </div>
                                <ArrowRight className="w-4 h-4 ml-auto text-gray-300 group-hover:text-black transition-colors" />
                            </button>
                        </div>
                    )}
                </div>
            ))}
            
            {isLoading && (
                 <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center mt-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    </div>
                    <div className="text-xs text-gray-400 py-2 font-medium tracking-wide">Thinking...</div>
                 </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Persistent Quick Actions & Input Area */}
        <div className="bg-white border-t border-gray-100 shrink-0">
            
            {/* Horizontal Scrollable Actions */}
            <div className="px-5 pt-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
                {QUICK_ACTIONS.map((action, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-black hover:text-white border border-gray-200 hover:border-black rounded-full text-xs font-medium text-gray-600 transition-all"
                    >
                        <action.icon className="w-3 h-3" />
                        {action.label}
                    </button>
                ))}
            </div>

            <div className="p-5 pt-2">
                <div className="relative shadow-sm rounded-xl overflow-hidden border border-gray-200 focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Message Copilot..."
                        className="w-full bg-white p-4 pr-12 text-sm focus:outline-none resize-none min-h-[60px] max-h-[150px] placeholder-gray-400"
                        rows={1}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-3 bottom-3 p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-[10px] text-center text-gray-400 mt-3 font-medium">
                    AI can make mistakes. Check important info.
                </div>
            </div>
        </div>
    </div>
  );
};

export default CopilotPanel;