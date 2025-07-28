function doPost(e) {
  try {
    // フォーム形式のデータを受信（URLSearchParams形式）
    let requestData;
    
    // Content-Typeを確認してデータ形式を判定
    const contentType = e.postData.type;
    console.log('Content-Type:', contentType);
    console.log('Raw postData:', e.postData);
    
    if (contentType === 'application/x-www-form-urlencoded') {
      // フォーム形式のデータを解析
      const params = e.parameter; // GASが自動的にパースしたパラメータ
      requestData = params;
      console.log('フォーム形式で受信データ:', requestData);
    } else if (contentType === 'application/json') {
      // JSON形式（予備）
      requestData = JSON.parse(e.postData.contents);
      console.log('JSON形式で受信データ:', requestData);
    } else {
      // その他の形式の場合はパラメータを使用
      requestData = e.parameter;
      console.log('その他形式で受信データ:', requestData);
    }

    // スプレッドシートにデータを保存
    const result = saveToSheet(requestData);

    // メール送信
    sendNotificationEmail(requestData);

    // 成功レスポンス（CORSヘッダー付き）
    const response = {
      success: true,
      message: 'データが正常に処理されました',
      timestamp: new Date().toISOString()
    };

    // CORSヘッダー付きでレスポンス作成
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('エラー:', error);

    const errorResponse = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };

    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('GAS endpoint is working')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doOptions(e) {
  return ContentService.createTextOutput('');
}

function saveToSheet(data) {
  try {
    const spreadsheetId = '1FnIpk88kEEmanvuEEgKO3aqHpHtOVh6aXbTtEd_n8m4';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    // フォームタイプに応じてシートを選択
    let sheetName;
    switch(data.formType) {
      case 'pet':
        sheetName = 'form-pet';
        break;
      case 'job':
        sheetName = 'form-job';
        break;
      case 'other':
        sheetName = 'form-others';
        break;
      default:
        sheetName = 'form-pet'; // デフォルト
    }

    // 指定されたシートを取得（存在しない場合は作成）
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      // 新規シート作成時のみヘッダー行を追加
      sheet.appendRow([
        'タイムスタンプ', 'お問い合わせ種別', 'お名前', 'メールアドレス', '電話番号',
        'お問い合わせ内容', '来店予約',
        '来店日', '来店時間', '選択されたペット'
      ]);
    } else {
      // 既存シートの場合は1行目が項目名として存在することを前提とする
      // ヘッダー行の追加は行わない
    }

    // データを行に追加 - job/othersフォームでは来店予約関連は空にする
    const row = [
      new Date(),
      data.inquiryType || '',
      data.name || '',
      data.email || '',
      data.phone || '',
      data.content || '',
      data.formType === 'pet' ? (data.visitReservation === 'true' ? '予約あり' : '予約なし') : '',
      data.formType === 'pet' ? (data.visitDate || '') : '',
      data.formType === 'pet' ? (data.visitTime || '') : '',
      data.formType === 'pet' ? (data.selectedPets ? data.selectedPets.replace(/, /g, ',\n') : '') : ''
    ];

    // 最新データを2行目（項目欄の直下）に挿入し、既存データを下にスライド
    sheet.insertRowAfter(1); // 1行目の後に新しい行を挿入
    sheet.getRange(2, 1, 1, row.length).setValues([row]); // 2行目にデータを設定
    
    console.log(`${sheetName}の2行目に保存完了（既存データは下にスライド）`);
    return { success: true };

  } catch (error) {
    console.error('スプレッドシート保存エラー:', error);
    throw error;
  }
}

function sendNotificationEmail(data) {
  try {
    const to = 'naocreate52@gmail.com';
    const subject = `【カトレア】${getFormTypeName(data.formType)}のお問い合わせ - ${data.name}様`;
    const body = createEmailBody(data);

    GmailApp.sendEmail(to, subject, body);
    console.log('通知メール送信完了');

  } catch (error) {
    console.error('メール送信エラー:', error);
  }
}

function getFormTypeName(formType) {
  const typeMap = {
    'pet': 'ペットについて',
    'job': '求人について',
    'other': 'その他'
  };
  return typeMap[formType] || 'お問い合わせ';
}

function createEmailBody(data) {
  let body = `カトレアのお問い合わせフォームから新しいお問い合わせが届きました。\n\n`;
  body += `送信日時: ${new Date().toLocaleString('ja-JP')}\n`;
  body += `フォーム種別: ${getFormTypeName(data.formType)}\n\n`;

  body += `お名前: ${data.name || ''}\n`;
  body += `メールアドレス: ${data.email || ''}\n`;
  body += `電話番号: ${data.phone || ''}\n`;

  if (data.formType === 'pet') {
    body += `お問い合わせ種別: ${data.inquiryType || ''}\n`;
    body += `来店予約: ${data.visitReservation ? '予約あり' : '予約なし'}\n`;
    if (data.visitReservation) {
      body += `来店日: ${data.visitDate || ''}\n`;
      body += `来店時間: ${data.visitTime || ''}\n`;
    }
    body += `選択されたペット: ${data.selectedPets || ''}\n`;
  } else if (data.formType === 'job') {
    body += `お問い合わせ種別: ${data.inquiryType || ''}\n`;
  }

  body += `お問い合わせ内容: ${data.content || ''}\n`;

  return body;
}