import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InterviewSession } from './components/InterviewSession';
import { KnowledgeBase } from './components/KnowledgeBase';
import { initializeStorage, getSessions, getArticles } from './services/storageService';
import { InterviewSession as SessionType, KnowledgeArticle } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  
  // Only for forcing re-renders when storage changes
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    initializeStorage();
    setSessions(getSessions());
    setArticles(getArticles());
  }, [refreshTrigger, activeTab]);

  const handleStartSession = () => {
    setActiveTab('interview');
  };

  const handleSessionComplete = () => {
      setRefreshTrigger(prev => prev + 1);
      setActiveTab('knowledge');
  };

  const handleArticleUpdate = () => {
    setArticles(getArticles());
    setRefreshTrigger(prev => prev + 1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            articles={articles} 
            sessions={sessions} 
            onStartSession={handleStartSession} 
          />
        );
      case 'interview':
        return (
            // In a real app, we might pass an ID to resume a draft
            <InterviewSession onBack={handleSessionComplete} />
        );
      case 'knowledge':
        return <KnowledgeBase articles={articles} onArticleUpdate={handleArticleUpdate} />;
      case 'settings':
        return (
            <div className="glass rounded-2xl border border-white/40 p-8 shadow-xl animate-slide-up">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">設定</h2>
                        <p className="text-gray-500 text-sm">システムの設定を管理します</p>
                    </div>
                </div>
                
                <div className="max-w-xl space-y-8">
                    <div className="p-6 bg-white/60 rounded-xl border border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">AI プロバイダー</label>
                        <select className="w-full border border-gray-200 rounded-xl shadow-sm p-3 bg-gray-50 cursor-not-allowed focus:ring-2 focus:ring-brand-500" disabled>
                            <option>Google Gemini 2.5 Flash (現在)</option>
                            <option>ローカルLLM (Coming Soon)</option>
                        </select>
                        {process.env.API_KEY ? (
                           <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                             <span className="text-xs text-emerald-700 font-medium">API_KEY が検出されました。Gemini 2.5 Flash が有効です。</span>
                           </div>
                        ) : (
                           <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
                             <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                             <span className="text-xs text-amber-700 font-medium">API_KEY が未検出です。AI機能は制限されます（フォールバックモード）。</span>
                           </div>
                        )}
                    </div>
                    
                    <div className="p-6 bg-white/60 rounded-xl border border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">データ保存先</label>
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-brand-50 to-accent-50 rounded-xl border border-brand-200">
                            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-brand-900">ローカルブラウザストレージ</span>
                                <p className="text-xs text-brand-700">データはお使いのブラウザに安全に保存されます</p>
                            </div>
                            <div className="ml-auto">
                                <span className="px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-full">有効</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">K-Sync</p>
                                <p className="text-xs text-gray-400 mt-1">バージョン 1.0.0 (Stable)</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Powered by</p>
                                <p className="text-sm font-semibold gradient-text">Google Gemini</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
      default:
        return <Dashboard articles={articles} sessions={sessions} onStartSession={handleStartSession} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;