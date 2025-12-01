import { GoogleGenAI, Type } from "@google/genai";
import { Message, AIAnalysisResult } from "../types";

// API key from environment
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Configuration
const MODEL_NAME = 'gemini-2.5-flash';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // ms

// Error types for better handling
type AIError = {
  code: 'NO_API_KEY' | 'NETWORK_ERROR' | 'API_ERROR' | 'PARSE_ERROR' | 'TIMEOUT';
  message: string;
  originalError?: unknown;
};

// Helper: Format transcript for prompts
const formatTranscript = (messages: Message[]): string => {
  if (!messages || messages.length === 0) return "（会話記録なし）";
  
  return messages
    .filter((m) => m.role === 'interviewer' || m.role === 'respondent')
    .map((m) => `${m.role === 'interviewer' ? 'インタビュアー' : '回答者'}: ${m.content}`)
    .join('\n');
};

// Helper: Clean JSON output from Markdown code blocks
const cleanJsonOutput = (text: string): string => {
  let cleaned = text.trim();
  
  // Remove markdown code blocks
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }
  
  // Remove leading/trailing backticks if still present
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  
  return cleaned.trim();
};

// Helper: Sleep for retry logic
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Retry wrapper
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('API key')) {
        throw error;
      }
      
      if (attempt < retries) {
        console.warn(`AI request failed, retrying (${attempt + 1}/${retries})...`);
        await sleep(RETRY_DELAY * (attempt + 1));
      }
    }
  }
  
  throw lastError;
};

// Fallback analysis when AI is unavailable
const getFallbackAnalysis = (transcript: string, category: string): AIAnalysisResult => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Extract some basic info from transcript
  const lines = transcript.split('\n').filter(l => l.trim());
  const previewText = lines.slice(0, 3).join(' ').substring(0, 200);
  
  return {
    suggestedTitle: `${category}に関するインタビュー記録 (${dateStr})`,
    summary: previewText 
      ? `${previewText}${previewText.length >= 200 ? '...' : ''}`
      : "AI分析に失敗したため、記録のみ保存されました。手動で編集してください。",
    overview: transcript.length > 0 
      ? `以下のインタビューが記録されました：\n\n${transcript.substring(0, 500)}${transcript.length > 500 ? '...\n\n（以下省略）' : ''}`
      : "API接続の問題により、詳細な分析が行われませんでした。後ほど編集してください。",
    keyInsights: [
      "AIによる自動分析は失敗しました",
      "インタビュー内容は正常に保存されています",
      "手動での要約・ポイント追加を推奨します"
    ],
    planningNotes: [],
    executionNotes: [],
    tags: [category, "要編集", "手動分析待ち"]
  };
};

/**
 * Generate the next interview question based on context
 */
export const generateNextQuestion = async (
  contextMessages: Message[],
  topic: string,
  intervieweeName: string
): Promise<string> => {
  // Check API key
  if (!ai) {
    return `ありがとうございます。詳しく教えていただけますか？
    
（※ APIキーが設定されていないため、AI質問生成が停止中です。環境変数 GEMINI_API_KEY を設定してください。）`;
  }

  const transcript = formatTranscript(contextMessages);
  const messageCount = contextMessages.filter(m => m.role === 'respondent').length;

  // Adjust questioning style based on conversation progress
  let questioningStyle = "";
  if (messageCount <= 2) {
    questioningStyle = "まだ序盤なので、基本的な背景や概要を把握するための質問をしてください。";
  } else if (messageCount <= 5) {
    questioningStyle = "中盤です。具体的なエピソードや判断基準について深掘りしてください。";
  } else {
    questioningStyle = "終盤に近づいています。これまでの内容をまとめるような質問や、最後に伝えたいことを聞いてください。";
  }

  const prompt = `
あなたは「${topic}」について、${intervieweeName}さんから暗黙知（経験則、コツ、判断基準）を引き出すプロのインタビュアーです。

【現在の対話ログ】
${transcript}

【インタビュー進行状況】
- 回答者の発言回数: ${messageCount}回
- ${questioningStyle}

【指示】
1. 直前の回答者の発言を踏まえ、具体的で深掘りするような次の質問を1つだけ作成してください。
2. 以下のような現場の知恵を引き出す問いかけを心がけてください：
   - 「具体的にはどのような状況でしたか？」
   - 「なぜその判断をしたのですか？」
   - 「失敗した経験はありますか？その時どう対処しましたか？」
   - 「他の人にアドバイスするとしたら何を伝えますか？」
3. 丁寧かつ自然な日本語で話しかけてください。
4. 回答者が答えやすいよう、質問は1つだけにしてください。

【出力】
質問のテキストのみを出力してください。説明やJSON形式は不要です。
`;

  try {
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      });
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Empty response from AI");
    }

    return text;
  } catch (error) {
    console.error("Gemini Question Generation Error:", error);
    
    // Contextual fallback questions
    const fallbackQuestions = [
      "その点について、もう少し詳しく教えていただけますか？",
      "具体的なエピソードがあれば、ぜひ聞かせてください。",
      "なぜそのように判断されたのでしょうか？",
      "他の方法も検討されましたか？なぜその方法を選んだのでしょう？",
      "その経験から学んだ、特に重要なポイントは何ですか？"
    ];
    
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)] + 
      "\n\n（※ 一時的にAI質問生成に問題が発生しています）";
  }
};

/**
 * Generate follow-up question suggestions for manual interview mode
 */
