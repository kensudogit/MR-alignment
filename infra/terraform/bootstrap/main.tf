# tfstate の置き場。
#
# 本体の terraform より先に、一度だけここを apply する。
# 「state を置く先」を state で管理することはできないため、
# この構成だけはローカル state で作る（作成後は変更しない）。
#
#   cd infra/terraform/bootstrap
#   terraform init
#   terraform apply -var project=mr-alignment -var environment=prod

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "project" {
  type    = string
  default = "mr-alignment"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "region" {
  type    = string
  default = "ap-northeast-1"
}

data "aws_caller_identity" "current" {}

locals {
  name = "${var.project}-${var.environment}-tfstate-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket" "state" {
  bucket = local.name

  # state を消すと、既存リソースを Terraform から触れなくなる
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  # 壊れた state を上書きしても前の版に戻せるようにする
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket = aws_s3_bucket.state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 同時実行の排他。2人が同時に apply すると state が壊れる
resource "aws_dynamodb_table" "lock" {
  name         = "${var.project}-${var.environment}-tflock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

output "backend_config" {
  description = "本体の terraform init に渡す内容"
  value       = <<-EOT

    infra/terraform/envs/${var.environment}.backend.hcl に以下を書く:

      bucket         = "${aws_s3_bucket.state.id}"
      key            = "${var.project}/${var.environment}/terraform.tfstate"
      region         = "${var.region}"
      dynamodb_table = "${aws_dynamodb_table.lock.name}"
      encrypt        = true

    そのうえで:

      cd infra/terraform
      terraform init -backend-config=envs/${var.environment}.backend.hcl

  EOT
}
