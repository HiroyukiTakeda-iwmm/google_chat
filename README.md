# K-Sync 暗黙知抽出システム

<div align="center">

![K-Sync Logo](https://via.placeholder.com/120x120/4f46e5/ffffff?text=K-Sync)

**AIを活用して組織の暗黙知を形式知に変換するナレッジマネジメントシステム**

[🚀 デモを開始](#クイックスタート) | [📖 ドキュメント](#機能) | [⚙️ セットアップ](#セットアップ)

</div>

---

## ✨ 特徴

- **🤖 AIインタビュアーモード** - AIが自動で質問を生成し、一人でも効率的にナレッジを蓄積
- **📝 手動記録モード** - 対面インタビューを記録しながらAIが質問を提案
- **📊 自動ナレッジ生成** - インタビュー内容からタイトル、要約、重要ポイントを自動抽出
- **📄 PDF出力** - ナレッジ記事を美しいPDFとして出力・共有
- **🔒 ローカルファースト** - すべてのデータはローカルに保存、プライバシーを保護

## 🚀 クイックスタート

### 前提条件

- Node.js 18.0 以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd k-sync

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

### APIキーの設定（オプション・推奨）

AI機能をフル活用するには、Google Gemini APIキーが必要です：

1. [Google AI Studio](https://ai.google.dev/) でAPIキーを取得
2. プロジェクトルートに `.env.local` ファイルを作成
3. 以下を追加：
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. 開発サーバーを再起動

> **Note**: APIキーがなくても基本機能は動作しますが、AI質問生成とナレッジ分析が制限されます。

## 📖 機能

### インタビューモード

#### AIインタビュアーモード
- AIが状況に応じた質問を自動生成
- 深掘り質問で暗黙知を効果的に引き出す
- 一人でも効率的にナレッジを蓄積可能

#### 手動記録モード
- 対面インタビューの内容を記録
- AIが次の質問を提案
- インタビュアーとインタビュイーの発言を区別して記録

### ナレッジ記事

インタビュー終了時に、AIが以下を自動生成：

- **タイトル** - 内容を端的に表現
- **要約** - 一覧表示用の簡潔なサマリー
- **概要** - 詳細な背景と文脈
- **重要ポイント** - 成功の鍵となる知見
- **計画時の注意点** - 事前準備で考慮すべき事項
- **実務時の注意点** - 実行段階での落とし穴と対策
- **タグ** - 検索用のキーワード

### PDF出力

ナレッジ記事は美しいPDFとして出力可能：

- 日本語フォント対応
- 印刷に最適化されたレイアウト
- 全ての内容（インタビュー記録含む）を出力

## 🏗️ 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite |
| スタイリング | Tailwind CSS |
| AI | Google Gemini 2.5 Flash |
| チャート | Recharts |
| アイコン | Lucide React |
| PDF生成 | html2pdf.js |
| ストレージ | LocalStorage |

## 📁 プロジェクト構成

```
k-sync/
├── components/
│   ├── Button.tsx        # 再利用可能ボタンコンポーネント
│   ├── Dashboard.tsx     # ダッシュボード画面
│   ├── InterviewSession.tsx  # インタビュー画面
│   ├── KnowledgeBase.tsx # ナレッジ一覧・詳細画面
│   ├── Layout.tsx        # アプリレイアウト
│   └── Modal.tsx         # モーダルコンポーネント
├── services/
│   ├── geminiService.ts  # Gemini AI API連携
│   └── storageService.ts # ローカルストレージ操作
├── App.tsx               # メインアプリコンポーネント
├── index.tsx             # エントリーポイント
├── types.ts              # TypeScript型定義
└── index.html            # HTMLテンプレート
```

## 🔧 設定

### 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `GEMINI_API_KEY` | Google Gemini API キー | オプション（推奨） |

### ビルド

```bash
# 本番ビルド
npm run build

# プレビュー
npm run preview
```

## 🤝 コントリビューション

プルリクエストやイシューを歓迎します。大きな変更を行う場合は、まずイシューで議論してください。

## 📄 ライセンス

MIT License

---

<div align="center">

**Made with ❤️ for Knowledge Management**

Powered by [Google Gemini](https://ai.google.dev/)

</div>
