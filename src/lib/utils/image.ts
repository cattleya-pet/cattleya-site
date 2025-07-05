/**
 * Google DriveのURLからファイルIDを抽出する
 * セキュリティ強化版（2024年更新）
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // セキュリティチェック：危険な文字列が含まれている場合は処理を停止
  if (url.includes('<') || url.includes('>') || url.includes('..') || url.toLowerCase().includes('script')) {
    console.warn('Potentially unsafe URL detected:', url);
    return null;
  }
  
  // IDだけが渡された場合：有効なGoogle Drive File IDの形式をチェック
  // Google Drive File IDは通常28-33文字程度で、英数字、ハイフン、アンダースコアのみを含む
  if (url.match(/^[a-zA-Z0-9_-]{25,50}$/)) {
    return url;
  }
  
  // Google DriveのURLからファイルIDを抽出する正規表現パターン（セキュリティ強化）
  const patterns = [
    /\/d\/([a-zA-Z0-9_-]{25,50})\/view/,     // 通常のビューURL
    /\/d\/([a-zA-Z0-9_-]{25,50})\/edit/,     // 編集URL
    /\/d\/([a-zA-Z0-9_-]{25,50})\//,         // 直接リンク
    /id=([a-zA-Z0-9_-]{25,50})(&|$)/,        // 共有URL
    /\/file\/d\/([a-zA-Z0-9_-]{25,50})\//    // ファイル直接リンク
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length >= 25 && match[1].length <= 50) {
      return match[1];
    }
  }
  return null;
}

/**
 * 画像URLを適切な形式に変換する（microCMSとGoogleDriveに対応）
 */
export function getImageUrl(url: string, _width: number = 800, _height: number = 600): string {
  if (!url || typeof url !== 'string') return '';
  
  // microCMSのメディアURLの場合はそのまま返す
  if (url.includes('microcms-assets.io') || url.includes('images.microcms-assets.io')) {
    return url;
  }
  
  // GoogleDriveのURLの場合は従来の処理を実行
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;

  // 従来の方式を維持（lh3.googleusercontent.com）
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * Google DriveのURLを直接表示可能な画像URLに変換する（後方互換性のため残存）
 */
export function getGoogleDriveImageUrl(url: string, width: number = 800, height: number = 600): string {
  return getImageUrl(url, width, height);
}

/**
 * Google DriveのURLから埋め込み再生可能な動画URLを生成する
 */
export function getGoogleDriveVideoUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;

  // 埋め込み再生用のURLに変換（共有設定が必要）
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Google DriveのURLから直接ダウンロード用URLを生成する（代替手段）
 */
export function getGoogleDriveDirectUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;

  // 直接ダウンロード用URL
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Google Drive動画の最初のフレームをサムネイル画像として取得する
 */
export function getGoogleDriveVideoThumbnail(url: string, width: number = 150, height: number = 150): string {
  if (!url || typeof url !== 'string') return '';
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;

  // Google Driveの動画サムネイル用URL
  // 複数のフォーマットを試して、最も確実な形式を使用
  
  // 方式1: 直接ダウンロード形式（動画ファイルのサムネイルに有効）
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
  
  // 方式2: lh3.googleusercontent.com（バックアップ用）
  // return `https://lh3.googleusercontent.com/d/${fileId}`;
}