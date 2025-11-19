import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateFeedback = async (studentReflection: string, gradeChange: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI 서비스 연결 불가: API KEY를 확인해주세요.";

  try {
    const prompt = `
      당신은 따뜻하고 격려를 아끼지 않는 고등학교 선생님입니다.
      학생이 다음과 같은 성적 변화와 회고록을 작성했습니다.
      
      성적 변화 추이: ${gradeChange}
      학생의 회고: "${studentReflection}"
      
      이 학생에게 줄 수 있는 200자 이내의 따뜻한 코멘트와 앞으로의 조언을 작성해주세요.
      이모지를 적절히 사용하여 '갓생'을 사는 학생을 응원해주세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "피드백을 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini generation error:", error);
    return "AI 피드백 생성 중 오류가 발생했습니다.";
  }
};

export const generateChallengeSummary = async (challenges: string[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI 연결 불가";

  try {
    const prompt = `
      학생이 현재 다음 챌린지들을 수행 중입니다: ${challenges.join(', ')}.
      이 챌린지들을 수행함으로써 얻을 수 있는 긍정적인 변화를 한 문장의 슬로건으로 만들어주세요.
      예: "새벽을 깨우는 힘, 당신의 미래를 바꿉니다!"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "챌린지 화이팅!";
  } catch (e) {
    return "오늘도 화이팅!";
  }
};