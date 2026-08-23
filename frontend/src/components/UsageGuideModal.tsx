import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { siteInfo, hasEmail } from '../config/site';
import './UsageGuideModal.css';

interface UsageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 利用手順（サイトの使い方）。
 *
 * フォームが何をするものか、送信後に何が起きるか、いつ返事が来るかを
 * 1か所にまとめる。ここに書いていないと、利用者は
 * 「送ったが届いたのか分からない」まま待つことになる。
 *
 * 担当者向けの2節（運用・AWS への導入）は、管理者でログインしている
 * ときだけ表示する。公開 LP なので、環境変数名や構築手順を
 * 訪問者に見せる必要はない。
 *
 * ただしこれは**表示の出し分けであって、権限ではない**。
 * 隠しているのは文章だけで、守るべきデータは管理APIがサーバー側で
 * 毎回判定している（app/dependencies.py の get_admin_user）。
 *
 * 【重要】ここに書いた文章は、管理者でなくても JS バンドルに含まれる。
 * React の条件分岐は画面から消すだけで、配信物からは消えない。
 *   grep -o "terraform apply" dist/assets/index-*.js   ← ヒットする
 * そのため、**秘密にすべき情報をこのファイルに書いてはいけない**。
 * 手順や環境変数名までは許容し、鍵・パスワード・内部ホスト名は書かない。
 * 本当に見せたくない内容は infra/README.md（リポジトリ内）に置くこと。
 *
 * 内容は実装と一致させること。特に次の3つは、変えたらここも直す。
 *   - 受付時間と予約の枠     backend/app/services/appointment.py
 *   - 送信されるメールの種類  backend/app/services/mailer.py
 *   - 管理画面の権限         backend/app/dependencies.py の get_admin_user
 */

const TAGS = [
  '面談予約',
  'AI資料の自動生成',
  'お問い合わせ',
  '会員登録',
  '予約管理',
  'React 18',
  'FastAPI',
  'PostgreSQL',
  'Amazon SES',
];

type Step = {
  no: string;
  title: string;
  body: string;
  /** そのまま打てるコマンド。手順の再現性が要る箇所だけ付ける */
  code?: string;
  note?: { text: React.ReactNode; tone?: 'info' | 'warn' };
};

/** 来訪者（見込み客）の操作 */
const VISITOR_STEPS: Step[] = [
  {
    no: '01',
    title: 'AI資料をダウンロードする',
    body:
      'トップページの「ITサービス資料ダウンロード（無料）」に、業種・会社名・お名前・メールアドレスを入力します。' +
      '入力内容をもとに提案資料を生成し、そのアドレス宛にお送りします。会員登録は不要です。',
    note: {
      text: (
        <>
          生成には十数秒かかります。資料は画面にも表示されるため、
          メールが届かない場合でもその場で読めます。
        </>
      ),
    },
  },
  {
    no: '02',
    title: '面談を予約する',
    body:
      'ヘッダーまたは「ご相談は無料です」の「面談予約」から申し込みます。' +
      'お名前・メールアドレス・電話番号・会社名・相談内容・希望日時が必要です。',
    note: {
      text: (
        <>
          希望日を選ぶと、<strong>その日の空き枠だけが選べる状態</strong>に変わります。
          すでに埋まっている時間帯は「（予約済み）」と表示され、選べません。
          受付は{siteInfo.businessHours}、1時間単位（12:00〜13:00 を除く）、
          90日先までです。
        </>
      ),
    },
  },
  {
    no: '03',
    title: '受付の控えメールを確認する',
    body:
      '送信すると画面に受付番号（AP- から始まる番号）が出て、同時に控えのメールが届きます。' +
      'ご希望日時・ご入力内容が記載されています。',
    note: {
      tone: 'warn',
      text: (
        <>
          この時点では<strong>まだ予約は確定していません</strong>。
          控えは「申し込みを受け取った」という記録です。
          数分経っても届かない場合は迷惑メールフォルダをご確認ください。
        </>
      ),
    },
  },
  {
    no: '04',
    title: '確定のご連絡を受け取る',
    body:
      '担当者が空き状況を確認し、2営業日以内に確定します。確定すると「面談日程が確定しました」というメールが自動で届きます。',
    note: {
      text: (
        <>
          日程の変更・キャンセルは、控えまたは確定メールへ<strong>返信</strong>してお知らせください。
          取り消した場合は「面談予約を取り消しました」のメールが届き、その枠は他の方が予約できるようになります。
        </>
      ),
    },
  },
  {
    no: '05',
    title: '相談内容だけ先に伝える（任意）',
    body:
      '日程を決める前に用件だけ伝えたい場合は「お問い合わせ」フォームを使います。' +
      '件名・本文・希望の連絡方法・緊急度を指定できます。受付番号は CT- から始まります。',
    note: {
      text: (
        <>
          AIチャット相談もありますが、回答は生成AIによるものです。
          正確さが必要な内容は、お問い合わせフォームか面談をご利用ください。
        </>
      ),
    },
  },
];

