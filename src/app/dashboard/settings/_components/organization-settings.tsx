'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Phone, Mail, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { updateOrganizationAction } from '@/server/actions/organization'

interface OrganizationData {
  id: string
  name: string
  settings: {
    contact?: {
      phone?: string
      email?: string
    }
    address?: {
      full?: string
      detail?: string
      postalCode?: string
    }
  }
}

interface OrganizationSettingsProps {
  organization: OrganizationData
}

export function OrganizationSettings({ organization }: OrganizationSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: organization.name || '',
    contactPhone: organization.settings?.contact?.phone || '',
    contactEmail: organization.settings?.contact?.email || '',
    address: organization.settings?.address?.full || '',
    addressDetail: organization.settings?.address?.detail || '',
    postalCode: organization.settings?.address?.postalCode || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await updateOrganizationAction(organization.id, formData)

      if (result.success) {
        setMessage({ type: 'success', text: '조직 정보가 성공적으로 업데이트되었습니다' })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    setMessage(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          조직 정보
        </CardTitle>
        <CardDescription>조직의 기본 정보를 관리합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 조직명 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              조직명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="FloStok"
              required
              disabled={isPending}
            />
          </div>

          {/* 연락처 정보 */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Phone className="h-4 w-4" />
              연락처 정보
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-sm font-medium">
                  전화번호
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleChange('contactPhone')}
                  placeholder="02-1234-5678"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-sm font-medium">
                  <Mail className="mr-1 inline h-3.5 w-3.5" />
                  이메일
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange('contactEmail')}
                  placeholder="contact@example.com"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* 주소 정보 */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4" />
              주소 정보
            </h3>

            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="w-32 space-y-2">
                  <Label htmlFor="postalCode" className="text-sm font-medium">
                    우편번호
                  </Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange('postalCode')}
                    placeholder="12345"
                    maxLength={5}
                    disabled={isPending}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    기본 주소
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={handleChange('address')}
                    placeholder="서울시 강남구 테헤란로 123"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressDetail" className="text-sm font-medium">
                  상세 주소
                </Label>
                <Input
                  id="addressDetail"
                  value={formData.addressDetail}
                  onChange={handleChange('addressDetail')}
                  placeholder="4층 401호"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* 메시지 */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              변경사항 저장
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
