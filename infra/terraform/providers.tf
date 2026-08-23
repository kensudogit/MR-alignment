provider "aws" {
  region = var.region

  default_tags {
    tags = merge(
      {
        Project     = var.project
        Environment = var.environment
        ManagedBy   = "terraform"
      },
      var.tags,
    )
  }
}

# CloudFront の証明書は us-east-1 にしか置けない（AWS の仕様）。
# 東京リージョンで作った証明書はディストリビューションに付けられない。
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = merge(
      {
        Project     = var.project
        Environment = var.environment
        ManagedBy   = "terraform"
      },
      var.tags,
    )
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name = "${var.project}-${var.environment}"

  api_domain = "${var.api_subdomain}.${var.domain_name}"

  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)

  account_id = data.aws_caller_identity.current.account_id
}