/** 担当者（管理者）の操作 */
const ADMIN_STEPS: Step[] = [
  {
    no: '06',
    title: '管理画面を開く',
    body:
      '/admin/appointments を開き、管理者アカウントでログインします。予約の一覧・詳細・状態変更ができます。',
    note: {
      text: (
        <>
          開けるのは、バックエンドの環境変数{' '}
          <code className="guide-inline-code">ADMIN_EMAILS</code>{' '}
          に登録したアドレスのアカウントだけです。
          予約には氏名と電話番号が含まれるため、ログイン済みというだけでは通しません。
        </>
      ),
    },
  },
  {
    no: '07',
    title: '予約を確定する / 取り消す',
    body:
      '一覧の「詳細」から、状態を「確定」「キャンセル」「実施済み」「未確定」に変更できます。' +
      '担当者メモも残せます（申込者には表示されません）。',
    note: {
      text: (
        <>
          「確定」「キャンセル」にすると、申込者へ<strong>自動でメールが届きます</strong>。
          電話などで既に伝えてある場合は、チェックボックスを外してから操作してください。
          「未確定」「実施済み」への変更ではメールは送りません。
        </>
      ),
    },
  },
  {
    no: '08',
    title: 'メールが届いたかを確認する',
    body:
      '一覧の「メール」列に、控え・担当者通知・確定連絡それぞれの送信状況が出ます。',
    note: {
      tone: 'warn',
      text: (
        <>
          <strong>赤字で「未送信」</strong>と出ている行は、予約は入っているのに
          相手へ連絡が届いていません。個別にご連絡ください。
        </>
      ),
    },
  },
];

/**
 * AWS へ公開するまでの手順（担当者向け）。
 *
 * 詳細な手順・月額の目安・運用は infra/README.md に書いてある。
 * ここはその要約で、順番と「詰まりやすい点」を示すことが目的。
 */
