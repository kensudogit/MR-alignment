terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # tfstate は S3 に置き、DynamoDB で排他制御する。
  # ローカルに置くと、2人目が触った瞬間に構成が壊れる。
  #
  # このバケットとテーブルは terraform では作れない（state を置く先が
  # まだ無いため）。infra/terraform/bootstrap を先に一度だけ適用すること。
  #
  # bucket / dynamodb_table は環境ごとに変わるため、値は
  # `terraform init -backend-config=envs/prod.backend.hcl` で与える。
  backend "s3" {}
}
