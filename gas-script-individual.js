/******************************************************************
 * スプレッドシート「individual」を編集したとき **だけ**
 * その行に対応する microCMS individual API を更新／追加するスクリプト
 *
 * ※自動転記専用（手動削除には対応しない）
 * 2025-09-改訂版（randomId 列を削除したレイアウトに対応）
 *
 * - A列 : petNumber   → コンテンツID（6桁ゼロ埋め）
 * - B列 : animalType
 * - C列 : classification
 * - D列 : breedTypeJa
 * - E列 : breedTypeEn
 * - F列 : parentBreed
 * - G列 : color
 * - H列 : tags
 * - I列 : gender
 * - J列 : birthday
 * - K列 : mixFatherBreed
 * - L列 : mixMotherBreed
 * - M列 : fatherWeight
 * - N列 : motherWeight
 * - O列 : storeName
 * - P列 : storeId
 * - Q列 : isNew (TRUE/FALSE)
 * - R列 : imageUrl01
 * - S列 : imageUrl02
 * - T列 : imageUrl03
 * - U列 : videoUrl
 *
 * 変更点
 *  - randomId 列（旧B列）を完全に削除
 *  - 以降すべての列 index-1 シフト
 *  - isValidRecord から randomId 必須チェックを除去
 *  - buildRecordFromRow のフィールドマッピング調整
 ******************************************************************/

//=================================================================
// 定数
//=================================================================
const INDIVIDUAL_API_URL = "https://ic0k4mbrvg.microcms.io/api/v1/individual"; // 個体情報 API
const API_KEY            = "P6WwdKx4Bh44xbZR5Zp3CS5xQ1QKhAZEenzt";            // microCMS API KEY
const TARGET_SHEET_NAME  = "individual";                                       // 対象シート名

//=================================================================
// デバッグ設定
//=================================================================
const DEBUG_MODE = false; // 本番: false, デバッグ時: true に変更

//=================================================================
// API制限対策設定
//=================================================================
const API_DELAY_MS = 300; // リクエスト間の待機時間（ミリ秒）
const MAX_RETRIES = 3;    // リトライ最大回数
const RETRY_DELAY_BASE = 1000; // リトライ基本待機時間（ミリ秒）

//=================================================================
// Vercel Deploy Hook 設定
//=================================================================
const VERCEL_WEBHOOK_URL = "https://api.vercel.com/v1/integrations/deploy/prj_xjNXgpD3aFBP6sQ6XOCRWurrLd06/140eE3m5ND";
const DEPLOY_DELAY_SECONDS = 90; // deploy前の待機時間（秒）

//=================================================================
// グローバル変数（deploy予約管理用）
//=================================================================
// PropertiesServiceを使用してスクリプト実行間でデータを保持
function getPendingDeployTime() {
  const time = PropertiesService.getScriptProperties().getProperty('PENDING_DEPLOY_TIME');
  return time ? parseInt(time) : null;
}

function setPendingDeployTime(time) {
  if (time === null) {
    PropertiesService.getScriptProperties().deleteProperty('PENDING_DEPLOY_TIME');
  } else {
    PropertiesService.getScriptProperties().setProperty('PENDING_DEPLOY_TIME', time.toString());
  }
}

//=================================================================
// 重複実行防止（LockService + Properties併用）
//=================================================================
function isProcessRunning() {
  const running = PropertiesService.getScriptProperties().getProperty('SYNC_RUNNING');
  return running === 'true';
}

function setProcessRunning(isRunning) {
  if (isRunning) {
    PropertiesService.getScriptProperties().setProperty('SYNC_RUNNING', 'true');
  } else {
    PropertiesService.getScriptProperties().deleteProperty('SYNC_RUNNING');
  }
}

