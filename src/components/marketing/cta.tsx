import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          지금 바로 시작하세요.
          <br />
          14일 무료 체험 제공.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
          신용카드 등록 없이 바로 시작할 수 있습니다.
          <br />
          언제든지 취소 가능하며, 모든 기능을 체험해 보세요.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">
              무료로 시작하기 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
            <Link href="/contact">영업팀 문의</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
