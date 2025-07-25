/**
 * シード値ベースのランダムソート機能
 * 30分ごとに同じシード値を使用してランダムソートを実現
 */

/**
 * 30分単位のシード値を取得
 * @returns 30分ごとに変わるシード値
 */
export function get30MinuteSeed(): number {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000; // 30分をミリ秒に変換
  return Math.floor(now / thirtyMinutes);
}

/**
 * シード値を使用した疑似ランダム数生成器
 * @param seed シード値
 * @returns 0-1の間のランダムな数値を生成する関数
 */
export function createSeededRandom(seed: number): () => number {
  let current = seed;
  return function() {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

/**
 * シード値ベースで配列をシャッフル
 * @param array シャッフルする配列
 * @param seed シード値
 * @returns シャッフルされた新しい配列
 */
export function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const random = createSeededRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * 30分ごとに変わるランダムソート
 * @param array ソートする配列
 * @returns 30分ごとに同じ順序でランダムソートされた配列
 */
export function randomSort30Minutes<T>(array: T[]): T[] {
  const seed = get30MinuteSeed();
  return shuffleArray(array, seed);
}