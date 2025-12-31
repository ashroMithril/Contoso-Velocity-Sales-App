
import React, { useState, useEffect, useRef } from 'react';
import { Message, Lead, ArtifactData } from '../types';
import { copilotService } from '../services/geminiService';
import { saveSession } from '../services/historyService';
import { VelocityLogo } from './VelocityLogo';
import { Send, Loader2, X, Search, FileText, Calendar, ArrowRight, Layers, Mail, Briefcase, Share2, Users, Check, Mic, Video, StopCircle, Sparkles, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CopilotPanelProps {
  activeLead: Lead | null;
  onArtifactGenerated: (data: ArtifactData) => void;
  externalPrompt?: string; 
  onPromptHandled: () => void;
  onClose?: () => void;
}

const QUICK_ACTIONS = [
    { label: "Proposal", icon: FileText, prompt: "@Velocity draft proposal for the active account" },
    { label: "Demo Video", icon: Video, prompt: "@Velocity demo video active account prompt: 'Futuristic product dashboard with neon accents'" },
    { label: "Handoff", icon: Briefcase, prompt: "@Velocity handoff active account to implementation" },
    { label: "Meeting Prep", icon: Calendar, prompt: "@Velocity prep meeting for active account" },
    { label: "Follow Up", icon: Mail, prompt: "@Velocity follow up email for active account" },
    { label: "Research", icon: Search, prompt: "Research recent news for this account" },
];

// --- THINKING PROCESS COMPONENT ---
interface ThinkingStep {
    id: string;
    label: string;
    status: 'pending' | 'active' | 'complete';
}

const ThinkingProcess: React.FC<{ steps: ThinkingStep[] }> = ({ steps }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-3">
                <div className="relative w-4 h-4">
                     <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                     <div className="relative w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                     </div>
                </div>
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Velocity Agent Reasoning</span>
            </div>
            <div className="space-y-2.5 pl-1.5">
                {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-forwards" style={{animationDelay: `${idx * 150}ms`}}>
                        <div className="relative flex flex-col items-center">
                            {/* Connector Line */}
                            {idx !== steps.length - 1 && (
                                <div className={`absolute top-4 w-px h-6 bg-gray-200 ${step.status === 'complete' ? 'bg-indigo-200' : ''}`} />
                            )}
                            
                            {step.status === 'complete' ? (
                                <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200">
                                    <Check className="w-2.5 h-2.5" />
                                </div>
                            ) : step.status === 'active' ? (
                                <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-200"></div>
                            )}
                        </div>
                        <span className={`text-xs transition-colors duration-300 ${
                            step.status === 'active' ? 'text-indigo-700 font-semibold' : 
                            step.status === 'complete' ? 'text-gray-500 line-through opacity-70' : 'text-gray-400'
                        }`}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const CopilotPanel: React.FC<CopilotPanelProps> = ({ activeLead, onArtifactGenerated, externalPrompt, onPromptHandled, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "I'm Velocity, your Copilot. Try commands like `@Velocity draft proposal`, `@Velocity voice over` or `@Velocity demo video`.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Thinking State
  const [currentThinkingSteps, setCurrentThinkingSteps] = useState<ThinkingStep[]>([]);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isMounted = useRef(true);

  // Sharing State
  const [shareMenuOpenId, setShareMenuOpenId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [shareToast, setShareToast] = useState<{show: boolean, msg: string}>({show: false, msg: ''});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, currentThinkingSteps]); 

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

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscript) {
                    setInput(prev => {
                        const trailingSpace = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                        return prev + trailingSpace + finalTranscript;
                    });
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (isMounted.current) setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                if (isMounted.current) setIsListening(false);
            };
        }
    }
  }, []);

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          try {
            recognitionRef.current?.start();
            setIsListening(true);
          } catch (e) {
              console.error("Failed to start recognition", e);
          }
      }
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
    setCurrentThinkingSteps([]); // Reset steps

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));
      
      const responseText = await copilotService.sendMessage(history, text);
      
      if (!isMounted.current) return;

      // PARSING LOGIC: Extract <reasoning> and <artifact_payload>
      let finalMessage = responseText;
      let generatedArtifact: ArtifactData | undefined = undefined;
      let reasoningSteps: string[] = [];

      // 1. Extract Reasoning
      const reasoningRegex = /<reasoning>([\s\S]*?)<\/reasoning>/;
      const reasoningMatch = responseText.match(reasoningRegex);
      if (reasoningMatch && reasoningMatch[1]) {
          const rawReasoning = reasoningMatch[1].trim();
          // Split by bullets or newlines and clean up
          reasoningSteps = rawReasoning.split('\n')
              .map(line => line.replace(/^-\s*/, '').trim())
              .filter(line => line.length > 0);
          
          finalMessage = finalMessage.replace(reasoningRegex, '');
      }

      // 2. Extract Artifact
      const artifactRegex = /<artifact_payload>([\s\S]*?)<\/artifact_payload>/;
      const artifactMatch = finalMessage.match(artifactRegex);

      if (artifactMatch && artifactMatch[1]) {
          try {
              const jsonContent = JSON.parse(artifactMatch[1].trim());
              generatedArtifact = jsonContent;
              
              const artifactType = 
                generatedArtifact.audioContent ? 'VoiceOver' :
                generatedArtifact.videoUri ? 'DemoVideo' : 'Generic';
              
              finalMessage = finalMessage.replace(artifactRegex, '').trim();
              if (!finalMessage) finalMessage = `I've generated the ${artifactType} asset based on my analysis.`;
          } catch (e) {
              console.error("Failed to parse artifact JSON", e);
          }
      }

      // 3. Animate Reasoning Steps (Simulate Timing)
      if (reasoningSteps.length > 0) {
          const steps: ThinkingStep[] = reasoningSteps.map((label, i) => ({
              id: `step-${i}`,
              label,
              status: 'pending'
          }));
          
          setCurrentThinkingSteps(steps);

          // Animate them rapidly to show the thought process before showing final result
          for (let i = 0; i < steps.length; i++) {
              if (!isMounted.current) break;
              setCurrentThinkingSteps(prev => prev.map((s, idx) => {
                  if (idx === i) return { ...s, status: 'active' };
                  if (idx < i) return { ...s, status: 'complete' };
                  return s;
              }));
              await new Promise(r => setTimeout(r, 400)); // 400ms per step
          }
          if (isMounted.current) {
               setCurrentThinkingSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));
          }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: finalMessage.trim(),
        timestamp: new Date(),
        relatedArtifact: generatedArtifact,
        reasoning: reasoningSteps
      };
      
      // Delay slightly to let the last thinking step finish visually
      setTimeout(() => {
          if(isMounted.current) {
              setMessages(prev => [...prev, botMsg]);
              setCurrentThinkingSteps([]); // Clear the floating thinking steps as they are now persisted in the message history if we wanted, or just done.
          }
      }, 500);

    } catch (error) {
       console.error(error);
       if (isMounted.current) {
           setMessages(prev => [...prev, {
               id: Date.now().toString(),
               role: 'model',
               text: "Connection error. Please try again.",
               timestamp: new Date()
           }]);
       }
    } finally {
      if (isMounted.current) {
          setIsLoading(false);
      }
    }
  };

  const handleQuickAction = (actionPrompt: string) => {
      let prompt = actionPrompt;
      if (activeLead && actionPrompt.includes("active account")) {
          prompt = actionPrompt.replace("active account", activeLead.companyName);
      } else if (!activeLead && actionPrompt.includes("active account")) {
          prompt = actionPrompt.replace("active account", "Client");
      }
      handleSend(prompt);
  };

  // --- Sharing Handlers ---

  const handleShareColleague = () => {
      setShareMenuOpenId(null);
      setShareToast({show: true, msg: 'Shared successfully with team.'});
      setTimeout(() => setShareToast({show: false, msg: ''}), 3000);
  };

  const handleShareEmail = async (artifactData: ArtifactData) => {
      setShareMenuOpenId(null);
      setShowEmailModal(true);
      setIsGeneratingEmail(true);
      
      const mockArtifact: any = {
          title: 'Generated Assets',
          companyName: activeLead?.companyName || 'Client',
          type: 'Proposal',
          content: artifactData
      };

      const draft = await copilotService.generateEmailForArtifact(mockArtifact);
      if (isMounted.current) {
          setEmailDraft(draft);
          setIsGeneratingEmail(false);
      }
  };

  const handleSendEmail = () => {
      setShowEmailModal(false);
      setShareToast({show: true, msg: 'Email sent successfully.'});
      setTimeout(() => setShareToast({show: false, msg: ''}), 3000);
  };

  const handleRequestApproval = () => {
      // For quick action in the panel, we just show a success toast.
      // In the full viewer, this opens a modal.
      setShareToast({show: true, msg: 'Approval request sent to manager.'});
      setTimeout(() => setShareToast({show: false, msg: ''}), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans border-l border-gray-200 shadow-2xl relative">
        
        {/* Toast */}
        {shareToast.show && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm transition-all duration-300 transform translate-y-0 opacity-100">
                <Check className="w-4 h-4 text-green-400" /> {shareToast.msg}
            </div>
        )}

        {/* Email Modal */}
        {showEmailModal && (
            <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-sm">Compose Email</h3>
                        <button onClick={() => setShowEmailModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        {isGeneratingEmail ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                <p className="text-gray-500 text-xs">Drafting email...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <input type="text" className="w-full border-b border-gray-200 text-sm py-2 outline-none" placeholder="To: Client" />
                                <input type="text" className="w-full border-b border-gray-200 text-sm py-2 outline-none" defaultValue={`Review: Generated Assets`} />
                                <textarea 
                                    className="w-full h-48 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-1 focus:ring-indigo-500 mt-2"
                                    value={emailDraft}
                                    onChange={(e) => setEmailDraft(e.target.value)}
                                />
                                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium">
                                    <FileText className="w-3 h-3" /> Attached: Proposal.pdf
                                </div>
                            </div>
                        )}
                    </div>
                    {!isGeneratingEmail && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-2">
                            <button onClick={() => setShowEmailModal(false)} className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800">Cancel</button>
                            <button onClick={handleSendEmail} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2">
                                <Send className="w-3 h-3" /> Send
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4 md:px-6 justify-between shrink-0 bg-white/95 backdrop-blur-sm">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center shadow-md">
                     <VelocityLogo className="w-5 h-5" />
                 </div>
                 <div>
                     <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">Velocity</h2>
                     <p className="text-[10px] text-gray-500 font-medium">Copilot Agent</p>
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50/50">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    <div className={`flex gap-3 max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow-sm ${msg.role === 'user' ? 'bg-black text-white' : 'bg-white text-indigo-600 border border-indigo-100'}`}>
                            {msg.role === 'user' ? <span className="text-[10px] font-bold">ME</span> : <VelocityLogo className="w-5 h-5" />}
                        </div>
                        <div className={`flex flex-col gap-2 w-full`}>
                            {/* Reasoning Bubble (If exists) */}
                            {msg.reasoning && msg.reasoning.length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-1">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-600">
                                        <Sparkles className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase">Reasoning Process</span>
                                    </div>
                                    <ul className="list-none space-y-1">
                                        {msg.reasoning.map((step, idx) => (
                                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                                <span className="text-gray-300 mt-0.5">•</span> {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className={`text-sm leading-relaxed p-3 md:p-4 rounded-2xl shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-black text-white rounded-tr-none' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                            }`}>
                                <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-0 prose-ul:my-1 prose-headings:text-inherit prose-strong:text-inherit prose-a:text-inherit">
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* Artifact Link Card */}
                    {msg.relatedArtifact && (
                        <div className="ml-11 max-w-[85%] w-full md:w-auto transition-all duration-300">
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ring-1 ring-black/5 flex flex-col">
                                <div 
                                    onClick={() => onArtifactGenerated(msg.relatedArtifact!)}
                                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-indigo-50/50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 border border-indigo-200">
                                        {msg.relatedArtifact.audioContent ? <Mic className="w-5 h-5" /> : 
                                         msg.relatedArtifact.videoUri ? <Video className="w-5 h-5" /> :
                                         <Layers className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-gray-900 text-sm truncate">
                                            {msg.relatedArtifact.audioContent ? 'Voice Over Generated' : 
                                             msg.relatedArtifact.videoUri ? 'Demo Video Ready' : 'Assets Generated'}
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium">Tap to view content</div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300" />
                                </div>
                                
                                <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 flex justify-end relative items-center gap-2">
                                    <button 
                                        onClick={() => handleShareEmail(msg.relatedArtifact!)}
                                        className="text-xs font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                                        title="Send Email"
                                    >
                                        <Mail className="w-3.5 h-3.5" /> Email
                                    </button>
                                    <div className="h-4 w-px bg-gray-200"></div>
                                    <button 
                                        onClick={() => setShareMenuOpenId(shareMenuOpenId === msg.id ? null : msg.id)}
                                        className="text-xs font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                                    >
                                        <Share2 className="w-3.5 h-3.5" /> Share
                                    </button>
                                    <div className="h-4 w-px bg-gray-200"></div>
                                    <button 
                                        onClick={handleRequestApproval}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white border border-transparent hover:border-indigo-100 transition-all"
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5" /> Approval
                                    </button>

                                    {/* Inline Share Menu */}
                                    {shareMenuOpenId === msg.id && (
                                        <div className="absolute right-2 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-10 w-40 p-1 transition-all origin-top-right">
                                            <button 
                                                onClick={handleShareColleague}
                                                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2"
                                            >
                                                <Users className="w-3 h-3" /> Colleague
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
            {/* Thinking UI - Shown while Loading OR while steps are animating */}
            {(isLoading || currentThinkingSteps.length > 0) && (
                <div className="flex flex-col items-start gap-2 ml-1 max-w-[85%]">
                     <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                        <VelocityLogo className="w-5 h-5" />
                    </div>
                    {/* If we have specific steps (from response), show them. Otherwise show placeholder/connecting state */}
                    {currentThinkingSteps.length > 0 ? (
                        <ThinkingProcess steps={currentThinkingSteps} />
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
                            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                            <span className="text-xs font-medium text-gray-600">Agents collaborating...</span>
                        </div>
                    )}
                </div>
            )}
            
            <div ref={messagesEndRef} />
        </div>

        {/* Persistent Quick Actions & Input Area */}
        <div className="bg-white border-t border-gray-200 shrink-0 shadow-[0_-5px_20px_rgb(0,0,0,0.02)] pb-safe md:pb-0 z-20">
            {/* Click mask for closing share menu if open */}
            {shareMenuOpenId && (
                <div className="fixed inset-0 z-0 bg-transparent" onClick={() => setShareMenuOpenId(null)} />
            )}

            {/* Horizontal Scrollable Actions */}
            <div className="px-4 pt-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar relative z-10">
                {QUICK_ACTIONS.map((action, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-black hover:text-white border border-gray-200 hover:border-black rounded-full text-xs font-semibold text-gray-600 transition-all active:scale-95"
                    >
                        <action.icon className="w-3 h-3" />
                        {action.label}
                    </button>
                ))}
            </div>

            <div className="p-4 md:p-5 pt-2 relative z-10">
                <div className="relative shadow-sm rounded-2xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-black/10 focus-within:border-black transition-all bg-white">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Message Velocity or use microphone..."
                        className="w-full bg-transparent p-4 pr-12 text-sm focus:outline-none resize-none min-h-[60px] max-h-[150px] placeholder-gray-400"
                        rows={1}
                    />
                    
                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                        {/* Mic Button */}
                        <button
                            onClick={toggleListening}
                            className={`p-2 rounded-lg transition-colors shadow-sm flex items-center justify-center ${
                                isListening 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                            title="Voice Input"
                        >
                            {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>

                        {/* Send Button */}
                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CopilotPanel;
