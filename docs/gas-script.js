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
    } else {
      // JSON形式（予備）
      requestData = JSON.parse(e.postData.contents);
      console.log('JSON形式で受信データ:', requestData);
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

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      });

  } catch (error) {
    console.error('エラー:', error);

    const errorResponse = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };

    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('GAS endpoint is working')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
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
      // ヘッダー行を追加
      sheet.appendRow([
        'タイムスタンプ', 'フォーム種別', 'お名前', 'メールアドレス',
        '電話番号', 'お問い合わせ内容', 'お問い合わせ種別',
        '来店予約', '来店日', '来店時間', '選択されたペット'
      ]);
    }

    // データを行に追加
    const row = [
      new Date(),
      data.formType || '',
      data.name || '',
      data.email || '',
      data.phone || '',
      data.content || '',
      data.inquiryType || '',
      data.visitReservation || '',
      data.visitDate || '',
      data.visitTime || '',
      data.selectedPets || ''
    ];

    sheet.appendRow(row);
    console.log(`${sheetName}に保存完了`);
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