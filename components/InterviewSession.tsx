import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InterviewSession as SessionType, Message, SessionStatus, SessionMode, AIAnalysisResult } from '../types';
import { generateFollowUpSuggestions, analyzeSession, generateNextQuestion, isAIAvailable } from '../services/geminiService';
import { saveSession, saveArticle } from '../services/storageService';
import { 
  Send, Mic, Sparkles, Brain, CheckCircle, Save, User, Bot, 
  ArrowRight, Settings2, Loader2, AlertTriangle, MessageCircle,
  Clock, Hash, Zap
} from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface Props {
  onBack: () => void;
  initialSession?: SessionType;
}

// Progress steps for the finishing process
const PROGRESS_STEPS = [
  { id: 1, label: 'インタビュー内容を分析中', icon: Brain },
  { id: 2, label: '重要ポイントを抽出中', icon: Sparkles },
  { id: 3, label: 'ナレッジ記事を生成中', icon: MessageCircle },
  { id: 4, label: '保存中', icon: Save },
];

export const InterviewSession: React.FC<Props> = ({ onBack, initialSession }) => {
  // Step: 'setup' | 'chat'
  const [step, setStep] = useState<'setup' | 'chat'>(initialSession ? 'chat' : 'setup');
  
  // Setup State
  const [setupData, setSetupData] = useState({
    title: '',
    interviewee: '',
    category: '',
    mode: 'ai_interviewer' as SessionMode
  });
  const [setupErrors, setSetupErrors] = useState<Record<string, string>>({});

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
  const [isTyping, setIsTyping] = useState(false);
  
  // Modals State
  const [showEndModal, setShowEndModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishingStep, setFinishingStep] = useState(0);
  const [finishError, setFinishError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isTyping, scrollToBottom]);

  // Focus input when step changes to chat
  useEffect(() => {
    if (step === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  // Validate setup form
  const validateSetup = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!setupData.category.trim()) {
      errors.category = 'トピックを入力してください';
    }
    if (!setupData.title.trim()) {
      errors.title = 'セッションタイトルを入力してください';
    }
    if (!setupData.interviewee.trim()) {
      errors.interviewee = 'インタビュイーの名前を入力してください';
    }
    
    setSetupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const startSession = async () => {
    if (!validateSetup()) return;

    const newSession: SessionType = {
      id: crypto.randomUUID(),
      title: setupData.title.trim(),
      interviewee: setupData.interviewee.trim(),
      interviewer: setupData.mode === 'ai_interviewer' ? 'AI インタビュアー' : '記録者',
      category: setupData.category.trim(),
      status: SessionStatus.IN_PROGRESS,
      mode: setupData.mode,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (setupData.mode === 'ai_interviewer') {
      setIsTyping(true);
      
      const initialMsg: Message = {
        id: crypto.randomUUID(),
        role: 'interviewer',
        content: `こんにちは、${setupData.interviewee}さん。本日は「${setupData.category}」についてお話を伺います。\n\nまずは、このトピックに関して、あなたが普段最も意識していること、または印象に残っている経験から教えていただけますか？`,
        timestamp: Date.now()
      };
      newSession.messages = [initialMsg];
      setIsTyping(false);
    } else {
      newSession.messages = [{
        id: crypto.randomUUID(),
        role: 'system',
        content: 'インタビュー記録を開始しました。会話内容を入力してください。',
        timestamp: Date.now()
      }];
    }

    setSession(newSession);
    saveSession(newSession);
    setStep('chat');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping || isFinishing) return;

    const role = session.mode === 'ai_interviewer' ? 'respondent' : 'interviewer';

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: role,
      content: inputText.trim(),
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

    if (session.mode === 'ai_interviewer') {
      setIsTyping(true);
      try {
        const nextQuestion = await generateNextQuestion(updatedMessages, session.category, session.interviewee);
        
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'interviewer',
          content: nextQuestion,
          timestamp: Date.now()
        };
        
        const nextMessages = [...updatedMessages, aiMessage];
        const nextSession = { ...updatedSession, messages: nextMessages };
        setSession(nextSession);
        saveSession(nextSession);
      } catch (error) {
        console.error('Failed to generate next question:', error);
      } finally {
        setIsTyping(false);
      }
    } else {
      setIsProcessingAI(true);
      try {
        const newSuggestions = await generateFollowUpSuggestions(updatedMessages, session.category);
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Failed to generate suggestions:', error);
      } finally {
        setIsProcessingAI(false);
      }
    }
  };

  const handleManualRespondentReply = async (text: string) => {
    if (!text.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'respondent',
      content: text.trim(),
      timestamp: Date.now()
    };
    
    const updatedMessages = [...session.messages, newMessage];
    const updatedSession = { ...session, messages: updatedMessages, updatedAt: Date.now() };
    setSession(updatedSession);
    saveSession(updatedSession);

    setIsProcessingAI(true);
    try {
      const newSuggestions = await generateFollowUpSuggestions(updatedMessages, session.category);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const executeEndSession = async () => {
    setShowEndModal(false);
    setIsFinishing(true);
    setFinishError(null);
    setFinishingStep(1);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setFinishingStep(2);

      await new Promise(resolve => setTimeout(resolve, 600));
      
      const result = await analyzeSession(session.messages, session.category);
      
      setFinishingStep(3);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const finalResult: AIAnalysisResult = result || {
        suggestedTitle: session.title,
        summary: "分析に失敗しました",
        overview: "分析に失敗しました",
        keyInsights: [],
        planningNotes: [],
        executionNotes: [],
        tags: ["Error"],
      };

      const article = {
        id: crypto.randomUUID(),
        title: finalResult.suggestedTitle,
        summary: finalResult.summary,
        overview: finalResult.overview || finalResult.summary,
        keyInsights: finalResult.keyInsights,
        planningNotes: finalResult.planningNotes || [],
        executionNotes: finalResult.executionNotes || [],
        tags: finalResult.tags,
        fullTranscript: session.messages,
        createdAt: Date.now(),
        author: session.interviewee,
        category: session.category
      };
      
      saveArticle(article);
      
      setFinishingStep(4);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const finalSession = { ...session, status: SessionStatus.COMPLETED };
      saveSession(finalSession);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      onBack();
      
    } catch (error) {
      console.error("End Session Error:", error);
      setFinishError("保存中に予期せぬエラーが発生しました。再度お試しください。");
    }
  };

  // Calculate conversation stats
  const conversationStats = {
    totalMessages: session.messages.filter(m => m.role !== 'system').length,
    respondentMessages: session.messages.filter(m => m.role === 'respondent').length,
    duration: session.messages.length > 0 
      ? Math.round((Date.now() - session.messages[0].timestamp) / 60000) 
      : 0
  };

  // --- Render Setup Screen ---
  if (step === 'setup') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4">
              <Mic className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold">新しいインタビューを開始</h2>
            <p className="text-primary-100 mt-2">暗黙知を形式知へ変換します</p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            {/* API Warning */}
            {!isAIAvailable() && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">AI機能が制限されています</p>
                  <p className="text-xs text-amber-700 mt-1">
                    APIキーが設定されていないため、AI質問生成が利用できません。
                    手動モードをお勧めします。
                  </p>
                </div>
              </div>
            )}

            {/* Category/Topic */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ナレッジのトピック・テーマ <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 rounded-xl border ${
                  setupErrors.category ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-primary-500'
                } focus:ring-2 focus:border-transparent outline-none transition-all`}
                placeholder="例: トラブルシューティング、新規開拓営業のコツ..."
                value={setupData.category}
                onChange={e => {
                  setSetupData({...setupData, category: e.target.value});
                  if (setupErrors.category) setSetupErrors({...setupErrors, category: ''});
                }}
              />
              {setupErrors.category && (
                <p className="text-red-500 text-xs mt-1">{setupErrors.category}</p>
              )}
            </div>

            {/* Session Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                セッションタイトル <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 rounded-xl border ${
                  setupErrors.title ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-primary-500'
                } focus:ring-2 focus:border-transparent outline-none transition-all`}
                placeholder="例: 2024年度 障害対応振り返り"
                value={setupData.title}
                onChange={e => {
                  setSetupData({...setupData, title: e.target.value});
                  if (setupErrors.title) setSetupErrors({...setupErrors, title: ''});
                }}
              />
              {setupErrors.title && (
                <p className="text-red-500 text-xs mt-1">{setupErrors.title}</p>
              )}
            </div>

            {/* Interviewee */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                インタビュイー（回答者名） <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 rounded-xl border ${
                  setupErrors.interviewee ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-primary-500'
                } focus:ring-2 focus:border-transparent outline-none transition-all`}
                placeholder="氏名を入力"
                value={setupData.interviewee}
                onChange={e => {
                  setSetupData({...setupData, interviewee: e.target.value});
                  if (setupErrors.interviewee) setSetupErrors({...setupErrors, interviewee: ''});
                }}
              />
              {setupErrors.interviewee && (
                <p className="text-red-500 text-xs mt-1">{setupErrors.interviewee}</p>
              )}
            </div>

            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">インタビューモード</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setSetupData({...setupData, mode: 'ai_interviewer'})}
                  className={`p-5 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                    setupData.mode === 'ai_interviewer' 
                      ? 'border-primary-600 bg-primary-50' 
                      : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      setupData.mode === 'ai_interviewer' ? 'bg-primary-100' : 'bg-slate-100'
                    }`}>
                      <Bot className={`w-5 h-5 ${
                        setupData.mode === 'ai_interviewer' ? 'text-primary-600' : 'text-slate-400'
                      }`} />
                    </div>
                    <span className={`font-bold ${
                      setupData.mode === 'ai_interviewer' ? 'text-primary-900' : 'text-slate-700'
                    }`}>
                      AI インタビュアー
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    AIがあなたに質問します。一人でナレッジを作成する場合に最適です。
                  </p>
                  {setupData.mode === 'ai_interviewer' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                </button>

                <button 
                  onClick={() => setSetupData({...setupData, mode: 'manual_recording'})}
                  className={`p-5 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                    setupData.mode === 'manual_recording' 
                      ? 'border-primary-600 bg-primary-50' 
                      : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      setupData.mode === 'manual_recording' ? 'bg-primary-100' : 'bg-slate-100'
                    }`}>
                      <User className={`w-5 h-5 ${
                        setupData.mode === 'manual_recording' ? 'text-primary-600' : 'text-slate-400'
                      }`} />
                    </div>
                    <span className={`font-bold ${
                      setupData.mode === 'manual_recording' ? 'text-primary-900' : 'text-slate-700'
                    }`}>
                      手動記録モード
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    人間同士のインタビューを記録・文字起こしする場合に使用します。
                  </p>
                  {setupData.mode === 'manual_recording' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <Button 
              onClick={startSession} 
              size="lg" 
              className="w-full py-4 text-lg shadow-lg shadow-primary-500/20"
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
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-slate-50">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shadow-sm ${
                session.mode === 'ai_interviewer' 
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' 
                  : 'bg-gradient-to-br from-green-500 to-green-600 text-white'
              }`}>
                {session.mode === 'ai_interviewer' ? <Bot className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 leading-tight">{session.title}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-medium">{session.category}</span>
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
                disabled={isFinishing || isTyping || conversationStats.respondentMessages < 1}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                終了＆ナレッジ生成
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-50 to-white">
            {session.messages.map((msg) => {
              const isInterviewer = msg.role === 'interviewer';
              const isSystem = msg.role === 'system';
              
              if (isSystem) return (
                <div key={msg.id} className="flex justify-center my-4">
                  <span className="bg-slate-200 text-slate-600 text-xs px-4 py-1.5 rounded-full shadow-sm font-medium">
                    {msg.content}
                  </span>
                </div>
              );

              return (
                <div key={msg.id} className={`flex gap-4 ${isInterviewer ? 'flex-row' : 'flex-row-reverse'} animate-fade-in`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                    isInterviewer 
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' 
                      : 'bg-gradient-to-br from-slate-600 to-slate-700 text-white'
                  }`}>
                    {isInterviewer ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>

                  {/* Bubble */}
                  <div className="max-w-[75%] space-y-1">
                    <div className={`flex items-center gap-2 mb-1 ${isInterviewer ? 'justify-start' : 'justify-end'}`}>
                      <span className="text-xs font-bold text-slate-400">
                        {isInterviewer ? (session.mode === 'ai_interviewer' ? 'AI インタビュアー' : '記録者') : session.interviewee}
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {new Date(msg.timestamp).toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className={`p-5 rounded-2xl shadow-sm leading-relaxed whitespace-pre-wrap ${
                      isInterviewer 
                        ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-none' 
                        : 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-tr-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex gap-4 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                  </div>
                  <span className="text-xs text-slate-400 ml-2">考え中...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)]">
            {/* Manual Mode Respondent Input */}
            {session.mode === 'manual_recording' && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-center">
                <Settings2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="インタビュイーの発言を入力してEnter..." 
                  className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleManualRespondentReply(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={session.mode === 'ai_interviewer' ? "回答を入力してください..." : "インタビュアーとしての質問を入力..."}
                  className="w-full border border-slate-200 rounded-xl pl-4 pr-12 py-3.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-all"
                  autoFocus
                  disabled={isTyping || isFinishing}
                />
                <div className="absolute right-3 bottom-3.5 text-slate-400">
                  {session.mode === 'ai_interviewer' ? <User className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </div>
              </div>
              <Button 
                type="submit" 
                variant="primary" 
                className="h-[50px] w-[50px] rounded-xl shadow-lg shadow-primary-500/20" 
                disabled={!inputText.trim() || isTyping || isFinishing}
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 flex flex-col gap-4">
          {/* Stats Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-400" />
              セッション統計
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <div className="text-2xl font-bold text-primary-600">{conversationStats.totalMessages}</div>
                <div className="text-xs text-slate-500">発言数</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <div className="text-2xl font-bold text-primary-600">{conversationStats.duration}</div>
                <div className="text-xs text-slate-500">経過時間(分)</div>
              </div>
            </div>
          </div>

          {session.mode === 'ai_interviewer' ? (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex-1">
              <div className="flex items-center gap-2 mb-4 text-primary-700">
                <Brain className="w-5 h-5" />
                <h3 className="font-bold">AI思考プロセス</h3>
              </div>
              <div className="text-sm text-slate-600 space-y-3">
                <p>AIがあなたの回答をリアルタイムで分析しています。</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-slate-500">
                    <Zap className="w-3 h-3 text-amber-500" />
                    キーワード抽出中...
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500">
                    <Zap className="w-3 h-3 text-amber-500" />
                    文脈の整合性を確認中...
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500">
                    <Zap className="w-3 h-3 text-amber-500" />
                    深掘りポイントを探索中...
                  </li>
                </ul>
                <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
                  <h4 className="text-xs font-bold text-primary-900 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> ヒント
                  </h4>
                  <p className="text-xs text-primary-800 leading-relaxed">
                    「具体的には？」と聞かれた際は、実際のエピソードや失敗談を交えると、より質の高いナレッジが生成されます。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex-1">
              <div className="flex items-center gap-2 mb-4 text-green-700">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold">AIサジェスト</h3>
              </div>
              <div className="space-y-3">
                {isProcessingAI ? (
                  <div className="space-y-2">
                    <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((sug, i) => (
                    <button 
                      key={i}
                      onClick={() => setInputText(sug)}
                      className="w-full text-left text-xs p-4 bg-white hover:bg-green-50 rounded-xl border border-slate-200 hover:border-green-200 transition-all text-slate-700 shadow-sm"
                    >
                      <span className="font-bold text-green-600 block mb-1">提案 {i+1}</span>
                      {sug}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    会話が進むと、ここに次の質問の提案が表示されます。
                  </p>
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
          <p className="text-slate-600">
            ここまでの会話内容（{conversationStats.totalMessages}件の発言）から、AIが自動的にナレッジ記事を生成します。
          </p>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              ナレッジ生成には数秒〜数十秒かかる場合があります。完了するまでブラウザを閉じないでください。
            </p>
          </div>
        </div>
      </Modal>

      {/* Processing Overlay */}
      {isFinishing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 backdrop-blur-sm animate-fade-in">
          <div className="text-center max-w-md mx-auto p-8">
            {/* Progress Indicator */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
              <div 
                className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"
                style={{ animationDuration: '1s' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {React.createElement(PROGRESS_STEPS[finishingStep - 1]?.icon || Loader2, {
                  className: "w-8 h-8 text-primary-600"
                })}
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-4">ナレッジを生成中...</h3>
            
            {/* Progress Steps */}
            <div className="space-y-3 text-left mb-6">
              {PROGRESS_STEPS.map((progressStep) => (
                <div 
                  key={progressStep.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    finishingStep === progressStep.id 
                      ? 'bg-primary-50 border border-primary-100' 
                      : finishingStep > progressStep.id
                        ? 'bg-green-50 border border-green-100'
                        : 'bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    finishingStep === progressStep.id 
                      ? 'bg-primary-100 text-primary-600'
                      : finishingStep > progressStep.id
                        ? 'bg-green-100 text-green-600'
                        : 'bg-slate-200 text-slate-400'
                  }`}>
                    {finishingStep > progressStep.id ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : finishingStep === progressStep.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="text-xs font-medium">{progressStep.id}</span>
                    )}
                  </div>
                  <span className={`text-sm ${
                    finishingStep >= progressStep.id ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {progressStep.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Error State */}
            {finishError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                <p className="text-sm text-red-700">{finishError}</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => {
                    setIsFinishing(false);
                    setFinishError(null);
                  }}
                >
                  閉じる
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
