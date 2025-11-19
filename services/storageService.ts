
// Helper to simulate database persistence using LocalStorage
// Keys are prefixed with the User ID to ensure data separation

const PREFIX = 'school2026_';

export const loadUserData = <T>(userId: string, key: string, defaultData: T): T => {
  if (!userId) return defaultData;
  try {
    const item = localStorage.getItem(`${PREFIX}${userId}_${key}`);
    return item ? JSON.parse(item) : defaultData;
  } catch (error) {
    console.error("Error loading data", error);
    return defaultData;
  }
};

export const saveUserData = <T>(userId: string, key: string, data: T): void => {
  if (!userId) return;
  try {
    localStorage.setItem(`${PREFIX}${userId}_${key}`, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving data", error);
  }
};

// Scan localStorage to find all student challenge data for the teacher dashboard
export const getAllStudentChallengeStats = () => {
  const stats: { name: string; totalDays: number; challengeCount: number }[] = [];
  
  // Iterate through all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Key format: school2026_{studentId}_god_saeng
    if (key && key.startsWith(PREFIX) && key.endsWith('_god_saeng')) {
      try {
        // Extract userId from key
        // prefix length is 11 (school2026_), suffix length is 9 (_god_saeng)
        const userId = key.substring(PREFIX.length, key.length - 9);
        
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        
        if (Array.isArray(data)) {
          // Calculate total completed days across all challenges for this student
          const totalDays = data.reduce((acc: number, cur: any) => acc + (cur.daysCompleted || 0), 0);
          
          // Only include if they have at least started something or created a challenge
          if (data.length > 0) {
            stats.push({
              name: userId, // Using ID as name since we don't store names separately in this simple DB
              totalDays: totalDays,
              challengeCount: data.length
            });
          }
        }
      } catch (e) {
        console.error("Error parsing student data", e);
      }
    }
  }
  
  // Sort by effort (total days) descending
  return stats.sort((a, b) => b.totalDays - a.totalDays);
};

// Scan localStorage to gather Course Counts and Reflections for Teacher Ditto View
export const getAllStudentGrowthData = () => {
  const studentMap = new Map<string, { courseCount: number; reflection: string }>();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;

    let userId = '';
    
    // Check for course progress key
    if (key.endsWith('_course_progress')) {
       userId = key.substring(PREFIX.length, key.length - 16); // '_course_progress'.length = 16
    } 
    // Check for reflection key
    else if (key.endsWith('_ditto_reflection')) {
       userId = key.substring(PREFIX.length, key.length - 17); // '_ditto_reflection'.length = 17
    }

    if (userId && userId !== 'SHARED_CONTENT') {
        if (!studentMap.has(userId)) {
            studentMap.set(userId, { courseCount: 0, reflection: '' });
        }
        const current = studentMap.get(userId)!;

        if (key.endsWith('_course_progress')) {
            const progress = JSON.parse(localStorage.getItem(key) || '[]');
            current.courseCount = Array.isArray(progress) ? progress.length : 0;
        } else if (key.endsWith('_ditto_reflection')) {
            const refData = JSON.parse(localStorage.getItem(key) || '{}');
            current.reflection = refData.reflection || '';
        }
    }
  }

  return Array.from(studentMap.entries())
    .map(([id, val]) => ({
      id,
      courseCount: val.courseCount,
      reflection: val.reflection
    }))
    .filter(item => item.courseCount > 0 || item.reflection !== '') // Only show active students
    .sort((a, b) => b.courseCount - a.courseCount); // Sort by course count descending
};

export const downloadUserDataAsExcel = (userId: string, userName: string, graphData: any[] = []) => {
  // 1. Load All Data for the user
  const courses = loadUserData(userId, 'micro_learning', []); // Note: Legacy check, technically should be checking shared + progress for full detail
  const courseProgress = loadUserData(userId, 'course_progress', []); // Just IDs
  const challenges = loadUserData(userId, 'god_saeng', []);
  const reflectionData = loadUserData(userId, 'ditto_reflection', { reflection: '', feedback: '' });

  // 2. Build CSV Content
  // \uFEFF is the BOM (Byte Order Mark) to force Excel to treat the file as UTF-8
  let csvContent = "\uFEFF"; 

  // Header
  csvContent += `[${userName}(${userId})님의 갓생스쿨 생활기록부]\n`;
  csvContent += `생성일시,${new Date().toLocaleString()}\n\n`;

  // Section 1: Graph Data (New)
  csvContent += `[1. 성장 그래프 데이터]\n`;
  csvContent += `시기,점수,과목\n`;
  if (Array.isArray(graphData)) {
    graphData.forEach((d: any) => {
      csvContent += `${d.term},${d.score},${d.subject}\n`;
    });
  }
  csvContent += `\n`;

  // Section 2: Micro Learning
  csvContent += `[2. 숏클래스 학습 현황]\n`;
  csvContent += `수강 완료 강의 수,${courseProgress.length}개\n`;
  csvContent += `\n`;

  // Section 3: God Saeng Challenges
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

  // Section 4: Growth Story
  csvContent += `[4. 성장 에세이 & AI 피드백]\n`;
  
  const reflection = reflectionData.reflection ? `"${reflectionData.reflection.replace(/"/g, '""').replace(/\n/g, ' ')}"` : "기록 없음";
  const feedback = reflectionData.feedback ? `"${reflectionData.feedback.replace(/"/g, '""').replace(/\n/g, ' ')}"` : "피드백 없음";

  csvContent += `나의 회고,${reflection}\n`;
  csvContent += `AI 선생님 피드백,${feedback}\n`;

  // 3. Create Download Link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${userName}_${userId}_갓생기록부.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
