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
    const spreadsheetId = '10fNuDyJlgCXK1uHSK9Gv9t7d6q7AO4hABMmu-DXIwlU';
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
        data.phone ? `'${data.phone}` : '',
        data.content || ''
      ];
    } else {
      // form-pet, form-job用（10列）
      row = [
        new Date().toLocaleString('ja-JP'),
        data.inquiryType || '',
        data.name || '',
        data.email || '',
        data.phone ? `'${data.phone}` : '',
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
    const to = 'info@cattleya-pet.com';
    const subject = `【カトレア】${getFormTypeName(data.formType)}のお問い合わせ - ${data.name}様`;
    const body = createEmailBody(data);

    GmailApp.sendEmail(to, subject, body, {
      name: 'カトレア'
    });
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

    const to = data.email;
    const subject = `【カトレア】お問い合わせを受け付けました`;
    const body = createAutoReplyEmailBody(data);

    GmailApp.sendEmail(to, subject, body, {
      name: 'カトレア'
    });
    console.log('自動返信メール送信完了:', data.email);

  } catch (error) {
    console.error('自動返信メール送信エラー:', error);
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
    body += `選択されたペット: ${convertGenderSymbol(data.selectedPets || '')}\n`;
  } else if (data.formType === 'job') {
    body += `お問い合わせ種別: ${data.inquiryType || ''}\n`;
  }

  body += `お問い合わせ内容: ${data.content || ''}\n`;

  return body;
}

function convertGenderSymbol(petText) {
  if (!petText) return petText;
  return petText.replace(/♂/g, '男の子').replace(/♀/g, '女の子');
}

function createAutoReplyEmailBody(data) {
  let body = `${data.name || 'お客様'}様へ\n\n`;
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
      body += `選択されたペット: ${convertGenderSymbol(data.selectedPets.replace(/,\n/g, ', '))}\n`;
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
  body += `Email: info@cattleya-pet.com\n`;
  body += `Website: https://cattleya-pet.com\n`;
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return body;
}