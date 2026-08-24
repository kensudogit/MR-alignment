import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import ChatModal from './ChatModal';
import AppointmentModal from './AppointmentModal';
import ContactModal from './ContactModal';
import UsageGuideModal from './UsageGuideModal';
import { useAuth } from '../contexts/AuthContext';
import { requestDocument } from '../services/aiContent';
import { contactAPI } from '../services/api';
import { siteInfo, hasPhone, hasEmail, telHref } from '../config/site';
import { blogData, BLOG_CATEGORY_ORDER, BLOG_IMAGE_MAP } from '../data/blogData';
import { INDUSTRY_OPTIONS } from '../data/industries';

// --- Inline Icon Components (no external deps) ---
const IconPhone = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M2 5c0-1.1.9-2 2-2h2.2c.9 0 1.7.6 1.9 1.5l.8 3.1a2 2 0 0 1-.6 2L7.2 12a13 13 0 0 0 4.8 4.8l2.4-1.1a2 2 0 0 1 2 .2l2.6 1.7c.8.6 1.1 1.6.8 2.6l-.8 2.2c-.3.9-1.1 1.5-2 1.5H18c-8.8 0-16-7.2-16-16V5Z"/>
  </svg>
);
const IconUsers = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"/>
    <path d="M6 21a6 6 0 1 1 12 0"/>
  </svg>
);
const IconClock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v6l4 2"/>
  </svg>
);
const IconShield = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M12 2 4 5v6c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V5l-8-3Z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
 );
const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);
const IconX = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);


// --- Feature Data ---
//
// 掲載するサービスは「このサイト上で裏付けを示せるもの」に限る。
//   - 開発実績（#portfolio）に公開中のアプリがある
//   - 開発の進め方（/process）で工程を説明している
//   - コーディングエージェント講習（/coding-agents）で内容を公開している
//   - 開発マニュアル（/react-manual）で実装の規約を公開している
// 裏付けのない一般論（旧版の「JavaSE-21 LTS」「Spring Boot 3.x」など、
// 実際には使っていない技術名）を並べないこと。
const featureData = {
  aiSolution: {
    title: "生成AI・AIエージェント開発",
    icon: <IconUsers className="h-8 w-8"/>,
    shortDesc: "RAG・LLM を業務に組み込み、人が確認できる形で自動化する。",
    longDesc:
      "生成AIを「それらしい出力が出るだけ」で終わらせないための設計から入ります。" +
      "社内文書を根拠に回答する RAG、外部サービスを操作する AI エージェント、" +
      "資料や記事の自動生成まで、OpenAI / Amazon Bedrock を用いて構築します。" +
      "AIの出力をそのまま使わず、人が手を入れた版を残して品質を測る仕組みまで含めて設計します" +
      "（このサイトの資料生成機能が、その実装例です）。",
    benefits: [
      "社内文書を根拠にした回答（RAG）",
      "人の確認を前提とした業務組み込み",
      "生成品質を数値で追える運用",
      "APIキーを外部に出さない構成",
    ],
    useCases: [
      "社内ナレッジ検索・問い合わせ対応",
      "提案資料・記事の自動生成",
      "情報収集と投稿の自動化（AIエージェント）",
      "生成AI基盤（Bedrock Knowledge Base）の構築",
    ],
  },
  systemDevelopment: {
    title: "業務システム・Webアプリ開発",
    icon: <IconPhone className="h-8 w-8"/>,
    shortDesc: "要件整理から公開まで、実際に動くところまで持っていく。",
    longDesc:
      "React / TypeScript と Python（FastAPI）・Java を中心に、業務で使う Web アプリと API を開発します。" +
      "SaaS 型の管理ツール、OCR による帳票のデータ化、マーケティング自動化など、" +
      "公開中のアプリを開発実績としてご覧いただけます。" +
      "要件整理・設計・実装・テスト・デプロイの各工程で何を決めるかは「開発の進め方」に公開しています。",
    benefits: [
      "動く成果物で確認しながら進められる",
      "認証・権限・監査ログまで含めた設計",
      "自動テストを備えた実装",
      "公開までを含む一貫対応",
    ],
    useCases: [
      "SaaS 型の業務ツール",
      "帳票・領収書のデータ化（OCR）",
      "マーケティング・販売支援システム",
      "社内業務の Web 化",
    ],
  },
  dataPlatform: {
    title: "データ活用・分析基盤",
    icon: <IconClock className="h-8 w-8"/>,
    shortDesc: "集める・貯める・使うまでを一続きで設計する。",
    longDesc:
      "Python と PostgreSQL を中心に、データの収集・蓄積・可視化・予測までを設計します。" +
      "エネルギーリソースの需給集約や株価の予測など、時系列データを扱う実装を公開しています。" +
      "分析の前に「何を判断したいのか」を決めるところから入るため、使われないダッシュボードを作りません。",
    benefits: [
      "判断に使える指標から逆算した設計",
      "収集・前処理の自動化",
      "時系列データの予測・可視化",
      "分析結果を業務へ戻す導線",
    ],
    useCases: [
      "需給・稼働データの集約と可視化",
      "売上・価格の予測モデル",
      "業務データの統合と集計",
      "レポートの自動生成",
    ],
  },
  cloudPlatform: {
    title: "クラウド基盤・運用",
    icon: <IconShield className="h-8 w-8"/>,
    shortDesc: "Docker と CI/CD で、壊れたらすぐ戻せる状態にする。",
    longDesc:
      "AWS / GCP / Railway 上に、コンテナと自動デプロイを前提とした実行環境を構築します。" +
      "設定は環境変数へ集約し、秘密情報をソースやビルド成果物に含めない構成にします。" +
      "起動時のマイグレーション、ヘルスチェック、失敗時に起動を止める仕組みまで含めて整えます。",
    benefits: [
      "秘密情報をコードに置かない構成",
      "コンテナによる環境差異の解消",
      "自動デプロイとロールバック",
      "稼働確認とログの整備",
    ],
    useCases: [
      "オンプレミスからクラウドへの移行",
      "本番・検証環境の構築",
      "生成AIサービスの実行基盤",
      "監視・バックアップ体制の整備",
    ],
  },
  legacyMigration: {
    title: "レガシー移行・モダナイゼーション",
    icon: <IconClock className="h-8 w-8"/>,
    shortDesc: "止められない既存システムを、段階的に置き換える。",
    longDesc:
      "古いフレームワークや言語で動き続けているシステムを、稼働を止めずに移行します。" +
      "一括で書き換えるのではなく、現行の挙動をテストで固定し、機能単位で置き換える進め方を取ります。" +
      "このサイト自身も PHP / Laravel から Python / FastAPI へ全面移行しており、その手順を「開発の進め方」に公開しています。",
    benefits: [
      "稼働を止めない段階移行",
      "現行仕様をテストで固定してから着手",
      "移行後の保守コスト削減",
      "移行判断に必要な現状評価",
    ],
    useCases: [
      "EOL を迎えた言語・FW からの移行",
      "オンプレ業務システムのWeb化",
      "属人化したシステムの引き継ぎ",
      "移行可否の調査・見積り",
    ],
  },
  teamEnablement: {
    title: "コーディングエージェント導入支援",
    icon: <IconUsers className="h-8 w-8"/>,
    shortDesc: "Codex / Claude Code を、現場が使える形で定着させる。",
    longDesc:
      "AI にコードを書かせる前に、レビューと検証の型を決めます。" +
      "OpenAI Codex と Claude Code について、設定・権限・運用ルール・演習までをまとめた講習を公開しており、" +
      "そのまま社内研修としてご利用いただけます。導入後の運用ルール策定や、既存の開発フローへの組み込みも支援します。",
    benefits: [
      "公開済みの講習資料をそのまま利用可能",
      "権限とレビューの運用ルール策定",
      "既存の開発フローへの組み込み",
      "実際の課題での演習",
    ],
    useCases: [
      "開発チームへのAIツール導入",
      "社内向け技術研修",
      "コードレビュー体制の見直し",
      "生成AIの利用ルール策定",
    ],
  },
};

