// Google Apps Script - Spreadsheet Handler Only
// このコードをGoogle Apps Scriptにコピーして使用してください

const SPREADSHEET_ID = '1FnIpk88kEEmanvuEEgKO3aqHpHtOVh6aXbTtEd_n8m4';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const formType = data.formType;
    
    // スプレッドシートに書き込み
    writeToSheet(formType, data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'スプレッドシートに保存されました' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({ 'Access-Control-Allow-Origin': '*' });
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'スプレッドシート保存エラー', error: error.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({ 'Access-Control-Allow-Origin': '*' });
  }
}

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

function writeToSheet(formType, data) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheetName;
  
  switch (formType) {
    case 'pet':
      sheetName = 'form-pet';
      break;
    case 'recruit':
      sheetName = 'form-recruit';
      break;
    case 'other':
      sheetName = 'form-others';
      break;
    default:
      throw new Error('Invalid form type');
  }
  
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    // ヘッダー行を追加
    addHeaders(sheet, formType);
  }
  
  // データを追加
  const row = createRowData(formType, data);
  sheet.appendRow(row);
}

function addHeaders(sheet, formType) {
  let headers = ['送信日時'];
  
  if (formType === 'pet') {
    headers = headers.concat([
      'お問い合わせ種別',
      'お名前',
      'メールアドレス',
      '電話番号',
      '来店予約',
      '来店日',
      '来店時間',
      '選択されたペット',
      'お問い合わせ内容'
    ]);
  } else if (formType === 'recruit') {
    headers = headers.concat([
      'お問い合わせ種別',
      'お名前',
      'メールアドレス',
      '電話番号',
      'お問い合わせ内容'
    ]);
  } else if (formType === 'other') {
    headers = headers.concat([
      'お名前',
      'メールアドレス',
      '電話番号',
      'お問い合わせ内容'
    ]);
  }
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function createRowData(formType, data) {
  const timestamp = new Date().toLocaleString('ja-JP');
  let row = [timestamp];
  
  if (formType === 'pet') {
    row = row.concat([
      data.inquiryType || '',
      data.name || '',
      data.email || '',
      data.phone || '',
      data.visitReservation ? '予約あり' : '予約なし',
      data.visitDate || '',
      data.visitTime || '',
      data.selectedPets || '',
      data.content || ''
    ]);
  } else if (formType === 'recruit') {
    row = row.concat([
      data.inquiryType || '',
      data.name || '',
      data.email || '',
      data.phone || '',
      data.content || ''
    ]);
  } else if (formType === 'other') {
    row = row.concat([
      data.name || '',
      data.email || '',
      data.phone || '',
      data.content || ''
    ]);
  }
  
  return row;
}

// メール送信機能は削除（SendGrid直接送信のため）