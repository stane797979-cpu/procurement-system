import { TrendingDown, Clock, Target, Shield } from 'lucide-react'

const stats = [
  {
    name: '재고 비용 절감',
    value: '30%',
    description: '적정 재고 수준 유지로 보유 비용 감소',
    icon: TrendingDown,
  },
  {
    name: '발주 시간 단축',
    value: '80%',
    description: '자동화로 수동 발주 시간 대폭 감소',
    icon: Clock,
  },
  {
    name: '재고 회전율 향상',
    value: '2.5배',
    description: '최적화된 재고 관리로 회전율 개선',
    icon: Target,
  },
  {
    name: '품절 방지',
    value: '95%',
    description: '예측 기반 발주로 품절 방지율 향상',
    icon: Shield,
  },
]

export function Benefits() {
  return (
    <section className="bg-blue-600 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            검증된 도입 효과
          </h2>
          <p className="mt-6 text-lg leading-8 text-blue-100">
            이미 많은 기업들이 FloStok을 통해
            <br />
            재고 관리 효율을 극대화하고 있습니다.
          </p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-center sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="mx-auto flex max-w-xs flex-col gap-y-4 rounded-2xl bg-white/10 p-8 backdrop-blur-sm"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <dt className="text-base leading-7 text-blue-100">{stat.name}</dt>
              <dd className="order-first text-5xl font-semibold tracking-tight text-white">
                {stat.value}
              </dd>
              <p className="text-sm leading-6 text-blue-200">{stat.description}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
