# 医療システム - Medical System

## 概要
医療従事者の負担軽減や時間効率の改善を目的とした包括的な医療管理システムです。

## 🎯 主要機能

### 1. AI電話システム
- **診療予約**: 音声による診療科選択と予約
- **健診・人間ドック予約**: 健診コースの選択と予約
- **薬薬連携**: 薬剤に関する相談対応
- **地域連携**: 地域医療機関との連携相談
- **クリニック案内**: 地域別クリニック検索

### 2. 患者対応
- **スマート面会**: 効率的な面会管理
- **病診連携**: 病院と診療所の連携
- **診療・健診予約**: 統合予約システム
- **患者・家族連絡**: 自動通知システム
- **離院アラート**: 退院時の自動通知
- **検査オーダー支援**: 検査依頼の効率化

### 3. 勤務管理
- **勤怠管理**: 出退勤・休憩時間の記録
- **勤怠打刻**: GPS位置情報付き打刻
- **給与連携**: 勤務時間の給与計算連携
- **統計分析**: 勤務効率の分析・レポート

## 🏗️ システム構成

### バックエンド
- **フレームワーク**: Laravel 11
- **データベース**: PostgreSQL 15
- **認証**: Laravel Sanctum
- **権限管理**: Spatie Laravel Permission
- **ログ管理**: Spatie Laravel Activity Log
- **ファイル管理**: Spatie Laravel Media Library

### フロントエンド
- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite
- **状態管理**: React Hooks
- **UIライブラリ**: カスタムコンポーネント

### 外部サービス
- **音声通話**: Twilio
- **通知**: Pusher (WebSocket)
- **決済**: Stripe
- **ファイルストレージ**: AWS S3
- **キャッシュ**: Redis

## 📊 データベース設計

### 主要テーブル
1. **medical_staff**: 医療従事者情報
2. **patients**: 患者情報
3. **appointments**: 予約情報
4. **attendance_records**: 勤怠記録
5. **ai_calls**: AI電話履歴

### リレーション
- 医療従事者 ↔ 予約 (1対多)
- 患者 ↔ 予約 (1対多)
- 医療従事者 ↔ 勤怠記録 (1対多)
- 患者 ↔ AI電話 (1対多)

## 🚀 セットアップ手順

### 1. 環境構築
```bash
# Laravelプロジェクトを作成
setup-laravel.bat

# React + Viteプロジェクトを作成
setup-react.bat

# 開発環境を起動
start-dev.bat
```

### 2. 環境設定
```bash
# .envファイルを作成
cp .env.example .env

# アプリケーションキーを生成
docker-compose exec backend php artisan key:generate

# データベースマイグレーション
docker-compose exec backend php artisan migrate

# 依存関係をインストール
docker-compose exec backend composer install
docker-compose exec frontend npm install
```

### 3. 外部サービス設定
- Twilio SID/Token
- Pusher設定
- Stripe API Keys
- AWS S3設定

## 📱 API エンドポイント

### AI電話システム
- `POST /api/ai-phone/initiate`: AI電話開始
- `GET /api/ai-phone/history`: 通話履歴

### 勤怠管理
- `POST /api/attendance/clock-in`: 出勤打刻
- `POST /api/attendance/clock-out`: 退勤打刻
- `POST /api/attendance/break-start`: 休憩開始
- `POST /api/attendance/break-end`: 休憩終了
- `GET /api/attendance/history`: 勤怠履歴
- `GET /api/attendance/current-status`: 現在の状況

### 予約管理
- `GET /api/appointments`: 予約一覧
- `POST /api/appointments`: 予約作成
- `PUT /api/appointments/{id}`: 予約更新
- `DELETE /api/appointments/{id}`: 予約削除

### 患者管理
- `GET /api/patients`: 患者一覧
- `POST /api/patients`: 患者登録
- `GET /api/patients/{id}`: 患者詳細
- `PUT /api/patients/{id}`: 患者情報更新

## 🔐 認証・権限

### 認証方式
- Laravel Sanctum (API認証)
- JWT Token認証

### 権限レベル
- **管理者**: 全機能アクセス
- **医師**: 患者管理・予約管理
- **看護師**: 患者対応・勤怠管理
- **薬剤師**: 薬剤関連・患者対応
- **事務**: 予約管理・勤怠管理

## 📈 統計・分析機能

### ダッシュボード
- 日次・月次勤怠サマリー
- 予約状況の可視化
- AI電話の利用統計
- 患者数の推移

### レポート機能
- 勤務効率レポート
- 予約キャンセル率分析
- 患者満足度調査
- コスト分析

## 🛡️ セキュリティ

### HIPAA準拠
- 患者情報の暗号化
- アクセスログの記録
- データバックアップ
- 監査証跡の保持

### データ保護
- 個人情報の匿名化
- アクセス制御
- セッション管理
- 通信暗号化

## 🔧 開発・運用

### 開発環境
- Docker環境での開発
- ホットリロード対応
- デバッグツール統合
- テスト環境

### 運用環境
- 本番環境の構築
- 監視・ログ管理
- バックアップ・復旧
- パフォーマンス監視

## 📋 今後の拡張予定

### Phase 2
- 電子カルテ連携
- 画像診断支援
- 遠隔診療対応
- モバイルアプリ

### Phase 3
- AI診断支援
- 予測分析
- 機械学習統合
- ブロックチェーン連携

## 🤝 サポート・問い合わせ

### 技術サポート
- 開発チーム: dev@medical-system.com
- ドキュメント: docs.medical-system.com
- コミュニティ: community.medical-system.com

### ライセンス
- MIT License
- 商用利用可能
- 改変・再配布可能

---

**Medical System v1.0.0** - 医療従事者の負担軽減と時間効率の改善を目指して
