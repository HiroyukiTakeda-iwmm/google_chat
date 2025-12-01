import React, { useMemo } from 'react';
import { KnowledgeArticle, InterviewSession } from '../types';
import { FileText, Users, Mic, Tag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  articles: KnowledgeArticle[];
  sessions: InterviewSession[];
  onStartSession: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ articles, sessions, onStartSession }) => {
  const stats = useMemo(() => {
    const totalArticles = articles.length;
    const completedSessions = sessions.filter(s => s.status === 'Completed').length;
    const tagCounts: Record<string, number> = {};
    
    articles.forEach(article => {
      article.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return { totalArticles, completedSessions, topTags };
  }, [articles, sessions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ナレッジダッシュボード</h1>
          <p className="text-gray-500 mt-1">暗黙知の収集状況の概要</p>
        </div>
        <button
          onClick={onStartSession}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-all"
        >
          <Mic className="w-4 h-4" />
          新規インタビュー開始
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">ナレッジ記事数</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalArticles}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">完了セッション</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.completedSessions}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Tag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">トップカテゴリ</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.topTags[0]?.name || 'なし'}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">トピック別ナレッジ分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topTags} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                    {stats.topTags.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'][index % 5]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近の記事</h3>
          <div className="space-y-4">
            {articles.slice(0, 4).map(article => (
              <div key={article.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                <h4 className="font-medium text-gray-900 line-clamp-1">{article.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{article.category}</span>
                  <span className="text-xs text-gray-400">{new Date(article.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {articles.length === 0 && <p className="text-sm text-gray-500">記事はまだありません。</p>}
          </div>
        </div>
      </div>
    </div>
  );
};