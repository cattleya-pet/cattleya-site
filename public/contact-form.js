// Contact form JavaScript
console.log('EXTERNAL SCRIPT LOADED: contact-form.js');

document.addEventListener('DOMContentLoaded', function() {
  console.log('=== CONTACT FORM SCRIPT LOADED ===');
  console.log('Current hostname:', window.location.hostname);
  console.log('Current URL:', window.location.href);
  
  // 環境判定（localhost以外はPreview/本番環境として扱う）
  const isProduction = !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1';
  console.log('Environment check - isProduction:', isProduction, 'hostname:', window.location.hostname);
  
  // GAS URL (正しいURL)
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbya5IriFXfHSujaDP8HRYXThSDTB4szfduY9BA-Fk7Pv4YrOh1WVNSWqpRlJifHg04Mpw/exec';
  console.log('Full GAS URL:', GAS_URL);
  console.log('GAS URL length:', GAS_URL.length);
  
  // iframe経由でのGAS送信（CORS回避）
  async function submitViaIframe(data) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Sending to GAS via iframe:', data);
        
        // 隠しiframeを作成
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'gas-submit-frame';
        document.body.appendChild(iframe);
        
        // 隠しformを作成
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = GAS_URL;
        form.target = 'gas-submit-frame';
        form.style.display = 'none';
        
        // データをフォームフィールドとして追加
        Object.keys(data).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = data[key];
          form.appendChild(input);
          console.log(`Form field added: ${key} = ${data[key]}`);
        });
        
        console.log('Form action URL:', form.action);
        console.log('Form method:', form.method);
        console.log('Form target:', form.target);
        
        document.body.appendChild(form);
        
        // iframe読み込み完了を待機
        iframe.onload = () => {
          // iframeの内容を確認（デバッグ用）
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const responseText = iframeDoc.body ? iframeDoc.body.innerText : 'No response';
            console.log('GAS iframe response:', responseText);
          } catch (e) {
            console.log('Could not read iframe response (CORS):', e.message);
          }
          
          setTimeout(() => {
            // クリーンアップ
            document.body.removeChild(iframe);
            document.body.removeChild(form);
            resolve();
          }, 2000); // 2秒に延長してレスポンス確認時間を増やす
        };
        
        iframe.onerror = () => {
          // クリーンアップ
          document.body.removeChild(iframe);
          document.body.removeChild(form);
          reject(new Error('iframe送信エラー'));
        };
        
        // フォーム送信
        form.submit();
        
      } catch (error) {
        console.error('submitViaIframe error:', error);
        reject(error);
      }
    });
  }
  
  // フォームデータを整理する関数
  function prepareFormData(formType, formData) {
    const data = {
      formType: formType,
      name: formData.get('name') || '',
      email: formData.get('email') || '',
      phone: formData.get('phone') || '',
      content: formData.get('content') || ''
    };
    
    if (formType === 'pet') {
      data.inquiryType = formData.get('inquiry-type') || '';
      data.visitReservation = formData.get('visit-reservation') === '1';
      data.visitDate = formData.get('visit-date') || '';
      data.visitTime = formData.get('visit-time') || '';
      
      // 選択されたペットを取得（複数選択対応）
      const selectedPets = formData.getAll('selected-pets');
      data.selectedPets = selectedPets.join(', ');
    } else if (formType === 'job') {
      data.inquiryType = formData.get('inquiry-type') || '';
    }
    
    return data;
  }
  
  // フォーム送信処理
  const forms = document.querySelectorAll('.contact-form');
  console.log('Found forms:', forms.length);
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      console.log('=== FORM SUBMIT EVENT TRIGGERED ===');
      e.preventDefault();
      
      const formData = new FormData(this);
      const formType = this.getAttribute('data-form');
      console.log('Form type:', formType);
      
      // プライバシーポリシーの同意チェック
      const privacyAgreement = formData.get('privacy-agreement');
      
      if (!privacyAgreement) {
        // 警告メッセージを表示
        const errorElement = document.getElementById(`privacy-error-${formType}`);
        if (errorElement) {
          errorElement.style.display = 'block';
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      } else {
        // チェックされている場合は警告メッセージを隠す
        const errorElement = document.getElementById(`privacy-error-${formType}`);
        if (errorElement) {
          errorElement.style.display = 'none';
        }
      }
      
      // 送信ボタンを無効化
      const submitButton = this.querySelector('.submit-button');
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = '送信中...';
      
      // フォームデータを整理
      const data = prepareFormData(formType, formData);
      console.log('フォーム送信データ:', data);
      
      if (isProduction) {
        // Preview/本番環境：URLSearchParams形式で送信
        console.log('Sending to GAS with URLSearchParams...');
        
        const params = new URLSearchParams();
        Object.keys(data).forEach(key => {
          params.append(key, data[key]);
        });
        
        fetch(GAS_URL, {
          method: 'POST',
          body: params,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          mode: 'no-cors'
        })
        .then(() => {
          console.log('URLSearchParams submission completed');
          alert('お問い合わせを受け付けました。ありがとうございます。');
          form.reset();
        })
        .catch(error => {
          console.error('URLSearchParams submission error:', error);
          alert('送信に失敗しました。もう一度お試しください。');
        })
        .finally(() => {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        });
      } else {
        // ローカル開発環境：テスト用処理
        alert('開発中：フォーム送信を受け付けました。\n（GAS連携は本番環境で動作します）');
        form.reset();
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  });
});