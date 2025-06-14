/**
 * Google DriveのURLからファイルIDを抽出する
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // IDだけが渡された場合はそのまま返す
  if (url.match(/^[a-zA-Z0-9_-]{25,}$/)) {
    return url;
  }
  
  // Google DriveのURLからファイルIDを抽出する正規表現パターンを更新
  const patterns = [
    /\/d\/(.*?)\/view/,  // 通常のビューURL
    /id=(.*?)(&|$)/,     // 共有URL
    /\/file\/d\/(.*?)\//  // 直接リンク
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Google DriveのURLを直接表示可能な画像URLに変換する
 */
export function getGoogleDriveImageUrl(url: string, width: number = 800, height: number = 600): string {
  if (!url) return '';
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;

  // Google DriveのURL形式を変更
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * Google DriveのURLから埋め込み再生可能な動画URLを生成する
 */
export function getGoogleDriveVideoUrl(url: string): string {
  if (!url) return '';
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;

  // 埋め込み再生用のURLに変換（共有設定が必要）
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Google DriveのURLから直接ダウンロード用URLを生成する（代替手段）
 */
export function getGoogleDriveDirectUrl(url: string): string {
  if (!url) return '';
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;

  // 直接ダウンロード用URL
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Google Drive動画の最初のフレームをサムネイル画像として取得する
 */
export function getGoogleDriveVideoThumbnail(url: string, width: number = 150, height: number = 150): string {
  if (!url) return '';
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;

  // Google Driveの動画サムネイル用URL
  // Google Driveは動画ファイルに対してもlh3.googleusercontent.comでサムネイルを提供
  return `https://lh3.googleusercontent.com/d/${fileId}=w${width}-h${height}-c`;
}