// --- Small UI helpers ---
const Stat = ({ value, label }) => (
  <div className="card-modern hover-lift flex flex-col items-center gap-2 p-6 text-center">
    <div className="text-4xl font-bold gradient-text">{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

Stat.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

/**
 * 主要機能カードの写真。
 *
 * 【差し替え方法】
 *   photo の URL を入れ替えるだけで反映されます。
 *   読み込めなかった場合は fallback（ローカル画像）→ グラデーション背景の順に退避するため、
 *   URL が切れてもカードが崩れることはありません。
 *
 * 【注意】
 *   Unsplash の画像を直接参照しています。外部サービスのため、
 *   表示速度・可用性はその時々のネットワーク状況に依存します。
 *   恒久運用するなら、画像をダウンロードして public/features/ に置き、
 *   photo を '/features/xxx.jpg' のようなローカルパスへ変更してください。
 *
 * Unsplash のライセンス: https://unsplash.com/license
 */
// 各サービス専用に用意した画像を同一オリジンから配信する。
// 以前は外部（Unsplash）を優先していたが、読み込み失敗時に
// 中身が重複したローカル画像へ退避してしまい別サービスの絵が出ていた。
const FEATURE_PHOTOS = {
  aiSolution: { photo: '/features/feature-dx-promotion.png' },
  systemDevelopment: { photo: '/features/feature-system-development.png' },
  dataPlatform: { photo: '/features/feature-data-analysis.png' },
  cloudPlatform: { photo: '/features/feature-cloud-migration.png' },
  legacyMigration: { photo: '/features/feature-it-consulting.png' },
  teamEnablement: { photo: '/learning.png' },
};

const FeatureCard = ({ icon, title, desc, onClick, imageUrl, imageBg }) => {
  // 画像が読み込めなかった場合はグラデーション背景だけを表示する。
  const [failed, setFailed] = useState(false);
  const src = imageUrl;

  const handleError = () => setFailed(true);

  return (
  <button
    className="group cursor-pointer transition-all duration-500 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 w-full text-left overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 hover:border-blue-200"
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    aria-label={`${title}の詳細を見る`}
  >
    {/* Image Section */}
    <div className={`h-40 rounded-t-2xl ${imageBg || 'bg-gradient-to-br from-blue-100 to-blue-200'} flex items-center justify-center relative overflow-hidden`}>
      {src && !failed && (
        <img
          src={src}
          alt={title}
          /* 写真はカード全体を埋める。object-contain だと余白が出て写真らしく見えない */
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          onError={handleError}
        />
      )}
      {/* 写真の上に載る文字を読みやすくする控えめなオーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent"></div>
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <span className="text-gray-700 text-sm font-medium">詳細</span>
      </div>
    </div>

    {/* Content Section */}
    <div className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>
        <h3 className="font-bold text-gray-900 text-xl group-hover:text-blue-700 transition-colors duration-300">{title}</h3>
      </div>
      <p className="text-gray-600 leading-relaxed mb-4 text-base group-hover:text-gray-700 transition-colors duration-300">{desc}</p>
      <div className="flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        詳細を見る 
        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </button>
  );
};

FeatureCard.propTypes = {
  icon: PropTypes.element.isRequired,
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  imageUrl: PropTypes.string,
  imageBg: PropTypes.string
};

// --- Blog Detail Modal ---
const BlogModal = ({ isOpen, onClose, blogCategory, onArticleClick }) => {
  if (!isOpen || !blogCategory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-modal-title"
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100"
      >
        {/* Header */}
        <div className={`${blogCategory.image} p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-white text-4xl font-bold opacity-80">
                {blogCategory.icon}
              </div>
              <div>
                <h2 id="blog-modal-title" className="text-2xl font-bold text-white">
                  {blogCategory.title}
                </h2>
                <p className="text-white/80 text-lg">
                  {blogCategory.description}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
              aria-label="閉じる"
            >
              <IconX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {blogCategory.articles.map((article, index) => (
              <div key={`article-${article.title}-${index}`} className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {article.title}
                </h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                  {article.content}
                </div>
                <button
                  onClick={() => onArticleClick(article, blogCategory)}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors duration-200 flex items-center gap-2"
                >
                  詳細を読む
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="btn-gradient w-full"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

BlogModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  blogCategory: PropTypes.object,
  onArticleClick: PropTypes.func.isRequired
};

// 記事に外部リンクが設定されていない場合でも、本文で紹介しているGitHubリポジトリを遷移先として使う。
const resolveArticleUrl = (article) => {
  if (!article) return null;
  if (article.url) return article.url;
  const github = article.content?.match(/https:\/\/github\.com\/[\w.-]+\/[\w.-]+/)?.[0];
  if (github) return github;
  return article.content?.match(/https?:\/\/[^\s)\]"']+/)?.[0] ?? null;
};

// --- Article Detail Modal ---
const ArticleModal = ({ isOpen, onClose, article, categoryInfo }) => {
  if (!isOpen || !article) return null;

  const articleUrl = resolveArticleUrl(article);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-modal-title"
        className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100"
      >
        {/* Header */}
        <div className={`${categoryInfo?.image || 'bg-gradient-to-br from-blue-400 to-indigo-500'} p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-white text-4xl font-bold opacity-80">
                {categoryInfo?.icon || '📰'}
              </div>
              <div>
                <h2 id="article-modal-title" className="text-2xl font-bold text-white">
                  {article.title}
                </h2>
                <p className="text-white/80 text-lg">
                  {categoryInfo?.title || '技術記事'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
              aria-label="閉じる"
            >
              <IconX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Article Image */}
          {article.imageUrl && (
            <div className="mb-8">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="w-full h-64 object-cover rounded-xl shadow-lg"
                onError={(e) => {
                  console.error('Image failed to load:', article.imageUrl);
                  // フォールバック画像を設定
                  e.target.src = '/system_development_image.png';
                }}
              />
            </div>
          )}
          
          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {article.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
          <button 
            onClick={onClose}
            className={articleUrl ? 'btn-secondary flex-1' : 'btn-gradient w-full'}
          >
            閉じる
          </button>
          {articleUrl ? (
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient flex-1 text-center"
            >
              詳細ページを見る
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
};

ArticleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  article: PropTypes.object,
  categoryInfo: PropTypes.object
};

// --- Feature Detail Modal ---
const FeatureModal = ({ isOpen, onClose, feature, onContact }) => {
  if (!isOpen || !feature) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <dialog 
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100"
        open
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-healthcare-100 to-healthcare-200 text-healthcare-600">
              {feature.icon}
            </div>
            <h2 id="modal-title" className="text-2xl font-bold text-gray-900">{feature.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="閉じる"
          >
            <IconX className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div id="modal-description" className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">機能概要</h3>
            <p className="text-gray-700 leading-relaxed">{feature.longDesc}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">主なメリット</h3>
            <ul className="space-y-2">
              {feature.benefits.map((benefit, index) => (
                <li key={`benefit-${benefit}-${index}`} className="flex items-center gap-3 text-gray-700">
                  <IconCheck className="h-5 w-5 text-healthcare-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">活用シーン</h3>
            <ul className="space-y-2">
              {feature.useCases.map((useCase, index) => (
                <li key={`useCase-${useCase}-${index}`} className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-healthcare-400 rounded-full flex-shrink-0" />
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            閉じる
          </button>
          <button
            onClick={() => {
              onClose();
              // 旧実装は alert で「お問い合わせください」と出すだけの行き止まりだった
              onContact();
            }}
            className="btn-gradient"
          >
            このサービスを相談する
          </button>
        </div>
      </dialog>
    </div>
  );
};

FeatureModal.propTypes = {
  onContact: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  feature: PropTypes.object
};

const Input = ({ label, type = "text", name, placeholder, required = false }) => (
  <div className="form-group">
    <label className="form-label">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      className="form-input"
    />
  </div>
);

Input.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool
};

const Select = ({ label, name, options = [], required = false }) => (
  <div className="form-group">
    <label className="form-label">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      name={name}
      required={required}
      className="form-input"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

Select.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })),
  required: PropTypes.bool
};

const Badge = ({ children, variant = "default" }) => {
  const variantClasses = {
    default: "px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800",
    success: "px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800",
    warning: "px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800",
    info: "px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800"
  };
  
  return (
    <span className={`${variantClasses[variant]} inline-flex items-center gap-1`}>
      <IconCheck className="h-3 w-3" /> {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'info'])
};

// --- Main Page Component ---
export default function HealthcareLP() {
  const [showTop, setShowTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [particles, setParticles] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedArticleCategory, setSelectedArticleCategory] = useState(null);
  const [imageLoadStates, setImageLoadStates] = useState({});
  const [currentBlogSlide, setCurrentBlogSlide] = useState(0);
  
  // 認証関連の状態
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 認証モードの状態

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    
    // パーティクルエフェクトの生成
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 6,
        size: Math.random() * 4 + 2
      }));
      setParticles(newParticles);
    };
    
    generateParticles();
    
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // モーダルが開いているときのESCキー処理
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (selectedFeature) {
          setSelectedFeature(null);
        }
        if (selectedBlog) {
          setSelectedBlog(null);
        }
        if (selectedArticle) {
          setSelectedArticle(null);
          setSelectedArticleCategory(null);
        }
      }
    };

    if (selectedFeature || selectedBlog || selectedArticle) {
      document.addEventListener('keydown', handleEscape);
      // モーダルが開いているときはスクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedFeature, selectedBlog, selectedArticle]);

  const handleImageLoad = (projectIndex) => {
    setImageLoadStates(prev => ({
      ...prev,
      [projectIndex]: { loaded: true, error: false }
    }));
  };

  const handleImageError = (projectIndex) => {
    setImageLoadStates(prev => ({
      ...prev,
      [projectIndex]: { loaded: false, error: true }
    }));
  };

  // 記事クリックハンドラー
  const handleArticleClick = (article, category) => {
    setSelectedArticle(article);
    setSelectedArticleCategory(category || selectedBlog);
  };

  // blogData を唯一の情報源にし、カルーセル用設定を派生させる
  const blogCategories = BLOG_CATEGORY_ORDER.map((key) => ({
    key,
    ...blogData[key],
    imageUrl: BLOG_IMAGE_MAP[key],
  }));

  const nextBlogSlide = () => {
    setCurrentBlogSlide((prev) => (prev + 1) % blogCategories.length);
  };

  const prevBlogSlide = () => {
    setCurrentBlogSlide((prev) => (prev - 1 + blogCategories.length) % blogCategories.length);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // サーバーへ送るのはフォームの入力値のみ。
    // AI資料生成はバックエンド経由で行い、フロントエンドはAPIキーもプロンプトも持たない
    // （APIキーを持つとビルド成果物から読み取れてしまう）。
    const payload = {
      industry: formData.get('industry') || '',
      companyName: formData.get('companyName') || '',
      dept: formData.get('dept') || '',
      role: formData.get('role') || '',
      lastName: formData.get('lastName') || '',
      firstName: formData.get('firstName') || '',
      email: formData.get('email') || '',
      additionalRequirements: formData.get('additionalRequirements') || '',
    };

    // 画面表示用
    const userInfo = {
      name: `${payload.lastName} ${payload.firstName}`,
      company: payload.companyName,
      industry: payload.industry,
      position: payload.role,
      dept: payload.dept,
      email: payload.email,
      additionalRequirements: payload.additionalRequirements,
    };

    // 生成〜メール送信の完了まで表示し続ける。閉じ忘れを防ぐため finally で必ず閉じる。
    const closeLoading = showLoadingModal();

    try {
      // 生成された資料は、payload.email 宛にサーバーから送信される
      const result = await requestDocument(payload);

      if (result.success && result.content) {
        showGeneratedContent(result.content, userInfo, {
          emailSent: result.emailSent,
          notice: result.message,
          reference: result.reference,
        });
        form.reset();
        return;
      }

      // 旧実装はここで作り話のデモ資料（「業務効率30%向上」「3年ROI 300%」など
      // 裏付けのない数字）を表示していた。利用者には成功に見えるのに、
      // メールは届かず、事務所にも問い合わせが残らない状態だった。
      // 生成に失敗したときは、資料請求そのものを問い合わせとして記録し、
      // 人が対応できるようにする。
      await handleDocumentFailure(payload, userInfo, result.error);
      form.reset();
    } catch (error) {
      console.error('AI資料生成エラー:', error);
      await handleDocumentFailure(payload, userInfo);
      form.reset();
    } finally {
      closeLoading();
    }
  };

  /**
   * AI資料の生成に失敗したときの後始末。
   *
   * 資料は出せなくても、資料請求という見込み客の行動は失わない。
   * /api/contact へ記録すれば DB に残り、担当者へメール通知が飛ぶ。
   * それも失敗したとき（＝サーバーに届いていない）だけ、明確に失敗を伝える。
   */
  const handleDocumentFailure = async (payload, userInfo, reason = '') => {
    try {
      const { data } = await contactAPI.send({
        name: userInfo.name.trim() || payload.email,
        email: payload.email,
        organization: payload.companyName || undefined,
        role: payload.role || undefined,
        subject: '資料請求（AI資料の自動生成に失敗）',
        message: [
          '【資料ダウンロードフォームからの請求】',
          `業界: ${payload.industry || '未選択'}`,
          `部署: ${payload.dept || '未記入'}`,
          '',
          `ご要望: ${payload.additionalRequirements || '（記載なし）'}`,
          '',
          `※ AI資料の自動生成に失敗したため、担当者による対応が必要です。${reason ? `理由: ${reason}` : ''}`,
        ].join('\n').slice(0, 2000),
        contactMethod: 'email',
        urgency: 'high',
      });

      showRequestReceived({
        title: '資料請求を受け付けました',
        body: `ただいま資料の自動生成ができなかったため、担当者より ${payload.email} 宛にお送りします。`,
        reference: data.contact_id,
        tone: 'info',
      });
    } catch (contactError) {
      console.error('資料請求の記録にも失敗:', contactError);
      showRequestReceived({
        title: '送信できませんでした',
        body: [
          '通信エラーにより、資料請求をお預かりできませんでした。お手数ですが、',
          hasEmail() ? `${siteInfo.email} 宛にメールでご連絡ください。` : '時間をおいて再度お試しください。',
        ].join(''),
        tone: 'error',
      });
    }
  };

  // ローディングモーダル表示。閉じる関数を返す。
  const showLoadingModal = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">AI資料を生成中...</h3>
        <p class="text-gray-600">生成後、ご入力のメールアドレスへお送りします</p>
        <p class="text-sm text-gray-500 mt-2">30秒ほどかかる場合があります</p>
      </div>
    `;
    document.body.appendChild(modal);

    // 旧実装は3秒後に無条件で閉じていたが、生成には数十秒かかるため
    // 「表示が消えたのに何も起きない」状態になっていた。完了時に呼び出し側が閉じる。
    return () => modal.remove();
  };

  // innerHTML へ差し込む値のエスケープ。
  // 資料本文はAIの生成結果であり、そのまま差し込むとスクリプトが動きうる。
  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  // 送信結果の案内バナー
  const buildNoticeBanner = ({ emailSent, notice, reference, email }) => {
    if (emailSent) {
      return `
        <div class="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4">
          <div class="font-semibold">${escapeHtml(email)} 宛に資料をお送りしました</div>
          <div class="text-sm mt-1">
            ${notice ? escapeHtml(notice) : ''}
            ${reference ? `（資料番号: ${escapeHtml(reference)}）` : ''}
          </div>
        </div>`;
    }

    return `
      <div class="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
        <div class="font-semibold">メールの送信に失敗しました</div>
        <div class="text-sm mt-1">
          資料は作成できています。この画面の内容をご確認ください。
          ${reference ? `（資料番号: ${escapeHtml(reference)}）` : ''}
        </div>
      </div>`;
  };

  /**
   * 資料が出せなかったときの結果表示。
   * 成功していないものを成功に見せないため、資料本文は一切出さない。
   */
  const showRequestReceived = ({ title, body, reference = '', tone = 'info' }) => {
    const palette = tone === 'error'
      ? 'bg-red-50 border-red-300 text-red-800'
      : 'bg-blue-50 border-blue-300 text-blue-800';

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-lg w-full">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-900">${escapeHtml(title)}</h2>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>
          <div class="border ${palette} px-4 py-3 rounded">
            <div class="text-sm leading-relaxed">${escapeHtml(body)}</div>
            ${reference ? `<div class="text-sm mt-2">受付番号: ${escapeHtml(reference)}</div>` : ''}
          </div>
          <div class="mt-6 flex justify-end">
            <button onclick="this.closest('.fixed').remove()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">閉じる</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  // 生成されたコンテンツ表示
  const showGeneratedContent = (content, userInfo, options = {}) => {
    const { emailSent = false, notice = '', reference = '' } = options;
    // contentが文字列の場合は、JSONとして解析を試行
    let parsedContent = content;
    if (typeof content === 'string') {
      try {
        // JSON形式の文字列を解析
        parsedContent = JSON.parse(content);
      } catch (error) {
        // JSONでない場合は、そのまま使用
        console.log('生成されたコンテンツはJSON形式ではありません:', content);
        parsedContent = {
          serviceOverview: content,
          recommendedServices: '詳細なサービス提案',
          expectedEffects: '期待される効果',
          implementationSteps: '導入ステップ',
          supportSystem: 'サポート体制',
          riskManagement: 'リスク管理',
          investmentReturn: '投資対効果',
          additionalRequirementsResponse: userInfo.additionalRequirements ? `${userInfo.additionalRequirements}への対応` : 'ご要望への対応'
        };
      }
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-900">AI資料生成完了</h2>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>
          ${buildNoticeBanner({ emailSent, notice, reference, email: userInfo.email })}
          <div class="space-y-6">
            ${Object.entries(parsedContent).map(([key, value]) => `
              <div class="border-l-4 border-blue-500 pl-4">
                <h3 class="font-semibold text-lg text-gray-900 mb-2">${escapeHtml(getSectionTitle(key))}</h3>
                <div class="text-gray-700 whitespace-pre-line">${escapeHtml(typeof value === 'string' ? value : JSON.stringify(value, null, 2))}</div>
              </div>
            `).join('')}
          </div>
          <div class="mt-6 flex justify-end space-x-4">
            <button onclick="window.print()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">印刷</button>
            <button onclick="this.closest('.fixed').remove()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">閉じる</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  // セクションタイトル取得
  const getSectionTitle = (key) => {
    const titles = {
      serviceOverview: 'サービス概要',
      recommendedServices: '推奨サービス',
      expectedEffects: '期待される効果',
      implementationSteps: '導入ステップ',
      supportSystem: 'サポート体制',
      riskManagement: 'リスク管理',
      investmentReturn: '投資対効果',
      additionalRequirementsResponse: 'ご要望への対応'
    };
    return titles[key] || key;
  };

  // チャットモーダルを開く関数
  const openChatModal = () => {
    setChatModalOpen(true);
  };

  // AIチャット相談ボタンのクリックハンドラー
  const handleAIChatConsultation = () => {
    setChatModalOpen(true);
  };

  // お問い合わせボタンのクリックハンドラー
  const handleContact = () => {
    setContactModalOpen(true);
  };

  // 面談予約ボタンのクリックハンドラー
  const handleAppointmentBooking = () => {
    setAppointmentModalOpen(true);
  };

  // 認証されていないユーザーでもサイトにアクセス可能
  return (
    <div className="min-h-screen bg-gradient-healthcare text-gray-900 scrollbar-thin relative overflow-hidden">
      {/* パーティクルエフェクト */}
            {particles.map((particle) => (
              <div
                key={`particle-${particle.id}`}
                className="particle"
                style={{
                  left: `${particle.left}%`,
                  animationDelay: `${particle.animationDelay}s`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`
                }}
              />
            ))}

      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-white/20 shadow-glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* ロゴは 96px あると横幅を圧迫してナビが折り返すため、下層ページと同じ 64px に揃えている */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="metallic-container flex h-16 w-16 items-center justify-center rounded-full text-white font-bold text-xl shadow-lg">
              <img src="/PC.png" alt="須藤技術士事務所" className="h-12 w-12 object-contain logo-float relative z-10" />
            </div>
            <span className="whitespace-nowrap text-sm font-bold gradient-text">須藤技術士事務所</span>
          </div>
          {/*
            項目名は途中で折り返さない（whitespace-nowrap）。
            7 項目すべてが並ぶのは lg 以上。md では入りきらないので、
            スクロールでたどれるページ内アンカー（サービス / ブログ / お問い合わせ）を先に落とし、
            別ページへの導線だけを残す。
          */}
          <nav className="hidden md:flex items-center gap-x-3 xl:gap-x-4 2xl:gap-x-5 text-[13px] text-gray-700">
            <a href="#features" className="hidden whitespace-nowrap hover:text-healthcare-600 transition-colors duration-200 hover-lift lg:inline">サービス</a>
            <a href="#blog" className="hidden whitespace-nowrap hover:text-healthcare-600 transition-colors duration-200 hover-lift lg:inline">ブログ・ニュース</a>
            <a href="#contact" className="hidden whitespace-nowrap hover:text-healthcare-600 transition-colors duration-200 hover-lift lg:inline">お問い合わせ</a>
            <Link to="/process" className="whitespace-nowrap hover:text-healthcare-600 transition-colors duration-200 hover-lift">開発の進め方</Link>
            <Link to="/coding-agents" className="whitespace-nowrap hover:text-healthcare-600 transition-colors duration-200 hover-lift">AI開発講習</Link>
            {/* 実装中に引く資料。開発者が常時たどれるようヘッダに出す */}
            <Link to="/react-manual" className="whitespace-nowrap hover:text-healthcare-600 transition-colors duration-200 hover-lift">開発マニュアル</Link>
            <button
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="whitespace-nowrap hover:text-healthcare-600 transition-colors duration-200 hover-lift"
            >
              利用手順
            </button>
          </nav>
          {/* ログイン・新規登録はナビが入りきる xl 以上でのみ並べる。狭い幅では問い合わせを優先する */}
          <div className="flex shrink-0 items-center gap-2">
            {false ? (
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-[13px] text-gray-700 hidden md:inline-flex">
                  こんにちは、ユーザーさん
                </span>
                <button
                  onClick={() => {}}
                  className="btn-secondary btn-compact whitespace-nowrap"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setLoginModalOpen(true);
                  }}
                  className="btn-secondary btn-compact whitespace-nowrap hidden xl:inline-flex"
                >
                  ログイン
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setRegisterModalOpen(true);
                  }}
                  className="btn-secondary btn-compact whitespace-nowrap hidden xl:inline-flex"
                >
                  新規登録
                </button>
              </>
            )}
            {/* サイトの主目的は問い合わせ獲得なので、常時表示の主ボタンにする */}
            <button onClick={handleContact} className="btn-gradient btn-compact whitespace-nowrap">
              お問い合わせ
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-healthcare-200 blur-3xl opacity-60 animate-float"/>
        <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-accent-amber blur-3xl opacity-60 animate-float" style={{animationDelay: '2s'}}/>
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 md:grid-cols-2">
          <div className="animate-fade-in-left">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Badge variant="success">技術士資格保有</Badge>
              <Badge variant="info">30年以上の実績</Badge>
              {/* 「24時間サポート」は裏付けのない表示だったため削除した。
                  掲げるなら site.ts の受付時間と一致させること。 */}
            </div>
            <h1 className="section-title mobile-title text-4xl md:text-6xl font-extrabold leading-tight">
              IT技術で、<span className="gradient-text">ビジネスを変革する。</span>
            </h1>
            <p className="mobile-text mt-6 text-lg md:text-xl text-gray-700 leading-relaxed max-w-2xl">
              須藤技術士事務所は、生成AIの業務導入、業務システムの開発、レガシーシステムの移行を手がける
              ITコンサルティング事務所です。公開中の開発実績と講習資料で、実際の成果物をご確認いただけます。
            </p>
          </div>

          {/* Right: Lead Form */}
          <div className="relative animate-fade-in-right">
            <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-gray-100/50 animate-slide-in-bottom p-8 border border-gray-100">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 p-4 text-blue-600 shadow-lg">
                  <IconPhone className="h-8 w-8"/>
                </div>
                <div className="text-xl font-bold text-gray-900">ITサービス資料ダウンロード（無料）</div>
              </div>
              <form onSubmit={onSubmit} className="space-y-6">
                {/* 選択肢は data/industries.ts に集約している。
                    バックエンドの INDUSTRY_LABELS とキーを揃えること。 */}
                <Select label="業種" name="industry" required options={INDUSTRY_OPTIONS} />
                <Input label="会社名" name="companyName" placeholder="例）株式会社〇〇" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="部署" name="dept" placeholder="例）IT部" />
                  <Input label="役職" name="role" placeholder="例）部長" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="姓" name="lastName" placeholder="山田" required />
                  <Input label="名" name="firstName" placeholder="太郎" required />
                </div>
                <Input type="email" label="メールアドレス" name="email" placeholder="you@example.com" required />
                <div className="form-group">
                  <label className="form-label">
                    追加要件・ご要望
                  </label>
                  <textarea
                    name="additionalRequirements"
                    placeholder="具体的なご要望、技術要件、予算、スケジュールなどをお聞かせください"
                    className="form-input min-h-[100px] resize-y"
                    rows="4"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  AI資料を生成（無料）
                </button>
                <p className="text-sm text-gray-500 text-center">送信により、プライバシーポリシーに同意したものとみなされます。</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 relative">
              提供サービス
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              生成AIの業務導入から、既存システムの移行、開発チームの支援まで。
              いずれも公開中の開発実績・講習資料で内容をご確認いただけます。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<IconUsers className="h-8 w-8"/>}
              title="生成AI・AIエージェント開発"
              desc="RAG・LLM を業務に組み込み、人が確認できる形で自動化する。"
              onClick={() => setSelectedFeature(featureData.aiSolution)}
              imageUrl={FEATURE_PHOTOS.aiSolution.photo}
              imageBg="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600"
            />
            <FeatureCard
              icon={<IconPhone className="h-8 w-8"/>}
              title="業務システム・Webアプリ開発"
              desc="要件整理から公開まで、実際に動くところまで持っていく。"
              onClick={() => setSelectedFeature(featureData.systemDevelopment)}
              imageUrl={FEATURE_PHOTOS.systemDevelopment.photo}
              imageBg="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700"
            />
            <FeatureCard
              icon={<IconClock className="h-8 w-8"/>}
              title="データ活用・分析基盤"
              desc="集める・貯める・使うまでを一続きで設計する。"
              onClick={() => setSelectedFeature(featureData.dataPlatform)}
              imageUrl={FEATURE_PHOTOS.dataPlatform.photo}
              imageBg="bg-gradient-to-br from-green-400 via-green-500 to-emerald-600"
            />
            <FeatureCard
              icon={<IconShield className="h-8 w-8"/>}
              title="クラウド基盤・運用"
              desc="Docker と CI/CD で、壊れたらすぐ戻せる状態にする。"
              onClick={() => setSelectedFeature(featureData.cloudPlatform)}
              imageUrl={FEATURE_PHOTOS.cloudPlatform.photo}
              imageBg="bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600"
            />
            <FeatureCard
              icon={<IconClock className="h-8 w-8"/>}
              title="レガシー移行・モダナイゼーション"
              desc="止められない既存システムを、段階的に置き換える。"
              onClick={() => setSelectedFeature(featureData.legacyMigration)}
              imageUrl={FEATURE_PHOTOS.legacyMigration.photo}
              imageBg="bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600"
            />
            <FeatureCard
              icon={<IconUsers className="h-8 w-8"/>}
              title="コーディングエージェント導入支援"
              desc="Codex / Claude Code を、現場が使える形で定着させる。"
              onClick={() => setSelectedFeature(featureData.teamEnablement)}
              imageUrl={FEATURE_PHOTOS.teamEnablement.photo}
              imageBg="bg-gradient-to-br from-slate-500 via-slate-600 to-gray-700"
            />
          </div>

          {/* サービスの中身は別ページで公開している。ここから直接たどれるようにする */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link to="/process" className="btn-secondary">開発の進め方を見る</Link>
            <Link to="/coding-agents" className="btn-secondary">AI開発講習を見る</Link>
            <a href="#portfolio" className="btn-secondary">開発実績を見る</a>
          </div>
        </div>
      </section>

      {/* Portfolio - Development Achievements */}
      <section id="portfolio" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 relative">
              開発実績
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">多様な業界・規模のシステム開発実績をご紹介します。各プロジェクトの詳細な技術仕様と成果をお示しします。</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "SaaS対応FXツール",
                description: "マルチテナント対応の為替分析・自動売買支援プラットフォーム",
                detailedDescription: "SaaS 形式で提供する FX 分析ツール。リアルタイムレート配信、チャート分析、シグナル通知、テナントごとの権限管理を実装。",
                url: "https://fx-production-f5d5.up.railway.app/",
                image: "bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700",
                imageUrl: "/portfolio/fx-saas.png",
                icon: "\u{1F4C8}",
                tech: ["Python", "FastAPI", "PostgreSQL", "WebSocket", "Railway"],
                features: ["リアルタイムレート", "チャート分析", "シグナル通知", "マルチテナント"],
                industry: "金融・FinTech",
                duration: "3ヶ月",
                team: "1名"
              },
              {
                title: "エネルギーリソースアグリゲーション",
                description: "分散型電源を束ねて需給調整を行うVPPプラットフォーム",
                detailedDescription: "太陽光・蓄電池などの分散型エネルギーリソースを統合制御するアグリゲーションシステム。発電予測、需給バランス最適化、実績レポートを実装。",
                url: "https://renewableenergy-production-8368.up.railway.app/",
                image: "bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700",
                imageUrl: "/portfolio/energy-aggregation.png",
                icon: "\u26A1",
                tech: ["Python", "時系列解析", "PostgreSQL", "REST API", "Railway"],
                features: ["発電予測", "需給最適化", "遠隔制御", "実績レポート"],
                industry: "エネルギー",
                duration: "4ヶ月",
                team: "1名"
              },
              {
                title: "領収書 自動データ化システム",
                description: "OCRで領収書を読み取り、会計ソフトへ自動連携",
                detailedDescription: "紙・PDFの領収書をOCRで構造化データに変換し、勘定科目を自動推定して会計ソフトへ連携。手入力を大幅に削減する経理向けシステム。",
                url: "https://ocr-production-0e14.up.railway.app/",
                image: "bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-700",
                imageUrl: "/portfolio/receipt-ocr.png",
                icon: "\u{1F9FE}",
                tech: ["Python", "OCR", "生成AI", "会計API連携", "PostgreSQL"],
                features: ["OCR読み取り", "勘定科目の自動推定", "会計ソフト連携", "仕訳出力"],
                industry: "会計・バックオフィス",
                duration: "3ヶ月",
                team: "1名"
              },
              {
                title: "AI × WordPress 自動化ワークフロー",
                description: "Codexが生成したHTMLをClaude Code経由でWordPressへ自動実装",
                detailedDescription: "Codex(AI)によるHTML生成から、Claude Code を介した WordPress への実装・公開までを自動化するワークフロー。記事作成から公開までの工数を削減。",
                url: "https://wpaipublisher-production.up.railway.app/guide",
                image: "bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700",
                imageUrl: "/portfolio/wp-ai-publisher.png",
                icon: "\u{1F916}",
                tech: ["Codex", "Claude Code", "WordPress REST API", "Python", "自動化"],
                features: ["HTML自動生成", "AIによる実装", "WordPress自動投稿", "公開フロー自動化"],
                industry: "メディア・DX",
                duration: "2ヶ月",
                team: "1名"
              },
              {
                title: "株価予測・SNS運用AIエージェント",
                description: "株価予測とSNS投稿を自律実行するAIエージェント",
                detailedDescription: "市場データから株価を予測し、分析結果をもとにSNS投稿までを自律的に実行するAIエージェント。情報収集・分析・発信のサイクルを自動化。",
                url: "https://stockpriceppredictiontool-production.up.railway.app/",
                image: "bg-gradient-to-br from-amber-600 via-rose-600 to-pink-700",
                imageUrl: "/portfolio/ai-agent-stock.png",
                icon: "\u{1F9E0}",
                tech: ["Python", "機械学習", "LLM", "SNS API", "スケジューラ"],
                features: ["株価予測", "自動投稿", "エージェント制御", "実績可視化"],
                industry: "金融・マーケティング",
                duration: "3ヶ月",
                team: "1名"
              },
              {
                title: "生成AIサービスのクラウド基盤",
                description: "GCP/AWS上での生成AIサービス基盤の設計・構築",
                detailedDescription: "Amazon Bedrock のナレッジベースを中核とした生成AIサービスのクラウド基盤。RAG構成、権限設計、監視・コスト最適化までを含む基盤構築。",
                url: "https://bedrockknowledgebase-production.up.railway.app",
                image: "bg-gradient-to-br from-cyan-700 via-blue-700 to-indigo-800",
                imageUrl: "/portfolio/cloud-infra.png",
                icon: "\u2601\uFE0F",
                tech: ["AWS Bedrock", "GCP", "IaC", "RAG", "監視・コスト最適化"],
                features: ["クラウド基盤設計", "RAG構成", "権限設計", "監視/コスト最適化"],
                industry: "クラウド・生成AI",
                duration: "4ヶ月",
                team: "1名"
              },
              {
                title: "ChatGPT Skillsカタログアプリ",
                description: "業務で使えるSkillsを一覧・検索できるパイロット版アプリ",
                detailedDescription: "ChatGPT の Skills を業務単位でカタログ化し、検索・比較・導入判断ができるアプリケーション（パイロット）。社内での活用促進を目的とする。",
                url: "https://chatgptskillscatalog-production.up.railway.app/",
                image: "bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700",
                imageUrl: "/portfolio/skills-catalog.png",
                icon: "\u{1F4DA}",
                tech: ["Python", "FastAPI", "PostgreSQL", "全文検索", "Railway"],
                features: ["Skills一覧", "検索・絞り込み", "詳細比較", "導入ガイド"],
                industry: "社内DX・生成AI",
                duration: "1ヶ月",
                team: "1名"
              },
              {
                title: "D2C Marketing Automation",
                description: "D2C事業者向けの顧客獲得・育成を自動化する基盤",
                detailedDescription: "D2C事業者向けのマーケティングオートメーション。顧客セグメント作成、シナリオ配信、効果測定までを一気通貫で実行できる基盤。",
                url: "https://d2c-marketing-automation-production.up.railway.app/",
                image: "bg-gradient-to-br from-pink-600 via-fuchsia-600 to-violet-700",
                imageUrl: "/portfolio/d2c-marketing.png",
                icon: "\u{1F4E3}",
                tech: ["Python", "FastAPI", "PostgreSQL", "メール配信", "分析基盤"],
                features: ["顧客セグメント", "シナリオ配信", "効果測定", "ダッシュボード"],
                industry: "D2C・マーケティング",
                duration: "3ヶ月",
                team: "1名"
              },
              {
                title: "技術継承プラットフォーム",
                description: "製造現場の保全実績をRAGで検索・継承できるナレッジ基盤",
                detailedDescription: "Excel・日報・PDFの保全実績データをPostgreSQL + pgvectorに集約し、LangChain・LlamaIndexによるベクトル＋キーワードのハイブリッドRAG検索でベテランの知見継承とトラブルシューティングを支援するプラットフォーム。",
                url: "https://technologysuccession-production.up.railway.app/",
                image: "bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-700",
                imageUrl: "/portfolio/technology-succession.png",
                icon: "\u{1F3ED}",
                tech: ["Python", "FastAPI", "LangChain", "LlamaIndex", "pgvector"],
                features: ["保全実績のデータ化", "ハイブリッドRAG検索", "トラブルシューティング支援", "ベテラン知見の継承"],
                industry: "製造業",
                duration: "1ヶ月",
                team: "1名"
              }
            ].map((project, index) => {
              const imageState = imageLoadStates[index] || { loaded: false, error: false };
              const showImage = project.imageUrl && imageState.loaded && !imageState.error;
              
              return (
                <button 
                  key={`project-${project.title}-${index}`} 
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 hover:border-blue-200 transition-all duration-500 hover:scale-105 cursor-pointer overflow-hidden w-full text-left" 
                  onClick={() => window.open(project.url, '_blank')}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      window.open(project.url, '_blank');
                    }
                  }}
                  aria-label={`${project.title}の詳細を見る`}
                >
                  <div className={`h-64 rounded-t-2xl ${project.image} flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
                    {project.imageUrl && (
                      <img 
                        src={project.imageUrl} 
                        alt={project.title} 
                        /* display:none にすると loading="lazy" が発火せず永久に読み込まれないため、不透明度で切り替える */
                        className={`absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${showImage ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => handleImageLoad(index)}
                        onError={() => handleImageError(index)}
                      />
                    )}
                    <div className={`text-white text-6xl font-bold opacity-90 z-10 group-hover:scale-110 transition-transform duration-500 ${showImage ? 'hidden' : 'block'}`}>
                      {project.icon}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-gray-700 text-sm font-medium">{project.industry}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-gray-700 text-sm font-medium">詳細を見る</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors duration-300">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed text-base group-hover:text-gray-700 transition-colors duration-300">
                      {project.description}
                    </p>
                    <div className="mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{project.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{project.team}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.features.slice(0, 3).map((feature, featureIndex) => (
                          <span key={`feature-${feature}-${featureIndex}`} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                            {feature}
                          </span>
                        ))}
                        {project.features.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
                            +{project.features.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tech.map((tech, techIndex) => (
                        <span key={`tech-${tech}-${techIndex}`} className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm rounded-full font-medium border border-blue-200">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      プロジェクト詳細
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 相談導線（お問い合わせ / 面談予約 / チャット / 電話） */}
      <section id="contact" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100 scroll-mt-24">
        <div className="mx-auto max-w-4xl px-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-center shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ご相談は無料です
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              技術士がお話をうかがい、進め方と概算をその場でお伝えします。
              {siteInfo.businessHours ? `受付時間: ${siteInfo.businessHours}` : ''}
            </p>

            <div className="flex flex-col md:flex-row flex-wrap gap-4 justify-center items-center">
              <button
                onClick={handleContact}
                className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="フォームからお問い合わせ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                お問い合わせ
              </button>

              <button
                onClick={handleAppointmentBooking}
                className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-600 transition-colors duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="面談予約で詳細相談"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                面談予約
              </button>

              <button
                onClick={handleAIChatConsultation}
                className="bg-white/15 text-white ring-1 ring-white/40 px-6 py-3 rounded-lg font-semibold hover:bg-white/25 transition-colors duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="AIチャットで質問する"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                AIチャットで質問
              </button>

              {/* 電話は実在の番号が設定されているときだけ出す（config/site.ts） */}
              {hasPhone() && (
                <a
                  href={telHref()}
                  className="bg-white/15 text-white ring-1 ring-white/40 px-6 py-3 rounded-lg font-semibold hover:bg-white/25 transition-colors duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  title={`電話で相談 (${siteInfo.tel})`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {siteInfo.tel}
                </a>
              )}
            </div>

            <p className="mt-6 text-sm text-white/80">
              AIチャットの回答は生成AIによるものです。内容の確認が必要な場合はお問い合わせください。
            </p>
          </div>
        </div>
      </section>

      {/* Blog & News */}
      <section id="blog" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 relative">
              ブログ・ニュース
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">最新のITトレンドと技術情報をお届けします。</p>
          </div>
          
          {/* スライドコンテナ */}
          <div className="relative">
            {/* 左矢印 */}
            <button
              onClick={prevBlogSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200"
              aria-label="前のカテゴリ"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 右矢印 */}
            <button
              onClick={nextBlogSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200"
              aria-label="次のカテゴリ"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* スライド表示エリア */}
            <div className="mx-16 overflow-hidden">
              <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentBlogSlide * 100}%)` }}>
                {blogCategories.map((category, index) => (
                    <div key={`blog-${category.key}-${index}`} className="w-full flex-shrink-0 px-4">
                      {/* カード全体を <button> にすると、記事一覧のボタンが入れ子になり
                          DOM として不正になる（React も警告を出す）。
                          カードは div にして、操作は下の「カテゴリ詳細」ボタンに持たせる。 */}
                      <div
                        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 hover:border-blue-200 transition-all duration-500 hover:scale-105 overflow-hidden w-full text-left"
                      >
                  <div className={`h-56 rounded-t-2xl ${category.image} flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
                    {category.imageUrl && (
                      <img 
                        src={category.imageUrl} 
                        alt={category.title} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-gray-700 text-sm font-medium">{category.title}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-gray-700 text-sm font-medium">詳細を見る</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors duration-300">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed text-base group-hover:text-gray-700 transition-colors duration-300">
                      {category.description}
                    </p>
                    <div className="space-y-3 mb-4">
                      {category.articles.map((article, articleIndex) => (
                          <div key={`article-${article.title}-${articleIndex}`} className="group/article">
                            <button
                              onClick={() => handleArticleClick(article, category)}
                              className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-blue-600 transition-colors duration-300 w-full text-left hover:bg-gray-50 p-2 rounded-lg"
                            >
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                              <span className="flex-1">{article.title}</span>
                              <svg className="w-4 h-4 opacity-0 group-hover/article:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBlog(category)}
                      className="flex items-center text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors duration-300"
                      aria-label={`${category.title}の記事一覧を見る`}
                    >
                      カテゴリ詳細
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                    </div>
                ))}
              </div>
            </div>

            {/* インジケーター */}
            <div className="flex justify-center mt-8 space-x-2">
              {blogCategories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBlogSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentBlogSlide 
                      ? 'bg-blue-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`スライド ${index + 1} に移動`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Detail Modal */}
      <FeatureModal 
        isOpen={!!selectedFeature} 
        onClose={() => setSelectedFeature(null)} 
        feature={selectedFeature}
        onContact={handleContact} 
      />

      {/* Blog Detail Modal */}
      <BlogModal 
        isOpen={!!selectedBlog} 
        onClose={() => setSelectedBlog(null)} 
        blogCategory={selectedBlog}
        onArticleClick={handleArticleClick}
      />

      {/* Article Detail Modal */}
      <ArticleModal 
        isOpen={!!selectedArticle} 
        onClose={() => {
          setSelectedArticle(null);
          setSelectedArticleCategory(null);
        }} 
        article={selectedArticle}
        categoryInfo={selectedArticleCategory}
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="metallic-container flex h-24 w-24 items-center justify-center rounded-full text-white font-bold text-xl shadow-lg">
                <img src="/PC.png" alt="須藤技術士事務所" className="w-30 h-30 object-contain logo-float relative z-10" />
              </div>
              <span className="text-sm font-bold gradient-text">須藤技術士事務所</span>
            </div>
            <p className="text-gray-300 max-w-md">IT技術でビジネスを変革する。生成AIの業務導入、業務システム開発、レガシー移行、クラウド基盤の構築、開発チームの支援を行っています。</p>
            {/* 連絡先は config/site.ts が唯一の情報源。未設定の項目は表示しない。 */}
            <dl className="mt-4 space-y-1 text-sm text-gray-300">
              {siteInfo.address && (
                <div className="flex gap-2">
                  <dt className="text-gray-400">所在地</dt>
                  <dd>{[siteInfo.postalCode && `〒${siteInfo.postalCode}`, siteInfo.address].filter(Boolean).join(' ')}</dd>
                </div>
              )}
              {hasPhone() && (
                <div className="flex gap-2">
                  <dt className="text-gray-400">電話</dt>
                  <dd><a href={telHref()} className="hover:text-white transition-colors">{siteInfo.tel}</a></dd>
                </div>
              )}
              {hasEmail() && (
                <div className="flex gap-2">
                  <dt className="text-gray-400">メール</dt>
                  <dd><a href={`mailto:${siteInfo.email}`} className="hover:text-white transition-colors">{siteInfo.email}</a></dd>
                </div>
              )}
              {siteInfo.businessHours && (
                <div className="flex gap-2">
                  <dt className="text-gray-400">受付</dt>
                  <dd>{siteInfo.businessHours}</dd>
                </div>
              )}
            </dl>
            </div>
            <div>
              <h3 className="font-semibold mb-4">サービス</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#features" className="hover:text-white transition-colors">生成AI・AIエージェント開発</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">業務システム・Webアプリ開発</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">データ活用・分析基盤</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">クラウド基盤・運用</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">レガシー移行・モダナイゼーション</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">コーディングエージェント導入支援</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#contact" className="hover:text-white transition-colors">お問い合わせ</a></li>
                <li>
                  <button
                    type="button"
                    onClick={() => setUsageGuideOpen(true)}
                    className="hover:text-white transition-colors"
                  >
                    利用手順
                  </button>
                </li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">開発実績</a></li>
                <li><Link to="/process" className="hover:text-white transition-colors">開発の進め方</Link></li>
                <li><Link to="/coding-agents" className="hover:text-white transition-colors">AI開発講習</Link></li>
                <li><Link to="/react-manual" className="hover:text-white transition-colors">開発マニュアル</Link></li>
                <li><a href="#blog" className="hover:text-white transition-colors">ブログ・ニュース</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© {new Date().getFullYear()} 須藤技術士事務所. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400 mt-4 md:mt-0">
              <Link to="/legal#terms" className="hover:text-white transition-colors">利用規約</Link>
              <Link to="/legal#privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
              <Link to="/legal#tokushoho" className="hover:text-white transition-colors">特定商取引法に基づく表記</Link>
              <Link to="/legal#business" className="hover:text-white transition-colors">事業者情報</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 left-6 z-50 animate-bounce-gentle">
        {chatOpen && (
          <div className="mb-4 w-80 card-modern shadow-2xl animate-slide-in-bottom">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-lg">サポート</div>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-4">ご不明点はありませんか？資料請求や導入のご相談を承ります。</p>
            <button onClick={openChatModal} className="btn-gradient w-full">チャットを開始</button>
          </div>
        )}
        <button 
          onClick={() => setChatOpen((v) => !v)} 
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover-lift"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900/90 text-white shadow-lg hover:bg-gray-900 transition-all duration-300 hover:scale-110 hover-lift"
          aria-label="Back to top"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* 認証モーダル */}
      <AuthModal 
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        mode="login"
      />
      
      <AuthModal 
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        mode="register"
      />

          {/* チャットモーダル */}
          <ChatModal 
            isOpen={chatModalOpen}
            onClose={() => setChatModalOpen(false)}
          />

          {/* 面談予約モーダル */}
          <AppointmentModal
            isOpen={appointmentModalOpen}
            onClose={() => setAppointmentModalOpen(false)}
          />

          {/* お問い合わせモーダル（/api/contact に接続） */}
          <ContactModal
            isOpen={contactModalOpen}
            onClose={() => setContactModalOpen(false)}
          />

          {/* 利用手順（送信後に何が起きるかをまとめたもの） */}
          <UsageGuideModal
            isOpen={usageGuideOpen}
            onClose={() => setUsageGuideOpen(false)}
          />
    </div>
  );
}

// カスタムCSSスタイル
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-8px) rotate(2deg); }
    50% { transform: translateY(-12px) rotate(0deg); }
    75% { transform: translateY(-8px) rotate(-2deg); }
  }
  
  @keyframes glow-pulse {
    0%, 100% { 
      box-shadow: 
        0 0 20px rgba(59, 130, 246, 0.5),
        0 0 40px rgba(59, 130, 246, 0.3),
        inset 0 0 20px rgba(255, 255, 255, 0.1);
    }
    50% { 
      box-shadow: 
        0 0 30px rgba(59, 130, 246, 0.8),
        0 0 60px rgba(59, 130, 246, 0.5),
        inset 0 0 30px rgba(255, 255, 255, 0.2);
    }
  }
  
  .logo-float {
    animation: float 4s ease-in-out infinite;
    transition: all 0.3s ease;
  }
  
  .logo-float:hover {
    transform: scale(1.1) rotate(5deg);
    filter: drop-shadow(0 12px 24px rgba(14, 165, 233, 0.6));
  }
  
  .metallic-container {
    background: linear-gradient(135deg, 
      rgba(148, 163, 184, 0.9) 0%,
      rgba(71, 85, 105, 0.95) 25%,
      rgba(30, 41, 59, 0.9) 50%,
      rgba(15, 23, 42, 0.95) 75%,
      rgba(2, 6, 23, 0.9) 100%
    );
    border: 2px solid rgba(59, 130, 246, 0.6);
    box-shadow: 
      0 0 20px rgba(59, 130, 246, 0.4),
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    animation: glow-pulse 3s ease-in-out infinite;
    position: relative;
    overflow: hidden;
  }
  
  .metallic-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.05) 50%, transparent 70%);
    pointer-events: none;
  }
  
  .metallic-container::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%,
      rgba(0, 0, 0, 0.1) 100%
    );
    border-radius: inherit;
    pointer-events: none;
  }
`;

// スタイルをDOMに追加
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}