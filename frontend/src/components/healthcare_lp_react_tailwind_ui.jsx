import React, { useEffect, useState } from "react";

// --- Inline Icon Components (no external deps) ---
const IconPhone = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M2 5c0-1.1.9-2 2-2h2.2c.9 0 1.7.6 1.9 1.5l.8 3.1a2 2 0 0 1-.6 2L7.2 12a13 13 0 0 0 4.8 4.8l2.4-1.1a2 2 0 0 1 2 .2l2.6 1.7c.8.6 1.1 1.6.8 2.6l-.8 2.2c-.3.9-1.1 1.5-2 1.5H18c-8.8 0-16-7.2-16-16V5Z"/>
  </svg>
);
const IconUsers = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"/>
    <path d="M6 21a6 6 0 1 1 12 0"/>
  </svg>
);
const IconClock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v6l4 2"/>
  </svg>
);
const IconShield = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M12 2 4 5v6c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V5l-8-3Z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
 );
const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

// --- Small UI helpers ---
const Stat = ({ value, label }) => (
  <div className="card-modern hover-lift flex flex-col items-center gap-2 p-6 text-center">
    <div className="text-4xl font-bold gradient-text">{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="card-modern interactive-card group">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-3 rounded-xl bg-gradient-to-br from-healthcare-100 to-healthcare-200 text-healthcare-600 shadow-inner-healthcare animate-rotate-in">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
    </div>
    <p className="text-sm leading-6 text-gray-600">{desc}</p>
  </div>
);

const Input = ({ label, type = "text", name, placeholder, required = false }) => (
  <div className="form-group">
    <label className="form-label">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      className="form-input"
    />
  </div>
);

const Select = ({ label, name, options = [], required = false }) => (
  <div className="form-group">
    <label className="form-label">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      name={name}
      required={required}
      className="form-input"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const Badge = ({ children, variant = "default" }) => {
  const variantClasses = {
    default: "badge-modern badge-primary",
    success: "badge-modern badge-success",
    warning: "badge-modern badge-secondary",
    info: "badge-modern badge-info"
  };
  
  return (
    <span className={`${variantClasses[variant]} inline-flex items-center gap-1`}>
      <IconCheck className="h-3 w-3" /> {children}
    </span>
  );
};

// --- Main Page Component ---
export default function HealthcareLP() {
  const [showTop, setShowTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    
    // パーティクルエフェクトの生成
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 6,
        size: Math.random() * 4 + 2
      }));
      setParticles(newParticles);
    };
    
    generateParticles();
    
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    alert("資料ダウンロードのデモ：送信しました。\n（このUIはデザイン確認用です）");
  };

  return (
    <div className="min-h-screen bg-gradient-healthcare text-gray-900 scrollbar-thin relative overflow-hidden">
      {/* パーティクルエフェクト */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.animationDelay}s`,
            width: `${particle.size}px`,
            height: `${particle.size}px`
          }}
        />
      ))}

      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-white/20 shadow-glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-orange text-white font-bold text-xl shadow-healthcare animate-pulse-glow">
              J
            </div>
            <span className="text-2xl font-bold gradient-text">MedConnect</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-700">
            <a href="#features" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">機能</a>
            <a href="#cases" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">導入事例</a>
            <a href="#pricing" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">料金</a>
            <a href="#faq" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">よくある質問</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="btn-secondary hidden md:inline-flex">ログイン</button>
            <button className="btn-gradient">新規登録</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-healthcare-200 blur-3xl opacity-60 animate-float"/>
        <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-accent-amber blur-3xl opacity-60 animate-float" style={{animationDelay: '2s'}}/>
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 md:grid-cols-2">
          <div className="animate-fade-in-left">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Badge variant="success">導入実績 3,700+ 施設</Badge>
              <Badge variant="warning">大学病院シェア 76%</Badge>
              <Badge variant="info">24時間サポート</Badge>
            </div>
            <h1 className="section-title mobile-title text-4xl md:text-6xl font-extrabold leading-tight">
              医療現場の連携を、<br className="hidden md:block" />
              <span className="gradient-text">もっとシンプルに。</span>
            </h1>
            <p className="mobile-text mt-6 text-lg md:text-xl text-gray-700 leading-relaxed max-w-2xl">
              MedConnect は、AI電話・勤務管理・院内/地域連携をワンストップで提供する医療向け業務効率化プラットフォームです。
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#download" className="btn-gradient text-lg px-8 py-4">資料ダウンロード（無料）</a>
              <a href="#demo" className="btn-secondary text-lg px-8 py-4">1分でわかる動画</a>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg">
              <Stat value="14万人" label="医療従事者が利用"/>
              <Stat value="98%" label="継続利用率"/>
              <Stat value="-40%" label="電話対応時間"/>
            </div>
          </div>

          {/* Right: Lead Form */}
          <div className="relative animate-fade-in-right">
            <div className="card-modern shadow-2xl ring-1 ring-gray-100/50 animate-slide-in-bottom">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-healthcare-100 to-healthcare-200 p-3 text-healthcare-600 shadow-inner-healthcare animate-rotate-in">
                  <IconPhone className="h-6 w-6"/>
                </div>
                <div className="text-base font-semibold text-gray-900">AI電話がよくわかるパンフレット（無料）</div>
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <Select label="所属機関" name="orgType" required options={[
                  { value: "hospital", label: "病院" },
                  { value: "clinic", label: "クリニック" },
                  { value: "pharmacy", label: "薬局" },
                  { value: "other", label: "その他" },
                ]} />
                <Input label="医療機関名" name="orgName" placeholder="例）〇〇病院" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="所属" name="dept" placeholder="例）内科" />
                  <Input label="役職" name="role" placeholder="例）部長" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="姓" name="lastName" placeholder="山田" required />
                  <Input label="名" name="firstName" placeholder="太郎" required />
                </div>
                <Input type="email" label="メールアドレス" name="email" placeholder="you@example.com" required />
                <button type="submit" className="btn-gradient w-full text-lg py-4 mt-6">ダウンロードする（無料）</button>
                <p className="text-xs text-gray-500 text-center">送信により、プライバシーポリシーに同意したものとみなされます。</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="section-title mx-auto">主要機能</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">医療現場のオペレーションを支える8つの機能を、直感的なUIで。</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={<IconPhone className="h-6 w-6"/>} title="AI電話" desc="着信の自動振り分け、ボイスボットでの初期対応で業務負荷を軽減。"/>
            <FeatureCard icon={<IconClock className="h-6 w-6"/>} title="勤務管理" desc="打刻・シフト作成・残業申請までを一元化。36協定もサポート。"/>
            <FeatureCard icon={<IconUsers className="h-6 w-6"/>} title="院内連携" desc="掲示板・メッセージ・タスクで医師・看護・事務がスムーズに連携。"/>
            <FeatureCard icon={<IconShield className="h-6 w-6"/>} title="セキュリティ" desc="医療向けのアクセス制御と監査ログ、二要素認証を標準搭載。"/>
            <FeatureCard icon={<IconUsers className="h-6 w-6"/>} title="地域連携" desc="病診連携・多職種連携の情報共有を安全に。"/>
            <FeatureCard icon={<IconClock className="h-6 w-6"/>} title="出席管理" desc="カンファレンスの出席・議事録・資料配布を一括管理。"/>
            <FeatureCard icon={<IconPhone className="h-6 w-6"/>} title="患者対応" desc="折返し予約・SMS通知・問診テンプレで受付の負担を削減。"/>
            <FeatureCard icon={<IconShield className="h-6 w-6"/>} title="監査・権限" desc="ロールベースの権限設計と詳細な操作ログで内部統制を強化。"/>
          </div>
        </div>
      </section>

      {/* Cases / Proof */}
      <section id="cases" className="py-20 bg-gradient-to-br from-healthcare-50 to-accent-amber-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="md:col-span-1 animate-fade-in-left">
              <h2 className="section-title">導入効果</h2>
              <p className="text-xl text-gray-600 mb-8">実際の医療機関での改善例を数値でご紹介します。</p>
              <div className="space-y-4">
                <Stat value="-42%" label="電話取次時間"/>
                <Stat value="+28%" label="情報共有スピード"/>
                <Stat value="-35%" label="紙運用コスト"/>
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2 animate-fade-in-right">
              <div className="card-modern hover-lift">
                <div className="text-base font-semibold text-healthcare-700 mb-3">大学病院 A</div>
                <p className="text-gray-700 leading-relaxed">外来の電話対応をAI化し、ピーク時の取次時間を 42% 削減。スタッフの離席が減り、患者対応が円滑に。</p>
              </div>
              <div className="card-modern hover-lift">
                <div className="text-base font-semibold text-healthcare-700 mb-3">地域中核病院 B</div>
                <p className="text-gray-700 leading-relaxed">カンファレンス出席・資料配布をデジタル化。準備作業を週あたり 3 時間削減。</p>
              </div>
              <div className="card-modern hover-lift">
                <div className="text-base font-semibold text-healthcare-700 mb-3">クリニック C</div>
                <p className="text-gray-700 leading-relaxed">SMS 通知と折返し予約で受付の待ち時間を短縮。患者満足度の向上に寄与。</p>
              </div>
              <div className="card-modern hover-lift">
                <div className="text-base font-semibold text-healthcare-700 mb-3">薬局 D</div>
                <p className="text-gray-700 leading-relaxed">地域連携で処方疑義照会を効率化。情報共有のリードタイムを 28% 改善。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="section-title mx-auto">料金（例）</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">施設規模・機能構成に応じてお見積りします。以下は一例です。</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "ライト", price: "¥29,800/月", features: ["AI電話（基本）", "院内連携", "メールサポート"] },
              { name: "スタンダード", price: "¥59,800/月", features: ["AI電話（拡張）", "勤務管理", "地域連携", "チャットサポート"] },
              { name: "エンタープライズ", price: "お見積り", features: ["SAML/SSO", "高度な権限管理", "専任サポート"] },
            ].map((p, index) => (
              <div key={p.name} className={`card-modern hover-lift ${index === 1 ? 'ring-2 ring-healthcare-200 scale-105' : ''}`}>
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  {p.name === "スタンダード" && (
                    <span className="badge-success">おすすめ</span>
                  )}
                </div>
                <div className="text-3xl font-bold gradient-text mb-6">{p.price}</div>
                <ul className="space-y-3 text-gray-700 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <IconCheck className="h-5 w-5 text-healthcare-500 flex-shrink-0"/> 
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className="btn-gradient w-full">問い合わせる</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-16">
            <h2 className="section-title mx-auto">よくある質問</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "導入までの期間はどれくらい？", a: "最短1週間でのスモールスタートが可能です。規模・機能により異なります。" },
              { q: "セキュリティ対策は？", a: "通信の暗号化、アクセス制御、監査ログ、二要素認証など医療水準で実装しています。" },
              { q: "サポート体制は？", a: "24時間365日のメール/電話/チャットでのサポートをご提供します。" },
            ].map((item, i) => (
              <details key={i} className="card-modern group hover-lift">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-lg">
                  {item.q}
                  <span className="transition group-open:rotate-45 text-healthcare-500 text-2xl">＋</span>
                </summary>
                <p className="mt-4 text-gray-700 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-orange text-white font-bold text-xl animate-pulse-glow">
                  J
                </div>
                <span className="text-2xl font-bold gradient-text">MedConnect</span>
              </div>
              <p className="text-gray-300 max-w-md">医療現場の連携を、もっとシンプルに。AI電話・勤務管理・院内/地域連携をワンストップで提供。</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">サービス</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">AI電話</a></li>
                <li><a href="#" className="hover:text-white transition-colors">勤務管理</a></li>
                <li><a href="#" className="hover:text-white transition-colors">院内連携</a></li>
                <li><a href="#" className="hover:text-white transition-colors">地域連携</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">お問い合わせ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">よくある質問</a></li>
                <li><a href="#" className="hover:text-white transition-colors">導入事例</a></li>
                <li><a href="#" className="hover:text-white transition-colors">資料ダウンロード</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© {new Date().getFullYear()} MedConnect Inc. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">利用規約</a>
              <a href="#" className="hover:text-white transition-colors">プライバシーポリシー</a>
              <a href="#" className="hover:text-white transition-colors">特定商取引法に基づく表記</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 left-6 z-50 animate-bounce-gentle">
        {chatOpen && (
          <div className="mb-4 w-80 card-modern shadow-2xl animate-slide-in-bottom">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-lg">サポート</div>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-4">ご不明点はありませんか？資料請求や導入のご相談を承ります。</p>
            <button className="btn-gradient w-full">チャットを開始</button>
          </div>
        )}
        <button 
          onClick={() => setChatOpen((v) => !v)} 
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-orange text-white shadow-healthcare-lg hover:shadow-healthcare transition-all duration-300 hover-lift"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900/90 text-white shadow-lg hover:bg-gray-900 transition-all duration-300 hover:scale-110 hover-lift"
          aria-label="Back to top"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}
