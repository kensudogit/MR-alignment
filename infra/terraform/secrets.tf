# 秘密情報。
#
# ECS のタスク定義には値を書かず、Secrets Manager の ARN を参照させる
# （タスク定義は describe-task-definition で誰でも読めるため、
# environment に直接書くと権限のある全員に見える）。
#
# OPENAI_API_KEY だけは Terraform では値を管理しない。
# tfstate は平文であり、キーを variable で受け取ると state に残るため。
# 箱だけ作り、値は AWS CLI か画面から入れる（下の ignore_changes 参照）。

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

# ---------------------------------------------------------------- DB 接続文字列

resource "aws_secretsmanager_secret" "database_url" {
  name                    = "${local.name}/database-url"
  description             = "アプリが使う DATABASE_URL（asyncpg 形式）"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = format(
    "postgresql+asyncpg://%s:%s@%s:%s/%s",
    aws_db_instance.main.username,
    urlencode(random_password.db.result),
    aws_db_instance.main.address,
    aws_db_instance.main.port,
    aws_db_instance.main.db_name,
  )
}

# ---------------------------------------------------------------- JWT 署名鍵

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${local.name}/jwt-secret-key"
  description             = "JWT の署名鍵。変えると発行済みトークンが全て無効になる"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

# ---------------------------------------------------------------- OpenAI

resource "aws_secretsmanager_secret" "openai_api_key" {
  name                    = "${local.name}/openai-api-key"
  description             = "OpenAI APIキー。値は Terraform では管理しない"
  recovery_window_in_days = 7
}

# 箱だけ作る。値を入れるまで AI 資料生成は 503 を返す（アプリ側で握っている）。
#
#   aws secretsmanager put-secret-value \
#     --secret-id mr-alignment-prod/openai-api-key \
#     --secret-string 'sk-...'
resource "aws_secretsmanager_secret_version" "openai_api_key" {
  secret_id     = aws_secretsmanager_secret.openai_api_key.id
  secret_string = "PLACEHOLDER-未設定"

  lifecycle {
    # 手で入れた値を terraform apply で上書きしない
    ignore_changes = [secret_string]
  }
}

# ---------------------------------------------------------------- SES SMTP

resource "aws_secretsmanager_secret" "smtp_password" {
  name                    = "${local.name}/ses-smtp-password"
  description             = "SES の SMTP パスワード（IAM シークレットキーから導出）"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "smtp_password" {
  secret_id     = aws_secretsmanager_secret.smtp_password.id
  secret_string = aws_iam_access_key.ses_smtp.ses_smtp_password_v4
}
