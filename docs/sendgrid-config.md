# SendGrid設定情報

## 環境変数（.env.example より）

```
SENDGRID_API_KEY=SG.kke-6pqt17yw1rdb
SENDGRID_FROM_EMAIL=contact@naocreate.net
ADMIN_EMAIL=naocreate52@gmail.com
```

## Google Apps Script での設定方法

Google Apps Script エディタで以下の関数を実行してください：

```javascript
function setupSendGridConfig() {
  const properties = PropertiesService.getScriptProperties();
  
  // SendGrid設定
  properties.setProperties({
    'SENDGRID_API_KEY': 'SG.kke-6pqt17yw1rdb',
    'SENDGRID_FROM_EMAIL': 'contact@naocreate.net',
    'ADMIN_EMAIL': 'naocreate52@gmail.com'
  });
  
  console.log('SendGrid設定完了');
}

// 設定確認用
function checkSendGridConfig() {
  const properties = PropertiesService.getScriptProperties();
  console.log('SENDGRID_API_KEY:', properties.getProperty('SENDGRID_API_KEY') ? '設定済み' : '未設定');
  console.log('SENDGRID_FROM_EMAIL:', properties.getProperty('SENDGRID_FROM_EMAIL'));
  console.log('ADMIN_EMAIL:', properties.getProperty('ADMIN_EMAIL'));
}
```

## 実行手順

1. Google Apps Script エディタを開く
2. 上記の `setupSendGridConfig` 関数をコピー＆ペースト
3. 関数を選択して「実行」ボタンをクリック
4. `checkSendGridConfig` で設定を確認