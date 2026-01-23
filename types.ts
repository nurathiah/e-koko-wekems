
export type Category = 'beruniform' | 'kelab' | 'sukan' | 'rumah_sukan';

export interface Unit {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: Category;
  customImage?: string | null;
  isCustom?: boolean;
}

export interface Student {
  id: string;
  name: string;
  className: string;
  unitId: string;
  attendance: { [week: number]: boolean }; // true = absent
}

export interface Teacher {
  id: string;
  name: string;
  position: string;
  unitId: string;
  attendance: { [week: number]: boolean }; // true = absent
}

export interface SuccessStory {
  id: string;
  title: string;
  category: 'MURID' | 'GURU';
  image: string | null;
  date: string;
}

export interface UnitCommitteeMember {
  id: string;
  unitId: string;
  position: string;
  name: string;
  icNumber: string;
  className: string;
}

export interface CommitteeMember {
  id: string;
  name: string;
  position: string;
  rank: number;
  image: string | null;
}

export interface ManagementData {
  organizationChart: {
    committee: CommitteeMember[];
    image: string | null;
    lastUpdated: string;
  };
  minutes: {
    id: string;
    title: string;
    date: string;
    file: string | null;
  }[];
}

export interface TakwimItem {
  id: string;
  unitId: string;
  week: number;
  title: string;
  date: string;
  reflection: string;
  isManual: boolean;
}

export interface MeetingMetadata {
  unitId: string;
  week: number;
  date: string;
  time: string;
  location: string;
}

export interface OPR {
  id: string;
  unitId: string;
  week: number;
  date: string;
  time: string;
  location: string;
  title: string;
  objective: string;
  activity: string;
  reflection: string;
  studentAttendance: number;
  teacherAttendance: number;
  images: (string | null)[];
  pikebm?: {
    objective: string;
    materials: string;
    steps: string;
    reflection: string;
  };
  sivik?: {
    theme: string;
    goal: string;
    activity: string;
    suggestion?: string;
  };
}

export interface GlobalEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  image?: string | null;
}

export interface Achievement {
  id: string;
  unitName: string;
  award: string;
  rank: string; 
  image: string | null;
  date: string;
}
