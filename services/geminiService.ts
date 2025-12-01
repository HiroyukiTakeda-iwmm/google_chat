
import { GoogleGenAI, Type } from "@google/genai";
import { Message, AIAnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to format transcript
const formatTranscript = (messages: Message[]): string => {
  if (!messages || messages.length === 0) return "（会話記録なし）";
  return messages
    .filter((m) => m.role === 'interviewer' || m.role === 'respondent')
    .map((m) => `${m.role === 'interviewer' ? 'インタビュアー' : '回答者'}: ${m.content}`)
    .join('\n');
};

// Helper to clean JSON string from Markdown code blocks
const cleanJsonOutput = (text: string): string => {
  let cleaned = text.trim();
  // Remove markdown code blocks ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

// Fallback logic when AI is unavailable
const getFallbackAnalysis = (transcript: string, category: string): AIAnalysisResult => {
  return {
    suggestedTitle: `[未分析] ${category}に関するインタビュー記録 (${new Date().toLocaleDateString()})`,
    summary: "AI分析に失敗したため、記録のみ保存されました。後ほど編集してください。",
    overview: "API接続の問題、または解析中にエラーが発生したため、詳細な分析が行われませんでした。\n\n" + transcript.slice(0, 200) + (transcript.length > 200 ? "..." : ""),
    keyInsights: ["AIによる自動分析失敗", "手動での要約・編集を推奨"],
    planningNotes: [],
    executionNotes: [],
    tags: [category, "未分析", "要編集"]
  };
};

export const generateNextQuestion = async (
  contextMessages: Message[],
  topic: string,
  intervieweeName: string
): Promise<string> => {
  if (!apiKey) return "ありがとうございます。詳しく教えていただけますか？（※APIキー未設定のため、AIによる自動質問生成は停止中です。設定を確認してください。）";

  const transcript = formatTranscript(contextMessages);

  const prompt = `
    コンテキスト: あなたは「${topic}」について、${intervieweeName}さんから暗黙知（経験則、コツ、判断基準）を引き出すプロのインタビュアーです。
    
    現在の対話ログ:
    ${transcript}
    
    指示: 
    1. 直前の回答者の発言を踏まえ、具体的で深掘りするような次の質問を1つだけ作成してください。
    2. 抽象的な質問ではなく、「具体的には？」「なぜその判断をしたのですか？」「失敗例はありますか？」など、現場の知恵を引き出す問いかけをしてください。
    3. 丁寧かつ自然な日本語で話しかけてください。
    
    出力: 質問のテキストのみを出力してください。JSON等は不要です。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Question Generation Error:", error);
    return "申し訳ありません、次の質問を生成中にエラーが発生しました。続けてお話いただけますか？";
  }
};

export const generateFollowUpSuggestions = async (
  contextMessages: Message[],
  topic: string
): Promise<string[]> => {
  if (!apiKey) return ["AI提案機能はAPIキー設定後に利用可能です"];

  const transcript = formatTranscript(contextMessages);

  const prompt = `
    コンテキスト: あなたは熟練のインタビュアーのアシスタントです。従業員から「${topic}」に関する暗黙知を引き出す手助けをしています。
    現在の対話ログ:
    ${transcript}
    
    タスク: 直前の回答に基づいて、隠れた詳細、判断の理由、または「現場のコツ」を掘り下げるための簡潔なフォローアップ質問を3つ提案してください。
    フォーマット: 文字列のJSON配列として3つの質問のみを返してください。日本語で出力してください。
    例: ["その時、具体的にどのような数値を見て判断しましたか？", "もし予算が足りなかったらどうしていましたか？", "チームメンバーにはどのように共有しましたか？"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const jsonStr = cleanJsonOutput(response.text || "[]");
    return JSON.parse(jsonStr) as string[];
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return ["提案を生成できませんでした。", "具体的に教えていただけますか？", "なぜそう判断したのですか？"];
  }
};

export const analyzeSession = async (
  messages: Message[],
  category: string
): Promise<AIAnalysisResult | null> => {
  const transcript = formatTranscript(messages);

  if (!apiKey) {
    console.warn("API Key missing, using fallback analysis.");
    return getFallbackAnalysis(transcript, category);
  }

  const prompt = `
    「${category}」に関する以下のインタビュー記録を分析し、組織内で再利用可能な形式知（ナレッジ記事）を作成してください。
    
    インタビュー記録:
    ${transcript}
    
    目的: 
    業務における暗黙知、ベストプラクティス、失敗からの教訓、および意思決定の基準を明確に抽出すること。
    特に「計画時の注意点」と「実務時の注意点」を区別して抽出してください。
    
    出力フォーマット（JSON）:
    必ず以下のJSON構造に従ってください。Markdownのコードブロックは含めないでください。
    {
      "suggestedTitle": "内容を体現する具体的でプロフェッショナルなタイトル",
      "summary": "一覧表示用の短くポイントをまとめた要約（150文字以内）。",
      "overview": "記事の詳細な概要・背景・文脈。",
      "keyInsights": ["重要なポイント1", "成功のコツ2", "判断基準3"],
      "planningNotes": ["計画・準備段階で気をつけるべき注意点", "事前に確認すべきこと"],
      "executionNotes": ["実務・実行段階で気をつけるべき注意点", "トラブルシューティング"],
      "tags": ["カテゴリタグ1", "タグ2"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            summary: { type: Type.STRING },
            overview: { type: Type.STRING },
            keyInsights: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            planningNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            executionNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            }
          },
          required: ["suggestedTitle", "summary", "overview", "keyInsights", "planningNotes", "executionNotes", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const jsonStr = cleanJsonOutput(text);
    return JSON.parse(jsonStr) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return fallback to allow saving even if AI fails
    return getFallbackAnalysis(transcript, category);
  }
};