/** LockServiceを使った強力な排他制御 */
function acquireProcessLock() {
  // まずPropertiesServiceのみでチェック（LockServiceを使わない）
  if (isProcessRunning()) {
    Logger.log('PropertiesService チェック: 既に処理実行中');
    return null;
  }
  
  const lock = LockService.getScriptLock();
  try {
    // 1秒間のみロック取得を試行（短縮）
    const acquired = lock.waitLock(1000);
    if (!acquired) {
      Logger.log('ロック取得タイムアウト（1秒） - LockServiceをスキップして続行');
      // LockServiceが取得できなくても、PropertiesServiceで制御
      setProcessRunning(true);
      Logger.log('処理開始（LockServiceなし）');
      return { isLockAcquired: false };
    }
    
    // 処理開始フラグを設定
    setProcessRunning(true);
    Logger.log('処理ロック取得成功（LockService使用）');
    return { lock: lock, isLockAcquired: true };
    
  } catch (err) {
    Logger.log(`LockService エラー - PropertiesServiceのみで続行: ${err.message}`);
    setProcessRunning(true);
    return { isLockAcquired: false };
  }
}

/** LockService解放 */
function releaseProcessLock(lockObj) {
  if (lockObj) {
    setProcessRunning(false);
    if (lockObj.isLockAcquired && lockObj.lock) {
      try {
        lockObj.lock.releaseLock();
        Logger.log('処理ロック解放完了（LockService）');
      } catch (err) {
        Logger.log(`LockService解放エラー: ${err.message}`);
      }
    } else {
      Logger.log('処理ロック解放完了（PropertiesServiceのみ）');
    }
  }
}

//=================================================================
// ユーティリティ
//=================================================================
/** petNumber を 6 桁ゼロ埋め ID 化 */
function formatPetNumberTo6Digits(num) {
  return String(num).padStart(6, "0");
}

/** GAS Date / 文字列 → YYYY-MM-DD */
function formatBirthday(val) {
  if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val)) {
    return Utilities.formatDate(val, "Asia/Tokyo", "yyyy-MM-dd");
  }
  return String(val).replace(/\//g, "-");
}

/** 1 行配列 → individual API レコード */
function buildRecordFromRow(row) {
  const id = formatPetNumberTo6Digits(row[0]);                 // A列
  const fw = row[12] != null && row[12] !== "" ? String(row[12]) : ""; // M列
  const mw = row[13] != null && row[13] !== "" ? String(row[13]) : ""; // N列
  const isNew = row[16] != null ? String(row[16]).toLowerCase() : "";  // Q列

  return {
    id:             id,
    animalType:     row[1],   // B
    classification: row[2],   // C
    breedTypeJa:    row[3],   // D
    breedTypeEn:    row[4],   // E
    parentBreed:    row[5] || null, // F
    color:          row[6],   // G
    tags:           row[7],   // H
    gender:         row[8],   // I
    birthday:       formatBirthday(row[9]),  // J
    mixFatherBreed: row[10] || null,  // K
    mixMotherBreed: row[11] || null,  // L
    fatherWeight:   (fw && fw !== "") ? fw : null,
    motherWeight:   (mw && mw !== "") ? mw : null,
    storeName:      row[14],  // O
    storeId:        row[15],  // P
    isNew:          isNew,    // Q
    imageUrl01:     row[17] || null, // R
    imageUrl02:     row[18] || null, // S
    imageUrl03:     row[19] || null, // T
    videoUrl:       row[20] || null  // U
  };
}

/** 必須チェック（不足なら false）*/
function isValidRecord(rec) {
  return rec.id             && rec.id !== ""             &&
         rec.animalType     && rec.animalType !== ""     &&
         rec.classification && rec.classification !== "" &&
         rec.breedTypeJa    && rec.breedTypeJa !== ""    &&
         rec.breedTypeEn    && rec.breedTypeEn !== ""    &&
         rec.color          && rec.color !== ""          &&
         rec.tags           && rec.tags !== ""           &&
         rec.gender         && rec.gender !== ""         &&
         rec.birthday       && rec.birthday !== ""       &&
         rec.storeName      && rec.storeName !== ""      &&
         rec.storeId        && rec.storeId !== ""        &&
         rec.isNew          && rec.isNew !== "";
}

