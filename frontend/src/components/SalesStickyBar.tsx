import { useEffect, useState } from 'react';

type SalesStickyBarProps = {
  onContact: () => void;
  onAppointment: () => void;
  onScrollLeadForm: () => void;
};

/** ヒーロー通過後に表示する営業用クイックアクション */
export default function SalesStickyBar({
  onContact,
  onAppointment,
  onScrollLeadForm,
}: SalesStickyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 520);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="mr-sales-sticky" role="region" aria-label="クイック相談">
      <div className="mr-sales-sticky__inner">
        <p className="mr-sales-sticky__label hidden sm:block">無料相談・資料請求</p>
        <div className="mr-sales-sticky__actions">
          <button type="button" className="btn-gradient btn-compact !py-2" onClick={onContact}>
            お問い合わせ
          </button>
          <button type="button" className="btn-secondary btn-compact !py-2 hidden sm:inline-flex" onClick={onAppointment}>
            面談予約
          </button>
          <button type="button" className="btn-secondary btn-compact !py-2" onClick={onScrollLeadForm}>
            AI資料
          </button>
        </div>
      </div>
    </div>
  );
}
