import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    body: '재고 관리에 들이던 시간을 80% 이상 절약했습니다. AI 발주 추천이 정말 정확해서 놀랐어요.',
    author: {
      name: '김민수',
      position: '유통팀장',
      company: 'A 유통회사',
    },
  },
  {
    body: 'ABC 분석과 수요 예측 기능 덕분에 재고 회전율이 2배 이상 개선되었습니다. 최고의 선택이었어요.',
    author: {
      name: '이지은',
      position: '구매담당',
      company: 'B 제조회사',
    },
  },
  {
    body: '과거에는 품절로 고객을 놓쳤는데, 이제는 적정 재고를 항상 유지할 수 있게 되었습니다.',
    author: {
      name: '박준혁',
      position: 'SCM 매니저',
      company: 'C 이커머스',
    },
  },
]

export function Testimonials() {
  return (
    <section className="bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">고객 후기</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            고객들이 말하는 FloStok
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.author.name} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col pt-6">
                <blockquote className="flex-1">
                  <p className="text-lg leading-8 text-gray-900">
                    &ldquo;{testimonial.body}&rdquo;
                  </p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-x-4 border-t border-gray-200 pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-semibold text-blue-600">
                      {testimonial.author.name[0]}
                    </span>
                  </div>
                  <div className="text-sm leading-6">
                    <div className="font-semibold text-gray-900">
                      {testimonial.author.name}
                    </div>
                    <div className="text-gray-600">
                      {testimonial.author.position} · {testimonial.author.company}
                    </div>
                  </div>
                </figcaption>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
