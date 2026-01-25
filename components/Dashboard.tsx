
import React, { useState, useMemo } from 'react';
import { Unit, Student, Teacher, OPR, SuccessStory, GlobalEvent } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
} from 'recharts';
import { 
  Users, BookOpen, UserCheck, FileText, 
  Calendar, Trophy, X, Plus, Sparkles, AlertTriangle, Clock, CheckCircle2, Trash2, Edit3, Camera,
  StickyNote, Save, Shield, MapPin, UserX, AlertCircle, Info, TrendingUp
} from 'lucide-react';

interface DashboardProps {
  units: Unit[];
  students: Student[];
  teachers: Teacher[];
  oprs: OPR[];
  meetings: any[];
  achievements: any[];
  globalEvents: GlobalEvent[];
  setAchievements: React.Dispatch<React.SetStateAction<any[]>>;
  setGlobalEvents: React.Dispatch<React.SetStateAction<GlobalEvent[]>>;
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>>; 
  isAdmin: boolean;
  successStories: SuccessStory[];
  setSuccessStories: React.Dispatch<React.SetStateAction<SuccessStory[]>>;
  adminNotes: string[];
  setAdminNotes: React.Dispatch<React.SetStateAction<string[]>>;
}

const COLORS_STUDENT = ['#6366f1', '#a855f7', '#ec4899'];
const COLORS_TEACHER = ['#10b981', '#14b8a6', '#0ea5e9'];

