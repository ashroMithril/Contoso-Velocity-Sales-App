import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { getCalendarEvents } from '../services/dataService';
import { 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    Video, 
    AlertTriangle, 
    Sparkles, 
    Calendar as CalendarIcon, 
    LayoutList,
    Grid3X3,
    CheckCircle2
} from 'lucide-react';

interface CalendarViewProps {
    onEventClick: (event: CalendarEvent) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onEventClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'MONTH' | 'DAY'>('MONTH');

    useEffect(() => {
        setEvents(getCalendarEvents());
    }, []);

    // --- Logic ---
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    };

    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 10); // Show top 10 in sidebar

    const handlePrev = () => {
        if (viewMode === 'MONTH') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
        }
    };

    const handleNext = () => {
        if (viewMode === 'MONTH') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
        }
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // --- RENDERERS ---

    const renderMonthView = () => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

        return (
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="grid grid-cols-7 gap-4 mb-4">
                    {weekDays.map(d => (
                        <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2 md:gap-4 auto-rows-fr">
                    {days.map((date, idx) => {
                        if (!date) return <div key={idx} className="bg-gray-50/30 rounded-xl min-h-[100px] md:min-h-[140px]" />;
                        
                        const dayEvents = events.filter(e => isSameDay(new Date(e.date), date));
                        const isToday = isSameDay(date, new Date());
                        const isSelected = isSameDay(date, selectedDate);

                        return (
                            <div 
                                key={idx} 
                                onClick={() => { setSelectedDate(date); setViewMode('DAY'); setCurrentDate(date); }}
                                className={`relative bg-white border rounded-2xl p-2 md:p-3 min-h-[100px] md:min-h-[140px] flex flex-col transition-all hover:shadow-md cursor-pointer ${
                                    isToday ? 'border-indigo-600 ring-1 ring-indigo-600' : 
                                    isSelected ? 'border-gray-300' : 'border-gray-200'
                                }`}
                            >
                                <div className={`text-sm font-semibold mb-2 flex justify-between ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                                    <span>{date.getDate()}</span>
                                    {dayEvents.length > 0 && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded-full">{dayEvents.length}</span>}
                                </div>
                                <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar max-h-[100px]">
                                    {dayEvents.slice(0, 3).map(ev => (
                                        <button
                                            key={ev.id}
                                            onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                                            className={`w-full text-left text-[10px] px-2 py-1.5 rounded-lg truncate transition-all font-medium flex items-center gap-1.5 border border-transparent ${
                                                ev.type === 'meeting' ? 'bg-blue-50 text-blue-700 hover:border-blue-200' :
                                                ev.type === 'deadline' ? 'bg-amber-50 text-amber-700 hover:border-amber-200' :
                                                'bg-gray-100 text-gray-700 hover:border-gray-200'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                ev.type === 'meeting' ? 'bg-blue-500' : 
                                                ev.type === 'deadline' ? 'bg-amber-500' : 'bg-gray-400'
                                            }`} />
                                            <span className="truncate">{ev.title}</span>
                                        </button>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-[10px] text-gray-400 pl-2 font-medium">
                                            + {dayEvents.length - 3} more...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        // Hours from 8 AM to 6 PM
        const hours = Array.from({ length: 11 }, (_, i) => i + 8); 
        const dayEvents = events.filter(e => isSameDay(new Date(e.date), currentDate));

        return (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Day Header */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                         <div>
                             <h2 className="text-2xl font-bold text-gray-900">{currentDate.toLocaleDateString(undefined, { weekday: 'long' })}</h2>
                             <p className="text-gray-500">{currentDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                         </div>
                         <div className="text-right">
                             <div className="text-3xl font-light text-indigo-600">{dayEvents.length}</div>
                             <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Events Today</div>
                         </div>
                    </div>
                    
                    {/* Hourly Grid */}
                    <div className="divide-y divide-gray-100">
                        {hours.map(hour => {
                            const hourEvents = dayEvents.filter(e => new Date(e.date).getHours() === hour);
                            const isCurrentHour = new Date().getHours() === hour && isSameDay(currentDate, new Date());

                            return (
                                <div key={hour} className={`flex min-h-[100px] group ${isCurrentHour ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}`}>
                                    {/* Time Label */}
                                    <div className="w-24 p-4 text-xs font-bold text-gray-400 border-r border-gray-100 text-right shrink-0">
                                        {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                    </div>
                                    
                                    {/* Events Area */}
                                    <div className="flex-1 p-2 space-y-2">
                                        {hourEvents.map(ev => (
                                            <div 
                                                key={ev.id}
                                                onClick={() => onEventClick(ev)}
                                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all shadow-sm hover:shadow-md ${
                                                    ev.type === 'meeting' ? 'bg-blue-50 border-blue-100 hover:border-blue-300' :
                                                    ev.type === 'deadline' ? 'bg-amber-50 border-amber-100 hover:border-amber-300' :
                                                    'bg-white border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${
                                                        ev.type === 'meeting' ? 'bg-blue-100 text-blue-600' :
                                                        ev.type === 'deadline' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {ev.type === 'meeting' ? <Video className="w-4 h-4" /> : 
                                                         ev.type === 'deadline' ? <AlertTriangle className="w-4 h-4" /> : 
                                                         <Clock className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-900">{ev.title}</div>
                                                        <div className="text-xs text-gray-500">{ev.description}</div>
                                                    </div>
                                                </div>
                                                <button className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity px-3 py-1 bg-white/50 rounded-lg">
                                                    <Sparkles className="w-3 h-3" /> Prep
                                                </button>
                                            </div>
                                        ))}
                                        {hourEvents.length === 0 && (
                                            <div className="h-full flex items-center px-4">
                                                <div className="h-px w-full border-t border-dashed border-gray-200 group-hover:border-gray-300"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full bg-white font-sans overflow-hidden">
            
            {/* Sidebar: Agenda */}
            <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col hidden lg:flex">
                <div className="p-6 border-b border-gray-200 bg-white">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-indigo-600" /> Agenda
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Upcoming schedule & tasks</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {upcomingEvents.map(event => (
                        <div 
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group relative overflow-hidden"
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                event.type === 'meeting' ? 'bg-blue-500' : event.type === 'deadline' ? 'bg-amber-500' : 'bg-gray-400'
                            }`}></div>
                            <div className="flex justify-between items-start mb-1 pl-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                    {event.type}
                                </span>
                                <span className="text-xs text-gray-900 font-bold bg-gray-100 px-2 py-0.5 rounded-md">
                                    {new Date(event.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                </span>
                            </div>
                            <h3 className="font-bold text-sm text-gray-900 mb-1 pl-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{event.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 pl-2 mb-2">{event.description}</p>
                            
                            <div className="pl-2 pt-2 border-t border-gray-50 flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {new Date(event.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    ))}
                    {upcomingEvents.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm">No upcoming events found.</div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                
                {/* Header Toolbar */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {viewMode === 'MONTH' 
                                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                                : currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                            }
                        </h1>
                        <p className="text-sm text-gray-500 hidden md:block">
                            {viewMode === 'MONTH' ? 'Overview of scheduled activities' : 'Daily breakdown and time slots'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* View Switcher */}
                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                            <button 
                                onClick={() => setViewMode('MONTH')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                                    viewMode === 'MONTH' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Grid3X3 className="w-3.5 h-3.5" /> Month
                            </button>
                            <button 
                                onClick={() => setViewMode('DAY')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                                    viewMode === 'DAY' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <LayoutList className="w-3.5 h-3.5" /> Day
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                            <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm text-gray-600 hover:text-black" title="Previous">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={handleToday} className="px-3 py-1.5 text-xs font-bold hover:bg-white rounded-md transition-all text-gray-700 hover:text-black">
                                Today
                            </button>
                            <button onClick={handleNext} className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm text-gray-600 hover:text-black" title="Next">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Render Grid based on Mode */}
                {viewMode === 'MONTH' ? renderMonthView() : renderDayView()}
                
            </div>
        </div>
    );
};

export default CalendarView;