/** 2つのレコードの内容が同一かチェック */
function recordsAreEqual(record1, record2) {
  const fields = [
    'animalType', 'classification', 'breedTypeJa', 'breedTypeEn', 'parentBreed',
    'color', 'tags', 'gender', 'birthday', 'mixFatherBreed', 'mixMotherBreed',
    'fatherWeight', 'motherWeight', 'storeName', 'storeId', 'isNew',
    'imageUrl01', 'imageUrl02', 'imageUrl03', 'videoUrl'
  ];
  
  for (const field of fields) {
    let val1 = record1[field] || null;
    let val2 = record2[field] || null;
    
    // birthday フィールドの特別処理（日付形式の正規化）
    if (field === 'birthday') {
      val1 = normalizeDateString(val1);
      val2 = normalizeDateString(val2);
    }
    
    if (val1 !== val2) {
      return false;
    }
  }
  return true;
}

/** 日付文字列を YYYY-MM-DD 形式に正規化 */
function normalizeDateString(dateStr) {
  if (!dateStr || dateStr === null) return null;
  
  // ISO8601形式の場合（例: "2025-06-07T00:00:00.000Z"）
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return dateStr.split('T')[0]; // "2025-06-07" を抽出
  }
  
  // 既に YYYY-MM-DD 形式の場合
  return String(dateStr);
}

//=================================================================
// main: 編集イベントで呼ばれる
//=================================================================
function onEditTrigger(e) {
  // 緊急停止チェック
  if (isEmergencyStopped()) {
    Logger.log('緊急停止中です。編集処理をスキップします。');
    return;
  }
  
  // 連続実行検出（自動緊急停止機能）
  if (detectRapidExecution('onEditTrigger')) {
    Logger.log('連続実行により緊急停止されました');
    return;
  }
  
  // eオブジェクトが存在しない場合の対処
  if (!e || !e.range) {
    Logger.log('編集イベントオブジェクトが無効です');
    return;
  }
  
  // 編集イベント詳細ログ（デバッグ用）
  logEditEventDetails(e);
  
  // 重複実行チェック
  if (isProcessRunning()) {
    Logger.log('既に処理が実行中です。編集処理をスキップします。');
    return;
  }
  
  const sheet = e.range.getSheet();
  if (sheet.getName() !== TARGET_SHEET_NAME) return; // 他シート無視
  if (e.range.getRow() === 1) return;                // ヘッダー行無視

  const rowIdx  = e.range.getRow();
  const colLast = sheet.getLastColumn();
  const rowVals = sheet.getRange(rowIdx, 1, 1, colLast).getValues()[0];

  // 行が空の場合は処理をスキップ（自動転記での中間状態と判断）
  const isEmpty = rowVals.every(v => v === "" || v === null);
  
  if (isEmpty) {
    Logger.log(`行${rowIdx}: 空行検出 → 自動転記の中間状態と判断してスキップ`);
    return;
  }
  
  const petNumber = rowVals[0];
  if (!petNumber || petNumber === "" || petNumber === null) {
    Logger.log(`行${rowIdx}: petNumber が空 → 処理をスキップ`);
    return;
  }
  
  const id = formatPetNumberTo6Digits(petNumber);
  if (id === "000000") {
    Logger.log(`行${rowIdx}: 無効なID → 処理をスキップ`);
    return;
  }

  const record = buildRecordFromRow(rowVals);
  if (!isValidRecord(record)) {
    Logger.log(`行${rowIdx}: 必須不足 → 送信スキップ`);
    return;
  }

  addRecordToMicroCMS(INDIVIDUAL_API_URL, record); // PUT = 新規 or 上書き
  Logger.log(`行${rowIdx}: microCMS 送信完了 (PUT)`);
}

//=================================================================
// 手動一括同期（メンテナンス用）
//=================================================================
function syncDataWithMicroCMS() {
  // 緊急停止チェック
  if (isEmergencyStopped()) {
    Logger.log('緊急停止中です。同期処理をスキップします。');
    return;
  }
  
  // LockServiceによる排他制御
  const lock = acquireProcessLock();
  if (!lock) {
    Logger.log('同期処理: ロック取得失敗 - 処理をスキップ');
    return;
  }
  
  try {
    Logger.log('一括同期開始（メンテナンス用）');
    
    const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TARGET_SHEET_NAME);
    const data   = sheet.getDataRange().getValues();
    data.shift(); // header
    const records = data.map(buildRecordFromRow).filter(isValidRecord);

    Logger.log(`3. 必須揃いデータ数: ${records.length}`);
    syncWithAPI(INDIVIDUAL_API_URL, records, "id");
    
    Logger.log('一括同期完了');
  } catch (error) {
    Logger.log(`一括同期エラー: ${error.message}`);
  } finally {
    releaseProcessLock(lock);
  }
}


