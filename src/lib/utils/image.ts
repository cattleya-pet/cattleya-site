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