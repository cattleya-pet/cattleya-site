# プロジェクトルール

## CSS/SCSS コーディング規則

### ブレイクポイント
- **禁止**: `@include breakpoint-down()` の使用は一切禁止
- **推奨**: モバイルファーストアプローチを採用
  - デフォルトスタイル = モバイル（sm未満）
  - `@include breakpoint-up(sm)` でタブレット・デスクトップスタイルを上書き

```scss
// ❌ 禁止
@include breakpoint-down(sm) {
  // styles
}

// ✅ 推奨
.component {
  // モバイル（sm未満）のスタイル
  
  @include breakpoint-up(sm) {
    // タブレット・デスクトップのスタイル
  }
}
```

### クラス記述の統合
- **同一クラスは1箇所にまとめる**: 同じクラスに対するスタイル記述が複数箇所に分散している場合は、可能な限り1つのセレクタ内に統合する
- レスポンシブ対応は`@include breakpoint-up()`を使用して同一セレクタ内で管理

```scss
// ❌ 分散した記述
.component {
  color: red;
}
.component {
  @include breakpoint-up(sm) {
    color: blue;
  }
}

// ✅ 統合された記述
.component {
  color: red;
  
  @include breakpoint-up(sm) {
    color: blue;
  }
}
```

## 開発方針
- 既存のコンポーネントと一貫した構造を保つ
- 他のセクション（`.homestay-section`、`.relief-section`）と同様の`.container`構造を使用

## ページ管理方針

### ページルーティング構造
**重要**: すべての下層ページは `ディレクトリ名/index.astro` の構造で作成する

- ✅ 正しい: `/src/pages/company/index.astro` → `/company`
- ❌ 間違い: `/src/pages/company.astro` → `/company`

この構造により、将来的にサブページの追加が容易になり、ファイル構造が整理される。

### 検索ページの構造
- 動的ルート `[breedTypeEn].astro` で血統証・ミックス両方を処理
- ページ内で条件分岐により表示内容を切り替え
- URL構造に合わせてヘッダーメニューのリンク構造と整合性を保つ
- ペット詳細ページは `{コンテンツID}` をスラッグとして使用

### ファイル構造
```
search/
├── index.astro                                    # /search
├── dogs/
│   ├── index.astro                               # /search/dogs/
│   ├── [breedTypeEn]/
│   │   ├── index.astro                           # /search/dogs/{breedTypeEn}
│   │   └── [contentId].astro                     # /search/dogs/{breedTypeEn}/{contentId}
│   └── mix/
│       ├── index.astro                           # /search/dogs/mix
│       └── [breedTypeEn]/
│           ├── index.astro                       # /search/dogs/mix/{breedTypeEn}
│           └── [contentId].astro                 # /search/dogs/mix/{breedTypeEn}/{contentId}
└── cats/
    ├── index.astro                               # /search/cats/
    ├── [breedTypeEn]/
    │   ├── index.astro                           # /search/cats/{breedTypeEn}
    │   └── [contentId].astro                     # /search/cats/{breedTypeEn}/{contentId}
    └── mix/
        ├── index.astro                           # /search/cats/mix
        └── [breedTypeEn]/
            ├── index.astro                       # /search/cats/mix/{breedTypeEn}
            └── [contentId].astro                 # /search/cats/mix/{breedTypeEn}/{contentId}
```

## レスポンシブ改行制御

HTMLで画面サイズに応じた改行制御を行う汎用クラスが用意されています（global.scssで定義）。

### 使用可能なクラス

```html
<!-- sm未満でのみ表示 -->
<br class="sm-down-only">

<!-- sm以降でのみ表示 -->
<br class="sm-up-only">

<!-- md未満でのみ表示 -->
<br class="md-down-only">

<!-- md以降でのみ表示 -->
<br class="md-up-only">

<!-- lg未満でのみ表示 -->
<br class="lg-down-only">

<!-- lg以降でのみ表示 -->
<br class="lg-up-only">

<!-- xl未満でのみ表示 -->
<br class="xl-down-only">

<!-- xl以降でのみ表示 -->
<br class="xl-up-only">
```

### 使用例
```html
<p>
  モバイルでは改行なし、<br class="sm-up-only">
  タブレット以降で改行が入ります。
</p>
```