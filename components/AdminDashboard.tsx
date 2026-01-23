
import React, { useState } from 'react';
import { Unit, Student, Teacher, OPR, MeetingMetadata } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  Layout, Users, UserCheck, GraduationCap, Calendar, 
  FileText, Star, HelpCircle, Layers, TrendingUp
} from 'lucide-react';

interface AdminDashboardProps {
  units: Unit[];
  students: Student[];
  teachers: Teacher[];
  oprs: OPR[];
  meetings: MeetingMetadata[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ units, students, teachers, oprs, meetings }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const sidebarItems = [
    { name: 'Dashboard', icon: Layout },
    { name: 'Students', icon: Users },
    { name: 'Teachers', icon: UserCheck },
    { name: 'Parents', icon: GraduationCap },
    { name: 'Events', icon: Calendar },
    { name: 'Exams', icon: FileText },
    { name: 'Assistant', icon: HelpCircle },
  ];

  // Calculate cumulative attendance for Pie Chart
  const studentStats = React.useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;
    students.forEach(s => {
      Object.values(s.attendance).forEach(absent => {
        if (absent) totalAbsent++;
        else totalPresent++;
      });
    });
    return [
      { name: 'Hadir', value: totalPresent || 85, fill: '#10b981' },
      { name: 'Tidak Hadir', value: totalAbsent || 15, fill: '#ef4444' }
    ];
  }, [students]);

  const teacherStats = React.useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;
    teachers.forEach(t => {
      Object.values(t.attendance).forEach(absent => {
        if (absent) totalAbsent++;
        else totalPresent++;
      });
    });
    return [
      { name: 'Hadir', value: totalPresent || 95, fill: '#3b82f6' },
      { name: 'Tidak Hadir', value: totalAbsent || 5, fill: '#f59e0b' }
    ];
  }, [teachers]);

  const statCards = [
    { label: 'Schools', value: '99', icon: GraduationCap, color: 'bg-orange-100', accent: 'border-orange-400', textColor: 'text-orange-600' },
    { label: 'Teachers', value: teachers.length || 2953, icon: UserCheck, color: 'bg-indigo-100', accent: 'border-indigo-900', textColor: 'text-indigo-900' },
    { label: 'Students', value: students.length || 3066, icon: Users, color: 'bg-yellow-100', accent: 'border-yellow-400', textColor: 'text-yellow-600' },
    { label: 'OPR Reports', value: oprs.length || 3095, icon: FileText, color: 'bg-green-100', accent: 'border-green-600', textColor: 'text-green-600' },
  ];

  const winners = [
    { name: 'Rovan Hossam', score: '99.88 %', rank: '1st', color: 'bg-green-700', img: 'https://i.pravatar.cc/150?u=1' },
    { name: 'Rony Beyablo', score: '98.17 %', rank: '2nd', color: 'bg-blue-900', img: 'https://i.pravatar.cc/150?u=2' },
    { name: 'Adam Hisham', score: '97.32 %', rank: '3rd', color: 'bg-yellow-500', img: 'https://i.pravatar.cc/150?u=3' },
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="flex h-full bg-[#dbeafe] rounded-[40px] overflow-hidden border-8 border-[#dbeafe] shadow-2xl animate-in fade-in duration-700">
      {/* Sidebar */}
      <div className="w-64 bg-[#1e3a8a] flex flex-col py-8 shrink-0">
        <div className="px-6 mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="text-white" />
          </div>
          <span className="text-white font-black text-sm tracking-tighter">INGRADE SMART</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-4 px-8 py-4 transition-all relative ${
                activeTab === item.name 
                ? 'bg-[#dbeafe] text-[#1e3a8a] rounded-l-full font-bold' 
                : 'text-white/70 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="px-8 mt-auto">
          <div className="w-full h-32 bg-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden group">
             <img src="https://lh3.googleusercontent.com/d/1xl4C5RGqMGLFikaBzfcG7ePEqFBiTUBb" className="w-16 h-16 object-contain opacity-50 group-hover:opacity-100 transition-opacity" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {/* Top Header */}
        <div className="bg-white rounded-xl px-8 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Welcome to Ingrade Smart School</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">School Year 2026 - 2027</span>
            <Layers size={18} className="text-slate-400" />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6">
          {statCards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden flex h-24 border-b-4 border-transparent hover:shadow-md transition-shadow">
               <div className={`w-3 ${card.accent} border-l-8`}></div>
               <div className="flex-1 flex items-center px-6">
                  <div className={`p-3 rounded-xl ${card.color} ${card.textColor} mr-4`}>
                    <card.icon size={24} />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{card.label}</p>
                    <p className="text-2xl font-black text-slate-800">{card.value}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Attendance Pie Charts Section */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7 bg-white rounded-xl shadow-sm p-6 flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" /> Analisis Kehadiran Keseluruhan
            </h3>
            <div className="grid grid-cols-2 gap-4 flex-1">
              {/* Student Pie */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Kehadiran Murid</p>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={studentStats} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {studentStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Teacher Pie */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Kehadiran Guru</p>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={teacherStats} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {teacherStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="col-span-12 lg:col-span-5 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Calendar Attendance</h3>
              <span className="text-[10px] font-black text-indigo-600">MINGGU SEMASA</span>
            </div>
            <div className="p-6 flex-1">
              <div className="grid grid-cols-7 gap-2 mb-6">
                {days.slice(0, 21).map(d => (
                  <div 
                    key={d} 
                    className={`h-8 flex items-center justify-center text-[10px] font-black rounded shadow-sm ${
                      d <= 15 ? 'bg-yellow-400 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="flex border-t pt-4 overflow-x-auto no-scrollbar gap-3">
                {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((m, i) => (
                  <div key={m} className="flex flex-col items-center min-w-[32px]">
                    <span className={`text-[8px] font-bold mb-1 ${i === 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{m}</span>
                    <div className={`w-full h-1.5 rounded-full ${i === 0 ? 'bg-indigo-400' : 'bg-slate-100'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-12 gap-6">
          {/* Activities List */}
          <div className="col-span-12 lg:col-span-7 bg-white rounded-xl shadow-sm p-8">
            <h3 className="font-bold text-slate-800 mb-8">Activities & Events</h3>
            <div className="space-y-6">
              {[
                { title: 'Back to School Dance (on the Quad)', date: '22 Jan 2026' },
                { title: 'Elimination Game', date: '25 Jan 2026' },
                { title: 'Fall Sports Rally', date: '02 Feb 2026' },
                { title: 'Freshman Elections', date: '10 Feb 2026' }
              ].map((act, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex items-center justify-between pb-3">
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{act.title}</span>
                    <span className="text-[10px] font-black text-slate-300 group-hover:text-indigo-400">{act.date}</span>
                  </div>
                  <div className="h-[1px] bg-indigo-50 w-full group-hover:bg-indigo-100 transition-colors"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="col-span-12 lg:col-span-5 grid grid-cols-3 gap-4">
            {winners.map((win, idx) => (
              <div key={idx} className={`${win.color} rounded-2xl p-4 flex flex-col items-center text-white relative overflow-hidden shadow-lg transform hover:scale-105 transition-all`}>
                <div className="absolute top-2 left-2 opacity-30">
                   <Star size={14} fill="white" />
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-white/30 p-1 mb-4 shadow-xl overflow-hidden">
                  <img src={win.img} className="w-full h-full rounded-full object-cover" />
                </div>
                <h4 className="text-[10px] font-black text-center mb-1 leading-tight">{win.name}</h4>
                <p className="text-[11px] font-black mb-4">{win.score}</p>
                <div className="mt-auto w-full bg-black/20 rounded-lg py-1.5 text-center text-[10px] font-black uppercase tracking-widest">
                  {win.rank}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
