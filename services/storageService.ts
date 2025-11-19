
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
