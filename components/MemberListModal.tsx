
import React from 'react';
import { Unit, Student, Teacher } from '../types';
import { X, Users, Printer, ArrowLeft, GraduationCap } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface MemberListModalProps {
  unit: Unit;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
}

const MemberListModal: React.FC<MemberListModalProps> = ({ unit, onClose, students, teachers }) => {
  const isRumahSukan = unit.category === 'rumah_sukan';

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(isRumahSukan ? `SENARAI AHLI RUMAH SUKAN` : `SENARAI AHLI UNIT KOKURIKULUM`, 105, 20, { align: 'center' });
    doc.setFontSize(14); doc.text(unit.name.toUpperCase(), 105, 28, { align: 'center' });
    doc.setFontSize(10); doc.text(`SESI AKADEMIK 2026/2027`, 105, 34, { align: 'center' });
    
    let y = 50;
    doc.setFontSize(10); doc.text("A. SENARAI GURU PENASIHAT", margin, y);
    y += 10; doc.setFontSize(8); doc.text("BIL", margin, y); doc.text("NAMA PENUH", margin + 15, y); doc.text("JAWATAN", margin + 120, y);
    doc.line(margin, y + 2, 190, y + 2);
    y += 10; doc.setFont("helvetica", "normal");
    teachers.forEach((t, i) => {
      doc.text(`${i + 1}`, margin, y); doc.text(t.name.toUpperCase(), margin + 15, y); doc.text(t.position.toUpperCase(), margin + 120, y);
      y += 8; if (y > 270) { doc.addPage(); y = 20; }
    });
    
    y += 15; if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("B. SENARAI AHLI MURID", margin, y);
    y += 10; doc.setFontSize(8); doc.text("BIL", margin, y); doc.text("NAMA MURID", margin + 15, y); doc.text("KELAS", margin + 140, y);
    doc.line(margin, y + 2, 190, y + 2);
    y += 10; doc.setFont("helvetica", "normal");
    students.sort((a,b) => a.name.localeCompare(b.name)).forEach((s, i) => {
      doc.text(`${i + 1}`, margin, y); doc.text(s.name.toUpperCase(), margin + 15, y); doc.text(s.className, margin + 140, y);
      y += 7; if (y > 280) { doc.addPage(); y = 20; }
    });
    doc.save(`Senarai_Ahli_${unit.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-[48px] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-8 bg-blue-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl"><ArrowLeft size={24}/></button>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Senarai Ahli Rasmi</h2>
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest leading-none mt-2">{unit.name}</p>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={generatePDF} className="bg-white text-blue-700 px-10 py-4 rounded-[24px] font-black text-xs flex items-center gap-3 shadow-xl hover:scale-105 transition-transform uppercase tracking-widest">
               <Printer size={20} /> Cetak Senarai (PDF)
             </button>
             <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-slate-50 no-scrollbar space-y-16">
          <section className="space-y-6">
             <div className="flex items-center gap-4 text-blue-700">
               <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center"><GraduationCap size={28}/></div>
               <h3 className="text-lg font-black uppercase tracking-widest">Guru Penasihat ({teachers.length})</h3>
             </div>
             <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase text-slate-400">
                      <th className="px-10 py-6 w-12 text-center">BIL</th>
                      <th className="px-10 py-6">NAMA PENUH</th>
                      <th className="px-10 py-6 text-right">JAWATAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teachers.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6 text-center text-[10px] font-black text-slate-300">{idx + 1}</td>
                        <td className="px-10 py-6 font-black text-slate-800 text-xs uppercase">{t.name}</td>
                        <td className="px-10 py-6 text-right font-black text-blue-600 uppercase text-[10px]">{t.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </section>

          <section className="space-y-6">
             <div className="flex items-center gap-4 text-indigo-700">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center"><Users size={28}/></div>
                <h3 className="text-lg font-black uppercase tracking-widest">Ahli Murid ({students.length})</h3>
             </div>
             <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase text-slate-400">
                      <th className="px-10 py-6 w-12 text-center">BIL</th>
                      <th className="px-10 py-6">NAMA PENUH</th>
                      <th className="px-10 py-6 text-right">KELAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.sort((a,b) => a.name.localeCompare(b.name)).map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6 text-center text-[10px] font-black text-slate-300">{idx + 1}</td>
                        <td className="px-10 py-6 font-black text-slate-800 text-xs uppercase">{s.name}</td>
                        <td className="px-10 py-6 text-right font-black text-slate-500 uppercase text-[10px]">{s.className}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MemberListModal;
