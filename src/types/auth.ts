/**
 * 인증 관련 타입 정의
 */

import type { User, Session } from '@supabase/supabase-js'

/** 인증 상태 */
export type AuthState = {
  user: User | null
  session: Session | null
  isLoading: boolean
}

/** 로그인 폼 데이터 */
export type SignInFormData = {
  email: string
  password: string
}

/** 회원가입 폼 데이터 */
export type SignUpFormData = {
  email: string
  password: string
  passwordConfirm: string
}

/** 비밀번호 재설정 폼 데이터 */
export type ResetPasswordFormData = {
  email: string
}

/** OAuth 제공자 */
export type OAuthProvider = 'kakao' | 'google'

/** 인증 에러 코드 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_ALREADY_EXISTS = 'user_already_exists',
  EMAIL_NOT_CONFIRMED = 'email_not_confirmed',
  WEAK_PASSWORD = 'weak_password',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNKNOWN = 'unknown',
}

/** 인증 에러 메시지 맵 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다',
  [AuthErrorCode.USER_ALREADY_EXISTS]: '이미 가입된 이메일입니다',
  [AuthErrorCode.EMAIL_NOT_CONFIRMED]: '이메일 인증이 필요합니다',
  [AuthErrorCode.WEAK_PASSWORD]: '비밀번호는 최소 8자 이상이어야 합니다',
  [AuthErrorCode.RATE_LIMIT_EXCEEDED]: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요',
  [AuthErrorCode.UNKNOWN]: '알 수 없는 오류가 발생했습니다',
}
