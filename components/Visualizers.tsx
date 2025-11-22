import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, MousePointer2, MapPin, Tag, Users, Share2, X, Clock, Layout, List as ListIcon, LayoutGrid, Upload, ImageIcon, PanelRightClose, PanelRightOpen, PanelLeftClose, PanelLeftOpen, Circle, Square, Network } from 'lucide-react';
import { World, ThemeConfig, MapMarker, Character, Relation, CustomGraph, CustomNode, CustomEdge } from '../types';
import { ImageEditorModal } from './Shared';

// --- Timeline Widget ---
export const TimelineModule: React.FC<{ world: World, updateWorld: (w: Partial<World>) => void, theme: ThemeConfig, activeId?: string | null }> = ({ world, updateWorld, theme, activeId }) => {
    const [viewMode, setViewMode] = useState<'chart' | 'axis' | 'grid'>('chart');
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [editorState, setEditorState] = useState<{ isOpen: boolean; src: string | null }>({ isOpen: false, src: null });
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => { if(activeId) setSelectedEventId(activeId); }, [activeId]);

    const tracks = world.timelineTracks && world.timelineTracks.length > 0 ? world.timelineTracks : [{ id: 'default', name: '默认时间线', color: '#6366f1' }];
    const getYearNum = (yearStr: string) => { const num = parseInt(yearStr.replace(/[^0-9-]/g, '')); return isNaN(num) ? 0 : num; };
    const addEvent = () => { const newEvent = { id: `t-${Date.now()}`, year: "100", endYear: "", trackId: tracks[0].id, title: "新事件", description: "" }; updateWorld({ timeline: [...world.timeline, newEvent] }); setSelectedEventId(newEvent.id); };
    const updateEvent = (id: string, updates: any) => { updateWorld({ timeline: world.timeline.map((t) => t.id === id ? { ...t, ...updates } : t) }); };
    const deleteEvent = (id: string) => { updateWorld({ timeline: world.timeline.filter((t) => t.id !== id) }); if (selectedEventId === id) setSelectedEventId(null); };
    const addTrack = () => { updateWorld({ timelineTracks: [...(world.timelineTracks || []), { id: `tr-${Date.now()}`, name: "新时间线", color: "#94a3b8" }] }); };
    const updateTrack = (id: string, updates: any) => { updateWorld({ timelineTracks: tracks.map((t) => t.id === id ? { ...t, ...updates } : t) }); };
    const deleteTrack = (id: string) => { if (tracks.length <= 1) return; const newTracks = tracks.filter((t) => t.id !== id); updateWorld({ timeline: world.timeline.map((t) => t.trackId === id ? { ...t, trackId: newTracks[0].id } : t), timelineTracks: newTracks }); };

    const sortedTimeline = [...world.timeline].sort((a, b) => getYearNum(a.year) - getYearNum(b.year));
    const activeEvent = sortedTimeline.find(e => e.id === selectedEventId);
    const allYears = sortedTimeline.flatMap(e => [getYearNum(e.year), e.endYear ? getYearNum(e.endYear) : getYearNum(e.year)]);
    const minYear = allYears.length > 0 ? Math.min(...allYears) - 10 : 0;
    const maxYear = allYears.length > 0 ? Math.max(...allYears) + 10 : 100;
    const totalSpan = Math.max(50, maxYear - minYear);
    const pxPerYear = 10;
    const timeUnit = world.timeUnit || "年";

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
         const f = e.target.files?.[0]; 
         if(f) { 
             const url = URL.createObjectURL(f);
             setEditorState({ isOpen: true, src: url }); 
             e.target.value = ''; 
         } 
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4">
             <ImageEditorModal isOpen={editorState.isOpen} src={editorState.src} initialAspect={16/9} onClose={() => setEditorState({ ...editorState, isOpen: false })} onConfirm={(data) => { if (activeEvent) updateEvent(activeEvent.id, { image: data }); }} theme={theme} />
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                <div className="glass-panel p-3 rounded-xl flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4">
                        <h3 className={`text-lg font-bold flex items-center gap-2`}><Clock size={20} className="theme-text-accent" /> 历史时间线</h3>
                        <div className="bg-black/20 rounded-lg p-0.5 flex items-center border theme-border">
                            <button onClick={() => setViewMode('chart')} className={`p-1.5 rounded transition-all ${viewMode === 'chart' ? 'theme-item-active' : 'text-slate-400'}`}><Layout size={14}/></button>
                            <button onClick={() => setViewMode('axis')} className={`p-1.5 rounded transition-all ${viewMode === 'axis' ? 'theme-item-active' : 'text-slate-400'}`}><ListIcon size={14}/></button>
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'theme-item-active' : 'text-slate-400'}`}><LayoutGrid size={14}/></button>
                        </div>
                     </div>
                     <button onClick={addEvent} className={`flex items-center gap-1 px-3 py-1.5 text-white rounded text-sm theme-btn-primary`}><Plus size={14}/> 添加事件</button>
                </div>
                <div className="flex-1 glass-panel rounded-xl overflow-hidden relative flex flex-col">
                    {viewMode === 'chart' && (
                        <div className="flex-1 overflow-auto relative">
                            <div className="sticky top-0 left-0 right-0 h-12 bg-gradient-to-b from-[var(--color-bg-panel)] to-transparent border-b theme-border z-20 flex items-end pointer-events-none overflow-hidden" style={{ width: `${totalSpan * pxPerYear + 200}px` }}>
                                 <div className="h-full w-full relative">
                                    {Array.from({ length: Math.ceil(totalSpan / 10) + 2 }).map((_, i) => { const year = minYear + i * 10; const left = (year - minYear) * pxPerYear + 20; return ( <div key={i} className="absolute bottom-0 h-full border-l theme-border text-[10px] opacity-50 pl-1 select-none" style={{ left }}><span className="absolute bottom-1 left-1">{year}{timeUnit}</span></div> ) })}
                                 </div>
                            </div>
                            <div className="p-5 pb-20" style={{ width: `${totalSpan * pxPerYear + 200}px` }}>
                                <div className="space-y-4 mt-4">
                                    {tracks.map(track => {
                                        const trackEvents = sortedTimeline.filter(e => (e.trackId === track.id) || (!e.trackId && track.id === tracks[0].id));
                                        return (
                                        <div key={track.id} className="relative group/track">
                                            <div className="sticky left-0 z-10 mb-1 flex items-center gap-2"><div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: track.color }}></div><span className="text-xs font-bold uppercase tracking-wider glass-panel px-2 rounded">{track.name}</span></div>
                                            <div className="relative h-10 w-full bg-black/10 rounded border theme-border">
                                                {trackEvents.map((event, index) => {
                                                    const start = getYearNum(event.year); const end = event.endYear ? getYearNum(event.endYear) : start; const duration = Math.max(1, end - start); const left = (start - minYear) * pxPerYear + 20; const width = Math.max(20, duration * pxPerYear); const isSelected = selectedEventId === event.id;
                                                    const mod = index % 3; let filterStyle = '', bgPattern = 'none';
                                                    if (mod === 0) filterStyle = 'brightness(100%)'; else if (mod === 1) { filterStyle = 'brightness(115%) saturate(80%)'; bgPattern = 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px)'; } else { filterStyle = 'brightness(85%) saturate(120%)'; bgPattern = 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)'; }
                                                    return ( <div key={event.id} onClick={() => setSelectedEventId(event.id)} className={`absolute top-1 bottom-1 cursor-pointer transition-all group/event z-10 hover:z-20`} style={{ left, width: `${width}px` }}><div className={`w-full h-full overflow-hidden rounded-md px-2 flex items-center shadow-lg relative ${isSelected ? 'ring-2 ring-white z-20' : 'opacity-95 hover:opacity-100 hover:scale-[1.02]'} transition-transform`} style={{ backgroundColor: track.color, filter: filterStyle, backgroundImage: bgPattern }}><div className="text-[10px] font-bold text-white truncate drop-shadow-md flex items-center gap-2 w-full mix-blend-plus-lighter"><span>{event.title}</span>{width > 100 && <span className="opacity-70 font-normal">{event.description}</span>}</div></div></div> );
                                                })}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </div>
                    )}
                    {viewMode === 'axis' && (
                         <div className="p-8 overflow-y-auto max-w-4xl mx-auto w-full">
                            <div className="relative">
                                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px theme-border transform md:-translate-x-1/2" style={{borderLeftStyle:'solid', borderLeftWidth:'1px'}}></div>
                                {sortedTimeline.map((event, index) => {
                                    const isLeft = index % 2 === 0; const track = tracks.find(t => t.id === event.trackId) || tracks[0];
                                    return ( <div key={event.id} className={`relative flex items-center gap-8 mb-8 ${isLeft ? 'md:flex-row-reverse' : ''}`}><div className="flex-1 ml-16 md:ml-0 cursor-pointer group" onClick={() => setSelectedEventId(event.id)}><div className={`glass-panel p-4 rounded-xl transition-all relative overflow-hidden ${selectedEventId === event.id ? 'border-[var(--color-primary)]' : 'theme-item-hover'}`}><div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: track.color }}></div><div className="flex justify-between items-start mb-2 pl-2"><span className="text-xs font-mono text-slate-400 bg-black/20 px-2 py-0.5 rounded border theme-border">{event.year}{timeUnit}</span><span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: track.color}}></div>{track.name}</span></div><h4 className="font-bold text-lg mb-1 pl-2">{event.title}</h4><p className="text-sm text-slate-400 line-clamp-3 pl-2">{event.description}</p></div></div><div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"><div className="w-4 h-4 rounded-full border-2 border-[var(--color-bg-main)] shadow-lg ring-4 ring-[var(--color-bg-main)]" style={{ backgroundColor: track.color }}></div></div><div className="hidden md:block flex-1"></div></div> );
                                })}
                            </div>
                        </div>
                    )}
                    {viewMode === 'grid' && (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto">
                             {sortedTimeline.map((event) => ( <div key={event.id} onClick={() => setSelectedEventId(event.id)} className={`p-4 rounded-xl border bg-black/10 cursor-pointer transition-all flex gap-4 hover:bg-black/20 ${selectedEventId === event.id ? 'border-[var(--color-primary)]' : 'theme-border'}`}><div className="w-16 h-16 bg-black/30 rounded overflow-hidden shrink-0">{event.image ? <img src={event.image} className="w-full h-full object-cover" alt=""/> : <Clock size={24} className="m-auto text-slate-600 mt-5"/>}</div><div className="overflow-hidden"><div className="text-xs text-slate-500 font-mono mb-1">{event.year}{timeUnit}</div><div className="font-bold truncate">{event.title}</div><div className="text-xs text-slate-400 mt-1 line-clamp-2">{event.description}</div></div></div> ))}
                        </div>
                    )}
                    {selectedEventId && activeEvent && (
                        <div className="h-48 border-t theme-border glass-panel p-4 flex gap-6 animate-in slide-in-from-bottom-5 absolute bottom-0 w-full z-30">
                            <div className="w-40 shrink-0 relative group cursor-pointer bg-black/30 rounded-lg border theme-border overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                                {activeEvent.image ? <img src={activeEvent.image} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-slate-500 flex-col gap-2"><ImageIcon size={24}/><span className="text-xs">添加配图</span></div>}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"><Upload size={24} className="text-white"/>{activeEvent.image && <span className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded">点击编辑</span>}</div>
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload}/>
                            </div>
                            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
                                <div className="flex gap-3"><input value={activeEvent.year} onChange={(e) => updateEvent(activeEvent.id, { year: e.target.value })} className="w-24 theme-input rounded px-2 py-1 text-sm text-center" placeholder="开始年份"/><span className="text-slate-500 self-center">-</span><input value={activeEvent.endYear || ""} onChange={(e) => updateEvent(activeEvent.id, { endYear: e.target.value })} className="w-24 theme-input rounded px-2 py-1 text-sm text-center" placeholder="结束年份"/><select value={activeEvent.trackId || tracks[0].id} onChange={(e) => updateEvent(activeEvent.id, { trackId: e.target.value })} className="theme-input rounded px-2 py-1 text-sm outline-none">{tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><div className="flex-1"></div><button onClick={() => setSelectedEventId(null)} className="text-slate-500 hover:text-white"><X size={18}/></button></div>
                                <input value={activeEvent.title} onChange={(e) => updateEvent(activeEvent.id, { title: e.target.value })} className="bg-transparent text-lg font-bold border-b theme-border focus:border-[var(--color-primary)] outline-none" placeholder="事件标题"/>
                                <textarea value={activeEvent.description} onChange={(e) => updateEvent(activeEvent.id, { description: e.target.value })} className="w-full bg-transparent text-slate-400 text-sm resize-none focus:outline-none h-full" placeholder="事件描述..."/>
                                <div className="flex justify-end"><button onClick={() => deleteEvent(activeEvent.id)} className="text-red-400 text-xs hover:underline flex items-center gap-1"><Trash2 size={12}/> 删除事件</button></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className={`glass-panel rounded-xl flex flex-col transition-all duration-300 ${rightSidebarOpen ? 'w-64' : 'w-12'}`}>
                <div className="p-3 border-b theme-border flex justify-between items-center">{rightSidebarOpen && <span className="text-sm font-bold">时间线管理</span>}<button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className="text-slate-500 hover:text-white mx-auto">{rightSidebarOpen ? <PanelRightClose size={16}/> : <PanelRightOpen size={16}/>}</button></div>
                {rightSidebarOpen ? ( <div className="flex-1 overflow-y-auto p-3 space-y-3">{tracks.map(track => ( <div key={track.id} className="bg-black/20 rounded-lg p-3 border theme-border group"><div className="flex items-center gap-2 mb-2"><input type="color" value={track.color} onChange={(e) => updateTrack(track.id, { color: e.target.value })} className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"/><input value={track.name} onChange={(e) => updateTrack(track.id, { name: e.target.value })} className="flex-1 bg-transparent text-sm font-bold focus:outline-none border-b border-transparent focus:border-[var(--color-primary)]"/></div><div className="flex justify-between items-center text-xs text-slate-500"><span>{sortedTimeline.filter(e => e.trackId === track.id).length} 个事件</span>{tracks.length > 1 && ( <button onClick={() => deleteTrack(track.id)} className="hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button> )}</div></div>))}<button onClick={addTrack} className="w-full py-2 border border-dashed border-slate-500/50 rounded text-slate-500 text-sm hover:border-slate-400 hover:text-slate-300 transition-colors flex items-center justify-center gap-2"><Plus size={14}/> 新建时间线</button></div> ) : ( <div className="flex-1 flex flex-col items-center py-4 gap-2">{tracks.map(t => ( <div key={t.id} className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} title={t.name}></div> ))}</div> )}
            </div>
        </div>
    );
};

// --- Maps Module ---
export const MapsModule: React.FC<{ world: World, updateWorld: (w: Partial<World>) => void, theme: ThemeConfig, activeId?: string | null }> = ({ world, updateWorld, theme, activeId }) => {
  const [activeMapId, setActiveMapId] = useState(world.maps?.[0]?.id || "");
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [editorState, setEditorState] = useState<{ isOpen: boolean; src: string | null }>({ isOpen: false, src: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const maps = world.maps || [];
  const activeMap = maps.find((m) => m.id === activeMapId);
  const stringToColor = (str: string) => { let hash = 0; for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash); return `hsl(${hash % 360}, 70%, 50%)`; };
  
  useEffect(() => {
      if(activeId) {
          const mapWithMarker = maps.find(m => m.id === activeId || m.markers.some(mk => mk.id === activeId));
          if(mapWithMarker) {
              setActiveMapId(mapWithMarker.id);
              if(activeId !== mapWithMarker.id) setSelectedMarkerId(activeId);
          }
      }
  }, [activeId, maps]);

  useEffect(() => { setTransform({ scale: 1, x: 0, y: 0 }); }, [activeMapId]);
  const addMap = () => { const newMap = { id: `m-${Date.now()}`, name: "未命名地图", width: 800, height: 600, color: "#1e293b", markers: [] }; updateWorld({ maps: [...maps, newMap] }); setActiveMapId(newMap.id); };
  const updateActiveMap = (updates: any) => { if (!activeMap) return; updateWorld({ maps: maps.map((m) => m.id === activeMap.id ? { ...m, ...updates } : m) }); };
  const deleteMap = (id: string) => { const newMaps = maps.filter((m) => m.id !== id); updateWorld({ maps: newMaps }); if(activeMapId === id) setActiveMapId(newMaps[0]?.id || ""); };
  
  const handleContextMenu = (e: React.MouseEvent) => { e.preventDefault(); if (!activeMap) return; if ((e.target as HTMLElement).closest('.map-marker')) return; const rect = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - rect.left - transform.x) / transform.scale; const y = (e.clientY - rect.top - transform.y) / transform.scale; const newMarker = { id: `mk-${Date.now()}`, x, y, label: "新地点", description: "", type: "一般地点" }; updateActiveMap({ markers: [...activeMap.markers, newMarker] }); setSelectedMarkerId(newMarker.id); };
  const handleMapMouseDown = (e: React.MouseEvent) => { if ((e.target as HTMLElement).closest('.map-marker')) return; setIsDraggingMap(true); setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y }); };
  const handleMapMouseMove = (e: React.MouseEvent) => { if (isDraggingMap) { setTransform(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })); } };
  const handleMapMouseUp = () => { setIsDraggingMap(false); };
  const handleWheel = (e: React.WheelEvent) => { e.stopPropagation(); };
  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 5) }));
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.2) }));
  const resetZoom = () => setTransform({ scale: 1, x: 0, y: 0 });
  const updateMarker = (id: string, updates: any) => { if (!activeMap) return; updateActiveMap({ markers: activeMap.markers.map((m) => m.id === id ? { ...m, ...updates } : m) }); };
  const deleteMarker = (id: string) => { if (!activeMap) return; updateActiveMap({ markers: activeMap.markers.filter((m) => m.id !== id) }); };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {activeMap && ( <ImageEditorModal isOpen={editorState.isOpen} src={editorState.src} initialAspect={(activeMap.width && activeMap.height) ? activeMap.width / activeMap.height : 0} outputWidth={activeMap.width || 1200} onClose={() => setEditorState({ ...editorState, isOpen: false })} onConfirm={(data) => updateActiveMap({ backgroundImage: data })} theme={theme} /> )}
      <div className={`${leftSidebarOpen ? 'w-60' : 'w-12'} flex flex-col glass-panel rounded-xl shrink-0 transition-all duration-300`}>
         <div className={`p-4 border-b theme-border flex items-center ${leftSidebarOpen ? 'justify-between' : 'justify-center'}`}>
           {leftSidebarOpen && <h3 className="font-bold">地图列表</h3>}
           <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className="text-slate-500 hover:text-white">{leftSidebarOpen ? <PanelLeftClose size={16}/> : <PanelLeftOpen size={16}/>}</button>
         </div>
         {leftSidebarOpen ? (
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {maps.map((m) => ( <div key={m.id} onClick={() => setActiveMapId(m.id)} className={`p-2 rounded cursor-pointer flex justify-between items-center group ${activeMapId === m.id ? 'theme-item-active' : 'text-slate-400 theme-item-hover'}`}><span className="truncate text-sm">{m.name}</span><button onClick={(e) => {e.stopPropagation(); deleteMap(m.id)}} className="opacity-0 group-hover:opacity-100 hover:text-red-400"><Trash2 size={12}/></button></div>))}
             <button onClick={addMap} className={`w-full mt-2 p-1 text-white rounded flex items-center justify-center gap-2 text-xs theme-btn-primary`}><Plus size={14}/> 新建地图</button>
           </div>
         ) : (
           <div className="flex-1 flex flex-col items-center pt-4">
             <button onClick={addMap} className={`p-2 rounded-full theme-btn-primary`} title="新建地图"><Plus size={16}/></button>
           </div>
         )}
      </div>
      {activeMap ? (
        <div className="flex-1 flex flex-col gap-4 min-w-0">
           <div className="glass-panel p-2 rounded-lg flex items-center gap-4 relative z-50">
              <input value={activeMap.name} onChange={(e) => updateActiveMap({ name: e.target.value })} className="bg-transparent font-bold px-2 focus:outline-none border-b border-transparent focus:border-[var(--color-primary)]" />
              <div className="h-4 w-px bg-slate-600"></div>
              <div className="flex items-center gap-2 text-xs text-slate-400"><span>宽:</span><input type="number" value={activeMap.width} onChange={(e) => updateActiveMap({ width: parseInt(e.target.value) })} className="w-16 theme-input rounded px-1"/><span>高:</span><input type="number" value={activeMap.height} onChange={(e) => updateActiveMap({ height: parseInt(e.target.value) })} className="w-16 theme-input rounded px-1"/></div>
              <div className="h-4 w-px bg-slate-600"></div>
              <button onClick={() => setShowMapSettings(!showMapSettings)} className={`p-1.5 rounded text-slate-400 hover:text-white relative ${showMapSettings ? 'bg-slate-700 text-white' : ''}`} title="地图背景设置"><ImageIcon size={18} />{showMapSettings && ( <div className="absolute top-full left-0 mt-2 w-64 glass-panel rounded-lg shadow-xl p-4 z-50 flex flex-col gap-3 text-left animate-in fade-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}><div className="flex justify-between items-center"><h4 className="text-xs font-bold text-slate-400 uppercase">背景设置</h4><button onClick={(e) => {e.stopPropagation(); setShowMapSettings(false)}}><X size={14}/></button></div><div className="flex items-center justify-between"><span className="text-sm text-slate-300">背景颜色</span><input type="color" value={activeMap.color || "#1e293b"} onChange={(e) => updateActiveMap({ color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" /></div><div className="pt-2 border-t theme-border"><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if(file) { setEditorState({isOpen:true, src: URL.createObjectURL(file)}); e.target.value=''; } }}/><button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"><Upload size={12}/> 上传本地图片</button></div>{activeMap.backgroundImage && (<button onClick={() => updateActiveMap({ backgroundImage: undefined })} className="text-xs text-red-400 hover:underline text-center">清除背景图片</button>)}</div> )}</button>
              <div className="flex-1 text-right text-xs text-slate-500 flex justify-end items-center gap-2"><span className="flex items-center gap-1"><MousePointer2 size={12}/> 右键添加地点</span><span className="w-px h-3 bg-slate-600 mx-1"></span><span className="flex items-center gap-1">滚轮/拖动 缩放平移</span></div>
           </div>
           <div className="flex-1 bg-black/20 rounded-xl overflow-hidden border theme-border relative z-0 shadow-inner group/canvas">
              <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden"><button onClick={zoomIn} className="p-2 hover:bg-slate-700 text-slate-300"><ZoomIn size={16}/></button><button onClick={zoomOut} className="p-2 hover:bg-slate-700 text-slate-300"><ZoomOut size={16}/></button><button onClick={resetZoom} className="p-2 hover:bg-slate-700 text-slate-300 text-xs font-bold">1:1</button></div>
              <div className="w-full h-full overflow-hidden cursor-crosshair active:cursor-grabbing relative" onMouseDown={handleMapMouseDown} onMouseMove={handleMapMouseMove} onMouseUp={handleMapMouseUp} onMouseLeave={handleMapMouseUp} onContextMenu={handleContextMenu} onWheel={handleWheel}>
                  <div className="absolute transition-transform duration-75 origin-top-left shadow-2xl" style={{ width: activeMap.width, height: activeMap.height, backgroundColor: activeMap.color, backgroundImage: activeMap.backgroundImage ? `url(${activeMap.backgroundImage})` : 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: activeMap.backgroundImage ? '100% 100%' : '20px 20px', backgroundRepeat: 'no-repeat', transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}>
                     {activeMap.markers.map((marker) => {
                        const tagColor = marker.customColor || stringToColor(marker.type);
                        return (
                          <div key={marker.id} onClick={(e) => { e.stopPropagation(); setSelectedMarkerId(marker.id); }} className={`map-marker absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group transition-all ${selectedMarkerId === marker.id ? 'z-50 scale-125' : 'z-10'}`} style={{ left: marker.x, top: marker.y }}>
                               <MapPin size={24} className="drop-shadow-md" style={{ color: selectedMarkerId === marker.id ? '#fff' : tagColor, fill: '#0f172a' }} />
                               <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap text-xs font-bold px-1.5 py-0.5 rounded pointer-events-none transition-colors border shadow-sm flex items-center gap-1`} style={{ backgroundColor: '#0f172a', borderColor: tagColor, color: tagColor }}>{marker.label}</div>
                               {selectedMarkerId === marker.id && ( <div className="absolute top-8 left-0 glass-panel p-3 rounded-lg shadow-xl w-56 z-50 scale-75 origin-top-left" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}><div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-400">编辑地点</span><button onClick={() => setSelectedMarkerId(null)}><X size={12}/></button></div><input value={marker.label} onChange={(e) => updateMarker(marker.id, { label: e.target.value })} className="w-full theme-input rounded px-2 py-1 text-sm mb-2" placeholder="名称" /><div className="flex gap-1 mb-2"><div className="flex-1 relative"><input value={marker.type} onChange={(e) => updateMarker(marker.id, { type: e.target.value })} className="w-full theme-input rounded pl-6 pr-2 py-1 text-xs" placeholder="标签"/><Tag size={10} className="absolute left-2 top-1.5 text-slate-500"/></div><input type="color" value={marker.customColor || stringToColor(marker.type)} onChange={(e) => updateMarker(marker.id, { customColor: e.target.value })} className="w-6 h-full rounded cursor-pointer bg-transparent border border-slate-600 p-0" title="自定义标签颜色"/></div><textarea value={marker.description} onChange={(e) => updateMarker(marker.id, { description: e.target.value })} className="w-full theme-input rounded px-2 py-1 text-xs h-16 resize-none mb-2" placeholder="描述..."/><div className="flex justify-end"><button onClick={() => deleteMarker(marker.id)} className="text-red-400 hover:text-red-300"><Trash2 size={12}/></button></div></div> )}
                          </div>
                      )})}
                  </div>
              </div>
           </div>
        </div>
      ) : <div className="flex-1 flex items-center justify-center text-slate-500">请选择或创建一张地图</div>}
    </div>
  );
};

