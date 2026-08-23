# Amazon SES。
#
# 面談予約の控え・確定連絡は、届かなければ機能そのものが成立しない。
# 到達率のために DKIM と MAIL FROM ドメインまで設定する。
#
# 【重要】SES は初期状態がサンドボックスで、
# 「検証済みのアドレス宛にしか送れない」「1日 200 通まで」の制限がある。
# 実際の見込み客へ送るには、本番アクセスの申請が別途必要。
# 申請は AWS コンソールの SES → Account dashboard から行う（審査に数日）。

resource "aws_sesv2_email_identity" "domain" {
  email_identity = var.domain_name

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

# DKIM の CNAME を3件。これが無いと、受信側で署名を検証できず迷惑メール扱いされやすい
resource "aws_route53_record" "dkim" {
  count = 3

  zone_id = var.route53_zone_id
  name    = "${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

# MAIL FROM ドメイン。
# 既定では Return-Path が amazonses.com になり、SPF の観点で「第三者が送っている」
# 状態になる。自ドメインのサブドメインに揃えると SPF が自分のドメインで通る。
resource "aws_sesv2_email_identity_mail_from_attributes" "domain" {
  email_identity   = aws_sesv2_email_identity.domain.email_identity
  mail_from_domain = "mail.${var.domain_name}"

  # MAIL FROM の設定が壊れたときに送信を止める。
  # 黙って amazonses.com へ戻ると、到達率が落ちた理由が分からなくなる
  behavior_on_mx_failure = "REJECT_MESSAGE"
}

resource "aws_route53_record" "mail_from_mx" {
  zone_id = var.route53_zone_id
  name    = aws_sesv2_email_identity_mail_from_attributes.domain.mail_from_domain
  type    = "MX"
  ttl     = 600
  records = ["10 feedback-smtp.${var.region}.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = var.route53_zone_id
  name    = aws_sesv2_email_identity_mail_from_attributes.domain.mail_from_domain
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com ~all"]
}

# DMARC。SPF/DKIM が通らないメールをどう扱うか受信側に伝える。
# 最初は none（監視のみ）で始め、レポートを見てから quarantine へ上げること。
resource "aws_route53_record" "dmarc" {
  zone_id = var.route53_zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 600
  records = ["v=DMARC1; p=none; rua=mailto:${var.contact_mail_to}"]
}

# ---------------------------------------------------------------- 配信イベント

resource "aws_sesv2_configuration_set" "main" {
  configuration_set_name = local.name

  delivery_options {
    tls_policy = "REQUIRE"
  }

  reputation_options {
    reputation_metrics_enabled = true
  }

  sending_options {
    sending_enabled = true
  }
}

# バウンス・苦情は放置すると SES のアカウント自体が停止される。
# 気づけるように通知先へ流す。
resource "aws_sns_topic" "ses_events" {
  name = "${local.name}-ses-events"
}

resource "aws_sns_topic_subscription" "ses_events" {
  topic_arn = aws_sns_topic.ses_events.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sesv2_configuration_set_event_destination" "sns" {
  configuration_set_name = aws_sesv2_configuration_set.main.configuration_set_name
  event_destination_name = "bounces-and-complaints"

  event_destination {
    enabled              = true
    matching_event_types = ["BOUNCE", "COMPLAINT", "REJECT", "RENDERING_FAILURE"]

    sns_destination {
      topic_arn = aws_sns_topic.ses_events.arn
    }
  }
}

resource "aws_sns_topic_policy" "ses_events" {
  arn = aws_sns_topic.ses_events.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ses.amazonaws.com" }
      Action    = "SNS:Publish"
      Resource  = aws_sns_topic.ses_events.arn
      Condition = {
        StringEquals = { "AWS:SourceAccount" = local.account_id }
      }
    }]
  })
}

# ---------------------------------------------------------------- SMTP 認証情報
#
# アプリは smtplib で送る（既存実装のまま使える）。
# SES の SMTP 認証には IAM のアクセスキーから導出したパスワードを使う。

resource "aws_iam_user" "ses_smtp" {
  name = "${local.name}-ses-smtp"
  path = "/service/"
}

resource "aws_iam_user_policy" "ses_smtp" {
  name = "send-email"
  user = aws_iam_user.ses_smtp.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ses:SendRawEmail"]
      Resource = "*"
      Condition = {
        # 自分のドメイン以外を差出人にできないようにする。
        # キーが漏れても、迷惑メールの踏み台にはならない
        StringEquals = {
          "ses:FromAddress" = var.mail_from_address
        }
      }
    }]
  })
}

resource "aws_iam_access_key" "ses_smtp" {
  user = aws_iam_user.ses_smtp.name
}