//=================================================================
// HTTP ラッパー群（変更なし）
//=================================================================
function syncWithAPI(url, recordsFromSheet, keyField) {
  const startTime = new Date();
  Logger.log(`4. ${url} と同期開始`);
  const recordsFromCMS = getRecordsFromMicroCMS(url);
  Logger.log(`5. CMS既存 ${recordsFromCMS.length}件取得`);

  const cmsKeys   = recordsFromCMS.map(r => r[keyField]);
  const sheetKeys = recordsFromSheet.map(r => r[keyField]);

  const toAdd    = recordsFromSheet.filter(r => !cmsKeys.includes(r[keyField]));
  const toDelete = recordsFromCMS   .filter(r => !sheetKeys.includes(r[keyField]));
  
  // 内容比較による実際の更新対象を特定
  const toUpdate = [];
  recordsFromSheet.forEach(sheetRecord => {
    if (cmsKeys.includes(sheetRecord[keyField])) {
      const cmsRecord = recordsFromCMS.find(r => r[keyField] === sheetRecord[keyField]);
      if (cmsRecord && !recordsAreEqual(sheetRecord, cmsRecord)) {
        toUpdate.push(sheetRecord);
      }
    }
  });

  Logger.log(`6. add:${toAdd.length} upd候補:${recordsFromSheet.filter(r => cmsKeys.includes(r[keyField])).length} 実際upd:${toUpdate.length} del:${toDelete.length}`);
  
  // 処理実行（API制限対策で間隔をあける）
  toAdd.forEach((r, index) => {
    if (index > 0) Utilities.sleep(API_DELAY_MS); // 最初以外は待機
    addRecordToMicroCMS(url, r);
  });
  
  toUpdate.forEach((r, index) => {
    if (index > 0 || toAdd.length > 0) Utilities.sleep(API_DELAY_MS);
    updateRecordInMicroCMS(url, r);
  });
  
  toDelete.forEach((r, index) => {
    if (index > 0 || toAdd.length > 0 || toUpdate.length > 0) Utilities.sleep(API_DELAY_MS);
    deleteRecordFromMicroCMS(url, r.id);
  });
  
  // 処理完了サマリー
  const totalProcessed = toAdd.length + toUpdate.length + toDelete.length;
  const elapsedSeconds = Math.round((new Date() - startTime) / 1000);
  Logger.log(`同期完了: ${totalProcessed}件処理 (add:${toAdd.length}, upd:${toUpdate.length}, del:${toDelete.length}) - ${elapsedSeconds}秒`);
  
  // 実際に変更があった場合のみVercel deploy予約を更新
  if (totalProcessed > 0) {
    scheduleDelayedDeploy();
  } else {
    Logger.log('変更なし - Vercel deployをスキップ');
  }
}

function getRecordsFromMicroCMS(url) {
  const limit = 100;
  let offset  = 0;
  let all     = [];
  while (true) {
    const opt  = { method:"GET", headers:{ "X-MICROCMS-API-KEY": API_KEY }};
    const res  = UrlFetchApp.fetch(`${url}?limit=${limit}&offset=${offset}`, opt);
    const json = JSON.parse(res.getContentText());
    if (json.contents?.length) {
      all = all.concat(json.contents);
      offset += limit;
    } else break;
  }
  return all;
}

