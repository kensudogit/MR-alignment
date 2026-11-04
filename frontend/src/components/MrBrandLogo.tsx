/** 提供ブランドロゴ PNG の実寸（縦横比固定用） */
export const BRAND_LOGO_WIDTH = 317;
export const BRAND_LOGO_HEIGHT = 98;

type MrBrandLogoProps = {
  compact?: boolean;
  className?: string;
};

/** 横組みブランドロゴ（ヘッダー / フッター共通） */
export default function MrBrandLogo({ compact = false, className = '' }: MrBrandLogoProps) {
  const rootClass = ['mr-brand', compact ? 'mr-brand--compact' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <img
        src="/brand-logo.png"
        alt="須藤技術士事務所"
        className="mr-brand__image"
        width={BRAND_LOGO_WIDTH}
        height={BRAND_LOGO_HEIGHT}
        decoding="async"
        fetchPriority={compact ? 'high' : undefined}
      />
    </div>
  );
}
