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
