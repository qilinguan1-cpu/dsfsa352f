import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, ZoomIn, ZoomOut, Check, Crop, MoveUp, MoveDown, Trash2, ImageIcon, FileText, Plus, Upload, Bold, Italic, AlertTriangle, Share2 } from 'lucide-react';
import { Block, ThemeConfig } from '../types';

// --- Helpers ---
export const useImageBrightness = (imageSrc: string | undefined) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (!imageSrc) { setIsDark(true); return; }
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        setIsDark(brightness < 128);
      }
    };
    img.onerror = () => setIsDark(true);
  }, [imageSrc]);

  return isDark;
};

const MarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ content, className = "" }) => {
  const parts = content.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

// --- Components ---

export const DeleteConfirmModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; worldName: string }> = ({ isOpen, onClose, onConfirm, worldName }) => {
    const [input, setInput] = useState("");
    useEffect(() => { if (isOpen) setInput(""); }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="glass-panel rounded-xl p-6 w-full max-w-md space-y-5 shadow-2xl" onClick={e => e.stopPropagation()} style={{borderColor: 'rgba(239, 68, 68, 0.3)'}}>
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><AlertTriangle className="text-red-500" size={24}/> 删除世界</h3>
                <div className="space-y-2">
                    <p className="text-slate-300 text-sm leading-relaxed">您正在尝试删除 <span className="font-bold text-white">{worldName}</span>。此操作不可逆，所有数据将永久丢失。</p>
                    <p className="text-slate-400 text-xs">请输入世界名称以确认删除：</p>
                </div>
                <input value={input} onChange={e => setInput(e.target.value)} className="w-full theme-input rounded p-2 text-sm" placeholder={worldName} autoFocus />
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 theme-item-hover font-medium transition-colors">取消</button>
                    <button disabled={input !== worldName} onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed">确认删除</button>
                </div>
            </div>
        </div>
    )
}

