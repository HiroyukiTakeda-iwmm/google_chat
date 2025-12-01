import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { KnowledgeArticle } from '../types';

/**
 * PDFサービス - ナレッジ記事をPDFとしてエクスポート
 */

interface PdfGeneratorOptions {
  filename?: string;
  quality?: number;
}

/**
 * 純粋なテキストベースのPDF生成（日本語フォント対応）
 * html2canvasに依存しないシンプルな実装
 */
export const generateArticlePdf = async (
  article: KnowledgeArticle,
  options: PdfGeneratorOptions = {}
): Promise<void> => {
  const { 
    filename = article.title.replace(/[^\w\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]+/g, '_').substring(0, 30),
    quality = 0.95 
  } = options;

  // Create a temporary element for rendering
  const container = document.createElement('div');
  container.id = 'pdf-render-container';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 794px;
    min-height: 1123px;
    background: white;
    padding: 48px;
    font-family: 'Noto Sans JP', 'Inter', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #1a1a1a;
    z-index: 99999;
    overflow: visible;
    box-sizing: border-box;
  `;

  // Build the HTML content
  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
      
      #pdf-render-container * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      #pdf-render-container h1 {
        font-size: 26px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 16px;
        line-height: 1.3;
      }
      
      #pdf-render-container .meta-line {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 32px;
        padding-bottom: 16px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      #pdf-render-container .section {
        margin-bottom: 28px;
      }
      
      #pdf-render-container .section-title {
        font-size: 16px;
        font-weight: 700;
        color: #374151;
        margin-bottom: 12px;
        padding-left: 12px;
        border-left: 4px solid;
      }
      
      #pdf-render-container .section-title.overview { border-color: #6366f1; }
      #pdf-render-container .section-title.insights { border-color: #10b981; }
      #pdf-render-container .section-title.planning { border-color: #3b82f6; }
      #pdf-render-container .section-title.execution { border-color: #f59e0b; }
      
      #pdf-render-container .overview-text {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        white-space: pre-wrap;
        font-size: 14px;
        line-height: 1.7;
      }
      
      #pdf-render-container .insight-item {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
        align-items: flex-start;
      }
      
      #pdf-render-container .insight-number {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        background: #dcfce7;
        color: #166534;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
      }
      
      #pdf-render-container .insight-text {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
      }
      
      #pdf-render-container .note-list {
        list-style: none;
        padding-left: 0;
      }
      
      #pdf-render-container .note-item {
        position: relative;
        padding-left: 20px;
        margin-bottom: 10px;
        font-size: 13px;
        line-height: 1.6;
      }
      
      #pdf-render-container .note-item::before {
        content: "•";
        position: absolute;
        left: 0;
        color: #6b7280;
        font-weight: bold;
      }
      
      #pdf-render-container .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
      
      #pdf-render-container .tag {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 11px;
        font-weight: 500;
      }
      
      #pdf-render-container .transcript-section {
        margin-top: 40px;
        padding-top: 24px;
        border-top: 2px solid #e5e7eb;
      }
      
      #pdf-render-container .transcript-title {
        font-size: 14px;
        font-weight: 600;
        color: #6b7280;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      #pdf-render-container .transcript-item {
        margin-bottom: 16px;
        display: flex;
        gap: 16px;
      }
      
      #pdf-render-container .transcript-role {
        flex-shrink: 0;
        width: 48px;
        font-size: 10px;
        font-weight: 700;
        color: #6b7280;
        text-align: right;
        padding-top: 2px;
      }
      
      #pdf-render-container .transcript-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.6;
        padding-bottom: 12px;
        border-bottom: 1px solid #f1f5f9;
        white-space: pre-wrap;
      }
      
      #pdf-render-container .page-break {
        page-break-before: always;
      }
    </style>
    
    <div class="header">
      <h1>${escapeHtml(article.title)}</h1>
      <div class="meta-line">
        <span><strong>Expert:</strong> ${escapeHtml(article.author)}</span>
        <span><strong>Category:</strong> ${escapeHtml(article.category)}</span>
        <span><strong>Date:</strong> ${new Date(article.createdAt).toLocaleDateString('ja-JP')}</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title overview">概要・背景</div>
      <div class="overview-text">${escapeHtml(article.overview || article.summary)}</div>
    </div>
    
    ${article.keyInsights.length > 0 ? `
      <div class="section">
        <div class="section-title insights">重要ポイント</div>
        <div class="insights-list">
          ${article.keyInsights.map((insight, i) => `
            <div class="insight-item">
              <div class="insight-number">${i + 1}</div>
              <div class="insight-text">${escapeHtml(insight)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    ${article.planningNotes && article.planningNotes.length > 0 ? `
      <div class="section">
        <div class="section-title planning">計画時の注意点</div>
        <ul class="note-list">
          ${article.planningNotes.map(note => `
            <li class="note-item">${escapeHtml(note)}</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    ${article.executionNotes && article.executionNotes.length > 0 ? `
      <div class="section">
        <div class="section-title execution">実務時の注意点</div>
        <ul class="note-list">
          ${article.executionNotes.map(note => `
            <li class="note-item">${escapeHtml(note)}</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    <div class="tags-container">
      ${article.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
    </div>
    
    ${article.fullTranscript && article.fullTranscript.length > 0 ? `
      <div class="transcript-section">
        <div class="transcript-title">インタビュー記録</div>
        ${article.fullTranscript
          .filter(m => m.role === 'interviewer' || m.role === 'respondent')
          .map(msg => `
            <div class="transcript-item">
              <div class="transcript-role">${msg.role === 'interviewer' ? '質問' : '回答'}</div>
              <div class="transcript-content">${escapeHtml(msg.content)}</div>
            </div>
          `).join('')}
      </div>
    ` : ''}
  `;

  document.body.appendChild(container);

  // Wait for fonts to load
  await document.fonts.ready;
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Capture the container with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
      scrollY: 0,
      scrollX: 0,
    });

    // Create PDF with jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = 297; // A4 height in mm

    let heightLeft = imgHeight;
    let position = 0;
    let pageNumber = 0;

    // Add pages as needed
    while (heightLeft > 0) {
      if (pageNumber > 0) {
        pdf.addPage();
      }

      const sourceY = (pageNumber * pageHeight * canvas.width) / imgWidth;
      const sourceHeight = Math.min(
        (pageHeight * canvas.width) / imgWidth,
        canvas.height - sourceY
      );

      // Create a temporary canvas for this page
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceHeight;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, sourceY,
          canvas.width, sourceHeight,
          0, 0,
          canvas.width, sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', quality);
        const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;

        pdf.addImage(pageImgData, 'JPEG', 0, 0, imgWidth, pageImgHeight);
      }

      heightLeft -= pageHeight;
      pageNumber++;
    }

    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};

/**
 * HTML文字列をエスケープ
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * ブラウザの印刷機能を使用したPDF生成（フォールバック用）
 */
export const printArticle = (article: KnowledgeArticle): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('ポップアップがブロックされました。ブラウザの設定を確認してください。');
    return;
  }

  const content = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>${article.title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Noto Sans JP', sans-serif; 
          padding: 48px; 
          max-width: 800px; 
          margin: 0 auto;
          color: #1a1a1a;
          line-height: 1.6;
        }
        h1 { font-size: 24px; margin-bottom: 16px; }
        .meta { color: #666; font-size: 12px; margin-bottom: 32px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
        .section { margin-bottom: 24px; }
        .section-title { 
          font-size: 16px; 
          font-weight: 700; 
          margin-bottom: 12px; 
          padding-left: 12px;
          border-left: 4px solid #6366f1;
        }
        .overview { background: #f8fafc; padding: 16px; border-radius: 8px; }
        .insight { display: flex; gap: 12px; margin-bottom: 12px; }
        .insight-num { 
          width: 24px; height: 24px; 
          background: #dcfce7; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          font-size: 12px; font-weight: 700; color: #166534;
        }
        .note { margin-bottom: 8px; padding-left: 16px; position: relative; }
        .note::before { content: "•"; position: absolute; left: 0; }
        .tags { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        .tag { display: inline-block; background: #f1f5f9; padding: 4px 12px; border-radius: 16px; font-size: 11px; margin-right: 8px; margin-bottom: 8px; }
        .transcript { margin-top: 32px; border-top: 2px solid #e5e7eb; padding-top: 24px; }
        .transcript-title { font-size: 14px; color: #666; text-transform: uppercase; margin-bottom: 16px; }
        .transcript-item { display: flex; gap: 16px; margin-bottom: 12px; }
        .transcript-role { width: 48px; font-size: 10px; font-weight: 700; color: #666; text-align: right; }
        .transcript-content { flex: 1; font-size: 13px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
        @media print {
          body { padding: 24px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(article.title)}</h1>
      <div class="meta">
        <strong>Expert:</strong> ${escapeHtml(article.author)} | 
        <strong>Category:</strong> ${escapeHtml(article.category)} | 
        <strong>Date:</strong> ${new Date(article.createdAt).toLocaleDateString('ja-JP')}
      </div>
      
      <div class="section">
        <div class="section-title">概要・背景</div>
        <div class="overview">${escapeHtml(article.overview || article.summary)}</div>
      </div>
      
      ${article.keyInsights.length > 0 ? `
        <div class="section">
          <div class="section-title" style="border-color: #10b981;">重要ポイント</div>
          ${article.keyInsights.map((insight, i) => `
            <div class="insight">
              <div class="insight-num">${i + 1}</div>
              <div>${escapeHtml(insight)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${article.planningNotes && article.planningNotes.length > 0 ? `
        <div class="section">
          <div class="section-title" style="border-color: #3b82f6;">計画時の注意点</div>
          ${article.planningNotes.map(note => `<div class="note">${escapeHtml(note)}</div>`).join('')}
        </div>
      ` : ''}
      
      ${article.executionNotes && article.executionNotes.length > 0 ? `
        <div class="section">
          <div class="section-title" style="border-color: #f59e0b;">実務時の注意点</div>
          ${article.executionNotes.map(note => `<div class="note">${escapeHtml(note)}</div>`).join('')}
        </div>
      ` : ''}
      
      <div class="tags">
        ${article.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      
      ${article.fullTranscript && article.fullTranscript.length > 0 ? `
        <div class="transcript">
          <div class="transcript-title">インタビュー記録</div>
          ${article.fullTranscript
            .filter(m => m.role === 'interviewer' || m.role === 'respondent')
            .map(msg => `
              <div class="transcript-item">
                <div class="transcript-role">${msg.role === 'interviewer' ? '質問' : '回答'}</div>
                <div class="transcript-content">${escapeHtml(msg.content)}</div>
              </div>
            `).join('')}
        </div>
      ` : ''}
      
      <script>
        window.onload = () => {
          setTimeout(() => window.print(), 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
};
