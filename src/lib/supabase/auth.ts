/**
 * Supabase Auth 유틸리티
 *
 * 이메일/비밀번호 인증 및 OAuth (카카오, 구글) 지원
 */

import { createClient as createBrowserClient } from './client'
import { createClient as createServerClient } from './server'
import type { User, Session } from '@supabase/supabase-js'

/** 인증 에러 타입 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/** 이메일/비밀번호 회원가입 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new AuthError(
      error.message === 'User already registered'
        ? '이미 가입된 이메일입니다'
        : '회원가입에 실패했습니다',
      error.status?.toString()
    )
  }

  return data
}

/** 이메일/비밀번호 로그인 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new AuthError(
      error.message === 'Invalid login credentials'
        ? '이메일 또는 비밀번호가 올바르지 않습니다'
        : '로그인에 실패했습니다',
      error.status?.toString()
    )
  }

  return data
}

/** 카카오 OAuth 로그인 */
export async function signInWithKakao() {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new AuthError('카카오 로그인에 실패했습니다', error.status?.toString())
  }

  return data
}

/** 구글 OAuth 로그인 */
export async function signInWithGoogle() {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    throw new AuthError('구글 로그인에 실패했습니다', error.status?.toString())
  }

  return data
}

/** 로그아웃 */
export async function signOut() {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new AuthError('로그아웃에 실패했습니다', error.status?.toString())
  }
}

/** 비밀번호 재설정 이메일 전송 */
export async function resetPasswordForEmail(email: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    throw new AuthError(
      '비밀번호 재설정 이메일 전송에 실패했습니다',
      error.status?.toString()
    )
  }
}

/** 비밀번호 변경 */
export async function updatePassword(newPassword: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new AuthError('비밀번호 변경에 실패했습니다', error.status?.toString())
  }
}

/** 현재 사용자 조회 (클라이언트) */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/** 현재 세션 조회 (클라이언트) */
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = createBrowserClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

/** 현재 사용자 조회 (서버) */
export async function getCurrentUserServer(): Promise<User | null> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/** 현재 세션 조회 (서버) */
export async function getCurrentSessionServer(): Promise<Session | null> {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

/** 인증 상태 변경 리스너 등록 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const supabase = createBrowserClient()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback)

  return subscription
}

/** 이메일 인증 확인 */
export async function verifyOtp(email: string, token: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    throw new AuthError('이메일 인증에 실패했습니다', error.status?.toString())
  }
}
