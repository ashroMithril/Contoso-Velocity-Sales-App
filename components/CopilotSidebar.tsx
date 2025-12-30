import React, { useState, useRef, useEffect } from 'react';
import { Message, Lead } from '../types';
import { copilotService } from '../services/geminiService';
import { Send, Sparkles, X, ChevronRight, Zap, FileText, MessageSquare, ArrowRight, Bot, Presentation, Edit2, Check, Share2, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CopilotSidebarProps {
  isOpen: boolean;
  activeLead: Lead | null;
  onUpdateDocument: (content: string) => void;
  onClose: () => void;
}

interface ArtifactData {
    documentContent: string;
    presentationContent: string;
}

const CopilotSidebar: React.FC<CopilotSidebarProps> = ({ isOpen, activeLead, onUpdateDocument, onClose }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'artifacts'>('chat');
  const [artifactType, setArtifactType] = useState<'doc' | 'ppt'>('doc');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your Copilot Orchestrator. I can answer questions, look up pricing, or trigger the **Proposal Generator Agent** to draft documents for you.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [artifacts, setArtifacts] = useState<ArtifactData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(''); // Holds content during edit mode
  const [showToast, setShowToast] = useState(false); // For share action
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab, isLoading]);

  // Handle switching artifacts
  useEffect(() => {
      if (artifacts) {
          setEditableContent(artifactType === 'doc' ? artifacts.documentContent : artifacts.presentationContent);
      }
  }, [artifactType, artifacts]);

  // Context-aware suggestion
  useEffect(() => {
      if (activeLead && messages.length === 1) {
          setMessages(prev => [
              ...prev,
              {
                  id: 'context-nudge',
                  role: 'model',
                  text: `I see you're working on **${activeLead.companyName}**. Need me to trigger the Proposal Agent?`,
                  timestamp: new Date()
              }
          ])
      }
  }, [activeLead]);

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
      // Prepare history for API (clean text)
      const history = messages
        .filter(m => m.id !== 'welcome' && m.id !== 'context-nudge')
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
              setEditableContent(jsonContent.documentContent); // Default to doc
              setArtifactType('doc');
              
              // Remove artifact from chat bubble
              finalMessage = responseText.replace(artifactRegex, '').trim();
              if (!finalMessage) finalMessage = "Proposal and Slides generated successfully. Opening artifact view...";
              
              // Auto-switch to artifacts tab
              setActiveTab('artifacts');
          } catch (e) {
              console.error("Failed to parse artifact JSON", e);
              finalMessage += "\n\n(Error parsing generated artifacts)";
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
           text: "I encountered an error connecting to the agents.",
           timestamp: new Date()
       }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveEdit = () => {
      if (!artifacts) return;
      
      const newArtifacts = { ...artifacts };
      if (artifactType === 'doc') {
          newArtifacts.documentContent = editableContent;
      } else {
          newArtifacts.presentationContent = editableContent;
      }
      setArtifacts(newArtifacts);
      setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="w-[450px] bg-white border-l border-gray-200 flex flex-col shadow-xl z-30 font-sans transition-all duration-300">
      
      {/* Share Toast */}
      {showToast && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
              <Check className="w-3 h-3 text-green-400" /> Shared with team
          </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 leading-tight">Copilot</h3>
                    <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">Agent Workspace</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>
        
        {/* Main Tabs */}
        <div className="flex px-4 gap-6">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'chat' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                <MessageSquare className="w-4 h-4" /> Chat
            </button>
            <button 
                onClick={() => setActiveTab('artifacts')}
                className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'artifacts' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                <FileText className="w-4 h-4" /> Artifacts
                {artifacts && activeTab !== 'artifacts' && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-gray-50/50 relative">
        
        {/* CHAT TAB */}
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${activeTab === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-sm' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                    }`}>
                    <ReactMarkdown className="prose prose-sm max-w-none prose-p:leading-relaxed">
                        {msg.text}
                    </ReactMarkdown>
                    </div>
                </div>
                ))}
                
                {isLoading && (
                    <div className="flex flex-col gap-2 p-4 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                            <div className="relative">
                                <Bot className="w-6 h-6 text-indigo-600" />
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                </span>
                            </div>
                            <div className="text-xs text-gray-600">
                                <span className="font-semibold block text-indigo-700">Agents Working...</span>
                                Orchestrating tools & generating content
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {!isLoading && activeLead && messages.length < 5 && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-gray-50/50 border-t border-gray-100">
                    <button 
                        onClick={() => handleSend(`Draft a proposal for ${activeLead.companyName}`)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-700 text-xs font-medium rounded-full border border-indigo-100 hover:border-indigo-300 shadow-sm transition-all"
                    >
                        <Zap className="w-3 h-3 fill-indigo-100" /> Draft Proposal
                    </button>
                    <button 
                        onClick={() => handleSend(`What is the pricing for ${activeLead.needs[0]}?`)}
                        className="flex-shrink-0 px-3 py-1.5 bg-white text-gray-600 text-xs font-medium rounded-full border border-gray-200 hover:border-gray-400 shadow-sm transition-all"
                    >
                        Get Pricing
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask Copilot..."
                        className="w-full resize-none rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-3 pr-10 text-sm min-h-[50px] max-h-[150px] shadow-inner bg-gray-50 focus:bg-white transition-colors"
                        rows={1}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors shadow-sm"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        {/* ARTIFACTS TAB */}
        <div className={`absolute inset-0 bg-white flex flex-col transition-opacity duration-200 ${activeTab === 'artifacts' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            {artifacts ? (
                <div className="flex-1 flex flex-col h-full">
                    
                    {/* Artifact Type Toggles */}
                    <div className="flex items-center p-2 bg-gray-50 border-b border-gray-200">
                        <div className="flex p-1 bg-gray-200 rounded-lg">
                            <button
                                onClick={() => { setArtifactType('doc'); setIsEditing(false); }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                    artifactType === 'doc' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" /> Document
                            </button>
                            <button
                                onClick={() => { setArtifactType('ppt'); setIsEditing(false); }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                    artifactType === 'ppt' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                <Presentation className="w-3.5 h-3.5" /> Slides
                            </button>
                        </div>
                        <div className="ml-auto flex gap-1">
                             <button 
                                onClick={() => setIsEditing(!isEditing)}
                                className={`p-1.5 rounded-md transition-colors ${isEditing ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200 text-gray-500'}`}
                                title="Edit"
                             >
                                 {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                             </button>
                             <button 
                                onClick={handleShare}
                                className="p-1.5 hover:bg-gray-200 text-gray-500 rounded-md transition-colors"
                                title="Share"
                             >
                                 <Share2 className="w-4 h-4" />
                             </button>
                        </div>
                    </div>

                    {/* Toolbar / Insert Action */}
                    <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Generated Content</span>
                        {artifactType === 'doc' && !isEditing && (
                            <button 
                                onClick={() => onUpdateDocument(artifacts.documentContent)}
                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                            >
                                Insert into Main Editor <ArrowRight className="w-3 h-3" />
                            </button>
                        )}
                        {isEditing && (
                             <button 
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                             >
                                Save Changes
                             </button>
                        )}
                    </div>

                    {/* Content Viewer / Editor */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                        {isEditing ? (
                            <textarea 
                                value={editableContent}
                                onChange={(e) => setEditableContent(e.target.value)}
                                className="w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-mono text-xs shadow-inner"
                            />
                        ) : (
                            <>
                                {artifactType === 'doc' ? (
                                    <div className="bg-white p-8 shadow-sm border border-gray-200 min-h-full">
                                        <article className="prose prose-sm prose-slate max-w-none">
                                            <ReactMarkdown>{artifacts.documentContent}</ReactMarkdown>
                                        </article>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {artifacts.presentationContent.split('---').map((slide, idx) => {
                                            if (!slide.trim()) return null;
                                            return (
                                                <div key={idx} className="bg-white aspect-video p-6 shadow-sm border border-gray-200 flex flex-col rounded-lg hover:shadow-md transition-shadow">
                                                    <div className="flex-1 overflow-hidden">
                                                        <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2 block">Slide {idx + 1}</span>
                                                        <div className="prose prose-sm prose-slate max-w-none prose-headings:text-orange-600 prose-headings:mb-2 prose-ul:my-0">
                                                            <ReactMarkdown>{slide}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-2 border-t border-gray-100 flex justify-end">
                                                        <div className="w-16 h-1 bg-orange-500/20 rounded-full"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <Bot className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-600">Proposal Agent Waiting</p>
                    <p className="text-xs mt-2 text-gray-400">Ask the Copilot to "Draft a proposal" to trigger the agent.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default CopilotSidebar;