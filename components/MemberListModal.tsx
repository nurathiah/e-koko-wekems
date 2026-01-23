
import React from 'react';
import { Unit, Student, Teacher } from '../types';
import { X, Users, Printer, ArrowLeft, GraduationCap, Percent } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface MemberListModalProps {
  unit: Unit;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
}

const MemberListModal: React.FC<MemberListModalProps> = ({ unit, onClose, students, teachers }) => {
  const isRumahSukan = unit.category === 'rumah_sukan';

  const calculateAttendance = (member: Student | Teacher) => {
    const totalAbsent = Object.values(member.attendance).filter(a => a === true).length;
    const present = 12 - totalAbsent;
    return { present, percent: Math.round((present / 12) * 100) };
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(isRumahSukan ? `SENARAI AHLI RUMAH SUKAN` : `LAPORAN AHLI & ANALISA KEHADIRAN AKTIF`, 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${unit.name.toUpperCase()}`, 105, 28, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`SESI 2026/2027`, 105, 34, { align: 'center' });
    
    let y = 50;
    doc.setFont("helvetica", "bold");
    doc.text("A. SENARAI GURU PENASIHAT", margin, y);
    y += 10;
    doc.setFontSize(8);
    doc.text("BIL", margin, y);
    doc.text("NAMA GURU", margin + 15, y);
    doc.text("JAWATAN", margin + 110, y);
    if (!isRumahSukan) {
      doc.text("HADIR", margin + 145, y);
      doc.text("%", margin + 165, y);
    }
    doc.line(margin, y + 2, 190, y + 2);
    y += 8;

    doc.setFont("helvetica", "normal");
    teachers.forEach((t, i) => {
      doc.text(`${i + 1}`, margin, y);
      doc.text(t.name.toUpperCase(), margin + 15, y);
      doc.text(t.position, margin + 110, y);
      if (!isRumahSukan) {
        const stats = calculateAttendance(t);
        doc.text(`${stats.present}/12`, margin + 145, y);
        doc.text(`${stats.percent}%`, margin + 165, y);
      }
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    
    y += 15;
    if (y > 250) { doc.addPage(); y = 20; }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("B. SENARAI AHLI MURID", margin, y);
    y += 10;
    doc.setFontSize(8);
    doc.text("BIL", margin, y);
    doc.text("NAMA MURID", margin + 15, y);
    doc.text("KELAS", margin + 110, y);
    if (!isRumahSukan) {
      doc.text("HADIR", margin + 145, y);
      doc.text("%", margin + 165, y);
    }
    doc.line(margin, y + 2, 190, y + 2);
    
    y += 10;
    students.sort((a,b) => a.name.localeCompare(b.name)).forEach((s, i) => {
      doc.text(`${i + 1}`, margin, y);
      doc.text(s.name.toUpperCase(), margin + 15, y);
      doc.text(s.className, margin + 110, y);
      if (!isRumahSukan) {
        const stats = calculateAttendance(s);
        doc.text(`${stats.present}/12`, margin + 145, y);
        doc.text(`${stats.percent}%`, margin + 165, y);
      }
      y += 8;
      if (y > 280) { doc.addPage(); y = 20; }
    });
    
    doc.save(`Senarai_Ahli_${unit.name}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 bg-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 bg-white/10 rounded-xl transition-all"><ArrowLeft size={20}/></button>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">{isRumahSukan ? 'Senarai Ahli Rumah Sukan' : 'Senarai Ahli & Analisa Aktif'}</h2>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{unit.name}</p>
            </div>
          </div>
          <button onClick={generatePDF} className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-slate-50 transition-all uppercase tracking-widest">
            <Printer size={18} /> Cetak Senarai
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 space-y-10 no-scrollbar">
          <section className="space-y-4">
             <div className="flex items-center justify-between text-blue-600">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><GraduationCap size={24}/></div>
                 <h3 className="text-sm font-black uppercase tracking-widest">Guru Penasihat ({teachers.length})</h3>
               </div>
               {!isRumahSukan && (
                 <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                    <Percent size={14} /> Analisa Kehadiran Guru
                 </div>
               )}
             </div>
             <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                      <th className="px-6 py-5 w-12 text-center">BIL</th>
                      <th className="px-6 py-5">NAMA GURU</th>
                      <th className="px-6 py-5">JAWATAN</th>
                      {!isRumahSukan && (
                        <>
                          <th className="px-6 py-5 text-center">HADIR</th>
                          <th className="px-6 py-5 text-right pr-10">PERATUS (%)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teachers.map((t, idx) => {
                      const stats = !isRumahSukan ? calculateAttendance(t) : null;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5 text-center text-[10px] font-black text-slate-300">{idx + 1}</td>
                          <td className="px-6 py-5 font-bold text-slate-800 text-xs uppercase">{t.name}</td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-md">{t.position}</span>
                          </td>
                          {!isRumahSukan && stats && (
                            <>
                              <td className="px-6 py-5 text-center">
                                 <div className="inline-flex px-3 py-1 rounded-lg text-[10px] font-black bg-slate-50 text-slate-600">
                                    {stats.present} / 12
                                 </div>
                              </td>
                              <td className="px-6 py-5 text-right pr-10">
                                 <div className="flex items-center justify-end gap-3">
                                    <span className="text-xs font-black text-slate-800">{stats.percent}%</span>
                                 </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </section>

          <section className="space-y-4">
             <div className="flex items-center justify-between text-indigo-600">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Users size={24}/></div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Ahli Murid ({students.length})</h3>
                </div>
                {!isRumahSukan && (
                  <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                     <Percent size={14} /> Analisa Kehadiran Murid
                  </div>
                )}
             </div>
             <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                      <th className="px-6 py-5 w-12 text-center">BIL</th>
                      <th className="px-6 py-5">NAMA MURID</th>
                      <th className="px-6 py-5">KELAS</th>
                      {!isRumahSukan && (
                        <>
                          <th className="px-6 py-5 text-center">HADIR</th>
                          <th className="px-6 py-5 text-right pr-10">PERATUS (%)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.sort((a,b) => a.name.localeCompare(b.name)).map((s, idx) => {
                      const stats = !isRumahSukan ? calculateAttendance(s) : null;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5 text-center text-[10px] font-black text-slate-300">{idx + 1}</td>
                          <td className="px-6 py-5 font-bold text-slate-800 text-xs uppercase">{s.name}</td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] font-black uppercase bg-slate-50 text-slate-400 px-3 py-1 rounded-md">{s.className}</span>
                          </td>
                          {!isRumahSukan && stats && (
                            <>
                              <td className="px-6 py-5 text-center">
                                 <div className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black ${stats.percent >= 80 ? 'bg-emerald-50 text-emerald-600' : stats.percent >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {stats.present} / 12
                                 </div>
                              </td>
                              <td className="px-6 py-5 text-right pr-10">
                                 <div className="flex items-center justify-end gap-3">
                                    <span className="text-xs font-black text-slate-800">{stats.percent}%</span>
                                 </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
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
