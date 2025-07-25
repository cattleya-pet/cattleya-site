// Contact form JavaScript
console.log('EXTERNAL SCRIPT LOADED: contact-form.js');

document.addEventListener('DOMContentLoaded', function() {
  console.log('=== CONTACT FORM SCRIPT LOADED ===');
  console.log('Current hostname:', window.location.hostname);
  console.log('Current URL:', window.location.href);
  
  // 基本的なフォーム送信テスト
  const forms = document.querySelectorAll('.contact-form');
  console.log('Found forms:', forms.length);
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      console.log('=== FORM SUBMIT EVENT TRIGGERED ===');
      e.preventDefault();
      alert('フォーム送信をキャッチしました（外部スクリプト）');
    });
  });
});