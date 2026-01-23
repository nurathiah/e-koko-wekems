
import React, { useState } from 'react';
import { Category, Unit, Student, Teacher, OPR, MeetingMetadata, UnitCommitteeMember, TakwimItem } from '../types';
import { Plus, Settings, CheckCircle, FileText, Trash2, ShieldAlert, Upload, Calendar, Users, ArrowLeft, UserCircle, BookOpen, AlertTriangle, AlertCircle, X } from 'lucide-react';
import UnitModal from './UnitModal';
import MemberListModal from './MemberListModal';
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

const UnitGrid: React.FC<UnitGridProps> = ({ 
  category, units, students, teachers, unitCommittees, takwimItems, oprs, meetings, 
  setUnits, setStudents, setTeachers, setUnitCommittees, setTakwimItems, setOprs, setMeetings, isAdmin,
  failedRegistrations, setFailedRegistrations
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'info' | 'members' | 'create' | null>(null);

  const filteredUnits = units.filter(u => u.category === category);
  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const isRumahSukan = category === 'rumah_sukan';

  const handleOpenModal = (id: string, modal: 'info' | 'members') => {
    setSelectedUnitId(id);
    setActiveModal(modal);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 capitalize tracking-tight flex items-center gap-4">
           {category.replace('_', ' ')} <span className="text-xs bg-slate-900 text-white px-4 py-1.5 rounded-full font-black">{filteredUnits.length} UNIT</span>
        </h2>
        <div className="flex gap-3">
          {isAdmin && (
            <button onClick={() => setActiveModal('create')} className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all active:scale-95 uppercase tracking-widest">
              <Plus size={18} /> TAMBAH UNIT
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUnits.length > 0 ? filteredUnits.map((unit) => (
          <div key={unit.id} className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-200 hover:shadow-2xl transition-all group flex flex-col h-full">
            <div className={`h-24 bg-gradient-to-br ${unit.color} flex items-center justify-center p-4 relative`}>
              <div className="w-20 h-20 bg-white rounded-[28px] shadow-lg flex items-center justify-center absolute -bottom-6 ring-4 ring-white transition-transform group-hover:scale-110 border border-slate-100 text-3xl">
                 {unit.customImage ? <img src={unit.customImage} className="w-full h-full object-cover rounded-[24px]" /> : unit.icon}
              </div>
            </div>
            <div className="pt-12 pb-8 px-8 flex-1 text-center">
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-tight mb-4">{unit.name}</h3>
              <div className="flex justify-center gap-3">
                <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-600 border border-slate-100 flex items-center gap-2">
                  <Users size={14} className="opacity-40" /> {students.filter(s => s.unitId === unit.id).length} AHLI
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 border-t border-slate-100">
              <button onClick={() => handleOpenModal(unit.id, 'info')} className="flex flex-col items-center gap-1.5 py-5 text-slate-700 hover:bg-slate-50 hover:text-indigo-800 transition-colors border-r border-slate-100">
                <Settings size={18} /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Urus</span>
              </button>
              <button onClick={() => handleOpenModal(unit.id, 'members')} className="flex flex-col items-center gap-1.5 py-5 text-slate-700 hover:bg-slate-50 hover:text-blue-800 transition-colors">
                <Users size={18} /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Ahli</span>
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[48px] border-4 border-dashed border-slate-200">
             <ShieldAlert size={64} className="mx-auto text-slate-200 mb-6" />
             <p className="text-slate-400 font-black uppercase text-sm tracking-widest">Tiada unit didaftarkan</p>
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
      {activeModal === 'members' && selectedUnit && (
        <MemberListModal unit={selectedUnit} onClose={() => setActiveModal(null)} students={students.filter(s => s.unitId === selectedUnit.id)} teachers={teachers.filter(t => t.unitId === selectedUnit.id)} />
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
           <h2 className="text-xl font-black uppercase tracking-widest">Cipta Unit Baru</h2>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X size={24}/></button>
        </div>
        <div className="p-10 space-y-8">
          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nama Unit</label>
             <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:border-indigo-700 text-slate-900 uppercase text-sm" placeholder="Contoh: RUMAH MERAH" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Ikon (Emoji)</label>
              <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-3xl" maxLength={2} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Warna</label>
              <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full px-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-slate-900">{GRADIENTS.map(g => (<option key={g.value} value={g.value} className="text-slate-900 font-black">{g.name}</option>))}</select>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
             <button onClick={onClose} className="flex-1 px-4 py-5 bg-slate-100 rounded-2xl font-black text-xs uppercase text-slate-500">BATAL</button>
             <button onClick={handleSave} className="flex-1 px-4 py-5 bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-800 transition-all">SIMPAN</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitGrid;