function addRecordToMicroCMS(url, record) {
  const opt = {
    method : "PUT",
    headers: { "Content-Type":"application/json", "X-MICROCMS-API-KEY": API_KEY },
    payload: JSON.stringify(record)
  };
  
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      const response = UrlFetchApp.fetch(`${url}/${record.id}`, opt);
      const responseCode = response.getResponseCode();
      
      if (responseCode >= 200 && responseCode < 300) {
        Logger.log(`9. 追加/上書き成功: ${record.id}`);
        return;
      } else if (responseCode === 429) {
        throw new Error(`Rate limit exceeded (${responseCode})`);
      } else {
        throw new Error(`HTTP ${responseCode}`);
      }
    } catch (err) {
      if ((err.message.includes('429') || err.message.includes('Rate limit')) && retries < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, retries); // 指数バックオフ
        Logger.log(`10. 追加リトライ ${retries + 1}/${MAX_RETRIES}: ${record.id} - ${delay}ms待機`);
        Utilities.sleep(delay);
        retries++;
      } else {
        Logger.log(`10. 追加失敗: ${record.id} - ${err.message}`);
        break;
      }
    }
  }
}

function updateRecordInMicroCMS(url, record) {
  const opt = {
    method : "PATCH",
    headers: { "Content-Type":"application/json", "X-MICROCMS-API-KEY": API_KEY },
    payload: JSON.stringify(record)
  };
  
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      const response = UrlFetchApp.fetch(`${url}/${record.id}`, opt);
      const responseCode = response.getResponseCode();
      
      if (responseCode >= 200 && responseCode < 300) {
        Logger.log(`11. 更新完了: ${record.id}`);
        return;
      } else if (responseCode === 429) {
        throw new Error(`Rate limit exceeded (${responseCode})`);
      } else {
        throw new Error(`HTTP ${responseCode}`);
      }
    } catch (err) {
      if ((err.message.includes('429') || err.message.includes('Rate limit')) && retries < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, retries); // 指数バックオフ
        Logger.log(`12. 更新リトライ ${retries + 1}/${MAX_RETRIES}: ${record.id} - ${delay}ms待機`);
        Utilities.sleep(delay);
        retries++;
      } else {
        Logger.log(`12. 更新失敗: ${record.id} - ${err.message}`);
        break;
      }
    }
  }
}

function deleteRecordFromMicroCMS(url, recordId) {
  const opt = { method:"DELETE", headers:{ "X-MICROCMS-API-KEY": API_KEY }};
  
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      const response = UrlFetchApp.fetch(`${url}/${recordId}`, opt);
      const responseCode = response.getResponseCode();
      
      if (responseCode >= 200 && responseCode < 300) {
        Logger.log(`13. 削除完了: ${recordId}`);
        return;
      } else if (responseCode === 429) {
        throw new Error(`Rate limit exceeded (${responseCode})`);
      } else {
        throw new Error(`HTTP ${responseCode}`);
      }
    } catch (err) {
      if ((err.message.includes('429') || err.message.includes('Rate limit')) && retries < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, retries); // 指数バックオフ
        Logger.log(`14. 削除リトライ ${retries + 1}/${MAX_RETRIES}: ${recordId} - ${delay}ms待機`);
        Utilities.sleep(delay);
        retries++;
      } else {
        Logger.log(`14. 削除失敗: ${recordId} - ${err.message}`);
        break;
      }
    }
  }
}

//=================================================================
// Vercel Deploy Hook 処理
//=================================================================
function scheduleDelayedDeploy() {
  const currentTime = new Date().getTime();
  const deployTime = currentTime + (DEPLOY_DELAY_SECONDS * 1000);
  
  // 既存のトリガーを先にクリーンアップ
  cleanupTriggers();
  
  // 少し待機してからトリガー作成（重複防止）
  Utilities.sleep(100);
  
  // deploy予約時刻を更新
  setPendingDeployTime(deployTime);
  Logger.log(`Deploy予約更新: ${DEPLOY_DELAY_SECONDS}秒後に実行予定 (${new Date(deployTime).toLocaleString()})`);
  
  // 新しいトリガーを作成
  try {
    ScriptApp.newTrigger('executeScheduledDeploy')
      .timeBased()
      .after(DEPLOY_DELAY_SECONDS * 1000)
      .create();
    Logger.log('新しいDeployトリガー作成完了');
  } catch (err) {
    Logger.log(`トリガー作成失敗: ${err.message}`);
  }
}

