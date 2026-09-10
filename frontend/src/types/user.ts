export interface User {
  id: number;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}
