
import React, { useState } from 'react';
import { Unit, UnitCommitteeMember } from '../types';
import { X, Upload, Trash2, ArrowLeft, Printer, Edit3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

interface CommitteeModalProps {
  unit: Unit;
  onClose: () => void;
  committees: UnitCommitteeMember[];
  setCommittees: React.Dispatch<React.SetStateAction<UnitCommitteeMember[]>>;
  isAdmin: boolean;
}

const CommitteeModal: React.FC<CommitteeModalProps> = ({ unit, onClose, committees, setCommittees, isAdmin }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1 });
        
        // Skip header: Expected (Jawatan, Nama, KP, Kelas)
        const validRows = rows.slice(1).filter(r => r[1]);
        const newMembers: UnitCommitteeMember[] = validRows.map((r, idx) => ({
          id: `c-${Date.now()}-${idx}`,
          unitId: unit.id,
          position: String(r[0] || 'Ahli').trim(),
          name: String(r[1]).trim(),
          icNumber: String(r[2] || '').trim(),
          className: String(r[3] || '').trim(),
        }));

        setCommittees(prev => [...prev, ...newMembers]);
        alert(`Berjaya memuat naik ${newMembers.length} jawatankuasa.`);
      } catch (err) {
        alert('Ralat memproses Excel. Pastikan 4 lajur: Jawatan, Nama, No. KP, Kelas.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const printCommittee = () => {
    const doc = new jsPDF();
    const margin = 20;
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`JAWATANKUASA ${unit.name.toUpperCase()}`, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`SESI 2026/2027`, 105, 26, { align: 'center' });
    
    let y = 40;
    doc.setFontSize(9);
    doc.text("BIL", margin, y);
    doc.text("JAWATAN", margin + 15, y);
    doc.text("NAMA", margin + 60, y);
    doc.text("KELAS", margin + 140, y);
    doc.line(margin, y + 2, 190, y + 2);
    
    y += 10;
    committees.forEach((m, i) => {
      doc.text(`${i + 1}`, margin, y);
      doc.text(m.position, margin + 15, y);
      doc.text(m.name, margin + 60, y);
      doc.text(m.className, margin + 140, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    
    doc.save(`Jawatankuasa_${unit.name}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 bg-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 bg-white/10 rounded-xl"><ArrowLeft size={20}/></button>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Jawatankuasa Unit</h2>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{unit.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={printCommittee} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 px-4">
              <Printer size={18} /> <span className="text-[10px] font-black uppercase">CETAK</span>
            </button>
            <button onClick={onClose} className="p-2.5 bg-white/10 rounded-xl"><X size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 no-scrollbar">
          <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-4 w-full md:w-auto">
               <div className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center font-black">{committees.length}</div>
               <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Senarai Jawatan Didaftarkan</p>
             </div>
             {isAdmin && (
               <label className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg hover:bg-black transition-all uppercase tracking-widest">
                 <Upload size={18} /> IMPORT EXCEL (4 LAJUR)
                 <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleExcelUpload} />
               </label>
             )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-4 w-12 text-center">BIL</th>
                  <th className="px-6 py-4">JAWATAN</th>
                  <th className="px-6 py-4">NAMA</th>
                  <th className="px-6 py-4">KELAS</th>
                  {isAdmin && <th className="px-6 py-4 text-right">AKSI</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {committees.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-center font-black text-slate-300 text-xs">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{m.position}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-xs">{m.name}</td>
                    <td className="px-6 py-4 text-slate-400 font-bold text-xs">{m.className}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => { if(confirm('Padam?')) setCommittees(prev => prev.filter(c => c.id !== m.id)); }}
                          className="p-2 text-rose-300 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {committees.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center justify-center opacity-30">
                <Edit3 size={48} />
                <p className="mt-4 font-black uppercase text-xs tracking-widest">Tiada rekod jawatankuasa</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeModal;
