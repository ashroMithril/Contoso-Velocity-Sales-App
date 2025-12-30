import React, { useEffect, useState } from 'react';
import { getSessions, clearHistory } from '../services/historyService';
import { ChatSession } from '../types';
import { MessageSquare, Clock, Trash2, ChevronRight } from 'lucide-react';

const HistoryView: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const handleClear = () => {
      if(confirm('Clear all history?')) {
          clearHistory();
          setSessions([]);
      }
  };

  return (
    <div className="flex-1 bg-white p-12 overflow-y-auto font-sans">
       <div className="max-w-4xl mx-auto">
           <header className="mb-10 flex items-end justify-between border-b border-black pb-4">
               <div>
                   <h1 className="text-3xl font-light text-black">Chat History</h1>
                   <p className="text-gray-500 mt-2">Your past conversations with Copilot.</p>
               </div>
               {sessions.length > 0 && (
                   <button onClick={handleClear} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                       <Trash2 className="w-3 h-3" /> Clear History
                   </button>
               )}
           </header>

           {sessions.length === 0 ? (
               <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                   <Clock className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                   <p className="text-gray-500">No history saved yet.</p>
               </div>
           ) : (
               <div className="space-y-4">
                   {sessions.map((session) => (
                       <div key={session.id} className="group p-6 bg-white border border-gray-100 hover:border-black rounded-lg transition-all cursor-pointer shadow-sm hover:shadow-md">
                           <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-3">
                                   <div className="p-2 bg-gray-100 rounded-md group-hover:bg-black group-hover:text-white transition-colors">
                                       <MessageSquare className="w-4 h-4" />
                                   </div>
                                   <h3 className="font-medium text-lg">{session.title}</h3>
                               </div>
                               <span className="text-xs text-gray-400 font-mono">
                                   {session.date.toLocaleDateString()} • {session.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                               </span>
                           </div>
                           <p className="text-gray-500 text-sm pl-12 line-clamp-2">{session.previewText}</p>
                           <div className="mt-4 pl-12 flex items-center text-xs font-semibold text-black opacity-0 group-hover:opacity-100 transition-opacity">
                               Resume Chat <ChevronRight className="w-3 h-3 ml-1" />
                           </div>
                       </div>
                   ))}
               </div>
           )}
       </div>
    </div>
  );
};

export default HistoryView;