import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  salesConsultationSteps,
  salesFaq,
  salesTrustPillars,
  salesUseCases,
} from '../data/salesContent';

type SalesSectionsProps = {
  onContact: () => void;
  onAppointment: () => void;
  onScrollLeadForm: () => void;
};

function StepCta({
  kind,
  onContact,
  onAppointment,
}: {
  kind: string;
  onContact: () => void;
  onAppointment: () => void;
}) {
  if (kind === 'contact') {
    return (
      <button type="button" className="mr-sales-link-btn" onClick={onContact}>
        お問い合わせ →
      </button>
    );
  }
  if (kind === 'appointment') {
    return (
      <button type="button" className="mr-sales-link-btn" onClick={onAppointment}>
        面談予約 →
      </button>
    );
  }
  if (kind === 'process') {
    return (
      <Link to="/process" className="mr-sales-link-btn inline-block">
        開発の進め方 →
      </Link>
    );
  }
  return (
    <a href="#portfolio" className="mr-sales-link-btn inline-block">
      開発実績 →
    </a>
  );
}

export default function SalesSections({
  onContact,
  onAppointment,
  onScrollLeadForm,
}: SalesSectionsProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <section id="why" className="mr-section mr-sales-section scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center md:mb-16">
            <p className="mr-eyebrow mb-4 justify-center">Why us</p>
            <h2 className="mr-section-head mr-section-head--center mx-auto max-w-2xl">
              選ばれる理由
            </h2>
            <p className="mr-section-lead mx-auto">
              提案書より先に、公開されている成果物とドキュメントで判断いただけるようにしています。
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {salesTrustPillars.map((item) => (
              <li key={item.title} className="mr-sales-card">
                <span className="mb-3 block text-3xl" aria-hidden="true">
                  {item.icon}
                </span>
                <h3 className="mb-2 text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="use-cases" className="mr-section mr-sales-section scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mr-eyebrow mb-4">Use cases</p>
              <h2 className="mr-section-head max-w-xl">こんなご相談が多いです</h2>
            </div>
            <button type="button" className="btn-secondary btn-compact shrink-0" onClick={onScrollLeadForm}>
              無料 AI 資料を試す
            </button>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {salesUseCases.map((uc) => (
              <li key={uc.title} className="mr-sales-card mr-sales-card--wide">
                <h3 className="mb-3 text-lg font-bold text-teal-200">{uc.title}</h3>
                <ul className="flex flex-wrap gap-2">
                  {uc.points.map((p) => (
                    <li
                      key={p}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="sales-flow" className="mr-section mr-sales-section scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center md:mb-16">
            <p className="mr-eyebrow mb-4 justify-center">Flow</p>
            <h2 className="mr-section-head mr-section-head--center mx-auto max-w-2xl">
              ご相談から着手まで
            </h2>
            <p className="mr-section-lead mx-auto">
              初回は無料です。詳細な工程は
              <Link to="/process" className="text-teal-300 hover:text-teal-200">
                開発の進め方
              </Link>
              もあわせてご覧ください。
            </p>
          </div>
          <ol className="grid gap-4 lg:grid-cols-4">
            {salesConsultationSteps.map((step) => (
              <li key={step.step} className="mr-sales-step">
                <span className="mr-sales-step__no">{step.step}</span>
                <h3 className="mb-2 text-base font-bold text-white">{step.title}</h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-400">{step.body}</p>
                <StepCta kind={step.cta} onContact={onContact} onAppointment={onAppointment} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="mr-section mr-sales-section scroll-mt-24">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <p className="mr-eyebrow mb-4 justify-center">FAQ</p>
            <h2 className="mr-section-head mr-section-head--center">よくあるご質問</h2>
          </div>
          <div className="space-y-3">
            {salesFaq.map((item, index) => {
              const open = openFaq === index;
              return (
                <div key={item.q} className="mr-sales-faq-item">
                  <button
                    type="button"
                    className="mr-sales-faq-trigger"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : index)}
                  >
                    <span>{item.q}</span>
                    <span className="mr-sales-faq-icon" aria-hidden="true">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  {open && <div className="mr-sales-faq-body">{item.a}</div>}
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <button type="button" className="btn-gradient btn-compact" onClick={onContact}>
              上記以外のご質問はこちら
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
