
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

export const recommendChallenge = async (): Promise<{title: string, description: string, days: number, emoji: string} | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const prompt = `
      고등학생이 학교 생활이나 자기개발을 위해 할 수 있는 트렌디하고 유익한 '갓생 챌린지' 하나를 추천해주세요.
      너무 뻔하지 않고 학생들이 좋아할만한 주제(공부, 운동, 멘탈, 습관 등)로 선정해주세요.
      
      응답은 반드시 다음 JSON 형식으로 해주세요:
      {
        "title": "챌린지 제목 (짧고 임팩트 있게)",
        "description": "구체적인 인증 방법 (한 문장)",
        "days": 추천 수행 기간 (숫자만, 14~30 사이),
        "emoji": "관련 이모지 1개"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (e) {
    console.error("AI Recommend Error", e);
    return null;
  }
};

export const generateThumbnail = async (topic: string): Promise<string | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    // Using Imagen 3 model as per guidelines for high quality image generation
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A high-quality, visually appealing, modern, and minimalist educational illustration for a course thumbnail about: "${topic}". The style should be suitable for a high school education platform. Use bright and encouraging colors. 16:9 aspect ratio.`,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
        outputMimeType: 'image/jpeg'
      }
    });

    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64Image) {
      return `data:image/jpeg;base64,${base64Image}`;
    }
    return null;
  } catch (e) {
    console.error("Thumbnail Generation Error", e);
    return null;
  }
};

export const summarizeStudentReflection = async (reflection: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI 연결 불가";

  try {
    const prompt = `
      다음은 학생의 학교생활 성장 회고록입니다.
      선생님이 학생의 성장을 한눈에 파악할 수 있도록, 
      이 학생이 겪은 가장 큰 변화나 성취, 혹은 느낌점을 한 문장으로 명확하고 간결하게 요약해주세요.
      
      학생의 텍스트: "${reflection}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "요약할 수 없습니다.";
  } catch (error) {
    console.error("Summarize Error", error);
    return "AI 요약 실패";
  }
};
