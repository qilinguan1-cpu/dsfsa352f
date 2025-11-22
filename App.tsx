import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Users, Clock, Share2, Plus, Trash2, ChevronRight,
  Map as MapIcon, Layout, ScrollText, LayoutTemplate,
  X, Image as ImageIcon, Upload, PanelLeftClose, Folder,
  FileText, ChevronDown, Menu, UploadCloud, PanelLeftOpen, Key, User, Palette, LogOut, Settings, Moon, Sun, Search
} from 'lucide-react';
import { World, ThemeConfig } from './types';
import { BlockEditor, SectionCard, ImageEditorModal, useImageBrightness, DeleteConfirmModal } from './components/Shared';
import { TimelineModule, MapsModule, RelationsModule } from './components/Visualizers';
import { generateWorldContent } from './services/geminiService';

// --- Constants ---
const DEFAULT_WORLD: World = {
  id: "world-1",
  name: "艾瑟瑞亚 (Aetheria)",
  description: "一个漂浮在巨大水晶之上的天空世界。",
  descriptionBlocks: [{ id: 'b1', type: 'text', content: "一个漂浮在巨大水晶之上的天空世界，人们依靠飞空艇往来于各个浮岛之间。魔法与蒸汽朋克科技共存。" }],
  genre: "奇幻/蒸汽朋克",
  theme: "indigo",
  timeUnit: "年",
  concepts: [{ id: "cp1", title: "核心法则", category: "自然规律", content: "", blocks: [{id:'b1', type:'text', content: "重力由核心水晶控制。"}] }],
  characters: [{ id: "c1", name: "艾琳·风行者", role: "飞艇船长", race: "人类", description: "前皇家空军王牌飞行员。" }],
  timelineTracks: [{ id: "track-1", name: "主世界历史", color: "#6366f1" }],
  timeline: [{ id: "t1", trackId: "track-1", year: "AE 102", title: "大崩坏", description: "地面世界崩塌。" }],
  relations: [],
  customGraphs: [],
  lore: [],
  maps: [],
  lastModified: Date.now()
};

const THEMES: Record<string, any> = {
  indigo: { primary: '#6366f1', bgMain: '#0f172a', bgPanel: '#1e293b', textMain: '#e2e8f0', textMuted: '#94a3b8' },
  rose:   { primary: '#f43f5e', bgMain: '#1c1917', bgPanel: '#292524', textMain: '#e7e5e4', textMuted: '#a8a29e' },
  emerald:{ primary: '#10b981', bgMain: '#064e3b', bgPanel: '#065f46', textMain: '#ecfdf5', textMuted: '#6ee7b7' },
  amber:  { primary: '#f59e0b', bgMain: '#292524', bgPanel: '#451a03', textMain: '#fef3c7', textMuted: '#d6d3d1' },
  slate:  { primary: '#94a3b8', bgMain: '#020617', bgPanel: '#1e293b', textMain: '#f8fafc', textMuted: '#64748b' },
};

