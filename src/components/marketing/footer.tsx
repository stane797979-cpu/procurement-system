import Link from 'next/link'

const navigation = {
  product: [
    { name: '기능', href: '/#features' },
    { name: '가격', href: '/#pricing' },
    { name: '고객 후기', href: '/#testimonials' },
    { name: '로드맵', href: '/roadmap' },
  ],
  company: [
    { name: '회사 소개', href: '/about' },
    { name: '블로그', href: '/blog' },
    { name: '채용', href: '/careers' },
    { name: '연락처', href: '/contact' },
  ],
  resources: [
    { name: '문서', href: '/docs' },
    { name: '튜토리얼', href: '/tutorials' },
    { name: 'API 문서', href: '/api-docs' },
    { name: '지원센터', href: '/support' },
  ],
  legal: [
    { name: '개인정보 처리방침', href: '/privacy' },
    { name: '이용약관', href: '/terms' },
    { name: '보안', href: '/security' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <div className="text-2xl font-bold text-white">FloStok</div>
            <p className="text-sm leading-6 text-gray-300">
              AI 기반 재고 관리 및 자동 발주 추천 SaaS
            </p>
            <div className="flex space-x-6">
              {/* Social links can be added here */}
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">제품</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">회사</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">리소스</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.resources.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">법적 고지</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-gray-400">
            &copy; 2026 FloStok. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