// --- Relations Module ---
export const RelationsModule: React.FC<{ world: World, updateWorld: (w: Partial<World>) => void, theme: ThemeConfig, activeId?: string | null }> = ({ world, updateWorld, theme, activeId }) => {
    const [activeGraphId, setActiveGraphId] = useState<string>("default");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // Character Graph State
    const characters = world.characters;
    const [newRel, setNewRel] = useState({ source: "", target: "", type: "" });
    const radius = 200; const centerX = 300; const centerY = 250;
    const getNodePos = (index: number, total: number) => { const angle = (index / total) * 2 * Math.PI - Math.PI / 2; return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) }; };
    const getCharacterPos = (id: string) => { const idx = characters.findIndex((c) => c.id === id); if (idx === -1) return { x: 0, y: 0 }; return getNodePos(idx, characters.length); };
    
    // Custom Graph State
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [linkingNode, setLinkingNode] = useState<string | null>(null);

    const customGraphs = world.customGraphs || [];
    const activeGraph = activeGraphId === "default" ? null : customGraphs.find(g => g.id === activeGraphId);

    useEffect(() => {
        if(activeId) {
            const graph = customGraphs.find(g => g.id === activeId);
            if(graph) setActiveGraphId(graph.id);
            else setActiveGraphId("default");
        }
    }, [activeId, customGraphs]);

    const addRelation = () => { if (!newRel.source || !newRel.target || !newRel.type) return; const rel = { id: `r-${Date.now()}`, sourceId: newRel.source, targetId: newRel.target, type: newRel.type }; updateWorld({ relations: [...world.relations, rel] }); setNewRel({ source: "", target: "", type: "" }); };
    const removeRelation = (id: string) => { updateWorld({ relations: world.relations.filter((r) => r.id !== id) }); };
    
    const addCustomGraph = () => { const newGraph: CustomGraph = { id: `cg-${Date.now()}`, name: "新关系网", nodes: [], edges: [] }; updateWorld({ customGraphs: [...customGraphs, newGraph] }); setActiveGraphId(newGraph.id); };
    const deleteCustomGraph = (id: string) => { updateWorld({ customGraphs: customGraphs.filter(g => g.id !== id) }); if(activeGraphId === id) setActiveGraphId("default"); };
    
    const addCustomNode = (type: 'person' | 'item' | 'event' | 'concept') => {
        if(!activeGraph) return;
        const newNode: CustomNode = { id: `cn-${Date.now()}`, x: 100 - pan.x, y: 100 - pan.y, label: "新节点", type };
        updateCustomGraph(activeGraph.id, { nodes: [...activeGraph.nodes, newNode] });
    };
    
    const updateCustomGraph = (graphId: string, updates: Partial<CustomGraph>) => {
        updateWorld({ customGraphs: customGraphs.map(g => g.id === graphId ? { ...g, ...updates } : g) });
    };

    const updateCustomNode = (nodeId: string, updates: Partial<CustomNode>) => {
        if(!activeGraph) return;
        updateCustomGraph(activeGraph.id, { nodes: activeGraph.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n) });
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if(activeGraphId === 'default') return;
        if((e.target as HTMLElement).closest('.node-element')) return;
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if(isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
        if(draggingNode && activeGraph) {
            const node = activeGraph.nodes.find(n => n.id === draggingNode);
            if(node) {
                updateCustomNode(draggingNode, { x: (e.clientX - dragOffset.x - pan.x) / scale, y: (e.clientY - dragOffset.y - pan.y) / scale });
            }
        }
    };

    const handleCanvasMouseUp = () => { setIsPanning(false); setDraggingNode(null); };

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        if(e.shiftKey) {
            setLinkingNode(nodeId);
        } else {
            setDraggingNode(nodeId);
            setDragOffset({ x: e.clientX - (activeGraph?.nodes.find(n=>n.id===nodeId)?.x || 0)*scale - pan.x, y: e.clientY - (activeGraph?.nodes.find(n=>n.id===nodeId)?.y || 0)*scale - pan.y });
        }
    };

    const handleNodeMouseUp = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        if(linkingNode && linkingNode !== nodeId && activeGraph) {
            const newEdge: CustomEdge = { id: `ce-${Date.now()}`, sourceId: linkingNode, targetId: nodeId, label: "" };
            updateCustomGraph(activeGraph.id, { edges: [...activeGraph.edges, newEdge] });
            setLinkingNode(null);
        }
        setDraggingNode(null);
    };

    return (
        <div className="h-full flex gap-6">
            <div className={`${sidebarOpen ? 'w-64' : 'w-12'} flex flex-col glass-panel rounded-xl border border-slate-700 shrink-0 transition-all duration-300`}>
                 <div className={`p-4 border-b theme-border flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                   {sidebarOpen && <h3 className="font-bold">关系网目录</h3>}
                   <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-white">{sidebarOpen ? <PanelLeftClose size={16}/> : <PanelLeftOpen size={16}/>}</button>
                 </div>
                 {sidebarOpen ? (
                     <div className="flex-1 overflow-y-auto p-2 space-y-1">
                         <div className="text-xs font-bold text-slate-500 uppercase px-2 mb-1">预设</div>
                         <div onClick={() => setActiveGraphId("default")} className={`p-2 rounded cursor-pointer flex items-center gap-2 ${activeGraphId === "default" ? `theme-item-active` : "text-slate-400 theme-item-hover"}`}>
                             <Users size={14} /> <span className="text-sm">角色关系网</span>
                         </div>
                         <div className="text-xs font-bold text-slate-500 uppercase px-2 mt-4 mb-1 flex justify-between items-center"><span>自定义</span><button onClick={addCustomGraph} className="hover:text-white"><Plus size={12}/></button></div>
                         {customGraphs.map(g => (
                             <div key={g.id} onClick={() => setActiveGraphId(g.id)} className={`p-2 rounded cursor-pointer flex justify-between items-center group ${activeGraphId === g.id ? `theme-item-active` : "text-slate-400 theme-item-hover"}`}>
                                 <div className="flex items-center gap-2 overflow-hidden"><Network size={14}/><span className="text-sm truncate">{g.name}</span></div>
                                 <button onClick={(e) => {e.stopPropagation(); deleteCustomGraph(g.id)}} className="opacity-0 group-hover:opacity-100 hover:text-red-400"><Trash2 size={12}/></button>
                             </div>
                         ))}
                         {customGraphs.length === 0 && <div className="text-xs text-slate-600 px-2 text-center py-2">暂无自定义图谱</div>}
                     </div>
                 ) : (
                     <div className="flex-1 flex flex-col items-center pt-4 gap-2">
                         <button onClick={() => setActiveGraphId("default")} className={`p-2 rounded-lg ${activeGraphId==="default"?"theme-item-active":"text-slate-500"}`}><Users size={16}/></button>
                         <div className="w-4 h-px bg-slate-700"></div>
                         {customGraphs.map(g => <button key={g.id} onClick={() => setActiveGraphId(g.id)} className={`p-2 rounded-lg ${activeGraphId===g.id?"theme-item-active":"text-slate-500"}`}><Network size={16}/></button>)}
                         <button onClick={addCustomGraph} className="p-2 text-slate-500 hover:text-white"><Plus size={16}/></button>
                     </div>
                 )}
            </div>

            <div className="flex-1 flex flex-col min-w-0 gap-4 h-full">
                {activeGraphId === "default" ? (
                    <div className="flex-1 flex gap-6 h-full">
                         <div className="w-1/3 glass-panel p-4 rounded-xl border border-slate-700 z-10">
                            <h4 className="font-bold mb-3 text-sm">添加新关系</h4>
                            <div className="space-y-3">
                                <select className="w-full theme-input rounded px-2 py-1.5 text-sm" value={newRel.source} onChange={(e) => setNewRel({...newRel, source: e.target.value})}><option value="">选择角色 A</option>{characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                <select className="w-full theme-input rounded px-2 py-1.5 text-sm" value={newRel.target} onChange={(e) => setNewRel({...newRel, target: e.target.value})}><option value="">选择角色 B</option>{characters.map((c) => ( c.id !== newRel.source && <option key={c.id} value={c.id}>{c.name}</option>))}</select>
                                <input type="text" className="w-full theme-input rounded px-2 py-1.5 text-sm placeholder-slate-500" placeholder="关系类型" value={newRel.type} onChange={(e) => setNewRel({...newRel, type: e.target.value})}/>
                                <button onClick={addRelation} disabled={!newRel.source || !newRel.target || !newRel.type} className={`w-full text-white rounded py-1.5 text-sm font-medium transition-colors disabled:opacity-50 theme-btn-primary`}>建立连接</button>
                            </div>
                            <div className="mt-6 max-h-60 overflow-y-auto space-y-2 border-t theme-border pt-4">
                                 {world.relations.map((r) => { const s = characters.find((c) => c.id === r.sourceId)?.name || "Unknown"; const t = characters.find((c) => c.id === r.targetId)?.name || "Unknown"; return ( <div key={r.id} className="flex justify-between items-center text-xs bg-black/20 p-2 rounded"><span className="text-slate-300">{s} <span className="theme-text-accent">--{r.type}--&gt;</span> {t}</span><button onClick={() => removeRelation(r.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={12}/></button></div> ) })}
                            </div>
                         </div>
                         <div className="flex-1 flex justify-center items-center rounded-xl border theme-border relative overflow-hidden" style={{background: 'var(--color-bg-main)'}}>
                            <svg width="100%" height="100%" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid meet">
                                 <defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--color-text-muted)" /></marker></defs>
                                {world.relations.map((r) => { const start = getCharacterPos(r.sourceId); const end = getCharacterPos(r.targetId); if (start.x === 0 || end.x === 0) return null; return ( <g key={r.id}><line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="var(--color-text-muted)" strokeWidth="1.5" markerEnd="url(#arrowhead)"/><text x={(start.x + end.x) / 2} y={(start.y + end.y) / 2 - 5} textAnchor="middle" fill="var(--color-text-muted)" fontSize="10" style={{background: 'var(--color-bg-main)'}}>{r.type}</text></g> ); })}
                                {characters.map((c, idx) => { const pos = getNodePos(idx, characters.length); return ( <g key={c.id} className="cursor-pointer hover:opacity-80 transition-opacity"><circle cx={pos.x} cy={pos.y} r="20" fill="var(--color-bg-panel)" stroke="var(--color-primary)" strokeWidth="2" /><foreignObject x={pos.x - 10} y={pos.y - 10} width="20" height="20"><div className={`w-full h-full flex items-center justify-center theme-text-accent`}><Users size={12} /></div></foreignObject><text x={pos.x} y={pos.y + 35} textAnchor="middle" fill="var(--color-text-main)" fontSize="12" fontWeight="bold">{c.name}</text><text x={pos.x} y={pos.y + 48} textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">{c.role}</text></g> ); })}
                            </svg>
                            {characters.length === 0 && <div className="absolute text-slate-500">暂无角色，请前往角色页面添加</div>}
                         </div>
                    </div>
                ) : activeGraph ? (
                    <div className="flex-1 flex flex-col h-full relative">
                        <div className="absolute top-4 left-4 z-10 flex gap-2 glass-panel p-1 rounded-lg shadow-lg">
                            <button onClick={() => addCustomNode('person')} className="p-2 hover:bg-white/10 rounded text-slate-300" title="添加人物"><Users size={16}/></button>
                            <button onClick={() => addCustomNode('item')} className="p-2 hover:bg-white/10 rounded text-slate-300" title="添加物品"><Square size={16}/></button>
                            <button onClick={() => addCustomNode('event')} className="p-2 hover:bg-white/10 rounded text-slate-300" title="添加事件"><Circle size={16}/></button>
                            <div className="w-px bg-slate-600 mx-1"></div>
                            <input type="text" value={activeGraph.name} onChange={(e) => updateCustomGraph(activeGraph.id, { name: e.target.value })} className="bg-transparent text-sm w-32 px-2 focus:outline-none" />
                        </div>
                        <div className="absolute bottom-4 left-4 z-10 text-xs text-slate-500 bg-black/50 p-2 rounded">Shift+拖拽节点以创建连接</div>

                        <div className="flex-1 bg-black/5 rounded-xl border theme-border relative overflow-hidden cursor-crosshair" 
                             onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}>
                            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                                    <defs><marker id="arrowhead-custom" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--color-text-muted)" /></marker></defs>
                                    {activeGraph.edges.map(edge => {
                                        const source = activeGraph.nodes.find(n => n.id === edge.sourceId);
                                        const target = activeGraph.nodes.find(n => n.id === edge.targetId);
                                        if (!source || !target) return null;
                                        return (
                                            <g key={edge.id}>
                                                <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="var(--color-text-muted)" strokeWidth="2" markerEnd="url(#arrowhead-custom)" />
                                                <foreignObject x={(source.x+target.x)/2 - 40} y={(source.y+target.y)/2 - 10} width="80" height="20">
                                                    <input value={edge.label} onChange={(e) => updateCustomGraph(activeGraph.id, { edges: activeGraph.edges.map(ed => ed.id === edge.id ? { ...ed, label: e.target.value } : ed) })} className="w-full h-full bg-slate-900 text-xs text-center text-slate-300 border border-slate-700 rounded pointer-events-auto focus:outline-none focus:border-indigo-500" placeholder="关系" />
                                                </foreignObject>
                                                <foreignObject x={(source.x+target.x)/2 + 45} y={(source.y+target.y)/2 - 10} width="20" height="20">
                                                    <button onClick={() => updateCustomGraph(activeGraph.id, { edges: activeGraph.edges.filter(ed => ed.id !== edge.id) })} className="pointer-events-auto text-slate-600 hover:text-red-400"><X size={12}/></button>
                                                </foreignObject>
                                            </g>
                                        );
                                    })}
                                    {linkingNode && draggingNode && (
                                        <line x1={activeGraph.nodes.find(n=>n.id===linkingNode)?.x} y1={activeGraph.nodes.find(n=>n.id===linkingNode)?.y} x2={activeGraph.nodes.find(n=>n.id===draggingNode)?.x || 0} y2={activeGraph.nodes.find(n=>n.id===draggingNode)?.y || 0} stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="5,5" />
                                    )}
                                </svg>
                                {activeGraph.nodes.map(node => (
                                    <div key={node.id} className="node-element absolute flex flex-col items-center" style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }} onMouseDown={(e) => handleNodeMouseDown(e, node.id)} onMouseUp={(e) => handleNodeMouseUp(e, node.id)}>
                                        <div className={`w-12 h-12 rounded-full bg-[var(--color-bg-panel)] border-2 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform ${linkingNode === node.id ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>
                                            {node.type === 'person' && <Users size={20} className="text-indigo-400"/>}
                                            {node.type === 'item' && <Square size={20} className="text-amber-400"/>}
                                            {node.type === 'event' && <Circle size={20} className="text-rose-400"/>}
                                            {node.type === 'concept' && <Tag size={20} className="text-emerald-400"/>}
                                        </div>
                                        <input value={node.label} onChange={(e) => updateCustomNode(node.id, { label: e.target.value })} className="mt-2 bg-black/60 text-white text-xs text-center w-24 border border-slate-700 rounded px-1 focus:outline-none" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} />
                                        <button onClick={(e) => { e.stopPropagation(); updateCustomGraph(activeGraph.id, { nodes: activeGraph.nodes.filter(n => n.id !== node.id), edges: activeGraph.edges.filter(ed => ed.sourceId !== node.id && ed.targetId !== node.id) }) }} className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-0.5 text-slate-500 hover:text-red-400 border border-slate-700"><X size={10}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : <div className="flex-1 flex items-center justify-center text-slate-500">请选择或创建一个图谱</div>}
            </div>
        </div>
    );
};