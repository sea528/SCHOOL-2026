
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

// For Teacher View: In a real app this would fetch from DB. 
// Here we just mock it or could potentially scan localStorage keys if we really wanted to.
export const getAggregateData = () => {
  // Mock data for teacher dashboard
  return {
    avgProgress: 78,
    activeStudents: 24,
    warningStudents: 3
  };
};

export const downloadUserDataAsExcel = (userId: string, userName: string) => {
  // 1. Load All Data for the user
  const courses = loadUserData(userId, 'micro_learning', []);
  const challenges = loadUserData(userId, 'god_saeng', []);
  const reflectionData = loadUserData(userId, 'ditto_reflection', { reflection: '', feedback: '' });

  // 2. Build CSV Content
  // \uFEFF is the BOM (Byte Order Mark) to force Excel to treat the file as UTF-8
  let csvContent = "\uFEFF"; 

  // Header
  csvContent += `[${userName}(${userId})님의 갓생스쿨 생활기록부]\n`;
  csvContent += `생성일시,${new Date().toLocaleString()}\n\n`;

  // Section 1: Micro Learning
  csvContent += `[1. 숏클래스 학습 현황]\n`;
  csvContent += `강의명,과목,수강시간,이수여부\n`;
  if (Array.isArray(courses)) {
    courses.forEach((c: any) => {
      // CSV escape: wrap in quotes, replace inner quotes with double quotes
      const title = `"${c.title.replace(/"/g, '""')}"`;
      csvContent += `${title},${c.subject},${c.duration},${c.completed ? '이수 완료' : '미이수'}\n`;
    });
  }
  csvContent += `\n`;

  // Section 2: God Saeng Challenges
  csvContent += `[2. 갓생 챌린지 기록]\n`;
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

  // Section 3: Growth Story
  csvContent += `[3. 성장 에세이 & AI 피드백]\n`;
  
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
