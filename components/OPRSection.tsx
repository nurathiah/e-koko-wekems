
import React, { useState, useMemo } from 'react';
import { Unit, Student, Teacher, OPR, MeetingMetadata } from '../types';
import { 
  X, FileText, Download, Zap, Trash2, Camera, 
  Loader2, ArrowLeft, Image as ImageIcon, Heart, 
  Wand2, Star, Maximize2, Minimize2, Printer
} from 'lucide-react';
import { generateOPRContent, generatePikebmContent, generateSivikContent } from '../services/gemini';
import { jsPDF } from 'jspdf';

interface OPRSectionProps {
  unit: Unit;
  onClose: () => void;
  oprs: OPR[];
  setOprs: React.Dispatch<React.SetStateAction<OPR[]>>;
  students: Student[];
  teachers: Teacher[];
  meetings: MeetingMetadata[];
  isAdmin: boolean;
  setMeetings: React.Dispatch<React.SetStateAction<MeetingMetadata[]>>;
}

const SCHOOL_LOGO = "https://lh3.googleusercontent.com/d/1xl4C5RGqMGLFikaBzfcG7ePEqFBiTUBb";

const getBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
};

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const PIKEBM_LIST = [
  "Bicara Spontan", "Pantun / Syair", "Sajak", "Lakonan", "Kosa Kata", "Nyanyian", "Bercerita", "Pidato",
  "Bacaan kuat beramai-ramai", "Bacaan bergilir", "Kad imbas suku kata", "Padanan perkataan dan gambar",
  "Susun huruf menjadi perkataan", "Susun perkataan menjadi ayat", "Bina ayat mudah", "Lengkapkan ayat",
  "Menulis berdasarkan gambar", "Menyalin ayat mudah", "Roda perkataan", "Bingo Bahasa Melayu",
  "Teka perkataan", "Puzzle perkataan", "Cari perkataan tersembunyi", "Bercerita berdasarkan gambar",
  "Main peranan ringkas", "Soal jawab mudah", "Ulang sebut perkataan", "Nyanyian dan irama bahasa",
  "Larian bahasa (stesen bahasa)", "Explorace bahasa", "Jejak perkataan", "Kuiz bahasa",
  "Permainan papan bahasa", "Pertandingan membaca", "Pertandingan bina ayat", "Sudut bahasa",
  "Galeri hasil murid", "Refleksi lisan ringkas"
];

const SIVIK_VALUES = [
  "Hormat-menghormati", "Bertanggungjawab", "Kerjasama", "Toleransi", "Disiplin diri", 
  "Kejujuran", "Amanah", "Kesopanan dan kesusilaan", "Prihatin", "Kasih sayang", 
  "Saling membantu", "Beradab sopan", "Patuh kepada peraturan", "Kesabaran", 
  "Semangat kekitaan", "Cinta akan sekolah", "Cinta akan negara", 
  "Menghargai kepelbagaian", "Bertimbang rasa", "Menjaga kebersihan", 
  "Menjaga harta benda awam", "Menghormati guru dan rakan", "Bekerjasama dalam kumpulan", "Bertolak ansur"
];

