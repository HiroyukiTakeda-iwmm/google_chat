import React, { useMemo } from 'react';
import { KnowledgeArticle, InterviewSession } from '../types';
import { FileText, Users, Mic, Tag, TrendingUp, Clock, ArrowRight, Sparkles } from 'lucide-react';
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

    // Calculate recent activity (articles created in last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentArticles = articles.filter(a => a.createdAt > weekAgo).length;

    return { totalArticles, completedSessions, topTags, recentArticles };
  }, [articles, sessions]);

  const chartColors = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">ダッシュボード</h1>
          <p className="text-slate-500 mt-1">暗黙知の収集状況を一目で把握</p>
        </div>
        <button
          onClick={onStartSession}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-5 py-3 rounded-xl shadow-lg shadow-primary-500/25 flex items-center gap-2 transition-all hover:-translate-y-0.5 group"
        >
          <Mic className="w-5 h-5" />
          新規インタビュー開始
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">ナレッジ記事数</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.totalArticles}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/25">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">完了セッション</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.completedSessions}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/25">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">今週の新規</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.recentArticles}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/25">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">トップカテゴリ</p>
              <h3 className="text-xl font-bold text-slate-900 truncate max-w-[120px]">
                {stats.topTags[0]?.name || 'なし'}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">トピック別ナレッジ分布</h3>
            {stats.topTags.length > 0 && (
              <span className="text-xs text-slate-400">{stats.topTags.length}カテゴリ</span>
            )}
          </div>
          {stats.topTags.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topTags} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number) => [`${value}件`, 'ナレッジ数']}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {stats.topTags.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Tag className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">データがありません</p>
              <p className="text-xs mt-1">インタビューを開始してナレッジを蓄積しましょう</p>
            </div>
          )}
        </div>
        
        {/* Recent Articles */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">最近の記事</h3>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {articles.slice(0, 4).map((article, index) => (
              <div 
                key={article.id} 
                className="p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 cursor-pointer group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h4 className="font-medium text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                    {article.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(article.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            ))}
            {articles.length === 0 && (
              <div className="py-8 text-center">
                <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500">記事はまだありません</p>
                <p className="text-xs text-slate-400 mt-1">インタビューを開始しましょう</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 p-6 rounded-2xl border border-primary-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Sparkles className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-primary-900 mb-1">ナレッジ蓄積のヒント</h3>
            <p className="text-sm text-primary-700 leading-relaxed">
              インタビューでは「具体的なエピソード」「失敗からの学び」「判断の基準」を聞くことで、
              より価値の高いナレッジを抽出できます。AIインタビュアーモードを使うと、一人でも効率的にナレッジを蓄積できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
