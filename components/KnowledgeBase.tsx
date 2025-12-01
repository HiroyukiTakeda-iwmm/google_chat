import React, { useState } from 'react';
import { KnowledgeArticle } from '../types';
import { deleteArticle } from '../services/storageService';
import { generateArticlePdf, printArticle } from '../services/pdfService';
import { Search, Tag, Calendar, User, ChevronLeft, BookOpen, Layers, Lightbulb, MessageSquare, AlertTriangle, ClipboardList, CheckCircle2, FileDown, Trash2, Printer, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface Props {
  articles: KnowledgeArticle[];
  onArticleUpdate?: () => void;
}

export const KnowledgeBase: React.FC<Props> = ({ articles, onArticleUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
    article.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (selectedArticle) {
      deleteArticle(selectedArticle.id);
      setShowDeleteModal(false);
      setSelectedArticle(null);
      if (onArticleUpdate) {
        onArticleUpdate();
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedArticle) return;
    setIsGeneratingPdf(true);

    try {
      await generateArticlePdf(selectedArticle);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      const usePrint = confirm('PDF生成中にエラーが発生しました。\nブラウザの印刷機能でPDFを作成しますか？');
      if (usePrint) {
        printArticle(selectedArticle);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!selectedArticle) return;
    printArticle(selectedArticle);
  };

  // --- Detail View ---
  if (selectedArticle) {
    return (
      <div className="glass rounded-2xl shadow-xl border border-white/40 h-[calc(100vh-120px)] overflow-hidden flex flex-col animate-slide-in-right">
        {/* Article Header */}
        <div className="border-b border-gray-100/50 p-6 bg-gradient-to-r from-brand-50/50 to-accent-50/50 flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
            <button 
              onClick={() => setSelectedArticle(null)}
              className="group flex items-center gap-1 text-sm text-gray-500 hover:text-brand-700 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
              ナレッジ一覧に戻る
            </button>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDeleteModal(true)}
                className="text-red-500 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                印刷
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    PDF
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-xs font-bold rounded-full tracking-wide uppercase shadow-sm">
              {selectedArticle.category}
            </span>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 
              {new Date(selectedArticle.createdAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
            {selectedArticle.title}
          </h1>
          
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-600 bg-white/80 inline-flex px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
            <User className="w-4 h-4 text-brand-500" />
            <span className="font-medium">Expert: {selectedArticle.author}</span>
          </div>
        </div>

        {/* Article Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-10">
            
            {/* Overview Section */}
            <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-brand-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-brand-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">概要・背景</h2>
              </div>
              <div className="p-6 bg-gradient-to-br from-gray-50 to-brand-50/30 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed text-base whitespace-pre-wrap">
                {selectedArticle.overview || selectedArticle.summary}
              </div>
            </section>

            {/* Key Insights Section */}
            <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-emerald-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">ポイント・成功の鍵</h2>
              </div>
              <div className="space-y-3">
                {selectedArticle.keyInsights.map((insight, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 shadow-sm hover-lift">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 font-medium pt-1">{insight}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Planning & Execution Notes */}
            <div className="grid md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
              {/* Planning Notes */}
              {selectedArticle.planningNotes && selectedArticle.planningNotes.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ClipboardList className="w-5 h-5 text-blue-700" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">計画時の注意点</h2>
                  </div>
                  <ul className="space-y-2">
                    {selectedArticle.planningNotes.map((note, idx) => (
                      <li key={idx} className="flex gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-gray-600 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Execution Notes */}
              {selectedArticle.executionNotes && selectedArticle.executionNotes.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-700" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">実務時の注意点</h2>
                  </div>
                  <ul className="space-y-2">
                    {selectedArticle.executionNotes.map((note, idx) => (
                      <li key={idx} className="flex gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-gray-600 text-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Tags */}
            <section className="flex flex-wrap gap-2 pt-6 border-t border-gray-100 animate-slide-up" style={{ animationDelay: '400ms' }}>
              {selectedArticle.tags.map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 rounded-full text-sm font-medium flex items-center gap-1.5 hover:from-brand-100 hover:to-brand-50 hover:text-brand-700 transition-all cursor-pointer">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </section>

            {/* Transcript */}
            {selectedArticle.fullTranscript && selectedArticle.fullTranscript.length > 0 && (
              <section className="pt-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">元インタビューの記録</h3>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                  {selectedArticle.fullTranscript
                    .filter(m => m.role === 'interviewer' || m.role === 'respondent')
                    .map(msg => (
                      <div key={msg.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                            msg.role === 'interviewer' 
                              ? 'bg-brand-100 text-brand-700' 
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {msg.role === 'interviewer' ? '質問' : '回答'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed pl-2 border-l-2 border-gray-200 ml-1 py-1 pr-4 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Delete Modal */}
        <Modal 
          isOpen={showDeleteModal} 
          onClose={() => setShowDeleteModal(false)}
          title="記事を削除しますか？"
          footer={
            <>
              <Button variant="danger" onClick={handleDelete}>
                削除する
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                キャンセル
              </Button>
            </>
          }
        >
          <div className="text-gray-600">
            <p>この操作は取り消せません。</p>
            <p className="mt-2 font-medium text-gray-800">「{selectedArticle.title}」</p>
            <p className="mt-2">を完全に削除してもよろしいですか？</p>
          </div>
        </Modal>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-accent-500" />
            <span className="text-sm font-medium text-accent-600">Knowledge Repository</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ナレッジベース</h1>
          <p className="text-gray-500 mt-1">蓄積された組織の暗黙知を検索・閲覧できます</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="キーワード、タグ、内容で検索..."
            className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none shadow-sm transition-all hover:border-gray-300 focus:bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-4 group-focus-within:text-brand-500 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article, index) => {
          const isNew = (Date.now() - article.createdAt) < 60000;
          return (
            <div 
              key={article.id} 
              onClick={() => setSelectedArticle(article)}
              className={`glass rounded-2xl border border-white/40 shadow-lg hover-lift cursor-pointer group flex flex-col h-full overflow-hidden ${
                isNew ? 'ring-2 ring-brand-400 ring-offset-2' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-6 flex flex-col h-full relative">
                {isNew && (
                  <span className="absolute top-4 right-4 px-2.5 py-1 bg-gradient-to-r from-brand-500 to-accent-500 text-white text-[10px] font-bold rounded-full shadow-lg animate-pulse">
                    NEW
                  </span>
                )}
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                    {article.category}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed flex-1">
                  {article.summary}
                </p>
                
                <div className="mt-auto pt-4 border-t border-gray-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {article.author.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-500 font-medium truncate max-w-[100px]">{article.author}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(article.createdAt).toLocaleDateString('ja-JP')}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredArticles.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 glass rounded-2xl border-2 border-dashed border-gray-200">
            <Layers className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">記事が見つかりません</h3>
            <p className="text-gray-500 mt-1">検索条件を変更するか、新しいインタビューを開始してください。</p>
          </div>
        )}
      </div>
    </div>
  );
};
