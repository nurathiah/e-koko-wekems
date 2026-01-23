
import React, { useState } from 'react';
import { Unit, Student, Teacher } from '../types';
import { X, UserPlus, Upload, Trash2, Camera, RefreshCw, Edit, Save, ArrowLeft, ArrowRight, User, Users, GraduationCap, AlertCircle, ArrowRightLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { FailedRegistration } from '../App';

interface UnitModalProps {
  unit: Unit;
  allUnits?: Unit[];
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  isAdmin: boolean;
  setFailedRegistrations: React.Dispatch<React.SetStateAction<FailedRegistration[]>>;
}

const UnitModal: React.FC<UnitModalProps> = ({ 
  unit, allUnits = [], onClose, students, teachers, setStudents, setTeachers, setUnits, isAdmin, setFailedRegistrations 
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'settings'>('students');
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [editTeacherForm, setEditTeacherForm] = useState({ name: '', position: '' });
  const [showIndividualForm, setShowIndividualForm] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ name: '', detail: '' }); 
  const [transferTarget, setTransferTarget] = useState<{id: string, type: 'student' | 'teacher'} | null>(null);

  const isRumahSukan = unit.category === 'rumah_sukan';

  const getAttendanceStatus = (student: Student) => {
    let presentCount = 0;
    for (let w = 1; w <= 12; w++) {
      if (!student.attendance[w]) presentCount++;
    }
    let colorClass = "bg-red-50 text-red-800 border-red-200";
    let label = "Perhatian";
    if (presentCount >= 10) {
      colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
      label = "Cemerlang";
    } else if (presentCount >= 7) {
      colorClass = "bg-orange-50 text-orange-800 border-orange-200";
      label = "Sederhana";
    }
    return { count: presentCount, colorClass, label };
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'student' | 'teacher') => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1 });
        const allDataRows = rows.slice(1);
        
        const validRows = allDataRows.filter(r => r[0] && r[1]);
        const failedRows = allDataRows.filter(r => !r[0] || !r[1]);

        if (failedRows.length > 0) {
          setFailedRegistrations(prev => [
            ...failedRows.map((r, idx) => ({
              id: `fail-bulk-${Date.now()}-${idx}`,
              name: (r[0] || 'REKOD KOSONG').toUpperCase(),
              type: (type === 'student' ? 'MURID' : 'GURU') as any,
              reason: 'Data Excel Tidak Lengkap',
              category: unit.category
            })),
            ...prev
          ]);
        }

        if (type === 'student') {
          const newStudents: Student[] = validRows.map(r => ({
            id: `s-${Date.now()}-${Math.random()}`,
            name: String(r[0]).toUpperCase(),
            className: String(r[1] || 'T/A').toUpperCase(),
            unitId: unit.id,
            attendance: {}
          }));
          setStudents(prev => [...prev, ...newStudents]);
          const names = newStudents.map(ns => ns.name);
          setFailedRegistrations(prev => prev.filter(f => !names.includes(f.name)));
        } else {
          const newTeachers: Teacher[] = validRows.map(r => ({
            id: `t-${Date.now()}-${Math.random()}`,
            name: String(r[0]).toUpperCase(),
            position: String(r[1] || 'Guru Penasihat').toUpperCase(),
            unitId: unit.id,
            attendance: {}
          }));
          setTeachers(prev => [...prev, ...newTeachers]);
          const names = newTeachers.map(nt => nt.name);
          setFailedRegistrations(prev => prev.filter(f => !names.includes(f.name)));
        }
        
        alert(`Berjaya memproses ${validRows.length} rekod.`);
      } catch (err) {
        alert('Ralat memproses fail Excel.');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleAddIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newMemberForm.name.trim().toUpperCase();
    const cleanDetail = newMemberForm.detail.trim().toUpperCase();
    
    if (!cleanName || !cleanDetail) return alert('Sila isi maklumat dengan lengkap.');

    if (activeTab === 'students') {
      setStudents(prev => [...prev, {
        id: `s-${Date.now()}`,
        name: cleanName,
        className: cleanDetail,
        unitId: unit.id,
        attendance: {}
      }]);
    } else {
      setTeachers(prev => [...prev, {
        id: `t-${Date.now()}`,
        name: cleanName,
        position: cleanDetail,
        unitId: unit.id,
        attendance: {}
      }]);
    }
    setFailedRegistrations(prev => prev.filter(fr => fr.name !== cleanName));
    setNewMemberForm({ name: '', detail: '' });
    setShowIndividualForm(false);
  };

  const handleTransfer = (targetUnitId: string) => {
    if (!transferTarget) return;
    if (transferTarget.type === 'student') {
      setStudents(prev => prev.map(s => s.id === transferTarget.id ? { ...s, unitId: targetUnitId } : s));
    } else {
      setTeachers(prev => prev.map(t => t.id === transferTarget.id ? { ...t, unitId: targetUnitId } : t));
    }
    setTransferTarget(null);
    alert('Perpindahan berjaya.');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-[40px] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        <div className="shrink-0 bg-white border-b border-slate-200 p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all mr-1 border border-slate-200">
              <ArrowLeft size={20} className="text-slate-900" />
            </button>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner text-2xl md:text-3xl overflow-hidden ring-2 ring-slate-200">
              {unit.customImage ? <img src={unit.customImage} className="w-full h-full object-cover" /> : unit.icon}
            </div>
            <div>
              <h2 className="text-sm md:text-xl font-black uppercase tracking-tight truncate max-w-[150px] md:max-w-none text-slate-900">{unit.name}</h2>
              <p className="text-[8px] md:text-[10px] font-black text-indigo-700 uppercase tracking-widest">{unit.category.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-900">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 shrink-0 bg-white overflow-x-auto no-scrollbar">
          {[
            { id: 'students', label: 'Ahli Murid', count: students.length },
            { id: 'teachers', label: 'Guru Penasihat', count: teachers.length },
            { id: 'settings', label: 'Tetapan', count: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setShowIndividualForm(false); }}
              className={`flex-1 min-w-[120px] py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-indigo-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label} {tab.count !== null && <span className="ml-1 bg-slate-100 px-1.5 py-0.5 rounded text-[8px] border border-slate-200">{tab.count}</span>}
              {activeTab === tab.id && <div className="absolute bottom-0 left-4 right-4 h-1 bg-indigo-800 rounded-t-full"></div>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50">
          
          {showIndividualForm && (
            <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-white p-6 md:p-8 rounded-[32px] border-2 border-indigo-200 shadow-xl space-y-6">
                 <h4 className="text-xs font-black text-indigo-800 uppercase tracking-[0.2em]">Daftar {activeTab === 'students' ? 'Murid' : 'Guru'} Baru</h4>
                 <form onSubmit={handleAddIndividual} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" autoFocus value={newMemberForm.name} onChange={e => setNewMemberForm(p => ({...p, name: e.target.value}))} placeholder="NAMA PENUH" className="px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-300 outline-none font-black text-xs uppercase" />
                    <input type="text" value={newMemberForm.detail} onChange={e => setNewMemberForm(p => ({...p, detail: e.target.value}))} placeholder={activeTab === 'students' ? "KELAS" : "JAWATAN"} className="px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-300 outline-none font-black text-xs uppercase" />
                    <div className="md:col-span-2 flex justify-end gap-3"><button type="submit" className="px-8 py-3 bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase shadow-lg">SIMPAN</button></div>
                 </form>
              </div>
            </div>
          )}

          {activeTab !== 'settings' && (
            <div className="space-y-6">
              <div className="flex gap-2">
                <label className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black cursor-pointer uppercase shadow-lg">
                  <Upload size={16} /> IMPORT PUKAL
                  <input type="file" className="hidden" accept=".xlsx,.xls" onChange={e => handleBulkUpload(e, activeTab === 'students' ? 'student' : 'teacher')} />
                </label>
                <button onClick={() => setShowIndividualForm(true)} className="flex items-center gap-3 bg-indigo-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100">
                  <UserPlus size={16} /> TAMBAH INDIVIDU
                </button>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-300 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-xs md:text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-700">
                      <th className="text-left px-8 py-5">Nama Anggota</th>
                      <th className="text-left px-8 py-5">{activeTab === 'students' ? 'Kelas' : 'Jawatan'}</th>
                      {!isRumahSukan && <th className="text-center px-8 py-5">Hadir</th>}
                      <th className="text-right px-8 py-5">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeTab === 'students' ? students : teachers).map((s: any) => {
                      const stats = !isRumahSukan && activeTab === 'students' ? getAttendanceStatus(s) : null;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <span className="font-black text-slate-900 uppercase tracking-tight">{s.name}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-slate-700 font-black uppercase text-[11px]">{activeTab === 'students' ? s.className : s.position}</td>
                          {!isRumahSukan && stats && (
                            <td className="px-8 py-5">
                               <div className={`mx-auto w-fit px-4 py-1.5 rounded-xl border text-[9px] font-black ${stats.colorClass}`}>
                                  {stats.count}/12 {stats.label.toUpperCase()}
                               </div>
                            </td>
                          )}
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                               {isAdmin && (
                                 <button 
                                   onClick={() => setTransferTarget({id: s.id, type: activeTab === 'students' ? 'student' : 'teacher'})} 
                                   className="p-2 text-indigo-400 hover:text-indigo-700"
                                   title="Pindah Unit"
                                 >
                                    <ArrowRightLeft size={18} />
                                 </button>
                               )}
                               <button 
                                 onClick={() => { if(confirm('Padam rekod?')) (activeTab === 'students' ? setStudents : setTeachers)(prev => prev.filter(st => st.id !== s.id)); }}
                                 className="p-2 text-slate-400 hover:text-rose-700"
                               >
                                 <Trash2 size={18} />
                               </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-2xl mx-auto py-10">
              <div className="flex flex-col items-center gap-8 p-10 bg-white rounded-[48px] border border-slate-200 shadow-sm text-center">
                <div className="w-32 h-32 bg-slate-50 rounded-[32px] shadow-inner flex items-center justify-center text-5xl overflow-hidden border border-slate-200">
                  {unit.customImage ? <img src={unit.customImage} className="w-full h-full object-cover" /> : unit.icon}
                </div>
                <label className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black cursor-pointer shadow-xl transition-all hover:bg-black uppercase tracking-widest">
                  <Camera size={16} /> TUKAR IMEJ
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, customImage: ev.target?.result as string } : u));
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
            </div>
          )}
        </div>

        {transferTarget && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[60] flex items-center justify-center p-8 animate-in fade-in">
             <div className="w-full max-w-md space-y-6 text-center">
                <ArrowRightLeft size={48} className="mx-auto text-indigo-600 mb-4" />
                <h3 className="text-xl font-black uppercase text-slate-900">Pindah {transferTarget.type === 'student' ? 'Murid' : 'Guru'}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase">Pilih unit destinasi dalam kategori {unit.category.replace('_', ' ')}:</p>
                <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                   {allUnits.filter(u => u.category === unit.category && u.id !== unit.id).map(target => (
                      <button 
                        key={target.id}
                        onClick={() => handleTransfer(target.id)}
                        className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-2xl flex items-center justify-between transition-all"
                      >
                         <span className="font-black text-xs text-slate-800 uppercase">{target.icon} {target.name}</span>
                         <ArrowRight size={16} className="text-indigo-600" />
                      </button>
                   ))}
                </div>
                <button onClick={() => setTransferTarget(null)} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batal</button>
             </div>
          </div>
        )}

        <div className="p-6 bg-white border-t border-slate-200 flex items-center justify-end">
           <button onClick={onClose} className="px-12 py-4 bg-slate-950 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">TUTUP</button>
        </div>
      </div>
    </div>
  );
};

export default UnitModal;
