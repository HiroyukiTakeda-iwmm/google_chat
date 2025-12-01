import React, { useState } from 'react';
import { LayoutDashboard, Database, Settings, Mic, BookOpen, Menu, X, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard, description: '全体概要を確認' },
    { id: 'interview', label: 'インタビュー', icon: Mic, description: '新規セッション開始' },
    { id: 'knowledge', label: 'ナレッジベース', icon: BookOpen, description: '蓄積された知識' },
    { id: 'settings', label: '設定', icon: Settings, description: 'システム設定' },
  ];

  const handleNavClick = (id: string) => {
    onTabChange(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-primary-50/30 flex font-sans text-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Database className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">K-Sync</span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-2">暗黙知抽出システム</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed top-0 right-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 shadow-2xl ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 pt-20">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <div>{item.label}</div>
                    <div className="text-xs text-slate-400 font-normal">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white/70 backdrop-blur-xl border-r border-slate-200/80 fixed h-full z-10 hidden md:flex flex-col shadow-xl shadow-slate-200/50">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Database className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">K-Sync</span>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                暗黙知抽出システム
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 shadow-sm border border-primary-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-primary-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Status Card */}
        <div className="p-4">
          <div className="p-4 bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl border border-primary-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-bold text-primary-800">AI ステータス</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${process.env.API_KEY ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs text-slate-600">
                {process.env.API_KEY ? 'Gemini 接続中' : 'API未設定'}
              </span>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-100/80">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary-500/20">
              花
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">山田 花子</p>
              <p className="text-xs text-slate-500 truncate">ナレッジ管理者</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
