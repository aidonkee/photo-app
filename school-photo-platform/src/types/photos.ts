export interface Photo {
    id: string;
    watermarkedUrl: string;
    thumbnailUrl: string | null;
    alt: string | null;
    width: number;
    height: number;
  }