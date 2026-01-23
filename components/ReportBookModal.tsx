
import React, { useState } from 'react';
import { Unit, Student, Teacher, OPR, UnitCommitteeMember, TakwimItem } from '../types';
import { X, Book, Download, Printer, ArrowLeft, Loader2, CheckCircle2, FileText, Zap, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ReportBookModalProps {
  unit: Unit;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  committees: UnitCommitteeMember[];
  takwimItems: TakwimItem[];
  oprs: OPR[];
}

const SCHOOL_LOGO = "https://lh3.googleusercontent.com/d/1xl4C5RGqMGLFikaBzfcG7ePEqFBiTUBb";
const COVER_IMAGE = "https://lh3.googleusercontent.com/d/1QqXwWjeWrr9AEBcde589tUam8EnyGfBD";

const ReportBookModal: React.FC<ReportBookModalProps> = ({ 
  unit, onClose, students, teachers, committees, takwimItems, oprs 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const calculateAttendance = (member: Student | Teacher) => {
    const totalAbsent = Object.values(member.attendance).filter(a => a === true).length;
    const present = 12 - totalAbsent;
    return { present, percent: Math.round((present / 12) * 100) };
  };

  const getBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve('');
      img.src = url;
    });
  };

  const generateFullReport = async () => {
    setIsGenerating(true);
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - (margin * 2);

    try {
      // --- MUKA HADAPAN (COVER) ---
      doc.setFillColor(248, 250, 252); // Slate-50 background
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Header Decoration
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(0, 0, pageWidth, 60, 'F');

      let schoolLogoData = await getBase64(SCHOOL_LOGO);
      let coverImgData = await getBase64(COVER_IMAGE);

      if (schoolLogoData) doc.addImage(schoolLogoData, 'JPEG', pageWidth/2 - 20, 10, 40, 40);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("BUKU LAPORAN", pageWidth/2, 90, { align: 'center' });
      doc.setFontSize(36);
      doc.text(unit.name.toUpperCase(), pageWidth/2, 105, { align: 'center' });
      
      doc.setLineWidth(2);
      doc.setDrawColor(79, 70, 229); // Indigo-600
      doc.line(40, 115, 170, 115);

      if (coverImgData) {
        doc.addImage(coverImgData, 'JPEG', 30, 130, 150, 100);
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("SESI AKADEMIK 2026/2027", pageWidth/2, 250, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text("UNIT KOKURIKULUM SK KEMASEK", pageWidth/2, 260, { align: 'center' });
      doc.setFontSize(9);
      doc.text("DIJANA SECARA DIGITAL OLEH E-KOKO WEKEMS", pageWidth/2, 280, { align: 'center' });

      // --- HALAMAN 1: JAWATANKUASA ---
      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text("1. JAWATANKUASA UNIT", margin, 16);

      let currentY = 45;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("BIL", margin, currentY);
      doc.text("JAWATAN", margin + 15, currentY);
      doc.text("NAMA PENUH", margin + 70, currentY);
      doc.text("KELAS", margin + 150, currentY);
      doc.line(margin, currentY + 2, 190, currentY + 2);
      
      currentY += 10;
      doc.setFont("helvetica", "normal");
      committees.forEach((m, i) => {
        doc.text(`${i + 1}`, margin, currentY);
        doc.text(m.position.toUpperCase(), margin + 15, currentY);
        doc.text(m.name.toUpperCase(), margin + 70, currentY);
        doc.text(m.className, margin + 150, currentY);
        currentY += 8;
        if (currentY > 270) { doc.addPage(); currentY = 30; }
      });

      // --- HALAMAN 2: ANALISA KEHADIRAN AKTIF ---
      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text("2. ANALISA KEHADIRAN AKTIF (GURU & MURID)", margin, 16);

      currentY = 45;
      doc.setTextColor(79, 70, 229);
      doc.setFont("helvetica", "bold");
      doc.text("A. GURU PENASIHAT", margin, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 8;
      
      teachers.forEach((t, i) => {
        const stats = calculateAttendance(t);
        doc.setFontSize(9);
        doc.text(`${i + 1}. ${t.name.toUpperCase()}`, margin + 5, currentY);
        doc.text(`HADIR: ${stats.present}/12`, margin + 120, currentY);
        doc.text(`${stats.percent}%`, margin + 155, currentY);
        currentY += 7;
      });

      currentY += 10;
      doc.setTextColor(79, 70, 229);
      doc.setFont("helvetica", "bold");
      doc.text("B. AHLI MURID", margin, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 8;

      students.sort((a,b) => a.name.localeCompare(b.name)).forEach((s, i) => {
        const stats = calculateAttendance(s);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`${i + 1}. ${s.name.toUpperCase()}`, margin + 5, currentY);
        doc.text(s.className, margin + 110, currentY);
        doc.text(`${stats.present}/12`, margin + 135, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(`${stats.percent}%`, margin + 155, currentY);
        currentY += 6;
        if (currentY > 280) { doc.addPage(); currentY = 30; }
      });

      // --- HALAMAN 3: TAKWIM AKTIVITI ---
      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text("3. TAKWIM AKTIVITI TAHUNAN", margin, 16);

      currentY = 45;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("MGG", margin, currentY);
      doc.text("TARIKH", margin + 15, currentY);
      doc.text("AKTIVITI / PERKARA", margin + 45, currentY);
      doc.text("STATUS", margin + 150, currentY);
      doc.line(margin, currentY + 2, 190, currentY + 2);
      
      currentY += 10;
      doc.setFont("helvetica", "normal");
      for (let i = 1; i <= 12; i++) {
        const manual = takwimItems.find(t => t.unitId === unit.id && t.week === i);
        const opr = oprs.find(o => o.week === i);
        const title = manual?.title || opr?.title || "TIADA AKTIVITI";
        const date = opr?.date || "---";
        const status = opr ? "DILAKSANAKAN" : "TANGGUH";

        doc.text(`${i}`, margin, currentY);
        doc.text(date, margin + 15, currentY);
        const splitTitle = doc.splitTextToSize(title.toUpperCase(), 100);
        doc.text(splitTitle, margin + 45, currentY);
        doc.text(status, margin + 150, currentY);
        currentY += (splitTitle.length * 5) + 4;
        if (currentY > 275) { doc.addPage(); currentY = 30; }
      }

      // --- KOMPILASI LAPORAN OPR MINGGUAN ---
      oprs.sort((a,b) => a.week - b.week).forEach(opr => {
        doc.addPage();
        // Page Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(`LAPORAN AKTIVITI - MINGGU ${opr.week}`, pageWidth/2, 13, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(opr.title.toUpperCase(), pageWidth/2, 35, { align: 'center' });

        currentY = 50;
        doc.setFontSize(10);
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, 170, 8, 'F');
        doc.text("1. OBJEKTIF AKTIVITI", margin + 2, currentY + 6);
        
        currentY += 12;
        doc.setFont("helvetica", "normal");
        const objLines = doc.splitTextToSize(opr.objective, 165);
        doc.text(objLines, margin + 2, currentY);
        
        currentY += (objLines.length * 5) + 10;
        doc.setFont("helvetica", "bold");
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, 170, 8, 'F');
        doc.text("2. RINGKASAN AKTIVITI", margin + 2, currentY + 6);
        
        currentY += 12;
        doc.setFont("helvetica", "normal");
        const actLines = doc.splitTextToSize(opr.activity, 165);
        doc.text(actLines, margin + 2, currentY);

        // Images Section
        currentY += (actLines.length * 5) + 15;
        doc.setFont("helvetica", "bold");
        doc.text("3. LAMPIRAN BERGAMBAR", margin, currentY);
        
        currentY += 5;
        const imgWidth = 52;
        const imgHeight = 52;
        opr.images.forEach((img, idx) => {
          if (img) {
            try {
              doc.addImage(img, 'JPEG', margin + (idx * 58), currentY, imgWidth, imgHeight);
            } catch(e) {
              doc.rect(margin + (idx * 58), currentY, imgWidth, imgHeight);
              doc.text("Imej Ralat", margin + (idx * 58) + 15, currentY + 25);
            }
          }
        });

        currentY += 65;
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text(`Refleksi: ${opr.reflection}`, margin, currentY);
        
        doc.setFont("helvetica", "bold");
        doc.text(`Disediakan oleh: ${opr.sivik?.suggestion?.toUpperCase() || "GURU PENASIHAT"}`, margin, currentY + 12);
        doc.text(`Tarikh: ${opr.date}`, margin + 120, currentY + 12);
      });

      doc.save(`BUKU_LAPORAN_${unit.name.replace(/\s+/g, '_')}_LENGKAP.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Ralat menjana PDF. Pastikan semua data dan imej tersedia.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <Book size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Buku Laporan Lengkap</h2>
              <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Penjanaan Automatik (M1 - M12)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24}/></button>
        </div>

        <div className="p-10 text-center space-y-8">
           <div className="max-w-md mx-auto space-y-4">
             <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto text-indigo-600">
               <Zap size={40} fill="currentColor" />
             </div>
             <h3 className="text-xl font-black text-slate-900 uppercase">Kompilasi Rekod Unit</h3>
             <p className="text-slate-500 text-sm leading-relaxed">
               Sistem akan menggabungkan semua data jawatankuasa, analisa kehadiran aktif, jadual takwim, dan semua 12 laporan mingguan ke dalam format Buku Laporan rasmi.
             </p>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'J/Kuasa', count: committees.length, icon: FileText },
                { label: 'Ahli', count: students.length, icon: CheckCircle2 },
                { label: 'OPR', count: oprs.length, icon: Book },
                { label: 'Takwim', count: 12, icon: Calendar }
              ].map(stat => (
                <div key={stat.label} className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                   <stat.icon size={20} className="mx-auto mb-2 text-indigo-400" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   <p className="text-lg font-black text-slate-900">{stat.count}</p>
                </div>
              ))}
           </div>

           <div className="pt-6 flex gap-4">
              <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest">Batal</button>
              <button 
                onClick={generateFullReport} 
                disabled={isGenerating}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all"
              >
                {isGenerating ? (
                  <> <Loader2 size={20} className="animate-spin" /> Menjana Buku... </>
                ) : (
                  <> <Download size={20} /> Jana & Muat Turun Buku Laporan </>
                )}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBookModal;
