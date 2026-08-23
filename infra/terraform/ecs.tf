# ECS Fargate。バックエンド API を動かす。

resource "aws_ecr_repository" "backend" {
  name                 = "${local.name}-backend"
  image_tag_mutability = "IMMUTABLE" # 同じタグを上書きさせない（何が動いているか確定させる）

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "直近30個だけ残す。古いイメージの保管料を抑える"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 30
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecs_cluster" "main" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name}-backend"
  retention_in_days = var.log_retention_days
}

# ---------------------------------------------------------------- IAM

# タスクを起動するための権限（イメージの取得・ログ・シークレットの読み出し）
resource "aws_iam_role" "task_execution" {
  name = "${local.name}-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "task_execution_secrets" {
  name = "read-secrets"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      # このアプリのシークレットだけ。ワイルドカードで全部読ませない
      Resource = [
        aws_secretsmanager_secret.database_url.arn,
        aws_secretsmanager_secret.jwt_secret.arn,
        aws_secretsmanager_secret.openai_api_key.arn,
        aws_secretsmanager_secret.smtp_password.arn,
      ]
    }]
  })
}

# アプリ自身の権限。現状 AWS API は直接呼ばない（SES も SMTP 経由）ため空。
# ECS Exec でコンテナに入るための権限だけ付ける。
resource "aws_iam_role" "task" {
  name = "${local.name}-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "task_exec_command" {
  name = "ecs-exec"
  role = aws_iam_role.task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel",
      ]
      Resource = "*"
    }]
  })
}

# ---------------------------------------------------------------- タスク定義

locals {
  backend_environment = [
    { name = "APP_ENV", value = "production" },
    { name = "APP_DEBUG", value = "false" },
    { name = "LOG_LEVEL", value = "INFO" },
    { name = "LOG_JSON", value = "true" },
    { name = "PORT", value = "8000" },
    { name = "WEB_CONCURRENCY", value = tostring(var.web_concurrency) },

    # CORS の許可オリジン。CloudFront で配信するサイトのドメイン
    { name = "FRONTEND_URL", value = "https://${var.domain_name},https://www.${var.domain_name}" },

    # アプリの既定は 0（X-Forwarded-For を信用しない）だが、ここでは 1 にする。
    # この構成では API の前段が ALB 1段だと分かっているため。
    # 0 のままだと全リクエストが ALB の内部アドレスに見え、
    # レート制限が IP 単位ではなく全体で1枠になる。
    # CloudFront を API の前にも置く構成に変えたら 2 にすること。
    # 詳細は backend/app/dependencies.py の client_ip
    { name = "TRUSTED_PROXY_HOPS", value = "1" },
    { name = "TRUSTED_PROXY_IPS", value = var.vpc_cidr },

    # レート制限の共有ストア。転送時暗号化を有効にしているため rediss://
    {
      name  = "REDIS_URL",
      value = "rediss://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379/0"
    },

    { name = "OPENAI_MODEL", value = var.openai_model },
    { name = "ADMIN_EMAILS", value = var.admin_emails },

    # SES の SMTP エンドポイント。587 は STARTTLS
    { name = "MAIL_HOST", value = "email-smtp.${var.region}.amazonaws.com" },
    { name = "MAIL_PORT", value = "587" },
    { name = "MAIL_USE_TLS", value = "true" },
    { name = "MAIL_USERNAME", value = aws_iam_access_key.ses_smtp.id },
    { name = "MAIL_FROM_ADDRESS", value = var.mail_from_address },
    { name = "MAIL_FROM_NAME", value = var.mail_from_name },
    { name = "MAIL_CONFIGURATION_SET", value = aws_sesv2_configuration_set.main.configuration_set_name },
    { name = "CONTACT_MAIL_TO", value = var.contact_mail_to },
  ]

  backend_secrets = [
    { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.database_url.arn },
    { name = "JWT_SECRET_KEY", valueFrom = aws_secretsmanager_secret.jwt_secret.arn },
    { name = "OPENAI_API_KEY", valueFrom = aws_secretsmanager_secret.openai_api_key.arn },
    { name = "MAIL_PASSWORD", valueFrom = aws_secretsmanager_secret.smtp_password.arn },
  ]
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
    essential = true

    portMappings = [{
      containerPort = 8000
      protocol      = "tcp"
    }]

    environment = local.backend_environment
    secrets     = local.backend_secrets

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "backend"
      }
    }

    # ALB のヘルスチェックとは別に、コンテナ自身の生存も見る
    healthCheck = {
      command     = ["CMD-SHELL", "curl -fsS http://localhost:8000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }

    # SIGTERM から SIGKILL までの猶予。
    # アプリの graceful shutdown（25秒）が終わるまで待つ
    stopTimeout = 30
  }])
}

# ---------------------------------------------------------------- サービス

resource "aws_ecs_service" "backend" {
  name            = "${local.name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  # 障害調査でコンテナに入れるようにする（aws ecs execute-command）
  enable_execute_command = true

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8000
  }

  # 起動直後のヘルスチェック失敗で切り離されないようにする。
  # マイグレーションと DB 接続待ちで最初の数十秒は応答しない
  health_check_grace_period_seconds = 120

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  # 新しいタスクが安定しなければ自動で前の版へ戻す。
  # これが無いと、壊れたイメージを出した瞬間に全断のまま止まる
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    # タスク定義は CI（deploy.yml）が更新する。
    # terraform apply で古い版へ巻き戻さないよう無視する
    ignore_changes = [task_definition, desired_count]
  }

  depends_on = [aws_lb_listener.https]
}

# ---------------------------------------------------------------- オートスケール

resource "aws_appautoscaling_target" "backend" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.backend_min_count
  max_capacity       = var.backend_max_count
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${local.name}-cpu"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 60
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# AI資料生成は OpenAI の応答待ちで CPU を使わないまま滞留する。
# CPU だけを見ていると、詰まっているのにスケールしない
resource "aws_appautoscaling_policy" "backend_requests" {
  name               = "${local.name}-requests"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      # 形式は app/<lb名>/<lb-id>/targetgroup/<tg名>/<tg-id>。
      # arn_suffix がそれぞれ前半・後半をそのまま返す
      resource_label = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.backend.arn_suffix}"
    }
    target_value       = 300
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
