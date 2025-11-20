
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, Course, Challenge, UserRole } from '../types';

const STORAGE_PREFIX = 'school2026_';

// --- User Management ---

export const loginUserToSupabase = async (id: string, name: string, role: UserRole): Promise<User | null> => {
  if (isSupabaseConfigured) {
    try {
      // 1. Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (existingUser) {
        await supabase.from('users').update({ name, role }).eq('id', id);
        return { id: existingUser.id, name: existingUser.name, role: existingUser.role as UserRole };
      }

      // 2. If not, create user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ id, name, role }])
        .select()
        .single();

      if (insertError) throw insertError;
      
      return { id: newUser.id, name: newUser.name, role: newUser.role as UserRole };
    } catch (e) {
      console.error("Supabase Login Error:", e);
      // Fallback to local if DB fails unexpectedly
      return loginUserLocal(id, name, role);
    }
  } else {
    return loginUserLocal(id, name, role);
  }
};

const loginUserLocal = (id: string, name: string, role: UserRole): User => {
  console.log("Using Local Storage for Login");
  const userKey = `${STORAGE_PREFIX}user_${id}`;
  const newUser: User = { id, name, role };
  localStorage.setItem(userKey, JSON.stringify(newUser));
  
  // Update global user list for teacher view aggregation
  const usersListKey = `${STORAGE_PREFIX}all_users`;
  const existingUsersStr = localStorage.getItem(usersListKey);
  let allUsers: User[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];
  
  if (!allUsers.find(u => u.id === id)) {
    allUsers.push(newUser);
    localStorage.setItem(usersListKey, JSON.stringify(allUsers));
  }
  
  return newUser;
};

// --- Micro Learning ---

export const fetchCourses = async (): Promise<Course[]> => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) return [];
    return data.map((c: any) => ({
      id: c.id,
      title: c.title,
      subject: c.subject,
      duration: c.duration,
      thumbnail: c.thumbnail,
      videoUrl: c.video_url,
      completed: false
    }));
  } else {
    const json = localStorage.getItem('SHARED_CONTENT_micro_learning');
    return json ? JSON.parse(json) : [];
  }
};

export const fetchUserProgress = async (userId: string): Promise<string[]> => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('course_progress')
      .select('course_id')
      .eq('user_id', userId)
      .eq('completed', true);

    if (error) return [];
    return data.map((item: any) => item.course_id);
  } else {
    const json = localStorage.getItem(`${STORAGE_PREFIX}progress_${userId}`);
    return json ? JSON.parse(json) : [];
  }
};

export const saveCourseToSupabase = async (course: Course) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('courses')
      .insert([{
        id: course.id,
        title: course.title,
        subject: course.subject,
        duration: course.duration,
        thumbnail: course.thumbnail,
        video_url: course.videoUrl
      }]);
    if (error) console.error("Save Course Error", error);
  } else {
    const courses = await fetchCourses();
    const updated = [course, ...courses];
    localStorage.setItem('SHARED_CONTENT_micro_learning', JSON.stringify(updated));
  }
};

export const deleteCourseFromSupabase = async (courseId: string) => {
  if (isSupabaseConfigured) {
    await supabase.from('courses').delete().eq('id', courseId);
  } else {
    const courses = await fetchCourses();
    const updated = courses.filter(c => c.id !== courseId);
    localStorage.setItem('SHARED_CONTENT_micro_learning', JSON.stringify(updated));
  }
};

export const updateUserProgress = async (userId: string, courseId: string, completed: boolean) => {
  if (isSupabaseConfigured) {
    if (completed) {
      await supabase.from('course_progress').insert([{ user_id: userId, course_id: courseId, completed: true }]);
    } else {
      await supabase.from('course_progress').delete().eq('user_id', userId).eq('course_id', courseId);
    }
  } else {
    const progress = await fetchUserProgress(userId);
    let updated = [...progress];
    if (completed) {
      if (!updated.includes(courseId)) updated.push(courseId);
    } else {
      updated = updated.filter(id => id !== courseId);
    }
    localStorage.setItem(`${STORAGE_PREFIX}progress_${userId}`, JSON.stringify(updated));
  }
};

// --- God Saeng ---

