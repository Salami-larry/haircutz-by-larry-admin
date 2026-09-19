export type LoginResponse = {
  token: string;
  expiresAt: string;
  role: string;
  email: string;
};

export type AdminMe = {
  adminId: string;
  email: string;
  role: string;
};

export type Hairstyle = {
  id: string;
  name: string;
  description: string;
  walkInPriceKobo: number;
  homeServicePriceKobo: number;
  durationMinutes: number;
  imageUrls: string[];
  videoUrl?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = {
  items: T[];
  metadata: {
    total_items: number;
    current_items: number;
    current_page: number;
    last_page: number;
    next_page: number | null;
    previous_page: number | null;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
};
