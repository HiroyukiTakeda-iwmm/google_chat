import React, { useState, useCallback, useRef, useEffect } from 'react';
import { KnowledgeArticle } from '../types';
import { deleteArticle } from '../services/storageService';
import { 
  Search, Tag, Calendar, User, ChevronLeft, BookOpen, 
  Lightbulb, MessageSquare, AlertTriangle, ClipboardList, 
  CheckCircle2, FileDown, Trash2, Printer, X, Loader2,
  ExternalLink, Copy, Check
} from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

// Declare html2pdf as a global variable loaded from CDN
declare const html2pdf: any;

interface Props {
  articles: KnowledgeArticle[];
  onArticleUpdate?: () => void;
}

// PDF生成用のコンテンツを構築する関数
const buildPdfContent = (article: KnowledgeArticle): string => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const transcriptHtml = article.fullTranscript
    .filter(m => m.role === 'interviewer' || m.role === 'respondent')
    .map(msg => `
      <div style="display: flex; gap: 16px; margin-bottom: 16px; page-break-inside: avoid;">
        <div style="width: 60px; flex-shrink: 0; text-align: right; padding-top: 4px;">
          <span style="font-size: 11px; font-weight: 600; color: ${msg.role === 'interviewer' ? '#4338ca' : '#475569'}; 
                       background: ${msg.role === 'interviewer' ? '#e0e7ff' : '#f1f5f9'}; 
                       padding: 2px 8px; border-radius: 4px;">
            ${msg.role === 'interviewer' ? '質問' : '回答'}
          </span>
        </div>
        <div style="flex: 1; border-left: 2px solid #e2e8f0; padding-left: 16px;">
          <p style="font-size: 13px; line-height: 1.7; color: #334155; white-space: pre-wrap; margin: 0;">
            ${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </p>
        </div>
      </div>
    `).join('');

  return `
    <div style="font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; 
                color: #1e293b; line-height: 1.6; padding: 48px; max-width: 100%; box-sizing: border-box;">
      
      <!-- Header -->
      <div style="border-bottom: 3px solid #4f46e5; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 600;">
            ナレッジ記事
          </span>
          <span style="font-size: 11px; color: #64748b;">
            作成日: ${formatDate(article.createdAt)}
          </span>
        </div>
        <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 16px 0; color: #0f172a; line-height: 1.3;">
          ${article.title}
        </h1>
        <div style="display: flex; gap: 24px; font-size: 13px; color: #475569;">
          <span><strong>エキスパート:</strong> ${article.author}</span>
          <span><strong>カテゴリ:</strong> ${article.category}</span>
        </div>
      </div>

      <!-- Summary Box -->
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
                  padding: 24px; border-radius: 12px; margin-bottom: 32px; 
                  border: 1px solid #e2e8f0; page-break-inside: avoid;">
        <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; 
                   color: #64748b; margin: 0 0 12px 0; font-weight: 600;">概要・背景</h2>
        <p style="font-size: 15px; line-height: 1.8; margin: 0; color: #334155; white-space: pre-wrap;">
          ${(article.overview || article.summary).replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </p>
      </div>

      <!-- Key Insights -->
      <div style="margin-bottom: 32px; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: 700; color: #15803d; margin: 0 0 16px 0; 
                   padding-left: 12px; border-left: 4px solid #22c55e;">
          重要ポイント
        </h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${article.keyInsights.map((insight, i) => `
            <div style="display: flex; gap: 12px; align-items: flex-start; page-break-inside: avoid;">
              <span style="flex-shrink: 0; width: 28px; height: 28px; background: #dcfce7; 
                           color: #15803d; border-radius: 8px; display: flex; align-items: center; 
                           justify-content: center; font-size: 13px; font-weight: 700;">${i + 1}</span>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; padding-top: 4px;">
                ${insight.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Planning & Execution Notes -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
        ${article.planningNotes && article.planningNotes.length > 0 ? `
          <div style="page-break-inside: avoid;">
            <h2 style="font-size: 16px; font-weight: 700; color: #1d4ed8; margin: 0 0 16px 0; 
                       padding-left: 12px; border-left: 4px solid #3b82f6;">
              計画時の注意点
            </h2>
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${article.planningNotes.map(note => `
                <li style="display: flex; gap: 8px; margin-bottom: 10px; font-size: 13px; 
                           color: #334155; line-height: 1.6;">
                  <span style="color: #3b82f6; flex-shrink: 0;">✓</span>
                  <span>${note.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${article.executionNotes && article.executionNotes.length > 0 ? `
          <div style="page-break-inside: avoid;">
            <h2 style="font-size: 16px; font-weight: 700; color: #b45309; margin: 0 0 16px 0; 
                       padding-left: 12px; border-left: 4px solid #f59e0b;">
              実務時の注意点
            </h2>
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${article.executionNotes.map(note => `
                <li style="display: flex; gap: 8px; margin-bottom: 10px; font-size: 13px; 
                           color: #334155; line-height: 1.6;">
                  <span style="color: #f59e0b; flex-shrink: 0;">⚠</span>
                  <span>${note.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>

      <!-- Tags -->
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 40px; padding-top: 16px; 
                  border-top: 1px solid #e2e8f0;">
        ${article.tags.map(tag => `
          <span style="background: #f1f5f9; color: #475569; padding: 4px 12px; 
                       border-radius: 16px; font-size: 12px; font-weight: 500;">
            #${tag}
          </span>
        `).join('')}
      </div>

      <!-- Transcript -->
      ${article.fullTranscript.length > 0 ? `
        <div style="page-break-before: always; padding-top: 32px;">
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; 
                     color: #64748b; margin: 0 0 24px 0; font-weight: 600; 
                     padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
            元インタビューの記録
          </h2>
          ${transcriptHtml}
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; 
                  text-align: center; color: #94a3b8; font-size: 11px;">
        K-Sync 暗黙知抽出システム | Generated on ${formatDate(Date.now())}
      </div>
    </div>
  `;
};

export const KnowledgeBase: React.FC<Props> = ({ articles, onArticleUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Copy article content to clipboard
  const handleCopyContent = useCallback(async () => {
    if (!selectedArticle) return;
    
    const content = `
# ${selectedArticle.title}

## 概要
${selectedArticle.overview || selectedArticle.summary}

## 重要ポイント
${selectedArticle.keyInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

${selectedArticle.planningNotes?.length ? `## 計画時の注意点\n${selectedArticle.planningNotes.map(note => `- ${note}`).join('\n')}` : ''}

${selectedArticle.executionNotes?.length ? `## 実務時の注意点\n${selectedArticle.executionNotes.map(note => `- ${note}`).join('\n')}` : ''}

---
エキスパート: ${selectedArticle.author}
カテゴリ: ${selectedArticle.category}
タグ: ${selectedArticle.tags.join(', ')}
    `.trim();

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [selectedArticle]);

  // PDF Generation with html2pdf
  const handleDownloadPdf = useCallback(async () => {
    if (!selectedArticle) return;
    
    setPdfError(null);
    setIsGeneratingPdf(true);

    try {
      // Check if html2pdf is available
      if (typeof html2pdf === 'undefined') {
        throw new Error('PDF生成ライブラリがロードされていません。ページを再読み込みしてお試しください。');
      }

      // Get or create the PDF render container
      let container = document.getElementById('pdf-render-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'pdf-render-container';
        document.body.appendChild(container);
      }

      // Build and set the PDF content
      container.innerHTML = buildPdfContent(selectedArticle);
      container.classList.add('rendering');

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate filename
      const safeTitle = selectedArticle.title
        .replace(/[^\w\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\s]+/g, '')
        .trim()
        .substring(0, 50);
      const filename = `${safeTitle || 'knowledge-article'}_${new Date().toISOString().split('T')[0]}.pdf`;

      // PDF generation options
      const opt = {
        margin: [10, 10, 10, 10], // mm
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true,
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true,
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: '.page-break-avoid'
        }
      };

      // Generate PDF
      await html2pdf().set(opt).from(container).save();

      // Cleanup
      container.innerHTML = '';
      container.classList.remove('rendering');

    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setPdfError(err.message || 'PDF生成中に予期せぬエラーが発生しました。');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [selectedArticle]);

  // Fallback: Browser print
  const handlePrint = useCallback(() => {
    if (!selectedArticle) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ポップアップがブロックされました。ポップアップを許可してください。');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>${selectedArticle.title} | K-Sync</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page { margin: 20mm; }
          body { margin: 0; padding: 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${buildPdfContent(selectedArticle)}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [selectedArticle]);

  // --- Detail View ---
  if (selectedArticle) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 h-[calc(100vh-100px)] overflow-hidden flex flex-col animate-slide-in-right relative">
        {/* Article Header */}
        <div className="border-b border-slate-100 p-6 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
            <button 
              onClick={() => setSelectedArticle(null)}
              className="group flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
              ナレッジ一覧に戻る
            </button>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyContent}
                className="text-slate-600 hover:bg-slate-100"
              >
                {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'コピー済み' : 'コピー'}
              </Button>
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
                onClick={handlePrint}
                className="shadow-sm"
              >
                <Printer className="w-4 h-4 mr-2" />
                印刷
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                isLoading={isGeneratingPdf}
                className="shadow-sm"
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF保存
              </Button>
            </div>
          </div>
          
          {/* PDF Error Message */}
          {pdfError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{pdfError}</p>
              <button onClick={() => setPdfError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full tracking-wide uppercase">
              {selectedArticle.category}
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {new Date(selectedArticle.createdAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            {selectedArticle.title}
          </h1>
          
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-600 bg-white inline-flex px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-medium">エキスパート: {selectedArticle.author}</span>
          </div>
        </div>

        {/* Article Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-8 space-y-12">
            
            {/* Overview Section */}
            <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-4 text-primary-800">
                <BookOpen className="w-6 h-6" />
                <h2 className="text-xl font-bold">概要・背景</h2>
              </div>
              <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200 text-slate-800 leading-relaxed text-lg whitespace-pre-wrap">
                {selectedArticle.overview || selectedArticle.summary}
              </div>
            </section>

            {/* Key Insights Section */}
            <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-4 text-green-700">
                <Lightbulb className="w-6 h-6" />
                <h2 className="text-xl font-bold">ポイント・成功の鍵</h2>
              </div>
              <div className="grid gap-4">
                {selectedArticle.keyInsights.map((insight, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-green-50/50 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <p className="text-slate-800 font-medium pt-1">{insight}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Planning & Execution Notes */}
            <div className="grid md:grid-cols-2 gap-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {selectedArticle.planningNotes && selectedArticle.planningNotes.length > 0 && (
                <section className="h-full">
                  <div className="flex items-center gap-2 mb-4 text-blue-700">
                    <ClipboardList className="w-6 h-6" />
                    <h2 className="text-lg font-bold">計画時の注意点</h2>
                  </div>
                  <ul className="space-y-3">
                    {selectedArticle.planningNotes.map((note, idx) => (
                      <li key={idx} className="flex gap-3 p-4 bg-blue-50/30 rounded-lg border border-blue-100 text-slate-700 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {selectedArticle.executionNotes && selectedArticle.executionNotes.length > 0 && (
                <section className="h-full">
                  <div className="flex items-center gap-2 mb-4 text-amber-700">
                    <AlertTriangle className="w-6 h-6" />
                    <h2 className="text-lg font-bold">実務時の注意点</h2>
                  </div>
                  <ul className="space-y-3">
                    {selectedArticle.executionNotes.map((note, idx) => (
                      <li key={idx} className="flex gap-3 p-4 bg-amber-50/30 rounded-lg border border-amber-100 text-slate-700 text-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Tags */}
            <section className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {selectedArticle.tags.map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-slate-200 transition-colors cursor-default">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </section>

            {/* Transcript */}
            {selectedArticle.fullTranscript.length > 0 && (
              <section className="pt-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
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
                            msg.role === 'interviewer' ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {msg.role === 'interviewer' ? '質問' : '回答'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed pl-1 border-l-2 border-slate-200 ml-1 py-1 pr-4 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    ))}
                </div>
              </section>
            )}
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
          <div className="text-slate-600">
            <p>この操作は取り消せません。「{selectedArticle.title}」を完全に削除してもよろしいですか？</p>
          </div>
        </Modal>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">ナレッジベース</h1>
          <p className="text-slate-500 mt-1">蓄積された組織の暗黙知を検索・閲覧できます</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="キーワード、タグ、内容で検索..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm transition-all group-hover:border-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-primary-500 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article, index) => {
          const isNew = (Date.now() - article.createdAt) < 60000;
          return (
            <div 
              key={article.id} 
              onClick={() => setSelectedArticle(article)}
              className={`bg-white p-0 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full overflow-hidden ${isNew ? 'ring-2 ring-primary-400 ring-offset-2' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="p-6 flex flex-col h-full relative">
                {isNew && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm">
                    NEW
                  </span>
                )}
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                    {article.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h3>
                
                <p className="text-sm text-slate-600 mb-6 line-clamp-3 leading-relaxed flex-1">
                  {article.summary}
                </p>
                
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {article.author.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[100px]">{article.author}</span>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(article.createdAt).toLocaleDateString('ja-JP')}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredArticles.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">記事が見つかりません</h3>
            <p className="text-slate-500 mt-1">検索条件を変更するか、新しいインタビューを開始してください。</p>
          </div>
        )}
      </div>
    </div>
  );
};
