
import React, { useState } from 'react';
import { Category, Unit, Student, Teacher, OPR, MeetingMetadata, UnitCommitteeMember, TakwimItem } from '../types';
import { Plus, Settings, CheckCircle, FileText, Trash2, ShieldAlert, Upload, Calendar, Users, ArrowLeft, UserCircle, BookOpen, AlertTriangle, AlertCircle, X } from 'lucide-react';
import UnitModal from './UnitModal';
import AttendanceModal from './AttendanceModal';
import OPRSection from './OPRSection';
import CommitteeModal from './CommitteeModal';
import MemberListModal from './MemberListModal';
import TakwimModal from './TakwimModal';
import ReportBookModal from './ReportBookModal';
import * as XLSX from 'xlsx';
import { GRADIENTS } from '../constants';
import { FailedRegistration } from '../App';

interface UnitGridProps {
  category: Category;
  units: Unit[];
  students: Student[];
  teachers: Teacher[];
  unitCommittees: UnitCommitteeMember[];
  takwimItems: TakwimItem[];
  oprs: OPR[];
  meetings: MeetingMetadata[];
  setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  setUnitCommittees: React.Dispatch<React.SetStateAction<UnitCommitteeMember[]>>;
  setTakwimItems: React.Dispatch<React.SetStateAction<TakwimItem[]>>;
  setOprs: React.Dispatch<React.SetStateAction<OPR[]>>;
  setMeetings: React.Dispatch<React.SetStateAction<MeetingMetadata[]>>;
  isAdmin: boolean;
  failedRegistrations: FailedRegistration[];
  setFailedRegistrations: React.Dispatch<React.SetStateAction<FailedRegistration[]>>;
}

const getAutoEmoji = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('merah')) return '🔴';
  if (n.includes('biru')) return '🔵';
  if (n.includes('kuning')) return '🟡';
  if (n.includes('hijau')) return '🟢';
  if (n.includes('pengakap')) return '🏕️';
  if (n.includes('puteri islam')) return '🕌';
  if (n.includes('bsmm') || n.includes('sabit')) return '🌙';
  if (n.includes('tkrs') || n.includes('krs')) return '🔴';
  if (n.includes('bola sepak')) return '⚽';
  if (n.includes('bola jaring')) return '🏐';
  return '🎖️';
};

