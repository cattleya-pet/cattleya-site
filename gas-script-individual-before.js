/******************************************************************
 * スプレッドシート「individual」を編集したとき **だけ**
 * その行に対応する microCMS individual API を更新／追加／削除するスクリプト
 *
 * 2025-07-改訂版（randomId 列を削除したレイアウトに対応）
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
    mixFatherBreed: row[10] || "",  // K
    mixMotherBreed: row[11] || "",  // L
    fatherWeight:   fw,
    motherWeight:   mw,
    storeName:      row[14],  // O
    storeId:        row[15],  // P
    isNew:          isNew,    // Q
    imageUrl01:     row[17] || "", // R
    imageUrl02:     row[18] || "", // S
    imageUrl03:     row[19] || "", // T
    videoUrl:       row[20] || ""  // U
  };
}

/** 必須チェック（不足なら false）*/
function isValidRecord(rec) {
  return rec.id             && rec.animalType   &&
         rec.classification && rec.breedTypeJa  && rec.breedTypeEn &&
         rec.color          && rec.tags         && rec.gender &&
         rec.birthday       && rec.storeName    && rec.storeId &&
         rec.isNew          && rec.imageUrl01;
}

//=================================================================
// main: 編集イベントで呼ばれる
//=================================================================
function onEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== TARGET_SHEET_NAME) return; // 他シート無視
  if (e.range.getRow() === 1) return;                // ヘッダー行無視

  const rowIdx  = e.range.getRow();
  const colLast = sheet.getLastColumn();
  const rowVals = sheet.getRange(rowIdx, 1, 1, colLast).getValues()[0];

  // 行が空 ⇒ 削除扱い
  const id = formatPetNumberTo6Digits(rowVals[0]);
  const isEmpty = rowVals.every(v => v === "" || v === null);

  if (isEmpty || !id) {
    deleteRecordFromMicroCMS(INDIVIDUAL_API_URL, id);
    Logger.log(`行${rowIdx}: 空行検出 → microCMS ${id} を削除`);
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
// 手動一括同期（必要なら）
//=================================================================
function syncDataWithMicroCMS() {
  const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TARGET_SHEET_NAME);
  const data   = sheet.getDataRange().getValues();
  data.shift(); // header
  const records = data.map(buildRecordFromRow).filter(isValidRecord);

  Logger.log(`3. 必須揃いデータ数: ${records.length}`);
  syncWithAPI(INDIVIDUAL_API_URL, records, "id");
}

//=================================================================
// HTTP ラッパー群（変更なし）
//=================================================================
function syncWithAPI(url, recordsFromSheet, keyField) {
  Logger.log(`4. ${url} と同期開始`);
  const recordsFromCMS = getRecordsFromMicroCMS(url);
  Logger.log(`5. CMS既存 ${recordsFromCMS.length}件取得`);

  const cmsKeys   = recordsFromCMS.map(r => r[keyField]);
  const sheetKeys = recordsFromSheet.map(r => r[keyField]);

  const toAdd    = recordsFromSheet.filter(r => !cmsKeys.includes(r[keyField]));
  const toUpdate = recordsFromSheet.filter(r =>  cmsKeys.includes(r[keyField]));
  const toDelete = recordsFromCMS   .filter(r => !sheetKeys.includes(r[keyField]));

  Logger.log(`6. add:${toAdd.length} upd:${toUpdate.length} del:${toDelete.length}`);
  toAdd.forEach(r => addRecordToMicroCMS(url, r));
  toUpdate.forEach(r => updateRecordInMicroCMS(url, r));
  toDelete.forEach(r => deleteRecordFromMicroCMS(url, r.id));
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
  try {
    UrlFetchApp.fetch(`${url}/${record.id}`, opt);
    Logger.log(`9. 追加/上書き: ${record.id}`);
  } catch (err) {
    Logger.log(`10. 追加失敗: ${err.message}`);
  }
}

function updateRecordInMicroCMS(url, record) {
  const opt = {
    method : "PATCH",
    headers: { "Content-Type":"application/json", "X-MICROCMS-API-KEY": API_KEY },
    payload: JSON.stringify(record)
  };
  try {
    UrlFetchApp.fetch(`${url}/${record.id}`, opt);
    Logger.log(`11. 更新完了: ${record.id}`);
  } catch (err) {
    Logger.log(`12. 更新失敗: ${err.message}`);
  }
}

function deleteRecordFromMicroCMS(url, recordId) {
  const opt = { method:"DELETE", headers:{ "X-MICROCMS-API-KEY": API_KEY }};
  try {
    UrlFetchApp.fetch(`${url}/${recordId}`, opt);
    Logger.log(`13. 削除完了: ${recordId}`);
  } catch (err) {
    Logger.log(`14. 削除失敗: ${err.message}`);
  }
}
