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

    // SendGrid設定確認を追加
    const sendGridStatus = checkSendGridStatus();
    logToSheet('SendGrid設定状況', sendGridStatus);

    // メール送信
    sendNotificationEmail(requestData);
    
    // お問い合わせ者への自動返信メール送信
    sendAutoReplyEmail(requestData);

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
      if (sheetName === 'form-others') {
        // form-othersはお問い合わせ種別なし
        sheet.appendRow([
          'タイムスタンプ', 'お名前', 'メールアドレス', '電話番号', 'お問い合わせ内容'
        ]);
      } else {
        // form-pet, form-job用
        sheet.appendRow([
          'タイムスタンプ', 'お問い合わせ種別', 'お名前', 'メールアドレス', '電話番号',
          'お問い合わせ内容', '来店予約',
          '来店日', '来店時間', '選択されたペット'
        ]);
      }
    } else {
      // 既存シートの場合は1行目が項目名として存在することを前提とする
      // ヘッダー行の追加は行わない
    }

    // データを行に追加 - フォームタイプに応じて列構成を変更
    let row;
    if (data.formType === 'other') {
      // form-othersはお問い合わせ種別なし（5列）
      row = [
        new Date().toLocaleString('ja-JP'),
        data.name || '',
        data.email || '',
        data.phone || '',
        data.content || ''
      ];
    } else {
      // form-pet, form-job用（10列）
      row = [
        new Date().toLocaleString('ja-JP'),
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
    }

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
    const properties = PropertiesService.getScriptProperties();
    const to = properties.getProperty('ADMIN_EMAIL') || 'naocreate52@gmail.com';
    const from = properties.getProperty('SENDGRID_FROM_EMAIL') || 'contact@naocreate.net';
    const subject = `【カトレア】${getFormTypeName(data.formType)}のお問い合わせ - ${data.name}様`;
    const body = createEmailBody(data);

    // SendGridを使用したメール送信
    sendEmailViaSendGrid(to, from, subject, body);
    console.log('通知メール送信完了');

  } catch (error) {
    console.error('メール送信エラー:', error);
  }
}

function sendAutoReplyEmail(data) {
  try {
    if (!data.email) {
      console.log('お問い合わせ者のメールアドレスが空のため、自動返信をスキップします');
      return;
    }

    const properties = PropertiesService.getScriptProperties();
    const to = data.email;
    const from = properties.getProperty('SENDGRID_FROM_EMAIL') || 'contact@naocreate.net';
    const subject = `【カトレア】お問い合わせを受け付けました`;
    const body = createAutoReplyEmailBody(data);

    // SendGridを使用したメール送信
    sendEmailViaSendGrid(to, from, subject, body);
    console.log('自動返信メール送信完了:', data.email);

  } catch (error) {
    console.error('自動返信メール送信エラー:', error);
  }
}

function sendEmailViaSendGrid(to, from, subject, body) {
  // SendGrid API設定の確認
  const SENDGRID_API_KEY = PropertiesService.getScriptProperties().getProperty('SENDGRID_API_KEY');
  
  console.log('=== SendGrid送信開始 ===');
  console.log('To:', to);
  console.log('From:', from);
  console.log('API Key設定:', SENDGRID_API_KEY ? '設定済み' : '未設定');
  
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API キーが設定されていません - GmailAppフォールバック実行');
    // フォールバック：GmailAppを使用（但し送信者はGoogleアカウントになる）
    GmailApp.sendEmail(to, subject, body, {
      name: 'カトレア'
    });
    return;
  }

  const payload = {
    personalizations: [{
      to: [{ email: to }],
      subject: subject
    }],
    from: { email: from, name: 'カトレア' },
    content: [{
      type: 'text/plain',
      value: body
    }]
  };

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  };

  try {
    console.log('SendGrid API呼び出し実行中...');
    const response = UrlFetchApp.fetch('https://api.sendgrid.com/v3/mail/send', options);
    const statusCode = response.getResponseCode();
    
    console.log('SendGrid Response Status:', statusCode);
    
    if (statusCode === 202) {
      console.log('SendGrid送信成功！');
      logToSheet('SendGrid送信', { status: '成功', to: to, from: from, statusCode: statusCode });
    } else {
      const errorText = response.getContentText();
      console.error('SendGrid送信失敗:', errorText);
      console.log('GmailAppフォールバック実行');
      logToSheet('SendGrid送信', { status: '失敗', to: to, from: from, statusCode: statusCode, error: errorText });
      // フォールバック：GmailAppを使用
      GmailApp.sendEmail(to, subject, body, {
        name: 'カトレア'
      });
      logToSheet('Gmail送信', { status: 'フォールバック実行', to: to });
    }
  } catch (error) {
    const errorMessage = error.toString();
    console.error('SendGrid API呼び出しエラー:', errorMessage);
    console.log('GmailAppフォールバック実行');
    logToSheet('SendGrid送信', { status: 'API呼び出しエラー', to: to, from: from, error: errorMessage });
    // フォールバック：GmailAppを使用
    GmailApp.sendEmail(to, subject, body, {
      name: 'カトレア'
    });
    logToSheet('Gmail送信', { status: 'フォールバック実行', to: to });
  }
  
  console.log('=== SendGrid送信終了 ===');
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