export const fetchChallenges = async (userId: string): Promise<Challenge[]> => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId);

    if (error) return [];

    return data.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      daysTotal: c.days_total,
      daysCompleted: c.days_completed,
      badgeIcon: c.badge_icon,
      color: c.color
    }));
  } else {
    const json = localStorage.getItem(`${STORAGE_PREFIX}challenges_${userId}`);
    return json ? JSON.parse(json) : [];
  }
};

export const saveChallengeToSupabase = async (userId: string, challenge: Challenge) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('challenges')
      .upsert([{
        id: challenge.id,
        user_id: userId,
        title: challenge.title,
        description: challenge.description,
        days_total: challenge.daysTotal,
        days_completed: challenge.daysCompleted,
        badge_icon: challenge.badgeIcon,
        color: challenge.color
      }]);
    if (error) console.error("Save Challenge Error", error);
  } else {
    const challenges = await fetchChallenges(userId);
    const index = challenges.findIndex(c => c.id === challenge.id);
    let updated;
    if (index >= 0) {
      updated = challenges.map(c => c.id === challenge.id ? challenge : c);
    } else {
      updated = [...challenges, challenge];
    }
    localStorage.setItem(`${STORAGE_PREFIX}challenges_${userId}`, JSON.stringify(updated));
  }
};

export const deleteChallengeFromSupabase = async (challengeId: string) => {
  // We need userId to delete from local storage properly, but since interface only has ID, 
  // we might need to assume the caller handles state update or we scan.
  // For LocalStorage simplicity, we assume the component refreshes its state and overwrites,
  // but to be safe let's just allow the UI to handle the state update and we rely on `saveChallenge` logic usually.
  // Actually, we need a way to delete.
  // For this mock, we'll cheat a bit: the UI updates state and effectively "saves" the new list?
  // No, the UI calls this function.
  
  if (isSupabaseConfigured) {
    await supabase.from('challenges').delete().eq('id', challengeId);
  } else {
    // Local storage deletion is tricky without UserID.
    // We will rely on the fact that in Local Mode, we iterate all keys or just rely on the UI being consistent.
    // Wait, the GodSaeng component passes ID.
    // We need to find which user owns this challenge.
    // For simplicity in Local Mode, we will traverse `school2026_challenges_*`.
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_PREFIX}challenges_`)) {
        const list: Challenge[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (list.find(c => c.id === challengeId)) {
          const updated = list.filter(c => c.id !== challengeId);
          localStorage.setItem(key, JSON.stringify(updated));
          break;
        }
      }
    }
  }
};

// --- Ditto (Reflection) ---

export const fetchReflection = async (userId: string) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error || !data) return { reflection: '', feedback: null };
    return { reflection: data.reflection, feedback: data.feedback };
  } else {
    const json = localStorage.getItem(`${STORAGE_PREFIX}reflection_${userId}`);
    return json ? JSON.parse(json) : { reflection: '', feedback: null };
  }
};

export const saveReflectionToSupabase = async (userId: string, reflection: string, feedback: string | null) => {
  if (isSupabaseConfigured) {
    await supabase
      .from('reflections')
      .upsert([{ user_id: userId, reflection, feedback }]);
  } else {
    localStorage.setItem(`${STORAGE_PREFIX}reflection_${userId}`, JSON.stringify({ reflection, feedback }));
  }
};

// --- Teacher Dashboard Aggregations ---

export const getAllStudentChallengeStats = async () => {
  if (isSupabaseConfigured) {
    const { data: users } = await supabase.from('users').select('id, name').eq('role', 'STUDENT');
    const { data: challenges } = await supabase.from('challenges').select('user_id, days_completed');
    
    if (!users || !challenges) return [];

    const stats = users.map(user => {
      const userChallenges = challenges.filter((c: any) => c.user_id === user.id);
      const totalDays = userChallenges.reduce((acc: number, c: any) => acc + (c.days_completed || 0), 0);
      return {
        name: `${user.name} (${user.id})`,
        totalDays,
        challengeCount: userChallenges.length
      };
    });

    return stats.sort((a, b) => b.totalDays - a.totalDays);
  } else {
    // Local Mode Aggregation
    const stats: any[] = [];
    const usersKey = `${STORAGE_PREFIX}all_users`;
    const users: User[] = JSON.parse(localStorage.getItem(usersKey) || '[]');
    
    users.filter(u => u.role === UserRole.STUDENT).forEach(user => {
      const challenges: Challenge[] = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}challenges_${user.id}`) || '[]');
      const totalDays = challenges.reduce((acc, c) => acc + c.daysCompleted, 0);
      stats.push({
        name: `${user.name} (${user.id})`,
        totalDays,
        challengeCount: challenges.length
      });
    });
    
    return stats.sort((a, b) => b.totalDays - a.totalDays);
  }
};

