// ペットの基本情報の型定義
export type PetBase = {
  id: string;
  animalType: string;
  classification: 'bloodline' | 'mix';
  breedTypeJa: string;
  breedTypeEn: string;
  parentBreed: string;
  tags: string;
  fatherWeight: string;
  motherWeight: string;
  mixFatherBreed: string;
  mixMotherBreed: string;
};

// ペットの詳細情報の型定義
export type PetDetails = {
  color: string;
  gender: string;
  birthday: string;
  storeName: string;
  storeId: string;
  isNew: string;  // booleanからstringに変更
  petDescription: string;
};

// ペットのメディア情報の型定義
export type PetMedia = {
  imageUrl01: string;
  imageUrl02: string;
  imageUrl03: string;
  videoUrl: string;
};

// 完全なペット情報の型定義
export type Pet = PetBase & PetDetails & PetMedia;