const OPRSection: React.FC<OPRSectionProps> = ({
  unit, onClose, oprs, setOprs, students, teachers, meetings, isAdmin, setMeetings
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'view'>('list');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedOpr, setSelectedOpr] = useState<OPR | null>(null);
  const [loadingAI, setLoadingAI] = useState<{opr: boolean, pikebm: boolean, sivik: boolean}>({opr: false, pikebm: false, sivik: false});
  const [tempImages, setTempImages] = useState<(string | null)[]>([null, null, null]);
  
  const [formData, setFormData] = useState({
    week: 1,
    title: '',
    objective: '',
    activity: '',
    reflection: '',
    preparedBy: teachers.length > 0 ? teachers[0].name : '',
    pikebmType: '',
    pikebm: { materials: '', steps: '', reflection: '' },
    sivikTheme: '',
    sivik: { goal: '', activity: '' }
  });

  const currentMeeting = useMemo(() => {
    return meetings.find(m => m.unitId === unit.id && m.week === formData.week) || {
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      location: 'Bilik Khas'
    };
  }, [meetings, formData.week, unit.id]);

  const liveStats = useMemo(() => {
    const sAbsent = students.filter(s => s.attendance[formData.week]).length;
    const sTotal = students.length;
    const tAbsent = teachers.filter(t => t.attendance[formData.week]).length;
    const tTotal = teachers.length;
    return {
      sPercent: sTotal ? Math.round(((sTotal - sAbsent) / sTotal) * 100) : 0,
      tPercent: tTotal ? Math.round(((tTotal - tAbsent) / tTotal) * 100) : 0,
    };
  }, [formData.week, students, teachers]);

  const handleAISuggest = async (type: 'opr' | 'pikebm' | 'sivik') => {
    if (type === 'opr' && !formData.title) return alert('Sila isi tajuk dahulu.');
    setLoadingAI(prev => ({ ...prev, [type]: true }));
    try {
      if (type === 'opr') {
        const content = await generateOPRContent(unit.name, formData.title);
        if (content) setFormData(prev => ({ ...prev, ...content }));
      } else if (type === 'pikebm' && formData.pikebmType) {
        const content = await generatePikebmContent(formData.pikebmType);
        if (content) setFormData(prev => ({ ...prev, pikebm: content }));
      } else if (type === 'sivik' && formData.sivikTheme) {
        const content = await generateSivikContent(formData.sivikTheme);
        if (content) setFormData(prev => ({ ...prev, sivik: content }));
      }
    } catch (e) { alert("Ralat AI."); }
    finally { setLoadingAI(prev => ({ ...prev, [type]: false })); }
  };

  const handleSave = () => {
    if (!formData.title) return alert('Sila isi tajuk perjumpaan.');
    
    const newOpr: OPR = {
      id: `opr-${Date.now()}`,
      unitId: unit.id,
      week: formData.week,
      date: currentMeeting.date,
      time: currentMeeting.time,
      location: currentMeeting.location || 'N/A',
      title: formData.title.toUpperCase(),
      objective: formData.objective,
      activity: formData.activity,
      reflection: formData.reflection,
      studentAttendance: liveStats.sPercent,
      teacherAttendance: liveStats.tPercent,
      images: [...tempImages],
      pikebm: { ...formData.pikebm, objective: formData.pikebmType },
      sivik: { ...formData.sivik, theme: formData.sivikTheme, suggestion: formData.preparedBy } 
    };
    setOprs(prev => [newOpr, ...prev]);
    setSelectedOpr(newOpr);
    setViewMode('view');
  };

  const downloadPDF = async (opr: OPR) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);

    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 22, 'F');
    
    let logoData = '';
    try { logoData = await getBase64(SCHOOL_LOGO); } catch (e) {}
    if (logoData) doc.addImage(logoData, 'PNG', margin, 2, 18, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN AKTIVITI KOKURIKULUM (OPR)", 42, 10);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("UNIT KOKURIKULUM SK KEMASEK - SESI 2026/2027", 42, 15);

    let currentY = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`UNIT: ${unit.name.toUpperCase()}`, margin, currentY);
    doc.text(`MINGGU: ${opr.week}`, margin + 70, currentY);
    doc.text(`TARIKH: ${opr.date}`, margin + 140, currentY);
    currentY += 4.5;
    doc.text(`MASA: ${opr.time}`, margin, currentY);
    doc.text(`DISEDIAKAN OLEH: ${opr.sivik?.suggestion?.toUpperCase() || "GURU"}`, margin + 70, currentY);
    doc.text(`HADIR: M:${opr.studentAttendance}% | G:${opr.teacherAttendance}%`, margin + 140, currentY);

    currentY += 8;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(opr.title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

    const drawSection = (title: string, content: string, color: [number, number, number], fontSize = 10) => {
      currentY += 6;
      doc.setFillColor(...color);
      doc.rect(margin, currentY - 3, 2.5, 2.5, 'F');
      doc.setFontSize(9); 
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...color);
      doc.text(title, margin + 4.5, currentY - 0.5);
      
      currentY += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize); 
      doc.setTextColor(0, 0, 0); 
      const lines = doc.splitTextToSize(content, contentWidth - 5);
      doc.text(lines, margin + 4, currentY);
      currentY += (lines.length * 4.6);
    };

    drawSection("1. OBJEKTIF AKTIVITI", opr.objective, [79, 70, 229]);
    drawSection("2. RINGKASAN AKTIVITI", opr.activity, [79, 70, 229]);
    
    const rowYStart = currentY + 6;
    let maxY = rowYStart;

    if (opr.pikebm?.steps) {
      doc.setFillColor(16, 185, 129);
      doc.rect(margin, rowYStart - 3, 2.5, 2.5, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.text(`3. PIKEBM (${opr.pikebm.objective})`, margin + 4.5, rowYStart - 0.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(opr.pikebm.steps, (contentWidth / 2) - 6);
      doc.text(lines, margin + 4, rowYStart + 4.5);
      maxY = Math.max(maxY, rowYStart + 4.5 + (lines.length * 4.6));
    }

    if (opr.sivik?.activity) {
      const col2X = margin + (contentWidth / 2) + 2;
      doc.setFillColor(245, 158, 11);
      doc.rect(col2X, rowYStart - 3, 2.5, 2.5, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(245, 158, 11);
      doc.text(`4. SIVIK (${opr.sivik.theme})`, col2X + 4.5, rowYStart - 0.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(opr.sivik.activity, (contentWidth / 2) - 6);
      doc.text(lines, col2X + 4, rowYStart + 4.5);
      maxY = Math.max(maxY, rowYStart + 4.5 + (lines.length * 4.6));
    }

    currentY = Math.max(maxY, currentY + 5);
    drawSection("5. REFLEKSI & IMPAK GURU", opr.reflection, [79, 70, 229]);

    currentY = 232; 
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(148, 163, 184);
    doc.text("6. LAMPIRAN BERGAMBAR AKTIVITI", margin, currentY);
    currentY += 4.5;
    const imgSize = 46;
    for (let i = 0; i < 3; i++) {
      if (opr.images[i]) {
        try { doc.addImage(opr.images[i]!, 'JPEG', margin + (i * 58), currentY, imgSize, imgSize); } catch(e) {}
      }
    }

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("Unit Kokurikulum SK Kemasek © 2026", margin, 288);
    doc.text("Dokumen Dijana Secara Digital Oleh E-KOKO WEKEMS - Tiada Tandatangan Diperlukan", margin, 292);

    doc.save(`OPR_${unit.name}_M${opr.week}.pdf`);
  };

  return (
    <div className={`fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[60] flex items-center justify-center overflow-hidden transition-all duration-500 ${isFullscreen ? 'p-0' : 'p-2 md:p-6'}`}>
      <div className={`bg-white rounded-[32px] md:rounded-[40px] w-full max-w-7xl h-full flex flex-col overflow-hidden shadow-2xl border border-white/20 transition-all ${isFullscreen ? 'rounded-none max-w-none h-screen' : ''}`}>
        
        <div className="shrink-0 bg-slate-900 px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 print:hidden">
          <div className="flex items-center gap-3 md:gap-4">
            {!isFullscreen && (
              <button onClick={() => setViewMode('list')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all">
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-white text-sm md:text-base font-black uppercase tracking-tight truncate">E-Laporan OPR</h2>
              <p className="text-indigo-400 text-[7px] md:text-[8px] font-black uppercase tracking-widest truncate">{unit.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl md:rounded-3xl border border-white/10">
             {!isFullscreen && (
               <>
                 <button onClick={() => setViewMode('list')} className={`px-4 md:px-5 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' || viewMode === 'view' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}>GEDUNG</button>
                 <button onClick={() => setViewMode('create')} className={`px-4 md:px-5 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'create' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}>TULIS</button>
               </>
             )}
             {viewMode === 'view' && (
               <>
                 <button onClick={() => selectedOpr && downloadPDF(selectedOpr)} className="p-2 md:p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 px-3 md:px-4 shadow-lg">
                   <Printer size={16} /> <span className="text-[8px] md:text-[9px] font-black hidden sm:inline">CETAK</span>
                 </button>
                 <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 md:p-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                   {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                 </button>
               </>
             )}
             <button onClick={onClose} className="ml-2 md:ml-4 p-2 text-white/40 hover:text-rose-500 transition-colors shrink-0"><X size={20} /></button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto bg-slate-50 no-scrollbar ${viewMode === 'view' ? 'p-0 flex flex-col items-center' : 'p-4 md:p-8'}`}>
          {viewMode === 'list' && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-in fade-in zoom-in-95 duration-500">
               {oprs.length > 0 ? oprs.map(opr => (
                <div key={opr.id} onClick={() => { setSelectedOpr(opr); setViewMode('view'); }} className="group bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-200 hover:shadow-2xl hover:-translate-y-1.5 transition-all cursor-pointer flex flex-col h-full border-b-[6px] md:border-b-[8px] border-b-indigo-700">
                   <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 border border-slate-200 rounded-lg md:rounded-xl flex items-center justify-center text-slate-500 mb-4 md:mb-6 group-hover:bg-indigo-700 group-hover:text-white transition-all"><FileText size={20} /></div>
                   <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase leading-tight line-clamp-2 mb-3 md:mb-4 group-hover:text-indigo-700 transition-colors">{opr.title}</h4>
                   <div className="mt-auto pt-3 md:pt-4 border-t border-slate-200 flex items-center justify-between text-[8px] md:text-[10px] font-black text-slate-700 uppercase tracking-tight">
                      <span>MGG {opr.week}</span>
                      <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">{opr.date}</span>
                   </div>
                </div>
              )) : (
                <div className="col-span-full py-24 md:py-40 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[48px] md:rounded-[64px] border-4 border-dashed border-slate-200">
                  <ImageIcon size={48} className="mb-4 md:mb-6 opacity-30 text-slate-300" />
                  <p className="font-black uppercase text-[10px] md:text-xs tracking-widest text-slate-900 opacity-60">Tiada rekod laporan dijumpai</p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'create' && (
            <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 animate-in slide-in-from-bottom-12 duration-700 pb-20">
               <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm border border-slate-200 space-y-6 md:space-y-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-2xl md:rounded-3xl">
                    <div className="space-y-1">
                       <label className="text-[7px] md:text-[8px] font-black uppercase text-slate-700">Minggu</label>
                       <select value={formData.week} onChange={e => setFormData(prev => ({ ...prev, week: parseInt(e.target.value) }))} className="w-full px-3 md:px-4 py-1.5 md:py-2 bg-white rounded-lg md:rounded-xl font-black text-slate-900 text-xs md:text-sm outline-none border border-slate-300 shadow-sm">
                         {[...Array(12)].map((_, i) => <option key={i} value={i+1} className="text-slate-900 bg-white font-black">MGG {i+1}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[7px] md:text-[8px] font-black uppercase text-slate-700">Tarikh / Masa</label>
                       <div className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase mt-1 leading-relaxed">{currentMeeting.date}<br/>{currentMeeting.time}</div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[7px] md:text-[8px] font-black uppercase text-slate-700">Hadir (M|G)</label>
                       <div className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase mt-1">{liveStats.sPercent}% | {liveStats.tPercent}%</div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[7px] md:text-[8px] font-black uppercase text-slate-700">Disediakan Oleh</label>
                       <select value={formData.preparedBy} onChange={e => setFormData(prev => ({ ...prev, preparedBy: e.target.value }))} className="w-full px-2 py-1.5 bg-white rounded-lg font-black text-slate-900 text-[10px] outline-none border border-slate-300 shadow-sm uppercase">
                          {teachers.map(t => <option key={t.id} value={t.name} className="text-slate-900 font-black">{t.name.toUpperCase()}</option>)}
                       </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-black uppercase text-slate-700 ml-1">Tajuk Aktiviti</label>
                        <div className="relative">
                           <input type="text" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full pl-5 md:pl-6 pr-14 md:pr-16 py-3 md:py-4 bg-slate-50 border border-slate-300 rounded-2xl md:rounded-3xl font-black text-slate-900 text-xs md:text-sm outline-none shadow-sm focus:ring-4 focus:ring-indigo-700/5 uppercase" placeholder="Masukkan tajuk aktiviti..." />
                           <button onClick={() => handleAISuggest('opr')} disabled={loadingAI.opr} className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-indigo-700 text-white rounded-xl md:rounded-2xl shadow-lg hover:bg-indigo-800 transition-all">
                              {loadingAI.opr ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="white" />}
                           </button>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[7px] md:text-[8px] font-black uppercase text-slate-700 ml-1">Objektif (Auto-AI)</label>
                           <textarea value={formData.objective} onChange={e => setFormData(prev => ({ ...prev, objective: e.target.value }))} className="w-full p-4 md:p-5 bg-white border border-slate-300 rounded-xl md:rounded-2xl font-black text-slate-900 text-[10px] md:text-[11px] h-24 md:h-32 outline-none focus:border-indigo-700 focus:ring-4 focus:ring-indigo-700/5 leading-relaxed shadow-sm" placeholder="Objektif perjumpaan..." />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[7px] md:text-[8px] font-black uppercase text-slate-700 ml-1">Langkah Aktiviti (Auto-AI)</label>
                           <textarea value={formData.activity} onChange={e => setFormData(prev => ({ ...prev, activity: e.target.value }))} className="w-full p-4 md:p-5 bg-white border border-slate-300 rounded-xl md:rounded-2xl font-black text-slate-900 text-[10px] md:text-[11px] h-24 md:h-32 outline-none focus:border-indigo-700 focus:ring-4 focus:ring-indigo-700/5 leading-relaxed shadow-sm" placeholder="Langkah-langkah pelaksanaan..." />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                     <div className="p-5 md:p-6 bg-indigo-50/50 border border-indigo-200 rounded-2xl md:rounded-3xl space-y-4 shadow-sm">
                        <h4 className="text-[8px] md:text-[9px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2"><Star size={14} className="text-indigo-700" /> SISIPAN PIKEBM</h4>
                        <div className="flex gap-2">
                           <select value={formData.pikebmType} onChange={e => setFormData(prev => ({ ...prev, pikebmType: e.target.value }))} className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-white rounded-lg md:rounded-xl text-[10px] font-black text-slate-900 outline-none border border-indigo-300 shadow-sm uppercase">
                              <option value="" className="text-slate-900 bg-white">-- PILIH AKTIVITI --</option>
                              {PIKEBM_LIST.map(p => <option key={p} value={p} className="text-slate-900 bg-white">{p.toUpperCase()}</option>)}
                           </select>
                           <button onClick={() => handleAISuggest('pikebm')} disabled={loadingAI.pikebm} className="p-2 md:p-2.5 bg-indigo-700 text-white rounded-lg md:rounded-xl shrink-0 shadow-md hover:bg-indigo-800 transition-all">
                              {loadingAI.pikebm ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                           </button>
                        </div>
                        <textarea value={formData.pikebm.steps} onChange={e => setFormData(prev => ({ ...prev, pikebm: { ...prev.pikebm, steps: e.target.value } }))} className="w-full p-3 md:p-4 bg-white border border-indigo-100 rounded-xl md:rounded-2xl font-black text-slate-900 text-[9px] md:text-[10px] h-20 md:h-24 outline-none leading-relaxed shadow-sm" placeholder="Langkah sisipan bahasa melayu..." />
                     </div>
                     <div className="p-5 md:p-6 bg-emerald-50/50 border border-emerald-200 rounded-2xl md:rounded-3xl space-y-4 shadow-sm">
                        <h4 className="text-[8px] md:text-[9px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2"><Heart size={14} className="text-emerald-700" /> PENERAPAN SIVIK</h4>
                        <div className="flex gap-2">
                           <select value={formData.sivikTheme} onChange={e => setFormData(prev => ({ ...prev, sivikTheme: e.target.value }))} className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-white rounded-lg md:rounded-xl text-[10px] font-black text-slate-900 outline-none border border-emerald-300 shadow-sm uppercase">
                              <option value="" className="text-slate-900 bg-white">-- PILIH NILAI --</option>
                              {SIVIK_VALUES.map(v => <option key={v} value={v} className="text-slate-900 bg-white">{v.toUpperCase()}</option>)}
                           </select>
                           <button onClick={() => handleAISuggest('sivik')} disabled={loadingAI.sivik} className="p-2 md:p-2.5 bg-emerald-700 text-white rounded-lg md:rounded-xl shrink-0 shadow-md hover:bg-emerald-800 transition-all">
                              {loadingAI.sivik ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                           </button>
                        </div>
                        <textarea value={formData.sivik.activity} onChange={e => setFormData(prev => ({ ...prev, sivik: { ...prev.sivik, activity: e.target.value } }))} className="w-full p-3 md:p-4 bg-white border border-emerald-100 rounded-xl md:rounded-2xl font-black text-slate-900 text-[9px] md:text-[10px] h-20 md:h-24 outline-none leading-relaxed shadow-sm" placeholder="Aktiviti penerapan nilai sivik..." />
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-black uppercase text-slate-700 ml-1">Refleksi & Impak Guru (Auto-AI)</label>
                        <textarea value={formData.reflection} onChange={e => setFormData(prev => ({ ...prev, reflection: e.target.value }))} className="w-full p-4 md:p-5 bg-slate-50 border border-slate-300 rounded-2xl md:rounded-3xl font-black text-slate-900 text-[10px] md:text-[11px] h-16 md:h-20 outline-none italic leading-relaxed shadow-sm" placeholder="Ulasan guru tentang impak perjumpaan..." />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[8px] md:text-[9px] font-black uppercase text-slate-900 ml-1 tracking-widest">Lampiran Gambar (Wajib 3 Keping)</label>
                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                           {[0, 1, 2].map(idx => (
                              <label key={idx} className="aspect-square bg-white rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-700 hover:bg-indigo-50/10 transition-all shadow-sm">
                                 {tempImages[idx] ? <img src={tempImages[idx]!} className="w-full h-full object-cover" /> : (
                                    <div className="text-center p-2 md:p-4">
                                       <Camera size={20} className="mx-auto text-slate-300 mb-1 md:mb-2 group-hover:text-indigo-700" />
                                       <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase">MUAT NAIK</span>
                                    </div>
                                 )}
                                 <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                       const reader = new FileReader();
                                       reader.onload = async (ev) => {
                                          const compressed = await compressImage(ev.target?.result as string);
                                          const newImgs = [...tempImages];
                                          newImgs[idx] = compressed;
                                          setTempImages(newImgs);
                                       };
                                       reader.readAsDataURL(file);
                                    }
                                 }} />
                              </label>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-3 md:gap-4 pt-6 border-t border-slate-200">
                     <button onClick={() => setViewMode('list')} className="flex-1 py-3 md:py-4 bg-slate-100 text-slate-900 border border-slate-300 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase hover:bg-slate-200 transition-all">BATAL</button>
                     <button onClick={handleSave} className="flex-[2] py-3 md:py-4 bg-indigo-700 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase shadow-xl hover:bg-indigo-800 transition-all active:scale-95">SIMPAN & PAPAR OPR</button>
                  </div>
               </div>
            </div>
          )}

          {viewMode === 'view' && selectedOpr && (
             <div className={`mx-auto animate-in zoom-in-95 duration-700 flex flex-col items-center w-full h-full overflow-auto py-6 md:py-10 print:py-0 print:m-0 no-scrollbar`}>
                <div className="flex justify-between items-center gap-3 md:gap-4 bg-white p-3 md:p-5 rounded-2xl md:rounded-[32px] shadow-sm border border-slate-300 mb-6 md:mb-8 w-full max-w-4xl px-4 md:px-5 print:hidden">
                   <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-base md:text-lg shadow-lg shrink-0">{selectedOpr.week}</div>
                      <div className="min-w-0">
                        <h3 className="text-[10px] md:text-sm font-black text-slate-950 uppercase tracking-tight leading-none truncate">{selectedOpr.title}</h3>
                        <p className="text-[7px] md:text-[9px] font-black text-slate-700 uppercase tracking-widest mt-1.5 truncate">{selectedOpr.date} | {selectedOpr.time}</p>
                      </div>
                   </div>
                   <div className="flex gap-2 shrink-0">
                      <button onClick={() => downloadPDF(selectedOpr)} className="flex items-center gap-1 md:gap-2 bg-slate-950 text-white px-3 md:px-8 py-2 md:py-3.5 rounded-lg md:rounded-2xl font-black text-[7px] md:text-[9px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                        <Download size={16} /> <span className="hidden sm:inline">DOWNLOAD PDF</span>
                      </button>
                      <button onClick={() => { if(confirm('Padam laporan ini?')) { setOprs(prev => prev.filter(o => o.id !== selectedOpr.id)); setViewMode('list'); } }} className="p-2 md:p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg md:rounded-2xl hover:bg-rose-700 hover:text-white transition-all shadow-sm">
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>

                <div id="opr-card" className="bg-white shadow-2xl flex flex-col relative shrink-0 overflow-hidden print:shadow-none print:border-none print:m-0 transition-transform origin-top border border-slate-100" style={{ 
                    width: isFullscreen ? '100%' : '210mm', 
                    height: isFullscreen ? 'auto' : '297mm',
                    minHeight: '297mm',
                    maxHeight: '297mm',
                    aspectRatio: '210/297'
                  }}>
                   <div className="bg-slate-950 px-6 md:px-8 py-6 text-white flex items-center justify-between shrink-0 h-[22mm]">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl p-1.5 md:p-2 shadow-inner">
                          <img src={unit.customImage || SCHOOL_LOGO} className="w-full h-full object-contain" />
                        </div>
                        <div className="space-y-1">
                          <h1 className="text-sm md:text-xl font-black uppercase tracking-tight leading-none">LAPORAN AKTIVITI KOKURIKULUM (OPR)</h1>
                          <p className="text-[7px] md:text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">UNIT KOKURIKULUM SK KEMASEK - SESI 2026/2027</p>
                        </div>
                      </div>
                   </div>
                   <div className="flex-1 p-6 md:p-10 flex flex-col text-black justify-between gap-4 md:gap-6 overflow-hidden">
                      <div className="space-y-4 md:space-y-6">
                        <div className="grid grid-cols-3 gap-2 md:gap-4 pb-3 md:pb-4 border-b-2 border-slate-200">
                           <div className="space-y-0.5 md:space-y-1">
                              <p className="text-[6px] md:text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none">Unit & Minggu</p>
                              <p className="text-[9px] md:text-[12px] font-black text-black uppercase leading-tight truncate">{unit.name} • MGG {selectedOpr.week}</p>
                           </div>
                           <div className="space-y-0.5 md:space-y-1 text-center">
                              <p className="text-[6px] md:text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none">Tarikh & Masa</p>
                              <p className="text-[9px] md:text-[12px] font-black text-black uppercase leading-tight truncate">{selectedOpr.date} • {selectedOpr.time}</p>
                           </div>
                           <div className="space-y-0.5 md:space-y-1 text-right">
                              <p className="text-[6px] md:text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none">Hadir (M|G)</p>
                              <p className="text-[9px] md:text-[12px] font-black text-black uppercase leading-tight truncate">M:{selectedOpr.studentAttendance}% • G:{selectedOpr.teacherAttendance}%</p>
                           </div>
                        </div>
                        <div className="text-center py-2 md:py-4">
                           <h2 className="text-base md:text-2xl font-black text-black uppercase leading-tight underline underline-offset-4 md:underline-offset-8 decoration-2 md:decoration-4 decoration-indigo-700/20 tracking-tight">{selectedOpr.title}</h2>
                        </div>
                        <div className="space-y-4 md:space-y-6">
                           <div className="space-y-1 md:space-y-1.5">
                              <h3 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-indigo-800 flex items-center gap-1.5 md:gap-2">
                                <div className="w-1 md:w-1.5 h-3 md:h-3.5 bg-indigo-800 rounded-full"></div> 1. OBJEKTIF AKTIVITI
                              </h3>
                              <div className="text-[11px] md:text-[14px] font-black text-black whitespace-pre-line leading-snug pl-2.5 md:pl-4">{selectedOpr.objective}</div>
                           </div>
                           <div className="space-y-1 md:space-y-1.5">
                              <h3 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-indigo-800 flex items-center gap-1.5 md:gap-2">
                                <div className="w-1 md:w-1.5 h-3 md:h-3.5 bg-indigo-800 rounded-full"></div> 2. RINGKASAN AKTIVITI
                              </h3>
                              <div className="text-[11px] md:text-[14px] font-black text-black whitespace-pre-line leading-snug pl-2.5 md:pl-4">{selectedOpr.activity}</div>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                              {selectedOpr.pikebm && (
                                <div className="p-3 md:p-4 bg-indigo-50 border border-indigo-200 rounded-xl md:rounded-2xl space-y-1 md:space-y-2">
                                   <h4 className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-indigo-900">3. SISIPAN PIKEBM ({selectedOpr.pikebm.objective})</h4>
                                   <div className="text-[10px] md:text-[13px] font-black text-black leading-snug whitespace-pre-line">{selectedOpr.pikebm.steps}</div>
                                </div>
                              )}
                              {selectedOpr.sivik && (
                                <div className="p-3 md:p-4 bg-emerald-50 border border-emerald-200 rounded-xl md:rounded-2xl space-y-1 md:space-y-2">
                                   <h4 className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-emerald-900">4. PENERAPAN SIVIK ({selectedOpr.sivik.theme})</h4>
                                   <div className="text-[10px] md:text-[13px] font-black text-black leading-snug whitespace-pre-line">{selectedOpr.sivik.activity}</div>
                                </div>
                              )}
                           </div>
                           <div className="space-y-1 md:space-y-1.5">
                              <h3 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-indigo-800 flex items-center gap-1.5 md:gap-2">
                                <div className="w-1 md:w-1.5 h-3 md:h-3.5 bg-indigo-800 rounded-full"></div> 5. REFLEKSI & IMPAK GURU
                              </h3>
                              <div className="text-[11px] md:text-[14px] font-black text-black whitespace-pre-line leading-snug italic pl-2.5 md:pl-4">{selectedOpr.reflection}</div>
                              <p className="text-[8px] font-black mt-2 text-slate-700">DISEDIAKAN OLEH: {selectedOpr.sivik?.suggestion?.toUpperCase() || "GURU"}</p>
                           </div>
                        </div>
                      </div>
                      <div className="mt-auto space-y-2 md:space-y-3 pt-3 md:pt-6 border-t border-slate-200">
                         <h3 className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">6. LAMPIRAN BERGAMBAR AKTIVITI</h3>
                         <div className="grid grid-cols-3 gap-3 md:gap-6">
                            {selectedOpr.images.map((img, i) => (
                              <div key={i} className="aspect-square bg-slate-50 rounded-xl md:rounded-[24px] border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
                                {img ? <img src={img} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-200" size={24} />}
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                   <div className="mt-auto px-6 md:px-10 py-4 md:py-6 border-t border-slate-200 flex items-end justify-between bg-slate-50/50 shrink-0 h-[18mm] md:h-[20mm]">
                     <div className="space-y-0.5 md:space-y-1">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">Unit Kokurikulum SK Kemasek © 2026</p>
                        <p className="text-[6px] md:text-[8px] font-black text-slate-500 uppercase tracking-tighter leading-none">Dokumen Dijana Secara Digital Oleh E-KOKO WEKEMS - Tiada Tandatangan Diperlukan.</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[7px] md:text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none">SESI 2026/2027</p>
                     </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #opr-card, #opr-card * { visibility: visible; }
          #opr-card { 
            position: absolute; 
            left: 0; 
            top: 0; 
            margin: 0; 
            padding: 0; 
            width: 210mm !important; 
            height: 297mm !important;
            border: none !important;
            box-shadow: none !important;
            transform: none !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default OPRSection;