export const getAllStudentGrowthData = async () => {
  if (isSupabaseConfigured) {
    const { data: users } = await supabase.from('users').select('id, name').eq('role', 'STUDENT');
    const { data: progress } = await supabase.from('course_progress').select('user_id');
    const { data: reflections } = await supabase.from('reflections').select('user_id, reflection');
    
    if (!users) return [];
    
    const result = users.map(user => {
      const courseCount = progress ? progress.filter((p: any) => p.user_id === user.id).length : 0;
      const reflectionData = reflections ? reflections.find((r: any) => r.user_id === user.id) : null;
      
      return {
        id: user.name, 
        courseCount,
        reflection: reflectionData ? reflectionData.reflection : ''
      };
    });

    return result.filter(r => r.courseCount > 0 || r.reflection).sort((a, b) => b.courseCount - a.courseCount);
  } else {
    // Local Mode
    const result: any[] = [];
    const usersKey = `${STORAGE_PREFIX}all_users`;
    const users: User[] = JSON.parse(localStorage.getItem(usersKey) || '[]');

    users.filter(u => u.role === UserRole.STUDENT).forEach(user => {
      const progress = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}progress_${user.id}`) || '[]');
      const reflectionData = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}reflection_${user.id}`) || '{}');
      
      if (progress.length > 0 || reflectionData.reflection) {
        result.push({
          id: user.name,
          courseCount: progress.length,
          reflection: reflectionData.reflection || ''
        });
      }
    });
    
    return result.sort((a, b) => b.courseCount - a.courseCount);
  }
};

// --- Excel Export ---
export const downloadUserDataAsExcel = async (userId: string, userName: string, graphData: any[] = []) => {
  const courseProgress = await fetchUserProgress(userId);
  const challenges = await fetchChallenges(userId);
  const reflectionData = await fetchReflection(userId);

  let csvContent = "\uFEFF"; 
  csvContent += `[${userName}(${userId})님의 갓생스쿨 생활기록부]\n`;
  csvContent += `생성일시,${new Date().toLocaleString()}\n\n`;

  csvContent += `[1. 성장 그래프 데이터]\n`;
  csvContent += `시기,점수,과목\n`;
  if (Array.isArray(graphData)) {
    graphData.forEach((d: any) => {
      csvContent += `${d.term},${d.score},${d.subject}\n`;
    });
  }
  csvContent += `\n`;

  csvContent += `[2. 숏클래스 학습 현황]\n`;
  csvContent += `수강 완료 강의 수,${courseProgress.length}개\n`;
  csvContent += `\n`;

  csvContent += `[3. 갓생 챌린지 기록]\n`;
  csvContent += `챌린지명,목표일수,달성일수,진행률,상태\n`;
  if (Array.isArray(challenges)) {
    challenges.forEach((c: any) => {
      const rate = Math.round((c.daysCompleted / c.daysTotal) * 100);
      const status = c.daysCompleted >= c.daysTotal ? '🏅 챌린지 성공' : '🏃 진행중';
      const title = `"${c.title.replace(/"/g, '""')}"`;
      csvContent += `${title},${c.daysTotal}일,${c.daysCompleted}일,${rate}%,${status}\n`;
    });
  }
  csvContent += `\n`;

  csvContent += `[4. 성장 에세이 & AI 피드백]\n`;
  const reflection = reflectionData.reflection ? `"${reflectionData.reflection.replace(/"/g, '""').replace(/\n/g, ' ')}"` : "기록 없음";
  const feedback = reflectionData.feedback ? `"${reflectionData.feedback.replace(/"/g, '""').replace(/\n/g, ' ')}"` : "피드백 없음";

  csvContent += `나의 회고,${reflection}\n`;
  csvContent += `AI 선생님 피드백,${feedback}\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${userName}_${userId}_갓생기록부.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