const UnitGrid: React.FC<UnitGridProps> = ({ 
  category, units, students, teachers, unitCommittees, takwimItems, oprs, meetings, 
  setUnits, setStudents, setTeachers, setUnitCommittees, setTakwimItems, setOprs, setMeetings, isAdmin,
  failedRegistrations, setFailedRegistrations
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'info' | 'attendance' | 'opr' | 'create' | 'committee' | 'members' | 'takwim' | 'book' | null>(null);

  const filteredUnits = units.filter(u => u.category === category);
  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const currentCategoryFailed = failedRegistrations.filter(fr => fr.category === category);

  const handleOpenModal = (id: string, modal: 'info' | 'attendance' | 'opr' | 'committee' | 'members' | 'takwim' | 'book') => {
    setSelectedUnitId(id);
    setActiveModal(modal);
  };

  const handleBulkUnitUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1 });
        const validRows = rows.slice(1).filter(r => r[0]);
        const newUnits: Unit[] = validRows.map((r, idx) => {
          const unitName = String(r[0]).trim().toUpperCase();
          return {
            id: `u-bulk-${Date.now()}-${idx}`,
            name: unitName,
            icon: getAutoEmoji(unitName),
            color: GRADIENTS[idx % GRADIENTS.length].value,
            category: category,
            isCustom: true
          };
        });
        if (newUnits.length > 0) setUnits(prev => [...prev, ...newUnits]);
      } catch (err) { alert('Ralat fail.'); }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const isRumahSukan = category === 'rumah_sukan';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {currentCategoryFailed.length > 0 && (
        <div className="bg-white p-5 rounded-[28px] border border-rose-200 shadow-sm animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 flex items-center gap-2">
                 <AlertTriangle size={14} /> Pendaftaran Gagal ({category.toUpperCase()})
              </h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {currentCategoryFailed.map(fail => (
                <div key={fail.id} className="group p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between hover:bg-rose-50 transition-all">
                   <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center shrink-0 border border-rose-200"><AlertCircle size={14} /></div>
                      <div className="min-w-0">
                         <h4 className="text-[9px] font-black text-rose-900 truncate uppercase leading-none mb-1">{fail.name}</h4>
                         <p className="text-[7px] font-bold text-rose-500 uppercase tracking-tight">{fail.type} • {fail.reason}</p>
                      </div>
                   </div>
                   <button onClick={() => setFailedRegistrations(prev => prev.filter(fr => fr.id !== fail.id))} className="p-1.5 text-rose-300 hover:text-rose-600 transition-colors">
                      <X size={14} />
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 capitalize tracking-tight flex items-center gap-3">
             {category.replace('_', ' ')} <span className="text-[10px] bg-slate-200 border border-slate-300 px-3 py-1 rounded-full text-slate-800 font-black">{filteredUnits.length} UNIT</span>
          </h2>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <label className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-black text-[10px] md:text-xs shadow-lg transition-all cursor-pointer uppercase tracking-widest border border-slate-700">
              <Upload size={16} /> <span>IMPORT UNIT</span>
              <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleBulkUnitUpload} />
            </label>
          )}
          <button onClick={() => setActiveModal('create')} className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-black text-[10px] md:text-xs shadow-xl transition-all active:scale-95 uppercase tracking-widest border border-indigo-900">
            <Plus size={16} /> <span>TAMBAH UNIT</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredUnits.length > 0 ? filteredUnits.map((unit) => {
          const unitStudents = students.filter(s => s.unitId === unit.id);
          const unitTeachers = teachers.filter(t => t.unitId === unit.id);

          return (
            <div key={unit.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl transition-all group flex flex-col">
              <div className={`h-24 bg-gradient-to-br ${unit.color} flex items-center justify-center p-4 relative`}>
                <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center absolute -bottom-6 ring-4 ring-white transition-transform group-hover:scale-105 border border-slate-100">
                   {unit.customImage ? <img src={unit.customImage} className="w-full h-full object-cover rounded-2xl" /> : <span className="text-3xl">{unit.icon}</span>}
                </div>
              </div>
              <div className="pt-10 pb-6 px-6 flex-1 text-center">
                <h3 className="font-black text-slate-900 text-sm md:text-lg uppercase tracking-tight leading-tight">{unit.name}</h3>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <div className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-800 uppercase flex items-center gap-1.5 border border-slate-200 shadow-sm">
                    <span className="opacity-80">👥</span> {unitStudents.length}
                  </div>
                  <div className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-800 uppercase flex items-center gap-1.5 border border-slate-200 shadow-sm">
                    <span className="opacity-80">👨‍🏫</span> {unitTeachers.length}
                  </div>
                </div>
              </div>
              <div className={`grid ${isRumahSukan ? 'grid-cols-2' : 'grid-cols-3'} border-t border-slate-200`}>
                <button onClick={() => handleOpenModal(unit.id, 'info')} className="flex flex-col items-center gap-1 py-4 text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors border-r border-slate-200">
                  <Settings size={14} /><span className="text-[7px] font-black uppercase tracking-widest">Urus</span>
                </button>
                {!isRumahSukan ? (
                  <>
                    <button onClick={() => handleOpenModal(unit.id, 'attendance')} className="flex flex-col items-center gap-1 py-4 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors border-r border-slate-200">
                      <CheckCircle size={14} /><span className="text-[7px] font-black uppercase tracking-widest">Hadir</span>
                    </button>
                    <button onClick={() => handleOpenModal(unit.id, 'opr')} className="flex flex-col items-center gap-1 py-4 text-slate-700 hover:bg-purple-50 hover:text-purple-800 transition-colors">
                      <FileText size={14} /><span className="text-[7px] font-black uppercase tracking-widest">OPR</span>
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleOpenModal(unit.id, 'members')} className="flex flex-col items-center gap-1 py-4 text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors">
                    <Users size={14} /><span className="text-[7px] font-black uppercase tracking-widest">Ahli</span>
                  </button>
                )}
                
                {!isRumahSukan && (
                  <>
                    <button onClick={() => handleOpenModal(unit.id, 'committee')} className="flex flex-col items-center gap-1 py-4 text-slate-700 border-t border-r border-slate-200 hover:bg-amber-50 hover:text-amber-800 transition-colors">
                      <UserCircle size={14} /><span className="text-[7px] font-black uppercase tracking-widest">J/Kuasa</span>
                    </button>
                    <button onClick={() => handleOpenModal(unit.id, 'members')} className="flex flex-col items-center gap-1 py-4 text-slate-700 border-t border-r border-slate-200 hover:bg-blue-50 hover:text-blue-800 transition-colors">
                      <Users size={14} /><span className="text-[7px] font-black uppercase tracking-widest">Ahli</span>
                    </button>
                    <button onClick={() => handleOpenModal(unit.id, 'takwim')} className="flex flex-col items-center gap-1 py-4 text-slate-700 border-t border-slate-200 hover:bg-rose-50 hover:text-rose-800 transition-colors">
                      <Calendar size={14} /><span className="text-[7px] font-black uppercase tracking-widest">Takwim</span>
                    </button>
                  </>
                )}

                <button onClick={() => handleOpenModal(unit.id, 'book')} className="col-span-full py-3 bg-slate-900 text-white border-t border-slate-800 hover:bg-black text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all">
                   <BookOpen size={14} /> Jana Buku Laporan Lengkap
                </button>
                {isAdmin && (
                  <button onClick={() => { if(confirm('Padam unit?')) setUnits(prev => prev.filter(u => u.id !== unit.id)); }} className="col-span-full py-3 text-rose-800 border-t border-slate-200 hover:bg-rose-50 text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    <Trash2 size={12} /> Padam Unit
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-4 border-dashed border-slate-200 shadow-inner">
             <ShieldAlert size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-900 font-black uppercase text-xs tracking-widest opacity-40">Tiada unit didaftarkan dalam kategori ini</p>
          </div>
        )}
      </div>

      {activeModal === 'info' && selectedUnit && (
        <UnitModal 
          unit={selectedUnit} 
          allUnits={units}
          onClose={() => setActiveModal(null)} 
          students={students.filter(s => s.unitId === selectedUnit.id)} 
          teachers={teachers.filter(t => t.unitId === selectedUnit.id)} 
          setStudents={setStudents} 
          setTeachers={setTeachers} 
          setUnits={setUnits} 
          isAdmin={isAdmin}
          setFailedRegistrations={setFailedRegistrations}
        />
      )}
      {activeModal === 'attendance' && selectedUnit && !isRumahSukan && (
        <AttendanceModal unit={selectedUnit} onClose={() => setActiveModal(null)} students={students.filter(s => s.unitId === selectedUnit.id)} teachers={teachers.filter(t => t.unitId === selectedUnit.id)} meetings={meetings.filter(m => m.unitId === selectedUnit.id)} setStudents={setStudents} setTeachers={setTeachers} setMeetings={setMeetings} isAdmin={isAdmin} />
      )}
      {activeModal === 'opr' && selectedUnit && !isRumahSukan && (
        <OPRSection unit={selectedUnit} onClose={() => setActiveModal(null)} oprs={oprs.filter(o => o.unitId === selectedUnit.id)} setOprs={setOprs} students={students.filter(s => s.unitId === selectedUnit.id)} teachers={teachers.filter(t => t.unitId === selectedUnit.id)} meetings={meetings.filter(m => m.unitId === selectedUnit.id)} setMeetings={setMeetings} isAdmin={isAdmin} />
      )}
      {activeModal === 'committee' && selectedUnit && !isRumahSukan && (
        <CommitteeModal unit={selectedUnit} onClose={() => setActiveModal(null)} committees={unitCommittees.filter(c => c.unitId === selectedUnit.id)} setCommittees={setUnitCommittees} isAdmin={isAdmin} />
      )}
      {activeModal === 'members' && selectedUnit && (
        <MemberListModal unit={selectedUnit} onClose={() => setActiveModal(null)} students={students.filter(s => s.unitId === selectedUnit.id)} teachers={teachers.filter(t => t.unitId === selectedUnit.id)} />
      )}
      {activeModal === 'takwim' && selectedUnit && !isRumahSukan && (
        <TakwimModal unit={selectedUnit} onClose={() => setActiveModal(null)} oprs={oprs.filter(o => o.unitId === selectedUnit.id)} takwimItems={takwimItems} setTakwimItems={setTakwimItems} />
      )}
      {activeModal === 'book' && selectedUnit && (
        <ReportBookModal 
          unit={selectedUnit} 
          onClose={() => setActiveModal(null)} 
          students={students.filter(s => s.unitId === selectedUnit.id)} 
          teachers={teachers.filter(t => t.unitId === selectedUnit.id)} 
          committees={unitCommittees.filter(c => c.unitId === selectedUnit.id)}
          takwimItems={takwimItems}
          oprs={oprs.filter(o => o.unitId === selectedUnit.id)}
        />
      )}
      {activeModal === 'create' && (
        <CreateUnitDialog category={category} onClose={() => setActiveModal(null)} setUnits={setUnits} />
      )}
    </div>
  );
};

const CreateUnitDialog: React.FC<{ category: Category; onClose: () => void; setUnits: React.Dispatch<React.SetStateAction<Unit[]>> }> = ({ category, onClose, setUnits }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎖️');
  const [color, setColor] = useState('from-blue-500 to-blue-700');
  const handleSave = () => { if (!name) return alert('Sila isi nama unit'); setUnits(prev => [...prev, { id: `u-${Date.now()}`, name: name.toUpperCase(), icon, color, category, isCustom: true }]); onClose(); };
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-indigo-700 p-8 text-white flex items-center justify-between"><button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ArrowLeft size={20} /></button><h2 className="text-xl font-black uppercase tracking-widest">Cipta Unit</h2><div className="w-10"></div></div>
        <div className="p-8 space-y-6">
          <div className="space-y-1">
             <label className="text-[8px] font-black uppercase text-slate-700 ml-1">Nama Unit</label>
             <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-2xl font-black outline-none focus:border-indigo-700 focus:ring-4 focus:ring-indigo-700/5 text-slate-900 uppercase text-xs" placeholder="CONTOH: KELAB ICT / RUMAH MERAH" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-700 ml-1">Ikon (Emoji)</label>
              <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-center text-2xl" maxLength={2} />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-700 ml-1">Warna Tema</label>
              <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-300 rounded-2xl font-black text-xs text-slate-900">{GRADIENTS.map(g => (<option key={g.value} value={g.value} className="text-slate-900 font-black">{g.name}</option>))}</select>
            </div>
          </div>
          <div className="flex gap-4 pt-4"><button onClick={onClose} className="flex-1 px-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-black text-xs uppercase text-slate-700 hover:bg-slate-200 transition-all">BATAL</button><button onClick={handleSave} className="flex-1 px-4 py-4 bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-800 transition-all">SIMPAN UNIT</button></div>
        </div>
      </div>
    </div>
  );
};

export default UnitGrid;
