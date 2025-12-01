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
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">設定</h2>
                <div className="max-w-md space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">AI プロバイダー</label>
                        <select className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 cursor-not-allowed" disabled>
                            <option>Google Gemini (現在)</option>
                            <option>ローカルLLM (Coming Soon)</option>
                        </select>
                        {process.env.API_KEY ? (
                           <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                             <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                             環境変数 API_KEY が検出されました。Gemini 2.5 Flash が有効です。
                           </p>
                        ) : (
                           <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                             <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                             API_KEY が未検出です。AI機能は制限されます（フォールバックモード）。
                           </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">データ保存先</label>
                         <div className="flex items-center gap-2 p-3 border border-green-200 bg-green-50 rounded-md">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-green-800">ローカルブラウザストレージ (有効)</span>
                         </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            バージョン 0.1.2 (Stable) <br/>
                            ローカルデプロイ向けに最適化済み
                        </p>
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