// --- Overview Module ---
const OverviewModule: React.FC<{ world: World; updateWorld: (w: Partial<World>) => void; theme: ThemeConfig; exportWorld: () => void; activeId?: string | null }> = ({ world, updateWorld, theme, exportWorld, activeId }) => {
  const [editorState, setEditorState] = useState<{ isOpen: boolean; src: string | null }>({ isOpen: false, src: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set<string>());
  const [conceptSidebarOpen, setConceptSidebarOpen] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);

  const concepts = world.concepts || [];
  const categories = Array.from(new Set(concepts.map((c) => c.category || "基本概念")));
  const selectedConcept = concepts.find((c) => c.id === selectedConceptId);
  const isCoverDark = useImageBrightness(world.coverImage);

  useEffect(() => { 
      if(activeId) {
          const concept = concepts.find(c => c.id === activeId);
          if(concept) {
              setSelectedConceptId(concept.id);
              if(concept.category) setExpandedCategories(prev => new Set(prev).add(concept.category));
          }
      } else if (!selectedConceptId && concepts.length > 0) {
          setSelectedConceptId(concepts[0].id);
      }
      if (expandedCategories.size === 0 && categories.length > 0) setExpandedCategories(new Set(categories)); 
  }, [categories.length, concepts.length, activeId]);

  const handleConceptAI = async () => {
    if(!selectedConcept) return;
    setLoadingAI(true);
    try {
      const text = await generateWorldContent("rules", "", `${selectedConcept.title} (${selectedConcept.category})`, world.name, world.genre);
      if(text) { const blocks = selectedConcept.blocks || []; updateWorld({ concepts: concepts.map(c => c.id === selectedConcept.id ? { ...c, blocks: [...blocks, { id: `b-${Date.now()}`, type: 'text', content: text }] } : c) }); }
    } finally { setLoadingAI(false); }
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)] overflow-y-auto pb-10 pr-2">
       <ImageEditorModal isOpen={editorState.isOpen} src={editorState.src} initialAspect={16/9} outputWidth={1200} theme={theme} onClose={() => setEditorState({ ...editorState, isOpen: false })} onConfirm={(data) => updateWorld({ coverImage: data })} />
      <div className="glass-panel rounded-xl overflow-hidden shrink-0 relative group min-h-[250px] flex flex-col justify-end shadow-2xl">
           <div className="absolute inset-0 bg-slate-900">
                {world.coverImage ? ( <img src={world.coverImage} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-700" alt="Cover"/> ) : ( <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900"></div> )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-main)] via-transparent to-transparent"></div>
           </div>
           <div className={`relative p-8 flex flex-col md:flex-row justify-between items-end gap-6 z-10 ${isCoverDark ? 'text-white' : 'text-slate-900'}`}>
                <div className="flex-1 space-y-4 w-full">
                    <div className="flex items-center gap-6">
                         <div className="w-24 h-24 rounded-lg border-2 border-white/20 shadow-2xl overflow-hidden bg-slate-800 shrink-0 group/icon cursor-pointer relative" onClick={() => fileInputRef.current?.click()} title="点击更换封面">{world.coverImage ? <img src={world.coverImage} className="w-full h-full object-cover" alt="Cover"/> : <ImageIcon className="text-slate-600 m-auto h-full w-1/2"/>}<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity"><Upload className="text-white"/></div></div>
                         <div className="flex-1 min-w-0">
                            <input type="text" value={world.name} onChange={(e)=>updateWorld({name: e.target.value})} className={`bg-transparent text-4xl font-bold focus:outline-none border-b border-transparent focus:border-current w-full placeholder-slate-500 truncate shadow-black/50 drop-shadow-lg ${isCoverDark ? 'text-white' : 'text-slate-900 placeholder-slate-700'}`} placeholder="未命名世界"/>
                            <input type="text" value={world.genre} onChange={(e)=>updateWorld({genre: e.target.value})} className={`bg-transparent text-lg focus:outline-none border-b border-transparent focus:border-current mt-1 w-full ${isCoverDark ? 'text-slate-300 placeholder-slate-400' : 'text-slate-800 placeholder-slate-600'}`} placeholder="设定类型 (如: 蒸汽朋克)"/>
                         </div>
                    </div>
                </div>
                <div className="flex gap-3 shrink-0"><button onClick={exportWorld} className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-lg"><Share2 size={16}/> 导出</button></div>
           </div>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {const f = e.target.files?.[0]; if(f) setEditorState({isOpen:true, src: URL.createObjectURL(f)})}}/>
      </div>
      
      <SectionCard title="世界简介" icon={ScrollText} theme={theme}>
          <BlockEditor blocks={world.descriptionBlocks} onChange={(newBlocks) => updateWorld({ descriptionBlocks: newBlocks })} theme={theme} placeholder="在此处输入世界的核心介绍、起源故事或地理概貌..." />
      </SectionCard>

      <div className="flex flex-col gap-4 h-[700px] shrink-0">
          <div className="flex items-center gap-2 font-bold px-1"><LayoutTemplate size={20} className="theme-text-accent"/><h3 className="text-lg">世界概念</h3></div>
         <div className="glass-panel rounded-xl flex flex-1 overflow-hidden">
            <div className={`${conceptSidebarOpen ? 'w-60' : 'w-12'} border-r theme-border flex flex-col shrink-0 transition-all duration-300`}>
                 <div className={`p-3 border-b theme-border flex items-center ${conceptSidebarOpen ? 'justify-between' : 'justify-center'}`}>{conceptSidebarOpen && <h3 className="font-bold text-sm truncate">目录</h3>}<button onClick={() => setConceptSidebarOpen(!conceptSidebarOpen)} className="text-slate-500 hover:text-white">{conceptSidebarOpen ? <PanelLeftClose size={16}/> : <PanelLeftOpen size={16}/>}</button></div>
                 {conceptSidebarOpen ? (
                    <div className="flex-1 overflow-y-auto p-2">
                        {categories.sort().map(cat => (
                            <div key={cat} className="mb-1">
                                <div onClick={() => {const n = new Set(expandedCategories); n.has(cat)?n.delete(cat):n.add(cat); setExpandedCategories(n)}} className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded cursor-pointer transition-colors">{expandedCategories.has(cat) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}<span className="font-medium flex-1 truncate">{cat}</span></div>
                                {expandedCategories.has(cat) && ( <div className="ml-4 pl-2 border-l theme-border mt-1 space-y-0.5">{concepts.filter((c) => c.category === cat).map((c) => ( <div key={c.id} onClick={() => setSelectedConceptId(c.id)} className={`flex items-center justify-between px-2 py-1 text-sm rounded cursor-pointer transition-all ${selectedConceptId === c.id ? `theme-item-active` : "text-slate-400 theme-item-hover"}`}><span className="truncate">{c.title}</span></div> ))}<button onClick={() => { const nc = {id:`cp-${Date.now()}`, title:"新概念", category:cat, content:"", blocks:[]}; updateWorld({concepts:[...concepts, nc]}); setSelectedConceptId(nc.id); }} className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500 hover:text-slate-300 w-full text-left"><Plus size={10}/> 新建...</button></div> )}
                            </div>
                        ))}
                    </div>
                 ) : ( <div className="flex-1 flex flex-col items-center pt-4 gap-4"><button className={`p-2 rounded-full theme-btn-primary`} title="新建概念"><Plus size={16}/></button></div> )}
            </div>
            <div className="flex-1 p-6 overflow-y-auto relative">
                 {selectedConcept ? (
                     <div className="max-w-4xl mx-auto pb-20">
                        <div className="flex justify-between items-start mb-6 pb-4 border-b theme-border">
                            <div className="flex-1 space-y-2">
                                <input type="text" value={selectedConcept.title} onChange={(e) => updateWorld({ concepts: concepts.map(c => c.id === selectedConcept.id ? { ...c, title: e.target.value } : c) })} className="w-full bg-transparent text-3xl font-bold border-b border-transparent hover:border-slate-700 focus:border-[var(--color-primary)] focus:outline-none pb-1 transition-colors" placeholder="概念标题" />
                                <div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-white/10 rounded text-xs text-slate-400 border theme-border">分类</span><input type="text" value={selectedConcept.category} onChange={(e) => updateWorld({ concepts: concepts.map(c => c.id === selectedConcept.id ? { ...c, category: e.target.value } : c) })} className="bg-transparent border-b theme-border text-sm text-slate-300 focus:outline-none focus:border-[var(--color-primary)] py-0.5" placeholder="输入分类..." /></div>
                            </div>
                            <button onClick={() => { const nc = concepts.filter(c => c.id !== selectedConcept.id); updateWorld({concepts: nc}); if(nc.length) setSelectedConceptId(nc[0].id); else setSelectedConceptId(null); }} className="text-slate-500 hover:text-red-400 p-2 hover:bg-white/10 rounded" title="删除"><Trash2 size={18}/></button>
                        </div>
                        <BlockEditor blocks={selectedConcept.blocks || []} onChange={(newBlocks) => updateWorld({ concepts: concepts.map(c => c.id === selectedConcept.id ? { ...c, blocks: newBlocks } : c) })} theme={theme} />
                     </div>
                 ) : ( <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 select-none"><LayoutTemplate size={64} className="opacity-10"/><p>从左侧选择一个世界概念，或创建一个新概念。</p></div> )}
            </div>
         </div>
      </div>
    </div>
  );
};

// --- Lore Module ---
const LoreModule: React.FC<{ world: World; updateWorld: (w: Partial<World>) => void; theme: ThemeConfig; activeId?: string | null }> = ({ world, updateWorld, theme, activeId }) => {
  const [selectedLoreId, setSelectedLoreId] = useState(world.lore?.[0]?.id || null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const lores = world.lore || [];
  const selectedLore = lores.find((l) => l.id === selectedLoreId);

  useEffect(() => { if(activeId) setSelectedLoreId(activeId); }, [activeId]);
  
  const handleAIGen = async () => { 
    if (!selectedLore) return;
    setLoadingAI(true);
    try {
      const content = await generateWorldContent("lore", "", `${selectedLore.title} (${selectedLore.category})`, world.name, world.genre);
      if (content) { updateWorld({ lore: lores.map(l => l.id === selectedLore.id ? { ...l, blocks: [...l.blocks, { id: `b-${Date.now()}`, type: 'text', content }] } : l) }); }
    } finally { setLoadingAI(false); }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
       <div className={`${sidebarOpen ? 'w-72' : 'w-12'} flex flex-col glass-panel rounded-xl border border-slate-700 overflow-hidden shrink-0 transition-all duration-300`}>
         <div className={`p-4 border-b theme-border flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
           {sidebarOpen && <h3 className="font-bold">设定集目录</h3>}
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-white">{sidebarOpen ? <PanelLeftClose size={16}/> : <PanelLeftOpen size={16}/>}</button>
         </div>
         {sidebarOpen ? (
            <>
              <div className="p-2 border-b theme-border"><button onClick={() => {const nl={id:`l-${Date.now()}`, title:"新词条", category:"未分类", content:"", blocks:[]}; updateWorld({lore:[...lores, nl]}); setSelectedLoreId(nl.id)}} className={`w-full flex items-center justify-center gap-2 p-1.5 text-white rounded text-xs theme-btn-primary`} title="新建词条"><Plus size={14}/> 新建词条</button></div>
              <div className="flex-1 overflow-y-auto p-2 select-none">
                  {Array.from(new Set(lores.map(l => l.category))).sort().map(cat => (
                      <div key={cat} className="mb-1">
                          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded cursor-pointer transition-colors"><Folder size={14} className="text-amber-500"/><span className="font-medium flex-1">{cat}</span></div>
                          <div className="ml-2 pl-2 border-l theme-border mt-1 space-y-0.5">{lores.filter((l) => l.category === cat).map((l) => ( <div key={l.id} onClick={() => setSelectedLoreId(l.id)} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer transition-all ${selectedLoreId === l.id ? `theme-item-active` : "text-slate-400 theme-item-hover"}`}><FileText size={12} className={selectedLoreId === l.id ? "text-white" : "text-slate-600"}/><span className="truncate">{l.title}</span></div> ))}</div>
                      </div>
                  ))}
              </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center pt-4"><button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-full theme-btn-primary`}><Plus size={16}/></button></div>
         )}
      </div>
      <div className="flex-1 glass-panel rounded-xl border border-slate-700 p-8 overflow-y-auto flex flex-col min-w-0 relative">
        {selectedLore ? (
           <div className="max-w-3xl mx-auto w-full pb-20">
              <div className="flex justify-between items-start mb-6 pb-4 border-b theme-border">
                  <div className="flex-1 space-y-4">
                      <input type="text" value={selectedLore.title} onChange={(e) => updateWorld({ lore: lores.map(l => l.id === selectedLore.id ? { ...l, title: e.target.value } : l) })} className="w-full bg-transparent text-4xl font-bold border-b border-transparent hover:border-slate-700 focus:border-[var(--color-primary)] focus:outline-none pb-2 transition-colors" placeholder="词条标题" />
                      <div className="flex items-center gap-2"><span className="px-2 py-1 bg-white/10 rounded text-xs text-slate-400 border theme-border">分类</span><input type="text" value={selectedLore.category} onChange={(e) => updateWorld({ lore: lores.map(l => l.id === selectedLore.id ? { ...l, category: e.target.value } : l) })} className="bg-transparent border-b theme-border text-sm text-slate-300 focus:outline-none focus:border-[var(--color-primary)] py-0.5" placeholder="输入分类..." /></div>
                  </div>
                  <button onClick={() => {const nl=lores.filter(l=>l.id!==selectedLore.id); updateWorld({lore:nl}); setSelectedLoreId(nl[0]?.id||null)}} className="text-slate-500 hover:text-red-400 p-2 hover:bg-white/10 rounded transition-colors" title="删除词条"><Trash2 size={18}/></button>
              </div>
              <BlockEditor blocks={selectedLore.blocks || []} onChange={(newBlocks) => updateWorld({ lore: lores.map(l => l.id === selectedLore.id ? { ...l, blocks: newBlocks } : l) })} theme={theme} />
           </div>
        ) : ( <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 select-none"><ScrollText size={64} className="opacity-10"/><p>从左侧目录选择一个词条，或创建一个新词条。</p></div> )}
      </div>
    </div>
  );
};

