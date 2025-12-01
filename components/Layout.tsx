import React from 'react';
import { LayoutDashboard, Database, Settings, Mic, BookOpen, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'interview', label: 'インタビュー', icon: Mic },
    { id: 'knowledge', label: 'ナレッジベース', icon: BookOpen },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  return (
    <div className="min-h-screen gradient-bg flex text-gray-900">
      {/* Sidebar */}
      <aside className="w-72 glass border-r border-white/20 fixed h-full z-10 hidden md:flex flex-col shadow-xl">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 animate-float">
              <Database className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight gradient-text">K-Sync</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Sparkles className="w-3 h-3 text-accent-500" />
                暗黙知抽出システム
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-500/25'
                    : 'text-gray-600 hover:bg-white/60 hover:text-brand-700 hover:shadow-sm'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand-600'
                }`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-100/50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 hover:bg-white/80 transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:shadow-lg transition-shadow">
              山
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">山田 花子</p>
              <p className="text-xs text-gray-500 truncate">ナレッジ管理者</p>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Version Info */}
        <div className="px-6 py-3 text-center border-t border-gray-100/30">
          <p className="text-[10px] text-gray-400 tracking-wide">
            K-Sync v1.0.0 • Powered by Gemini
          </p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 glass border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-accent-500 rounded-lg flex items-center justify-center">
              <Database className="text-white w-4 h-4" />
            </div>
            <span className="font-bold gradient-text">K-Sync</span>
          </div>
          <div className="flex gap-2">
            {navItems.slice(0, 3).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`p-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-500 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-6 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};
