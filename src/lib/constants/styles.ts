// ブレイクポイントの定義（モバイルファースト）
// 1rem = 10px (based on html { font-size: 62.5% })
export const BREAKPOINTS = {
  // スマートフォン（縦向き）はデフォルト（〜639px / 〜63.9rem）
  // - iPhone SE (375px)
  // - iPhone 14 Pro Max (430px)
  // - その他スマートフォン全般
  
  // タブレット（小型）以上（640px〜 / 64rem〜）
  // - iPad mini 縦向き (768px未満)
  // - Androidタブレット 縦向き
  sm: 640, // 64rem

  // タブレット（標準）以上（768px〜 / 76.8rem〜）
  // - iPad mini 横向き (768px)
  // - iPad Air 縦向き (820px)
  // - iPad Pro 11" 縦向き (834px)
  md: 768, // 76.8rem

  // タブレット（大型）以上（1024px〜 / 102.4rem〜）
  // - iPad Pro 12.9" 横向き (1024px)
  // - 小型ノートPC (1280px未満)
  lg: 1024, // 102.4rem

  // デスクトップ（標準）以上（1280px〜 / 128rem〜）
  // - ノートPC (1280px)
  // - デスクトップPC (1366px)
  xl: 1280, // 128rem

  // デスクトップ（ワイド）以上（1536px〜 / 153.6rem〜）
  // - 大型デスクトップPC
  // - 4Kディスプレイ (2160px)
  // - 5Kディスプレイ (2880px)
  '2xl': 1536, // 153.6rem
} as const;

// rem単位でのブレイクポイント（SCSS変数と一致）
export const BREAKPOINTS_REM = {
  sm: 64,    // 64rem = 640px
  md: 76.8,  // 76.8rem = 768px  
  lg: 102.4, // 102.4rem = 1024px
  xl: 128,   // 128rem = 1280px
  '2xl': 153.6, // 153.6rem = 1536px
} as const;

// メディアクエリの定義（モバイルファースト）- rem単位を使用してSCSSと一致
export const MEDIA_QUERIES = {
  // 基本的なブレイクポイント（モバイルファースト）- rem単位
  sm: `@media (min-width: ${BREAKPOINTS_REM.sm}rem)`,
  md: `@media (min-width: ${BREAKPOINTS_REM.md}rem)`,
  lg: `@media (min-width: ${BREAKPOINTS_REM.lg}rem)`,
  xl: `@media (min-width: ${BREAKPOINTS_REM.xl}rem)`,
  '2xl': `@media (min-width: ${BREAKPOINTS_REM['2xl']}rem)`,

  // 範囲指定のメディアクエリ - rem単位
  smToMd: `@media (min-width: ${BREAKPOINTS_REM.sm}rem) and (max-width: ${BREAKPOINTS_REM.md - 0.1}rem)`,
  mdToLg: `@media (min-width: ${BREAKPOINTS_REM.md}rem) and (max-width: ${BREAKPOINTS_REM.lg - 0.1}rem)`,
  lgToXl: `@media (min-width: ${BREAKPOINTS_REM.lg}rem) and (max-width: ${BREAKPOINTS_REM.xl - 0.1}rem)`,
  xlTo2xl: `@media (min-width: ${BREAKPOINTS_REM.xl}rem) and (max-width: ${BREAKPOINTS_REM['2xl'] - 0.1}rem)`,

  // 特定のケース用（必要な場合のみ使用）- rem単位
  onlyMobile: `@media (max-width: ${BREAKPOINTS_REM.sm - 0.1}rem)`,
  onlyTablet: `@media (min-width: ${BREAKPOINTS_REM.sm}rem) and (max-width: ${BREAKPOINTS_REM.lg - 0.1}rem)`,
  onlyDesktop: `@media (min-width: ${BREAKPOINTS_REM.lg}rem)`,
} as const;

// 下位互換性のためのピクセル単位のメディアクエリ（非推奨）
export const MEDIA_QUERIES_PX = {
  sm: `@media (min-width: ${BREAKPOINTS.sm}px)`,
  md: `@media (min-width: ${BREAKPOINTS.md}px)`,
  lg: `@media (min-width: ${BREAKPOINTS.lg}px)`,
  xl: `@media (min-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `@media (min-width: ${BREAKPOINTS['2xl']}px)`,
} as const;