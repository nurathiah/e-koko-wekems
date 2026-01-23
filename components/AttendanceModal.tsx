
import React, { useState, useMemo } from 'react';
import { Unit, Student, Teacher, MeetingMetadata } from '../types';
import { X, Save, Users, Clock, AlertCircle, UserCheck, ListOrdered, ArrowLeft, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AttendanceModalProps {
  unit: Unit;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  meetings: MeetingMetadata[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  setMeetings: React.Dispatch<React.SetStateAction<MeetingMetadata[]>>;
  isAdmin: boolean;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  unit, onClose, students, teachers, meetings, setStudents, setTeachers, setMeetings, isAdmin
}) => {
  const [week, setWeek] = useState(1);
  const [activeView, setActiveView] = useState<'mark' | 'analysis'>('mark');

  const currentMeeting = useMemo(() => {
    return meetings.find(m => m.unitId === unit.id && m.week === week) || {
      unitId: unit.id,
      week: week,
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      location: ''
    };
  }, [meetings, week, unit.id]);

  const updateMeeting = (field: string, value: string) => {
    setMeetings(prev => {
      const otherMeetings = prev.filter(m => !(m.unitId === unit.id && m.week === week));
      return [...otherMeetings, { ...currentMeeting, [field]: value }];
    });
  };

  const toggleAttendance = (id: string, type: 'student' | 'teacher') => {
    if (type === 'student') {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, attendance: { ...s.attendance, [week]: !s.attendance[week] } } : s));
    } else {
      setTeachers(prev => prev.map(t => t.id === id ? { ...t, attendance: { ...t.attendance, [week]: !t.attendance[week] } } : t));
    }
  };

  const weeklyData = useMemo(() => {
    return [...Array(12)].map((_, i) => {
      const w = i + 1;
      const sPresent = students.length - students.filter(s => s.attendance[w]).length;
      const tPresent = teachers.length - teachers.filter(t => t.attendance[w]).length;
      return {
        name: `M${w}`,
        murid: students.length ? Math.round((sPresent / students.length) * 100) : 0,
        guru: teachers.length ? Math.round((tPresent / teachers.length) * 100) : 0
      };
    });
  }, [students, teachers]);

  const stats = useMemo(() => {
    const sAbsent = students.filter(s => s.attendance[week]).length;
    const tAbsent = teachers.filter(t => t.attendance[week]).length;
    return {
      sPresent: students.length - sAbsent,
      tPresent: teachers.length - tAbsent,
      sPercent: students.length ? Math.round(((students.length - sAbsent) / students.length) * 100) : 0,
      tPercent: teachers.length ? Math.round(((teachers.length - tAbsent) / teachers.length) * 100) : 0,
    };
  }, [students, teachers, week]);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-[32px] w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden shadow-2xl">
        
        <div className="shrink-0 bg-white border-b p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"><ArrowLeft size={20}/></button>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Urus Kehadiran</h2>
              <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{unit.name}</p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
             <button onClick={() => setActiveView('mark')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'mark' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Tanda Hadir</button>
             <button onClick={() => setActiveView('analysis')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'analysis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Analisa Grafik</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50">
          {activeView === 'mark' ? (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                   <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center text-center space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pilih Minggu</p>
                      <div className="grid grid-cols-4 gap-2">
                         {[...Array(12)].map((_, i) => (
                           <button key={i} onClick={() => setWeek(i+1)} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${week === i+1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{i+1}</button>
                         ))}
                      </div>
                   </div>
                   <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tarikh</label>
                        <input type="date" value={currentMeeting.date} onChange={e => updateMeeting('date', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 rounded-xl font-bold outline-none text-xs text-black border border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Masa</label>
                        <input type="time" value={currentMeeting.time} onChange={e => updateMeeting('time', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 rounded-xl font-bold outline-none text-xs text-black border border-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Lokasi</label>
                        <input type="text" value={currentMeeting.location} onChange={e => updateMeeting('location', e.target.value)} placeholder="Contoh: Dataran" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl font-bold outline-none text-xs text-black border border-slate-200" />
                      </div>
                   </div>
                   <div className="lg:col-span-3 grid grid-cols-2 gap-4">
                      <div className="bg-indigo-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-100 flex flex-col justify-center text-center">
                         <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">HADIR MURID</p>
                         <p className="text-2xl font-black">{stats.sPercent}%</p>
                      </div>
                      <div className="bg-emerald-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-100 flex flex-col justify-center text-center">
                         <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">HADIR GURU</p>
                         <p className="text-2xl font-black">{stats.tPercent}%</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                         <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><UserCheck size={16} className="text-indigo-600" /> Senarai Guru Penasihat</h3>
                      </div>
                      <div className="p-3 space-y-1 max-h-[400px] overflow-y-auto no-scrollbar">
                         {teachers.map((t, idx) => (
                           <button key={t.id} onClick={() => toggleAttendance(t.id, 'teacher')} className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group ${t.attendance[week] ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                              <div className="flex items-center gap-4 text-left">
                                 <span className="text-[10px] font-black text-slate-300 w-4">{idx+1}.</span>
                                 <div>
                                    <p className="text-xs font-black text-slate-800 uppercase leading-none mb-1">{t.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.position}</p>
                                 </div>
                              </div>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${t.attendance[week] ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'border-slate-200 text-transparent group-hover:border-slate-300'}`}><X size={16} strokeWidth={3} /></div>
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                         <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Users size={16} className="text-indigo-600" /> Senarai Ahli Murid</h3>
                      </div>
                      <div className="p-3 space-y-1 max-h-[400px] overflow-y-auto no-scrollbar">
                         {students.map((s, idx) => (
                           <button key={s.id} onClick={() => toggleAttendance(s.id, 'student')} className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group ${s.attendance[week] ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                              <div className="flex items-center gap-4 text-left">
                                 <span className="text-[10px] font-black text-slate-300 w-4">{idx+1}.</span>
                                 <div>
                                    <p className="text-xs font-black text-slate-800 uppercase leading-none mb-1">{s.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.className}</p>
                                 </div>
                              </div>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${s.attendance[week] ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'border-slate-200 text-transparent group-hover:border-slate-300'}`}><X size={16} strokeWidth={3} /></div>
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          ) : (
             <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                   <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3"><TrendingUp size={20} className="text-indigo-600" /> Trend Kehadiran Mingguan (M1 - M12)</h3>
                   <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} domain={[0, 100]} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="murid" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={24} />
                            <Bar dataKey="guru" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="flex justify-center gap-8 mt-6">
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-indigo-600"></div> <span className="text-[10px] font-black uppercase text-slate-400">MURID</span></div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-emerald-500"></div> <span className="text-[10px] font-black uppercase text-slate-400">GURU</span></div>
                   </div>
                </div>
             </div>
          )}
        </div>

        <div className="p-6 bg-white border-t flex items-center justify-end gap-4 shrink-0">
           <button onClick={onClose} className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">KEMBALI</button>
           <button onClick={onClose} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs shadow-xl transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest">
              <Save size={18} /> Simpan Data
           </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
