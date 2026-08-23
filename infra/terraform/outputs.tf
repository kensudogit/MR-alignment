output "site_url" {
  description = "公開サイトの URL"
  value       = "https://${var.domain_name}"
}

output "api_url" {
  description = "API の URL。フロントエンドのビルド時に VITE_API_URL へ渡す"
  value       = "https://${local.api_domain}"
}

output "ecr_repository_url" {
  description = "バックエンドのイメージを push する先"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.backend.name
}

output "frontend_bucket" {
  description = "ビルド成果物の同期先"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  description = "デプロイ後のキャッシュ削除に使う"
  value       = aws_cloudfront_distribution.frontend.id
}

output "github_actions_role_arn" {
  description = "GitHub Actions の Variables に AWS_ROLE_ARN として設定する"
  value       = var.github_repository == "" ? "" : aws_iam_role.github_actions[0].arn
}

output "log_group" {
  description = "アプリのログ。request_id で串刺しにできる"
  value       = aws_cloudwatch_log_group.backend.name
}

output "database_endpoint" {
  description = "RDS のエンドポイント（VPC 内からのみ到達できる）"
  value       = aws_db_instance.main.address
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "ses_smtp_username" {
  description = "SES の SMTP ユーザー名。パスワードは Secrets Manager にある"
  value       = aws_iam_access_key.ses_smtp.id
}

output "next_steps" {
  description = "apply 後にやること"
  value       = <<-EOT

    1. OpenAI APIキーを入れる（Terraform では値を管理していない）
       aws secretsmanager put-secret-value \
         --secret-id ${aws_secretsmanager_secret.openai_api_key.name} \
         --secret-string 'sk-...'

    2. SES の本番アクセスを申請する
       初期状態はサンドボックスで、検証済みアドレス宛にしか送れない。
       AWS コンソール → SES → Account dashboard → Request production access

    3. アラートの購読を承認する
       ${var.alert_email} 宛の確認メール2通（alerts と ses-events）を承認する

    4. 最初のデプロイ
       GitHub Actions の Variables に以下を設定して deploy を実行する
         AWS_ROLE_ARN   = ${var.github_repository == "" ? "（github_repository 未設定）" : aws_iam_role.github_actions[0].arn}
         AWS_REGION     = ${var.region}
         ECR_REPOSITORY = ${aws_ecr_repository.backend.name}
         ECS_CLUSTER    = ${aws_ecs_cluster.main.name}
         ECS_SERVICE    = ${aws_ecs_service.backend.name}
         S3_BUCKET      = ${aws_s3_bucket.frontend.id}
         CLOUDFRONT_ID  = ${aws_cloudfront_distribution.frontend.id}
         VITE_API_URL   = https://${local.api_domain}

    5. 管理者アカウントを作る
       サイトの会員登録から ADMIN_EMAILS のアドレスで登録し、
       https://${var.domain_name}/admin/appointments を開く

  EOT
}
