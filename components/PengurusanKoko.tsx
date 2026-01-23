
import React, { useState } from 'react';
import { ManagementData, OPR, Unit, CommitteeMember } from '../types';
import { 
  Users, FileText, Calendar, Star, Upload, Trash2, 
  Plus, Edit, Download, Image as ImageIcon, CheckCircle, 
  AlertCircle, ChevronRight, FilePlus, Sparkles, BookOpen, X,
  Trophy, MapPin, Clock, History, Save, ArrowRight, Eye, Briefcase, FileUp, Camera, ExternalLink, Search, 
  Filter, Printer, Trash, FileBox, Tag, UserCircle, Medal, Crown, ShieldCheck, Zap, User
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface PengurusanKokoProps {
  data: ManagementData;
  setData: React.Dispatch<React.SetStateAction<ManagementData>>;
  isAdmin: boolean;
  oprs: OPR[];
  setOprs: React.Dispatch<React.SetStateAction<OPR[]>>;
  units: Unit[];
}

const SCHOOL_LOGO = "https://lh3.googleusercontent.com/d/1xl4C5RGqMGLFikaBzfcG7ePEqFBiTUBb";

const PengurusanKoko: React.FC<PengurusanKokoProps> = ({ data, setData, isAdmin, oprs, setOprs, units }) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'minutes' | 'calendar' | 'success' | 'oprs'>('chart');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [chartViewMode, setChartViewMode] = useState<'poster' | 'list'>('list');
  const [memberImage, setMemberImage] = useState<string | null>(null);
  const [oprSearch, setOprSearch] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const getBase64Image = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (url.startsWith('data:image')) { resolve(url); return; }
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        try { resolve(canvas.toDataURL('image/png')); } catch (err) { reject(err); }
      };
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  };

  const downloadCommitteePDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 20;

    let logo = '';
    try { logo = await getBase64Image(SCHOOL_LOGO); } catch(e) {}

    if (logo) doc.addImage(logo, 'PNG', pageWidth/2 - 15, 10, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("JAWATANKUASA INDUK KOKURIKULUM", pageWidth/2, 50, { align: 'center' });
    doc.setFontSize(12);
    doc.text("SK KEMASEK - SESI 2026/2027", pageWidth/2, 58, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(margin, 65, pageWidth - margin, 65);

    let currentY = 80;
    const committee = [...(data.organizationChart.committee || [])].sort((a, b) => a.rank - b.rank);

    committee.forEach((member, index) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${index + 1}. ${member.position.toUpperCase()}`, margin, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${member.name}`, margin + 70, currentY);
      currentY += 10;
      if (currentY > 270) { doc.addPage(); currentY = 20; }
    });
    doc.save("Jawatankuasa_Induk_Koko_2026.pdf");
  };

  const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    const formData = new FormData(e.currentTarget);
    const id = editingItem?.id || `${activeTab}-${Date.now()}`;

    if (activeTab === 'chart') {
      const name = formData.get('memberName') as string;
      const position = formData.get('memberPosition') as string;
      const rank = parseInt(formData.get('memberRank') as string);
      const newMember = { id, name, position, rank, image: memberImage || editingItem?.image || null };
      setData(prev => ({
        ...prev,
        organizationChart: {
          ...prev.organizationChart,
          committee: editingItem 
            ? (prev.organizationChart.committee || []).map(m => m.id === id ? newMember : m)
            : [...(prev.organizationChart.committee || []), newMember],
          lastUpdated: new Date().toLocaleDateString()
        }
      }));
      setMemberImage(null);
    } else if (activeTab === 'minutes') {
      const title = formData.get('title') as string;
      const date = formData.get('date') as string;
      const fileInput = e.currentTarget.querySelector('input[name="minuteFile"]') as HTMLInputElement;
      let fileData = editingItem?.file || null;
      if (fileInput.files?.[0]) {
        const file = fileInput.files[0];
        fileData = await new Promise((res) => {
          const r = new FileReader();
          r.onload = (ev) => res(ev.target?.result as string);
          r.readAsDataURL(file);
        });
      }
      const newItem = { id, title, date, file: fileData };
      setData(prev => ({
        ...prev,
        minutes: editingItem ? prev.minutes.map(m => m.id === id ? newItem : m) : [newItem, ...prev.minutes]
      }));
    }

    setIsUploading(false);
    setShowForm(false);
    setEditingItem(null);
  };

  const deleteItem = (type: any, id: string) => {
    if (window.confirm("Padam rekod ini?")) {
      if (type === 'committee') {
        setData(prev => ({
          ...prev,
          organizationChart: {
            ...prev.organizationChart,
            committee: (prev.organizationChart.committee || []).filter(m => m.id !== id)
          }
        }));
      } else {
        setData(prev => ({ ...prev, [type]: (prev[type] as any[]).filter(i => i.id !== id) }));
      }
    }
  };

  const pengerusi = data.organizationChart.committee?.find(m => m.rank === 1);
  const timbalan = data.organizationChart.committee?.find(m => m.rank === 2);
  const naibPengerusi = data.organizationChart.committee?.filter(m => m.rank >= 3 && m.rank <= 5).sort((a,b) => a.rank - b.rank);
  const coreTeam = data.organizationChart.committee?.filter(m => m.rank >= 6).sort((a,b) => a.rank - b.rank);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="relative bg-slate-900 rounded-[48px] p-8 md:p-16 text-white overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">Pengurusan<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300">Kokurikulum</span></h2>
            <p className="text-slate-400 font-medium max-w-xl text-sm md:text-lg">Hab berpusat dokumentasi dan perancangan strategik.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setShowForm(false); }}
                className={`flex items-center gap-3 px-6 py-4 rounded-3xl transition-all duration-300 ${
                  activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <tab.icon size={20} />
                <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[48px] shadow-sm border border-slate-100 p-6 md:p-12 min-h-[600px]">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-[32px] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner`}>
              {React.createElement(tabs.find(t => t.id === activeTab)?.icon || Users, { size: 40 })}
            </div>
            <div>
              <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{tabs.find(t => t.id === activeTab)?.label}</h3>
              <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mt-2">Sesi Akademik 2026/2027</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {activeTab === 'chart' && (
              <div className="flex bg-slate-100 p-2 rounded-3xl">
                 <button onClick={() => setChartViewMode('poster')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${chartViewMode === 'poster' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>POSTER</button>
                 <button onClick={() => setChartViewMode('list')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${chartViewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>CARTA DINAMIK</button>
              </div>
            )}
            {activeTab === 'oprs' && (
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input 
                    type="text" 
                    placeholder="Cari dalam gedung OPR..." 
                    value={oprSearch}
                    onChange={(e) => setOprSearch(e.target.value)}
                    className="w-full md:w-80 pl-12 pr-6 py-4 bg-slate-50 border-none rounded-3xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-600/20"
                 />
              </div>
            )}
            {activeTab !== 'oprs' && activeTab !== 'calendar' && activeTab !== 'success' && (
              <button 
                onClick={() => { setEditingItem(null); setMemberImage(null); setShowForm(true); }}
                className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all"
              >
                <Plus size={24} /> TAMBAH REKOD
              </button>
            )}
          </div>
        </div>

        {activeTab === 'chart' && (
          <div className="animate-in slide-in-from-bottom-8 duration-700">
            {chartViewMode === 'poster' ? (
              <div className="group relative bg-slate-50 border-4 border-dashed border-slate-200 rounded-[64px] overflow-hidden min-h-[600px] flex items-center justify-center">
                {data.organizationChart.image ? (
                  <img src={data.organizationChart.image} className="w-full h-auto object-contain p-10" />
                ) : (
                  <div className="text-center p-20">
                    <ImageIcon size={80} className="mx-auto text-slate-200 mb-6" />
                    <p className="text-slate-300 font-black uppercase text-sm tracking-widest">Imej carta belum dimuat naik</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <label className="bg-white text-slate-900 px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest cursor-pointer shadow-2xl hover:scale-105 transition-transform">
                    MUAT NAIK POSTER BARU
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setData(prev => ({...prev, organizationChart: {...prev.organizationChart, image: ev.target?.result as string}}));
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-32 py-10">
                 <div className="max-w-7xl mx-auto space-y-24">
                    <div className="flex justify-center">
                       {pengerusi && (
                         <div className="group relative w-full max-w-xl bg-[#0f172a] rounded-[64px] p-12 text-white shadow-2xl text-center border-[8px] border-[#fbbf24]">
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 rounded-[48px] overflow-hidden border-8 border-white bg-slate-100 shadow-2xl ring-4 ring-[#fbbf24]">
                               {pengerusi.image ? <img src={pengerusi.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={80}/></div>}
                            </div>
                            <div className="mt-24">
                               <p className="text-[14px] font-black uppercase tracking-[0.5em] text-[#fbbf24] mb-4">{pengerusi.position}</p>
                               <h4 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mb-6">{pengerusi.name}</h4>
                            </div>
                            <div className="mt-6 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingItem(pengerusi); setShowForm(true); }} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl"><Edit size={24}/></button>
                              <button onClick={() => deleteItem('committee', pengerusi.id)} className="p-4 bg-white/10 hover:bg-rose-500 rounded-2xl"><Trash2 size={24}/></button>
                            </div>
                         </div>
                       )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                       {timbalan && [timbalan, ...(naibPengerusi || [])].map((member, idx) => (
                         <div key={member.id} className={`group relative bg-[#1e293b] rounded-[56px] p-10 text-white shadow-xl text-center border-b-[12px] ${idx === 0 ? 'border-indigo-500' : 'border-emerald-500'}`}>
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white bg-slate-100 shadow-xl">
                               {member.image ? <img src={member.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={48}/></div>}
                            </div>
                            <div className="mt-16">
                               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3">{member.position}</p>
                               <h4 className="text-lg font-black uppercase tracking-tight leading-tight h-16 flex items-center justify-center">{member.name}</h4>
                            </div>
                            <div className="mt-6 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingItem(member); setShowForm(true); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl"><Edit size={18}/></button>
                              <button onClick={() => deleteItem('committee', member.id)} className="p-2 bg-white/10 hover:bg-rose-500 rounded-xl"><Trash2 size={18}/></button>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="space-y-16">
                       <div className="flex items-center gap-10">
                          <div className="h-[4px] flex-1 bg-slate-100 rounded-full"></div>
                          <span className="text-[16px] font-black uppercase tracking-[0.8em] text-indigo-900 bg-indigo-50 px-10 py-4 rounded-full shadow-sm">Penyelaras & Setiausaha</span>
                          <div className="h-[4px] flex-1 bg-slate-100 rounded-full"></div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                          {coreTeam?.map(member => (
                            <div key={member.id} className="group bg-white border border-slate-100 rounded-[48px] p-8 md:p-12 shadow-md hover:shadow-2xl transition-all border-l-[24px] border-l-indigo-600 flex items-center gap-10">
                               <div className="w-28 h-28 rounded-[32px] overflow-hidden bg-slate-50 shrink-0 border-2 border-slate-100 shadow-inner ring-4 ring-indigo-50">
                                  {member.image ? (
                                    <img src={member.image} className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={48}/></div>
                                  )}
                               </div>
                               <div className="min-w-0 flex-1">
                                  <p className="text-sm md:text-base font-black uppercase text-indigo-600 mb-2 tracking-[0.2em]">{member.position}</p>
                                  <h5 className="text-xl md:text-2xl font-black text-slate-900 uppercase leading-none tracking-tighter">{member.name}</h5>
                                  <div className="mt-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => { setEditingItem(member); setShowForm(true); }} className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all"><Edit size={20}/></button>
                                     <button onClick={() => deleteItem('committee', member.id)} className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl transition-all"><Trash2 size={20}/></button>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-center pt-20">
                    <button onClick={downloadCommitteePDF} className="flex items-center gap-4 px-16 py-8 bg-[#0f172a] text-white rounded-[40px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all">
                      <Printer size={28} /> CETAK SENARAI RASMI (PDF)
                    </button>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'oprs' && (
           <div className="animate-in slide-in-from-bottom-8 duration-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {oprs.filter(o => o.title.toLowerCase().includes(oprSearch.toLowerCase())).length > 0 ? 
                 oprs.filter(o => o.title.toLowerCase().includes(oprSearch.toLowerCase())).map(opr => {
                   const unit = units.find(u => u.id === opr.unitId);
                   return (
                    <div key={opr.id} className="group bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-2xl transition-all flex flex-col border-b-8 border-b-indigo-500">
                       <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             <FileText size={24} />
                          </div>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase">MGG {opr.week}</span>
                       </div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{unit?.name || 'Unit'}</p>
                       <h4 className="text-sm font-black text-slate-800 uppercase leading-tight line-clamp-2 mb-4">
                         {opr.title}
                       </h4>
                       <div className="mt-auto flex items-center gap-4 text-[9px] font-bold text-slate-400">
                          <span className="flex items-center gap-1"><Clock size={12}/> {opr.date}</span>
                       </div>
                    </div>
                   );
                 }) : (
                   <div className="col-span-full py-20 text-center">
                      <FileBox size={64} className="mx-auto text-slate-100 mb-4" />
                      <p className="text-slate-300 font-black uppercase text-xs">Tiada laporan dijumpai</p>
                   </div>
                 )}
              </div>
           </div>
        )}

        {/* Other tabs placeholder... */}
        {(activeTab === 'minutes' || activeTab === 'calendar' || activeTab === 'success') && (
          <div className="py-32 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FilePlus className="text-slate-200" size={32} />
             </div>
             <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Modul sedang dikemaskini...</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-8 bg-indigo-600 text-white flex items-center justify-between`}>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{editingItem ? 'Kemaskini' : 'Tambah'} {tabs.find(t => t.id === activeTab)?.label}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              {activeTab === 'chart' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="w-32 h-32 rounded-3xl bg-slate-50 border-4 border-dashed border-slate-200 overflow-hidden relative flex items-center justify-center group">
                      {memberImage ? <img src={memberImage} className="w-full h-full object-cover" /> : <UserCircle size={64} className="text-slate-200" />}
                      <label className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                        <Camera size={32} className="text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             const reader = new FileReader();
                             reader.onload = (ev) => setMemberImage(ev.target?.result as string);
                             reader.readAsDataURL(file);
                           }
                        }} />
                      </label>
                    </div>
                  </div>
                  <input name="memberName" defaultValue={editingItem?.name} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 outline-none" placeholder="Nama Penuh" />
                  <input name="memberPosition" defaultValue={editingItem?.position} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 outline-none" placeholder="Jawatan" />
                  <input type="number" name="memberRank" defaultValue={editingItem?.rank || 10} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 outline-none" placeholder="Ranking" />
                </div>
              )}
              {activeTab === 'minutes' && (
                <div className="space-y-4">
                  <input name="title" defaultValue={editingItem?.title} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 outline-none" placeholder="Tajuk Minit" />
                  <input type="date" name="date" defaultValue={editingItem?.date || today} required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 outline-none" />
                  <input type="file" name="minuteFile" accept=".pdf" className="w-full" />
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase">BATAL</button>
                <button type="submit" disabled={isUploading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl">
                  {isUploading ? "MENYIMPAN..." : "SIMPAN REKOD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const tabs = [
  { id: 'chart', label: 'Carta Organisasi', icon: Users, color: 'indigo' },
  { id: 'minutes', label: 'Gedung Minit', icon: FileText, color: 'emerald' },
  { id: 'calendar', label: 'Takwim & Aktiviti', icon: Calendar, color: 'blue' },
  { id: 'success', label: 'Success Story', icon: Trophy, color: 'amber' },
  { id: 'oprs', label: 'Gedung OPR', icon: FileBox, color: 'rose' },
];

export default PengurusanKoko;