function executeScheduledDeploy() {
  const pendingTime = getPendingDeployTime();
  const currentTime = new Date().getTime();
  
  if (!pendingTime) {
    Logger.log('Deploy予約なし - スキップ');
    return;
  }
  
  if (currentTime >= pendingTime) {
    // deploy実行
    executeDeploy();
    // 予約クリア
    setPendingDeployTime(null);
  } else {
    Logger.log(`Deploy予約まだ先: ${new Date(pendingTime).toLocaleString()}`);
  }
  
  // 使い終わったトリガーを削除
  cleanupTriggers();
}

function executeDeploy() {
  Logger.log('Vercel deploy実行開始');
  
  try {
    const response = UrlFetchApp.fetch(VERCEL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    const responseCode = response.getResponseCode();
    if (responseCode >= 200 && responseCode < 300) {
      Logger.log(`Vercel deploy成功: HTTP ${responseCode}`);
    } else {
      Logger.log(`Vercel deploy警告: HTTP ${responseCode}`);
    }
  } catch (err) {
    Logger.log(`Vercel deploy失敗: ${err.message}`);
  }
}

function cleanupTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'executeScheduledDeploy') {
      try {
        ScriptApp.deleteTrigger(trigger);
        deletedCount++;
      } catch (err) {
        Logger.log(`トリガー削除失敗: ${err.message}`);
      }
    }
  });
  Logger.log(`既存トリガー削除数: ${deletedCount}`);
}

//=================================================================
// 緊急停止・デバッグ機能
//=================================================================

/** 緊急停止: 全処理を強制停止 */
function emergencyStop() {
  PropertiesService.getScriptProperties().setProperty('EMERGENCY_STOP', 'true');
  PropertiesService.getScriptProperties().deleteProperty('SYNC_RUNNING');
  Logger.log('緊急停止フラグを設定しました');
}

/** 緊急停止解除 */
function emergencyResume() {
  PropertiesService.getScriptProperties().deleteProperty('EMERGENCY_STOP');
  Logger.log('緊急停止を解除しました');
}

/** 緊急停止状態チェック */
function isEmergencyStopped() {
  return PropertiesService.getScriptProperties().getProperty('EMERGENCY_STOP') === 'true';
}

/** 編集イベント詳細ログ（連鎖原因調査用） */
function logEditEventDetails(e) {
  if (!e || !e.range) return;
  
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const col = e.range.getColumn();
  const oldValue = e.oldValue || 'null';
  const newValue = e.value || 'null';
  const timestamp = new Date().toISOString();
  
  Logger.log(`[${timestamp}] 編集イベント詳細:`);
  Logger.log(`  シート: ${sheet.getName()}`);
  Logger.log(`  セル: ${row}行${col}列 (${sheet.getRange(row, col).getA1Notation()})`);
  Logger.log(`  変更: "${oldValue}" → "${newValue}"`);
  Logger.log(`  編集範囲: ${e.range.getA1Notation()}`);
  Logger.log(`  ユーザー: ${Session.getActiveUser().getEmail() || '不明'}`);
}

/** 連続実行検出（5秒以内に3回以上実行で警告） */
function detectRapidExecution(functionName) {
  const now = new Date().getTime();
  const key = `RAPID_EXEC_${functionName}`;
  const execTimes = PropertiesService.getScriptProperties().getProperty(key);
  
  let times = [];
  if (execTimes) {
    times = JSON.parse(execTimes);
  }
  
  // 5秒以内の実行のみ保持
  times = times.filter(time => (now - time) < 5000);
  times.push(now);
  
  // 3回以上なら警告
  if (times.length >= 3) {
    Logger.log(`⚠️ 警告: ${functionName} が5秒以内に${times.length}回実行されました`);
    Logger.log('連続実行を検出 - 無限ループの可能性があります');
    
    // 緊急停止を自動実行
    if (times.length >= 5) {
      Logger.log('🚨 緊急停止: 5回以上の連続実行を検出');
      emergencyStop();
      return true; // 緊急停止実行
    }
  }
  
  PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(times));
  return false; // 正常継続
}