function createAutoReplyEmailBody(data) {
  let body = `${data.name || 'お客様'}へ\n\n`;
  body += `この度は、カトレアにお問い合わせいただき、誠にありがとうございます。\n`;
  body += `以下の内容でお問い合わせを受け付けいたしました。\n\n`;
  
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  body += `【お問い合わせ内容】\n`;
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  
  body += `受付日時: ${new Date().toLocaleString('ja-JP')}\n`;
  body += `フォーム種別: ${getFormTypeName(data.formType)}\n`;
  body += `お名前: ${data.name || ''}\n`;
  body += `メールアドレス: ${data.email || ''}\n`;
  body += `電話番号: ${data.phone || ''}\n`;

  if (data.formType === 'pet') {
    body += `お問い合わせ種別: ${data.inquiryType || ''}\n`;
    if (data.visitReservation === 'true') {
      body += `来店予約: 予約あり\n`;
      body += `来店日: ${data.visitDate || ''}\n`;
      body += `来店時間: ${data.visitTime || ''}\n`;
    }
    if (data.selectedPets) {
      body += `選択されたペット: ${data.selectedPets.replace(/,\n/g, ', ')}\n`;
    }
  } else if (data.formType === 'job') {
    body += `お問い合わせ種別: ${data.inquiryType || ''}\n`;
  }

  body += `お問い合わせ内容:\n${data.content || ''}\n\n`;
  
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  body += `担当者より確認次第、お返事させていただきます。\n`;
  body += `しばらくお待ちください。\n\n`;
  body += `※このメールは自動送信されています。\n`;
  body += `※このメールに返信いただいても対応できませんので、ご了承ください。\n\n`;
  
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  body += `カトレア\n`;
  const properties = PropertiesService.getScriptProperties();
  const contactEmail = properties.getProperty('SENDGRID_FROM_EMAIL') || 'contact@naocreate.net';
  body += `Email: ${contactEmail}\n`;
  body += `Website: https://cattleya.naocreate.net\n`;
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return body;
}

// SendGrid設定用関数（初回のみ実行）
function setupSendGridConfig() {
  const properties = PropertiesService.getScriptProperties();
  
  properties.setProperties({
    'SENDGRID_API_KEY': 'SG.5ha81TXBQAClOaBQwlSOzA',
    'SENDGRID_FROM_EMAIL': 'contact@naocreate.net',
    'ADMIN_EMAIL': 'naocreate52@gmail.com'
  });
  
  console.log('SendGrid設定完了');
}

// 設定確認用関数
function checkSendGridConfig() {
  const properties = PropertiesService.getScriptProperties();
  console.log('SENDGRID_API_KEY:', properties.getProperty('SENDGRID_API_KEY') ? '設定済み' : '未設定');
  console.log('SENDGRID_FROM_EMAIL:', properties.getProperty('SENDGRID_FROM_EMAIL'));
  console.log('ADMIN_EMAIL:', properties.getProperty('ADMIN_EMAIL'));
}

// 現在の設定を詳細確認する関数
function checkCurrentSettings() {
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty('SENDGRID_API_KEY');
  console.log('現在のAPIキー:', apiKey);
  console.log('期待するAPIキー: SG.5ha81TXBQAClOaBQwlSOzA');
  console.log('一致:', apiKey === 'SG.5ha81TXBQAClOaBQwlSOzA');
}

// APIキーを強制更新する関数
function forceUpdateApiKey() {
  PropertiesService.getScriptProperties().setProperty('SENDGRID_API_KEY', 'SG.5ha81TXBQAClOaBQwlSOzA');
  console.log('APIキー強制更新完了');
}

// SendGrid設定状況を返す関数
function checkSendGridStatus() {
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty('SENDGRID_API_KEY');
  const fromEmail = properties.getProperty('SENDGRID_FROM_EMAIL');
  const adminEmail = properties.getProperty('ADMIN_EMAIL');
  
  return {
    apiKeySet: apiKey ? '設定済み' : '未設定',
    fromEmail: fromEmail || 'なし',
    adminEmail: adminEmail || 'なし',
    timestamp: new Date().toLocaleString('ja-JP')
  };
}

// スプレッドシートにログを記録する関数
function logToSheet(action, data) {
  try {
    const spreadsheetId = '1FnIpk88kEEmanvuEEgKO3aqHpHtOVh6aXbTtEd_n8m4';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // デバッグシートを取得（存在しない場合は作成）
    let debugSheet = spreadsheet.getSheetByName('debug-log');
    if (!debugSheet) {
      debugSheet = spreadsheet.insertSheet('debug-log');
      debugSheet.appendRow(['タイムスタンプ', 'アクション', 'データ']);
    }
    
    const logData = [
      new Date().toLocaleString('ja-JP'),
      action,
      JSON.stringify(data)
    ];
    
    debugSheet.appendRow(logData);
  } catch (error) {
    console.error('ログ記録エラー:', error);
  }
}