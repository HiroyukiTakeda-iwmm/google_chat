
import { InterviewSession, KnowledgeArticle, SessionStatus } from "../types";

const SESSIONS_KEY = 'ksync_sessions';
const ARTICLES_KEY = 'ksync_articles';

export const saveSession = (session: InterviewSession) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const getSessions = (): InterviewSession[] => {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getSessionById = (id: string): InterviewSession | undefined => {
  return getSessions().find(s => s.id === id);
};

export const saveArticle = (article: KnowledgeArticle) => {
  // Get existing raw articles
  const data = localStorage.getItem(ARTICLES_KEY);
  const articles: KnowledgeArticle[] = data ? JSON.parse(data) : [];
  
  articles.push(article);
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
};

export const getArticles = (): KnowledgeArticle[] => {
  const data = localStorage.getItem(ARTICLES_KEY);
  const articles: KnowledgeArticle[] = data ? JSON.parse(data) : [];
  // Return sorted by newest first
  return articles.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteArticle = (id: string) => {
  const articles = getArticles();
  const filtered = articles.filter(a => a.id !== id);
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(filtered));
};

// Seed data if empty
export const initializeStorage = () => {
  if (!localStorage.getItem(ARTICLES_KEY)) {
    const mockArticles: KnowledgeArticle[] = [
      {
        id: 'kb-101',
        title: 'レガシーDB移行時のトラブル回避策',
        summary: 'ダウンタイムなしでSQL ServerからPostgreSQLへ移行するための「デュアルライト戦略」と重要ポイントのまとめ。',
        overview: 'SQL Server 2008からPostgreSQLへの移行プロジェクトにおいて、サービス停止時間をゼロにするための具体的な手法と、実際に発生したトラブルへの対処法をまとめたナレッジです。特にデータの整合性担保と切り戻し計画に焦点を当てています。',
        keyInsights: [
            'ゼロダウンタイム実現には「デュアルライト（二重書き込み）」戦略が必須。',
            '移行後48時間は旧システムを読み取り専用で保持し、即時切り戻し可能な状態にする。',
            'データのCollation（照合順序）の違いによる文字化けリスクを軽視しない。'
        ],
        planningNotes: [
            '移行リハーサルは本番相当のデータ量で行い、所要時間を正確に計測すること。',
            'アプリケーション側のDB接続ライブラリが新旧両方のDBに対応しているか事前に検証する。',
            '切り戻しトリガー（撤退基準）を明確にドキュメント化し、関係者と合意しておく。'
        ],
        executionNotes: [
            'データ同期ラグを監視するためのメトリクスダッシュボードを常時表示しておく。',
            '移行中は一時的にDBサーバーのCPU負荷が高まるため、インスタンスサイズを一時的に拡張する。',
            'エラーログ監視担当を専任で配置し、予期せぬクエリエラーを即座に検知する体制を作る。'
        ],
        tags: ['エンジニアリング', 'データベース', 'マイグレーション', 'リスク管理'],
        fullTranscript: [],
        createdAt: Date.now() - 100000000,
        author: '山田 太郎',
        category: 'エンジニアリング'
      },
      {
        id: 'kb-102',
        title: 'エンタープライズ営業のクロージング手法',
        summary: '大企業特有の稟議プロセスを攻略し、期日通りに契約締結するためのチャンピオン活用法。',
        overview: '意思決定者が複数存在するエンタープライズ企業への提案において、案件が「検討中」のまま停滞するのを防ぐための実践的なガイドです。キーマンの特定方法から、法務・セキュリティチェックの並行処理までを解説します。',
        keyInsights: [
            '提案初期に社内の「チャンピオン（熱心な擁護者）」を見つけ、内部営業を依頼する。',
            '値引きは最終手段とし、必ず「契約期間の延長」や「事例公開」などの条件とバーターにする。',
            '決裁ルートの全貌（誰がハンコを押すか）を初回提案時にヒアリングする。'
        ],
        planningNotes: [
            '顧客の決算月と予算策定時期を正確に把握し、そこから逆算して提案スケジュールを組む。',
            '法務チェックには通常2週間〜1ヶ月かかるため、セキュリティシートの提出を先行させる。',
            '競合他社の導入状況や、過去の類似ツールの導入失敗事例をリサーチしておく。'
        ],
        executionNotes: [
            '連絡が途絶えた場合は、単なる催促ではなく「業界の最新ニュース共有」などを口実に接触する。',
            '法務担当者との直接面談を申し入れ、契約書の修正意図を直接説明する時間を確保する。',
            'チャンピオンが社内説明で使用するための「稟議書テンプレート」をこちらで作成して渡す。'
        ],
        tags: ['営業', 'エンタープライズ', '交渉術'],
        fullTranscript: [],
        createdAt: Date.now() - 50000000,
        author: '佐藤 花子',
        category: '営業'
      }
    ];
    localStorage.setItem(ARTICLES_KEY, JSON.stringify(mockArticles));
  }
};