const DEPLOY_STEPS: Step[] = [
  {
    no: '09',
    title: '前提をそろえる',
    body:
      'AWS アカウント（管理者権限）、公開ドメインの Route53 ホストゾーン、Terraform 1.6 以上、AWS CLI v2 を用意します。',
    note: {
      text: (
        <>
          ドメインを他社で取得している場合は、<strong>ネームサーバーを Route53 へ向けて</strong>ください。
          証明書の検証・SES の DKIM・別名レコードを自動で作るために必要です。
        </>
      ),
    },
  },
  {
    no: '10',
    title: 'tfstate の置き場を作る（最初の一度だけ）',
    body:
      '構成の状態を記録する S3 バケットと、同時実行を防ぐ DynamoDB テーブルを作ります。出力された内容を envs/prod.backend.hcl に書きます。',
    code: `cd infra/terraform/bootstrap
terraform init
terraform apply`,
    note: {
      text: (
        <>
          state をローカルに置くと、2人目が触った瞬間に構成が壊れます。
          この構成だけは「state を置く先がまだ無い」ため、例外的にローカル state で作ります。
        </>
      ),
    },
  },
  {
    no: '11',
    title: '変数を用意する',
    body:
      'envs/prod.tfvars.example を複製し、自分の値を書きます。最低限、ドメイン・ホストゾーンID・送信元アドレス・通知先・アラート通知先の5つは必ず変更します。',
    code: `cd infra/terraform
cp envs/prod.tfvars.example envs/prod.tfvars`,
    note: {
      text: (
        <>
          <code className="guide-inline-code">prod.tfvars</code> は .gitignore 済みです。
          実際の値をコミットしないでください。
        </>
      ),
    },
  },
  {
    no: '12',
    title: '構築する',
    body:
      'plan で作られるものを確認してから apply します。RDS と CloudFront の作成に時間がかかるため、完了まで15〜25分ほどかかります。',
    code: `terraform init -backend-config=envs/prod.backend.hcl
terraform plan  -var-file=envs/prod.tfvars
terraform apply -var-file=envs/prod.tfvars`,
    note: {
      text: (
        <>
          月額の目安は約 $145（2〜2.5万円）です。抑えるなら
          <code className="guide-inline-code">backend_desired_count = 1</code> と
          <code className="guide-inline-code">enable_waf = false</code>、
          可用性を上げるなら <code className="guide-inline-code">db_multi_az = true</code>。
          内訳は infra/README.md にあります。
        </>
      ),
    },
  },
  {
    no: '13',
    title: 'apply 後の設定を済ませる',
    body:
      'OpenAI の APIキーを Secrets Manager へ入れ（Terraform では値を管理しないため）、SES の本番アクセスを申請し、届いたアラートの購読確認メール2通を承認します。',
    code: `aws secretsmanager put-secret-value \\
  --secret-id mr-alignment-prod/openai-api-key \\
  --secret-string 'sk-...'`,
    note: {
      tone: 'warn',
      text: (
        <>
          <strong>SES は初期状態がサンドボックス</strong>で、検証済みのアドレス宛にしか送れません。
          この状態のまま公開すると、見込み客が面談を予約しても控えのメールが届きません。
          コンソールの SES → Account dashboard から本番アクセスを申請してください（審査に数日）。
        </>
      ),
    },
  },
  {
    no: '14',
    title: 'GitHub Actions を設定する',
    body:
      'terraform output の値を、リポジトリの Settings → Secrets and variables → Actions → Variables に登録します（AWS_ROLE_ARN / AWS_REGION / ECR_REPOSITORY / ECS_CLUSTER / ECS_SERVICE / S3_BUCKET / CLOUDFRONT_ID / VITE_API_URL）。',
    note: {
      text: (
        <>
          Secrets ではなく <strong>Variables</strong> に入れます。認証は OIDC で毎回一時的な資格情報を発行するため、
          アクセスキーは登録しません。長期キーは、漏れても気づけないためです。
        </>
      ),
    },
  },
  {
    no: '15',
    title: 'デプロイして動作を確認する',
    body:
      'main-clean へ push すると、バックエンドは ECR → ECS、フロントエンドは S3 → CloudFront の順に反映されます。' +
      '最後に管理者アカウントを作り、予約の管理画面が開けることを確認します。',
    note: {
      text: (
        <>
          新しい版が安定しない場合は、ECS が自動で前の版へ戻します。
          手動で戻すときは、ひとつ前のタスク定義のリビジョンを指定します。
        </>
      ),
    },
  },
];

const StepCard = ({ step }: { step: Step }) => (
  <div className="guide-step">
    <div className="guide-step-no">{step.no}</div>
    <div className="guide-step-body">
      <h3>{step.title}</h3>
      <p>{step.body}</p>
      {step.code && <pre className="guide-code">{step.code}</pre>}
      {step.note && (
        <div className={`guide-note${step.note.tone === 'warn' ? ' guide-note--warn' : ''}`}>
          {step.note.text}
        </div>
      )}
    </div>
  </div>
);