const Dashboard: React.FC<DashboardProps> = ({ 
  units, students, teachers, oprs, meetings, globalEvents, isAdmin, successStories, setSuccessStories,
  adminNotes, setAdminNotes, setGlobalEvents
}) => {
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [showNotesForm, setShowNotesForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [editingEvent, setEditingEvent] = useState<GlobalEvent | null>(null);
  
  const [storyFormData, setStoryFormData] = useState<Partial<SuccessStory>>({ title: '', category: 'MURID', date: new Date().toISOString().split('T')[0], image: null });
  const [eventFormData, setEventFormData] = useState<Partial<GlobalEvent>>({ title: '', date: new Date().toISOString().split('T')[0], time: '08:00', image: null });
  const [tempNotes, setTempNotes] = useState<string[]>([]);

  const currentWeek = useMemo(() => {
    if (oprs.length === 0) return 1;
    return Math.max(...oprs.map(o => o.week));
  }, [oprs]);

  const pendingUnits = useMemo(() => {
    return units.map(unit => {
      const hasAttendance = meetings.some(m => m.unitId === unit.id && m.week === currentWeek);
      const hasOPR = oprs.some(o => o.unitId === unit.id && o.week === currentWeek);
      return { ...unit, noAttendance: !hasAttendance, noOPR: !hasOPR };
    }).filter(u => u.noAttendance || u.noOPR);
  }, [units, meetings, oprs, currentWeek]);

  const studentAttendanceData = useMemo(() => {
    return ['beruniform', 'kelab', 'sukan'].map(cat => {
      const catUnitsIds = units.filter(u => u.category === cat).map(u => u.id);
      const catStudents = students.filter(s => catUnitsIds.includes(s.unitId));
      let total = catStudents.length * 12;
      let absent = 0;
      catStudents.forEach(s => absent += Object.values(s.attendance).filter(a => a).length);
      return { name: cat.toUpperCase(), value: total > 0 ? Math.round(((total - absent) / total) * 100) : 0 };
    });
  }, [units, students]);

  const teacherAttendanceData = useMemo(() => {
    return ['beruniform', 'kelab', 'sukan'].map(cat => {
      const catUnitsIds = units.filter(u => u.category === cat).map(u => u.id);
      const filteredTeachers = teachers.filter(t => catUnitsIds.includes(t.unitId));
      let total = filteredTeachers.length * 12;
      let absent = 0;
      filteredTeachers.forEach(t => absent += Object.values(t.attendance).filter(a => a).length);
      return { name: cat.toUpperCase(), value: total > 0 ? Math.round(((total - absent) / total) * 100) : 0 };
    });
  }, [units, teachers]);

  const problematicAttendance = useMemo(() => {
    const sList = students.map(s => {
      const absent = Object.values(s.attendance).filter(a => a).length;
      const percent = Math.round(((12 - absent) / 12) * 100);
      const u = units.find(unit => unit.id === s.unitId);
      return { ...s, percent, type: 'MURID', unitName: u?.name || 'N/A', detail: s.className };
    }).filter(s => s.percent < 40);

    const tList = teachers.map(t => {
      const absent = Object.values(t.attendance).filter(a => a).length;
      const percent = Math.round(((12 - absent) / 12) * 100);
      const u = units.find(unit => unit.id === t.unitId);
      return { ...t, percent, type: 'GURU', unitName: u?.name || 'N/A', detail: t.position };
    }).filter(t => t.percent < 40);

    return [...sList, ...tList].sort((a, b) => a.percent - b.percent);
  }, [students, teachers, units]);

  const handleSaveStory = () => {
    if (!storyFormData.title) return;
    if (editingStory) {
      setSuccessStories(prev => prev.map(s => s.id === editingStory.id ? { ...s, ...storyFormData } as SuccessStory : s));
    } else {
      setSuccessStories(prev => [{ ...storyFormData, id: `ss-${Date.now()}` } as SuccessStory, ...prev]);
    }
    setShowStoryForm(false);
    setEditingStory(null);
    setStoryFormData({ title: '', category: 'MURID', date: new Date().toISOString().split('T')[0], image: null });
  };

  const handleSaveEvent = () => {
    if (!eventFormData.title) return;
    if (editingEvent) {
      setGlobalEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...eventFormData } as GlobalEvent : e));
    } else {
      setGlobalEvents(prev => [...prev, { ...eventFormData, id: `ev-${Date.now()}` } as GlobalEvent]);
    }
    setShowEventForm(false);
    setEditingEvent(null);
    setEventFormData({ title: '', date: new Date().toISOString().split('T')[0], time: '08:00', image: null });
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Padam aktiviti ini daripada takwim?')) {
      setGlobalEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleSaveNotes = () => {
    setAdminNotes(tempNotes.filter(n => n.trim() !== ''));
    setShowNotesForm(false);
  };

  const kpiStats = [
    { label: 'Ahli Murid', value: students.length, icon: Users, color: '#6366f1', bg: 'bg-indigo-50' },
    { label: 'Guru Penasihat', value: teachers.length, icon: UserCheck, color: '#10b981', bg: 'bg-emerald-50' },
    { label: 'Unit Koko', value: units.length, icon: BookOpen, color: '#f59e0b', bg: 'bg-amber-50' },
    { label: 'Laporan OPR', value: oprs.length, icon: FileText, color: '#f43f5e', bg: 'bg-rose-50' },
  ];

  const getDayAndMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ["JAN", "FEB", "MAC", "APR", "MEI", "JUN", "JUL", "OGO", "SEP", "OKT", "NOV", "DIS"];
    return { day, month: months[date.getMonth()] };
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-1000">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all h-40 md:h-44">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${stat.bg} flex items-center justify-center`} style={{ color: stat.color }}>
                <stat.icon size={28} />
              </div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] bg-slate-50 px-3 py-1 rounded-full">Statistik</span>
            </div>
            <div className="mt-4">
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 leading-none">{stat.value}</h3>
              <p className="text-xs md:text-sm font-black text-slate-500 uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-8 space-y-10">
           {isAdmin && problematicAttendance.length > 0 && (
             <div className="bg-rose-50/50 p-8 md:p-10 rounded-[48px] border border-rose-200 shadow-sm overflow-hidden animate-in slide-in-from-top-10 duration-700">
                <div className="flex items-center justify-between mb-8">
                   <div>
                      <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight text-rose-900 flex items-center gap-3">
                         <UserX size={24} className="text-rose-600" /> Analisa Kehadiran Kritikal
                      </h3>
                      <p className="text-xs font-bold text-rose-600/60 uppercase tracking-[0.2em] mt-2">Senarai Merah • Kehadiran Kurang 40%</p>
                   </div>
                   <div className="bg-rose-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg">
                      {problematicAttendance.length} Rekod Kritikal
                   </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="text-[9px] font-black uppercase text-rose-800/50 tracking-widest border-b border-rose-200">
                             <th className="px-4 py-3">Nama Anggota</th>
                             <th className="px-4 py-3">Unit</th>
                             <th className="px-4 py-3 text-center">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-rose-100">
                          {problematicAttendance.slice(0, 5).map((person, idx) => (
                            <tr key={idx} className="group hover:bg-rose-100/50 transition-all">
                               <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                        {person.type === 'MURID' ? 'M' : 'G'}
                                     </div>
                                     <span className="text-[11px] font-black text-rose-900 uppercase truncate">{person.name}</span>
                                  </div>
                               </td>
                               <td className="px-4 py-4 text-[10px] font-black text-rose-800/70 uppercase">{person.unitName}</td>
                               <td className="px-4 py-4 text-center">
                                  <span className="inline-block px-3 py-1 bg-white text-rose-600 border border-rose-200 rounded-lg text-[9px] font-black">{person.percent}%</span>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
                </div>
             </div>
           )}

           <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
                       <Clock size={24} className="text-rose-600" /> Tugasan Belum Selesai
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Minggu {currentWeek} • Laporan Mingguan</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {pendingUnits.length > 0 ? pendingUnits.slice(0, 6).map(u => (
                    <div key={u.id} className="p-5 bg-slate-50 rounded-[28px] border border-slate-100 flex items-center gap-4 group hover:bg-white hover:shadow-md transition-all">
                       <div className="text-2xl md:text-3xl shrink-0 grayscale group-hover:grayscale-0 transition-all">{u.icon}</div>
                       <div className="min-w-0">
                          <h4 className="text-[11px] font-black text-slate-800 uppercase truncate mb-1.5">{u.name}</h4>
                          <div className="flex gap-2 flex-wrap">
                             {u.noAttendance && <span className="text-[8px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md uppercase">TIADA KEHADIRAN</span>}
                             {u.noOPR && <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-md uppercase">TIADA OPR</span>}
                          </div>
                       </div>
                    </div>
                 )) : (
                    <div className="col-span-2 py-12 text-center bg-emerald-50 rounded-[32px] border-2 border-dashed border-emerald-200">
                       <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
                       <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Semua laporan minggu ini telah diselesaikan!</p>
                    </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm flex flex-col items-center">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 mb-8 flex items-center gap-2">
                    <Users size={18} className="text-indigo-600" /> Kehadiran Murid
                 </h3>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={studentAttendanceData} innerRadius={65} outerRadius={90} paddingAngle={8} dataKey="value">
                             {studentAttendanceData.map((_, i) => <Cell key={i} fill={COLORS_STUDENT[i % COLORS_STUDENT.length]} />)}
                          </Pie>
                          <Tooltip />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm flex flex-col items-center">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 mb-8 flex items-center gap-2">
                    <UserCheck size={18} className="text-emerald-600" /> Kehadiran Guru
                 </h3>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={teacherAttendanceData} innerRadius={65} outerRadius={90} paddingAngle={8} dataKey="value">
                             {teacherAttendanceData.map((_, i) => <Cell key={i} fill={COLORS_TEACHER[i % COLORS_TEACHER.length]} />)}
                          </Pie>
                          <Tooltip />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           {/* SECTION: NOTA PENTADBIRAN - Font Black */}
           <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-black">Nota Pentadbiran</h4>
                 {isAdmin && (
                   <button onClick={() => { setTempNotes([...adminNotes]); setShowNotesForm(true); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                     <Edit3 size={14} />
                   </button>
                 )}
              </div>
              <div className="space-y-6">
                 {adminNotes.length > 0 ? adminNotes.map((note, i) => (
                   <div key={i} className="flex gap-4 group">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5"></div>
                      <p className="text-[11px] font-black text-black leading-relaxed">{note}</p>
                   </div>
                 )) : (
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 text-center">Tiada nota</p>
                 )}
              </div>
           </div>

           <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Takwim Acara</h3>
                {isAdmin && <button onClick={() => setShowEventForm(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Plus size={14}/></button>}
              </div>
              <div className="space-y-6">
                 {globalEvents.map(ev => {
                   const { day, month } = getDayAndMonth(ev.date);
                   return (
                    <div key={ev.id} className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-[8px] font-black uppercase leading-none opacity-60 mb-0.5">{month}</span>
                          <span className="text-lg font-black leading-none">{day}</span>
                       </div>
                       <div className="min-w-0">
                          <h4 className="text-[10px] font-black text-slate-800 uppercase truncate">{ev.title}</h4>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{ev.time}</p>
                       </div>
                    </div>
                   );
                 })}
              </div>
           </div>

           <div className="bg-indigo-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                 <Shield size={160} />
              </div>
              <div className="relative z-10">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 opacity-50">WEKEMS System</h4>
                 <h3 className="text-xl font-black uppercase tracking-tight mb-4 leading-tight">Sistem Pengurusan Kokurikulum Bersepadu</h3>
                 <p className="text-[9px] font-medium opacity-60 leading-relaxed uppercase tracking-widest">Digitalisasi rekod dan data sekolah ke arah efisiensi pentadbiran.</p>
              </div>
           </div>
        </div>

      </div>

      {/* MODAL NOTA PENTADBIRAN */}
      {showNotesForm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-indigo-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                 <StickyNote size={20} /> Kemaskini Nota Pentadbiran
              </h3>
              <button onClick={() => setShowNotesForm(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24}/></button>
            </div>
            <div className="p-10 space-y-6">
               <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4 no-scrollbar">
                  {tempNotes.map((note, idx) => (
                     <div key={idx} className="flex items-start gap-3">
                        <textarea 
                           value={note}
                           onChange={(e) => {
                             const newNotes = [...tempNotes];
                             newNotes[idx] = e.target.value;
                             setTempNotes(newNotes);
                           }}
                           className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
                           rows={2}
                        />
                        <button 
                           onClick={() => setTempNotes(prev => prev.filter((_, i) => i !== idx))}
                           className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  ))}
                  <button 
                    onClick={() => setTempNotes([...tempNotes, ''])}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Tambah Nota Baru
                  </button>
               </div>
               <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button onClick={() => setShowNotesForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">Batal</button>
                  <button onClick={handleSaveNotes} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                     <Save size={16} /> Simpan Perubahan
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL EVENT FORM */}
      {showEventForm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8 bg-indigo-700 text-white flex justify-between">
               <h3 className="font-black uppercase tracking-widest">Tambah Acara</h3>
               <button onClick={() => setShowEventForm(false)}><X size={20}/></button>
            </div>
            <div className="p-10 space-y-4">
               <input type="text" placeholder="NAMA ACARA" value={eventFormData.title} onChange={e => setEventFormData({...eventFormData, title: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase" />
               <input type="date" value={eventFormData.date} onChange={e => setEventFormData({...eventFormData, date: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs" />
               <input type="time" value={eventFormData.time} onChange={e => setEventFormData({...eventFormData, time: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs" />
               <button onClick={handleSaveEvent} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">SIMPAN</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
