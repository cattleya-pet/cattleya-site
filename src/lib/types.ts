// APIのレスポンス型
export type MicroCMSResponse<T> = {
  contents: T[];
  totalCount: number;
  offset: number;
  limit: number;
};

// ペットの型定義
export type Pet = {
  id: string;
  petNumber: string;
  animalType: string;
  classification: 'bloodline' | 'mix';  // 'blood' から 'bloodline' に修正
  breedTypeJa: string;
  breedTypeEn: string;
  parentBreed: string;
  color: string;
  gender: string;
  birthday: string;
  store: string;
  petDescription: string;
  imageUrl01: string;
  imageUrl02: string;
  imageUrl03: string;
  imageUrl04: string;
  imageUrl05: string;
  videoUrl: string;
};