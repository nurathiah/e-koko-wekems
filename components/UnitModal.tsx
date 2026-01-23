
import React, { useState } from 'react';
import { Unit, Student, Teacher } from '../types';
import { X, UserPlus, Upload, Trash2, Camera, ArrowLeft, ArrowRight, User, Users, GraduationCap, ArrowRightLeft } from 'lucide-react';
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
  const [showIndividualForm, setShowIndividualForm] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ name: '', detail: '' }); 
  const [transferTarget, setTransferTarget] = useState<{id: string, type: 'student' | 'teacher'} | null>(null);

  const isRumahSukan = unit.category === 'rumah_sukan';

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
        const validRows = rows.slice(1).filter(r => r[0] && r[1]);
        if (type === 'student') {
          const newStudents: Student[] = validRows.map(r => ({ id: `s-${Date.now()}-${Math.random()}`, name: String(r[0]).toUpperCase(), className: String(r[1] || 'T/A').toUpperCase(), unitId: unit.id, attendance: {} }));
          setStudents(prev => [...prev, ...newStudents]);
        } else {
          const newTeachers: Teacher[] = validRows.map(r => ({ id: `t-${Date.now()}-${Math.random()}`, name: String(r[0]).toUpperCase(), position: String(r[1] || 'Guru Penasihat').toUpperCase(), unitId: unit.id, attendance: {} }));
          setTeachers(prev => [...prev, ...newTeachers]);
        }
        alert(`Berjaya memproses ${validRows.length} rekod.`);
      } catch (err) { alert('Ralat fail Excel.'); }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleAddIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.detail) return alert('Sila isi maklumat lengkap.');
    if (activeTab === 'students') {
      setStudents(prev => [...prev, { id: `s-${Date.now()}`, name: newMemberForm.name.toUpperCase(), className: newMemberForm.detail.toUpperCase(), unitId: unit.id, attendance: {} }]);
    } else {
      setTeachers(prev => [...prev, { id: `t-${Date.now()}`, name: newMemberForm.name.toUpperCase(), position: newMemberForm.detail.toUpperCase(), unitId: unit.id, attendance: {} }]);
    }
    setNewMemberForm({ name: '', detail: '' });
    setShowIndividualForm(false);
  };

  const handleTransfer = (targetUnitId: string) => {
    if (!transferTarget) return;
    if (transferTarget.type === 'student') setStudents(prev => prev.map(s => s.id === transferTarget.id ? { ...s, unitId: targetUnitId } : s));
    else setTeachers(prev => prev.map(t => t.id === transferTarget.id ? { ...t, unitId: targetUnitId } : t));
    setTransferTarget(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-2 md:p-6">
      <div className="bg-white rounded-[48px] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="shrink-0 bg-white border-b border-slate-100 p-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200 text-slate-900"><ArrowLeft size={24} /></button>
            <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center shadow-inner text-4xl overflow-hidden ring-4 ring-slate-100 border border-slate-100">
              {unit.customImage ? <img src={unit.customImage} className="w-full h-full object-cover" /> : unit.icon}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">{unit.name}</h2>
              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mt-2">{unit.category.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-900"><X size={24} /></button>
        </div>

        <div className="flex border-b border-slate-100 shrink-0 bg-white overflow-x-auto no-scrollbar">
          {['students', 'teachers', 'settings'].map(tabId => (
            <button key={tabId} onClick={() => { setActiveTab(tabId as any); setShowIndividualForm(false); }} className={`flex-1 min-w-[150px] py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tabId ? 'text-indigo-800' : 'text-slate-400 hover:text-slate-900'}`}>
              {tabId === 'students' ? 'Ahli Murid' : tabId === 'teachers' ? 'Guru Penasihat' : 'Tetapan'}
              {activeTab === tabId && <div className="absolute bottom-0 left-6 right-6 h-1 bg-indigo-800 rounded-t-full"></div>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-10 no-scrollbar bg-slate-50/50">
          {showIndividualForm && (
            <div className="mb-10 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-white p-8 rounded-[40px] border-2 border-indigo-100 shadow-xl space-y-6">
                 <form onSubmit={handleAddIndividual} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" autoFocus value={newMemberForm.name} onChange={e => setNewMemberForm(p => ({...p, name: e.target.value}))} placeholder="NAMA PENUH" className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-black text-xs uppercase" />
                    <input type="text" value={newMemberForm.detail} onChange={e => setNewMemberForm(p => ({...p, detail: e.target.value}))} placeholder={activeTab === 'students' ? "KELAS" : "JAWATAN"} className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-black text-xs uppercase" />
                    <div className="md:col-span-2 flex justify-end gap-3"><button type="submit" className="px-10 py-4 bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">DAFTAR SEKARANG</button></div>
                 </form>
              </div>
            </div>
          )}

          {activeTab !== 'settings' && (
            <div className="space-y-8">
              <div className="flex gap-3">
                <label className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[24px] text-[10px] font-black cursor-pointer uppercase shadow-lg hover:bg-black transition-all">
                  <Upload size={18} /> MUAT NAIK EXCEL
                  <input type="file" className="hidden" accept=".xlsx,.xls" onChange={e => handleBulkUpload(e, activeTab === 'students' ? 'student' : 'teacher')} />
                </label>
                <button onClick={() => setShowIndividualForm(true)} className="flex items-center gap-3 bg-indigo-700 text-white px-8 py-4 rounded-[24px] text-[10px] font-black uppercase shadow-lg hover:bg-indigo-800 transition-all">
                  <UserPlus size={18} /> TAMBAH AHLI
                </button>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="text-left px-10 py-6">Nama Anggota</th>
                      <th className="text-left px-10 py-6">{activeTab === 'students' ? 'Kelas' : 'Jawatan'}</th>
                      <th className="text-right px-10 py-6">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(activeTab === 'students' ? students : teachers).map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6 font-black text-slate-900 uppercase">{s.name}</td>
                        <td className="px-10 py-6 font-bold text-slate-500 uppercase">{activeTab === 'students' ? s.className : s.position}</td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-3">
                             {isAdmin && <button onClick={() => setTransferTarget({id: s.id, type: activeTab === 'students' ? 'student' : 'teacher'})} className="p-3 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><ArrowRightLeft size={18} /></button>}
                             <button onClick={() => { if(confirm('Padam?')) (activeTab === 'students' ? setStudents : setTeachers)(prev => prev.filter(st => st.id !== s.id)); }} className="p-3 bg-slate-50 text-rose-400 hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto py-20 text-center space-y-10">
              <div className="w-40 h-40 bg-white rounded-[48px] shadow-2xl mx-auto flex items-center justify-center text-6xl overflow-hidden ring-8 ring-indigo-50 border border-slate-100">
                {unit.customImage ? <img src={unit.customImage} className="w-full h-full object-cover" /> : unit.icon}
              </div>
              <label className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-xs cursor-pointer shadow-2xl uppercase tracking-widest hover:scale-105 transition-transform">
                <Camera size={20} /> TUKAR IMEJ UNIT
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
          )}
        </div>

        {transferTarget && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-[120] flex items-center justify-center p-8 animate-in fade-in">
             <div className="w-full max-w-md space-y-8 text-center">
                <div className="w-24 h-24 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-2xl"><ArrowRightLeft size={48} /></div>
                <div>
                   <h3 className="text-2xl font-black uppercase text-white tracking-tight">Pindah Unit</h3>
                   <p className="text-xs font-bold text-indigo-300 uppercase mt-2">Pilih unit baru dalam kategori {unit.category.replace('_', ' ')}</p>
                </div>
                <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-4 no-scrollbar">
                   {allUnits.filter(u => u.category === unit.category && u.id !== unit.id).map(target => (
                      <button key={target.id} onClick={() => handleTransfer(target.id)} className="p-6 bg-white/5 hover:bg-indigo-600 border border-white/10 rounded-3xl flex items-center justify-between transition-all group">
                         <span className="font-black text-sm text-white uppercase group-hover:scale-110 transition-transform">{target.icon} {target.name}</span>
                         <ArrowRight size={20} className="text-indigo-400 group-hover:text-white" />
                      </button>
                   ))}
                </div>
                <button onClick={() => setTransferTarget(null)} className="px-10 py-4 bg-white/10 text-white/40 rounded-2xl font-black text-[10px] uppercase tracking-widest">Batal Perpindahan</button>
             </div>
          </div>
        )}

        <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-end shrink-0">
           <button onClick={onClose} className="px-16 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all">TUTUP PENGURUSAN</button>
        </div>
      </div>
    </div>
  );
};

export default UnitModal;
