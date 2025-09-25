# 本番サイト移行手順書
## Wix → Vercel DNS切り替え方式

**プロジェクト**: Cattleya ペットサイトリニューアル  
**移行方式**: DNS切り替え（ドメイン契約はWixのまま継続）  
**作成日**: 2025-09-10  

---

## 事前準備

### 1. 移行前チェックリスト
- [ ] Vercelプレビューサイトの動作確認完了
- [ ] microCMSの本番データ投入完了
- [ ] SSL証明書の自動取得確認
- [ ] サイトマップ・robots.txt確認
- [ ] Google Analytics、Search Console設定確認

### 2. 必要な情報の収集
- [ ] 現在のWixのDNSレコード一覧をスクリーンショット保存
- [ ] Google Workspaceメール設定の確認（MXレコード等）
- [ ] VercelプロジェクトのURL確認

---

## 移行手順

### Step 1: Vercelでドメイン追加

1. **Vercelダッシュボードにログイン**
   - https://vercel.com/dashboard

2. **プロジェクト選択**
   - Cattleyaプロジェクトを選択

3. **Settings → Domains**
   - 「Add Domain」をクリック
   - `cattleya-pet.com` を入力
   - 「Add」をクリック

4. **DNSレコード情報の取得**
   - Vercelが表示するDNSレコード情報をメモ
   ```
   例:
   A Record: cattleya-pet.com → XXX.XXX.XXX.XXX
   CNAME: www.cattleya-pet.com → cname.vercel-dns.com
   ```

### Step 2: WixでDNS設定変更

1. **Wix管理画面にログイン**
   - https://manage.wix.com/

2. **ドメイン設定へ移動**
   - 設定 → ドメイン → DNSレコード

3. **既存DNSレコードのバックアップ**
   - 現在の全DNSレコードをスクリーンショット保存
   - 特にMXレコード（メール設定）は必須

4. **既存レコードの削除**
   - A Record (cattleya-pet.com) 3つを全て削除
   - CNAME (www.cattleya-pet.com) を削除
   - **注意**: MXレコード、TXTレコードは削除しない

5. **新しいDNSレコード追加**
   - VercelのStep 1で取得した情報を設定
   ```
   A Record: 
   - ホスト名: cattleya-pet.com
   - 値: VercelのIPアドレス
   
   CNAME:
   - ホスト名: www.cattleya-pet.com  
   - 値: VercelのCNAME値
   ```

### Step 3: 動作確認

1. **DNS伝播待ち**
   - 設定後、DNS伝播に数分〜24時間要する場合がある
   - TTL設定により変動

2. **確認コマンド**
   ```bash
   # DNS伝播確認
   nslookup cattleya-pet.com
   nslookup www.cattleya-pet.com
   
   # または
   dig cattleya-pet.com
   dig www.cattleya-pet.com
   ```

3. **ブラウザ確認**
   - https://cattleya-pet.com
   - https://www.cattleya-pet.com
   - 各主要ページの動作確認

4. **SSL証明書確認**
   - ブラウザのアドレスバーで鍵マーク確認
   - Vercelが自動でSSL証明書を発行することを確認

### Step 4: メール機能確認

1. **Google Workspaceメール確認**
   - MXレコードが削除されていないことを確認
   - 既存のビジネスメールアカウントの送受信テスト

2. **問題がある場合**
   - WixのDNS設定でMXレコードを再確認
   - 必要に応じてGoogle Workspaceの設定確認

---

## ロールバック手順

万が一問題が発生した場合の緊急ロールバック手順：

1. **WixのDNS設定を元に戻す**
   - 事前保存したスクリーンショットを参照
   - 元のAレコード、CNAMEレコードを復旧

2. **元のDNSレコード（参考）**
   ```
   A Record:
   - cattleya-pet.com → 185.230.63.171
   - cattleya-pet.com → 185.230.63.186  
   - cattleya-pet.com → 185.230.63.107
   
   CNAME:
   - www.cattleya-pet.com → cdn1.wixdns.net
   ```

---

## 移行後の確認事項

### 必須チェック項目
- [ ] ホームページ表示確認
- [ ] 全主要ページの表示確認
- [ ] ペット検索機能の動作確認
- [ ] お問い合わせフォーム動作確認
- [ ] モバイル表示確認
- [ ] SEO設定（メタタグ、構造化データ）確認
- [ ] Google Analytics計測確認
- [ ] Google Search Console確認

### パフォーマンス確認
- [ ] ページ読み込み速度確認
- [ ] Core Web Vitals確認
- [ ] 画像最適化確認

---

## 注意事項

1. **作業タイミング**
   - アクセスが少ない時間帯（深夜など）に実施推奨
   - 事前にメンテナンス告知を実施

2. **DNS伝播について**
   - 地域・プロバイダにより伝播時間が異なる
   - 完全な切り替えまで最大24時間程度要する場合がある

3. **キャッシュクリア**
   - ブラウザキャッシュのクリア必須
   - CDNキャッシュの考慮

4. **モニタリング**
   - 切り替え後24-48時間はアクセス状況を監視
   - エラーログの確認

---

## 緊急連絡先・参考情報

- **Vercelサポート**: https://vercel.com/help
- **Wixサポート**: Wix管理画面内のヘルプ
- **DNS伝播確認ツール**: https://whatsmydns.net/
- **プロジェクト担当者**: [担当者名・連絡先]

---

## 移行完了後の作業

1. **Wix契約の見直し・コスト最適化**
   - サイト機能は不要になるため、プランダウングレード検討
   
   **現在**: プレミアムプラン（パーソナル）1,350円/月
   **検討対象**: ドメイン接続プラン 750円/月
   **削減効果**: 月600円、年7,200円のコスト削減可能性
   
   **重要な確認事項**:
   - 最安プランでDNS管理機能が利用できるかWixサポートに要確認
   - Google Workspaceメール（13名分）は別契約のため継続利用可能
   - MXレコード設定ができれば問題なし
   
   **手順**:
   - Wixサポートにプランダウングレード時の機能制限を確認
   - DNS管理・MXレコード設定が可能な最安プランを特定
   - 問題なければプラン変更実施
   
   **将来的検討事項**:
   - ドメイン移管（お名前.com等）でさらなるコスト削減可能
   - 年1,000円程度まで削減できる可能性
   - ただし移管時はメール設定の再構築が必要

2. **監視・メンテナンス体制**
   - Vercelのモニタリング設定
   - 定期的なサイト健全性チェック体制構築

3. **ドキュメント更新**
   - 社内向け運用マニュアルの更新
   - 緊急時対応手順の共有

---

**最終更新**: 2025-09-10  
**更新者**: Claude Code