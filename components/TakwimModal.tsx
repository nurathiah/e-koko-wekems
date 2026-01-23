
import React, { useState } from 'react';
import { Unit, OPR, TakwimItem } from '../types';
import { X, Calendar, Printer, ArrowLeft, Clock, MapPin, CheckCircle2, Edit3, Save, Zap, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface TakwimModalProps {
  unit: Unit;
  onClose: () => void;
  oprs: OPR[];
  takwimItems: TakwimItem[];
  setTakwimItems: React.Dispatch<React.SetStateAction<TakwimItem[]>>;
}

const TakwimModal: React.FC<TakwimModalProps> = ({ unit, onClose, oprs, takwimItems, setTakwimItems }) => {
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', reflection: '' });

  const getWeekData = (week: number) => {
    // Priority: Manual Input -> OPR Data -> Empty
    const manual = takwimItems.find(t => t.unitId === unit.id && t.week === week);
    const opr = oprs.find(o => o.week === week);
    
    return {
      title: manual?.title || opr?.title || 'Belum Ditetapkan',
      date: opr?.date || '---',
      reflection: manual?.reflection || opr?.reflection || '---',
      source: manual ? 'manual' : opr ? 'auto' : 'none'
    };
  };

  const handleEdit = (week: number) => {
    const data = getWeekData(week);
    setEditForm({ title: data.title, reflection: data.reflection });
    setEditingWeek(week);
  };

  const handleSave = () => {
    if (editingWeek === null) return;
    const newItem: TakwimItem = {
      id: `t-${unit.id}-${editingWeek}`,
      unitId: unit.id,
      week: editingWeek,
      title: editForm.title,
      date: '',
      reflection: editForm.reflection,
      isManual: true
    };
    
    setTakwimItems(prev => {
      const other = prev.filter(t => !(t.unitId === unit.id && t.week === editingWeek));
      return [...other, newItem];
    });
    setEditingWeek(null);
  };

  const resetToAuto = (week: number) => {
    setTakwimItems(prev => prev.filter(t => !(t.unitId === unit.id && t.week === week)));
  };

  const printTakwim = () => {
    const doc = new jsPDF();
    const margin = 15;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`TAKWIM AKTIVITI TAHUNAN SESI 2026/2027`, 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text(unit.name.toUpperCase(), 105, 22, { align: 'center' });
    
    let y = 35;
    doc.setFontSize(8);
    // Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, 180, 7, 'F');
    doc.text("MGG", margin + 2, y);
    doc.text("TARIKH", margin + 15, y);
    doc.text("TAJUK AKTIVITI / PERKARA", margin + 45, y);
    doc.text("REFLEKSI / CATATAN", margin + 130, y);
    doc.line(margin, y + 2, 195, y + 2);
    
    y += 10;
    for (let i = 1; i <= 12; i++) {
      const data = getWeekData(i);
      doc.text(`${i}`, margin + 2, y);
      doc.text(data.date, margin + 15, y);
      
      const titleLines = doc.splitTextToSize(data.title.toUpperCase(), 80);
      doc.text(titleLines, margin + 45, y);
      
      const reflectionLines = doc.splitTextToSize(data.reflection, 60);
      doc.text(reflectionLines, margin + 130, y);
      
      const lineHeight = Math.max(titleLines.length, reflectionLines.length) * 5;
      y += Math.max(8, lineHeight);
      doc.line(margin, y - 5, 195, y - 5, "S");
      
      if (y > 270) { doc.addPage(); y = 20; }
    }
    
    doc.save(`Takwim_${unit.name}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[70] flex items-center justify-center p-2 md:p-6">
      <div className="bg-white rounded-[40px] w-full max-w-6xl h-full flex flex-col overflow-hidden shadow-2xl border border-white/20">
        
        <div className="p-6 md:p-8 bg-rose-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><ArrowLeft size={20}/></button>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Takwim Perancangan</h2>
              <p className="text-[10px] md:text-xs font-bold opacity-80 uppercase tracking-widest leading-none mt-1">{unit.name} • 12 Minggu</p>
            </div>
          </div>
          <div className="flex gap-3">
             <div className="hidden md:flex bg-white/10 px-4 py-2 rounded-2xl items-center gap-4 text-[10px] font-black uppercase border border-white/10">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> OPR Auto</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Manual</span>
             </div>
             <button onClick={printTakwim} className="bg-white text-rose-600 px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-slate-50 transition-all uppercase tracking-widest">
                <Printer size={18} /> Cetak Takwim
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 no-scrollbar">
           <div className="max-w-5xl mx-auto space-y-4">
              <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-100/50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                          <th className="px-6 py-5 w-16 text-center">MGG</th>
                          <th className="px-6 py-5 w-32">TARIKH</th>
                          <th className="px-6 py-5">TAJUK AKTIVITI / PERKARA</th>
                          <th className="px-6 py-5 hidden md:table-cell">REFLEKSI / CATATAN</th>
                          <th className="px-6 py-5 text-right pr-8">AKSI</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {[...Array(12)].map((_, i) => {
                          const week = i + 1;
                          const data = getWeekData(week);
                          const isEditing = editingWeek === week;

                          return (
                             <tr key={week} className={`group transition-colors ${data.source === 'auto' ? 'bg-emerald-50/20' : data.source === 'manual' ? 'bg-amber-50/20' : ''}`}>
                                <td className="px-6 py-6 text-center">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${data.source === 'none' ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-md'}`}>
                                      {week}
                                   </div>
                                </td>
                                <td className="px-6 py-6">
                                   <span className="text-[10px] font-black uppercase text-slate-400">{data.date}</span>
                                </td>
                                <td className="px-6 py-6">
                                   {isEditing ? (
                                      <input 
                                         value={editForm.title} 
                                         onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                         className="w-full px-4 py-2 bg-white border border-rose-200 rounded-xl font-bold text-xs text-rose-600 outline-none"
                                         placeholder="Masukkan tajuk manual..."
                                      />
                                   ) : (
                                      <div className="flex items-center gap-3">
                                         <span className={`text-xs font-black uppercase tracking-tight ${data.source === 'none' ? 'text-slate-300 italic' : 'text-slate-800'}`}>
                                            {data.title}
                                         </span>
                                         {data.source === 'auto' && <Zap size={12} className="text-emerald-500" fill="currentColor" />}
                                         {data.source === 'manual' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                                      </div>
                                   )}
                                </td>
                                <td className="px-6 py-6 hidden md:table-cell">
                                   {isEditing ? (
                                      <textarea 
                                         value={editForm.reflection} 
                                         onChange={e => setEditForm(prev => ({ ...prev, reflection: e.target.value }))}
                                         className="w-full px-4 py-2 bg-white border border-rose-200 rounded-xl font-bold text-[10px] text-slate-600 outline-none h-16"
                                         placeholder="Catatan..."
                                      />
                                   ) : (
                                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic line-clamp-2">{data.reflection}</p>
                                   )}
                                </td>
                                <td className="px-6 py-6 text-right pr-8">
                                   <div className="flex justify-end gap-2">
                                      {isEditing ? (
                                         <button onClick={handleSave} className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200"><Save size={16}/></button>
                                      ) : (
                                         <>
                                            <button onClick={() => handleEdit(week)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Edit3 size={16}/></button>
                                            {data.source === 'manual' && (
                                               <button onClick={() => resetToAuto(week)} className="p-2.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><RefreshCw size={16}/></button>
                                            )}
                                         </>
                                      )}
                                   </div>
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TakwimModal;
