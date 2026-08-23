# ---------------------------------------------------------------- 基本

variable "project" {
  description = "リソース名の接頭辞。他プロジェクトと混ざらない短い名前にする"
  type        = string
  default     = "mr-alignment"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,20}$", var.project))
    error_message = "project は英小文字・数字・ハイフンで 3〜21 文字にしてください（ALB 名などの制約）。"
  }
}

variable "environment" {
  description = "環境名。prod / stg"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "リソースを作るリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "tags" {
  description = "全リソースへ付ける追加タグ。原価管理に使う"
  type        = map(string)
  default     = {}
}

# ---------------------------------------------------------------- ドメイン

variable "domain_name" {
  description = "サイトの公開ドメイン。例: sudo-pe.jp"
  type        = string
}

variable "api_subdomain" {
  description = "API のサブドメイン。ALB に向ける"
  type        = string
  default     = "api"
}

variable "route53_zone_id" {
  description = <<-EOT
    domain_name の公開ホストゾーン ID。

    ACM の証明書検証・SES の DKIM・ALB と CloudFront の別名レコードを
    自動で作るために使う。Route53 を使っていない場合は、
    infra/README.md の「Route53 を使わない場合」を参照すること。
  EOT
  type        = string
}

# ---------------------------------------------------------------- ネットワーク

variable "vpc_cidr" {
  description = "VPC の CIDR"
  type        = string
  default     = "10.20.0.0/16"
}

variable "az_count" {
  description = "使用するアベイラビリティゾーン数。RDS のマルチAZ には 2 以上が必要"
  type        = number
  default     = 2
}

variable "single_nat_gateway" {
  description = <<-EOT
    NAT Gateway を1つだけ作るか。

    true にすると月額が約 $32 で済むが、その AZ が落ちると
    プライベートサブネットからの外向き通信（SES・OpenAI）が止まる。
    可用性を優先するなら false（AZ ごとに1つ）。
  EOT
  type        = bool
  default     = true
}

# ---------------------------------------------------------------- バックエンド

variable "backend_image_tag" {
  description = "ECR のイメージタグ。CI が commit SHA を入れる"
  type        = string
  default     = "latest"
}

variable "backend_cpu" {
  description = "Fargate の CPU ユニット（256 = 0.25 vCPU）"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Fargate のメモリ（MiB）。CPU との組み合わせに制約がある"
  type        = number
  default     = 1024
}

variable "backend_desired_count" {
  description = "常時動かすタスク数。2 以上にするとデプロイ中も無停止になる"
  type        = number
  default     = 2
}

variable "backend_min_count" {
  description = "オートスケールの下限"
  type        = number
  default     = 2
}

variable "backend_max_count" {
  description = "オートスケールの上限"
  type        = number
  default     = 6
}

variable "web_concurrency" {
  description = "1タスクあたりの uvicorn ワーカー数"
  type        = number
  default     = 2
}

# ---------------------------------------------------------------- データベース

variable "db_instance_class" {
  description = "RDS のインスタンスクラス"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "初期ストレージ（GiB）"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "自動拡張の上限（GiB）。0 で自動拡張なし"
  type        = number
  default     = 100
}

variable "db_multi_az" {
  description = "RDS をマルチAZにするか。可用性は上がるが料金は約2倍"
  type        = bool
  default     = false
}

variable "db_backup_retention_days" {
  description = "自動バックアップの保持日数。商用では最低 7 日"
  type        = number
  default     = 14

  validation {
    condition     = var.db_backup_retention_days >= 7
    error_message = "商用運用では 7 日以上にしてください（誤操作に気づくまでの猶予）。"
  }
}

variable "db_deletion_protection" {
  description = "RDS の削除保護。商用では必ず true"
  type        = bool
  default     = true
}

# ---------------------------------------------------------------- Redis

variable "redis_node_type" {
  description = "ElastiCache のノードタイプ。レート制限のカウンタ用途なので最小で足りる"
  type        = string
  default     = "cache.t4g.micro"
}

# ---------------------------------------------------------------- アプリ設定

variable "openai_model" {
  description = "AI資料生成に使うモデル"
  type        = string
  default     = "gpt-4o-mini"
}

variable "admin_emails" {
  description = "面談予約の管理画面を使えるアカウント（カンマ区切り）"
  type        = string
  default     = ""
}

variable "contact_mail_to" {
  description = "問い合わせ・予約・資料請求の通知先"
  type        = string
}

variable "mail_from_address" {
  description = "送信元アドレス。domain_name のドメインにすること（SES の検証対象）"
  type        = string
}

variable "mail_from_name" {
  description = "送信者名"
  type        = string
  default     = "須藤技術士事務所"
}

variable "alert_email" {
  description = "CloudWatch アラームの通知先。届いた購読確認メールを承認すること"
  type        = string
}

# ---------------------------------------------------------------- 任意機能

variable "enable_waf" {
  description = <<-EOT
    ALB に AWS WAF を付けるか。

    AWS 管理ルール（一般的な攻撃・不正な入力）と、
    IP あたりのリクエスト数制限が有効になる。月額 $10 程度。
  EOT
  type        = bool
  default     = true
}

variable "waf_rate_limit" {
  description = "WAF の IP あたり上限（5分間のリクエスト数）"
  type        = number
  default     = 2000
}

variable "log_retention_days" {
  description = "CloudWatch Logs の保持日数"
  type        = number
  default     = 30
}

variable "create_github_oidc_provider" {
  description = <<-EOT
    GitHub の OIDC プロバイダを作るか。

    アカウントに1つしか作れない。別のプロジェクトで既に作っている場合は
    false にする（true のままだと EntityAlreadyExists で失敗する）。
  EOT
  type        = bool
  default     = true
}

variable "github_repository" {
  description = <<-EOT
    デプロイを許可する GitHub リポジトリ（owner/repo）。

    GitHub Actions から OIDC で AssumeRole するための信頼ポリシーに使う。
    空にすると CI 用のロールを作らない。
  EOT
  type        = string
  default     = ""
}
