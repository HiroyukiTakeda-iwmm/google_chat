import React, { useMemo } from 'react';
import { KnowledgeArticle, InterviewSession } from '../types';
import { FileText, Users, Mic, Tag, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from './Button';

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

  const chartColors = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-accent-500" />
            <span className="text-sm font-medium text-accent-600">Welcome back</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ナレッジダッシュボード</h1>
          <p className="text-gray-500 mt-1">組織の暗黙知を可視化・管理</p>
        </div>
        <Button
          onClick={onStartSession}
          variant="gradient"
          size="lg"
          className="group"
        >
          <Mic className="w-5 h-5" />
          新規インタビュー開始
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/40 shadow-lg hover-lift group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">ナレッジ記事数</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.totalArticles}</h3>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-brand-600">
            <TrendingUp className="w-4 h-4" />
            <span>継続的に成長中</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/40 shadow-lg hover-lift group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl shadow-lg shadow-accent-500/30 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">完了セッション</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.completedSessions}</h3>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-accent-600">
            <Sparkles className="w-4 h-4" />
            <span>AIによる自動分析済み</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/40 shadow-lg hover-lift group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">トップカテゴリ</p>
              <h3 className="text-2xl font-bold text-gray-900 truncate">{stats.topTags[0]?.name || 'なし'}</h3>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-emerald-600">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>最も活発なトピック</span>
          </div>
        </div>
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/40 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">トピック別ナレッジ分布</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">過去全期間</span>
          </div>
          <div className="h-64">
            {stats.topTags.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topTags} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(15, 118, 110, 0.05)' }}
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      padding: '12px 16px'
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {stats.topTags.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Tag className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">データがありません</p>
                <p className="text-xs mt-1">インタビューを開始してナレッジを蓄積しましょう</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Articles Section */}
        <div className="glass rounded-2xl p-6 border border-white/40 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">最近の記事</h3>
            <span className="text-xs text-accent-600 font-medium cursor-pointer hover:underline">すべて表示</span>
          </div>
          <div className="space-y-3">
            {articles.slice(0, 4).map((article, index) => (
              <div 
                key={article.id} 
                className="p-4 bg-white/60 hover:bg-white rounded-xl transition-all cursor-pointer border border-transparent hover:border-brand-200 hover:shadow-md group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h4 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-brand-700 transition-colors">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full font-medium">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(article.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            ))}
            {articles.length === 0 && (
              <div className="py-8 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">記事はまだありません</p>
                <p className="text-xs text-gray-400 mt-1">インタビューを開始してナレッジを作成しましょう</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Tips Section */}
      <div className="glass rounded-2xl p-6 border border-white/40 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">💡 効果的なインタビューのコツ</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              「なぜそう判断したのですか？」「具体的にはどのような状況でしたか？」など、
              具体的なエピソードを引き出す質問を心がけると、より質の高いナレッジが生成されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
