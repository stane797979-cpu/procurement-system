/**
 * 인증 관련 Zod 스키마
 */

import { z } from 'zod'

/** 이메일 스키마 */
export const emailSchema = z
  .string()
  .min(1, '이메일을 입력해주세요')
  .email('올바른 이메일 형식이 아닙니다')

/** 비밀번호 스키마 */
export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
  .max(72, '비밀번호는 최대 72자까지 입력 가능합니다')

/** 로그인 스키마 */
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

/** 회원가입 스키마 */
export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  })

/** 비밀번호 재설정 요청 스키마 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
})

/** 비밀번호 재설정 스키마 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  })

/** 이메일 인증 스키마 */
export const verifyOtpSchema = z.object({
  email: emailSchema,
  token: z.string().min(6, '인증 코드는 6자리입니다').max(6, '인증 코드는 6자리입니다'),
})

/** 타입 export */
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