//=================================================================
// デバッグ用関数
//=================================================================

function debugIdComparison() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("individual");
  const data = sheet.getDataRange().getValues();
  data.shift(); // header
  const records = data.map(buildRecordFromRow).filter(isValidRecord);
  const cmsRecords = getRecordsFromMicroCMS(INDIVIDUAL_API_URL);
  
  const sheetIds = records.map(r => r.id).sort();
  const cmsIds = cmsRecords.map(r => r.id).sort();
  
  Logger.log(`スプレッドシート件数: ${records.length}`);
  Logger.log(`microCMS件数: ${cmsRecords.length}`);
  Logger.log(`スプレッドシートID: ${sheetIds}`);
  Logger.log(`microCMS ID: ${cmsIds}`);
  
  const toDelete = cmsRecords.filter(r => !sheetIds.includes(r.id));
  Logger.log(`削除対象: ${toDelete.length}件`);
  if (toDelete.length > 0) {
    Logger.log(`削除対象ID: ${toDelete.map(r => r.id)}`);
  }
  
  const missingInCms = records.filter(r => !cmsIds.includes(r.id));
  Logger.log(`CMSに未登録: ${missingInCms.length}件`);
  if (missingInCms.length > 0) {
    Logger.log(`未登録ID: ${missingInCms.map(r => r.id)}`);
  }
}

function debugDetailedComparison() {
  const cmsRecords = getRecordsFromMicroCMS(INDIVIDUAL_API_URL);
  Logger.log(`microCMS全取得件数: ${cmsRecords.length}`);
  
  // IDの重複チェック
  const cmsIds = cmsRecords.map(r => r.id);
  const uniqueIds = [...new Set(cmsIds)];
  Logger.log(`ユニークID数: ${uniqueIds.length}`);
  
  if (cmsIds.length !== uniqueIds.length) {
    Logger.log('⚠️ microCMSに重複IDが存在します');
    
    // 重複IDを特定
    const duplicates = cmsIds.filter((id, index) => cmsIds.indexOf(id) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];
    Logger.log(`重複ID: ${uniqueDuplicates}`);
  } else {
    Logger.log('✓ microCMSにID重複はありません');
  }
  
  // CMS全IDを表示
  Logger.log(`microCMS全ID: ${cmsIds.sort()}`);
}

function cleanupDuplicateRecords() {
  Logger.log('重複レコード削除処理開始');
  
  const cmsRecords = getRecordsFromMicroCMS(INDIVIDUAL_API_URL);
  const cmsIds = cmsRecords.map(r => r.id);
  const uniqueIds = [...new Set(cmsIds)];
  
  if (cmsIds.length === uniqueIds.length) {
    Logger.log('重複レコードは見つかりませんでした');
    return;
  }
  
  Logger.log(`重複レコード削除対象: ${cmsIds.length - uniqueIds.length}件`);
  
  // IDごとにグループ化
  const groupedById = {};
  cmsRecords.forEach(record => {
    if (!groupedById[record.id]) {
      groupedById[record.id] = [];
    }
    groupedById[record.id].push(record);
  });
  
  // 重複があるIDの処理
  let deletedCount = 0;
  Object.keys(groupedById).forEach(id => {
    const records = groupedById[id];
    if (records.length > 1) {
      Logger.log(`ID ${id}: ${records.length}件の重複を検出`);
      
      // 最初の1件以外を削除
      for (let i = 1; i < records.length; i++) {
        try {
          deleteRecordFromMicroCMS(INDIVIDUAL_API_URL, id);
          deletedCount++;
          Logger.log(`重複レコード削除: ${id} (${i}/${records.length - 1})`);
          
          // API制限対策
          if (i < records.length - 1) {
            Utilities.sleep(API_DELAY_MS);
          }
        } catch (err) {
          Logger.log(`削除失敗: ${id} - ${err.message}`);
        }
      }
    }
  });
  
  Logger.log(`重複レコード削除完了: ${deletedCount}件削除`);
  
  // 削除後の状態確認
  Utilities.sleep(1000);
  const afterRecords = getRecordsFromMicroCMS(INDIVIDUAL_API_URL);
  Logger.log(`削除後のレコード数: ${afterRecords.length}件`);
}

