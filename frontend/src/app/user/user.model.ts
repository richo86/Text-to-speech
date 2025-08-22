export interface User {
  username: string;
  email: string;
  password: string;
}

export interface LoginUser {
  username: string; // can be username or email
  password: string;
}