const UsageGuideModal: React.FC<UsageGuideModalProps> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // 管理者かどうかはサーバーが返す（ADMIN_EMAILS による判定）
  const showOperatorSections = user?.isAdmin === true;

  // Esc で閉じる。読むだけの画面なので、閉じ方が × だけだと窮屈になる
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // 背後のページが一緒にスクロールしないようにする
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="guide-overlay" onClick={onClose}>
      <div
        className="guide-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        tabIndex={-1}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="guide-header">
          <div className="guide-header-left">
            <span className="guide-menu-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <div className="guide-title-block">
              <h2 className="guide-title" id="guide-title">
                利用手順
              </h2>
              <p className="guide-subtitle">SITE USAGE GUIDE</p>
            </div>
          </div>
          <div className="guide-header-right">
            <span className="guide-scroll-hint">スクロールして確認</span>
            <button className="guide-close" onClick={onClose} aria-label="閉じる">
              ✕
            </button>
          </div>
        </div>

        <div className="guide-body">
          {/* ---------------------------------------------------- 概要 */}
          <div className="guide-card guide-card--hero">
            <p className="guide-eyebrow">面談予約 / AI資料 / お問い合わせ</p>
            <h2>{siteInfo.name} サイト利用ガイド</h2>
            <p className="guide-lead">
              生成AIの業務導入・業務システム開発・レガシー移行のご相談を受け付けるサイトです。
              資料の取得から面談の確定まで、画面上で完結します。
              送信後に何が起きるか、いつ返事が来るかをこのページにまとめています。
            </p>
            <div className="guide-tags">
              {TAGS.map((tag) => (
                <span className="guide-tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------ 仕組み */}
          <div className="guide-card">
            <div className="guide-badge-row">
              <span className="guide-badge">ARCHITECTURE</span>
              <h3>React の画面 + FastAPI の予約 API</h3>
            </div>
            <p className="guide-lead">
              画面からの入力は FastAPI へ送られ、PostgreSQL に保存されます。
              面談予約は問い合わせとは別のテーブルで管理しており、
              希望日・時間帯・相談区分をそれぞれ独立した項目として持っています。
              そのため空き枠の判定と、同じ枠の二重予約の防止ができます。
            </p>
            <ul className="guide-list">
              <li>
                <strong>画面</strong> — LP・各フォーム・予約の管理画面
              </li>
              <li>
                <strong>API</strong> — 予約 / 空き枠 / お問い合わせ / AI資料 / 認証
              </li>
              <li>
                <strong>データベース</strong> — 予約・問い合わせ・生成した資料・アカウント
              </li>
              <li>
                <strong>メール</strong> — 受付控え・担当者通知・確定/取消の連絡（自動送信）
              </li>
              <li>
                <strong>公開環境</strong> — 静的ファイルは CDN、API はコンテナで実行
              </li>
            </ul>
          </div>

          {/* ------------------------------------------ 来訪者の手順 */}
          <p className="guide-section-label">BASIC WORKFLOW — ご相談される方</p>
          {VISITOR_STEPS.map((step) => (
            <StepCard key={step.no} step={step} />
          ))}

          {/* ------------------------------------ ここから担当者向け。
              管理者でログインしているときだけ出す。公開 LP なので、
              環境変数名や構築手順を訪問者に見せる必要はない。
              なお、これは表示の出し分けであって権限ではない
              （管理APIの可否はサーバーが毎回判定する）。 */}
          {showOperatorSections && (
            <>
              <p className="guide-section-label">ADMIN WORKFLOW — 担当者</p>
              {ADMIN_STEPS.map((step) => (
                <StepCard key={step.no} step={step} />
              ))}

              <div className="guide-card">
                <div className="guide-badge-row">
                  <span className="guide-badge">AWS ARCHITECTURE</span>
                  <h3>公開時の構成</h3>
                </div>
                <p className="guide-lead">
                  静的ファイルは CloudFront + S3、API は ALB の後ろの ECS Fargate で動かします。
                  Terraform 一式を infra/terraform に置いてあり、同じ構成をいつでも作り直せます。
                </p>
                <ul className="guide-list">
                  <li>
                    <strong>CloudFront + S3</strong> — 画面の配信。HTTPS と SPA のルーティング
                  </li>
                  <li>
                    <strong>ALB + WAF</strong> — API の入口。流量制限と一般的な攻撃の遮断
                  </li>
                  <li>
                    <strong>ECS Fargate</strong> — FastAPI を2〜6タスクで実行。自動で増減する
                  </li>
                  <li>
                    <strong>RDS / ElastiCache</strong> — データの保存と、予約枠の同時押さえの防止
                  </li>
                  <li>
                    <strong>SES / CloudWatch</strong> — メール送信と、届かなかったときの通知
                  </li>
                </ul>
              </div>

              <p className="guide-section-label">DEPLOY TO AWS — 公開作業（担当者）</p>
              {DEPLOY_STEPS.map((step) => (
                <StepCard key={step.no} step={step} />
              ))}
            </>
          )}

          {/* ---------------------------------------------------- 補足 */}
          <p className="guide-section-label">NOTES — 知っておいていただきたいこと</p>
          <div className="guide-card">
            <ul className="guide-list">
              <li>
                <strong>受付時間</strong> — {siteInfo.businessHours}。
                土日祝のご希望は受け付けていません（祝日は担当者が調整のうえご連絡します）。
              </li>
              <li>
                <strong>送信の上限</strong> — 短時間に何度も送信すると、一時的に受け付けられなくなります。
                しばらく時間をおいてからお試しください。
              </li>
              <li>
                <strong>個人情報</strong> — 取得する項目と利用目的は
                プライバシーポリシー（/legal）に記載しています。
                機密情報はフォームに入力しないでください。
              </li>
              <li>
                <strong>AIの利用</strong> — 資料生成とチャット相談では、入力内容を外部のAIサービスへ送信します。
                生成された内容は必ず担当者がご説明します。
              </li>
            </ul>
          </div>
        </div>

        <div className="guide-footer">
          <p>
            うまくいかない場合は
            {hasEmail() ? (
              <>
                {' '}
                <a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a> まで直接ご連絡ください。
              </>
            ) : (
              <>お問い合わせフォームからご連絡ください。</>
            )}
          </p>
          <button className="guide-footer-close" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageGuideModal;
