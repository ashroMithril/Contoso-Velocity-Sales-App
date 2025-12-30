import React, { useState, useEffect, useRef } from 'react';
import { ArtifactData, DocumentComment } from '../types';
import { 
    FileText, 
    Presentation, 
    ArrowLeft, 
    Download, 
    Share2, 
    Sparkles, 
    Loader2, 
    Check, 
    MessageSquarePlus, 
    User, 
    X, 
    AtSign,
    MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ArtifactViewerProps {
  data: ArtifactData;
  onBack: () => void;
  onRefine: (selectedText: string, instruction: string) => Promise<ArtifactData | null>;
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ data, onBack, onRefine }) => {
  const [viewMode, setViewMode] = useState<'doc' | 'ppt'>('doc');
  
  // Selection & Toolbar State
  const [toolbarPosition, setToolbarPosition] = useState<{top: number, left: number} | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionMode, setSelectionMode] = useState<'initial' | 'ai' | 'comment'>('initial');
  
  // Feature State
  const [instruction, setInstruction] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [showCommentSidebar, setShowCommentSidebar] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Text Selection
  useEffect(() => {
    const handleSelection = () => {
        const selection = window.getSelection();
        // If we are currently typing in an input, don't clear the toolbar
        if (document.activeElement?.tagName === 'INPUT') return;

        if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Calculate position relative to the viewport
            setToolbarPosition({
                top: rect.top - 50,
                left: rect.left + (rect.width / 2)
            });
            setSelectedText(selection.toString());
            setSelectionMode('initial'); // Reset to initial choice menu
        } else {
            // Only hide if we aren't explicitly in a mode that requires focus
            setToolbarPosition(null);
            setSelectedText('');
            setSelectionMode('initial');
        }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const handleRefineSubmit = async () => {
      if (!selectedText || !instruction) return;
      setIsRefining(true);
      await onRefine(selectedText, instruction);
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

  return (
    <div className="h-full flex flex-col bg-gray-50 animate-in fade-in duration-500 relative overflow-hidden">
      
      {/* Refine Overlay */}
      {isRefining && (
          <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-white p-4 rounded-xl shadow-2xl flex items-center gap-3 border border-gray-200">
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                  <span className="font-medium text-sm">Refining document with Copilot...</span>
              </div>
          </div>
      )}

      {/* Floating Selection Toolbar */}
      {toolbarPosition && !isRefining && viewMode === 'doc' && (
          <div 
            className="fixed z-50 transform -translate-x-1/2 animate-in zoom-in-95 duration-200 shadow-2xl rounded-full"
            style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
          >
              {selectionMode === 'initial' && (
                  <div className="flex bg-black text-white rounded-full p-1 border border-gray-800">
                      <button 
                        onClick={() => setSelectionMode('ai')}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded-full transition-colors border-r border-gray-700"
                      >
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-semibold">Ask Copilot</span>
                      </button>
                      <button 
                        onClick={() => setSelectionMode('comment')}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded-full transition-colors"
                      >
                          <MessageSquarePlus className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs font-semibold">Comment</span>
                      </button>
                  </div>
              )}

              {selectionMode === 'ai' && (
                   <div className="flex items-center gap-2 bg-black p-2 rounded-xl w-[320px]">
                        <Sparkles className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
                        <input 
                            type="text" 
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="Ex: Make this more professional..."
                            className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 focus:ring-0 focus:outline-none h-8"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleRefineSubmit()}
                        />
                        <button 
                            onClick={handleRefineSubmit}
                            className="bg-white text-black p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Check className="w-3 h-3" />
                        </button>
                   </div>
              )}

              {selectionMode === 'comment' && (
                   <div className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-xl w-[320px] shadow-xl">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-3 h-3 text-gray-500" />
                        </div>
                        <input 
                            type="text" 
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            placeholder="Add a comment or @mention..."
                            className="flex-1 bg-transparent border-none text-xs text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none h-8"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                         <button 
                            onClick={handleAddComment}
                            className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Check className="w-3 h-3" />
                        </button>
                   </div>
              )}
          </div>
      )}

      {/* Header Toolbar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
             <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                title="Back to Dashboard"
             >
                 <ArrowLeft className="w-4 h-4" />
             </button>
             <div className="h-6 w-px bg-gray-200 mx-2"></div>
             <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('doc')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${viewMode === 'doc' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                >
                    <FileText className="w-3.5 h-3.5" /> Document
                </button>
                <button 
                    onClick={() => setViewMode('ppt')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${viewMode === 'ppt' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                >
                    <Presentation className="w-3.5 h-3.5" /> Slides
                </button>
             </div>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={() => setShowCommentSidebar(!showCommentSidebar)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${showCommentSidebar ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
             >
                <MessageSquare className="w-3.5 h-3.5" />
                Comments 
                {comments.length > 0 && <span className="bg-blue-600 text-white px-1.5 rounded-full text-[10px]">{comments.length}</span>}
             </button>
             <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 text-gray-600">
                <Download className="w-3.5 h-3.5" /> Export
             </button>
             <button className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800">
                <Share2 className="w-3.5 h-3.5" /> Share
             </button>
        </div>
      </div>

      {/* Main Layout: Canvas + Comment Sidebar */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* Document Canvas */}
          <div className="flex-1 overflow-y-auto p-12 bg-gray-50/50" ref={containerRef}>
            <div className="max-w-4xl mx-auto">
                {viewMode === 'doc' ? (
                    <div className="bg-white shadow-xl min-h-[1000px] p-16 text-gray-800 border border-gray-200 transition-all selection:bg-blue-100 selection:text-blue-900">
                        <article className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-normal prose-p:leading-relaxed">
                            <ReactMarkdown>{data.documentContent}</ReactMarkdown>
                        </article>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {data.presentationContent.split('---').map((slide, idx) => {
                            if(!slide.trim()) return null;
                            return (
                                <div key={idx} className="bg-white aspect-video p-12 shadow-lg border border-gray-200 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
                                    <div className="prose prose-lg max-w-none">
                                        <ReactMarkdown>{slide}</ReactMarkdown>
                                    </div>
                                    <div className="border-t border-gray-100 pt-6 flex justify-between items-center text-xs text-gray-400 font-mono">
                                        <span>CONFIDENTIAL // CONTOSO</span>
                                        <span>{idx + 1}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
          </div>

          {/* Comment Sidebar */}
          {showCommentSidebar && (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl animate-in slide-in-from-right duration-300 z-10">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-gray-900">Comments</h3>
                      <button onClick={() => setShowCommentSidebar(false)} className="text-gray-400 hover:text-black">
                          <X className="w-4 h-4" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {comments.length === 0 ? (
                          <div className="text-center py-10">
                              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <MessageSquarePlus className="w-5 h-5 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">No comments yet.</p>
                              <p className="text-xs text-gray-400 mt-1">Select text to add one.</p>
                          </div>
                      ) : (
                          comments.map(comment => (
                              <div key={comment.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200 group hover:border-blue-300 transition-colors">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                          {comment.author[0]}
                                      </div>
                                      <span className="text-xs font-bold text-gray-900">{comment.author}</span>
                                      <span className="text-[10px] text-gray-400 ml-auto">
                                          {comment.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                  </div>
                                  
                                  {/* Context Quote */}
                                  <div className="pl-2 border-l-2 border-gray-300 mb-2">
                                      <p className="text-[10px] text-gray-500 line-clamp-2 italic">"{comment.selectedContext}"</p>
                                  </div>

                                  <p className="text-xs text-gray-800 leading-relaxed">
                                      {comment.text.split(' ').map((word, i) => 
                                          word.startsWith('@') ? <span key={i} className="text-blue-600 font-medium">{word} </span> : word + ' '
                                      )}
                                  </p>

                                  {comment.taggedUsers && comment.taggedUsers.length > 0 && (
                                      <div className="mt-2 flex gap-1">
                                          {comment.taggedUsers.map((tag, i) => (
                                              <span key={i} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-medium flex items-center gap-0.5">
                                                  <AtSign className="w-2 h-2" /> {tag.replace('@', '')}
                                              </span>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default ArtifactViewer;