function debugRecordsComparison() {
  Logger.log('レコード内容比較デバッグ開始');
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TARGET_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  data.shift(); // header
  const records = data.map(buildRecordFromRow).filter(isValidRecord);
  const cmsRecords = getRecordsFromMicroCMS(INDIVIDUAL_API_URL);
  
  // 最初の1件だけ詳細比較
  if (records.length > 0 && cmsRecords.length > 0) {
    const sheetRecord = records[0];
    const cmsRecord = cmsRecords.find(r => r.id === sheetRecord.id);
    
    if (cmsRecord) {
      Logger.log(`=== ID ${sheetRecord.id} の詳細比較 ===`);
      Logger.log(`recordsAreEqual結果: ${recordsAreEqual(sheetRecord, cmsRecord)}`);
      
      const fields = [
        'animalType', 'classification', 'breedTypeJa', 'breedTypeEn', 'parentBreed',
        'color', 'tags', 'gender', 'birthday', 'mixFatherBreed', 'mixMotherBreed',
        'fatherWeight', 'motherWeight', 'storeName', 'storeId', 'isNew',
        'imageUrl01', 'imageUrl02', 'imageUrl03', 'videoUrl'
      ];
      
      fields.forEach(field => {
        const sheetVal = sheetRecord[field] || null;
        const cmsVal = cmsRecord[field] || null;
        if (sheetVal !== cmsVal) {
          Logger.log(`❌ ${field}: シート="${sheetVal}" vs CMS="${cmsVal}"`);
        }
      });
    }
  }
}

//=================================================================
// テスト用関数
//=================================================================
function testVercelWebhook() {
  Logger.log('Vercel webhook テスト開始');
  executeDeploy();
}

function testDelayedDeploy() {
  Logger.log('遅延Deploy テスト開始');
  scheduleDelayedDeploy();
}

function checkPendingDeploy() {
  const pendingTime = getPendingDeployTime();
  if (pendingTime) {
    Logger.log(`現在の予約: ${new Date(pendingTime).toLocaleString()}`);
  } else {
    Logger.log('予約なし');
  }
}

function clearPendingDeploy() {
  setPendingDeployTime(null);
  Logger.log('Deploy予約をクリアしました');
}

function clearProcessLock() {
  setProcessRunning(false);
  Logger.log('処理ロックをクリアしました');
}

/** LockService問題を完全回避する同期実行 */
function syncDataWithMicroCMSNoLock() {
  // 緊急停止チェック
  if (isEmergencyStopped()) {
    Logger.log('緊急停止中です。同期処理をスキップします。');
    return;
  }
  
  // 連続実行検出
  if (detectRapidExecution('syncDataWithMicroCMSNoLock')) {
    Logger.log('連続実行により緊急停止されました');
    return;
  }
  
  // PropertiesServiceのみでチェック（LockServiceを使用しない）
  if (isProcessRunning()) {
    Logger.log('既に同期処理が実行中です。処理をスキップします。');
    return;
  }
  
  try {
    setProcessRunning(true);
    Logger.log('一括同期開始（ロック回避版）');
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TARGET_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    data.shift(); // header
    const records = data.map(buildRecordFromRow).filter(isValidRecord);

    Logger.log(`3. 必須揃いデータ数: ${records.length}`);
    syncWithAPI(INDIVIDUAL_API_URL, records, "id");
    
    Logger.log('一括同期完了');
  } catch (error) {
    Logger.log(`一括同期エラー: ${error.message}`);
  } finally {
    setProcessRunning(false);
  }
}

function testSyncWithoutLock() {
  Logger.log('ロック無視で一括同期テスト開始');
  const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TARGET_SHEET_NAME);
  const data   = sheet.getDataRange().getValues();
  data.shift(); // header
  const records = data.map(buildRecordFromRow).filter(isValidRecord);
  Logger.log(`テスト: 必須揃いデータ数: ${records.length}`);
  syncWithAPI(INDIVIDUAL_API_URL, records, "id");
}
