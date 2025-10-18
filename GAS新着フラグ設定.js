/**
 * 【目的】
 *  シート「WK」で各店舗ごとに仕入れ日が新しい順で
 *  “最大3匹相当”をTRUEにする（同日が複数匹いれば全員TRUE）。
 *  ただし…
 *   - 1番目（最も新しい日）だけで3匹以上いれば、その日だけTRUEにして終了
 *   - 2番目（次に新しい日）だけで3匹以上いれば、1番目と2番目をTRUEにして終了
 *   - 上記に当てはまらない場合は3番目（3つ目に新しい日）までTRUE（同日全員）
 *
 * 【仕様】
 *  - 対象シート：WK
 *  - データ範囲：6行目〜A列の最終値行
 *  - 店舗（O列）：新宿 / 池袋 / 渋谷
 *  - 仕入れ日（W列）：Date または解釈可能文字列（同日判定は0時丸め）
 *  - 新着フラグ（Q列）：TRUE/FALSE を一括更新
 */
function updateNewArrivalFlags() {
  // =========================
  // No.0001 定数定義
  // =========================
  const SS = SpreadsheetApp.getActiveSpreadsheet();
  const SHEET_NAME = 'WK';

  // 列インデックス（1始まり）
  const COL_A_KEY   = 1;   // A: 最終行の基準
  const COL_O_STORE = 15;  // O: 店舗名
  const COL_Q_FLAG  = 17;  // Q: 新着フラグ
  const COL_W_DATE  = 23;  // W: 仕入れ日

  const START_ROW = 6; // データ開始行
  const TARGET_STORES = ['新宿店', '池袋店', '渋谷店'];

  // =========================
  // No.0002 シート/範囲取得
  // =========================
  const sheet = SS.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('対象シートが見つかりません: ' + SHEET_NAME);

  // A列の一番下から上に辿って最終行判定
  const lastRow = sheet.getRange(sheet.getMaxRows(), COL_A_KEY, 1, 1)
    .getNextDataCell(SpreadsheetApp.Direction.UP).getRow();

  if (lastRow < START_ROW) {
    console.log('No.0002-1 データなし（5行目まで）。処理終了');
    // ★ 念のためQ列を全クリア（過去の残骸を消す）
    const maxRows = sheet.getMaxRows();
    if (maxRows >= START_ROW) {
      sheet.getRange(START_ROW, COL_Q_FLAG, maxRows - START_ROW + 1, 1).clearContent();
    }
    return;
  }

  const numRows = lastRow - START_ROW + 1;
  const lastCol = Math.max(COL_O_STORE, COL_Q_FLAG, COL_W_DATE);
  const values = sheet.getRange(START_ROW, 1, numRows, lastCol).getValues();

  console.log(`No.0002-2 取得行数=${numRows}, 最終行(A列基準)=${lastRow}`);

  // =========================
  // ★ No.0002-3 Q列の初期化（残骸クリア）
  //  最下段まで一旦空にしてから今回分だけ書き戻す
  // =========================
  const maxRows = sheet.getMaxRows();
  sheet.getRange(START_ROW, COL_Q_FLAG, maxRows - START_ROW + 1, 1).clearContent();
  console.log('No.0002-3 Q列初期化完了');

  // =========================
  // No.0003 行データ整形
  // =========================
  const rows = values.map((row, i) => {
    const store = (typeof row[COL_O_STORE - 1] === 'string') ? row[COL_O_STORE - 1].trim() : '';
    const rawDate = row[COL_W_DATE - 1];

    let date = null;
    if (rawDate instanceof Date) {
      date = rawDate;
    } else if (typeof rawDate === 'string' && rawDate.trim() !== '') {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) date = parsed;
    }

    return {
      rowIndex: START_ROW + i,
      store,
      date,        // Date or null
      dayMillis: (date instanceof Date) ? (() => { const d = new Date(date); d.setHours(0,0,0,0); return d.getTime(); })() : null,
      flag: false  // 初期値
    };
  });

  // =========================
  // No.0004 店舗ごとに「新しい順3匹相当」をTRUE
  // =========================
  TARGET_STORES.forEach(storeName => {
    const list = rows.filter(r => r.store === storeName && r.dayMillis !== null);
    if (list.length === 0) {
      console.log(`No.0004-0 店舗「${storeName}」該当なし`);
      return;
    }

    // 日別件数を作成
    const counts = new Map(); // dayMillis -> count
    list.forEach(r => counts.set(r.dayMillis, (counts.get(r.dayMillis) || 0) + 1));

    // 新しい順にソート
    const daysDesc = Array.from(counts.keys()).sort((a, b) => b - a);

    if (daysDesc.length === 0) {
      console.log(`No.0004-1 店舗「${storeName}」日付なし`);
      return;
    }

    // 選定ロジック
    const pickDays = []; // TRUEにするdayMillisの配列（最大3つ）
    // 1番目
    const d1 = daysDesc[0];
    if (d1 !== undefined) {
      pickDays.push(d1);
      if (counts.get(d1) >= 3) {
        applyFlagsForDays(storeName, rows, pickDays);
        logPick(storeName, pickDays, counts);
        return;
      }
    }
    // 2番目
    const d2 = daysDesc[1];
    if (d2 !== undefined) {
      pickDays.push(d2);
      if (counts.get(d2) >= 3) {
        applyFlagsForDays(storeName, rows, pickDays);
        logPick(storeName, pickDays, counts);
        return;
      }
    }
    // 3番目（上記に当てはまらない場合）
    const d3 = daysDesc[2];
    if (d3 !== undefined) {
      pickDays.push(d3);
    }

    applyFlagsForDays(storeName, rows, pickDays);
    logPick(storeName, pickDays, counts);
  });

  // =========================
  // No.0005 書き込み（Q列だけ更新）
  // =========================
  const out = rows.map(r => [r.flag === true]); // 明示的にBoolean化
  sheet.getRange(START_ROW, COL_Q_FLAG, numRows, 1).setValues(out);
  console.log('No.0005-1 新着フラグ（最新順ルール）更新完了');

  // ★ 念のため：最終行より下のQ列を再クリア（保険）
  if (lastRow < maxRows) {
    sheet.getRange(lastRow + 1, COL_Q_FLAG, maxRows - lastRow, 1).clearContent();
    console.log(`No.0005-2 Q列の最終行(${lastRow})以降をクリア`);
  }

  // ---- 内部ヘルパー ----
  function applyFlagsForDays(storeName, rowsAll, dayList) {
    const setDays = new Set(dayList);
    rowsAll.forEach(r => {
      if (r.store === storeName && r.dayMillis !== null && setDays.has(r.dayMillis)) {
        r.flag = true; // 同日全員TRUE
      }
    });
  }

  function logPick(storeName, dayList, cntMap) {
    const tz = Session.getScriptTimeZone();
    const labels = dayList.map(ms => Utilities.formatDate(new Date(ms), tz, 'yyyy-MM-dd') + `(${cntMap.get(ms)}匹)`);
    console.log(`No.0004-9 店舗「${storeName}」 TRUE日付[新→旧]: ${labels.join(', ')}`);
  }
}
