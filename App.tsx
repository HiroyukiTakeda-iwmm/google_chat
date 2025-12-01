import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InterviewSession } from './components/InterviewSession';
import { KnowledgeBase } from './components/KnowledgeBase';
import { initializeStorage, getSessions, getArticles } from './services/storageService';
import { isAIAvailable, getAIStatus } from './services/geminiService';
import { InterviewSession as SessionType, KnowledgeArticle } from './types';
import { Settings, Database, Sparkles, Shield, Info, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
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

  const aiStatus = getAIStatus();

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
          <InterviewSession onBack={handleSessionComplete} />
        );
      case 'knowledge':
        return <KnowledgeBase articles={articles} onArticleUpdate={handleArticleUpdate} />;
      case 'settings':
        return (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">設定</h1>
              <p className="text-slate-500 mt-1">システムの設定と情報</p>
            </div>

            {/* AI Provider Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-xl">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">AI プロバイダー</h2>
                    <p className="text-sm text-slate-500">インタビューと分析に使用するAIサービス</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">プロバイダー</label>
                  <select 
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    defaultValue="gemini"
                  >
                    <option value="gemini">Google Gemini 2.5 Flash</option>
                    <option value="local" disabled>ローカルLLM (Coming Soon)</option>
                  </select>
                </div>
                
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  aiStatus.available 
                    ? 'bg-green-50 border border-green-100' 
                    : 'bg-amber-50 border border-amber-100'
                }`}>
                  {aiStatus.available ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      aiStatus.available ? 'text-green-800' : 'text-amber-800'
                    }`}>
                      {aiStatus.available ? 'AI接続済み' : 'AI未接続'}
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      aiStatus.available ? 'text-green-700' : 'text-amber-700'
                    }`}>
                      {aiStatus.message}
                    </p>
                  </div>
                </div>

                {!aiStatus.available && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">
                      <strong>APIキーの設定方法:</strong>
                    </p>
                    <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                      <li>プロジェクトルートに <code className="bg-slate-200 px-1 rounded">.env.local</code> ファイルを作成</li>
                      <li><code className="bg-slate-200 px-1 rounded">GEMINI_API_KEY=your_api_key</code> を追加</li>
                      <li>開発サーバーを再起動</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Storage Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">データ保存</h2>
                    <p className="text-sm text-slate-500">ナレッジとセッションの保存先</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-green-800">ローカルブラウザストレージ (有効)</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      データはこのブラウザのローカルストレージに保存されます
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Info className="w-4 h-4" />
                    <span className="font-medium">保存済みデータ</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">ナレッジ記事:</span>
                      <span className="ml-2 font-bold text-slate-900">{articles.length}件</span>
                    </div>
                    <div>
                      <span className="text-slate-500">セッション:</span>
                      <span className="ml-2 font-bold text-slate-900">{sessions.length}件</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">プライバシー & セキュリティ</h2>
                    <p className="text-sm text-slate-500">データの取り扱いについて</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>すべてのデータはローカルに保存され、外部サーバーに自動送信されません</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>AI分析時のみ、会話内容がGemini APIに送信されます（暗号化通信）</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>ブラウザデータを削除するとすべてのナレッジが消去されます</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* About */}
            <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl border border-primary-100 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Database className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-primary-900">K-Sync 暗黙知抽出システム</h3>
                  <p className="text-sm text-primary-700 mt-1">
                    バージョン 1.0.0 (Stable)
                  </p>
                  <p className="text-xs text-primary-600 mt-2">
                    AIを活用して組織の暗黙知を形式知に変換し、ナレッジベースとして蓄積・共有するシステムです。
                  </p>
                  <a 
                    href="https://ai.google.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 mt-3 font-medium"
                  >
                    Powered by Google Gemini <ExternalLink className="w-3 h-3" />
                  </a>
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
