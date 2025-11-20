
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Course {
  id: string;
  title: string;
  duration: string; // e.g., "3:45"
  thumbnail: string;
  completed: boolean;
  subject: string;
  videoUrl?: string; // YouTube embed URL
  completionCount?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  daysTotal: number;
  daysCompleted: number;
  badgeIcon: string; // emoji or url
  color: string;
}

export interface GradeRecord {
  term: string;
  score: number;
  subject: string;
}

export interface Story {
  id: string;
  date: string;
  content: string;
  aiFeedback?: string;
  tags: string[];
}

export type ViewState = 'DASHBOARD' | 'MICRO_LEARNING' | 'GOD_SAENG' | 'DITTO';