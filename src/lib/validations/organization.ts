/**
 * 조직 관련 Zod 스키마
 */

import { z } from 'zod'

/** 조직 정보 업데이트 스키마 */
export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, '조직명은 최소 2자 이상이어야 합니다')
    .max(100, '조직명은 최대 100자까지 입력 가능합니다'),
  contactPhone: z
    .string()
    .regex(/^[0-9-+().\s]{8,20}$/, '올바른 전화번호 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  contactEmail: z
    .string()
    .email('올바른 이메일 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(200, '주소는 최대 200자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  addressDetail: z
    .string()
    .max(100, '상세 주소는 최대 100자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, '우편번호는 5자리 숫자입니다')
    .optional()
    .or(z.literal('')),
})

/** 타입 export */
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
