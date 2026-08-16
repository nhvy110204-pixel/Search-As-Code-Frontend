export interface UserProfile {
  id: string
  email: string
  username: string
  full_name: string | null
  avatar_url: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  metadata_?: Record<string, any>
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in_seconds: number
  refresh_expires_in_seconds: number
  user: UserProfile
}

export interface LoginCredentials {
  identifier: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  full_name?: string
  avatar_url?: string
}

export interface UserUpdateRequest {
  email?: string
  username?: string
  full_name?: string
  avatar_url?: string
  metadata_?: Record<string, any>
}
