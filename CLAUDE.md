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

### 検索ページの構造
- 動的ルート `[animalTypeEn].astro` で血統証・ミックス両方を処理
- ページ内で条件分岐により表示内容を切り替え
- URL構造に合わせてヘッダーメニューのリンク構造と整合性を保つ
- ペット詳細ページは `{コンテンツID}` をスラッグとして使用

### ファイル構造
```
search/
├── index.astro                                    # /search
├── dogs/
│   ├── index.astro                               # /search/dogs/
│   ├── [animalTypeEn]/
│   │   ├── index.astro                           # /search/dogs/{animalTypeEn}
│   │   └── [contentId].astro                     # /search/dogs/{animalTypeEn}/{contentId}
│   └── mix/
│       ├── index.astro                           # /search/dogs/mix
│       └── [animalTypeEn]/
│           ├── index.astro                       # /search/dogs/mix/{animalTypeEn}
│           └── [contentId].astro                 # /search/dogs/mix/{animalTypeEn}/{contentId}
└── cats/
    ├── index.astro                               # /search/cats/
    ├── [animalTypeEn]/
    │   ├── index.astro                           # /search/cats/{animalTypeEn}
    │   └── [contentId].astro                     # /search/cats/{animalTypeEn}/{contentId}
    └── mix/
        ├── index.astro                           # /search/cats/mix
        └── [animalTypeEn]/
            ├── index.astro                       # /search/cats/mix/{animalTypeEn}
            └── [contentId].astro                 # /search/cats/mix/{animalTypeEn}/{contentId}
```