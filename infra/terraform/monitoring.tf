# 監視。
#
# 「気づけない障害」を無くすことが目的。
# 面談予約は申し込みが届かないと機能そのものが成立しないため、
# 5xx とタスクの健全性は必ず拾う。

resource "aws_sns_topic" "alerts" {
  name = "${local.name}-alerts"
}

resource "aws_sns_topic_subscription" "alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email

  # 購読確認メールが届くので、承認するまで通知は飛ばない
}

locals {
  alarm_actions = [aws_sns_topic.alerts.arn]
}

# ---------------------------------------------------------------- ALB

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name}-alb-5xx"
  alarm_description   = "アプリが 5xx を返している。まず CloudWatch Logs を request_id で追うこと"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_Target_5XX_Count"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy" {
  alarm_name          = "${local.name}-alb-unhealthy-hosts"
  alarm_description   = "正常なタスクが1つも無い。サイトは全断している"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HealthyHostCount"
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 2
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.backend.arn_suffix
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  alarm_name          = "${local.name}-alb-latency"
  alarm_description   = "応答が遅い。AI資料生成は元々遅いため p90 で見る"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "TargetResponseTime"
  extended_statistic  = "p90"
  period              = 300
  evaluation_periods  = 2
  threshold           = 3
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.backend.arn_suffix
  }

  alarm_actions = local.alarm_actions
}

# ---------------------------------------------------------------- RDS

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${local.name}-rds-cpu"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${local.name}-rds-free-storage"
  alarm_description   = "空き容量が 2GiB を切った。書き込みが止まる前に拡張すること"
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  statistic           = "Minimum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 2 * 1024 * 1024 * 1024
  comparison_operator = "LessThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${local.name}-rds-connections"
  alarm_description   = "接続数が多い。プールの設定漏れかタスクの増やしすぎ"
  namespace           = "AWS/RDS"
  metric_name         = "DatabaseConnections"
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = local.alarm_actions
}

# ---------------------------------------------------------------- ECS

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "${local.name}-ecs-cpu"
  namespace           = "AWS/ECS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  threshold           = 85
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.backend.name
  }

  alarm_actions = local.alarm_actions
}

# ---------------------------------------------------------------- ログからの検知

# メールが送れていないことに気づけるようにする。
# 「予約は入っているのに誰も知らない」が最も損害の大きい壊れ方
resource "aws_cloudwatch_log_metric_filter" "mail_failure" {
  name           = "${local.name}-mail-failure"
  log_group_name = aws_cloudwatch_log_group.backend.name

  # JSON ログなので、レベルとメッセージで絞れる
  pattern = "{ $.level = \"ERROR\" && $.message = \"*送信に失敗*\" }"

  metric_transformation {
    name          = "MailSendFailures"
    namespace     = local.name
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "mail_failure" {
  alarm_name          = "${local.name}-mail-failure"
  alarm_description   = "メール送信に失敗している。予約や問い合わせが相手に届いていない"
  namespace           = local.name
  metric_name         = aws_cloudwatch_log_metric_filter.mail_failure.metric_transformation[0].name
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
}

# 未処理の例外。アプリは 500 を返しつつログに残す
resource "aws_cloudwatch_log_metric_filter" "unhandled_exception" {
  name           = "${local.name}-unhandled-exception"
  log_group_name = aws_cloudwatch_log_group.backend.name

  pattern = "{ $.message = \"*未処理の例外*\" }"

  metric_transformation {
    name          = "UnhandledExceptions"
    namespace     = local.name
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "unhandled_exception" {
  alarm_name          = "${local.name}-unhandled-exception"
  alarm_description   = "想定外の例外。request_id で該当リクエストを追うこと"
  namespace           = local.name
  metric_name         = aws_cloudwatch_log_metric_filter.unhandled_exception.metric_transformation[0].name
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 3
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
}

# ---------------------------------------------------------------- ダッシュボード

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = local.name

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title  = "リクエスト数と 5xx"
          region = var.region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix],
            [".", "HTTPCode_Target_5XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
          ]
          stat   = "Sum"
          period = 300
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title  = "応答時間"
          region = var.region
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix,
            { stat = "p50" }],
            ["...", { stat = "p90" }],
            ["...", { stat = "p99" }],
          ]
          period = 300
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title  = "ECS タスク"
          region = var.region
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.main.name,
            "ServiceName", aws_ecs_service.backend.name],
            [".", "MemoryUtilization", ".", ".", ".", "."],
          ]
          stat   = "Average"
          period = 300
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title  = "RDS"
          region = var.region
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.identifier],
            [".", "DatabaseConnections", ".", "."],
          ]
          stat   = "Average"
          period = 300
        }
      },
    ]
  })
}
