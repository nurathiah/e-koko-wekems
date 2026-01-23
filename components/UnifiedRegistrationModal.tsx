
import React, { useState } from 'react';
import { Unit, Category } from '../types';
import { X, UserPlus, CheckCircle2, LayoutGrid, Info } from 'lucide-react';

interface UnifiedRegistrationModalProps {
  units: Unit[];
  onClose: () => void;
  onRegister: (data: { name: string; className: string; selections: { category: Category; unitId: string }[] }) => void;
}

const UnifiedRegistrationModal: React.FC<UnifiedRegistrationModalProps> = ({ units, onClose, onRegister }) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [selections, setSelections] = useState<{ [key in Category]: string }>({
    beruniform: '',
    kelab: '',
    sukan: '',
    rumah_sukan: ''
  });

  const categories: { id: Category; label: string }[] = [
    { id: 'beruniform', label: 'Unit Beruniform' },
    { id: 'kelab', label: 'Kelab & Persatuan' },
    { id: 'sukan', label: 'Sukan & Permainan' },
    { id: 'rumah_sukan', label: 'Rumah Sukan' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !className) return alert('Sila isi nama dan kelas murid.');
    
    const finalSelections = Object.entries(selections)
      .filter(([_, unitId]) => unitId !== '')
      .map(([cat, unitId]) => ({ category: cat as Category, unitId }));

    if (finalSelections.length === 0) return alert('Sila pilih sekurang-kurangnya satu unit.');

    onRegister({ 
      name: name.toUpperCase(), 
      className: className.toUpperCase(), 
      selections: finalSelections 
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 bg-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UserPlus size={24} />
            <h2 className="text-xl font-black uppercase tracking-tight">Pendaftaran Ahli Baru</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nama Penuh Murid</label>
              <input 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 text-sm outline-none focus:ring-4 focus:ring-indigo-600/5 uppercase"
                placeholder="NAMA MURID"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Kelas</label>
              <input 
                required
                value={className}
                onChange={e => setClassName(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 text-sm outline-none focus:ring-4 focus:ring-indigo-600/5 uppercase"
                placeholder="KELAS"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
              <LayoutGrid size={16} className="text-indigo-600" /> Penempatan Unit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">{cat.label}</label>
                  <select 
                    value={selections[cat.id]}
                    onChange={e => setSelections(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-800 outline-none focus:bg-white transition-all uppercase"
                  >
                    <option value="">-- TIADA PENEMPATAN --</option>
                    {units.filter(u => u.category === cat.id).map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.icon} {unit.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">Batal</button>
            <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all">
              <CheckCircle2 size={20} /> Sah & Daftar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnifiedRegistrationModal;
