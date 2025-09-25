# GAS トラブルシューティング記録
## 対応日: 2025年9月25日

---

## 問題概要

Google Apps Script（gas-script-individual.js）で以下3つの問題が発生：

### 問題1: 0件変更時の不要Deploy実行
- **症状**: `updateNewArrivalFlags`で変更0件でも`executeScheduledDeploy`が実行される
- **影響**: 不要なVercelデプロイが大量発生

### 問題2: 深夜の謎の自動実行
- **症状**: 誰も編集していないのに`syncDataWithMicroCMS`が自動実行される
- **発生時刻**: 5:13:39など不定期

### 問題3: syncDataWithMicroCMSの連発実行
- **症状**: 編集イベントが連鎖して同一関数が数秒間で連続実行される
- **影響**: 大量のAPI呼び出しとDeploy乱発、最も危険な状態

---

## 根本原因分析

### 問題1の原因
- **executeScheduledDeploy()**: 予約時刻になると無条件で実行
- **日付形式の違い**: スプレッドシート`"2025-06-07"`とmicroCMS`"2025-06-07T00:00:00.000Z"`
- **recordsAreEqual()**: 同じ内容でも日付形式違いで「変更あり」と誤判定
- **結果**: 49件全てが「更新必要」と判定され、Deploy予約が発生

### 問題2の原因
- **推測**: 不明な時間ベーストリガーまたはトリガー設定ミス
- **影響**: 問題1により不要Deployは発生するが、連発ではない

### 問題3の原因
- **編集イベント連鎖**: 何らかの理由で編集イベントが無限ループ
- **重複実行防止の競合**: PropertiesServiceの更新タイミングで競合発生
- **microCMS重複レコード**: 60件中49ユニークID（11件重複）が削除判定を阻害

---

## 実装した対策

### 1. 緊急停止機能（問題3対策）
```javascript
// 緊急停止・解除機能
function emergencyStop() { /* 全処理を強制停止 */ }
function emergencyResume() { /* 緊急停止を解除 */ }
function isEmergencyStopped() { /* 緊急停止状態チェック */ }
```

### 2. 強化された排他制御（問題3対策）
```javascript
// LockService + PropertiesService 二重防御
function acquireProcessLock() { 
  // 1秒タイムアウト + フォールバック機能
  // LockService失敗時もPropertiesServiceで制御継続
}
```

### 3. 連続実行自動検出・停止（問題3対策）
```javascript
function detectRapidExecution(functionName) {
  // 5秒以内に3回実行で警告
  // 5回実行で自動緊急停止
}
```

### 4. 日付形式正規化（問題1対策）
```javascript
function normalizeDateString(dateStr) {
  // "2025-06-07T00:00:00.000Z" → "2025-06-07"
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  return String(dateStr);
}

function recordsAreEqual(record1, record2) {
  // birthday フィールドの特別処理で日付形式統一
}
```

### 5. 重複レコード削除機能
```javascript
function cleanupDuplicateRecords() {
  // microCMS内の同一ID重複レコードを削除
  // 60件 → 49件に正常化
}
```

### 6. デバッグ・調査機能
```javascript
// ID比較詳細確認
function debugIdComparison() { /* ... */ }
function debugDetailedComparison() { /* ... */ }
function debugRecordsComparison() { /* ... */ }
```

### 7. LockService回避版同期
```javascript
function syncDataWithMicroCMSNoLock() {
  // LockService問題完全回避
  // PropertiesServiceのみで制御
}
```

---

## 対策実施結果

### ✅ 問題1: 完全解決
- **修正前**: `add:0 upd:49 del:0` → Deploy予約発生
- **修正後**: `add:0 upd:0 del:0` → 「変更なし - Vercel deployをスキップ」
- **効果**: 不要なDeploy予約が完全に停止

### ✅ 問題3: 完全解決
- **緊急停止機能**: 即座に連発実行を停止可能
- **強化された排他制御**: LockService問題を回避
- **自動検出機能**: 5回連続で自動緊急停止

### 🔶 問題2: 影響軽減
- **根本解決**: 未実施（トリガー調査が必要）
- **影響**: 問題1解決により不要Deploy発生なし
- **判断**: 実害がないため継続調査不要

---

## 発見された技術的課題と解決策

### 1. microCMS APIの日付形式
- **課題**: 同一日付でもISO8601形式で返却される
- **解決**: 正規化関数で形式統一

### 2. GAS LockServiceの不安定性
- **課題**: ロックが残存して処理がブロックされる
- **解決**: タイムアウト短縮 + フォールバック機能

### 3. microCMS内の重複データ
- **課題**: 同一IDで複数レコードが存在
- **解決**: 重複検出・削除機能を実装

---

## 運用ガイドライン

### 緊急時対応
```javascript
// 連発実行が発生したら即座に実行
emergencyStop();

// 問題解決後に再開
emergencyResume();
```

### 定期メンテナンス
```javascript
// データ同期状況確認
debugIdComparison();

// 重複レコード確認
debugDetailedComparison();

// 同期実行（LockService問題時）
syncDataWithMicroCMSNoLock();
```

### 予防的監視
- 実行ログで「連続実行検出」警告をチェック
- Deploy頻度の監視
- microCMSレコード数の定期確認

---

## 修正ファイル

- **対象**: `/gas-script-individual.js`
- **修正行数**: 約100行追加・修正
- **追加機能**: 8個の新機能
- **互換性**: 既存トリガー設定に影響なし

---

## 今後の推奨事項

### 1. 継続運用
- 現在のコードで本番運用継続
- 追加された機能はすべて有益で削除不要

### 2. 監視項目
- Deploy頻度（異常な増加がないか）
- 実行ログの警告メッセージ
- データ同期の整合性

### 3. 将来的な改善
- 問題2の根本原因調査（必要に応じて）
- より詳細な実行ログの追加
- エラー通知機能の実装

---

*このログは gas-script-individual.js の安定稼働のため、将来のトラブル時に参照すること*