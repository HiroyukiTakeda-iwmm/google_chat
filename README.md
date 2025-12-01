# K-Sync | 暗黙知抽出システム

<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" width="1200" height="475" alt="K-Sync Banner" />
  
  <p>
    <strong>組織の暗黙知を形式知に変換するAIインタビューシステム</strong>
  </p>
  
  <p>
    <a href="#features">機能</a> •
    <a href="#quick-start">クイックスタート</a> •
    <a href="#usage">使い方</a> •
    <a href="#tech-stack">技術スタック</a>
  </p>
</div>

---

## 概要

K-Syncは、組織内のベテラン社員が持つ「暗黙知」（経験則、コツ、判断基準など）を、AIを活用したインタビューを通じて「形式知」として抽出・蓄積するシステムです。

抽出されたナレッジは、以下の構造で整理されます：
- **概要・背景**: 知識の全体像と文脈
- **重要ポイント**: 成功のための鍵となる洞察
- **計画時の注意点**: 事前準備で気をつけるべきこと
- **実務時の注意点**: 実行段階でのトラブルシューティング

## Features

### 🤖 AIインタビュアー
Google Gemini 2.5 Flashを活用し、AIが自動的に深掘り質問を生成。一人でもナレッジ抽出が可能です。

### 📝 手動記録モード
人間同士のインタビューを記録し、AIが質問の提案をサポートします。

### 📊 ナレッジベース
蓄積されたナレッジを検索・閲覧可能。タグやカテゴリで整理されます。

### 📄 PDF出力
ナレッジ記事をPDFとしてダウンロード。オフラインでの共有や印刷に対応。

### 💾 ローカルストレージ
データはブラウザのローカルストレージに保存。外部サーバーへのデータ送信なし。

## Quick Start

### 前提条件
- Node.js 18以上
- Gemini API キー（[Google AI Studio](https://aistudio.google.com/)で取得）

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd k-sync

# 依存関係をインストール
npm install

# 環境変数を設定
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセスしてください。

## Usage

### 1. インタビューを開始

1. ダッシュボードから「新規インタビュー開始」をクリック
2. トピック、タイトル、回答者名を入力
3. インタビューモードを選択
   - **AIインタビュアー**: AIが質問を自動生成
   - **手動記録モード**: 人間がインタビューを行い、AIが質問を提案

### 2. インタビューを実施

- AIの質問に回答を入力
- 具体的なエピソードや失敗談を交えると、より質の高いナレッジが生成されます
- 十分な情報が集まったら「終了＆ナレッジ生成」をクリック

### 3. ナレッジを活用

- ナレッジベースで記事を検索・閲覧
- PDFでダウンロードして共有
- タグやカテゴリで絞り込み

## Tech Stack

- **フロントエンド**: React 19, TypeScript
- **スタイリング**: Tailwind CSS
- **ビルドツール**: Vite
- **AI**: Google Gemini 2.5 Flash
- **PDF生成**: jsPDF, html2canvas
- **チャート**: Recharts
- **アイコン**: Lucide React

## プロジェクト構造

```
k-sync/
├── App.tsx                 # メインアプリケーション
├── index.tsx               # エントリーポイント
├── index.html              # HTMLテンプレート
├── types.ts                # TypeScript型定義
├── components/
│   ├── Button.tsx          # ボタンコンポーネント
│   ├── Dashboard.tsx       # ダッシュボード
│   ├── InterviewSession.tsx # インタビュー画面
│   ├── KnowledgeBase.tsx   # ナレッジベース
│   ├── Layout.tsx          # レイアウト
│   └── Modal.tsx           # モーダル
└── services/
    ├── geminiService.ts    # Gemini API連携
    ├── pdfService.ts       # PDF生成
    └── storageService.ts   # ローカルストレージ
```

## ライセンス

MIT License

## 謝辞

- [Google AI Studio](https://aistudio.google.com/) - Gemini APIの提供
- [Tailwind CSS](https://tailwindcss.com/) - スタイリングフレームワーク
- [Lucide](https://lucide.dev/) - アイコンライブラリ