export const generateFollowUpSuggestions = async (
  contextMessages: Message[],
  topic: string
): Promise<string[]> => {
  if (!ai) {
    return [
      "AI提案機能はAPIキー設定後に利用可能です",
      "具体的に教えていただけますか？",
      "なぜそう判断したのですか？"
    ];
  }

  const transcript = formatTranscript(contextMessages);

  const prompt = `
あなたは熟練のインタビュアーのアシスタントです。
従業員から「${topic}」に関する暗黙知を引き出す手助けをしています。

【現在の対話ログ】
${transcript}

【タスク】
直前の回答に基づいて、以下の観点から深掘りするフォローアップ質問を3つ提案してください：
1. 具体的なエピソード・数値・状況を引き出す質問
2. 判断の理由や思考プロセスを探る質問  
3. 「現場のコツ」や失敗からの学びを掘り下げる質問

【出力形式】
3つの質問を日本語のJSON配列として返してください。
例: ["質問1", "質問2", "質問3"]
`;

  try {
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          temperature: 0.8,
          maxOutputTokens: 500,
        }
      });
    });

    const jsonStr = cleanJsonOutput(response.text || "[]");
    const suggestions = JSON.parse(jsonStr) as string[];
    
    // Ensure we have exactly 3 suggestions
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error("Invalid suggestions format");
    }
    
    return suggestions.slice(0, 3);
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [
      "その点について、もう少し詳しく教えてください。",
      "具体的な数値や事例はありますか？",
      "他の人にアドバイスするとしたら、何を伝えますか？"
    ];
  }
};

/**
 * Analyze completed interview session and generate knowledge article
 */
export const analyzeSession = async (
  messages: Message[],
  category: string
): Promise<AIAnalysisResult> => {
  const transcript = formatTranscript(messages);

  // Handle case where AI is not available
  if (!ai) {
    console.warn("API Key missing, using fallback analysis.");
    return getFallbackAnalysis(transcript, category);
  }

  // Handle empty or minimal transcript
  if (messages.filter(m => m.role === 'respondent').length < 2) {
    console.warn("Insufficient conversation content for analysis.");
    return {
      suggestedTitle: `${category}に関する短いインタビュー記録`,
      summary: "インタビュー内容が少ないため、詳細な分析ができませんでした。",
      overview: transcript || "会話記録が不足しています。",
      keyInsights: ["インタビュー内容を追加して再分析してください"],
      planningNotes: [],
      executionNotes: [],
      tags: [category, "要追加情報"]
    };
  }

  const prompt = `
あなたは企業のナレッジマネジメント専門家です。
以下のインタビュー記録を分析し、組織内で再利用可能なナレッジ記事を作成してください。

【カテゴリ】${category}

【インタビュー記録】
${transcript}

【分析の目的】
- 業務における暗黙知、ベストプラクティス、失敗からの教訓を明確化
- 意思決定の基準や判断軸を抽出
- 「計画時の注意点」と「実務時の注意点」を区別して整理

【出力形式】
以下のJSON構造に従って出力してください：

{
  "suggestedTitle": "内容を端的に表す具体的なタイトル（20-40文字程度）",
  "summary": "一覧表示用の要約。ポイントを簡潔にまとめる（100-150文字）",
  "overview": "記事の詳細な概要・背景・文脈。どのような場面で役立つ知識かを説明（200-400文字）",
  "keyInsights": [
    "重要なポイント1：具体的で実践的な内容",
    "成功のコツ2：再現可能な形で記述",
    "判断基準3：どのような状況でどう判断すべきか"
  ],
  "planningNotes": [
    "計画・準備段階で確認すべきこと",
    "事前に検討しておくべきリスク"
  ],
  "executionNotes": [
    "実務・実行段階での注意点",
    "トラブル発生時の対処法"
  ],
  "tags": ["関連タグ1", "タグ2", "タグ3"]
}

【注意】
- 各項目は具体的で実践的な内容にしてください
- keyInsightsは3-5個程度
- planningNotesとexecutionNotesはそれぞれ2-4個程度
- tagsは3-5個程度
`;

  try {
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: MODEL_NAME,
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
          },
          temperature: 0.5, // Lower temperature for more consistent analysis
          maxOutputTokens: 2000,
        }
      });
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI");
    }
    
    const jsonStr = cleanJsonOutput(text);
    const result = JSON.parse(jsonStr) as AIAnalysisResult;

    // Validate and sanitize result
    return {
      suggestedTitle: result.suggestedTitle || `${category}に関するナレッジ`,
      summary: result.summary || "要約を生成できませんでした。",
      overview: result.overview || result.summary || "概要を生成できませんでした。",
      keyInsights: Array.isArray(result.keyInsights) && result.keyInsights.length > 0 
        ? result.keyInsights 
        : ["分析結果を確認してください"],
      planningNotes: Array.isArray(result.planningNotes) ? result.planningNotes : [],
      executionNotes: Array.isArray(result.executionNotes) ? result.executionNotes : [],
      tags: Array.isArray(result.tags) && result.tags.length > 0 
        ? result.tags 
        : [category]
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    
    // Return fallback to ensure session data is not lost
    return getFallbackAnalysis(transcript, category);
  }
};

/**
 * Check if AI service is available
 */
export const isAIAvailable = (): boolean => {
  return !!ai;
};

/**
 * Get AI service status for display
 */
export const getAIStatus = (): { available: boolean; message: string } => {
  if (!apiKey) {
    return { 
      available: false, 
      message: "APIキーが設定されていません。環境変数 GEMINI_API_KEY を設定してください。" 
    };
  }
  return { 
    available: true, 
    message: `Gemini ${MODEL_NAME} に接続中` 
  };
};
