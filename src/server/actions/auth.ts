'use server'

/**
 * 인증 관련 Server Actions
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  signInSchema,
  signUpSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  type SignInInput,
  type SignUpInput,
  type ResetPasswordRequestInput,
  type ResetPasswordInput,
} from '@/lib/validations/auth'

/** 응답 타입 */
type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

/** 이메일/비밀번호 로그인 */
export async function signInAction(
  input: SignInInput
): Promise<ActionResponse<void>> {
  try {
    // 입력 검증
    const validated = signInSchema.parse(input)

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (error) {
      if (error.message === 'Invalid login credentials') {
        return {
          success: false,
          error: '이메일 또는 비밀번호가 올바르지 않습니다',
        }
      }
      return {
        success: false,
        error: '로그인에 실패했습니다',
      }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    }
  }
}

/** 이메일/비밀번호 회원가입 */
export async function signUpAction(
  input: SignUpInput
): Promise<ActionResponse<void>> {
  try {
    // 입력 검증
    const validated = signUpSchema.parse(input)

    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      if (error.message === 'User already registered') {
        return {
          success: false,
          error: '이미 가입된 이메일입니다',
        }
      }
      return {
        success: false,
        error: '회원가입에 실패했습니다',
      }
    }

    revalidatePath('/', 'layout')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    }
  }
}

/** 로그아웃 */
export async function signOutAction(): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: '로그아웃에 실패했습니다',
      }
    }

    revalidatePath('/', 'layout')
    redirect('/auth/signin')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    }
  }
}

/** 비밀번호 재설정 이메일 전송 */
export async function resetPasswordRequestAction(
  input: ResetPasswordRequestInput
): Promise<ActionResponse<void>> {
  try {
    // 입력 검증
    const validated = resetPasswordRequestSchema.parse(input)

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: '비밀번호 재설정 이메일 전송에 실패했습니다',
      }
    }

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    }
  }
}

/** 비밀번호 변경 */
export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResponse<void>> {
  try {
    // 입력 검증
    const validated = resetPasswordSchema.parse(input)

    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password: validated.password,
    })

    if (error) {
      return {
        success: false,
        error: '비밀번호 변경에 실패했습니다',
      }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    }
  }
}
