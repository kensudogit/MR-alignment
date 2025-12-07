import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import AuthModal from './AuthModal';
import ChatModal from './ChatModal';
import AppointmentModal from './AppointmentModal';
import PhoneCallModal from './PhoneCallModal';
import { useAuth } from '../contexts/AuthContext';

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

// --- Blog Data ---
const blogData = {
  trends: {
    title: "トレンド",
    description: "最新のITトレンドと市場動向を分析",
    image: "bg-gradient-to-br from-blue-400 to-indigo-500",
    icon: "📈",
    articles: [
      {
        title: "2024年の主要ITトレンド",
        content: "2024年はAI技術の急速な発展、量子コンピューティングの実用化、エッジコンピューティングの普及が主要トレンドとして注目されています。特に生成AIの企業導入が加速し、業務効率化とイノベーション創出の両面で大きな影響を与えています。\n\n【主要トレンド詳細】\n• 生成AI（ChatGPT、Claude、Gemini）の企業導入率が前年比300%増加\n• 量子コンピューティングの商用化が本格開始\n• エッジコンピューティング市場が年率25%で成長\n• 5G/6G技術の実用化による新サービス創出\n• メタバース・Web3技術の実用化進展\n\n【企業への影響】\nこれらのトレンドは企業の競争優位性に直接影響を与え、早期導入企業と後発企業の格差が拡大する可能性があります。技術投資の優先順位付けと段階的な導入戦略が重要です。"
      },
      {
        title: "AI技術の最新動向",
        content: "大規模言語モデル（LLM）の進化により、自然言語処理の精度が飛躍的に向上。マルチモーダルAI、自律AIエージェント、AI倫理とガバナンスの重要性が高まっています。企業ではAI活用による業務自動化と意思決定支援が急速に普及しています。\n\n【技術的進歩】\n• GPT-4、Claude-3、Gemini Proの性能向上\n• マルチモーダルAI（テキスト、画像、音声の統合処理）\n• 自律AIエージェントの実用化\n• リアルタイム学習と適応的AIシステム\n• 量子機械学習の研究進展\n\n【実用化事例】\n• カスタマーサポートの完全自動化（回答精度95%以上）\n• 医療診断支援システム（診断精度向上30%）\n• 金融リスク分析（予測精度向上40%）\n• 製造業の品質管理自動化（不良品検出率99.5%）\n\n【課題と対策】\nAI倫理、データプライバシー、説明可能性の確保が重要課題となっており、企業はAIガバナンス体制の構築が急務です。"
      },
      {
        title: "クラウド市場の成長予測",
        content: "クラウド市場は2024年も継続的な成長が見込まれており、特にハイブリッドクラウドとマルチクラウド戦略が主流となっています。サーバーレスアーキテクチャ、コンテナ技術、マイクロサービス化が企業のデジタル変革を支える重要な要素となっています。\n\n【市場予測】\n• 世界クラウド市場：2024年で5,000億ドル（前年比20%増）\n• 日本市場：1.2兆円（前年比18%増）\n• ハイブリッドクラウド採用率：企業の85%が導入検討\n• マルチクラウド戦略：大企業の70%が採用\n\n【技術トレンド】\n• サーバーレスコンピューティングの普及（年率35%成長）\n• Kubernetesによるコンテナオーケストレーション\n• マイクロサービスアーキテクチャの標準化\n• エッジコンピューティングとの統合\n• クラウドネイティブセキュリティの重要性\n\n【企業戦略】\nコスト最適化、スケーラビリティ、セキュリティを両立するクラウド戦略の策定が競争優位性の鍵となります。"
      }
    ]
  },
  aiMl: {
    title: "AI/ML",
    description: "人工知能と機械学習の技術解説",
    image: "bg-gradient-to-br from-purple-400 to-pink-500",
    icon: "🤖",
    articles: [
      {
        title: "大規模言語モデルの活用事例",
        content: "GPT、Claude、Geminiなどの大規模言語モデルを活用した企業事例を紹介。カスタマーサポートの自動化、コンテンツ生成、コード生成、翻訳サービスなど、様々な分野での実用的な応用例を詳しく解説します。\n\n【主要LLM比較】\n• GPT-4: 創造性と推論能力に優れる（コーディング、ライティング）\n• Claude-3: 安全性と倫理性を重視（企業向けアプリケーション）\n• Gemini Pro: マルチモーダル処理に特化（画像・動画解析）\n• LLaMA 2: オープンソースでカスタマイズ可能\n\n【実用化事例】\n• カスタマーサポート：回答精度95%、対応時間50%短縮\n• コンテンツ生成：ブログ記事、マーケティング資料の自動生成\n• コード生成：GitHub Copilot、ChatGPT Code Interpreter\n• 翻訳サービス：リアルタイム多言語翻訳（精度98%）\n• 医療診断：症状分析と治療提案の支援\n\n【導入時の注意点】\n• データプライバシーの確保\n• ハルシネーション（虚偽情報生成）の対策\n• コスト管理（API利用料金の最適化）\n• セキュリティ対策（機密情報の漏洩防止）",
        url: "https://openai.com/blog",
        imageUrl: "/microservice.png"
      },
      {
        title: "機械学習アルゴリズムの比較",
        content: "教師あり学習、教師なし学習、強化学習の各アルゴリズムの特徴と適用場面を比較。回帰、分類、クラスタリング、次元削減などの手法について、実際のデータセットを使った性能評価と選択基準を説明します。\n\n【教師あり学習】\n• 線形回帰：予測精度85%、解釈しやすい\n• ランダムフォレスト：過学習に強く、特徴量重要度が分かる\n• サポートベクターマシン：高次元データに適している\n• ニューラルネットワーク：複雑な非線形関係を学習\n\n【教師なし学習】\n• K-meansクラスタリング：顧客セグメンテーションに活用\n• 主成分分析（PCA）：次元削減とデータ可視化\n• 階層クラスタリング：階層的なデータ構造の発見\n• 異常検知：Isolation Forest、One-Class SVM\n\n【強化学習】\n• Q-Learning：ゲームAI、ロボット制御\n• 深層強化学習：AlphaGo、自動運転\n• マルチエージェント強化学習：複数エージェントの協調\n\n【アルゴリズム選択指針】\nデータ量、特徴量数、解釈可能性、計算リソースを考慮して最適な手法を選択することが重要です。",
        imageUrl: "/microservice.png"
      },
      {
        title: "AI倫理とガバナンス",
        content: "AI技術の急速な発展に伴い、バイアス、プライバシー、透明性、説明可能性などの倫理的課題が重要になっています。企業におけるAI倫理フレームワークの構築とガバナンス体制の整備について、具体的な実装方法を解説します。\n\n【主要な倫理課題】\n• アルゴリズムバイアス：性別、人種、年齢による差別的判断\n• プライバシー侵害：個人データの不適切な利用\n• 説明可能性：AI判断の根拠が不明確\n• 責任の所在：AIによる判断の責任主体\n• 透明性：アルゴリズムの内部動作がブラックボックス\n\n【AI倫理フレームワーク】\n• 公平性：すべてのユーザーに公平なサービス提供\n• 透明性：AIシステムの動作原理の説明\n• 説明可能性：判断根拠の明確化\n• プライバシー：個人データの適切な保護\n• 安全性：AIシステムの信頼性確保\n\n【実装方法】\n• バイアス検出ツールの導入\n• 多様性のあるデータセットの使用\n• 定期的なAI監査の実施\n• 倫理委員会の設置\n• 従業員へのAI倫理教育\n\n【法的規制】\nEU AI Act、日本のAIガイドラインなど、各国の規制動向を踏まえた対応が必要です。",
        imageUrl: "/microservice.png"
      },
      {
        title: "【実装ガイド】RAGシステム構築の完全マニュアル：企業文書を活用したAI回答システム",
        content: "RAG（Retrieval-Augmented Generation）システムは、情報検索と生成AIを組み合わせて、企業の内部文書を活用した高精度な質問応答システムを構築する技術です。この記事では、Azureサービスを活用したRAGシステムの実装方法を詳しく解説します。\n\n【RAGシステムの基本構成】\n• 検索フェーズ：ユーザーの質問に関連する文書をベクトル検索で取得\n• 生成フェーズ：検索結果をコンテキストとしてLLMが回答を生成\n• データベース：文書をベクトル化して保存するベクトルデータベース\n• API：フロントエンドとバックエンドを連携するREST API\n\n【必要なAzureサービス】\n• Azure OpenAI：GPT-4やGPT-3.5-turboによる回答生成\n• Azure Cosmos DB：文書データの保存と管理\n• Azure Blob Storage：文書ファイルの保存\n• Azure App Service：APIサーバーのホスティング\n• Azure Cognitive Search：高度な検索機能（オプション）\n\n【実装の技術スタック】\n• バックエンド：Python + FastAPI\n• ベクトル化：sentence-transformers、OpenAI Embeddings\n• データベース：Azure Cosmos DB、Pinecone（代替案）\n• フロントエンド：React + TypeScript\n• デプロイ：Azure App Service、Vercel\n\n【実装手順】\n1. 環境構築：Python環境、Azure CLI、必要なライブラリのインストール\n2. データ準備：企業文書の収集、前処理、ベクトル化\n3. バックエンド開発：FastAPIによるAPI実装\n4. フロントエンド開発：ReactによるUI実装\n5. デプロイ：Azure App Serviceへのデプロイ\n\n【GitHubリポジトリ】\n詳細な実装例とサンプルコードは以下のリポジトリで確認できます：\nhttps://github.com/kensudogit/RagAzure\n\n【実装のポイント】\n• 文書の前処理：PDF、Word、テキストファイルの統一的な処理\n• ベクトル化の最適化：適切な埋め込みモデルの選択\n• 検索精度の向上：クエリ拡張、リランキングの実装\n• 回答品質の向上：プロンプトエンジニアリング、コンテキスト管理\n• セキュリティ：認証・認可、データ暗号化の実装\n\n【成功事例】\n• 企業ナレッジベース：社内文書検索の精度90%向上\n• カスタマーサポート：FAQ回答の自動化率80%達成\n• 技術文書管理：開発者向けドキュメント検索の効率化\n• 法務文書検索：契約書や規約の迅速な検索・回答生成\n\n【コスト最適化のポイント】\n• ベクトルデータベースの選択：Azure Cognitive Search vs Pinecone\n• API呼び出しの最適化：キャッシュ戦略、バッチ処理\n• ストレージコストの削減：データ圧縮、ライフサイクル管理\n• スケーリング戦略：オートスケーリング、コールドスタート対策",
        url: "https://github.com/kensudogit/RagAzure",
        imageUrl: "/microservice.png"
      },
      {
        title: "【実践編】MLOpsパイプライン構築：機械学習モデルの本格運用",
        content: "MLOps（Machine Learning Operations）は、機械学習モデルの開発から本番環境での運用までを効率化する手法です。この記事では、実際のプロジェクトで使用できるMLOpsパイプラインの構築方法を詳しく解説します。\n\n【MLOpsの基本概念】\n• 継続的インテグレーション（CI）：コードの自動テストとビルド\n• 継続的デプロイメント（CD）：モデルの自動デプロイ\n• モデル監視：本番環境での性能監視\n• データドリフト検知：データ分布の変化を検出\n• モデル再学習：性能劣化時の自動再学習\n\n【技術スタック】\n• バージョン管理：Git、DVC（Data Version Control）\n• 実験管理：MLflow、Weights & Biases\n• パイプライン：Apache Airflow、Kubeflow\n• コンテナ化：Docker、Kubernetes\n• 監視：Prometheus、Grafana、Evidently\n• クラウド：AWS SageMaker、Azure ML、GCP Vertex AI\n\n【実装手順】\n1. データパイプラインの構築\n2. モデル開発環境の整備\n3. 実験管理システムの導入\n4. 自動テストの実装\n5. CI/CDパイプラインの構築\n6. 本番環境へのデプロイ\n7. 監視・アラートの設定\n\n【ベストプラクティス】\n• データのバージョン管理\n• モデルの再現可能性確保\n• 自動テストの充実\n• 段階的デプロイメント\n• ロールバック戦略\n• セキュリティ対策\n\n【成功事例】\n• 予測精度の向上：継続的改善により15%向上\n• デプロイ時間の短縮：手動から自動化で90%短縮\n• 運用コストの削減：自動化により60%削減\n• データドリフトの早期検知：性能劣化を事前に防止",
        imageUrl: "/microservice.png"
      },
      {
        title: "【最新技術】コンピュータビジョンの実践的応用：YOLO v8からSegment Anythingまで",
        content: "コンピュータビジョン技術の最新動向と実践的な応用例を詳しく解説します。物体検出、画像分割、画像生成などの技術について、実際のプロジェクトでの活用方法を紹介します。\n\n【主要技術の比較】\n• YOLO v8：リアルタイム物体検出、精度と速度のバランス\n• Segment Anything Model（SAM）：高精度な画像分割\n• DALL-E 3：高品質な画像生成\n• Stable Diffusion：オープンソースの画像生成\n• CLIP：画像とテキストの理解\n\n【実装の技術スタック】\n• フレームワーク：PyTorch、TensorFlow、OpenCV\n• ライブラリ：Transformers、Diffusers、Ultralytics\n• クラウド：AWS Rekognition、Azure Computer Vision、GCP Vision API\n• エッジデバイス：NVIDIA Jetson、Intel Neural Compute Stick\n\n【実践的応用例】\n• 製造業：品質検査の自動化（不良品検出率99.5%）\n• 小売業：在庫管理の自動化（精度95%）\n• 医療：画像診断支援（診断精度向上30%）\n• 自動運転：物体検出と追跡（リアルタイム処理）\n• セキュリティ：顔認証と異常検知\n\n【実装のポイント】\n• データ前処理の最適化\n• モデルの軽量化技術\n• 推論速度の最適化\n• エッジデバイスでの実行\n• リアルタイム処理の実現\n\n【性能最適化】\n• 量子化：モデルサイズを75%削減\n• 蒸留：学習時間を50%短縮\n• プルーニング：不要な重みを削除\n• 最適化フレームワーク：TensorRT、ONNX Runtime",
        imageUrl: "/microservice.png"
      }
    ]
  },
  dxPromotion: {
    title: "DX推進",
    description: "デジタル変革の戦略と実践方法",
    image: "bg-gradient-to-br from-green-400 to-teal-500",
    icon: "🚀",
    articles: [
      {
        title: "DX成功のための組織変革",
        content: "デジタル変革を成功させるには、技術導入だけでなく組織文化の変革が不可欠です。アジャイル思考の浸透、データドリブンな意思決定、継続的学習文化の構築など、組織変革の具体的なステップと成功事例を紹介します。\n\n【組織変革の5つのステップ】\n1. 現状分析：デジタル成熟度の評価\n2. ビジョン策定：デジタル変革の目標設定\n3. 文化変革：マインドセットの転換\n4. スキル向上：デジタル人材の育成\n5. 継続改善：変革プロセスの定着\n\n【成功事例】\n• 製造業A社：デジタルファクトリー導入で生産性30%向上\n• 金融業B社：AI活用で顧客満足度25%向上\n• 小売業C社：オムニチャネル化で売上40%増加\n• 医療機関D：電子カルテ導入で業務効率50%改善\n\n【変革のポイント】\n• トップダウンとボトムアップの両立\n• 従業員の巻き込みとエンパワーメント\n• 失敗を許容する文化の醸成\n• 継続的な学習とスキルアップ\n• データドリブンな意思決定の定着"
      },
      {
        title: "デジタル化のROI測定",
        content: "DX投資の効果を定量的に測定するためのKPI設計と評価手法を解説。コスト削減、売上向上、業務効率化、顧客満足度向上など、多角的な指標によるROI測定の実践方法とベンチマークを提供します。\n\n【主要KPI指標】\n• 財務指標：売上高、利益率、コスト削減率\n• 業務効率：処理時間短縮、自動化率、エラー率\n• 顧客満足：NPS、CSAT、リピート率\n• 従業員満足：エンゲージメント、離職率、生産性\n• イノベーション：新商品開発期間、特許取得数\n\n【ROI計算方法】\n• 投資回収期間（Payback Period）\n• 内部収益率（IRR）\n• 正味現在価値（NPV）\n• 総所有コスト（TCO）\n• 投資対効果（ROI）\n\n【測定のベストプラクティス】\n• ベースラインの確立\n• 定期的な測定と評価\n• 部門別・プロジェクト別の詳細分析\n• 外部ベンチマークとの比較\n• 長期的な視点での評価\n\n【成功事例のROI】\n• システム導入：平均ROI 300%（3年後）\n• 業務自動化：コスト削減率40%\n• データ活用：売上向上率25%\n• 顧客体験向上：リピート率30%向上"
      },
      {
        title: "アジャイル開発の導入",
        content: "アジャイル開発手法の導入による開発効率の向上と品質改善について詳しく解説。スクラム、カンバン、DevOpsの組み合わせによる継続的デリバリーの実現方法と、チーム運営のベストプラクティスを紹介します。\n\n【アジャイル手法の比較】\n• スクラム：2-4週間のスプリント、役割分担明確\n• カンバン：フロー重視、継続的改善\n• スクラムバン：スクラムとカンバンのハイブリッド\n• SAFe：大規模組織向けスケーラブルアジャイル\n• LeSS：大規模スクラムの実践方法\n\n【DevOps実践】\n• CI/CDパイプラインの構築\n• インフラストラクチャ・アズ・コード\n• モニタリングとログ管理\n• セキュリティの左シフト\n• クラウドネイティブ開発\n\n【導入効果】\n• 開発速度：従来比2-3倍の高速化\n• 品質向上：バグ発生率50%削減\n• 顧客満足：フィードバック反映時間80%短縮\n• チーム生産性：開発効率40%向上\n• リリース頻度：月次から週次・日次へ\n\n【成功のポイント】\n• 経営層のコミットメント\n• チームの教育とトレーニング\n• ツールとプロセスの整備\n• 継続的な改善文化\n• 顧客との密接な連携"
      }
    ]
  },
  security: {
    title: "セキュリティ",
    description: "サイバーセキュリティの最新情報",
    image: "bg-gradient-to-br from-red-400 to-orange-500",
    icon: "🔒",
    articles: [
      {
        title: "ゼロトラストセキュリティの実装",
        content: "「信頼しない、常に検証する」を基本原則とするゼロトラストセキュリティモデルの実装方法を解説。アイデンティティ認証、デバイス管理、ネットワーク分離、データ保護の各要素について、具体的な実装手順とベストプラクティスを紹介します。\n\n【ゼロトラストの7つの原則】\n1. 明示的な検証：すべてのアクセスを検証\n2. 最小権限の原則：必要最小限の権限のみ付与\n3. 侵害を想定：常に侵害されている前提で設計\n4. 継続的監視：リアルタイムでの監視と分析\n5. 自動化：セキュリティプロセスの自動化\n6. データ中心：データの保護を最優先\n7. ネットワーク分離：セグメンテーションの実装\n\n【実装のステップ】\n• 現状のセキュリティ状況の評価\n• アイデンティティとアクセス管理（IAM）の強化\n• 多要素認証（MFA）の導入\n• ネットワークセグメンテーション\n• エンドポイントセキュリティの強化\n• データ暗号化の実装\n• 継続的な監視とログ分析\n\n【導入効果】\n• セキュリティインシデントの90%削減\n• データ漏洩リスクの80%軽減\n• コンプライアンス要件の100%達成\n• セキュリティ運用コストの30%削減\n• インシデント対応時間の70%短縮"
      },
      {
        title: "脅威インテリジェンスの活用",
        content: "サイバー脅威の早期発見と対応のための脅威インテリジェンスの活用方法を解説。IOC（Indicators of Compromise）の収集・分析、脅威ハンティング、インシデント対応の自動化など、実践的なセキュリティ運用について詳しく説明します。\n\n【脅威インテリジェンスの種類】\n• 戦略的脅威インテリジェンス：長期的な脅威動向\n• 戦術的脅威インテリジェンス：攻撃手法とTTPs\n• 技術的脅威インテリジェンス：IOCとマルウェア情報\n• 運用脅威インテリジェンス：即座の対応に必要な情報\n\n【IOC（侵害指標）の種類】\n• IPアドレス：悪意のあるサーバーのIP\n• ドメイン名：フィッシングサイトのドメイン\n• ファイルハッシュ：マルウェアのハッシュ値\n• URL：悪意のあるWebサイトのURL\n• メールアドレス：スパム送信者のアドレス\n\n【脅威ハンティング手法】\n• ログ分析：異常なアクセスパターンの検出\n• ネットワーク監視：不審な通信の特定\n• エンドポイント分析：マルウェアの検出\n• 行動分析：ユーザーの異常な行動の特定\n• 機械学習：AIを活用した脅威検出\n\n【実装ツール】\n• SIEM（Security Information and Event Management）\n• SOAR（Security Orchestration, Automation and Response）\n• 脅威インテリジェンスプラットフォーム\n• サンドボックス環境\n• フォレンジックツール"
      },
      {
        title: "インシデント対応のベストプラクティス",
        content: "サイバーセキュリティインシデント発生時の効果的な対応手順と体制構築について解説。インシデント検知、初期対応、エスカレーション、復旧作業、事後分析の各フェーズにおける具体的な対応方法とチェックリストを提供します。\n\n【インシデント対応の6つのフェーズ】\n1. 準備：体制構築と計画策定\n2. 検知・分析：インシデントの特定と影響評価\n3. 封じ込め：被害拡大の防止\n4. 根絶：脅威の完全除去\n5. 復旧：システムの正常化\n6. 事後対応：教訓の整理と改善\n\n【対応チームの構成】\n• インシデント対応マネージャー：全体統括\n• セキュリティアナリスト：技術的対応\n• 法務・コンプライアンス：法的対応\n• 広報・コミュニケーション：外部対応\n• IT運用：システム復旧\n• 経営層：意思決定\n\n【対応手順の詳細】\n• 即座の対応：被害拡大の防止（30分以内）\n• 初期分析：影響範囲の特定（1時間以内）\n• エスカレーション：関係者への報告（2時間以内）\n• 封じ込め：脅威の隔離（4時間以内）\n• 根絶：完全な除去（24時間以内）\n• 復旧：正常な運用再開（72時間以内）\n\n【成功事例】\n• 平均検知時間：15分（業界平均：287日）\n• 平均対応時間：4時間（業界平均：73日）\n• 被害額：平均90%削減\n• 再発防止：99%の効果"
      }
    ]
  },
  cloud: {
    title: "クラウド",
    description: "クラウド技術とベストプラクティス",
    image: "bg-gradient-to-br from-cyan-400 to-blue-500",
    icon: "☁️",
    articles: [
      {
        title: "マルチクラウド戦略の設計",
        content: "AWS、Azure、GCPなどの複数クラウドプロバイダーを活用するマルチクラウド戦略の設計と実装方法を解説。ベンダーロックインの回避、コスト最適化、可用性向上、災害復旧などの観点から、効果的なマルチクラウド環境の構築方法を紹介します。\n\n【マルチクラウドのメリット】\n• ベンダーロックインの回避：特定ベンダーへの依存度を下げる\n• コスト最適化：各ベンダーの強みを活用したコスト削減\n• 可用性向上：複数リージョンでの冗長化\n• 災害復旧：地理的分散によるリスク軽減\n• 規制対応：データ主権要件への対応\n\n【主要クラウドプロバイダーの特徴】\n• AWS：豊富なサービス、エンタープライズ向け\n• Azure：Microsoft製品との統合、ハイブリッドクラウド\n• GCP：AI/ML、データ分析に強み\n• Alibaba Cloud：アジア太平洋地域に強み\n• IBM Cloud：エンタープライズ・セキュリティ重視\n\n【設計のポイント】\n• ワークロードの特性に応じた配置\n• データの移動コストの最小化\n• セキュリティとコンプライアンスの確保\n• 運用管理の統一化\n• 災害復旧計画の策定\n\n【成功事例】\n• コスト削減：平均30%のコスト削減\n• 可用性向上：99.99%のSLA達成\n• 災害復旧：RTO 4時間、RPO 1時間\n• スケーラビリティ：需要変動への柔軟対応"
      },
      {
        title: "サーバーレスアーキテクチャの活用",
        content: "サーバーレスコンピューティングを活用したアプリケーション開発のベストプラクティスを解説。Lambda、Azure Functions、Cloud Functionsなどの各プラットフォームの特徴と使い分け、コスト最適化、パフォーマンス向上の手法について詳しく説明します。\n\n【サーバーレスの特徴】\n• サーバー管理不要：インフラの管理から解放\n• 自動スケーリング：需要に応じた自動拡張\n• 従量課金：実際の使用量に応じた課金\n• イベント駆動：トリガーに基づく実行\n• マイクロサービス：小さな機能単位での開発\n\n【主要プラットフォーム比較】\n• AWS Lambda：最大15分実行、豊富な統合\n• Azure Functions：最大10分実行、.NET最適化\n• Google Cloud Functions：最大9分実行、GCP統合\n• Vercel Functions：フロントエンド最適化\n• Netlify Functions：静的サイトとの統合\n\n【設計パターン】\n• イベント駆動アーキテクチャ\n• CQRS（Command Query Responsibility Segregation）\n• Saga パターン：分散トランザクション\n• Circuit Breaker：障害の伝播防止\n• Bulkhead：障害の隔離\n\n【最適化手法】\n• コールドスタートの最小化\n• メモリとタイムアウトの最適化\n• 依存関係の最小化\n• キャッシュの活用\n• 非同期処理の実装\n\n【適用事例】\n• API ゲートウェイ：認証・認可\n• データ処理：ETL、リアルタイム分析\n• 通知システム：メール、SMS送信\n• 画像処理：リサイズ、変換\n• IoT データ処理：センサーデータの集約"
      },
      {
        title: "クラウドコスト最適化",
        content: "クラウド利用コストを効果的に削減するための戦略と手法を解説。リソースの適正サイジング、予約インスタンスの活用、スポットインスタンスの利用、ライフサイクル管理など、実践的なコスト最適化の方法を紹介します。\n\n【コスト最適化の7つの原則】\n1. 可視化：コストの透明性確保\n2. 最適化：リソースの適正化\n3. 自動化：コスト管理の自動化\n4. 監視：継続的なコスト監視\n5. 予測：将来のコスト予測\n6. 統制：コスト管理のガバナンス\n7. 改善：継続的な最適化\n\n【主要な最適化手法】\n• リソースの適正サイジング：CPU、メモリ、ストレージの最適化\n• 予約インスタンス：長期利用での大幅割引（最大75%）\n• スポットインスタンス：中断可能なワークロードでの利用\n• ライフサイクル管理：不要リソースの自動削除\n• ストレージ階層化：アクセス頻度に応じた最適化\n• データ転送最適化：CDN、圧縮の活用\n\n【コスト監視ツール】\n• AWS Cost Explorer：詳細なコスト分析\n• Azure Cost Management：コスト予算とアラート\n• Google Cloud Billing：リアルタイムコスト監視\n• サードパーティツール：CloudHealth、Cloudability\n• カスタムダッシュボード：Grafana、Tableau\n\n【成功事例】\n• コスト削減：平均40%のコスト削減\n• 予算管理：予算超過の90%削減\n• リソース効率：使用率の30%向上\n• 自動化：手動作業の80%削減\n• ROI：最適化投資の300%回収"
      }
    ]
  },
  blockchain: {
    title: "ブロックチェーン",
    description: "ブロックチェーン技術の応用事例",
    image: "bg-gradient-to-br from-yellow-400 to-amber-500",
    icon: "⛓️",
    articles: [
      {
        title: "【実装ガイド】Pythonで学ぶブロックチェーン技術：基本からDeFiまで完全解説",
        content: "ブロックチェーン技術をPythonで実装しながら学習する実践的なガイドです。基本的なブロックチェーンの仕組みから、スマートコントラクト、DeFiプロトコルまで、実際に動くコードと共に詳しく解説します。\n\n【ブロックチェーンの基本構造】\n• ブロック：トランザクションの集合体\n• ハッシュ：データの整合性を保証\n• プルーフ・オブ・ワーク：コンセンサスアルゴリズム\n• 分散ネットワーク：P2P通信による分散管理\n• 暗号化：公開鍵暗号によるセキュリティ\n\n【実装する機能】\n• 基本的なブロックチェーン：ブロック生成・検証\n• トランザクション処理：送金・受信の管理\n• ウォレット機能：鍵生成・署名・検証\n• マイニング：プルーフ・オブ・ワークの実装\n• ネットワーク：P2P通信による分散化\n• スマートコントラクト：自動実行される契約\n• DeFiプロトコル：流動性プール・AMM\n\n【技術スタック】\n• Python 3.9+\n• cryptography：暗号化ライブラリ\n• hashlib：ハッシュ関数\n• requests：HTTP通信\n• threading：並行処理\n• sqlite3：データベース\n\n【実装例】\n```python\n# 基本的なブロッククラス\n@dataclass\nclass Block:\n    index: int\n    timestamp: float\n    transactions: List[Transaction]\n    previous_hash: str\n    nonce: int = 0\n    hash: str = \"\"\n    \n    def calculate_hash(self) -> str:\n        block_string = f\"{self.index}{self.timestamp}{self.previous_hash}{self.nonce}\"\n        for tx in self.transactions:\n            block_string += tx.calculate_hash()\n        return hashlib.sha256(block_string.encode()).hexdigest()\n```\n\n【学習効果】\n• ブロックチェーンの仕組みを深く理解\n• 暗号技術の実践的活用\n• 分散システムの設計思想\n• セキュリティの重要性\n• 新しい経済システムの理解\n\n【応用分野】\n• 暗号通貨：Bitcoin、Ethereum\n• DeFi：分散型金融プロトコル\n• NFT：非代替性トークン\n• サプライチェーン：トレーサビリティ\n• 投票システム：透明性のある選挙\n• 身元証明：デジタルID\n\n【GitHubリポジトリ】\n詳細な実装例とサンプルコードは以下のリポジトリで確認できます：\nhttps://github.com/kensudogit/blockchain-samples\n\n【実践的な学習方法】\n1. 基本ブロックチェーンの実装\n2. ウォレット機能の追加\n3. マイニング機能の実装\n4. ネットワーク機能の追加\n5. スマートコントラクトの実装\n6. DeFiプロトコルの構築\n\n【セキュリティのポイント】\n• ハッシュ関数の適切な使用\n• 暗号化アルゴリズムの選択\n• プライベートキーの管理\n• トランザクションの検証\n• ネットワーク攻撃への対策",
        imageUrl: "/microservice.png"
      },
      {
        title: "【実装ガイド】NFTマーケットプレイス構築：ERC-721からメタデータ管理まで",
        content: "NFT（Non-Fungible Token）マーケットプレイスの構築方法をPythonで実装しながら学習する実践的なガイドです。OpenSeaのようなマーケットプレイスの核心機能を理解し、実際に動くシステムを構築します。\n\n【NFTの基本概念】\n• 非代替性：各トークンがユニーク\n• 所有権：ブロックチェーン上での証明\n• メタデータ：画像・動画・音楽などの情報\n• ロイヤリティ：二次販売時の手数料\n• インターポラビリティ：異なるプラットフォーム間での互換性\n\n【NFT標準の比較】\n• ERC-721：1対1のユニークトークン（CryptoPunks、Bored Ape）\n• ERC-1155：1対多のマルチトークン（ゲームアイテム）\n• ERC-4907：レンタル可能なNFT\n• ERC-6551：NFTアカウント（ウォレット機能）\n• ERC-2981：ロイヤリティ標準\n\n【実装する機能】\n• NFT発行（ミント）機能\n• メタデータ管理（IPFS連携）\n• マーケットプレイス機能\n• オークションシステム\n• ロイヤリティ機能\n• バンドル取引\n• 検索・フィルタリング\n• ユーザー管理\n\n【メタデータ構造】\n```json\n{\n  \"name\": \"My NFT\",\n  \"description\": \"A unique digital asset\",\n  \"image\": \"ipfs://QmHash...\",\n  \"attributes\": [\n    {\"trait_type\": \"Color\", \"value\": \"Blue\"},\n    {\"trait_type\": \"Rarity\", \"value\": \"Legendary\"}\n  ],\n  \"external_url\": \"https://example.com/nft/1\",\n  \"background_color\": \"000000\"\n}\n```\n\n【実装例】\n```python\nclass NFTMarketplace:\n    def __init__(self):\n        self.nfts = {}\n        self.listings = {}\n        self.auctions = {}\n    \n    def mint_nft(self, creator: str, metadata: dict) -> str:\n        token_id = str(uuid.uuid4())\n        self.nfts[token_id] = {\n            'creator': creator,\n            'owner': creator,\n            'metadata': metadata,\n            'created_at': time.time()\n        }\n        return token_id\n    \n    def list_nft(self, token_id: str, price: float, seller: str):\n        if token_id in self.nfts and self.nfts[token_id]['owner'] == seller:\n            self.listings[token_id] = {\n                'price': price,\n                'seller': seller,\n                'listed_at': time.time()\n            }\n    \n    def buy_nft(self, token_id: str, buyer: str, price: float):\n        if token_id in self.listings and self.listings[token_id]['price'] <= price:\n            # 所有権を移転\n            self.nfts[token_id]['owner'] = buyer\n            # ロイヤリティを計算\n            royalty = self.calculate_royalty(token_id, price)\n            # 売上を分配\n            self.distribute_sale(token_id, price, royalty)\n            # リスティングを削除\n            del self.listings[token_id]\n```\n\n【主要マーケットプレイス】\n• OpenSea：最大手、多様なNFTを扱う\n• Blur：トレーダー向け、高機能\n• Magic Eden：Solanaチェーン特化\n• Foundation：クリエイター向け\n• SuperRare：高品質アート特化\n• Rarible：コミュニティ主導\n\n【収益モデル】\n• 取引手数料：2.5-5%（OpenSea 2.5%）\n• ミント手数料：固定料金（ガス代別）\n• ロイヤリティ：二次販売時の継続手数料\n• プレミアム機能：優先表示・特別機能\n• 広告収入：プロモーション枠\n• データ販売：トレンド・分析情報\n\n【技術的課題】\n• ガス最適化：トランザクションコストの削減\n• スケーラビリティ：大量取引への対応\n• メタデータ管理：IPFS・Arweaveの活用\n• 検索機能：効率的なインデックス\n• セキュリティ：偽造・盗用の防止\n• ユーザビリティ：直感的な操作\n\n【IPFS連携】\n• 分散ストレージ：メタデータの永続化\n• ピンサービス：Pinata、Infura\n• ガス最適化：メタデータの外部保存\n• 可用性：複数ノードでの冗長化\n• 検証：ハッシュによる整合性確認\n\n【ロイヤリティシステム】\n• ERC-2981：標準化されたロイヤリティ\n• 自動分配：スマートコントラクトによる実行\n• 柔軟な設定：トークンごとの異なる率\n• 透明性：ブロックチェーン上での追跡\n• 永続性：二次販売以降も継続\n\n【市場動向】\n• 市場規模：500億ドル（2023年）\n• 取引量：日次1億ドル\n• ユーザー数：月間100万人\n• コレクション数：10万以上\n• チェーン数：15以上",
        imageUrl: "/microservice.png"
      },
      {
        title: "【実装ガイド】ブロックチェーン分析とデータサイエンス：チェーンデータの活用",
        content: "ブロックチェーンデータを分析し、ビジネスインサイトを得るためのデータサイエンス手法を実践的に学習するガイドです。Python、Pandas、NumPy、機械学習ライブラリを使った分析から、可視化、予測モデル構築まで、実際のプロジェクトで使用できる技術を身につけます。\n\n【ブロックチェーンデータの特徴】\n• 透明性：すべての取引が公開\n• 不変性：データの改ざんが困難\n• リアルタイム：継続的に更新\n• 大量データ：日次数百万トランザクション\n• 複雑性：多様なプロトコル・トークン\n\n【分析対象データ】\n• トランザクションデータ：送金・受信履歴\n• ブロックデータ：ブロック生成・マイニング\n• スマートコントラクト：関数呼び出し・イベント\n• ウォレットデータ：アドレス・残高・活動\n• DeFiデータ：流動性・取引量・APY\n• NFTデータ：ミント・転送・売買\n\n【実装する機能】\n• データ取得：API・ノードからの取得\n• データクリーニング：欠損値・異常値処理\n• 特徴量エンジニアリング：新しい特徴量の作成\n• 可視化：グラフ・チャート・ダッシュボード\n• 機械学習：予測・分類・クラスタリング\n• 時系列分析：トレンド・周期性の分析\n• ネットワーク分析：アドレス間の関係\n\n【実装例】\n```python\nclass BlockchainAnalyzer:\n    def __init__(self, api_key: str):\n        self.api_key = api_key\n        self.base_url = 'https://api.etherscan.io/api'\n    \n    def get_transactions(self, address: str, start_block: int, end_block: int):\n        params = {\n            'module': 'account',\n            'action': 'txlist',\n            'address': address,\n            'startblock': start_block,\n            'endblock': end_block,\n            'sort': 'asc',\n            'apikey': self.api_key\n        }\n        \n        response = requests.get(self.base_url, params=params)\n        data = response.json()\n        \n        if data['status'] == '1':\n            return pd.DataFrame(data['result'])\n        else:\n            raise Exception(f'API Error: {data[\"message\"]}')\n```\n\n【分析手法】\n• 記述統計：平均・中央値・標準偏差\n• 時系列分析：ARIMA・LSTM・Prophet\n• クラスタリング：K-means・DBSCAN\n• 異常検知：Isolation Forest・One-Class SVM\n• ネットワーク分析：PageRank・中心性\n• テキスト分析：感情分析・トピックモデリング\n\n【ツール・ライブラリ】\n• データ取得：Web3.py、Etherscan API\n• データ処理：Pandas、NumPy\n• 可視化：Matplotlib、Seaborn、Plotly\n• 機械学習：Scikit-learn、XGBoost、TensorFlow\n• 時系列：Prophet、Statsmodels\n• ネットワーク：NetworkX、Gephi\n\n【ビジネス応用】\n• リスク管理：不正取引の検出\n• 投資分析：価格予測・ポートフォリオ最適化\n• マーケティング：ユーザー行動分析\n• コンプライアンス：規制要件への対応\n• 研究開発：新機能・プロトコルの評価\n\n【市場動向】\n• データサイエンティスト数：1万人以上\n• 分析ツール数：100以上\n• 市場規模：10億ドル\n• 求人需要：年率50%成長\n• 平均年収：15万ドル",
        imageUrl: "/microservice.png"
      }
    ]
  },
  nocode: {
    title: "ノーコード開発",
    description: "ノーコード・ローコードプラットフォームの技術解説",
    image: "bg-gradient-to-br from-orange-400 to-red-500",
    icon: "🚀",
    articles: [
      {
        title: "【実装ガイド】ノーコード開発プラットフォーム構築：Web・モバイル・メタバース・VR/AR対応",
        content: "ノーコード開発プラットフォームをPythonで実装しながら学習する実践的なガイドです。ドラッグ&ドロップエディタ、コンポーネントライブラリ、リアルタイムプレビュー、コード生成、デプロイメント自動化まで、実際に動くシステムを構築します。\n\n【ノーコードプラットフォームの基本概念】\n• ドラッグ&ドロップエディタ：直感的なUIでアプリケーションを構築\n• コンポーネントライブラリ：再利用可能なUI要素の集約\n• リアルタイムプレビュー：変更を即座に確認できる機能\n• コード生成：視覚的設計から実際のコードを自動生成\n• マルチプラットフォーム対応：Web、モバイル、メタバース、VR/AR\n\n【実装する機能】\n• プロジェクト管理：複数プロジェクトの作成・管理\n• コンポーネントシステム：ボタン、テキスト、画像、フォームなど\n• レイアウトエンジン：フレックスボックス、グリッドレイアウト\n• スタイル管理：CSS-in-JS、テーマシステム\n• イベント処理：クリック、ホバー、フォーカスイベント\n• データバインディング：コンポーネント間のデータ連携\n• 状態管理：アプリケーション状態の一元管理\n• ルーティング：ページ間の遷移管理\n• 認証・認可：ユーザー管理とアクセス制御\n• デプロイメント：Docker、Kubernetes、クラウドへの自動デプロイ\n\n【技術スタック】\n• バックエンド：Python + FastAPI + SQLAlchemy\n• フロントエンド：React + TypeScript + Tailwind CSS\n• データベース：PostgreSQL + Redis\n• コンテナ：Docker + Kubernetes + Helm\n• 3D・VR・AR：Three.js + A-Frame + WebXR\n• AI・ML：OpenAI API + LangChain + Transformers\n• Web3：Web3.py + Ethereum + IPFS\n• 監視：Prometheus + Grafana + Sentry\n\n【実装例】\n```python\nclass NoCodeEditor:\n    def __init__(self):\n        self.projects: Dict[str, Project] = {}\n        self.components: Dict[str, Component] = {}\n        self.ai_engine = AIOrchestrationEngine()\n        self.web3_integration = Web3Integration()\n        self.deployment_manager = DeploymentManager()\n    \n    def create_project(self, name: str, platform_type: PlatformType) -> str:\n        project_id = str(uuid.uuid4())\n        project = Project(\n            id=project_id,\n            name=name,\n            platform_type=platform_type,\n            components=[],\n            created_at=datetime.now(),\n            updated_at=datetime.now()\n        )\n        self.projects[project_id] = project\n        return project_id\n    \n    def add_component(self, project_id: str, component_type: ComponentType, \n                     properties: Dict[str, Any], position: Dict[str, float]) -> str:\n        component_id = str(uuid.uuid4())\n        component = Component(\n            id=component_id,\n            type=component_type,\n            name=f\"{component_type.value}_{component_id[:8]}\",\n            properties=properties,\n            position=position,\n            size={\"width\": 100, \"height\": 50}\n        )\n        self.components[component_id] = component\n        self.projects[project_id].components.append(component_id)\n        return component_id\n```\n\n【プラットフォーム対応】\n• Webアプリケーション：HTML5 + CSS3 + JavaScript\n• モバイルアプリ：React Native + Expo\n• メタバース空間：Three.js + WebXR\n• VRアプリケーション：A-Frame + WebXR\n• ARアプリケーション：AR.js + WebXR\n• デスクトップアプリ：Electron + Tauri\n\n【AI支援機能】\n• コンポーネント提案：プロジェクト文脈に基づく自動提案\n• レイアウト最適化：AIによる自動レイアウト調整\n• コンテンツ生成：AIによるテキスト・画像・動画生成\n• コード最適化：生成されたコードの自動最適化\n• バグ検出：AIによる潜在的な問題の検出\n• パフォーマンス分析：アプリケーション性能の自動分析\n\n【Web3統合】\n• NFTコレクション：デジタルアセットの作成・管理\n• 仮想通貨ウォレット：暗号通貨の送受信機能\n• DAO管理：分散自律組織の運営支援\n• DID認証：分散IDによる認証システム\n• スマートコントラクト：自動実行される契約の実装\n• メタバース連携：仮想空間でのアセット利用\n\n【デプロイメント自動化】\n• GitOps：ArgoCDによる自動デプロイ\n• CI/CD：GitHub Actions + Docker + Kubernetes\n• 環境管理：開発・ステージング・本番環境の自動構築\n• スケーリング：負荷に応じた自動スケーリング\n• 監視：Prometheus + Grafanaによる包括的監視\n• ログ管理：ELK Stackによるログ分析\n\n【GitHubリポジトリ】\n詳細な実装例とサンプルコードは以下のリポジトリで確認できます：\nhttps://github.com/kensudogit/noCodeDevelopmentPlatform\n\n【実践的な学習方法】\n1. 基本エディタの実装\n2. コンポーネントシステムの構築\n3. レイアウトエンジンの開発\n4. コード生成機能の実装\n5. AI支援機能の統合\n6. Web3連携の実装\n7. デプロイメント自動化の構築\n\n【市場動向】\n• 市場規模：2024年で150億ドル（年率25%成長）\n• ユーザー数：世界で500万人以上の開発者\n• 企業採用率：Fortune 500企業の60%が導入\n• 開発効率：従来の開発時間を70%短縮\n• コスト削減：開発コストを50%削減\n\n【成功事例】\n• Webサイト構築：中小企業のWebサイトを1日で構築\n• モバイルアプリ：非技術者でもアプリを数時間で作成\n• メタバース空間：3D仮想空間を直感的に設計\n• 企業システム：内部ツールを迅速に開発・展開\n• プロトタイピング：アイデアを素早く形にする\n\n【将来の展望】\n• 自然言語プログラミング：言葉でアプリケーションを構築\n• 音声コントロール：音声でUIを操作\n• ジェスチャー認識：手の動きでアプリを制御\n• 脳波インターフェース：思考でアプリを操作\n• 量子コンピューティング：量子アルゴリズムの可視化\n• 自律開発：AIが完全に自律的にアプリを生成",
        imageUrl: "/microservice.png"
      },
      {
        title: "【実装ガイド】AIオーケストレーションエンジン：自己進化・自己複製システムの構築",
        content: "AIオーケストレーションエンジンは、複数のAIモデルを統合し、自己進化・自己複製機能を持つ自律的なシステムを構築する技術です。この記事では、Pythonを使った実装方法を詳しく解説します。\n\n【AIオーケストレーションの基本概念】\n• マルチエージェントシステム：複数のAIエージェントが協調して動作\n• 自己進化：システムが自身の性能を継続的に改善\n• 自己複製：システムが自身のコピーを作成・展開\n• 分散学習：複数ノードでの協調学習\n• 適応的制御：環境変化に応じた動的な調整\n\n【実装する機能】\n• エージェント管理：AIエージェントの作成・削除・監視\n• タスク分散：複雑なタスクを複数エージェントに分散\n• 学習統合：各エージェントの学習結果を統合\n• 進化アルゴリズム：遺伝的アルゴリズムによる最適化\n• 複製機能：成功したエージェントの自動複製\n• 通信プロトコル：エージェント間の情報交換\n• リソース管理：計算リソースの効率的な配分\n• 障害対応：エージェントの障害検出と復旧\n\n【技術スタック】\n• フレームワーク：LangChain + Transformers + PyTorch\n• 分散処理：Ray + Dask + Celery\n• 通信：gRPC + WebSocket + MQTT\n• データベース：MongoDB + Redis + InfluxDB\n• 監視：Prometheus + Grafana + Jaeger\n• コンテナ：Docker + Kubernetes + Helm\n• メッセージング：Apache Kafka + RabbitMQ\n• ストレージ：MinIO + S3 + HDFS\n\n【実装例】\n```python\nclass AIOrchestrationEngine:\n    def __init__(self):\n        self.agents: Dict[str, AIAgent] = {}\n        self.task_queue = asyncio.Queue()\n        self.learning_pipeline = LearningPipeline()\n        self.evolution_engine = EvolutionEngine()\n        self.replication_manager = ReplicationManager()\n    \n    async def create_agent(self, agent_type: str, capabilities: List[str]) -> str:\n        agent_id = str(uuid.uuid4())\n        agent = AIAgent(\n            id=agent_id,\n            type=agent_type,\n            capabilities=capabilities,\n            status=\"idle\"\n        )\n        self.agents[agent_id] = agent\n        await self._initialize_agent(agent)\n        return agent_id\n    \n    async def distribute_task(self, task: Task) -> List[str]:\n        suitable_agents = [\n            agent_id for agent_id, agent in self.agents.items()\n            if self._is_agent_suitable(agent, task)\n        ]\n        \n        if not suitable_agents:\n            # 新しいエージェントを作成\n            new_agent_id = await self.create_agent(\n                task.required_type, \n                task.required_capabilities\n            )\n            suitable_agents = [new_agent_id]\n        \n        # タスクを分散\n        subtasks = self._split_task(task, len(suitable_agents))\n        results = []\n        \n        for i, agent_id in enumerate(suitable_agents):\n            result = await self._assign_task(agent_id, subtasks[i])\n            results.append(result)\n        \n        return results\n    \n    async def evolve_system(self):\n        # システム全体の進化\n        performance_metrics = await self._collect_metrics()\n        \n        # 最適化の実行\n        optimized_config = self.evolution_engine.optimize(\n            performance_metrics\n        )\n        \n        # 設定の更新\n        await self._update_system_config(optimized_config)\n        \n        # 成功したエージェントの複製\n        successful_agents = self._identify_successful_agents()\n        for agent_id in successful_agents:\n            await self.replication_manager.replicate_agent(agent_id)\n```\n\n【自己進化の仕組み】\n• 遺伝的アルゴリズム：パラメータの最適化\n• 強化学習：環境との相互作用による学習\n• ニューラルアーキテクチャ検索：最適なネットワーク構造の発見\n• メタ学習：学習方法自体の学習\n• 転移学習：既存知識の活用\n• 継続学習：新しいタスクへの適応\n\n【自己複製の実装】\n• エージェントクローニング：成功したエージェントの複製\n• 分散展開：複数ノードへの自動展開\n• バージョン管理：複製されたエージェントの追跡\n• 品質保証：複製前の検証プロセス\n• リソース最適化：複製によるリソース使用量の最適化\n• 障害復旧：複製による冗長性の確保\n\n【分散学習システム】\n• フェデレーテッドラーニング：データを共有せずに学習\n• 分散勾配降下：複数ノードでの並列学習\n• 非同期学習：ノード間の非同期更新\n• 差分プライバシー：プライバシーを保護した学習\n• 圧縮通信：通信量を削減した学習\n• 動的参加：ノードの動的な参加・離脱\n\n【監視・管理システム】\n• リアルタイム監視：システム状態の継続的監視\n• パフォーマンス分析：各エージェントの性能評価\n• リソース使用量：CPU、メモリ、ネットワークの監視\n• 学習進捗：学習プロセスの可視化\n• 異常検知：システム異常の早期発見\n• 自動復旧：障害時の自動復旧処理\n\n【セキュリティ対策】\n• 認証・認可：エージェント間の安全な通信\n• 暗号化：データの暗号化と復号化\n• 監査ログ：すべての操作の記録\n• アクセス制御：リソースへのアクセス制限\n• 侵入検知：不正アクセスの検出\n• データ保護：機密データの保護\n\n【実用化事例】\n• 自動運転：複数センサーの統合と意思決定\n• ロボティクス：複数ロボットの協調制御\n• 金融取引：リアルタイム取引システム\n• 医療診断：複数AIモデルの統合診断\n• 製造業：品質管理と予知保全\n• エネルギー：スマートグリッドの制御\n\n【将来の展望】\n• 量子AI：量子コンピューティングとの統合\n• 脳波AI：脳波信号による直接制御\n• 感情AI：感情を理解するAIシステム\n• 創造AI：新しいアイデアを生み出すAI\n• 倫理AI：倫理的判断を行うAI\n• 超知能：人間を超える知能の実現",
        imageUrl: "/microservice.png"
      },
      {
        title: "【実装ガイド】Web3統合ノーコードプラットフォーム：NFT・DAO・DID・メタバース対応",
        content: "Web3技術を統合したノーコードプラットフォームの実装方法を詳しく解説します。NFT、DAO、DID、メタバースなどのWeb3要素を、プログラミング知識なしで利用できるプラットフォームを構築します。\n\n【Web3統合の基本概念】\n• 分散アプリケーション（DApp）：中央集権的なサーバーに依存しないアプリ\n• スマートコントラクト：自動実行される契約コード\n• 暗号通貨ウォレット：デジタル資産の管理\n• 分散ストレージ：IPFS、Arweaveによるデータ保存\n• 分散ID（DID）：自己主権的な身元管理\n• メタバース：3D仮想空間での活動\n\n【実装する機能】\n• NFTコレクション：デジタルアセットの作成・販売・管理\n• DAO管理：分散自律組織の運営支援\n• DID認証：分散IDによる認証システム\n• 仮想通貨ウォレット：暗号通貨の送受信\n• スマートコントラクト：自動実行される契約の実装\n• メタバース空間：3D仮想空間の構築\n• 分散ストレージ：IPFS連携によるファイル管理\n• クロスチェーン：複数ブロックチェーンの統合\n\n【技術スタック】\n• ブロックチェーン：Ethereum、Polygon、Solana、Arbitrum\n• スマートコントラクト：Solidity、Vyper、Rust\n• Web3ライブラリ：Web3.py、Ethers.js、Solana Web3.js\n• 分散ストレージ：IPFS、Arweave、Filecoin\n• ウォレット：MetaMask、WalletConnect、Phantom\n• 3D・VR：Three.js、A-Frame、Babylon.js\n• 認証：Cerbos、Auth0、Firebase Auth\n• 監視：The Graph、Alchemy、Moralis\n\n【実装例】\n```python\nclass Web3Integration:\n    def __init__(self):\n        self.w3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/YOUR_PROJECT_ID'))\n        self.ipfs_client = ipfshttpclient.connect()\n        self.nft_contracts = {}\n        self.dao_contracts = {}\n        self.did_registry = DIDRegistry()\n    \n    async def create_nft_collection(self, name: str, symbol: str, \n                                  max_supply: int, metadata_uri: str) -> str:\n        # NFTコレクションのスマートコントラクトをデプロイ\n        contract_code = self._generate_nft_contract(\n            name, symbol, max_supply, metadata_uri\n        )\n        \n        # コントラクトをデプロイ\n        contract_address = await self._deploy_contract(contract_code)\n        \n        # コントラクト情報を保存\n        self.nft_contracts[contract_address] = {\n            'name': name,\n            'symbol': symbol,\n            'max_supply': max_supply,\n            'metadata_uri': metadata_uri,\n            'created_at': datetime.now()\n        }\n        \n        return contract_address\n    \n    async def mint_nft(self, contract_address: str, to_address: str, \n                      metadata: Dict[str, Any]) -> str:\n        # メタデータをIPFSにアップロード\n        metadata_hash = await self._upload_to_ipfs(metadata)\n        \n        # NFTをミント\n        contract = self.w3.eth.contract(\n            address=contract_address,\n            abi=self._get_nft_abi()\n        )\n        \n        tx_hash = contract.functions.mint(\n            to_address, metadata_hash\n        ).transact({\n            'from': to_address,\n            'gas': 100000\n        })\n        \n        # トランザクションの確認を待つ\n        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)\n        \n        # NFT IDを取得\n        nft_id = contract.functions.totalSupply().call() - 1\n        \n        return str(nft_id)\n    \n    async def create_dao(self, name: str, description: str, \n                        governance_token: str) -> str:\n        # DAOのスマートコントラクトを生成\n        dao_contract = self._generate_dao_contract(\n            name, description, governance_token\n        )\n        \n        # コントラクトをデプロイ\n        dao_address = await self._deploy_contract(dao_contract)\n        \n        # DAO情報を保存\n        self.dao_contracts[dao_address] = {\n            'name': name,\n            'description': description,\n            'governance_token': governance_token,\n            'created_at': datetime.now(),\n            'members': [],\n            'proposals': []\n        }\n        \n        return dao_address\n    \n    async def create_did(self, user_address: str, public_key: str) -> str:\n        # DIDドキュメントを作成\n        did_document = {\n            '@context': 'https://www.w3.org/ns/did/v1',\n            'id': f'did:ethr:{user_address}',\n            'verificationMethod': [{\n                'id': f'did:ethr:{user_address}#controller',\n                'type': 'EcdsaSecp256k1RecoveryMethod2020',\n                'controller': f'did:ethr:{user_address}',\n                'publicKeyHex': public_key\n            }]\n        }\n        \n        # DIDを登録\n        did_id = await self.did_registry.register(\n            user_address, did_document\n        )\n        \n        return did_id\n```\n\n【NFTマーケットプレイス機能】\n• コレクション作成：ERC-721、ERC-1155対応\n• ミント機能：メタデータ付きNFTの作成\n• 販売機能：固定価格・オークション形式\n• ロイヤリティ：二次販売時の手数料\n• バンドル：複数NFTの一括取引\n• 検索・フィルタ：属性による検索機能\n• 統計情報：売上・取引履歴の表示\n\n【DAO管理機能】\n• ガバナンストークン：投票権の管理\n• 提案システム：改善提案の提出・投票\n• 財庫管理：DAO資金の管理\n• メンバー管理：参加者・権限の管理\n• 投票システム：透明性のある意思決定\n• 実行機能：承認された提案の自動実行\n\n【DID認証システム】\n• 分散ID：自己主権的な身元管理\n• 認証プロトコル：OAuth 2.0、OpenID Connect\n• 証明書：検証可能な証明書の発行\n• プライバシー保護：最小限の情報開示\n• 相互運用性：異なるシステム間での連携\n• 復旧機能：秘密鍵紛失時の復旧\n\n【メタバース統合】\n• 3D空間構築：Three.js、A-Frameによる3D環境\n• アバターシステム：カスタマイズ可能なアバター\n• 物理エンジン：リアルな物理演算\n• 音声チャット：空間音響による音声通信\n• アセット管理：3Dモデル・テクスチャの管理\n• インタラクション：オブジェクトとの相互作用\n• マルチプレイヤー：複数ユーザーの同時参加\n\n【分散ストレージ連携】\n• IPFS統合：分散ファイルシステム\n• メタデータ管理：NFTメタデータの保存\n• コンテンツ配信：CDN機能の提供\n• 冗長性：複数ノードでのデータ保存\n• 検索機能：ハッシュベースの検索\n• ピン機能：重要なデータの固定\n\n【セキュリティ対策】\n• ウォレット接続：安全なウォレット連携\n• トランザクション署名：秘密鍵による署名\n• スマートコントラクト監査：コードの安全性確認\n• アクセス制御：権限ベースのアクセス管理\n• 監査ログ：すべての操作の記録\n• 緊急停止：異常時の緊急停止機能\n\n【実用化事例】\n• NFTアートプラットフォーム：アーティスト向けNFT販売\n• DAO運営ツール：分散組織の管理支援\n• メタバースイベント：仮想空間でのイベント開催\n• ゲーム内経済：ゲーム内通貨・アイテムの管理\n• デジタル身分証：検証可能な身分証明書\n• 分散SNS：中央集権に依存しないSNS\n\n【将来の展望】\n• クロスチェーン統合：複数ブロックチェーンの完全統合\n• 量子耐性：量子コンピュータへの対応\n• レイヤー2統合：スケーラビリティの向上\n• 分散AI：AIモデルの分散学習・推論\n• 自律DAO：完全に自律的な組織運営\n• メタバース経済：仮想空間での経済活動",
        imageUrl: "/microservice.png"
      },
      {
        title: "【実装ガイド】Three.jsアセットプリセット：建物・木・キャラクターの3Dモデル管理",
        content: "Three.jsを使った3Dアセット管理システムの実装方法を詳しく解説します。建物、木、キャラクターなどの3Dモデルを効率的に管理し、ノーコードプラットフォームで活用できるシステムを構築します。\n\n【3Dアセット管理の基本概念】\n• 3Dモデル：建物、木、キャラクターなどの3Dオブジェクト\n• テクスチャ：モデルの表面に適用する画像\n• マテリアル：光の反射・屈折の特性\n• アニメーション：モデルの動きや変形\n• LOD（Level of Detail）：距離に応じた詳細度\n• インスタンシング：同じモデルの効率的な描画\n\n【実装する機能】\n• アセットライブラリ：3Dモデルの一覧・検索\n• プリセット管理：よく使うモデルの組み合わせ\n• リアルタイムプレビュー：3Dモデルの即座確認\n• カスタマイズ：色・サイズ・テクスチャの変更\n• アニメーション：モデルの動きの設定\n• 物理演算：重力・衝突の計算\n• 最適化：描画性能の最適化\n• エクスポート：他のプラットフォームへの出力\n\n【技術スタック】\n• 3Dエンジン：Three.js、Babylon.js、A-Frame\n• モデル形式：GLTF、FBX、OBJ、STL\n• テクスチャ：PNG、JPG、HDR、EXR\n• 圧縮：Draco、KTX2、Basis Universal\n• 物理エンジン：Cannon.js、Ammo.js、PhysX\n• アニメーション：Tween.js、GSAP、Mixamo\n• シェーダー：GLSL、WebGL、WebGPU\n• 最適化：Web Workers、OffscreenCanvas\n\n【実装例】\n```python\nclass ThreeJSAssetManager:\n    def __init__(self):\n        self.scene = None\n        self.camera = None\n        self.renderer = None\n        self.asset_library = {}\n        self.presets = {}\n        self.animations = {}\n        self.physics_world = None\n    \n    def initialize_scene(self, container_id: str):\n        # Three.jsシーンを初期化\n        self.scene = THREE.Scene()\n        self.camera = THREE.PerspectiveCamera(\n            75, window.innerWidth / window.innerHeight, 0.1, 1000\n        )\n        self.renderer = THREE.WebGLRenderer({ antialias: True })\n        self.renderer.setSize(window.innerWidth, window.innerHeight)\n        self.renderer.shadowMap.enabled = True\n        self.renderer.shadowMap.type = THREE.PCFSoftShadowMap\n        \n        # 物理エンジンを初期化\n        self.physics_world = new CANNON.World()\n        self.physics_world.gravity.set(0, -9.82, 0)\n        \n        # ライティングを設定\n        self._setup_lighting()\n        \n        # コントロールを設定\n        self.controls = new THREE.OrbitControls(\n            self.camera, self.renderer.domElement\n        )\n    \n    async def load_asset(self, asset_id: str, file_path: str, \n                        asset_type: str) -> Dict[str, Any]:\n        # アセットを読み込み\n        loader = self._get_loader(asset_type)\n        \n        if asset_type == 'gltf':\n            gltf = await loader.loadAsync(file_path)\n            model = gltf.scene\n            \n            # アニメーションを抽出\n            if gltf.animations:\n                self.animations[asset_id] = gltf.animations\n            \n            # 物理ボディを作成\n            physics_body = self._create_physics_body(model)\n            \n            # アセット情報を保存\n            self.asset_library[asset_id] = {\n                'model': model,\n                'physics_body': physics_body,\n                'type': asset_type,\n                'file_path': file_path,\n                'loaded_at': datetime.now()\n            }\n            \n            return {\n                'asset_id': asset_id,\n                'model': model,\n                'animations': gltf.animations,\n                'physics_body': physics_body\n            }\n    \n    def create_preset(self, preset_name: str, asset_ids: List[str], \n                     positions: List[Dict[str, float]]) -> str:\n        # プリセットを作成\n        preset_id = str(uuid.uuid4())\n        \n        preset = {\n            'id': preset_id,\n            'name': preset_name,\n            'assets': [],\n            'created_at': datetime.now()\n        }\n        \n        for i, asset_id in enumerate(asset_ids):\n            if asset_id in self.asset_library:\n                asset = self.asset_library[asset_id]\n                position = positions[i] if i < len(positions) else {'x': 0, 'y': 0, 'z': 0}\n                \n                preset['assets'].append({\n                    'asset_id': asset_id,\n                    'position': position,\n                    'rotation': {'x': 0, 'y': 0, 'z': 0},\n                    'scale': {'x': 1, 'y': 1, 'z': 1}\n                })\n        \n        self.presets[preset_id] = preset\n        return preset_id\n    \n    def instantiate_asset(self, asset_id: str, position: Dict[str, float], \n                         rotation: Dict[str, float] = None, \n                         scale: Dict[str, float] = None) -> str:\n        # アセットのインスタンスを作成\n        if asset_id not in self.asset_library:\n            raise ValueError(f\"アセット {asset_id} が見つかりません\")\n        \n        asset = self.asset_library[asset_id]\n        instance_id = str(uuid.uuid4())\n        \n        # モデルをクローン\n        instance = asset['model'].clone()\n        \n        # 位置・回転・スケールを設定\n        instance.position.set(\n            position.get('x', 0),\n            position.get('y', 0),\n            position.get('z', 0)\n        )\n        \n        if rotation:\n            instance.rotation.set(\n                rotation.get('x', 0),\n                rotation.get('y', 0),\n                rotation.get('z', 0)\n            )\n        \n        if scale:\n            instance.scale.set(\n                scale.get('x', 1),\n                scale.get('y', 1),\n                scale.get('z', 1)\n            )\n        \n        # シーンに追加\n        self.scene.add(instance)\n        \n        # 物理ボディを作成\n        physics_body = self._create_physics_body(instance)\n        self.physics_world.addBody(physics_body)\n        \n        return instance_id\n    \n    def animate_asset(self, instance_id: str, animation_name: str, \n                     loop: bool = True, speed: float = 1.0):\n        # アセットにアニメーションを適用\n        if instance_id not in self.instances:\n            raise ValueError(f\"インスタンス {instance_id} が見つかりません\")\n        \n        instance = self.instances[instance_id]\n        \n        if animation_name in self.animations:\n            animation = self.animations[animation_name]\n            \n            # アニメーションミキサーを作成\n            mixer = new THREE.AnimationMixer(instance)\n            action = mixer.clipAction(animation)\n            \n            # アニメーションを設定\n            action.setLoop(THREE.LoopRepeat if loop else THREE.LoopOnce)\n            action.timeScale = speed\n            action.play()\n            \n            # ミキサーを保存\n            instance.userData.mixer = mixer\n```\n\n【建物プリセット】\n• 住宅：一戸建て、マンション、アパート\n• 商業施設：オフィスビル、ショッピングモール、レストラン\n• 公共施設：学校、病院、図書館、駅\n• 工業施設：工場、倉庫、発電所\n• 歴史的建造物：城、寺院、教会\n• 現代建築：高層ビル、スタジアム、空港\n\n【自然オブジェクト】\n• 樹木：針葉樹、広葉樹、果樹、観葉植物\n• 草花：花壇、芝生、野原、庭園\n• 岩石：岩、石、砂利、砂\n• 地形：山、丘、谷、川、湖\n• 気象：雲、雨、雪、霧\n• 時間：朝、昼、夕、夜の照明\n\n【キャラクター】\n• 人間：男性、女性、子供、老人\n• 動物：犬、猫、鳥、魚、昆虫\n• ファンタジー：ドラゴン、ユニコーン、妖精\n• ロボット：ヒューマノイド、四足歩行、飛行型\n• 職業：医者、警察、消防士、教師\n• 民族：様々な民族・文化のキャラクター\n\n【アニメーション】\n• 歩行：歩く、走る、ジャンプ\n• 表情：笑う、怒る、悲しむ、驚く\n• ジェスチャー：手を振る、指差す、拍手\n• 動作：座る、立つ、寝る、食べる\n• スポーツ：サッカー、バスケット、テニス\n• ダンス：様々なダンススタイル\n\n【最適化技術】\n• LOD（Level of Detail）：距離に応じた詳細度\n• インスタンシング：同じモデルの効率的描画\n• フラスタムカリング：画面外オブジェクトの除外\n• オクルージョンカリング：隠れたオブジェクトの除外\n• テクスチャアトラス：複数テクスチャの統合\n• 圧縮：Draco、KTX2によるデータ圧縮\n\n【物理演算】\n• 重力：オブジェクトの落下\n• 衝突：オブジェクト間の衝突検出\n• 摩擦：表面の摩擦係数\n• 弾性：跳ね返りの係数\n• 流体：水、空気の流れ\n• 破壊：オブジェクトの破損\n\n【実用化事例】\n• 建築ビジュアライゼーション：建物の3Dプレビュー\n• ゲーム開発：3Dゲームのアセット管理\n• 教育：3D教材の作成・配布\n• エンターテイメント：映画・アニメの3D制作\n• シミュレーション：都市計画・災害シミュレーション\n• メタバース：仮想空間の構築\n\n【将来の展望】\n• リアルタイムレイトレーシング：よりリアルな光の表現\n• プロシージャル生成：アルゴリズムによる自動生成\n• AI生成：AIによる3Dモデル生成\n• 量子レンダリング：量子コンピュータによる高速レンダリング\n• 脳波制御：思考による3D操作\n• 触覚フィードバック：触覚による3D体験",
        imageUrl: "/microservice.png"
      }
    ]
  },
  iot: {
    title: "IoT",
    description: "モノのインターネットの最新動向",
    image: "bg-gradient-to-br from-emerald-400 to-green-500",
    icon: "🌐",
    articles: [
      {
        title: "IoTデバイスのセキュリティ対策",
        content: "IoTデバイス特有のセキュリティリスクと対策方法を解説。デバイス認証、暗号化通信、ファームウェア更新、侵入検知システムなど、IoT環境における包括的なセキュリティ戦略の構築方法を詳しく説明します。\n\n【IoTセキュリティの課題】\n• デバイス数の増加：2025年で750億台に到達予測\n• 多様なデバイス：異なるOS、プロトコル、アーキテクチャ\n• リソース制約：限られたCPU、メモリ、電力\n• 長期運用：10年以上の稼働を想定\n• 物理的アクセス：デバイスが物理的にアクセス可能\n\n【主要な脅威】\n• ボットネット：Mirai、Gafgyt、Mozi\n• データ漏洩：センサーデータ、個人情報の流出\n• サービス妨害：DDoS攻撃、システム停止\n• プライバシー侵害：行動パターンの追跡\n• 物理的攻撃：デバイスの改ざん、破壊\n\n【セキュリティ対策】\n• デバイス認証：デジタル証明書、PKI\n• 暗号化通信：TLS/SSL、VPN\n• ファームウェア更新：OTA（Over-The-Air）更新\n• 侵入検知：異常な通信パターンの検出\n• セキュリティ監視：24/7の監視体制\n\n【実装ガイドライン】\n• NIST Cybersecurity Framework\n• OWASP IoT Top 10\n• ISO/IEC 27001\n• 日本のIoTセキュリティガイドライン\n• 業界別セキュリティ基準"
      },
      {
        title: "エッジコンピューティングの活用",
        content: "IoTデータのリアルタイム処理のためのエッジコンピューティングの活用方法を解説。エッジサーバーの配置戦略、データ処理の分散化、レイテンシの最適化、エッジAIの実装など、実践的なエッジコンピューティングの設計方法を紹介します。\n\n【エッジコンピューティングの特徴】\n• 低レイテンシ：1-10msの応答時間\n• 帯域幅削減：データの前処理による通信量削減\n• プライバシー保護：データのローカル処理\n• オフライン対応：ネットワーク断絶時の継続動作\n• リアルタイム処理：即座の意思決定\n\n【エッジデバイスの種類】\n• エッジゲートウェイ：データ集約・前処理\n• エッジサーバー：アプリケーション実行\n• エッジAI：機械学習モデルの実行\n• モバイルエッジ：5G基地局での処理\n• フォグコンピューティング：エッジとクラウドの中間\n\n【主要プラットフォーム】\n• AWS IoT Greengrass：AWSのエッジプラットフォーム\n• Azure IoT Edge：Microsoftのエッジソリューション\n• Google Cloud IoT Edge：GCPのエッジサービス\n• K3s：軽量Kubernetes\n• OpenShift Edge：Red HatのエッジKubernetes\n\n【実装パターン】\n• データフィルタリング：不要データの除去\n• 異常検知：リアルタイムでの異常検出\n• 予測分析：機械学習モデルの実行\n• 自動制御：フィードバックループの実装\n• データ同期：クラウドとの非同期同期\n\n【成功事例】\n• 製造業：品質管理の自動化（不良品検出率99.5%）\n• 小売業：在庫管理の最適化（在庫コスト30%削減）\n• 交通：信号制御の最適化（渋滞20%削減）\n• 農業：精密農業の実現（収穫量15%向上）"
      },
      {
        title: "5GとIoTの組み合わせ",
        content: "5GネットワークとIoTデバイスの組み合わせによる新しいアプリケーションの可能性を解説。超低遅延通信、大容量データ転送、多数同時接続を活用したスマートシティ、自動運転、産業IoTなどの実用例と技術要件について詳しく説明します。\n\n【5Gの特徴】\n• 超高速通信：最大20Gbps（4Gの100倍）\n• 超低遅延：1ms以下（4Gの1/10）\n• 多数同時接続：1km²あたり100万台（4Gの100倍）\n• 高信頼性：99.999%の可用性\n• 省電力：バッテリー寿命の10倍延長\n\n【5G IoTアプリケーション】\n• 自動運転：リアルタイム通信による協調運転\n• 遠隔医療：高精細映像での診断・手術\n• スマートファクトリー：ロボット制御、品質管理\n• スマートシティ：交通制御、環境監視\n• AR/VR：没入感のある体験\n\n【技術要件】\n• ネットワークスライシング：用途別の仮想ネットワーク\n• MEC（Multi-Access Edge Computing）：エッジでの処理\n• プライベート5G：企業専用ネットワーク\n• セキュリティ：エンドツーエンドの暗号化\n• QoS（Quality of Service）：通信品質の保証\n\n【実装の課題】\n• インフラコスト：基地局設置・運用コスト\n• 周波数確保：限られた周波数資源\n• セキュリティ：新たな脅威への対応\n• 相互運用性：異なるベンダー間の連携\n• 規制対応：各国の通信規制\n\n【将来展望】\n• 6G：2030年代の次世代通信\n• 衛星通信：Starlink、Kuiper\n• 量子通信：量子暗号の実用化\n• 脳直結インターフェース：BCI技術の進歩"
      }
    ]
  },
  pythonLearning: {
    title: "Python学習",
    description: "Pythonプログラミングの実践的学習教材",
    image: "bg-gradient-to-br from-orange-400 to-red-500",
    icon: "🐍",
    articles: [
      {
        title: "Pythonスクレイピング技術を通した学習アプローチ",
        content: "Pythonの学習において、実践的なプロジェクトを通して技術を習得することは非常に効果的です。この記事では、AWS Lambda関数とスクレイピング技術を組み合わせた学習教材を紹介し、Pythonの基礎から応用まで段階的に学習する方法を解説します。\n\n【学習のポイント】\n• 実際のWebアプリケーションの開発プロセスを体験\n• クラウドサービス（AWS）との連携方法を学習\n• 非同期プログラミングの実践的な活用\n• エラーハンドリングとログ管理の重要性\n\n【技術スタック】\n• Python 3.9+\n• AWS Lambda\n• DynamoDB\n• BeautifulSoup4\n• aiohttp\n• asyncio\n\n【学習効果】\n• 実践的なPythonスキルの向上\n• クラウド開発の理解\n• スクレイピング技術の習得\n• エラーハンドリングのベストプラクティス\n\n【GitHubリポジトリ】\n詳細な学習教材とサンプルコードは以下のリポジトリで公開しています：\nhttps://github.com/kensudogit/lambda\n\nこの教材を通して、Pythonの基礎から応用まで段階的に学習を進めることができます。各セクションには詳細なコメントと演習問題が含まれており、初心者から中級者まで対応しています。",
        imageUrl: "/scraping.png"
      },
      {
        title: "AWS Lambda関数の実装とベストプラクティス",
        content: "AWS Lambdaを使用したサーバーレスアプリケーションの開発について、実践的な例を交えながら解説します。PythonでのLambda関数の実装、DynamoDBとの連携、API Gatewayの設定、エラーハンドリングなど、本格的なアプリケーション開発に必要な知識を身につけることができます。\n\n【Lambda関数の特徴】\n• サーバー管理不要：インフラの管理から解放\n• 自動スケーリング：需要に応じた自動拡張\n• 従量課金：実際の使用量に応じた課金\n• イベント駆動：トリガーに基づく実行\n• マイクロサービス：小さな機能単位での開発\n\n【実装のポイント】\n• 関数の設計とアーキテクチャ\n• 環境変数の管理\n• ログとモニタリングの実装\n• エラーハンドリングのベストプラクティス\n• パフォーマンス最適化\n\n【学習教材の特徴】\n• 10のセクションに分けた段階的学習\n• 実践的な演習問題\n• 詳細なコメントとドキュメンテーション\n• ベストプラクティスの解説\n• 次のステップの提案\n\n【GitHubリポジトリ】\nhttps://github.com/kensudogit/lambda",
        imageUrl: "/scraping.png"
      },
      {
        title: "非同期プログラミングとスクレイピング技術",
        content: "Pythonの非同期プログラミング（async/await）を活用した効率的なWebスクレイピングの実装方法を解説します。aiohttpを使用した非同期HTTPリクエスト、BeautifulSoupを使ったHTMLパース、データの抽出と処理など、実践的なスクレイピング技術を学習できます。\n\n【非同期プログラミングのメリット】\n• 並列処理：複数のリクエストを同時に処理\n• リソース効率：CPUとメモリの効率的な利用\n• スケーラビリティ：大量のデータ処理に対応\n• レスポンス性：UIのブロッキングを防止\n\n【スクレイピング技術】\n• 基本的なWebスクレイピング\n• 非同期スクレイピングの実装\n• データ抽出と処理\n• エラーハンドリングとレート制限\n• ロボット排除標準（robots.txt）の遵守\n\n【実装例】\n• 基本的なスクレイピングクラス\n• 非同期スクレイピングクラス\n• データ処理ユーティリティ\n• エラーハンドリングの実装\n• レート制限の実装\n\n【学習教材】\n詳細な実装例とサンプルコードは以下のリポジトリで確認できます：\nhttps://github.com/kensudogit/lambda",
        imageUrl: "/scraping.png"
      }
    ]
  },
  microservices: {
    title: "マイクロサービス",
    description: "マイクロサービスアーキテクチャの実践的学習教材",
    image: "bg-gradient-to-br from-indigo-400 to-purple-500",
    icon: "🏗️",
    articles: [
      {
        title: "マイクロカーネル型倉庫管理システムの実装",
        content: "COOOLa Microは、マイクロカーネルアーキテクチャを採用したクラウドベースの倉庫管理システムです。この記事では、実際のプロジェクトを教材として、マイクロサービスアーキテクチャの設計と実装方法を詳しく解説します。\n\n【アーキテクチャの特徴】\n• マイクロカーネル設計：コアシステムがプラグインインターフェースを提供\n• プラグインシステム：動的ロード可能な機能モジュール\n• マイクロサービス：独立してデプロイ・スケール可能なサービス\n• サービス間通信：REST API、RabbitMQ、gRPCを活用\n\n【主要コンポーネント】\n• コアシステム：プラグイン管理、認証、設定管理、イベントバス\n• プラグイン：商品管理、在庫管理、入出庫、レポート、バーコード\n• マイクロサービス：商品、在庫、入出庫、レポート、通知サービス\n\n【技術スタック】\n• Spring Boot 3.x + JavaSE-21 LTS\n• Spring Cloud（Eureka、Gateway、Config）\n• OSGi（プラグイン管理）\n• MySQL 8.0 + Redis + RabbitMQ\n• Angular 17 + TypeScript\n• Docker + Kubernetes + Helm\n\n【学習ポイント】\n• マイクロカーネルアーキテクチャの理解\n• プラグインシステムの設計と実装\n• サービス間通信パターンの実践\n• 分散システムの監視とログ管理\n• コンテナ化とオーケストレーション\n\n【GitHubリポジトリ】\n詳細な実装例とドキュメントは以下のリポジトリで確認できます：\nhttps://github.com/kensudogit/cooola-micro",
        imageUrl: "/microservice.png"
      },
      {
        title: "Spring Cloudを使ったマイクロサービス開発",
        content: "Spring Cloudを活用したマイクロサービス開発の実践的な手法を解説します。COOOLa Microプロジェクトを例に、サービスディスカバリ、APIゲートウェイ、設定管理、ロードバランシングなどの重要な概念を学習できます。\n\n【Spring Cloudの主要機能】\n• Netflix Eureka：サービスディスカバリとレジストリ\n• Spring Cloud Gateway：APIゲートウェイとルーティング\n• Spring Cloud Config：分散設定管理\n• Spring Cloud LoadBalancer：クライアントサイドロードバランシング\n• Spring Cloud Circuit Breaker：障害隔離とフォールバック\n\n【実装パターン】\n• サービス間通信：REST API、メッセージキュー、gRPC\n• データ管理：データベース分離、CQRS、イベントソーシング\n• セキュリティ：OAuth2、JWT、API認証\n• 監視：ヘルスチェック、メトリクス、分散トレーシング\n\n【開発のベストプラクティス】\n• ドメイン駆動設計（DDD）の適用\n• 12-Factor Appの原則\n• コンテナファーストの設計\n• 継続的インテグレーション・デプロイメント\n• 障害耐性の設計\n\n【実践例】\n• 商品管理サービスの実装\n• 在庫管理サービスの実装\n• 入出庫処理サービスの実装\n• レポート生成サービスの実装\n• 通知サービスの実装\n\n【GitHubリポジトリ】\nhttps://github.com/kensudogit/cooola-micro",
        imageUrl: "/microservice.png"
      },
      {
        title: "プラグインシステムとOSGiの活用",
        content: "OSGiを活用したプラグインシステムの設計と実装方法を解説します。COOOLa Microプロジェクトでは、OSGiを使用してプラグインの動的ロード、依存関係管理、ライフサイクル管理を実現しています。\n\n【OSGiの特徴】\n• モジュラー設計：バンドル単位での機能分離\n• 動的ロード：実行時のプラグイン追加・削除\n• 依存関係管理：バージョン管理と解決\n• ライフサイクル管理：インストール、開始、停止、アンインストール\n• サービスレジストリ：バンドル間のサービス提供・消費\n\n【プラグインアーキテクチャ】\n• プラグインインターフェース：統一されたAPI定義\n• プラグインコンテキスト：実行環境とリソース提供\n• プラグインメタデータ：バージョン、依存関係、設定情報\n• イベントシステム：プラグイン間の通信\n\n【実装例】\n• 商品管理プラグイン：商品のCRUD操作\n• 在庫管理プラグイン：在庫追跡・アラート\n• 入出庫プラグイン：入出庫処理・履歴\n• レポートプラグイン：各種レポート生成\n• バーコードプラグイン：バーコード・QRコード生成\n\n【開発のポイント】\n• プラグインインターフェースの設計\n• 依存関係の管理\n• バージョン互換性の確保\n• エラーハンドリングとログ管理\n• テスト戦略\n\n【GitHubリポジトリ】\nhttps://github.com/kensudogit/cooola-micro",
        imageUrl: "/microservice.png"
      },
      {
        title: "【実装ガイド】RAGシステム構築の完全マニュアル：企業文書を活用したAI回答システム",
        content: "RAG（Retrieval-Augmented Generation）システムは、情報検索と生成AIを組み合わせて、企業の内部文書を活用した高精度な質問応答システムを構築する技術です。この記事では、Azureサービスを活用したRAGシステムの実装方法を詳しく解説します。\n\n【RAGシステムの基本構成】\n• 検索フェーズ：ユーザーの質問に関連する文書をベクトル検索で取得\n• 生成フェーズ：検索結果をコンテキストとしてLLMが回答を生成\n• データベース：文書をベクトル化して保存するベクトルデータベース\n• API：フロントエンドとバックエンドを連携するREST API\n\n【必要なAzureサービス】\n• Azure OpenAI：GPT-4やGPT-3.5-turboによる回答生成\n• Azure Cosmos DB：文書データの保存と管理\n• Azure Blob Storage：文書ファイルの保存\n• Azure App Service：APIサーバーのホスティング\n• Azure Cognitive Search：高度な検索機能（オプション）\n\n【実装の技術スタック】\n• バックエンド：Python + FastAPI\n• ベクトル化：sentence-transformers、OpenAI Embeddings\n• データベース：Azure Cosmos DB、Pinecone（代替案）\n• フロントエンド：React + TypeScript\n• デプロイ：Azure App Service、Vercel\n\n【実装手順】\n1. 環境構築：Python環境、Azure CLI、必要なライブラリのインストール\n2. データ準備：企業文書の収集、前処理、ベクトル化\n3. バックエンド開発：FastAPIによるAPI実装\n4. フロントエンド開発：ReactによるUI実装\n5. デプロイ：Azure App Serviceへのデプロイ\n\n【GitHubリポジトリ】\n詳細な実装例とサンプルコードは以下のリポジトリで確認できます：\nhttps://github.com/kensudogit/RagAzure\n\n【実装のポイント】\n• 文書の前処理：PDF、Word、テキストファイルの統一的な処理\n• ベクトル化の最適化：適切な埋め込みモデルの選択\n• 検索精度の向上：クエリ拡張、リランキングの実装\n• 回答品質の向上：プロンプトエンジニアリング、コンテキスト管理\n• セキュリティ：認証・認可、データ暗号化の実装\n\n【成功事例】\n• 企業ナレッジベース：社内文書検索の精度90%向上\n• カスタマーサポート：FAQ回答の自動化率80%達成\n• 技術文書管理：開発者向けドキュメント検索の効率化\n• 法務文書検索：契約書や規約の迅速な検索・回答生成\n\n【コスト最適化のポイント】\n• ベクトルデータベースの選択：Azure Cognitive Search vs Pinecone\n• API呼び出しの最適化：キャッシュ戦略、バッチ処理\n• ストレージコストの削減：データ圧縮、ライフサイクル管理\n• スケーリング戦略：オートスケーリング、コールドスタート対策",
        url: "https://github.com/kensudogit/RagAzure",
        imageUrl: "/microservice.png"
      }
    ]
  }
};