export const AIButton: React.FC<{ onClick: () => void; loading: boolean; label?: string; className?: string; theme: ThemeConfig }> = ({ onClick, loading, label = "AI 协助生成", className = "", theme }) => (
  <button 
    onClick={onClick} 
    disabled={loading} 
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg shadow-black/20 transition-all backdrop-blur-sm theme-btn-primary ${className} ${loading ? 'opacity-50 cursor-wait' : ''}`}
  >
    {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles size={12} />} 
    {loading ? "生成中..." : label}
  </button>
);

export const ImageEditorModal: React.FC<{ src: string | null; isOpen: boolean; onClose: () => void; onConfirm: (data: string) => void; initialAspect?: number; theme: ThemeConfig; outputWidth?: number }> = ({ src, isOpen, onClose, onConfirm, initialAspect, theme, outputWidth }) => {
  const [config, setConfig] = useState({ width: outputWidth || 800, height: initialAspect ? Math.round(800 / initialAspect) : 600, mode: initialAspect ? 'custom' : 'free' });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const displayContainerWidth = 400;
  const displayAspect = (config.width && config.height) ? config.width / config.height : 4/3;
  const displayContainerHeight = displayContainerWidth / displayAspect;

  useEffect(() => { if(isOpen) { setScale(1); setPos({x:0, y:0}); setImageLoaded(false); } }, [isOpen, src]);

  const handleMouseDown = (e: React.MouseEvent) => { if (!imageLoaded) return; setDragging(true); setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y }); };
  const handleMouseMove = (e: React.MouseEvent) => { if(dragging && imageLoaded) { setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); } };
  const handleMouseUp = () => setDragging(false);
  
  const handlePresetChange = (mode: '1:1' | '4:3' | '16:9' | 'original') => {
        let w = config.width;
        let h = config.height;
        
        if (mode === 'original' && imgRef.current) {
            const nw = imgRef.current.naturalWidth;
            const nh = imgRef.current.naturalHeight;
            const max = 1200;
            if (nw > max || nh > max) {
                 const ratio = Math.min(max/nw, max/nh);
                 w = Math.round(nw * ratio);
                 h = Math.round(nh * ratio);
            } else {
                w = nw; h = nh;
            }
        } else if (mode === '1:1') { h = w; }
        else if (mode === '16:9') { h = Math.round(w * 9 / 16); }
        else if (mode === '4:3') { h = Math.round(w * 3 / 4); }
        
        setConfig({ width: w, height: h, mode });
        setPos({ x: 0, y: 0 });
        setScale(1);
  };

  const handleSave = () => {
      if(!imgRef.current || !imageLoaded) return;
      try {
          const canvas = document.createElement('canvas');
          canvas.width = config.width;
          canvas.height = config.height;
          const ctx = canvas.getContext('2d');
          if(!ctx) return;
          ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.translate(canvas.width/2, canvas.height/2);
          const resolutionRatio = canvas.width / displayContainerWidth;
          ctx.translate(pos.x * resolutionRatio, pos.y * resolutionRatio);
          ctx.scale(scale, scale);
          if (imgRef.current.naturalWidth > 0 && imgRef.current.naturalHeight > 0) {
              const drawWidth = canvas.width; 
              const aspect = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
              const drawHeight = drawWidth / aspect;
              ctx.drawImage(imgRef.current, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
          }
          onConfirm(canvas.toDataURL('image/jpeg', 0.8)); onClose();
      } catch (e: any) { alert("Image processing failed: " + e.message); }
  };

  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="glass-panel rounded-xl p-4 w-full max-w-2xl flex flex-col gap-4 shadow-2xl max-h-[95vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b theme-border pb-2">
                <h3 className="font-bold flex items-center gap-2"><Crop size={18}/> 图片裁剪与编辑</h3>
                <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-3 rounded-lg">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">预设比例</label>
                    <div className="flex flex-wrap gap-2">
                        {(['1:1', '4:3', '16:9', 'original'] as const).map(m => (
                            <button key={m} onClick={() => handlePresetChange(m)} className={`px-2 py-1 text-xs rounded border transition-colors ${config.mode === m ? 'theme-btn-primary border-transparent' : 'theme-border text-slate-400 hover:text-white'}`}>
                                {m === 'original' ? '原图' : m}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">尺寸 (px)</label><div className="flex items-center gap-2"><input type="number" value={config.width} onChange={(e) => setConfig({...config, width: parseInt(e.target.value)||100, mode: 'custom'})} className="w-20 theme-input rounded px-2 py-1 text-sm text-center" /><span className="text-slate-500">x</span><input type="number" value={config.height} onChange={(e) => setConfig({...config, height: parseInt(e.target.value)||100, mode: 'custom'})} className="w-20 theme-input rounded px-2 py-1 text-sm text-center" /><button onClick={() => { const t = config.width; setConfig({...config, width: config.height, height: t}) }} className="p-1 text-slate-400 hover:text-white" title="交换宽高"><Share2 size={14} className="rotate-90"/></button></div></div>
            </div>
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/40 rounded-lg border theme-border relative min-h-[300px]">
                {src ? ( <div className={`relative overflow-hidden shadow-2xl ring-1 ring-white/20 bg-black transition-opacity duration-300 ${imageLoaded ? 'opacity-100 cursor-move' : 'opacity-0'}`} style={{ width: displayContainerWidth, height: displayContainerHeight }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><img ref={imgRef} src={src} onLoad={() => { setImageLoaded(true); if(config.mode==='original') handlePresetChange('original'); }} onError={() => alert("Failed to load image")} style={{ width: displayContainerWidth + 'px', height: 'auto', transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }} className="max-w-none select-none pointer-events-auto transition-transform duration-75 origin-center" draggable={false} crossOrigin="anonymous" alt="Edit target"/></div></div> ) : <div className="text-slate-500">No Image</div>}
            </div>
            <div className="flex items-center gap-4"><ZoomOut size={16} className="text-slate-500"/><input type="range" min="0.1" max="4" step="0.05" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className={`flex-1 h-2 bg-slate-800 rounded-full appearance-none cursor-pointer`} /><ZoomIn size={16} className="text-slate-500"/><button onClick={() => {setScale(1); setPos({x:0,y:0})}} className="text-xs theme-text-accent hover:underline whitespace-nowrap">重置</button></div>
            <div className="flex justify-end gap-3 pt-2 border-t theme-border"><button onClick={onClose} className="px-6 py-2 text-slate-300 theme-item-hover rounded-lg font-medium transition-colors">取消</button><button onClick={handleSave} disabled={!imageLoaded} className={`px-6 py-2 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 theme-btn-primary disabled:opacity-50 disabled:cursor-not-allowed`}><Check size={18}/> 确认</button></div>
        </div>
    </div>
  );
};

export const BlockEditor: React.FC<{ blocks: Block[]; onChange: (blocks: Block[]) => void; theme: ThemeConfig; placeholder?: string }> = ({ blocks, onChange, theme, placeholder }) => {
  const [editorState, setEditorState] = useState<{ isOpen: boolean; src: string | null; id: string | null }>({ isOpen: false, src: null, id: null });
  const addBlock = (index: number, type: 'text' | 'image') => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `b-${Date.now()}`, type, content: "", fontSize: 1 }); onChange(newBlocks); };
  const updateBlock = (blockId: string, updates: Partial<Block>) => { onChange(blocks.map((b) => b.id === blockId ? { ...b, ...updates } : b)); };
  const deleteBlock = (blockId: string) => { onChange(blocks.filter((b) => b.id !== blockId)); };
  const moveBlock = (index: number, direction: number) => { if (index + direction < 0 || index + direction >= blocks.length) return; const newBlocks = [...blocks]; const temp = newBlocks[index]; newBlocks[index] = newBlocks[index + direction]; newBlocks[index + direction] = temp; onChange(newBlocks); };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
      const file = e.target.files?.[0];
      if (file) { setEditorState({ isOpen: true, src: URL.createObjectURL(file), id: blockId }); e.target.value = ''; }
  };

  const insertText = (id: string, prefix: string, suffix: string) => {
    const textarea = document.getElementById(`textarea-${id}`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newContent = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end);
    updateBlock(id, { content: newContent });
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + prefix.length, end + prefix.length); }, 0);
  };

  return (
      <div className="space-y-1 relative pb-16">
           <ImageEditorModal isOpen={editorState.isOpen} src={editorState.src} initialAspect={0} onClose={() => setEditorState({ ...editorState, isOpen: false })} onConfirm={(data) => { if (editorState.id) updateBlock(editorState.id, { content: data }); }} theme={theme} />
          {blocks.map((block, index) => (
              <div key={block.id} className="group relative hover:bg-white/5 rounded transition-colors p-2 -mx-2">
                   <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 flex flex-col gap-1 items-center transition-opacity z-20">
                        <div className="flex flex-col bg-slate-800 rounded border border-slate-700 shadow-sm">
                            <button onClick={() => moveBlock(index, -1)} className="p-1 text-slate-500 hover:text-white"><MoveUp size={12}/></button>
                            <button onClick={() => moveBlock(index, 1)} className="p-1 text-slate-500 hover:text-white"><MoveDown size={12}/></button>
                            <button onClick={() => deleteBlock(block.id)} className="p-1 text-slate-500 hover:text-red-400 border-t border-slate-700"><Trash2 size={12}/></button>
                        </div>
                   </div>
                   {block.type === 'image' ? (
                       <div className="w-full relative group/img">
                           {block.content ? ( <img src={block.content} className="max-w-full rounded-lg shadow-lg mx-auto block border border-slate-700 cursor-pointer" alt="Content" onClick={() => setEditorState({ isOpen: true, src: block.content, id: block.id })} title="点击编辑"/> ) : ( <div className="h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-slate-500"><ImageIcon size={24} className="mr-2"/> 请上传图片</div> )}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity flex gap-2"><label className="cursor-pointer px-3 py-1.5 bg-black/70 hover:bg-black/90 text-xs text-white rounded-full backdrop-blur flex items-center gap-2"><Upload size={12}/> {block.content ? "更换" : "上传"}<input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, block.id)}/></label></div>
                       </div>
                   ) : (
                       <div className="relative group/text">
                         <div className="absolute -top-8 right-0 bg-slate-800 border border-slate-700 rounded flex items-center shadow-lg opacity-0 group-focus-within/text:opacity-100 transition-opacity z-20">
                            <button onClick={() => insertText(block.id, "**", "**")} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700" title="加粗"><Bold size={14}/></button>
                            <button onClick={() => insertText(block.id, "*", "*")} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700" title="倾斜"><Italic size={14}/></button>
                            <div className="w-px h-4 bg-slate-700 mx-1"></div>
                            <button onClick={() => updateBlock(block.id, { fontSize: Math.min(2, (block.fontSize || 1) + 0.25) })} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700" title="放大"><ZoomIn size={14}/></button>
                            <button onClick={() => updateBlock(block.id, { fontSize: Math.max(0.5, (block.fontSize || 1) - 0.25) })} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700" title="缩小"><ZoomOut size={14}/></button>
                         </div>
                         <textarea id={`textarea-${block.id}`} value={block.content} onChange={(e) => { updateBlock(block.id, { content: e.target.value }); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="w-full bg-transparent leading-relaxed focus:outline-none resize-none overflow-hidden p-1 min-h-[1.5em] transition-all text-inherit" style={{ fontSize: `${(block.fontSize || 1)}rem`, lineHeight: 1.6 }} placeholder={placeholder || "输入内容... (支持Markdown: **粗体**, *倾斜*)"} ref={ref => { if (ref) { ref.style.height = 'auto'; ref.style.height = ref.scrollHeight + 'px'; }}} />
                       </div>
                   )}
                   <div className="absolute bottom-0 left-0 right-0 h-4 -mb-2 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                       <div className="bg-slate-800 rounded-full shadow-lg border border-slate-700 flex overflow-hidden transform scale-90">
                           <button onClick={() => addBlock(index, 'text')} className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white border-r border-slate-700" title="插入文本"><FileText size={14}/></button>
                           <button onClick={() => addBlock(index, 'image')} className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white" title="插入图片"><ImageIcon size={14}/></button>
                       </div>
                   </div>
              </div>
          ))}
          {blocks.length === 0 && ( <div className="text-center py-10"><button onClick={() => addBlock(-1, 'text')} className="text-slate-500 hover:text-white flex items-center gap-2 mx-auto"><Plus size={16}/> 开始写作</button></div> )}
      </div>
  );
};

export const SectionCard: React.FC<{ title: string; icon: any; children: React.ReactNode; theme: ThemeConfig; className?: string }> = ({ title, icon: Icon, children, theme, className="" }) => (
  <div className={`glass-panel p-6 rounded-xl flex flex-col ${className}`}>
    <div className="flex items-center gap-2 mb-4 border-b theme-border pb-2">
      <Icon className="theme-text-accent" size={20} />
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);