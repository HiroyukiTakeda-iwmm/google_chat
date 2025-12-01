
import React, { useState, useEffect, useRef } from 'react';
import { InterviewSession as SessionType, Message, SessionStatus, SessionMode, AIAnalysisResult } from '../types';
import { generateFollowUpSuggestions, analyzeSession, generateNextQuestion } from '../services/geminiService';
import { saveSession, saveArticle } from '../services/storageService';
import { Send, Mic, StopCircle, Sparkles, Brain, CheckCircle, Save, User, Bot, Play, ArrowRight, Settings2, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface Props {
  onBack: () => void;
  initialSession?: SessionType;
}

export const InterviewSession: React.FC<Props> = ({ onBack, initialSession }) => {
  // ステップ: 'setup' | 'chat'
  const [step, setStep] = useState<'setup' | 'chat'>(initialSession ? 'chat' : 'setup');
  
  // Setup State
  const [setupData, setSetupData] = useState({
    title: '',
    interviewee: '',
    category: '',
    mode: 'ai_interviewer' as SessionMode
  });

  // Session State
  const [session, setSession] = useState<SessionType>(initialSession || {
    id: '',
    title: '',
    interviewee: '',
    interviewer: '',
    category: '',
    status: SessionStatus.DRAFT,
    mode: 'ai_interviewer',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // AI is generating next question
  
  // Modals State
  const [showEndModal, setShowEndModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>(""); // Status text during finishing

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isTyping]);

  const startSession = async () => {
    if (!setupData.title || !setupData.category || !setupData.interviewee) {
      alert("すべての項目を入力してください");
      return;
    }

    const newSession: SessionType = {
      id: crypto.randomUUID(),
      title: setupData.title,
      interviewee: setupData.interviewee,
      interviewer: setupData.mode === 'ai_interviewer' ? 'AI インタビュアー' : '記録者',
      category: setupData.category,
      status: SessionStatus.IN_PROGRESS,
      mode: setupData.mode,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // AIモードの場合、最初の質問を生成
    if (setupData.mode === 'ai_interviewer') {
        setIsTyping(true);
        // Initial greeting
        const initialMsg: Message = {
            id: crypto.randomUUID(),
            role: 'interviewer',
            content: `こんにちは、${setupData.interviewee}さん。「${setupData.category}」についてお話を伺います。まずは、このトピックに関して、あなたが普段最も意識していることから教えていただけますか？`,
            timestamp: Date.now()
        };
        newSession.messages = [initialMsg];
        setIsTyping(false);
    } else {
        // Manual mode welcome
         newSession.messages = [{
            id: crypto.randomUUID(),
            role: 'system',
            content: 'インタビュー記録を開始しました。',
            timestamp: Date.now()
        }];
    }

    setSession(newSession);
    saveSession(newSession);
    setStep('chat');
  };

  // ユーザー（または手動インタビュアー）がメッセージ送信
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    // AIモード: ユーザーは常に「回答者(Respondent)」
    const role = session.mode === 'ai_interviewer' ? 'respondent' : 'interviewer';

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: role,
      content: inputText,
      timestamp: Date.now()
    };

    const updatedMessages = [...session.messages, newMessage];
    const updatedSession = { 
        ...session, 
        messages: updatedMessages, 
        updatedAt: Date.now(),
    };

    setSession(updatedSession);
    saveSession(updatedSession);
    setInputText('');
    setSuggestions([]);

    // AI Interviewer Logic
    if (session.mode === 'ai_interviewer') {
        setIsTyping(true);
        const nextQuestion = await generateNextQuestion(updatedMessages, session.category, session.interviewee);
        
        const aiMessage: Message = {
            id: crypto.randomUUID(),
            role: 'interviewer',
            content: nextQuestion,
            timestamp: Date.now()
        };
        
        const nextMessages = [...updatedMessages, aiMessage];
        setSession(prev => ({ ...prev, messages: nextMessages }));
        saveSession({ ...session, messages: nextMessages });
        setIsTyping(false);
    } else {
        // Manual mode: Generate suggestions for the human interviewer
        setIsProcessingAI(true);
        const newSuggestions = await generateFollowUpSuggestions(updatedMessages, session.category);
        setSuggestions(newSuggestions);
        setIsProcessingAI(false);
    }
  };

  // 手動モード用の回答者入力ハンドラ
  const handleManualRespondentReply = async (text: string) => {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: 'respondent',
        content: text,
        timestamp: Date.now()
      };
      
      const updatedMessages = [...session.messages, newMessage];
      const updatedSession = { ...session, messages: updatedMessages, updatedAt: Date.now() };
      setSession(updatedSession);
      saveSession(updatedSession);

      setIsProcessingAI(true);
      const newSuggestions = await generateFollowUpSuggestions(updatedMessages, session.category);
      setSuggestions(newSuggestions);
      setIsProcessingAI(false);
  };

  // 終了＆保存処理
  const executeEndSession = async () => {
    setShowEndModal(false);
    setIsFinishing(true);
    setProcessingStatus("インタビュー内容を分析中...");

    try {
        await new Promise(resolve => setTimeout(resolve, 800));

        setProcessingStatus("「概要」「ポイント」「注意点」を抽出しています...");
        // ユーザーに処理中であることを伝えるために少し時間を空ける
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const result = await analyzeSession(session.messages, session.category);
        
        setProcessingStatus("ナレッジ記事を生成中...");
        
        const finalResult = result || {
            suggestedTitle: session.title,
            summary: "分析に失敗しました",
            overview: "分析に失敗しました",
            keyInsights: [],
            planningNotes: [],
            executionNotes: [],
            tags: ["Error"],
        } as AIAnalysisResult;

        const article = {
            id: crypto.randomUUID(),
            title: finalResult.suggestedTitle,
            summary: finalResult.summary, // 短くポイントをまとめた要約
            overview: finalResult.overview || finalResult.summary, // 概要（詳細）
            keyInsights: finalResult.keyInsights, // ポイント
            planningNotes: finalResult.planningNotes || [], // 計画時の注意点
            executionNotes: finalResult.executionNotes || [], // 実務時の注意点
            tags: finalResult.tags,
            fullTranscript: session.messages,
            createdAt: Date.now(),
            author: session.interviewee,
            category: session.category
        };
        saveArticle(article);
        
        const finalSession = { ...session, status: SessionStatus.COMPLETED };
        saveSession(finalSession);
        
        setProcessingStatus("完了しました！");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        onBack();
    } catch (error) {
        console.error("End Session Error:", error);
        alert("保存中に予期せぬエラーが発生しました。");
        setIsFinishing(false);
    }
  };

  // --- Render Setup Screen ---
  if (step === 'setup') {
      return (
          <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Mic className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">新しいインタビューを開始</h2>
                      <p className="text-gray-500 mt-2">暗黙知を形式知へ。設定を入力してください。</p>
                  </div>

                  <div className="space-y-6">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ナレッジのトピック・テーマ</label>
                          <input 
                              type="text" 
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                              placeholder="例: トラブルシューティング、新規開拓営業のコツ..."
                              value={setupData.category}
                              onChange={e => setSetupData({...setupData, category: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">セッションタイトル</label>
                          <input 
                              type="text" 
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                              placeholder="例: 2024年度 障害対応振り返り"
                              value={setupData.title}
                              onChange={e => setSetupData({...setupData, title: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">インタビュイー（回答者名）</label>
                          <input 
                              type="text" 
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                              placeholder="氏名を入力"
                              value={setupData.interviewee}
                              onChange={e => setSetupData({...setupData, interviewee: e.target.value})}
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">インタビューモード</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <button 
                                  onClick={() => setSetupData({...setupData, mode: 'ai_interviewer'})}
                                  className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                                      setupData.mode === 'ai_interviewer' 
                                      ? 'border-indigo-600 bg-indigo-50' 
                                      : 'border-gray-200 hover:border-indigo-200'
                                  }`}
                              >
                                  <div className="flex items-center gap-3 mb-2">
                                      <Bot className={`w-5 h-5 ${setupData.mode === 'ai_interviewer' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                      <span className={`font-bold ${setupData.mode === 'ai_interviewer' ? 'text-indigo-900' : 'text-gray-700'}`}>AI インタビュアー</span>
                                  </div>
                                  <p className="text-xs text-gray-500 leading-relaxed">
                                      AIがあなたに質問します。一人でナレッジを作成する場合に最適です。
                                  </p>
                                  {setupData.mode === 'ai_interviewer' && (
                                    <div className="absolute top-2 right-2 text-indigo-600">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                  )}
                              </button>

                              <button 
                                  onClick={() => setSetupData({...setupData, mode: 'manual_recording'})}
                                  className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                                      setupData.mode === 'manual_recording' 
                                      ? 'border-indigo-600 bg-indigo-50' 
                                      : 'border-gray-200 hover:border-indigo-200'
                                  }`}
                              >
                                  <div className="flex items-center gap-3 mb-2">
                                      <User className={`w-5 h-5 ${setupData.mode === 'manual_recording' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                      <span className={`font-bold ${setupData.mode === 'manual_recording' ? 'text-indigo-900' : 'text-gray-700'}`}>手動記録モード</span>
                                  </div>
                                  <p className="text-xs text-gray-500 leading-relaxed">
                                      人間同士のインタビューを記録・文字起こしする場合に使用します。
                                  </p>
                                  {setupData.mode === 'manual_recording' && (
                                    <div className="absolute top-2 right-2 text-indigo-600">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                  )}
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="mt-8">
                      <Button 
                        onClick={startSession} 
                        size="lg" 
                        className="w-full py-4 text-lg shadow-lg shadow-indigo-200"
                      >
                          セッションを開始する <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                  </div>
              </div>
          </div>
      );
  }

  // --- Render Chat Screen ---
  return (
    <>
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${session.mode === 'ai_interviewer' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                {session.mode === 'ai_interviewer' ? <Bot className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <div>
                <h2 className="font-bold text-gray-800 leading-tight">{session.title}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{session.category}</span>
                    <span>•</span>
                    <span>{session.interviewee}</span>
                </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => {
                const updated = {...session, status: SessionStatus.DRAFT};
                saveSession(updated);
                onBack();
            }}>
                <Save className="w-4 h-4 mr-2" />
                一時保存
            </Button>
            <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setShowEndModal(true)} 
                disabled={isFinishing || isTyping || session.messages.length < 2}
            >
                <CheckCircle className="w-4 h-4 mr-2" />
                終了＆ナレッジ生成
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 scroll-smooth">
          {session.messages.map((msg) => {
             const isInterviewer = msg.role === 'interviewer';
             const isSystem = msg.role === 'system';
             
             if (isSystem) return (
                <div key={msg.id} className="flex justify-center my-4">
                    <span className="bg-gray-200 text-gray-600 text-xs px-4 py-1.5 rounded-full shadow-sm">{msg.content}</span>
                </div>
             );

             return (
                <div key={msg.id} className={`flex gap-4 ${isInterviewer ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        isInterviewer 
                        ? 'bg-white border border-gray-200 text-indigo-600' 
                        : 'bg-indigo-600 text-white'
                    }`}>
                        {isInterviewer ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[75%] space-y-1`}>
                        <div className={`flex items-center gap-2 mb-1 ${isInterviewer ? 'justify-start' : 'justify-end'}`}>
                            <span className="text-xs font-bold text-gray-400">
                                {isInterviewer ? (session.mode === 'ai_interviewer' ? 'AI インタビュアー' : '記録者') : session.interviewee}
                            </span>
                            <span className="text-[10px] text-gray-300">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                        <div className={`p-5 rounded-2xl shadow-sm leading-relaxed whitespace-pre-wrap ${
                            isInterviewer 
                            ? 'bg-white text-gray-800 border border-gray-200 rounded-tl-none' 
                            : 'bg-indigo-600 text-white rounded-tr-none'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                </div>
             );
          })}
          
          {/* AI Typing Indicator */}
          {isTyping && (
             <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-white border border-gray-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                     <Bot className="w-6 h-6" />
                 </div>
                 <div className="bg-white border border-gray-200 px-6 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                 </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
             {/* Mode-specific Controls */}
             {session.mode === 'manual_recording' && (
                 <div className="mb-3 p-2 bg-amber-50 border border-amber-100 rounded-lg text-sm flex gap-2 items-center justify-between">
                    <span className="text-amber-800 text-xs font-semibold px-2 flex items-center gap-1">
                        <Settings2 className="w-3 h-3" />
                        手動モード: 相手役の発言入力
                    </span>
                    <div className="flex-1 flex gap-2">
                         <input 
                            type="text" 
                            placeholder="インタビュイーの発言を入力してEnter..." 
                            className="flex-1 bg-white border border-amber-200 rounded px-3 py-1 text-sm focus:outline-none focus:border-amber-400"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    handleManualRespondentReply(e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
             )}

            <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={session.mode === 'ai_interviewer' ? "回答を入力してください..." : "インタビュアーとしての質問を入力..."}
                        className="w-full border border-gray-300 rounded-xl pl-4 pr-12 py-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all shadow-inner"
                        autoFocus
                        disabled={isTyping || isFinishing}
                    />
                    <div className="absolute right-3 bottom-3 text-gray-400">
                        {session.mode === 'ai_interviewer' ? <User className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </div>
                </div>
                <Button type="submit" variant="primary" className="h-[50px] w-[50px] rounded-xl" disabled={!inputText.trim() || isTyping || isFinishing}>
                    <Send className="w-5 h-5" />
                </Button>
            </form>
        </div>
      </div>

      {/* Side Panel (Context/Suggestions) */}
      <div className="w-80 flex flex-col gap-4">
        {session.mode === 'ai_interviewer' ? (
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex-1">
                 <div className="flex items-center gap-2 mb-4 text-indigo-700">
                     <Brain className="w-5 h-5" />
                     <h3 className="font-bold">AI思考プロセス</h3>
                 </div>
                 <div className="text-sm text-gray-600 space-y-3">
                     <p>現在、AIがあなたの回答をリアルタイムで分析しています。</p>
                     <ul className="list-disc pl-5 space-y-1 text-xs text-gray-500">
                         <li>キーワード抽出中...</li>
                         <li>文脈の整合性を確認中...</li>
                         <li>深掘りポイントを探索中...</li>
                     </ul>
                     <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                         <h4 className="text-xs font-bold text-indigo-900 mb-2">💡 ヒント</h4>
                         <p className="text-xs text-indigo-800 leading-relaxed">
                             「具体的には？」「たとえば？」と聞かれた際は、実際のエピソードや失敗談を交えると、より質の高いナレッジが生成されます。
                         </p>
                     </div>
                 </div>
             </div>
        ) : (
            // Manual Mode Suggestions
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex-1">
                <div className="flex items-center gap-2 mb-4 text-green-700">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold">AIサジェスト</h3>
                </div>
                <div className="space-y-3">
                    {isProcessingAI ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-8 bg-gray-100 rounded w-full"></div>
                            <div className="h-8 bg-gray-100 rounded w-full"></div>
                        </div>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((sug, i) => (
                            <button 
                                key={i}
                                onClick={() => setInputText(sug)}
                                className="w-full text-left text-xs p-3 bg-white hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-200 transition-all text-gray-700 shadow-sm"
                            >
                                <span className="font-bold text-green-600 block mb-1">提案 {i+1}</span>
                                {sug}
                            </button>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 italic text-center py-4">会話が進むと、ここに次の質問の提案が表示されます。</p>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>

    {/* End Session Confirmation Modal */}
    <Modal 
      isOpen={showEndModal} 
      onClose={() => setShowEndModal(false)}
      title="インタビューを終了しますか？"
      footer={
        <>
            <Button variant="primary" onClick={executeEndSession}>
                終了してナレッジを生成する
            </Button>
            <Button variant="secondary" onClick={() => setShowEndModal(false)}>
                キャンセル
            </Button>
        </>
      }
    >
        <div className="space-y-4">
            <p className="text-gray-600">
                ここまでの会話内容から、AIが自動的にナレッジ記事（要約・洞察・タグ）を生成します。
            </p>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                    ナレッジ生成には数秒〜数十秒かかる場合があります。完了するまでブラウザを閉じないでください。
                </p>
            </div>
        </div>
    </Modal>

    {/* Processing Overlay */}
    {isFinishing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="text-center max-w-sm mx-auto p-6">
                <div className="relative w-20 h-20 mx-auto mb-8">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-indigo-600 w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">生成中...</h3>
                <p className="text-gray-500 animate-pulse">{processingStatus}</p>
            </div>
        </div>
    )}
    </>
  );
};
