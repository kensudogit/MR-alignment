-- MR-alignment データベース初期化スクリプト
--
-- 【重要】ここでアプリケーションのテーブルを作成してはならない。
--
-- 旧版はここで users テーブルを id UUID で作成していたが、
-- Laravel のマイグレーションは id を bigint(auto increment) で定義しており、
-- 両者が競合していた。docker-entrypoint.sh がマイグレーション失敗を
-- 握り潰していたため、init.sql が作った UUID 版テーブルが残り続け、
-- User::create() が期待するスキーマと食い違う状態になっていた。
--
-- テーブル定義はすべて Laravel のマイグレーションに一本化する。
--   backend/database/migrations/
--
-- また、旧版はサンプルユーザーを固定パスワードのハッシュ付きで INSERT していた。
-- 本番環境で同じスクリプトが流れると既知パスワードのアカウントができるため、
-- 開発用データは Laravel のシーダー（database/seeders）で管理する。
--
-- このファイルは PostgreSQL の拡張機能の有効化など、
-- マイグレーションでは行えない初期化のみに使用する。

-- UUID 生成関数（将来 UUID を使う場合に備えて有効化しておく）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 曖昧検索・全文検索を使う場合に備えて
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
