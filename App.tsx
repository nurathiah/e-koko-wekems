
import React, { useState, useEffect } from 'react';
import { INITIAL_UNITS } from './constants.ts';
import { Category, Unit, Student, Teacher, OPR, MeetingMetadata, UnitCommitteeMember, TakwimItem, Achievement, GlobalEvent, SuccessStory } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import UnitGrid from './components/UnitGrid.tsx';
import UnifiedRegistrationModal from './components/UnifiedRegistrationModal.tsx';
import { Layout, Users, GraduationCap, Trophy, Shield, User, Flag, UserPlus } from 'lucide-react';

const LOGO_SEKOLAH = "https://lh3.googleusercontent.com/d/1QqXwWjeWrr9AEBcde589tUam8EnyGfBD";
const LOGO_KHAS = "https://lh3.googleusercontent.com/d/1xl4C5RGqMGLFikaBzfcG7ePEqFBiTUBb";

export interface FailedRegistration {
  id: string;
  name: string;
  type: 'MURID' | 'GURU';
  reason: string;
  category: Category;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | Category>('dashboard');
  const [units, setUnits] = useState<Unit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [unitCommittees, setUnitCommittees] = useState<UnitCommitteeMember[]>([]);
  const [takwimItems, setTakwimItems] = useState<TakwimItem[]>([]);
  const [oprs, setOprs] = useState<OPR[]>([]);
  const [meetings, setMeetings] = useState<MeetingMetadata[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [globalEvents, setGlobalEvents] = useState<GlobalEvent[]>([]);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [adminNotes, setAdminNotes] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [failedRegistrations, setFailedRegistrations] = useState<FailedRegistration[]>([]);
  const [showUnifiedReg, setShowUnifiedReg] = useState(false);

  useEffect(() => {
    try {
      const savedUnits = localStorage.getItem('wekem_units');
      const savedStudents = localStorage.getItem('wekem_students');
      const savedTeachers = localStorage.getItem('wekem_teachers');
      const savedStories = localStorage.getItem('wekem_success');
      const savedNotes = localStorage.getItem('wekem_admin_notes');
      const savedEvents = localStorage.getItem('wekem_global_events');
      const savedOprs = localStorage.getItem('wekem_oprs');
      const savedMeetings = localStorage.getItem('wekem_meetings');
      
      const safeParse = (data: string | null, fallback: any) => {
        try {
          return data ? JSON.parse(data) : fallback;
        } catch (e) {
          return fallback;
        }
      };

      let currentUnits = safeParse(savedUnits, INITIAL_UNITS);
      const existingIds = currentUnits.map((u: Unit) => u.id);
      
      INITIAL_UNITS.forEach(iu => {
        if (!existingIds.includes(iu.id)) {
          currentUnits.push(iu);
        }
      });

      setUnits(currentUnits);
      setStudents(safeParse(savedStudents, []));
      setTeachers(safeParse(savedTeachers, []));
      setOprs(safeParse(savedOprs, []));
      setMeetings(safeParse(savedMeetings, []));
      setSuccessStories(safeParse(savedStories, [
        { id: 'ss1', title: 'Johan Kebangsaan Robotik 2026', category: 'MURID', date: '2026-02-10', image: null },
        { id: 'ss2', title: 'Anugerah Guru Inovatif Koko', category: 'GURU', date: '2026-03-05', image: null }
      ]));
      setAdminNotes(safeParse(savedNotes, [
        "Sila pastikan OPR diisi sebelum Jumaat jam 12:00 tengah hari.",
        "Analisa kehadiran bulanan akan dijana secara automatik pada minggu ke-4.",
        "Semak senarai jawatankuasa untuk kemaskini perlantikan baru."
      ]));
      setGlobalEvents(safeParse(savedEvents, [
        { id: 'e1', title: 'Merentas Desa Sekolah', date: '2026-03-22', time: '07:30', image: null },
        { id: 'e2', title: 'Mesyuarat Agung Koko', date: '2026-03-25', time: '14:00', image: null }
      ]));
      
      setAchievements([
        { id: 'a1', unitName: 'Pengakap', award: 'Johan Kawad Kaki Negeri', rank: '🥇', image: null, date: '2026-02-15' },
        { id: 'a2', unitName: 'Bola Sepak', award: 'Naib Johan MSSD', rank: '🥈', image: null, date: '2026-03-01' }
      ]);
    } catch (e) {
      console.error("Initialization Error:", e);
      setUnits(INITIAL_UNITS);
    }
  }, []);

  useEffect(() => { localStorage.setItem('wekem_units', JSON.stringify(units)); }, [units]);
  useEffect(() => { localStorage.setItem('wekem_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('wekem_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('wekem_success', JSON.stringify(successStories)); }, [successStories]);
  useEffect(() => { localStorage.setItem('wekem_admin_notes', JSON.stringify(adminNotes)); }, [adminNotes]);
  useEffect(() => { localStorage.setItem('wekem_global_events', JSON.stringify(globalEvents)); }, [globalEvents]);
  useEffect(() => { localStorage.setItem('wekem_oprs', JSON.stringify(oprs)); }, [oprs]);
  useEffect(() => { localStorage.setItem('wekem_meetings', JSON.stringify(meetings)); }, [meetings]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'beruniform', label: 'Uniform', icon: GraduationCap },
    { id: 'kelab', label: 'Kelab', icon: Users },
    { id: 'sukan', label: 'Sukan', icon: Trophy },
    { id: 'rumah_sukan', label: 'Rumah Sukan', icon: Flag },
  ];

  const handleUnifiedRegister = (data: { name: string; className: string; selections: { category: Category; unitId: string }[] }) => {
    const newStudents: Student[] = data.selections.map(sel => ({
      id: `s-${Date.now()}-${Math.random()}`,
      name: data.name,
      className: data.className,
      unitId: sel.unitId,
      attendance: {}
    }));
    setStudents(prev => [...prev, ...newStudents]);
    setShowUnifiedReg(false);
    alert(`Berjaya mendaftarkan ${data.name} ke ${data.selections.length} unit.`);
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-all duration-300 ${isAdmin ? 'ring-inset ring-4 ring-indigo-600/20' : ''}`}>
      <div className="bg-slate-950 px-4 py-1 flex justify-between gap-3 border-b border-white/5 shrink-0">
        <div className="flex items-center">
          {isAdmin && (
            <button 
              onClick={() => setShowUnifiedReg(true)} 
              className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded text-[8px] font-black uppercase hover:bg-indigo-700"
            >
              <UserPlus size={10} /> Daftar Ahli Bersepadu
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsAdmin(false)} className={`flex items-center gap-1.5 px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${!isAdmin ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
            <User size={10} /> Mode Pelawat
          </button>
          <button onClick={() => setIsAdmin(true)} className={`flex items-center gap-1.5 px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${isAdmin ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
            <Shield size={10} /> Mode Admin
          </button>
        </div>
      </div>

      <header className="gradient-bg text-white px-4 md:px-10 py-2 md:py-3 flex items-center justify-between shadow-xl shrink-0 border-b border-white/10 relative z-20">
        <div className="w-14 h-14 md:w-24 md:h-24 transform hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
          <img src={LOGO_SEKOLAH} alt="Lencana Sekolah" className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
        </div>
        <div className="flex-1 text-center px-4">
          <h1 className="text-xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none text-white uppercase drop-shadow-lg">E-KOKO WEKEMS</h1>
          <div className="mt-0.5 md:mt-1.5 flex flex-col items-center">
            <p className="text-[7px] md:text-[12px] lg:text-[14px] font-black uppercase tracking-[0.25em] text-indigo-300 drop-shadow">Digital Management • UNIT KOKURIKULUM SK KEMASEK</p>
          </div>
        </div>
        <div className="w-14 h-14 md:w-24 md:h-24 transform hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
          <img src={LOGO_KHAS} alt="Logo Unit Kokurikulum" className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
        </div>
      </header>

      <nav className="bg-slate-900 border-b border-white/5 shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex justify-center">
          <div className="flex space-x-1 py-1">
            {navItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => setCurrentPage(item.id as any)} 
                className={`flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest ${currentPage === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <item.icon className="w-3 h-3" /> {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto bg-slate-50/50 p-3 md:p-6 no-scrollbar relative">
        <div className="max-w-7xl mx-auto">
          {currentPage === 'dashboard' ? (
            <Dashboard 
              units={units} students={students} teachers={teachers} oprs={oprs} meetings={meetings} 
              achievements={achievements} globalEvents={globalEvents} setAchievements={setAchievements}
              setGlobalEvents={setGlobalEvents} setStudents={setStudents} isAdmin={isAdmin} 
              successStories={successStories} setSuccessStories={setSuccessStories}
              adminNotes={adminNotes} setAdminNotes={setAdminNotes}
            />
          ) : (
            <UnitGrid 
              category={currentPage as Category} 
              units={units} students={students} teachers={teachers} 
              unitCommittees={unitCommittees} takwimItems={takwimItems} oprs={oprs} meetings={meetings}
              setUnits={setUnits} setStudents={setStudents} setTeachers={setTeachers} 
              setUnitCommittees={setUnitCommittees} setTakwimItems={setTakwimItems} setOprs={setOprs} setMeetings={setMeetings}
              isAdmin={isAdmin}
              failedRegistrations={failedRegistrations}
              setFailedRegistrations={setFailedRegistrations}
            />
          )}
        </div>
      </main>

      <footer className="bg-slate-950 text-white py-2 md:py-3 shrink-0 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-slate-500">© 2026 E-KOKO WEKEMS Digital System • Unit Kokurikulum SK Kemasek</p>
        </div>
      </footer>

      {showUnifiedReg && (
        <UnifiedRegistrationModal 
          units={units} 
          onClose={() => setShowUnifiedReg(false)} 
          onRegister={handleUnifiedRegister}
        />
      )}
    </div>
  );
};

export default App;
