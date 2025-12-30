import React, { useState, useEffect, useRef } from 'react';
import { Artifact, ArtifactData, DocumentComment } from '../types';
import { getArtifacts, saveArtifact } from '../services/artifactService';
import { copilotService } from '../services/geminiService';
import { 
    FileText, 
    Presentation, 
    ArrowLeft, 
    Share2, 
    Sparkles, 
    Loader2, 
    Check, 
    MessageSquarePlus, 
    X, 
    MessageSquare,
    Search,
    Clock,
    Filter,
    File,
    Mail,
    Briefcase,
    Send,
    Users,
    Mic,
    Video,
    Play,
    Pause
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ArtifactViewerProps {
  initialArtifactId?: string | null;
  onBackToDashboard: () => void;
  onRefine: (selectedText: string, instruction: string) => Promise<string | null>;
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ initialArtifactId, onBackToDashboard, onRefine }) => {
  // Navigation State
  const [viewState, setViewState] = useState<'LIST' | 'DETAIL'>('LIST');
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  
  // List View State
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail View State (Editor)
  const [viewMode, setViewMode] = useState<'doc' | 'ppt' | 'media'>('doc');
  const [toolbarPosition, setToolbarPosition] = useState<{top: number, left: number} | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionMode, setSelectionMode] = useState<'initial' | 'ai' | 'comment'>('initial');
  const [instruction, setInstruction] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);

  // Sharing State
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareToast, setShareToast] = useState<{show: boolean, msg: string}>({show: false, msg: ''});
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  
  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Data
  useEffect(() => {
    setArtifacts(getArtifacts());
  }, [viewState]); // Refresh when switching views

  // Handle Initial Load or Prop Change
  useEffect(() => {
    if (initialArtifactId) {
        const found = getArtifacts().find(a => a.id === initialArtifactId);
        if (found) {
            setCurrentArtifact(found);
            setViewState('DETAIL');
            // Auto select media tab if it's a media type
            if (found.content.audioContent || found.content.videoUri) {
                setViewMode('media');
            } else {
                setViewMode('doc');
            }
        }
    } else {
        // Only force list if we aren't already viewing something intentionally
        if (!initialArtifactId && viewState !== 'DETAIL') {
             setViewState('LIST');
        }
    }
  }, [initialArtifactId]);

  // Cleanup Audio Context on Unmount/Change
  useEffect(() => {
      return () => {
          if (audioSourceRef.current) {
              audioSourceRef.current.stop();
          }
          if (audioContextRef.current) {
              audioContextRef.current.close();
          }
      };
  }, [currentArtifact]);

  // --- List View Logic ---
  const filteredArtifacts = artifacts.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconForType = (type: string) => {
      switch(type) {
          case 'Proposal': return <FileText className="w-5 h-5 text-indigo-600" />;
          case 'Meeting Brief': return <Presentation className="w-5 h-5 text-orange-600" />;
          case 'Email': return <Mail className="w-5 h-5 text-green-600" />;
          case 'Handoff': return <Briefcase className="w-5 h-5 text-blue-600" />;
          case 'VoiceOver': return <Mic className="w-5 h-5 text-pink-600" />;
          case 'DemoVideo': return <Video className="w-5 h-5 text-purple-600" />;
          default: return <File className="w-5 h-5 text-gray-500" />;
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Finalized': return 'bg-green-100 text-green-700 border-green-200';
          case 'In Review': return 'bg-amber-100 text-amber-700 border-amber-200';
          case 'Sent': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-gray-100 text-gray-600 border-gray-200';
      }
  };

  // --- Detail View Logic (Selection & AI) ---
  useEffect(() => {
    if (viewState !== 'DETAIL') return;

    const handleSelection = () => {
        const selection = window.getSelection();
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

        if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setToolbarPosition({
                top: rect.top - 60,
                left: rect.left + (rect.width / 2)
            });
            setSelectedText(selection.toString());
            setSelectionMode('initial');
        } else {
            setToolbarPosition(null);
            setSelectedText('');
            setSelectionMode('initial');
        }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [viewState]);

  const handleRefineSubmit = async () => {
      if (!selectedText || !instruction || !currentArtifact) return;
      setIsRefining(true);
      
      const newContent = await copilotService.refineArtifact(
          currentArtifact.content.documentContent,
          selectedText,
          instruction
      );
      
      if (newContent) {
          const updatedArtifact = { 
              ...currentArtifact, 
              lastModified: new Date(),
              content: { ...currentArtifact.content, documentContent: newContent }
          };
          setCurrentArtifact(updatedArtifact);
          saveArtifact(updatedArtifact);
      }
      
      setIsRefining(false);
      setToolbarPosition(null);
      setInstruction('');
      window.getSelection()?.removeAllRanges();
  };

  const handleAddComment = () => {
      if (!selectedText || !commentInput) return;
      const newComment: DocumentComment = {
          id: Date.now().toString(),
          author: 'You',
          text: commentInput,
          selectedContext: selectedText,
          timestamp: new Date(),
          taggedUsers: commentInput.match(/@\w+/g) || []
      };
      setComments(prev => [newComment, ...prev]);
      setCommentInput('');
      setToolbarPosition(null);
      setShowCommentSidebar(true);
      window.getSelection()?.removeAllRanges();
  };

  const handleShareColleague = () => {
      setShowShareMenu(false);
      setShareToast({show: true, msg: 'Shared successfully with team.'});
      setTimeout(() => setShareToast({show: false, msg: ''}), 3000);
  };

  const handleShareEmail = async () => {
      if (!currentArtifact) return;
      setShowShareMenu(false);
      setShowEmailModal(true);
      setIsGeneratingEmail(true);
      const draft = await copilotService.generateEmailForArtifact(currentArtifact);
      setEmailDraft(draft);
      setIsGeneratingEmail(false);
  };

  const handleSendEmail = () => {
      setShowEmailModal(false);
      setShareToast({show: true, msg: 'Email sent successfully.'});
      setTimeout(() => setShareToast({show: false, msg: ''}), 3000);
      
      // Update artifact status locally if needed
      if (currentArtifact) {
          const updated = {...currentArtifact, status: 'Sent' as const};
          setCurrentArtifact(updated);
          saveArtifact(updated);
      }
  };

  // --- Audio Playback Logic ---
  const handleToggleAudio = async () => {
      if (isPlayingAudio) {
          if (audioSourceRef.current) audioSourceRef.current.stop();
          setIsPlayingAudio(false);
          return;
      }

      if (!currentArtifact?.content.audioContent) return;

      try {
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }

          // Decode Base64
          const binaryString = atob(currentArtifact.content.audioContent);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Decode Audio Data
          const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
          
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          
          source.onended = () => setIsPlayingAudio(false);
          
          audioSourceRef.current = source;
          source.start();
          setIsPlayingAudio(true);
      } catch (e) {
          console.error("Error playing audio", e);
          setShareToast({show: true, msg: 'Error playing audio.'});
          setTimeout(() => setShareToast({show: false, msg: ''}), 3000);
      }
  };

  // --- RENDERERS ---

  if (viewState === 'LIST') {
      return (
          <div className="h-full flex flex-col bg-gray-50/50">
              {/* List Header */}
              <div className="bg-white border-b border-gray-200 px-8 py-6">
                  <div className="max-w-6xl mx-auto">
                      <div className="flex items-center justify-between mb-6">
                          <div>
                              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Artifacts</h1>
                              <p className="text-sm text-gray-500 mt-1">Manage proposals, briefs, videos, and voice-overs generated by Copilot.</p>
                          </div>
                          <button onClick={onBackToDashboard} className="md:hidden p-2 bg-gray-100 rounded-full">
                              <ArrowLeft className="w-5 h-5" />
                          </button>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1 relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text" 
                                placeholder="Search artifacts..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm outline-none"
                              />
                          </div>
                          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 text-gray-700">
                              <Filter className="w-4 h-4" /> Filter
                          </button>
                      </div>
                  </div>
              </div>

              {/* Grid Content */}
              <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredArtifacts.map((artifact) => (
                          <div 
                            key={artifact.id}
                            onClick={() => { setCurrentArtifact(artifact); setViewState('DETAIL'); }}
                            className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group flex flex-col h-[280px]"
                          >
                              <div className="flex items-start justify-between mb-4">
                                  <div className={`p-3 rounded-xl bg-gray-50 group-hover:bg-indigo-50 transition-colors`}>
                                      {getIconForType(artifact.type)}
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(artifact.status)}`}>
                                      {artifact.status}
                                  </span>
                              </div>
                              
                              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{artifact.title}</h3>
                              <p className="text-sm text-gray-500 mb-6">{artifact.companyName}</p>
                              
                              <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                  <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5" />
                                      {new Date(artifact.lastModified).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="font-semibold text-indigo-600">Open</span>
                                      <ArrowLeft className="w-3 h-3 rotate-180 text-indigo-600" />
                                  </div>
                              </div>
                          </div>
                      ))}
                      
                      {/* Empty State */}
                      {filteredArtifacts.length === 0 && (
                          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                              <File className="w-12 h-12 mb-4 text-gray-300" />
                              <p>No artifacts found matching your search.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- DETAIL VIEW RENDER ---
  if (!currentArtifact) return null;

  const hasMedia = currentArtifact.content.audioContent || currentArtifact.content.videoUri;

  return (
    <div className="h-full flex flex-col bg-gray-50/50 animate-in fade-in duration-300 relative overflow-hidden font-sans">
      
      {/* Toast */}
      {shareToast.show && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-4">
              <Check className="w-4 h-4 text-green-400" /> {shareToast.msg}
          </div>
      )}

      {/* Email Modal */}
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
                              <p className="text-gray-500 text-sm">Drafting email context for {currentArtifact.companyName}...</p>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <div className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm">
                                  <span className="text-gray-500 text-right">To:</span>
                                  <input type="text" className="w-full border-b border-gray-200 focus:border-indigo-600 outline-none py-1" placeholder="Recipient..." />
                              </div>
                              <div className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm">
                                  <span className="text-gray-500 text-right">Subject:</span>
                                  <input type="text" className="w-full border-b border-gray-200 focus:border-indigo-600 outline-none py-1" defaultValue={`Review: ${currentArtifact.title}`} />
                              </div>
                              <div className="pt-4">
                                  <textarea 
                                    className="w-full h-64 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed"
                                    value={emailDraft}
                                    onChange={(e) => setEmailDraft(e.target.value)}
                                  />
                              </div>
                              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium">
                                  <FileText className="w-4 h-4" /> Attached: {currentArtifact.title}.{currentArtifact.content.videoUri ? 'mp4' : currentArtifact.content.audioContent ? 'mp3' : 'pdf'}
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

      {/* Refine Overlay */}
      {isRefining && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-gray-200">
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                  <span className="font-medium text-sm text-gray-900">Refining document...</span>
              </div>
          </div>
      )}

      {/* Floating Toolbar */}
      {toolbarPosition && !isRefining && viewMode === 'doc' && (
          <div 
            className="fixed z-50 transform -translate-x-1/2 animate-in zoom-in-95 duration-200 drop-shadow-2xl"
            style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
          >
              {selectionMode === 'initial' && (
                  <div className="flex bg-gray-900 text-white rounded-full p-1.5 border border-gray-700 shadow-xl">
                      <button onClick={() => setSelectionMode('ai')} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 rounded-full transition-colors border-r border-gray-700">
                          <Sparkles className="w-4 h-4 text-purple-400" /> <span className="text-xs font-bold">Ask Velocity</span>
                      </button>
                      <button onClick={() => setSelectionMode('comment')} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 rounded-full transition-colors">
                          <MessageSquarePlus className="w-4 h-4 text-blue-400" /> <span className="text-xs font-bold">Comment</span>
                      </button>
                  </div>
              )}
              {selectionMode === 'ai' && (
                   <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-xl w-[320px] border border-gray-700 shadow-xl">
                        <input type="text" value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Instruction..." className="flex-1 bg-transparent border-none text-xs text-white h-9 focus:ring-0" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleRefineSubmit()} />
                        <button onClick={handleRefineSubmit} className="bg-white text-black p-1.5 rounded-lg"><Check className="w-4 h-4" /></button>
                   </div>
              )}
               {selectionMode === 'comment' && (
                   <div className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-xl w-[320px] shadow-2xl">
                        <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Comment..." className="flex-1 bg-transparent border-none text-xs text-black h-9 focus:ring-0" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                        <button onClick={handleAddComment} className="bg-blue-600 text-white p-1.5 rounded-lg"><Check className="w-4 h-4" /></button>
                   </div>
              )}
          </div>
      )}

      {/* Detail Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 md:gap-5">
             <button 
                onClick={() => setViewState('LIST')}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors text-xs font-bold uppercase tracking-wide"
             >
                 <ArrowLeft className="w-4 h-4" /> All Artifacts
             </button>
             <div className="h-6 w-px bg-gray-200 mx-1"></div>
             <div className="flex flex-col">
                 <h2 className="text-sm font-bold text-gray-900 leading-none">{currentArtifact.title}</h2>
                 <span className="text-[10px] text-gray-500 mt-1">{currentArtifact.status} • Last edited {new Date(currentArtifact.lastModified).toLocaleTimeString()}</span>
             </div>
        </div>
        <div className="flex items-center gap-3">
             <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/50 mr-4">
                <button onClick={() => setViewMode('doc')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex gap-2 ${viewMode === 'doc' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}><FileText className="w-3.5 h-3.5"/> Doc</button>
                <button onClick={() => setViewMode('ppt')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex gap-2 ${viewMode === 'ppt' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}><Presentation className="w-3.5 h-3.5"/> Slides</button>
                {hasMedia && (
                    <button onClick={() => setViewMode('media')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex gap-2 ${viewMode === 'media' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>
                        {currentArtifact.content.videoUri ? <Video className="w-3.5 h-3.5"/> : <Mic className="w-3.5 h-3.5" />} 
                        Media
                    </button>
                )}
             </div>
             <button onClick={() => setShowCommentSidebar(!showCommentSidebar)} className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                 <MessageSquare className="w-5 h-5" />
                 {comments.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>}
             </button>
             
             {/* Email Button */}
             <button 
                onClick={handleShareEmail}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                title="Send via Email"
             >
                 <Mail className="w-5 h-5" />
             </button>
             
             {/* Share Button Dropdown */}
             <div className="relative">
                 <button onClick={() => setShowShareMenu(!showShareMenu)} className={`px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 shadow-sm flex items-center gap-2 ${showShareMenu ? 'ring-2 ring-offset-1 ring-black' : ''}`}>
                     <Share2 className="w-3.5 h-3.5" /> Share
                 </button>
                 {showShareMenu && (
                     <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-30 animate-in fade-in zoom-in-95 duration-200">
                         <button onClick={handleShareColleague} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                             <Users className="w-4 h-4 text-indigo-600" /> With Colleague
                         </button>
                         <button onClick={handleShareEmail} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                             <Mail className="w-4 h-4 text-green-600" /> Send as Email
                         </button>
                     </div>
                 )}
                 {showShareMenu && <div className="fixed inset-0 z-20" onClick={() => setShowShareMenu(false)} />}
             </div>
        </div>
      </div>

      {/* Editor/Viewer Canvas */}
      <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-gray-100/50" ref={containerRef}>
            <div className="max-w-4xl mx-auto">
                {viewMode === 'doc' ? (
                    <div className="bg-white shadow-sm min-h-[1000px] p-8 md:p-20 text-gray-800 border border-gray-200 rounded-sm">
                        <article className="prose prose-sm max-w-none prose-headings:font-serif">
                            <ReactMarkdown>{currentArtifact.content.documentContent}</ReactMarkdown>
                        </article>
                    </div>
                ) : viewMode === 'ppt' ? (
                    <div className="space-y-6 md:space-y-10">
                        {currentArtifact.content.presentationContent.split('---').map((slide, idx) => {
                            if(!slide.trim()) return null;
                            return (
                                <div key={idx} className="bg-white aspect-video p-6 md:p-14 shadow-lg border border-gray-200 flex flex-col justify-between rounded-xl relative overflow-hidden">
                                    <div className="prose prose-sm md:prose-lg max-w-none">
                                        <ReactMarkdown>{slide}</ReactMarkdown>
                                    </div>
                                    <div className="border-t border-gray-100 pt-6 flex justify-between items-center text-xs text-gray-400 font-mono">
                                        <span>CONFIDENTIAL // {currentArtifact.companyName.toUpperCase()}</span>
                                        <span>{idx + 1}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    // Media View
                    <div className="flex flex-col items-center gap-8">
                        {currentArtifact.content.videoUri ? (
                            <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video relative group">
                                <video 
                                    src={currentArtifact.content.videoUri} 
                                    controls 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-medium">
                                    Demo Video • Veo 3.1
                                </div>
                            </div>
                        ) : currentArtifact.content.audioContent ? (
                             <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-6 border border-gray-200">
                                 <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isPlayingAudio ? 'bg-pink-100 animate-pulse' : 'bg-gray-100'}`}>
                                     <Mic className={`w-10 h-10 ${isPlayingAudio ? 'text-pink-600' : 'text-gray-400'}`} />
                                 </div>
                                 <div className="text-center">
                                     <h3 className="font-bold text-xl text-gray-900">Voice Over Preview</h3>
                                     <p className="text-sm text-gray-500 mt-1">Generated by Gemini 2.5 Flash TTS</p>
                                 </div>
                                 <button 
                                    onClick={handleToggleAudio}
                                    className="flex items-center gap-3 px-8 py-3 bg-black text-white rounded-full font-bold hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                                 >
                                     {isPlayingAudio ? (
                                         <><Pause className="w-5 h-5" /> Stop Playback</>
                                     ) : (
                                         <><Play className="w-5 h-5" /> Play Audio</>
                                     )}
                                 </button>
                             </div>
                        ) : (
                            <div className="text-gray-400">No media available for this artifact.</div>
                        )}

                        <div className="w-full max-w-4xl bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                             <h4 className="font-bold text-sm text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">Transcript / Prompt</h4>
                             <div className="prose prose-sm max-w-none text-gray-600">
                                 <ReactMarkdown>{currentArtifact.content.documentContent}</ReactMarkdown>
                             </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
          
          {/* Comment Sidebar */}
          {showCommentSidebar && (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl z-10">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold text-sm">Comments</h3><button onClick={()=>setShowCommentSidebar(false)}><X className="w-4 h-4"/></button></div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {comments.map(c => (
                          <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                              <div className="font-bold text-xs mb-1">{c.author}</div>
                              <p>{c.text}</p>
                          </div>
                      ))}
                      {comments.length === 0 && <div className="text-center text-gray-400 text-xs mt-10">No comments yet.</div>}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default ArtifactViewer;