// --- Characters Module ---
const CharactersModule: React.FC<{ world: World; updateWorld: (w: Partial<World>) => void; theme: ThemeConfig; activeId?: string | null }> = ({ world, updateWorld, theme, activeId }) => {
  const [selectedCharId, setSelectedCharId] = useState(world.characters[0]?.id || null);
  const [editorState, setEditorState] = useState<{ isOpen: boolean; src: string | null }>({ isOpen: false, src: null });
  const [loadingAI, setLoadingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedChar = world.characters.find((c) => c.id === selectedCharId);
  
  useEffect(() => { if(activeId) setSelectedCharId(activeId); }, [activeId]);

  const handleAIGen = async () => { 
    if(!selectedChar) return;
    setLoadingAI(true);
    try {
      const desc = await generateWorldContent("character", selectedChar.name, selectedChar.role, world.name, world.genre);
      if(desc) updateWorld({ characters: world.characters.map(c => c.id === selectedChar.id ? { ...c, description: desc } : c) }); 
    } finally { setLoadingAI(false); }
  };
  
  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
       <ImageEditorModal isOpen={editorState.isOpen} src={editorState.src} initialAspect={1} outputWidth={512} onClose={() => setEditorState({ ...editorState, isOpen: false })} onConfirm={(data) => { if (selectedChar) updateWorld({ characters: world.characters.map(c => c.id === selectedChar.id ? {...c, avatar: data} : c) }); }} theme={theme} />
      <div className="w-72 flex flex-col glass-panel rounded-xl border border-slate-700 overflow-hidden shrink-0">
         <div className="p-4 border-b theme-border flex justify-between items-center"><h3 className="font-bold">角色列表</h3><button onClick={() => {const nc={id:`c-${Date.now()}`, name:"未命名", role:"平民", race:"人类", description:""}; updateWorld({characters:[...world.characters, nc]}); setSelectedCharId(nc.id)}} className={`p-1 text-white rounded theme-btn-primary`}><Plus size={16}/></button></div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {world.characters.map((c) => ( <div key={c.id} onClick={() => setSelectedCharId(c.id)} className={`p-3 rounded cursor-pointer border transition-all flex items-center gap-3 ${selectedCharId === c.id ? `bg-black/20 border-[var(--color-primary)]` : "border-transparent theme-item-hover"}`}><div className="w-10 h-10 rounded-full bg-black/30 overflow-hidden shrink-0 flex items-center justify-center">{c.avatar ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover"/> : <Users size={16} className="text-slate-500"/>}</div><div><div className="font-bold text-sm">{c.name}</div><div className="text-xs text-slate-500">{c.race} • {c.role}</div></div></div> ))}
         </div>
      </div>
      <div className="flex-1 glass-panel rounded-xl border border-slate-700 p-6 overflow-y-auto">
        {selectedChar ? (
            <div className="space-y-6">
                <div className="flex gap-8 items-start">
                    <div className="w-48 h-48 rounded-2xl bg-black/20 border-4 theme-border hover:border-slate-500 flex items-center justify-center text-slate-600 overflow-hidden cursor-pointer relative group shrink-0 shadow-2xl transition-all" onClick={() => fileInputRef.current?.click()}>
                        {selectedChar.avatar ? <img src={selectedChar.avatar} className="w-full h-full object-cover" alt="Avatar" /> : <div className="flex flex-col items-center gap-2"><Users size={48} className="opacity-50"/><span className="text-xs font-medium">上传头像</span></div>}
                        <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"><Upload size={32} className="text-white mb-2"/><span className="text-sm text-white font-bold uppercase tracking-widest">更换/编辑</span></div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {const f=e.target.files?.[0]; if(f) setEditorState({isOpen:true, src:URL.createObjectURL(f)})}} />
                    <div className="flex-1 space-y-4 pt-2">
                        <input type="text" value={selectedChar.name} onChange={(e) => updateWorld({ characters: world.characters.map(c=>c.id===selectedChar.id?{...c, name:e.target.value}:c) })} className={`w-full bg-transparent text-4xl font-bold border-b theme-border focus:outline-none pb-2 focus:border-[var(--color-primary)]`} placeholder="角色名称" />
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                             <div className="space-y-1"><label className="text-xs text-slate-500 uppercase font-bold">种族</label><input type="text" value={selectedChar.race} onChange={(e) => updateWorld({ characters: world.characters.map(c=>c.id===selectedChar.id?{...c, race:e.target.value}:c) })} className="w-full theme-input rounded px-3 py-2 text-sm" /></div>
                             <div className="space-y-1"><label className="text-xs text-slate-500 uppercase font-bold">职业 / 身份</label><input type="text" value={selectedChar.role} onChange={(e) => updateWorld({ characters: world.characters.map(c=>c.id===selectedChar.id?{...c, role:e.target.value}:c) })} className="w-full theme-input rounded px-3 py-2 text-sm" /></div>
                        </div>
                    </div>
                </div>
                <div className="relative pt-4 border-t theme-border">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-3">背景故事 & 设定</label>
                     <textarea value={selectedChar.description} onChange={(e) => updateWorld({ characters: world.characters.map(c=>c.id===selectedChar.id?{...c, description:e.target.value}:c) })} className={`w-full h-80 theme-input rounded-lg p-6 focus:outline-none resize-none leading-loose text-base transition-colors`} placeholder="输入详细的角色背景、性格特征和经历..." />
                </div>
            </div>
        ) : <div className="h-full flex items-center justify-center text-slate-500">选择或创建一个角色</div>}
      </div>
    </div>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
    const [world, setWorld] = useState(DEFAULT_WORLD);
    const [activeTab, setActiveTab] = useState("overview");
    const [showSettings, setShowSettings] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(!localStorage.getItem("gemini_api_key") && !window.process?.env?.API_KEY);
    const [apiKey, setApiKey] = useState(localStorage.getItem("gemini_api_key") || "");
    const [savedWorlds, setSavedWorlds] = useState<World[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [navigationTarget, setNavigationTarget] = useState<{id: string | null}>({id: null});

    const theme = {
        ...THEMES[world.theme] || THEMES.indigo,
        ...{ bg: 'theme-bg', text: 'theme-text', border: 'theme-border', hover: 'theme-hover', ring: 'theme-ring', gradient: 'theme-gradient', hex: '' }
    } as any; // Compatibility for old theme prop usage

    // Apply Theme CSS Variables
    useEffect(() => {
        const root = document.documentElement;
        const baseTheme = THEMES[world.theme] || THEMES.indigo;
        const custom = world.customTheme || {};

        // Hex to RGB helper
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
        };

        // Apply variables
        const primary = custom.borderColor ? custom.borderColor : baseTheme.primary; 
        const bgMain = custom.backgroundColor || baseTheme.bgMain;
        const bgPanel = custom.panelColor || baseTheme.bgPanel; 
        const textMain = custom.textColor || baseTheme.textMain;
        const primaryRgb = hexToRgb(primary);

        root.style.setProperty('--color-primary', primary);
        root.style.setProperty('--color-bg-main', bgMain);
        root.style.setProperty('--color-bg-panel', bgPanel);
        root.style.setProperty('--color-text-main', textMain);
        
        // Unified Tone Derived Colors
        if (primaryRgb) {
            root.style.setProperty('--color-bg-input', `rgba(${primaryRgb}, 0.1)`);
            root.style.setProperty('--color-border', `rgba(${primaryRgb}, 0.2)`);
            root.style.setProperty('--color-bg-hover', `rgba(${primaryRgb}, 0.15)`);
        } else {
            root.style.setProperty('--color-bg-input', 'rgba(0,0,0,0.2)'); 
            root.style.setProperty('--color-border', 'rgba(255,255,255,0.1)');
            root.style.setProperty('--color-bg-hover', 'rgba(255,255,255,0.1)');
        }
        
    }, [world.theme, world.customTheme]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem("architect_worlds") || "[]");
        if (saved.length > 0) {
            setSavedWorlds(saved);
            const lastActive = localStorage.getItem("architect_active_world_id");
            if (lastActive) {
                const target = saved.find((w: World) => w.id === lastActive);
                if (target) setWorld(target);
            } else {
                setWorld(saved[0]);
            }
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            saveWorld(world);
        }, 1000);
        return () => clearTimeout(timer);
    }, [world]);

    // Global Search Logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }
        
        const query = searchQuery.toLowerCase();
        const results: any[] = [];

        // Search Concepts
        world.concepts.forEach(c => {
            if (c.title.toLowerCase().includes(query)) results.push({ type: 'concept', id: c.id, label: c.title, sub: c.category, tab: 'overview' });
        });
        // Search Lore
        world.lore.forEach(l => {
            if (l.title.toLowerCase().includes(query)) results.push({ type: 'lore', id: l.id, label: l.title, sub: l.category, tab: 'lore' });
        });
        // Search Characters
        world.characters.forEach(c => {
            if (c.name.toLowerCase().includes(query)) results.push({ type: 'character', id: c.id, label: c.name, sub: c.role, tab: 'characters' });
        });
        // Search Timeline
        world.timeline.forEach(t => {
            if (t.title.toLowerCase().includes(query)) results.push({ type: 'event', id: t.id, label: t.title, sub: t.year, tab: 'timeline' });
        });
        // Search Maps
        world.maps.forEach(m => {
            if (m.name.toLowerCase().includes(query)) results.push({ type: 'map', id: m.id, label: m.name, tab: 'maps' });
            m.markers.forEach(mk => {
                if (mk.label.toLowerCase().includes(query)) results.push({ type: 'marker', id: mk.id, label: mk.label, sub: m.name, tab: 'maps' });
            });
        });
        // Search Graphs
        world.customGraphs.forEach(g => {
             if (g.name.toLowerCase().includes(query)) results.push({ type: 'graph', id: g.id, label: g.name, tab: 'relations' });
        });

        setSearchResults(results);
        setShowSearchResults(true);
    }, [searchQuery, world]);

    const handleSearchResultClick = (result: any) => {
        setActiveTab(result.tab);
        setNavigationTarget({ id: result.id });
        setShowSearchResults(false);
        setSearchQuery("");
    };

    const saveWorld = (w: World) => {
        const saved = JSON.parse(localStorage.getItem("architect_worlds") || "[]");
        const index = saved.findIndex((sw: World) => sw.id === w.id);
        let newSaved;
        if (index >= 0) {
            newSaved = [...saved];
            newSaved[index] = w;
        } else {
            newSaved = [...saved, w];
        }
        localStorage.setItem("architect_worlds", JSON.stringify(newSaved));
        localStorage.setItem("architect_active_world_id", w.id);
        setSavedWorlds(newSaved);
    };

    const createNewWorld = () => {
        const newWorld = { ...DEFAULT_WORLD, id: `world-${Date.now()}`, name: "新世界", lastModified: Date.now() };
        setWorld(newWorld);
        saveWorld(newWorld);
        setActiveTab("overview");
    };

    const loadWorld = (w: World) => {
        setWorld(w);
        localStorage.setItem("architect_active_world_id", w.id);
        setActiveTab("overview");
    };

    const deleteWorld = () => {
        const saved = JSON.parse(localStorage.getItem("architect_worlds") || "[]");
        const newSaved = saved.filter((w: World) => w.id !== world.id);
        localStorage.setItem("architect_worlds", JSON.stringify(newSaved));
        setSavedWorlds(newSaved);
        setDeleteModalOpen(false);
        if (newSaved.length > 0) {
            loadWorld(newSaved[0]);
        } else {
            const newDefault = { ...DEFAULT_WORLD, id: `world-${Date.now()}` };
            setWorld(newDefault);
            saveWorld(newDefault);
        }
    };

    const exportWorld = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(world));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${world.name}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = () => {
        try {
            const imported = JSON.parse(importText);
            if (!imported.id || !imported.name) throw new Error("Invalid Format");
            imported.id = `world-${Date.now()}`; 
            saveWorld(imported);
            loadWorld(imported);
            setShowImportModal(false);
            setImportText("");
        } catch (e) {
            alert("Import failed. Check JSON format.");
        }
    };
    
    const applyThemePreset = (mode: 'light' | 'dark') => {
        if (mode === 'light') {
            updateWorld({ customTheme: { 
                backgroundColor: '#f8fafc', 
                textColor: '#020617', // High contrast dark text
                panelColor: 'rgba(255, 255, 255, 0.85)',
                borderColor: '#cbd5e1' // Stronger border
            } });
        } else {
            updateWorld({ customTheme: { 
                backgroundColor: '#0f172a', 
                textColor: '#e2e8f0', 
                panelColor: 'rgba(30, 41, 59, 0.7)',
                borderColor: 'rgba(255, 255, 255, 0.1)'
            } });
        }
    };

    const updateWorld = (updates: Partial<World>) => setWorld(prev => ({ ...prev, ...updates, lastModified: Date.now() }));

    return (
        <div className="flex h-screen theme-app overflow-hidden selection:bg-[var(--color-primary)] selection:text-white">
          
          {/* Delete Modal */}
          <DeleteConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={deleteWorld} worldName={world.name} />

          {/* API Key Modal */}
          {showKeyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="glass-panel rounded-xl p-8 w-full max-w-md space-y-6 shadow-2xl relative">
                        <button onClick={() => setShowKeyModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Key className="text-indigo-400" size={24}/></div>
                            <h2 className="text-2xl font-bold">配置 Gemini API</h2>
                            <p className="text-slate-400 text-sm">请输入您的 Google Gemini API Key 以启用 AI 辅助功能。</p>
                        </div>
                        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full theme-input rounded-lg p-3" placeholder="sk-..." />
                        <button onClick={() => { localStorage.setItem("gemini_api_key", apiKey); setShowKeyModal(false); }} disabled={!apiKey} className="w-full py-3 rounded-lg theme-btn-primary font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg">保存并继续</button>
                        <p className="text-center text-xs text-slate-500"><a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline hover:text-indigo-400">获取 API Key</a></p>
                    </div>
                </div>
            )}

          {showImportModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <div className="glass-panel rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
                      <h3 className="font-bold text-lg">导入世界 (JSON)</h3>
                      <textarea value={importText} onChange={e => setImportText(e.target.value)} className="w-full h-64 theme-input rounded p-3 text-xs font-mono resize-none" placeholder="Paste JSON content..."></textarea>
                      <div className="flex justify-end gap-3"><button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">取消</button><button onClick={handleImport} className="px-4 py-2 theme-btn-primary text-white rounded">导入</button></div>
                  </div>
              </div>
          )}

          {/* Settings Modal */}
          {showSettings && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowSettings(false)}>
                 <div className="glass-panel rounded-xl shadow-2xl p-6 w-full max-w-2xl space-y-6 relative" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center border-b theme-border pb-4">
                         <h3 className="text-xl font-bold flex items-center gap-2"><Palette size={20}/> 全局设置</h3>
                         <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase">主题预设</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => applyThemePreset('dark')} className="p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center gap-2 text-sm text-white">
                                    <Moon size={16} /> 暗色模式
                                </button>
                                <button onClick={() => applyThemePreset('light')} className="p-3 rounded-lg bg-slate-100 border border-slate-300 hover:bg-white text-slate-800 flex items-center justify-center gap-2 text-sm">
                                    <Sun size={16} /> 亮色模式
                                </button>
                            </div>

                            <h4 className="text-xs font-bold text-slate-400 uppercase mt-4">主题色调</h4>
                            <div className="grid grid-cols-5 gap-3">
                                {Object.keys(THEMES).map(t => (
                                    <button key={t} onClick={() => updateWorld({ theme: t })} className={`w-10 h-10 rounded-lg transition-all`} style={{backgroundColor: THEMES[t].primary, border: world.theme === t ? '2px solid white' : 'none'}}></button>
                                ))}
                            </div>
                            <div className="pt-4 space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase">自定义样式</h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">背景颜色</span>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={world.customTheme?.backgroundColor || '#0f172a'} onChange={(e) => updateWorld({ customTheme: { ...world.customTheme, backgroundColor: e.target.value } })} className="bg-transparent w-8 h-8 cursor-pointer border-none"/>
                                        <button onClick={() => updateWorld({ customTheme: { ...world.customTheme, backgroundColor: undefined } })} className="text-xs text-slate-500 hover:text-white">重置</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4 border-l theme-border pl-8">
                            <h4 className="text-xs font-bold text-slate-400 uppercase">世界配置</h4>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-300">时间单位</label>
                                <input className="w-full theme-input rounded px-3 py-2 text-sm outline-none" value={world.timeUnit} onChange={(e) => updateWorld({ timeUnit: e.target.value })} placeholder="例如：年, 纪元, 星历" />
                            </div>
                            
                            <h4 className="text-xs font-bold text-slate-400 uppercase mt-6">危及区域</h4>
                            <button onClick={() => setDeleteModalOpen(true)} className="w-full py-2 border border-red-900/50 text-red-400 rounded hover:bg-red-900/20 flex items-center justify-center gap-2 transition-colors">
                                <Trash2 size={16}/> 删除当前世界
                            </button>
                        </div>
                     </div>
                 </div>
             </div>
          )}

          {/* Sidebar */}
          <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-[var(--color-bg-main)] border-r theme-border flex flex-col transition-all duration-300 shrink-0 z-50`}>
              <div className="p-4 flex items-center justify-between border-b theme-border h-16">
                  {isSidebarOpen && <div className="font-bold text-xl tracking-tight theme-text-accent truncate">WorldArchitect</div>}
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded theme-item-hover text-slate-400">{isSidebarOpen ? <PanelLeftClose size={18}/> : <Menu size={18}/>}</button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 space-y-6">
                  <div className="px-3">
                       {isSidebarOpen && <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-2">当前世界</div>}
                       <div className="relative group">
                           <div className={`w-full text-left p-2 rounded-lg theme-item-hover transition-colors flex items-center gap-3 border border-transparent`}>
                               <div className="w-8 h-8 rounded theme-btn-primary flex items-center justify-center text-white font-bold shrink-0">{world.name[0]}</div>
                               {isSidebarOpen && <div className="truncate flex-1"><div className="font-medium text-sm truncate">{world.name}</div><div className="text-xs text-slate-500 truncate">{world.genre}</div></div>}
                           </div>
                       </div>
                  </div>
                  
                  <div className="space-y-1 px-3">
                      {[
                          { id: "overview", icon: Layout, label: "概览 & 设定" },
                          { id: "lore", icon: BookOpen, label: "万象设定集" },
                          { id: "characters", icon: Users, label: "角色档案" },
                          { id: "timeline", icon: Clock, label: "历史时间线" },
                          { id: "maps", icon: MapIcon, label: "地图 & 地理" },
                          { id: "relations", icon: Share2, label: "关系网络" },
                      ].map(tab => (
                          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${activeTab === tab.id ? `theme-item-active` : "text-slate-400 theme-item-hover"}`} title={!isSidebarOpen ? tab.label : ""}>
                              <tab.icon size={18} /> {isSidebarOpen && <span className="font-medium text-sm">{tab.label}</span>}
                          </button>
                      ))}
                  </div>

                  <div className="px-3">
                      {isSidebarOpen && <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-2 flex justify-between items-center"><span>存档列表</span><button onClick={createNewWorld} className="theme-text-accent hover:brightness-110"><Plus size={14}/></button></div>}
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                          {savedWorlds.map(w => (
                              <button key={w.id} onClick={() => loadWorld(w)} className={`w-full text-left px-3 py-2 rounded text-xs truncate flex items-center gap-2 ${w.id === world.id ? "theme-text-accent bg-[var(--color-bg-input)]" : "text-slate-500 theme-item-hover"}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${w.id === world.id ? "theme-btn-primary" : "bg-slate-600"}`}></div>
                                  {isSidebarOpen && w.name}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 relative transition-colors duration-300">
               <div className="h-16 border-b theme-border flex items-center justify-between px-6 z-20 glass-panel">
                    <div className="flex items-center gap-4 flex-1">
                        <h2 className="text-xl font-bold tracking-tight capitalize">{activeTab === 'overview' ? '世界概览' : activeTab}</h2>
                        <div className="h-4 w-px bg-slate-600"></div>
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                type="text" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-1.5 theme-input rounded-full text-sm" 
                                placeholder="搜索概念、角色、词条..." 
                            />
                            {showSearchResults && (
                                <div className="absolute top-full left-0 w-full mt-2 glass-panel rounded-lg shadow-xl max-h-80 overflow-y-auto z-50 p-2">
                                    {searchResults.length > 0 ? searchResults.map((res, idx) => (
                                        <div key={idx} onClick={() => handleSearchResultClick(res)} className="p-2 rounded cursor-pointer theme-item-hover flex justify-between items-center">
                                            <div>
                                                <div className="text-sm font-bold">{res.label}</div>
                                                <div className="text-xs text-slate-400">{res.type} • {res.sub || 'N/A'}</div>
                                            </div>
                                            <span className="text-[10px] uppercase text-slate-500 border theme-border px-1 rounded">{res.tab}</span>
                                        </div>
                                    )) : <div className="p-2 text-center text-slate-500 text-sm">无搜索结果</div>}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white transition-colors" title="全局设置"><Settings size={18}/></button>
                         <button onClick={() => setShowKeyModal(true)} className="p-2 text-slate-400 hover:text-white transition-colors" title="API Key 设置"><Key size={18}/></button>
                         <div className="h-8 w-8 rounded-full theme-btn-primary flex items-center justify-center text-white font-bold text-xs ring-2 ring-[var(--color-bg-main)]">U</div>
                    </div>
               </div>
               
               <div className="flex-1 overflow-hidden p-6 relative">
                    <div className="max-w-[1600px] mx-auto h-full">
                        {activeTab === "overview" && <OverviewModule world={world} updateWorld={updateWorld} theme={theme} exportWorld={exportWorld} activeId={navigationTarget.id} />}
                        {activeTab === "lore" && <LoreModule world={world} updateWorld={updateWorld} theme={theme} activeId={navigationTarget.id} />}
                        {activeTab === "characters" && <CharactersModule world={world} updateWorld={updateWorld} theme={theme} activeId={navigationTarget.id} />}
                        {activeTab === "timeline" && <TimelineModule world={world} updateWorld={updateWorld} theme={theme} activeId={navigationTarget.id} />}
                        {activeTab === "maps" && <MapsModule world={world} updateWorld={updateWorld} theme={theme} activeId={navigationTarget.id} />}
                        {activeTab === "relations" && <RelationsModule world={world} updateWorld={updateWorld} theme={theme} activeId={navigationTarget.id} />}
                    </div>
               </div>
          </div>
        </div>
    );
};

export default App;