// --- Feature Data ---
const featureData = {
  systemDevelopment: {
    title: "システム開発",
    icon: <IconPhone className="h-8 w-8"/>,
    shortDesc: "Webアプリケーション、モバイルアプリ、API開発まで幅広く対応。",
    longDesc: "最新の技術スタックを使用したシステム開発サービスです。React、Vue.js、Node.js、Python、Java等の技術を活用し、スケーラブルで保守性の高いシステムを構築します。要件定義から設計、開発、テスト、運用まで一貫してサポートします。",
    benefits: [
      "最新技術の活用",
      "スケーラブルな設計",
      "保守性の高いコード",
      "一貫したサポート"
    ],
    useCases: [
      "Webアプリケーション開発",
      "モバイルアプリ開発",
      "API・マイクロサービス開発",
      "レガシーシステムの刷新"
    ]
  },
  cloudMigration: {
    title: "クラウド移行",
    icon: <IconClock className="h-8 w-8"/>,
    shortDesc: "オンプレミスからクラウドへの移行を安全かつ効率的に実行。",
    longDesc: "AWS、Azure、GCP等のクラウドプラットフォームへの移行をサポートします。既存システムの分析から移行計画の策定、データ移行、セキュリティ設定まで一貫して対応。コスト最適化とパフォーマンス向上を実現します。",
    benefits: [
      "コストの最適化",
      "スケーラビリティの向上",
      "セキュリティの強化",
      "運用効率の改善"
    ],
    useCases: [
      "オンプレミスからAWS移行",
      "Azureへのハイブリッド移行",
      "データベースのクラウド移行",
      "レガシーアプリのモダン化"
    ]
  },
  dataAnalysis: {
    title: "データ分析",
    icon: <IconUsers className="h-8 w-8"/>,
    shortDesc: "ビッグデータの収集・分析・可視化でビジネスインサイトを提供。",
    longDesc: "Python、R、SQL等の技術を活用したデータ分析サービスです。データの収集から前処理、統計分析、機械学習、可視化まで一貫してサポート。ビジネスの意思決定を支援するインサイトを提供します。",
    benefits: [
      "データドリブンな意思決定",
      "ビジネスインサイトの可視化",
      "予測分析の実現",
      "ROIの向上"
    ],
    useCases: [
      "売上予測分析",
      "顧客行動分析",
      "マーケティング効果測定",
      "リスク分析"
    ]
  },
  security: {
    title: "セキュリティ",
    icon: <IconShield className="h-8 w-8"/>,
    shortDesc: "包括的なセキュリティ対策でシステムとデータを保護。",
    longDesc: "サイバーセキュリティの専門知識を活かし、包括的なセキュリティ対策を提供します。脆弱性診断、セキュリティ設計、インシデント対応、コンプライアンス対応まで一貫してサポートします。",
    benefits: [
      "脆弱性の早期発見",
      "セキュリティ設計の最適化",
      "インシデント対応の迅速化",
      "コンプライアンスの確保"
    ],
    useCases: [
      "セキュリティ診断・監査",
      "セキュリティ設計・実装",
      "インシデント対応支援",
      "セキュリティ教育・研修"
    ]
  },
  dxPromotion: {
    title: "DX推進",
    icon: <IconUsers className="h-8 w-8"/>,
    shortDesc: "デジタル変革を戦略的に推進し、ビジネス価値を最大化。",
    longDesc: "デジタル変革（DX）の戦略策定から実行まで一貫してサポートします。現状分析、DXロードマップの策定、組織変革、技術導入まで包括的に支援し、持続可能なデジタル変革を実現します。",
    benefits: [
      "戦略的なDX推進",
      "組織変革の支援",
      "技術導入の最適化",
      "持続可能な変革"
    ],
    useCases: [
      "DX戦略の策定",
      "組織変革の支援",
      "デジタル技術の導入",
      "DX人材の育成"
    ]
  },
  itConsulting: {
    title: "ITコンサルティング",
    icon: <IconClock className="h-8 w-8"/>,
    shortDesc: "IT戦略の策定から技術選定まで、総合的なITコンサルティングを提供。",
    longDesc: "技術士の専門知識を活かし、IT戦略の策定から技術選定、プロジェクト管理まで包括的なコンサルティングを提供します。お客様のビジネス目標に最適なITソリューションを提案し、成功に導きます。",
    benefits: [
      "戦略的なIT計画",
      "技術選定の最適化",
      "プロジェクト成功の支援",
      "継続的な技術サポート"
    ],
    useCases: [
      "IT戦略の策定",
      "技術選定・評価",
      "プロジェクト管理支援",
      "技術教育・研修"
    ]
  }
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

const FeatureCard = ({ icon, title, desc, onClick, imageUrl, imageBg }) => (
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
    <div className={`h-40 rounded-t-2xl ${imageBg || 'bg-gradient-to-br from-blue-100 to-blue-200'} flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={title} 
          className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
      <dialog 
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100"
        open
        aria-labelledby="blog-modal-title"
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
                  onClick={() => onArticleClick(article)}
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
      </dialog>
    </div>
  );
};

BlogModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  blogCategory: PropTypes.object,
  onArticleClick: PropTypes.func.isRequired
};

// --- Article Detail Modal ---
const ArticleModal = ({ isOpen, onClose, article, categoryInfo }) => {
  if (!isOpen || !article) return null;

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
        className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100"
        open
        aria-labelledby="article-modal-title"
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
            className="btn-secondary flex-1"
          >
            閉じる
          </button>
          <button 
            onClick={() => {
              // ここで外部リンクや詳細ページへの遷移を実装
              if (article.url) {
                window.open(article.url, '_blank');
              }
            }}
            className="btn-gradient flex-1"
            disabled={!article.url}
          >
            詳細ページを見る
          </button>
        </div>
      </dialog>
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
const FeatureModal = ({ isOpen, onClose, feature }) => {
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
              // ここで問い合わせフォームやデモ申し込みなどの処理を追加
              alert(`${feature.title}について詳しく知りたい場合は、お問い合わせください。`);
            }}
            className="btn-gradient"
          >
            詳しく聞く
          </button>
        </div>
      </dialog>
    </div>
  );
};

FeatureModal.propTypes = {
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
  const [phoneCallModalOpen, setPhoneCallModalOpen] = useState(false);
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
  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setSelectedArticleCategory(selectedBlog);
  };

  // ブログスライド機能
  const blogCategories = [
    {
      title: "トレンド",
      description: "最新のITトレンドと市場動向を分析",
      image: "bg-gradient-to-br from-blue-400 to-indigo-500",
                imageUrl: "/system_development_image.png",
      articles: [
        "【2024年最新】生成AIが変えるビジネスモデル：ChatGPT以降の企業変革事例",
        "メタバースからWeb3へ：次世代インターネットの実用化が始まった",
        "量子コンピューティングの商用化が加速：IBM・Google・Microsoftの最新動向",
        "エッジAIの普及で変わる製造業：リアルタイム品質管理の新時代",
        "サステナブルテックの台頭：グリーンITで実現する環境経営"
      ]
    },
    {
      title: "AI/ML",
      description: "人工知能と機械学習の技術解説",
      image: "bg-gradient-to-br from-purple-400 to-pink-500",
      imageUrl: "/rag_system_image.png",
      articles: [
        "【実装ガイド】RAGシステム構築の完全マニュアル：企業文書を活用したAI回答システム",
        "大規模言語モデル（LLM）の選び方：GPT-4、Claude、Gemini徹底比較",
        "機械学習Ops（MLOps）の導入戦略：AIモデルの本格運用で失敗しない方法",
        "コンピュータビジョンの最新技術：YOLO v8からSegment Anythingまで",
        "AI倫理とガバナンス：企業が取り組むべきAIガイドライン策定のポイント",
        "Azure OpenAIを活用したRAGシステム：実装から運用まで完全ガイド"
      ]
    },
    {
      title: "DX推進",
      description: "デジタル変革の戦略と実践",
      image: "bg-gradient-to-br from-green-400 to-teal-500",
                imageUrl: "/dx_promotion_image.png",
      articles: [
        "【成功事例】中小企業のDX推進：3ヶ月で業務効率30%向上を実現した方法",
        "デジタル人材の確保と育成：ITスキル不足を解決する実践的アプローチ",
        "レガシーシステム刷新の戦略：段階的移行でリスクを最小化する方法",
        "データドリブン経営の実現：BIツール導入から意思決定の高速化まで",
        "アジャイル開発の組織導入：スクラムマスター育成とチーム変革のポイント"
      ]
    },
    {
      title: "セキュリティ",
      description: "サイバーセキュリティの最新動向",
      image: "bg-gradient-to-br from-red-400 to-orange-500",
                imageUrl: "/security_image.png",
      articles: [
        "【緊急対応】ランサムウェア攻撃の対策と復旧：被害を最小限に抑える方法",
        "ゼロトラストセキュリティの実装：従来の境界防御からID中心の防御へ",
        "クラウドセキュリティのベストプラクティス：AWS・Azure・GCPの設定ガイド",
        "脅威インテリジェンスの活用：攻撃者の手口を先読みする防御戦略",
        "インシデント対応の自動化：SOARツールで24時間365日の監視を実現"
      ]
    },
    {
      title: "クラウド",
      description: "クラウド技術とベストプラクティス",
      image: "bg-gradient-to-br from-cyan-400 to-blue-500",
                imageUrl: "/cloud_migration_image.png",
      articles: [
        "【移行ガイド】オンプレミスからクラウドへ：段階的移行で失敗しない方法",
        "マルチクラウド戦略の設計：AWS・Azure・GCPを組み合わせた最適構成",
        "サーバーレスアーキテクチャの実践：Lambda・Azure Functions・Cloud Functions比較",
        "Kubernetes運用の実践：コンテナオーケストレーションでスケーラブルなシステム構築",
        "クラウドコスト最適化のテクニック：FinOpsで年間数百万円のコスト削減を実現"
      ]
    },
    {
      title: "ブロックチェーン",
      description: "分散型技術とその応用",
      image: "bg-gradient-to-br from-indigo-400 to-purple-500",
                imageUrl: "/it_consulting_image.png",
      articles: [
        "【実用化事例】企業ブロックチェーンの導入：サプライチェーン管理の革新",
        "DeFiプロトコルの技術解説：Uniswap・Compound・Aaveの仕組みとリスク",
        "NFTのビジネス活用：デジタル資産としての価値創造とマーケティング戦略",
        "Web3エコシステムの構築：DAO・DeFi・NFTを統合した次世代プラットフォーム",
        "中央銀行デジタル通貨（CBDC）の動向：日本・米国・中国の取り組み比較"
      ]
    },
    {
      title: "IOT",
      description: "モノのインターネットとスマートシティ",
      image: "bg-gradient-to-br from-yellow-400 to-orange-500",
                imageUrl: "/data_analysis_image.png",
      articles: [
        "【導入事例】製造業IoTの成功パターン：センサーデータで品質管理を革新",
        "スマートシティの実現：交通・エネルギー・防災を統合した都市OS",
        "エッジコンピューティングの実践：リアルタイム処理でIoTデータを活用",
        "5GとIoTの組み合わせ：超低遅延通信で実現する新サービス",
        "IoTセキュリティの課題と対策：デバイス認証からデータ暗号化まで"
      ]
    },
    {
      title: "Python学習",
      description: "Pythonプログラミングの実践的学習教材",
      image: "bg-gradient-to-br from-orange-400 to-red-500",
                imageUrl: "/system_development_image.png",
      articles: [
        "【実践教材】Pythonスクレイピング技術を通した学習アプローチ：AWS Lambdaと組み合わせた実践的な教材",
        "AWS Lambda関数の実装とベストプラクティス：サーバーレス開発の基礎から応用まで",
        "非同期プログラミングとスクレイピング技術：効率的なWebデータ収集の実装方法",
        "【GitHub教材】https://github.com/kensudogit/lambda：詳細な学習教材とサンプルコード",
        "段階的学習プログラム：初心者から中級者まで対応した10のセクション構成",
        "演習問題とサンプルコード：実際に動かしながら学べる実践的な教材",
        "エラーハンドリングとログ管理：本格的なアプリケーション開発に必要な知識",
        "クラウド開発の理解：AWSサービスとの連携方法を実践的に学習",
        "スクレイピング技術の習得：BeautifulSoup4とaiohttpを使った効率的なデータ収集",
        "実践的なPython学習：AWS Lambdaとスクレイピング技術を組み合わせた教材"
      ]
    },
    {
      title: "マイクロサービス",
      description: "マイクロサービスアーキテクチャの実践的学習教材",
      image: "bg-gradient-to-br from-indigo-400 to-purple-500",
                imageUrl: "/system_development_image.png",
      articles: [
        "【実装事例】マイクロカーネル型倉庫管理システム：COOOLa Microプロジェクトの詳細解説",
        "Spring Cloudを使ったマイクロサービス開発：サービスディスカバリとAPIゲートウェイの実装",
        "プラグインシステムとOSGiの活用：動的ロード可能な機能モジュールの設計",
        "【実装ガイド】RAGシステム構築の完全マニュアル：企業文書を活用したAI回答システム",
        "【GitHub教材】https://github.com/kensudogit/cooola-micro：実践的なマイクロサービス教材",
        "マイクロカーネルアーキテクチャ：コアシステムとプラグインの分離設計",
        "サービス間通信パターン：REST API、RabbitMQ、gRPCの使い分け",
        "分散システムの監視とログ管理：Prometheus、Grafana、Jaegerの活用",
        "コンテナ化とオーケストレーション：Docker、Kubernetes、Helmの実践",
        "ドメイン駆動設計（DDD）の適用：マイクロサービス境界の設計指針",
        "実践的なマイクロサービス開発：Spring Boot 3.x + JavaSE-21 LTSの最新技術スタック"
      ]
    },
    {
      title: "ノーコード開発",
      description: "ノーコード・ローコードプラットフォームの技術解説",
      image: "bg-gradient-to-br from-orange-400 to-red-500",
                imageUrl: "/system_development_image.png",
      articles: [
        "【実装ガイド】ノーコード開発プラットフォーム構築：Web・モバイル・メタバース・VR/AR対応",
        "【実装ガイド】AIオーケストレーションエンジン：自己進化・自己複製システムの構築",
        "【実装ガイド】Web3統合ノーコードプラットフォーム：NFT・DAO・DID・メタバース対応",
        "【実装ガイド】Three.jsアセットプリセット：建物・木・キャラクターの3Dモデル管理",
        "【GitHub教材】https://github.com/kensudogit/noCodeDevelopmentPlatform：実践的なノーコード教材",
        "ドラッグ&ドロップエディタ：直感的なUIでアプリケーションを構築",
        "コンポーネントライブラリ：再利用可能なUI要素の集約",
        "リアルタイムプレビュー：変更を即座に確認できる機能",
        "コード生成：視覚的設計から実際のコードを自動生成",
        "マルチプラットフォーム対応：Web、モバイル、メタバース、VR/AR",
        "AI支援機能：コンポーネント提案・レイアウト最適化・コンテンツ生成",
        "Web3統合：NFT・DAO・DID・メタバース対応",
        "デプロイメント自動化：GitOps・CI/CD・環境管理・スケーリング",
        "3Dアセット管理：建物・木・キャラクターの3Dモデル管理",
        "実践的なノーコード開発：Python + FastAPI + React + TypeScript"
      ]
    }
  ];

  const nextBlogSlide = () => {
    setCurrentBlogSlide((prev) => (prev + 1) % blogCategories.length);
  };

  const prevBlogSlide = () => {
    setCurrentBlogSlide((prev) => (prev - 1 + blogCategories.length) % blogCategories.length);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // フォームデータを取得
    const formData = new FormData(e.target);
    const userInfo = {
      name: `${formData.get('lastName')} ${formData.get('firstName')}`,
      company: formData.get('companyName'),
      industry: formData.get('industry'),
      position: formData.get('role'),
      dept: formData.get('dept'),
      email: formData.get('email'),
      additionalRequirements: formData.get('additionalRequirements')
    };

    try {
      // OpenAI APIキーを取得（環境変数から）
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      // APIキーの詳細確認
      console.log('=== APIキー設定確認 ===');
      console.log('APIキー:', apiKey ? '設定済み' : '未設定');
      console.log('APIキーの長さ:', apiKey ? apiKey.length : 0);
      console.log('APIキーの先頭:', apiKey ? apiKey.substring(0, 10) + '...' : 'なし');
      
      if (!apiKey || apiKey === 'your-openai-api-key-here' || apiKey === 'demo-mode') {
        // デモモードで実行
        console.log('OpenAI APIキーが設定されていません。デモモードで実行します。');
        
        // デモ用の模擬結果を表示
        const demoContent = generateDemoContent(userInfo);
        showGeneratedContent(demoContent, userInfo);
        return;
      }

      // OpenAI クライアントを使用してAI資料を生成
      const OpenAIClient = (await import('../utils/openaiClient.js')).default;
      const client = new OpenAIClient(apiKey);
      
      // ローディング表示
      showLoadingModal();
      
      console.log('OpenAI APIを呼び出し中...');
      
      const generatedContent = await client.generateContent(
        client.generatePrompt(userInfo),
        userInfo
      );
      
      console.log('OpenAI API呼び出し成功！');
      console.log('生成されたコンテンツ:', generatedContent);
      
      // 生成された内容を表示
      showGeneratedContent(generatedContent, userInfo);
      
    } catch (error) {
      console.error('AI資料生成エラー:', error);
      
      // エラー時のデモ用結果
      const demoContent = generateDemoContent(userInfo);
      showGeneratedContent(demoContent, userInfo, true);
    }
  };

  // デモ用コンテンツ生成
  const generateDemoContent = (userInfo) => {
    return {
      serviceOverview: `${userInfo.company}様向けのITサービス提案\n\n【業界分析】\n${userInfo.industry}業界では、デジタル変革が急務となっています。\n\n【課題】\n- 既存システムの老朽化\n- データ活用の遅れ\n- セキュリティリスクの増大\n\n【須藤技術士事務所の強み】\n- 豊富な業界経験\n- 最新技術への対応力\n- 24/7サポート体制`,
      recommendedServices: `【推奨サービス】\n\n1. システム刷新プロジェクト\n   - モダンなアーキテクチャ設計\n   - クラウド移行支援\n   - セキュリティ強化\n\n2. データ分析基盤構築\n   - BI/DWシステム導入\n   - AI/ML活用支援\n   - ダッシュボード構築\n\n3. DX推進支援\n   - 業務プロセス改善\n   - 自動化推進\n   - デジタル人材育成`,
      expectedEffects: `【期待される効果】\n\n- 業務効率30%向上\n- システム運用コスト20%削減\n- データ活用による売上10%向上\n- セキュリティインシデント90%削減`,
      implementationSteps: `【導入ステップ】\n\nPhase 1: 現状分析・設計（1-2ヶ月）\nPhase 2: 基盤構築（3-6ヶ月）\nPhase 3: システム移行（2-3ヶ月）\nPhase 4: 運用開始・最適化（継続）`,
      supportSystem: `【サポート体制】\n\n- 24/7監視・サポート\n- SLA 99.9%保証\n- 月次メンテナンス\n- 年次システム見直し`,
      riskManagement: `【リスク管理】\n\n- 多層防御セキュリティ\n- データバックアップ・復旧\n- 災害時BCP対応\n- コンプライアンス遵守`,
      investmentReturn: `【投資対効果】\n\n初期投資: 500万円\n年間運用費: 100万円\n3年ROI: 300%\n投資回収期間: 18ヶ月`,
      additionalRequirementsResponse: `【${userInfo.additionalRequirements}への対応】\n\nご要望の「${userInfo.additionalRequirements}」について、以下のアプローチで対応いたします：\n\n1. 現状分析と要件定義\n2. 最適な技術選定\n3. 段階的な実装計画\n4. 継続的な改善・最適化`
    };
  };

  // ローディングモーダル表示
  const showLoadingModal = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">AI資料を生成中...</h3>
        <p class="text-gray-600">しばらくお待ちください</p>
      </div>
    `;
    document.body.appendChild(modal);
    
    // 3秒後に自動で閉じる
    setTimeout(() => {
      document.body.removeChild(modal);
    }, 3000);
  };

  // 生成されたコンテンツ表示
  const showGeneratedContent = (content, userInfo, isDemo = false) => {
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
          ${isDemo ? '<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">デモモード: 実際のAPIキーが設定されていないため、模擬結果を表示しています</div>' : ''}
          <div class="space-y-6">
            ${Object.entries(parsedContent).map(([key, value]) => `
              <div class="border-l-4 border-blue-500 pl-4">
                <h3 class="font-semibold text-lg text-gray-900 mb-2">${getSectionTitle(key)}</h3>
                <div class="text-gray-700 whitespace-pre-line">${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</div>
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

  // APIキーテスト関数
  const testApiKey = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    console.log('=== APIキー設定確認 ===');
    console.log('APIキー:', apiKey ? '設定済み' : '未設定');
    console.log('APIキーの長さ:', apiKey ? apiKey.length : 0);
    console.log('APIキーの先頭:', apiKey ? apiKey.substring(0, 10) + '...' : 'なし');
    
    if (!apiKey || apiKey === 'your-openai-api-key-here' || apiKey === 'demo-mode') {
      console.log('❌ OpenAI APIキーが設定されていません');
      console.log('💡 .envファイルにVITE_OPENAI_API_KEYを設定してください');
      return;
    }
    
    // APIキーの形式チェック
    const isValidFormat = apiKey.startsWith('sk-') || apiKey.startsWith('ysk-');
    if (!isValidFormat) {
      console.log('⚠️ APIキーの形式が正しくない可能性があります');
      console.log('💡 正しい形式: sk-... または ysk-...');
      return;
    }
    
    try {
      // 簡単なAPIテスト
      const OpenAIClient = (await import('../utils/openaiClient.js')).default;
      const client = new OpenAIClient(apiKey);
      
      console.log('🔄 OpenAI APIをテスト中...');
      console.log('⏳ しばらくお待ちください');
      
      const testPrompt = 'こんにちは。これはAPIテストです。';
      const response = await client.generateContent(testPrompt, {});
      
      console.log('✅ OpenAI APIキーが正常に動作しています！');
      console.log('📝 テスト結果:', response.substring(0, 100) + '...');
      console.log('🎉 APIキー設定確認完了');
      
    } catch (error) {
      console.error('❌ OpenAI APIテストに失敗しました');
      console.error('🔍 エラー詳細:', error.message);
      console.log('💡 APIキーが正しいか確認してください');
    }
  };

  // チャットモーダルを開く関数
  const openChatModal = () => {
    setChatModalOpen(true);
  };

  // AIチャット相談ボタンのクリックハンドラー
  const handleAIChatConsultation = () => {
    setChatModalOpen(true);
  };

  // 電話で相談ボタンのクリックハンドラー
  const handlePhoneConsultation = () => {
    console.log('📞 電話で相談ボタンがクリックされました');
    setPhoneCallModalOpen(true);
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="metallic-container flex h-24 w-24 items-center justify-center rounded-full text-white font-bold text-xl shadow-lg">
              <img src="/PC.png" alt="須藤技術士事務所" className="w-30 h-30 object-contain logo-float relative z-10" />
            </div>
            <span className="text-sm font-bold gradient-text">須藤技術士事務所</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-700">
            <a href="#features" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">機能</a>
            <a href="#cases" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">導入事例</a>
            <a href="#pricing" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">料金</a>
            <a href="#blog" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">ブログ・ニュース</a>
            <a href="#faq" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">よくある質問</a>
          </nav>
          <div className="flex items-center gap-3">
            {false ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 hidden md:inline-flex">
                  こんにちは、ユーザーさん
                </span>
                <button 
                  onClick={() => {}}
                  className="btn-secondary"
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
                  className="btn-secondary hidden md:inline-flex"
                >
                  ログイン
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('register');
                    setRegisterModalOpen(true);
                  }}
                  className="btn-gradient"
                >
                  新規登録
                </button>
              </>
            )}
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
              <Badge variant="warning">24時間サポート</Badge>
            </div>
            <h1 className="section-title mobile-title text-4xl md:text-6xl font-extrabold leading-tight">
              IT技術で、<span className="gradient-text">ビジネスを変革する。</span>
            </h1>
            <p className="mobile-text mt-6 text-lg md:text-xl text-gray-700 leading-relaxed max-w-2xl">
              須藤技術士事務所は、システム開発・クラウド移行・データ分析・セキュリティ・DX推進・ITコンサルティングを提供する総合ITサービスです。
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
                <Select label="業界" name="industry" required options={[
                  { value: "manufacturing", label: "製造業" },
                  { value: "finance", label: "金融業" },
                  { value: "retail", label: "小売業" },
                  { value: "healthcare", label: "医療・ヘルスケア" },
                  { value: "education", label: "教育" },
                  { value: "government", label: "官公庁" },
                  { value: "other", label: "その他" },
                ]} />
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
                <button 
                  type="button"
                  onClick={() => testApiKey()}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl mt-2"
                >
                  APIキー設定確認
                </button>
                <p className="text-sm text-gray-500 text-center">送信により、プライバシーポリシーに同意したものとみなされます。</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 relative">
              主要機能
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">ビジネスの成長を支える6つのITサービスを、技術士の専門知識で。</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon={<IconPhone className="h-8 w-8"/>} 
              title="システム開発" 
              desc="最新技術を駆使した高品質なシステム開発で、お客様のビジネス課題を解決。" 
              onClick={() => setSelectedFeature(featureData.systemDevelopment)}
              imageUrl="/system_development_image.png"
              imageBg="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700"
            />
            <FeatureCard 
              icon={<IconClock className="h-8 w-8"/>} 
              title="クラウド移行" 
              desc="安全で効率的なクラウド移行で、ITコスト削減と業務効率化を実現。" 
              onClick={() => setSelectedFeature(featureData.cloudMigration)}
              imageUrl="/cloud_migration_image.png"
              imageBg="bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600"
            />
            <FeatureCard 
              icon={<IconUsers className="h-8 w-8"/>} 
              title="データ分析" 
              desc="ビッグデータ活用とAI技術で、データドリブンな意思決定をサポート。" 
              onClick={() => setSelectedFeature(featureData.dataAnalysis)}
              imageUrl="/data_analysis_image.png"
              imageBg="bg-gradient-to-br from-green-400 via-green-500 to-emerald-600"
            />
            <FeatureCard 
              icon={<IconShield className="h-8 w-8"/>} 
              title="セキュリティ" 
              desc="企業の重要情報を保護する包括的なセキュリティソリューションを提供。" 
              onClick={() => setSelectedFeature(featureData.security)}
              imageUrl="/security_image.png"
              imageBg="bg-gradient-to-br from-red-400 via-red-500 to-pink-600"
            />
            <FeatureCard 
              icon={<IconUsers className="h-8 w-8"/>} 
              title="DX推進" 
              desc="デジタル技術を活用した業務改革で、競争力向上と成長を実現。" 
              onClick={() => setSelectedFeature(featureData.dxPromotion)}
              imageUrl="/dx_promotion_image.png"
              imageBg="bg-gradient-to-br from-purple-400 via-purple-500 to-violet-600"
            />
            <FeatureCard 
              icon={<IconClock className="h-8 w-8"/>} 
              title="ITコンサルティング" 
              desc="技術的視点からビジネス課題を分析し、最適なソリューションを提案。" 
              onClick={() => setSelectedFeature(featureData.itConsulting)}
              imageUrl="/it_consulting_image.png"
              imageBg="bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600"
            />
          </div>
        </div>
      </section>

      {/* Cases / Proof */}
      <section id="cases" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 relative">
              導入効果
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">実際の企業でのIT導入効果を数値でご紹介します。</p>
          </div>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="md:col-span-1 animate-fade-in-left">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">実績数値</h3>
                <div className="space-y-6">
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="text-3xl font-bold text-green-600 mb-2">+45%</div>
                    <div className="text-gray-700 font-medium">業務効率化</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600 mb-2">-60%</div>
                    <div className="text-gray-700 font-medium">システム運用コスト</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600 mb-2">+30%</div>
                    <div className="text-gray-700 font-medium">開発スピード</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2 animate-fade-in-right">
              <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 hover:border-blue-200 transition-all duration-500 hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">製造業 A社</h4>
                </div>
                <p className="text-gray-600 leading-relaxed text-base group-hover:text-gray-700 transition-colors duration-300">レガシーシステムをクラウド移行し、運用コストを 60% 削減。開発・デプロイサイクルを 3倍高速化。</p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
                  詳細を見る
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 hover:border-green-200 transition-all duration-500 hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-300">金融業 B社</h4>
                </div>
                <p className="text-gray-600 leading-relaxed text-base group-hover:text-gray-700 transition-colors duration-300">データ分析基盤を構築し、顧客行動予測の精度を 45% 向上。マーケティングROIを大幅改善。</p>
                <div className="mt-4 flex items-center text-green-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
                  詳細を見る
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 hover:border-purple-200 transition-all duration-500 hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">小売業 C社</h4>
                </div>
                <p className="text-gray-600 leading-relaxed text-base group-hover:text-gray-700 transition-colors duration-300">DX戦略の策定と実行により、デジタル化率を 80% 向上。業務効率化で年間 2億円のコスト削減を実現。</p>
                <div className="mt-4 flex items-center text-purple-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
                  詳細を見る
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 hover:border-red-200 transition-all duration-500 hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-red-700 transition-colors duration-300">教育機関 D</h4>
                </div>
                <p className="text-gray-600 leading-relaxed text-base group-hover:text-gray-700 transition-colors duration-300">セキュリティ強化により、サイバー攻撃の検知率を 95% 向上。インシデント対応時間を 70% 短縮。</p>
                <div className="mt-4 flex items-center text-red-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
                  詳細を見る
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 relative">
              料金（例）
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">プロジェクト規模・技術要件に応じてお見積りします。以下は一例です。</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                name: "スタンダード", 
                price: "¥150,000/月", 
                features: ["システム開発（小規模）", "クラウド移行支援", "メールサポート"],
                color: "blue",
                icon: "💼"
              },
              { 
                name: "プロフェッショナル", 
                price: "¥300,000/月", 
                features: ["システム開発（中規模）", "データ分析基盤", "セキュリティ対策", "専任コンサルタント"],
                color: "purple",
                icon: "⭐",
                popular: true
              },
              { 
                name: "エンタープライズ", 
                price: "お見積り", 
                features: ["大規模システム開発", "DX戦略策定", "24時間サポート", "専任チーム"],
                color: "green",
                icon: "🚀"
              },
            ].map((p, index) => (
              <div key={p.name} className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl border-2 transition-all duration-500 hover:scale-105 ${
                p.popular 
                  ? 'border-purple-300 scale-105 ring-4 ring-purple-100' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}>
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      おすすめ
                    </span>
                  </div>
                )}
                <div className="p-8">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-4">{p.icon}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{p.name}</h3>
                    <div className={`text-4xl font-bold mb-2 ${
                      p.color === 'blue' ? 'text-blue-600' : 
                      p.color === 'purple' ? 'text-purple-600' : 'text-green-600'
                    }`}>
                      {p.price}
                    </div>
                    {p.price !== "お見積り" && (
                      <p className="text-gray-500 text-sm">月額料金</p>
                    )}
                  </div>
                  <ul className="space-y-4 mb-8">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          p.color === 'blue' ? 'bg-blue-100 text-blue-600' : 
                          p.color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
                        }`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 group-hover:scale-105 ${
                    p.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 
                    p.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' : 
                    'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  } shadow-lg hover:shadow-xl`}>
                    問い合わせる
                  </button>
                </div>
              </div>
            ))}
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
                title: "医療管理システム",
                description: "オンライン診療・電子カルテ・予約管理の統合システム",
                detailedDescription: "クリニック向けの包括的な医療管理システム。オンライン診療、電子カルテ、Web予約、問診票、経営分析、AIページ作成機能を統合。ビデオ診療でのサンプル動画作成・出力機能も実装。",
                url: "https://frontend-599xip6ty-kensudogits-projects.vercel.app/",
                image: "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500",
                imageUrl: "/clinics.png",
                icon: "🏥",
                tech: ["React", "TypeScript", "TanStack Query", "Vercel", "Mock API"],
                features: ["オンライン診療", "電子カルテ", "Web予約", "AIページ作成", "動画録画"],
                industry: "医療",
                duration: "2ヶ月",
                team: "1名"
              },
              {
                title: "ITアカデミーシステム",
                description: "学習進捗、コミュニティ、技術ブログ、チェットサポート、AIチェットボット",
                detailedDescription: "プログラミング・Web開発・データサイエンス・AI・クラウド技術を学べる総合IT教育機関。",
                url: "https://frontend-6vlo6gfv8-kensudogits-projects.vercel.app/",
                image: "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500",
                imageUrl: "/learning.png",
                icon: "🏥",
                tech: ["React", "TypeScript", "TanStack Query", "Vercel", "Mock API"],
                features: ["プログラミングコース", "学習進捗","コミュニティ","技術ブログ","AIチャトボット"],
                industry: "IT教育",
                duration: "1ヶ月",
                team: "1名"
              },
              {
                title: "オークションシステム",
                description: "リアルタイム入札機能付きのWebアプリケーション",
                detailedDescription: "リアルタイム入札機能を備えたオンラインオークションシステム。WebSocketを使用した即座の価格更新、自動入札機能、セキュアな決済システムを実装。",
                url: "https://auction-react-7g6nqex2a-kensudogits-projects.vercel.app/",
                image: "bg-gradient-to-br from-purple-500 via-pink-500 to-red-500",
                imageUrl: "/auction_system_image.png",
                icon: "🔨",
                tech: ["React", "Node.js", "WebSocket", "Stripe", "MongoDB"],
                features: ["リアルタイム入札", "自動入札", "セキュア決済", "通知システム"],
                industry: "Eコマース",
                duration: "3ヶ月",
                team: "3名"
              },
              {
                title: "不動産管理システム",
                description: "物件管理・入居者管理・収支管理を統合したシステム",
                detailedDescription: "不動産管理会社向けの包括的な管理システム。物件情報、入居者管理、家賃収支、メンテナンス記録を一元管理。レポート機能とダッシュボードで経営状況を可視化。",
                url: "https://realestate-flame-three.vercel.app/",
                image: "bg-gradient-to-br from-green-500 via-teal-500 to-blue-500",
                imageUrl: "/real_estate_management_system_image.png",
                icon: "🏢",
                tech: ["Vue.js", "Laravel", "MySQL", "Chart.js", "PDF生成"],
                features: ["物件管理", "入居者管理", "収支管理", "レポート機能"],
                industry: "不動産",
                duration: "4ヶ月",
                team: "4名"
              },
              {
                title: "倉庫管理システム",
                description: "在庫管理・入出庫管理・発注管理の統合システム",
                detailedDescription: "製造業向けの倉庫管理システム。バーコード・QRコードによる在庫管理、入出庫の自動記録、発注点管理、在庫レポート機能を実装。",
                url: "https://cooola-micro-782k78u49-kensudogits-projects.vercel.app/dashboard",
                image: "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500",
                imageUrl: "/warehouse_management_system_image.png",
                icon: "📦",
                tech: ["React", "Spring Boot", "PostgreSQL", "バーコードAPI", "REST API"],
                features: ["在庫管理", "入出庫管理", "発注管理", "バーコード対応"],
                industry: "製造業",
                duration: "5ヶ月",
                team: "5名"
              },
              {
                title: "消防司令システム",
                description: "緊急通報受付・出動指示・状況管理システム",
                detailedDescription: "消防本部向けの緊急対応システム。119番通報の受付、出動車両の管理、現場状況のリアルタイム更新、災害情報の共有機能を実装。",
                url: "https://frontend-pscisypg0-kensudogits-projects.vercel.app",
                image: "bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500",
                imageUrl: "/fire_command_system_image.png",
                icon: "🚨",
                tech: ["React", "Express.js", "MongoDB", "WebSocket", "地図API"],
                features: ["緊急通報受付", "出動管理", "状況管理", "地図表示"],
                industry: "公共・防災",
                duration: "6ヶ月",
                team: "6名"
              },
              {
                title: "ノーコード開発基盤",
                description: "ドラッグ&ドロップでアプリケーションを構築できるプラットフォーム",
                detailedDescription: "非エンジニアでもアプリケーションを構築できるノーコードプラットフォーム。ドラッグ&ドロップUI、データベース設計、API自動生成、デプロイ機能を提供。",
                url: "https://frontend-next-8uf7sa9zc-kensudogits-projects.vercel.app",
                image: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
                imageUrl: "/no_code_platform_image.png",
                icon: "🧩",
                tech: ["Next.js", "TypeScript", "Prisma", "Docker", "Vercel"],
                features: ["ドラッグ&ドロップ", "データベース設計", "API自動生成", "ワンクリックデプロイ"],
                industry: "SaaS",
                duration: "8ヶ月",
                team: "7名"
              },
              {
                title: "RAGシステム",
                description: "大規模言語モデルを活用した質問応答システム",
                detailedDescription: "企業の内部文書を活用したRAG（Retrieval-Augmented Generation）システム。文書のベクトル化、類似検索、LLMによる回答生成を実装。",
                url: "https://rag-azure-nine.vercel.app/",
                image: "bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500",
                imageUrl: "/rag_system_image.png",
                icon: "🤖",
                tech: ["Python", "FastAPI", "Azure OpenAI", "Pinecone", "LangChain"],
                features: ["文書検索", "AI回答生成", "ベクトル検索", "API連携"],
                industry: "AI・機械学習",
                duration: "4ヶ月",
                team: "3名"
              },
              {
                title: "スレッド投稿管理",
                description: "コミュニティ型の投稿・コメント管理システム",
                detailedDescription: "SNS風のコミュニティプラットフォーム。スレッド作成、コメント機能、いいね・シェア、ユーザー管理、モデレーション機能を実装。",
                url: "https://thread-manage-2iqf7gflt-kensudogits-projects.vercel.app/",
                image: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
                imageUrl: "/thread_post_management_image.png",
                icon: "💬",
                tech: ["React", "Node.js", "Redis", "Socket.io", "JWT"],
                features: ["スレッド管理", "コメント機能", "リアルタイム更新", "ユーザー管理"],
                industry: "SNS・コミュニティ",
                duration: "3ヶ月",
                team: "4名"
              },
              {
                title: "インターネット・バンキング",
                description: "オンラインバンキングサービスのWebアプリケーション",
                detailedDescription: "金融機関向けのオンラインバンキングシステム。口座照会、振込機能、投資商品管理、セキュリティ機能（二要素認証、暗号化）を実装。",
                url: "https://frontend-8gjll2d67-kensudogits-projects.vercel.app/",
                image: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500",
                imageUrl: "/internet_banking_image.png",
                icon: "🏦",
                tech: ["React", "Java", "Oracle", "Spring Security", "暗号化"],
                features: ["口座管理", "振込機能", "投資管理", "セキュリティ"],
                industry: "金融",
                duration: "10ヶ月",
                team: "8名"
              },
              {
                title: "カラオケシステム",
                description: "楽曲検索・予約・決済機能付きカラオケ管理システム",
                detailedDescription: "カラオケ店向けの管理システム。楽曲データベース、予約管理、料金計算、決済連携、利用統計レポート機能を実装。",
                url: "https://karaoke-pro-system.vercel.app/",
                image: "bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500",
                imageUrl: "/karaoke_system_image.png",
                icon: "🎤",
                tech: ["Vue.js", "Laravel", "Stripe API", "MySQL", "音声API"],
                features: ["楽曲管理", "予約システム", "決済機能", "統計レポート"],
                industry: "エンターテイメント",
                duration: "4ヶ月",
                team: "4名"
              },
              {
                title: "POS・レジシステム",
                description: "店舗向け売上管理・在庫管理・顧客管理システム",
                detailedDescription: "小売店向けのPOSシステム。商品管理、売上管理、在庫管理、顧客管理、レシート印刷、売上レポート機能を実装。",
                url: "https://frontend-dnnq6vti0-kensudogits-projects.vercel.app/",
                image: "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500",
                imageUrl: "/pos_register_system_image.png",
                icon: "🛒",
                tech: ["React", "Express.js", "SQLite", "プリンターAPI", "バーコード"],
                features: ["商品管理", "売上管理", "在庫管理", "レシート印刷"],
                industry: "小売",
                duration: "3ヶ月",
                team: "3名"
              },
              {
                title: "駐車場管理システム",
                description: "駐車場の空き状況管理・料金計算・決済システム",
                detailedDescription: "駐車場運営会社向けの管理システム。空き状況のリアルタイム表示、料金計算、決済処理、利用統計、予約機能を実装。",
                url: "https://frontend-kzkn15k97-kensudogits-projects.vercel.app",
                image: "bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-500",
                imageUrl: "/parking_management_system_image.png",
                icon: "🅿️",
                tech: ["React", "Node.js", "PostgreSQL", "決済API", "センサー連携"],
                features: ["空き状況管理", "料金計算", "決済処理", "予約機能"],
                industry: "交通・インフラ",
                duration: "4ヶ月",
                team: "4名"
              },
              {
                title: "駐車場管理システム(管理者)",
                description: "駐車場の空き状況管理・料金計算・決済システム",
                detailedDescription: "駐車場運営会社向けの管理システム。空き状況のリアルタイム表示、料金計算、決済処理、利用統計、予約機能を実装。",
                url: "https://admin-frontend-9ytrvei1e-kensudogits-projects.vercel.app",
                image: "bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-500",
                imageUrl: "/parking_management_system_image.png",
                icon: "🅿️",
                tech: ["React", "Node.js", "PostgreSQL", "決済API", "センサー連携"],
                features: ["空き状況管理", "料金計算", "決済処理", "予約機能"],
                industry: "交通・インフラ",
                duration: "4ヶ月",
                team: "4名"
              },
              {
                title: "YouTube急上昇動画抽出システム",
                description: "YouTubeで閲覧数が急上昇している動画を自動抽出・分析するシステム",
                detailedDescription: "YouTube APIを活用した動画分析システム。急上昇動画の自動検出、トレンド分析、キーワード抽出、視聴者エンゲージメント分析機能を実装。",
                url: "https://express-p6yebqya7-kensudogits-projects.vercel.app/",
                image: "bg-gradient-to-br from-red-500 via-red-600 to-red-700",
                imageUrl: "/youtube.png",
                icon: "📈",
                tech: ["Express.js", "React", "YouTube API", "Python", "データ分析"],
                features: ["急上昇動画検出", "トレンド分析", "キーワード抽出", "エンゲージメント分析"],
                industry: "データ分析・マーケティング",
                duration: "2ヶ月",
                team: "2名"
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
                        className={`max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 ${showImage ? 'block' : 'hidden'}`}
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

      {/* AI Learning Support */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="mx-auto max-w-4xl px-4">
          <div className="bg-gradient-to-r from-green-500 to-purple-600 rounded-2xl p-8 text-center shadow-xl">
            <h2 className="text-4xl font-bold text-white mb-4">
              AI学習サポートで効率的な学習を
            </h2>
            <p className="text-xl text-white mb-8">
              専門のAIカウンセラーとメンターが無料でご相談をお受けします
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <button 
                onClick={handleAIChatConsultation}
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="AIチャットで無料相談"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                AIチャット相談
              </button>
              
              <button 
                onClick={handlePhoneConsultation}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="電話で相談 (03-1234-5678)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                電話で相談
              </button>
              
              <button 
                onClick={handleAppointmentBooking}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="面談予約で詳細相談"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                面談予約
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 relative">
              よくある質問
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">お客様からよくいただくご質問にお答えします。</p>
          </div>
          <div className="space-y-6">
            {[
              { q: "プロジェクトの期間はどれくらい？", a: "小規模プロジェクトは1-3ヶ月、中規模は3-6ヶ月、大規模は6ヶ月以上となります。要件により異なります。" },
              { q: "セキュリティ対策は？", a: "暗号化通信、アクセス制御、脆弱性診断、セキュリティ監査など、業界標準のセキュリティ対策を実装します。" },
              { q: "サポート体制は？", a: "平日9-18時のメール/電話サポート、緊急時は24時間対応。専任コンサルタントによる継続サポートも可能です。" },
              { q: "技術スタックの選定は？", a: "プロジェクト要件、スケーラビリティ、保守性を考慮し、最適な技術スタックを提案します。" },
              { q: "クラウド移行のリスクは？", a: "段階的な移行計画、データバックアップ、ロールバック手順を事前に策定し、リスクを最小化します。" },
            ].map((item, i) => (
              <details key={`faq-${item.q}-${i}`} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300 overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6 font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                  <span className="pr-4">{item.q}</span>
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white transition-transform duration-300 group-open:rotate-45">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </summary>
                <div className="px-6 pb-6">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-gray-700 leading-relaxed text-base">{item.a}</p>
                  </div>
                </div>
              </details>
            ))}
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
                {blogCategories.map((category, index) => {
                  const blogKey = Object.keys(blogData)[index];
                  const blogCategory = blogData[blogKey];
                  
                  return (
                    <div key={`blog-${category.title}-${index}`} className="w-full flex-shrink-0 px-4">
                      <button 
                        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 hover:border-blue-200 transition-all duration-500 hover:scale-105 cursor-pointer overflow-hidden w-full text-left"
                        onClick={() => setSelectedBlog(blogCategory)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedBlog(blogCategory);
                          }
                        }}
                        aria-label={`${category.title}の詳細を見る`}
                      >
                  <div className={`h-56 rounded-t-2xl ${category.image} flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
                    {category.imageUrl && (
                      <img 
                        src={category.imageUrl} 
                        alt={category.title} 
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
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
                      {category.articles.map((article, articleIndex) => {
                        // 記事タイトルから対応する記事データを検索
                        const articleData = blogCategory?.articles?.find(a => a.title === article);
                        return (
                          <div key={`article-${article}-${articleIndex}`} className="group/article">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (articleData) {
                                  handleArticleClick(articleData);
                                }
                              }}
                              className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-blue-600 transition-colors duration-300 w-full text-left hover:bg-gray-50 p-2 rounded-lg"
                              disabled={!articleData}
                            >
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                              <span className="flex-1">{article}</span>
                              {articleData && (
                                <svg className="w-4 h-4 opacity-0 group-hover/article:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      カテゴリ詳細
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
                    </div>
                  );
                })}
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
            <p className="text-gray-300 max-w-md">IT技術でビジネスを変革する。システム開発・クラウド移行・データ分析・セキュリティ・DX推進・ITコンサルティングを提供。</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">サービス</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#features" className="hover:text-white transition-colors">システム開発</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">クラウド移行</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">データ分析</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">セキュリティ</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">DX推進</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">ITコンサルティング</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#faq" className="hover:text-white transition-colors">お問い合わせ</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">よくある質問</a></li>
                <li><a href="#cases" className="hover:text-white transition-colors">導入事例</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">開発実績</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">ブログ・ニュース</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© {new Date().getFullYear()} 須藤技術士事務所. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400 mt-4 md:mt-0">
              <button className="hover:text-white transition-colors">利用規約</button>
              <button className="hover:text-white transition-colors">プライバシーポリシー</button>
              <button className="hover:text-white transition-colors">特定商取引法に基づく表記</button>
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

          {/* 電話発信モーダル */}
          <PhoneCallModal
            isOpen={phoneCallModalOpen}
            onClose={() => setPhoneCallModalOpen(false)}
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