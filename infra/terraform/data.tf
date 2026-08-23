# RDS PostgreSQL と ElastiCache Redis。
#
# どちらもプライベートサブネットに置き、ECS タスクのセキュリティグループ
# からのみ到達できる。パブリックアクセスは常に無効。

# ---------------------------------------------------------------- RDS

resource "random_password" "db" {
  length = 32
  # RDS のマスターパスワードに使えない文字を除く（/ @ " と空白）
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = local.name }
}

resource "aws_db_parameter_group" "main" {
  name   = "${local.name}-pg15"
  family = "postgres15"

  # 1秒以上かかったクエリを記録する。
  # 遅くなってから調べようとしても、記録が無ければ原因は分からない。
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_instance" "main" {
  identifier = local.name

  engine         = "postgres"
  engine_version = "15"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "mr_alignment"
  username = "postgres"
  password = random_password.db.result
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  parameter_group_name   = aws_db_parameter_group.main.name
  publicly_accessible    = false

  multi_az = var.db_multi_az

  backup_retention_period = var.db_backup_retention_days
  backup_window           = "17:00-18:00" # JST 02:00-03:00
  maintenance_window      = "sun:18:00-sun:19:00"
  copy_tags_to_snapshot   = true

  # 削除時にスナップショットを残す。final_snapshot_identifier を
  # 指定しないと skip_final_snapshot=false でエラーになる
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name}-final-${formatdate("YYYYMMDDhhmmss", timestamp())}"
  deletion_protection       = var.db_deletion_protection

  auto_minor_version_upgrade = true
  apply_immediately          = false

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  enabled_cloudwatch_logs_exports       = ["postgresql"]

  tags = { Name = local.name }

  lifecycle {
    # 毎回 timestamp() が変わるため、差分として出さない
    ignore_changes = [final_snapshot_identifier]
  }
}

# ---------------------------------------------------------------- Redis
#
# 用途はレート制限のカウンタ1つだけ。消えても再構築されるため、
# 永続化もレプリカも要らない。最小構成で置く。

resource "aws_elasticache_subnet_group" "main" {
  name       = local.name
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = local.name
  description          = "${local.name} レート制限の共有カウンタ"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = var.redis_node_type
  port           = 6379

  num_cache_clusters         = 1
  automatic_failover_enabled = false
  multi_az_enabled           = false

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  # VPC 内に閉じているが、保存時・転送時とも暗号化しておく。
  # 転送時暗号化を有効にすると接続は rediss:// になる（下の outputs 参照）。
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  # カウンタなのでスナップショットは取らない
  snapshot_retention_limit = 0

  maintenance_window       = "sun:19:00-sun:20:00"
  auto_minor_version_upgrade = true

  tags = { Name = local.name }
}
