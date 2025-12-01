
import React, { useState } from 'react';
import { KnowledgeArticle } from '../types';
import { deleteArticle } from '../services/storageService';
import { Search, Tag, Calendar, User, ChevronLeft, BookOpen, Layers, Lightbulb, MessageSquare, AlertTriangle, ClipboardList, CheckCircle2, FileDown, Trash2 } from 'lucide-react';
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
      // Notify parent to refresh data
      if (onArticleUpdate) {
        onArticleUpdate();
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedArticle) return;
    setIsGeneratingPdf(true); // Switch to Print Mode

    // Wait for the Print View to render fully
    await new Promise(resolve => setTimeout(resolve, 800));

    const element = document.getElementById('print-view-container');
    if (!element) {
        alert("PDF生成エラー: 描画要素が見つかりませんでした。");
        setIsGeneratingPdf(false);
        return;
    }

    const filename = selectedArticle.title.replace(/[^\w\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]+/g, '_').substring(0, 30);
    
    // A4 width in pixels at 96DPI is approx 794px. 
    // We set the container width to 794px exactly and position it at 0,0.
    // We set PDF margins to 0 and handle margins via CSS padding.
    const opt = {
      margin: 0, 
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false, 
          scrollY: 0,
          scrollX: 0,
          windowWidth: 794,
          width: 794,
          x: 0,
          y: 0
      },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }, // Use points for precision
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        // @ts-ignore
        await html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error('PDF Generation Error:', err);
        alert('PDF生成中にエラーが発生しました。');
    } finally {
        setIsGeneratingPdf(false); // Restore Normal View
    }
  };

  // --- Print View Component (Rendered only when generating PDF) ---
  if (isGeneratingPdf && selectedArticle) {
      return (
        <div className="fixed inset-0 z-[9999] bg-gray-100 overflow-hidden">
            {/* 
              This container is what html2pdf captures. 
              Positioned absolute top-left to ensure coordinates (0,0) are respected.
              Width fixed to 794px (A4 @ 96DPI).
            */}
            <div 
                id="print-view-container" 
                className="absolute top-0 left-0 w-[794px] min-h-screen bg-white p-[40px] text-gray-900 shadow-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
            >
                {/* Header */}
                <div className="mb-8 border-b-2 border-gray-800 pb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs uppercase tracking-widest text-gray-500">Knowledge Article</span>
                        <span className="text-xs text-gray-500">{new Date().toLocaleDateString()}</span>
                    </div>
                    <h1 className="text-3xl font-extrabold leading-tight mb-4">{selectedArticle.title}</h1>
                    <div className="flex gap-4 text-sm text-gray-600">
                        <span className="font-bold">Expert: {selectedArticle.author}</span>
                        <span>Category: {selectedArticle.category}</span>
                    </div>
                </div>

                {/* Summary Box */}
                <div className="mb-8 p-6 bg-gray-50 rounded border border-gray-200 break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase text-gray-500 mb-2">要約・概要</h2>
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{selectedArticle.overview || selectedArticle.summary}</p>
                </div>

                {/* Key Insights */}
                <div className="mb-8 break-inside-avoid">
                    <h2 className="text-lg font-bold border-l-4 border-green-600 pl-3 mb-4">重要ポイント</h2>
                    <ul className="space-y-3">
                        {selectedArticle.keyInsights.map((insight, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">{i+1}</span>
                                <span className="text-base font-medium">{insight}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Planning & Execution Grid */}
                <div className="grid grid-cols-1 gap-6 mb-8">
                    {selectedArticle.planningNotes.length > 0 && (
                        <div className="break-inside-avoid">
                            <h2 className="text-lg font-bold border-l-4 border-blue-600 pl-3 mb-4">計画時の注意点</h2>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
                                {selectedArticle.planningNotes.map((note, i) => (
                                    <li key={i}>{note}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {selectedArticle.executionNotes.length > 0 && (
                        <div className="break-inside-avoid">
                            <h2 className="text-lg font-bold border-l-4 border-amber-600 pl-3 mb-4">実務時の注意点</h2>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
                                {selectedArticle.executionNotes.map((note, i) => (
                                    <li key={i}>{note}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Transcript */}
                <div className="mt-8 pt-8 border-t border-gray-200 break-before-page">
                    <h2 className="text-sm font-bold uppercase text-gray-500 mb-6">インタビュー記録</h2>
                    <div className="space-y-4">
                        {selectedArticle.fullTranscript
                            .filter(m => m.role === 'interviewer' || m.role === 'respondent')
                            .map(msg => (
                            <div key={msg.id} className="flex gap-4 break-inside-avoid">
                                <div className="w-20 flex-shrink-0 text-xs font-bold text-gray-500 text-right pt-1">
                                    {msg.role === 'interviewer' ? '質問' : '回答'}
                                </div>
                                <div className="flex-1 pb-4 border-b border-gray-100">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Loading Overlay within Print Mode - Covers the absolute positioned content */}
            <div className="fixed top-0 left-0 w-full h-full bg-white flex flex-col items-center justify-center z-[10000]">
                 <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                 <p className="text-gray-600 font-medium">PDFを作成中...</p>
                 <p className="text-xs text-gray-400 mt-2">レイアウト調整のため画面が一時的に切り替わっています</p>
            </div>
        </div>
      );
  }

  // --- Normal Detail View ---
  if (selectedArticle) {
    return (
        <div 
            className="bg-white rounded-2xl shadow-lg border border-gray-200 h-[calc(100vh-100px)] overflow-hidden flex flex-col animate-in slide-in-from-right-4 duration-300 relative"
        >
            {/* Article Header */}
            <div className="border-b border-gray-100 p-6 bg-slate-50 flex-shrink-0">
                <div className="flex justify-between items-start mb-4">
                    <button 
                        onClick={() => setSelectedArticle(null)}
                        className="group flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
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
                            <Trash2 className="w-4 h-4 mr-2" />
                            削除
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={handleDownloadPdf}
                            className="shadow-sm"
                        >
                            <FileDown className="w-4 h-4 mr-2" />
                            PDFダウンロード
                        </Button>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                     <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full tracking-wide uppercase">
                        {selectedArticle.category}
                     </span>
                     <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(selectedArticle.createdAt).toLocaleDateString()}
                     </span>
                </div>
                
                <h1 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    {selectedArticle.title}
                </h1>
                
                <div className="flex items-center gap-2 mt-4 text-sm text-slate-600 bg-white inline-flex px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">Expert: {selectedArticle.author}</span>
                </div>
            </div>

            {/* Article Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto p-8 space-y-12">
                    
                    {/* Overview Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-indigo-800">
                            <BookOpen className="w-6 h-6" />
                            <h2 className="text-xl font-bold">概要・背景</h2>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 leading-relaxed text-lg whitespace-pre-wrap">
                            {selectedArticle.overview || selectedArticle.summary}
                        </div>
                    </section>

                    {/* Key Insights Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-green-700">
                            <Lightbulb className="w-6 h-6" />
                            <h2 className="text-xl font-bold">ポイント・成功の鍵</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-1">
                            {selectedArticle.keyInsights.map((insight, idx) => (
                                <div key={idx} className="flex gap-4 p-4 bg-green-50/50 rounded-xl border border-green-100 shadow-sm">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <p className="text-slate-800 font-medium pt-1">{insight}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Planning & Execution Notes (Two Columns) */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Planning Notes */}
                        {selectedArticle.planningNotes && selectedArticle.planningNotes.length > 0 && (
                            <section className="h-full">
                                <div className="flex items-center gap-2 mb-4 text-blue-700">
                                    <ClipboardList className="w-6 h-6" />
                                    <h2 className="text-lg font-bold">計画時の注意点</h2>
                                </div>
                                <ul className="space-y-3">
                                    {selectedArticle.planningNotes.map((note, idx) => (
                                        <li key={idx} className="flex gap-3 p-4 bg-blue-50/30 rounded-lg border border-blue-100 text-slate-700 text-sm h-full">
                                            <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                            <span>{note}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Execution Notes */}
                        {selectedArticle.executionNotes && selectedArticle.executionNotes.length > 0 && (
                            <section className="h-full">
                                <div className="flex items-center gap-2 mb-4 text-amber-700">
                                    <AlertTriangle className="w-6 h-6" />
                                    <h2 className="text-lg font-bold">実務時の注意点</h2>
                                </div>
                                <ul className="space-y-3">
                                    {selectedArticle.executionNotes.map((note, idx) => (
                                        <li key={idx} className="flex gap-3 p-4 bg-amber-50/30 rounded-lg border border-amber-100 text-slate-700 text-sm h-full">
                                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <span>{note}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>

                    {/* Metadata/Tags */}
                    <section className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                        {selectedArticle.tags.map(tag => (
                            <span key={tag} className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-gray-200 transition-colors">
                                <Tag className="w-3 h-3" /> {tag}
                            </span>
                        ))}
                    </section>

                    {/* Transcript Accordion */}
                    <section className="pt-8">
                         <div className="flex items-center gap-2 mb-6 text-slate-400">
                            <MessageSquare className="w-5 h-5" />
                            <h3 className="text-lg font-bold text-slate-700">元インタビューの記録</h3>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-6">
                            {selectedArticle.fullTranscript
                                .filter(m => m.role === 'interviewer' || m.role === 'respondent')
                                .map(msg => (
                                <div key={msg.id} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                                            msg.role === 'interviewer' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                                        }`}>
                                            {msg.role === 'interviewer' ? '質問' : '回答'}
                                        </span>
                                        <span className="text-xs text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-slate-700 text-sm leading-relaxed pl-1 border-l-2 border-slate-200 ml-1 py-1 pr-4 whitespace-pre-wrap">
                                        {msg.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
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
                    <p>この操作は取り消せません。「{selectedArticle.title}」を完全に削除してもよろしいですか？</p>
                </div>
            </Modal>
        </div>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ナレッジベース</h1>
            <p className="text-gray-500 mt-1">蓄積された組織の暗黙知を検索・閲覧できます</p>
        </div>
        <div className="relative w-full md:w-96 group">
            <input 
                type="text" 
                placeholder="キーワード、タグ、内容で検索..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all group-hover:border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article, index) => {
            const isNew = (Date.now() - article.createdAt) < 60000; // Created within last minute
            return (
            <div 
                key={article.id} 
                onClick={() => setSelectedArticle(article)}
                className={`bg-white p-0 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full overflow-hidden ${isNew ? 'ring-2 ring-indigo-400' : ''}`}
            >
                <div className="p-6 flex flex-col h-full relative">
                    {isNew && (
                        <span className="absolute top-4 right-4 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm">
                            NEW
                        </span>
                    )}
                    <div className="flex justify-between items-start mb-4">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                            {article.category}
                        </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed flex-1">
                        {article.summary}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <User className="w-3 h-3" />
                            </div>
                            <span className="text-xs text-gray-500 font-medium truncate max-w-[100px]">{article.author}</span>
                         </div>
                         <span className="text-xs text-gray-400">{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        )})}
        {filteredArticles.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Layers className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">記事が見つかりません</h3>
                <p className="text-gray-500">検索条件を変更するか、新しいインタビューを開始してください。</p>
            </div>
        )}
      </div>
    </div>
  );
};
