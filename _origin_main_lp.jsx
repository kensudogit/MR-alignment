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
    
    // 繝代・繝・ぅ繧ｯ繝ｫ繧ｨ繝輔ぉ繧ｯ繝医・逕滓・
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
    alert("雉・侭繝繧ｦ繝ｳ繝ｭ繝ｼ繝峨・繝・Δ・夐∽ｿ｡縺励∪縺励◆縲・n・医％縺ｮUI縺ｯ繝・じ繧､繝ｳ遒ｺ隱咲畑縺ｧ縺呻ｼ・);
  };

  return (
    <div className="min-h-screen bg-gradient-healthcare text-gray-900 scrollbar-thin relative overflow-hidden">
      {/* 繝代・繝・ぅ繧ｯ繝ｫ繧ｨ繝輔ぉ繧ｯ繝・*/}
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
            <a href="#features" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">讖溯・</a>
            <a href="#cases" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">蟆主・莠倶ｾ・/a>
            <a href="#pricing" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">譁咎≡</a>
            <a href="#faq" className="hover:text-healthcare-600 transition-colors duration-200 hover-lift">繧医￥縺ゅｋ雉ｪ蝠・/a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="btn-secondary hidden md:inline-flex">繝ｭ繧ｰ繧､繝ｳ</button>
            <button className="btn-gradient">譁ｰ隕冗匳骭ｲ</button>
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
              <Badge variant="success">蟆主・螳溽ｸｾ 3,700+ 譁ｽ險ｭ</Badge>
              <Badge variant="warning">螟ｧ蟄ｦ逞・劼繧ｷ繧ｧ繧｢ 76%</Badge>
              <Badge variant="info">24譎る俣繧ｵ繝昴・繝・/Badge>
            </div>
            <h1 className="section-title mobile-title text-4xl md:text-6xl font-extrabold leading-tight">
              蛹ｻ逋ら樟蝣ｴ縺ｮ騾｣謳ｺ繧偵・br className="hidden md:block" />
              <span className="gradient-text">繧ゅ▲縺ｨ繧ｷ繝ｳ繝励Ν縺ｫ縲・/span>
            </h1>
            <p className="mobile-text mt-6 text-lg md:text-xl text-gray-700 leading-relaxed max-w-2xl">
              MedConnect 縺ｯ縲、I髮ｻ隧ｱ繝ｻ蜍､蜍咏ｮ｡逅・・髯｢蜀・蝨ｰ蝓滄｣謳ｺ繧偵Ρ繝ｳ繧ｹ繝医ャ繝励〒謠蝉ｾ帙☆繧句現逋ょ髄縺第･ｭ蜍吝柑邇・喧繝励Λ繝・ヨ繝輔か繝ｼ繝縺ｧ縺吶・            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#download" className="btn-gradient text-lg px-8 py-4">雉・侭繝繧ｦ繝ｳ繝ｭ繝ｼ繝会ｼ育┌譁呻ｼ・/a>
              <a href="#demo" className="btn-secondary text-lg px-8 py-4">1蛻・〒繧上°繧句虚逕ｻ</a>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg">
              <Stat value="14荳・ｺｺ" label="蛹ｻ逋ょｾ謎ｺ玖・′蛻ｩ逕ｨ"/>
              <Stat value="98%" label="邯咏ｶ壼茜逕ｨ邇・/>
              <Stat value="-40%" label="髮ｻ隧ｱ蟇ｾ蠢懈凾髢・/>
            </div>
          </div>

          {/* Right: Lead Form */}
          <div className="relative animate-fade-in-right">
            <div className="card-modern shadow-2xl ring-1 ring-gray-100/50 animate-slide-in-bottom">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-healthcare-100 to-healthcare-200 p-3 text-healthcare-600 shadow-inner-healthcare animate-rotate-in">
                  <IconPhone className="h-6 w-6"/>
                </div>
                <div className="text-base font-semibold text-gray-900">AI髮ｻ隧ｱ縺後ｈ縺上ｏ縺九ｋ繝代Φ繝輔Ξ繝・ヨ・育┌譁呻ｼ・/div>
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <Select label="謇螻樊ｩ滄未" name="orgType" required options={[
                  { value: "hospital", label: "逞・劼" },
                  { value: "clinic", label: "繧ｯ繝ｪ繝九ャ繧ｯ" },
                  { value: "pharmacy", label: "阮ｬ螻" },
                  { value: "other", label: "縺昴・莉・ },
                ]} />
                <Input label="蛹ｻ逋よｩ滄未蜷・ name="orgName" placeholder="萓具ｼ峨・・羅髯｢" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="謇螻・ name="dept" placeholder="萓具ｼ牙・遘・ />
                  <Input label="蠖ｹ閨ｷ" name="role" placeholder="萓具ｼ蛾Κ髟ｷ" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="蟋・ name="lastName" placeholder="螻ｱ逕ｰ" required />
                  <Input label="蜷・ name="firstName" placeholder="螟ｪ驛・ required />
                </div>
                <Input type="email" label="繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ" name="email" placeholder="you@example.com" required />
                <button type="submit" className="btn-gradient w-full text-lg py-4 mt-6">繝繧ｦ繝ｳ繝ｭ繝ｼ繝峨☆繧具ｼ育┌譁呻ｼ・/button>
                <p className="text-xs text-gray-500 text-center">騾∽ｿ｡縺ｫ繧医ｊ縲√・繝ｩ繧､繝舌す繝ｼ繝昴Μ繧ｷ繝ｼ縺ｫ蜷梧э縺励◆繧ゅ・縺ｨ縺ｿ縺ｪ縺輔ｌ縺ｾ縺吶・/p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="section-title mx-auto">荳ｻ隕∵ｩ溯・</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">蛹ｻ逋ら樟蝣ｴ縺ｮ繧ｪ繝壹Ξ繝ｼ繧ｷ繝ｧ繝ｳ繧呈髪縺医ｋ8縺､縺ｮ讖溯・繧偵∫峩諢溽噪縺ｪUI縺ｧ縲・/p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={<IconPhone className="h-6 w-6"/>} title="AI髮ｻ隧ｱ" desc="逹菫｡縺ｮ閾ｪ蜍墓険繧雁・縺代√・繧､繧ｹ繝懊ャ繝医〒縺ｮ蛻晄悄蟇ｾ蠢懊〒讌ｭ蜍呵ｲ闕ｷ繧定ｻｽ貂帙・/>
            <FeatureCard icon={<IconClock className="h-6 w-6"/>} title="蜍､蜍咏ｮ｡逅・ desc="謇灘綾繝ｻ繧ｷ繝輔ヨ菴懈・繝ｻ谿区･ｭ逕ｳ隲九∪縺ｧ繧剃ｸ蜈・喧縲・6蜊泌ｮ壹ｂ繧ｵ繝昴・繝医・/>
            <FeatureCard icon={<IconUsers className="h-6 w-6"/>} title="髯｢蜀・｣謳ｺ" desc="謗ｲ遉ｺ譚ｿ繝ｻ繝｡繝・そ繝ｼ繧ｸ繝ｻ繧ｿ繧ｹ繧ｯ縺ｧ蛹ｻ蟶ｫ繝ｻ逵玖ｭｷ繝ｻ莠句漁縺後せ繝繝ｼ繧ｺ縺ｫ騾｣謳ｺ縲・/>
            <FeatureCard icon={<IconShield className="h-6 w-6"/>} title="繧ｻ繧ｭ繝･繝ｪ繝・ぅ" desc="蛹ｻ逋ょ髄縺代・繧｢繧ｯ繧ｻ繧ｹ蛻ｶ蠕｡縺ｨ逶｣譟ｻ繝ｭ繧ｰ縲∽ｺ瑚ｦ∫ｴ隱崎ｨｼ繧呈ｨ呎ｺ匁政霈峨・/>
            <FeatureCard icon={<IconUsers className="h-6 w-6"/>} title="蝨ｰ蝓滄｣謳ｺ" desc="逞・ｨｺ騾｣謳ｺ繝ｻ螟夊・遞ｮ騾｣謳ｺ縺ｮ諠・ｱ蜈ｱ譛峨ｒ螳牙・縺ｫ縲・/>
            <FeatureCard icon={<IconClock className="h-6 w-6"/>} title="蜃ｺ蟶ｭ邂｡逅・ desc="繧ｫ繝ｳ繝輔ぃ繝ｬ繝ｳ繧ｹ縺ｮ蜃ｺ蟶ｭ繝ｻ隴ｰ莠矩鹸繝ｻ雉・侭驟榊ｸ・ｒ荳諡ｬ邂｡逅・・/>
            <FeatureCard icon={<IconPhone className="h-6 w-6"/>} title="謔｣閠・ｯｾ蠢・ desc="謚倩ｿ斐＠莠育ｴ・・SMS騾夂衍繝ｻ蝠剰ｨｺ繝・Φ繝励Ξ縺ｧ蜿嶺ｻ倥・雋諡・ｒ蜑頑ｸ帙・/>
            <FeatureCard icon={<IconShield className="h-6 w-6"/>} title="逶｣譟ｻ繝ｻ讓ｩ髯・ desc="繝ｭ繝ｼ繝ｫ繝吶・繧ｹ縺ｮ讓ｩ髯占ｨｭ險医→隧ｳ邏ｰ縺ｪ謫堺ｽ懊Ο繧ｰ縺ｧ蜀・Κ邨ｱ蛻ｶ繧貞ｼｷ蛹悶・/>
          </div>
        </div>
      </section>

      {/* Cases / Proof */}
      <section id="cases" className="py-20 bg-gradient-to-br from-healthcare-50 to-accent-amber-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="md:col-span-1 animate-fade-in-left">
              <h2 className="section-title">蟆主・蜉ｹ譫・/h2>
              <p className="text-xl text-gray-600 mb-8">螳滄圀縺ｮ蛹ｻ逋よｩ滄未縺ｧ縺ｮ謾ｹ蝟・ｾ九ｒ謨ｰ蛟､縺ｧ縺皮ｴｹ莉九＠縺ｾ縺吶・/p>
              <div className="space-y-4">
                <Stat value="-42%" label="髮ｻ隧ｱ蜿匁ｬ｡譎る俣"/>
                <Stat value="+28%" label="諠・ｱ蜈ｱ譛峨せ繝斐・繝・/>
                <Stat value="-35%" label="邏咎°逕ｨ繧ｳ繧ｹ繝・/>
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2 animate-fade-in-right">
              <div className="card-modern hover-lift">
                <div className="text-base font-semibold text-healthcare-700 mb-3">螟ｧ蟄ｦ逞・劼 A</div>
                <p className="text-gray-700 leading-relaxed">螟匁擂縺ｮ髮ｻ隧ｱ蟇ｾ蠢懊ｒAI蛹悶＠縲√ヴ繝ｼ繧ｯ譎ゅ・蜿匁ｬ｡譎る俣繧・42% 蜑頑ｸ帙ゅせ繧ｿ繝・ヵ縺ｮ髮｢蟶ｭ縺梧ｸ帙ｊ縲∵ぅ閠・ｯｾ蠢懊′蜀・ｻ代↓縲・/p>
              </div>
              <div className="card-modern hover-lift">
                <div className="text-base font-semibold text-healthcare-700 mb-3">蝨ｰ蝓滉ｸｭ譬ｸ逞・劼 B</div>
                <p className="text-gray-700 leading-relaxed">繧ｫ繝ｳ繝輔ぃ繝ｬ繝ｳ繧ｹ蜃ｺ蟶ｭ繝ｻ雉・侭驟榊ｸ・ｒ繝・ず繧ｿ繝ｫ蛹悶よｺ門ｙ菴懈･ｭ繧帝ｱ縺ゅ◆繧・3 譎る俣蜑頑ｸ帙・/p>
              </div>
              <div className="card-modern hover-lift">
                <div className="text-base font-semibold text-healthcare-700 mb-3">繧ｯ繝ｪ繝九ャ繧ｯ C</div>
                <p className="text-gray-700 leading-relaxed">SMS 騾夂衍縺ｨ謚倩ｿ斐＠莠育ｴ・〒蜿嶺ｻ倥・蠕・■譎る俣繧堤洒邵ｮ縲よぅ閠・ｺ雜ｳ蠎ｦ縺ｮ蜷台ｸ翫↓蟇・ｸ弱・/p>
              </div>
              <div className="card-modern hover-lift">
                <div className="text-base font-semibold text-healthcare-700 mb-3">阮ｬ螻 D</div>
                <p className="text-gray-700 leading-relaxed">蝨ｰ蝓滄｣謳ｺ縺ｧ蜃ｦ譁ｹ逍醍ｾｩ辣ｧ莨壹ｒ蜉ｹ邇・喧縲よュ蝣ｱ蜈ｱ譛峨・繝ｪ繝ｼ繝峨ち繧､繝繧・28% 謾ｹ蝟・・/p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="section-title mx-auto">譁咎≡・井ｾ具ｼ・/h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">譁ｽ險ｭ隕乗ｨ｡繝ｻ讖溯・讒区・縺ｫ蠢懊§縺ｦ縺願ｦ狗ｩ阪ｊ縺励∪縺吶ゆｻ･荳九・荳萓九〒縺吶・/p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "繝ｩ繧､繝・, price: "ﾂ･29,800/譛・, features: ["AI髮ｻ隧ｱ・亥渕譛ｬ・・, "髯｢蜀・｣謳ｺ", "繝｡繝ｼ繝ｫ繧ｵ繝昴・繝・] },
              { name: "繧ｹ繧ｿ繝ｳ繝繝ｼ繝・, price: "ﾂ･59,800/譛・, features: ["AI髮ｻ隧ｱ・域僑蠑ｵ・・, "蜍､蜍咏ｮ｡逅・, "蝨ｰ蝓滄｣謳ｺ", "繝√Ε繝・ヨ繧ｵ繝昴・繝・] },
              { name: "繧ｨ繝ｳ繧ｿ繝ｼ繝励Λ繧､繧ｺ", price: "縺願ｦ狗ｩ阪ｊ", features: ["SAML/SSO", "鬮伜ｺｦ縺ｪ讓ｩ髯千ｮ｡逅・, "蟆ゆｻｻ繧ｵ繝昴・繝・] },
            ].map((p, index) => (
              <div key={p.name} className={`card-modern hover-lift ${index === 1 ? 'ring-2 ring-healthcare-200 scale-105' : ''}`}>
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  {p.name === "繧ｹ繧ｿ繝ｳ繝繝ｼ繝・ && (
                    <span className="badge-success">縺翫☆縺吶ａ</span>
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
                <button className="btn-gradient w-full">蝠上＞蜷医ｏ縺帙ｋ</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-16">
            <h2 className="section-title mx-auto">繧医￥縺ゅｋ雉ｪ蝠・/h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "蟆主・縺ｾ縺ｧ縺ｮ譛滄俣縺ｯ縺ｩ繧後￥繧峨＞・・, a: "譛遏ｭ1騾ｱ髢薙〒縺ｮ繧ｹ繝｢繝ｼ繝ｫ繧ｹ繧ｿ繝ｼ繝医′蜿ｯ閭ｽ縺ｧ縺吶りｦ乗ｨ｡繝ｻ讖溯・縺ｫ繧医ｊ逡ｰ縺ｪ繧翫∪縺吶・ },
              { q: "繧ｻ繧ｭ繝･繝ｪ繝・ぅ蟇ｾ遲悶・・・, a: "騾壻ｿ｡縺ｮ證怜捷蛹悶√い繧ｯ繧ｻ繧ｹ蛻ｶ蠕｡縲∫屮譟ｻ繝ｭ繧ｰ縲∽ｺ瑚ｦ∫ｴ隱崎ｨｼ縺ｪ縺ｩ蛹ｻ逋よｰｴ貅悶〒螳溯｣・＠縺ｦ縺・∪縺吶・ },
              { q: "繧ｵ繝昴・繝井ｽ灘宛縺ｯ・・, a: "24譎る俣365譌･縺ｮ繝｡繝ｼ繝ｫ/髮ｻ隧ｱ/繝√Ε繝・ヨ縺ｧ縺ｮ繧ｵ繝昴・繝医ｒ縺疲署萓帙＠縺ｾ縺吶・ },
            ].map((item, i) => (
              <details key={i} className="card-modern group hover-lift">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-lg">
                  {item.q}
                  <span className="transition group-open:rotate-45 text-healthcare-500 text-2xl">・・/span>
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
              <p className="text-gray-300 max-w-md">蛹ｻ逋ら樟蝣ｴ縺ｮ騾｣謳ｺ繧偵√ｂ縺｣縺ｨ繧ｷ繝ｳ繝励Ν縺ｫ縲・I髮ｻ隧ｱ繝ｻ蜍､蜍咏ｮ｡逅・・髯｢蜀・蝨ｰ蝓滄｣謳ｺ繧偵Ρ繝ｳ繧ｹ繝医ャ繝励〒謠蝉ｾ帙・/p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">繧ｵ繝ｼ繝薙せ</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">AI髮ｻ隧ｱ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">蜍､蜍咏ｮ｡逅・/a></li>
                <li><a href="#" className="hover:text-white transition-colors">髯｢蜀・｣謳ｺ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">蝨ｰ蝓滄｣謳ｺ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">繧ｵ繝昴・繝・/h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">縺雁撫縺・粋繧上○</a></li>
                <li><a href="#" className="hover:text-white transition-colors">繧医￥縺ゅｋ雉ｪ蝠・/a></li>
                <li><a href="#" className="hover:text-white transition-colors">蟆主・莠倶ｾ・/a></li>
                <li><a href="#" className="hover:text-white transition-colors">雉・侭繝繧ｦ繝ｳ繝ｭ繝ｼ繝・/a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">ﾂｩ {new Date().getFullYear()} MedConnect Inc. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">蛻ｩ逕ｨ隕冗ｴ・/a>
              <a href="#" className="hover:text-white transition-colors">繝励Λ繧､繝舌す繝ｼ繝昴Μ繧ｷ繝ｼ</a>
              <a href="#" className="hover:text-white transition-colors">迚ｹ螳壼膚蜿門ｼ墓ｳ輔↓蝓ｺ縺･縺剰｡ｨ險・/a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 left-6 z-50 animate-bounce-gentle">
        {chatOpen && (
          <div className="mb-4 w-80 card-modern shadow-2xl animate-slide-in-bottom">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-lg">繧ｵ繝昴・繝・/div>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-4">縺比ｸ肴・轤ｹ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縺具ｼ溯ｳ・侭隲区ｱゅｄ蟆主・縺ｮ縺皮嶌隲・ｒ謇ｿ繧翫∪縺吶・/p>
            <button className="btn-gradient w-full">繝√Ε繝・ヨ繧帝幕蟋・/button>
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
