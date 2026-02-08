
import {
  generateKPIImprovementProposals,
  sortProposalsByPriority,
  filterProposalsByCategory,
  type KPIMetrics,
  type KPITarget,
} from '@/server/services/scm/kpi-improvement'

describe('KPI 개선 제안 서비스', () => {
  describe('generateKPIImprovementProposals - KPI 개선 제안 생성', () => {
    const createMetrics = (overrides: Partial<KPIMetrics> = {}): KPIMetrics => ({
      inventoryTurnoverRate: 8.0,
      averageInventoryDays: 45,
      inventoryAccuracy: 95.0,
      stockoutRate: 2.0,
      onTimeOrderRate: 90.0,
      averageLeadTime: 10,
      orderFulfillmentRate: 95.0,
      ...overrides,
    })

    const createTargets = (overrides: Partial<KPITarget> = {}): KPITarget => ({
      inventoryTurnoverRate: 12.0,
      averageInventoryDays: 30,
      inventoryAccuracy: 98.0,
      stockoutRate: 1.0,
      onTimeOrderRate: 95.0,
      averageLeadTime: 7,
      orderFulfillmentRate: 98.0,
      ...overrides,
    })

    it('재고회전율 목표 미달 시 제안을 생성한다', () => {
      const metrics = createMetrics({ inventoryTurnoverRate: 6.0 })
      const targets = createTargets({ inventoryTurnoverRate: 12.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const turnoverProposal = proposals.find((p) => p.id === 'turnover-1')
      expect(turnoverProposal).toBeDefined()
      expect(turnoverProposal?.title).toContain('재고')
      expect(turnoverProposal?.priority).toBe('high')
      expect(turnoverProposal?.kpiCategory).toBe('inventory')
      expect(turnoverProposal?.affectedKPIs).toContain('재고회전율')
    })

    it('재고회전율 차이가 10% 이하이면 제안을 생성하지 않는다', () => {
      const metrics = createMetrics({ inventoryTurnoverRate: 11.0 })
      const targets = createTargets({ inventoryTurnoverRate: 12.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const turnoverProposal = proposals.find((p) => p.id === 'turnover-1')
      expect(turnoverProposal).toBeUndefined()
    })

    it('평균 재고일수 목표 초과 시 제안을 생성한다', () => {
      const metrics = createMetrics({ averageInventoryDays: 40 })
      const targets = createTargets({ averageInventoryDays: 30 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const daysProposal = proposals.find((p) => p.id === 'inventory-days-1')
      expect(daysProposal).toBeDefined()
      expect(daysProposal?.title).toContain('발주 주기')
      expect(daysProposal?.priority).toBe('medium')
      expect(daysProposal?.kpiCategory).toBe('inventory')
    })

    it('평균 재고일수 차이가 5일 이하이면 제안을 생성하지 않는다', () => {
      const metrics = createMetrics({ averageInventoryDays: 33 })
      const targets = createTargets({ averageInventoryDays: 30 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const daysProposal = proposals.find((p) => p.id === 'inventory-days-1')
      expect(daysProposal).toBeUndefined()
    })

    it('품절률 목표 초과 시 제안을 생성한다', () => {
      const metrics = createMetrics({ stockoutRate: 3.0 })
      const targets = createTargets({ stockoutRate: 1.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const stockoutProposal = proposals.find((p) => p.id === 'stockout-1')
      expect(stockoutProposal).toBeDefined()
      expect(stockoutProposal?.title).toContain('안전재고')
      expect(stockoutProposal?.priority).toBe('high')
      expect(stockoutProposal?.affectedKPIs).toContain('품절률')
    })

    it('품절률 차이가 0.5% 이하이면 제안을 생성하지 않는다', () => {
      const metrics = createMetrics({ stockoutRate: 1.3 })
      const targets = createTargets({ stockoutRate: 1.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const stockoutProposal = proposals.find((p) => p.id === 'stockout-1')
      expect(stockoutProposal).toBeUndefined()
    })

    it('적시 발주율 목표 미달 시 제안을 생성한다', () => {
      const metrics = createMetrics({ onTimeOrderRate: 85.0 })
      const targets = createTargets({ onTimeOrderRate: 95.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const ontimeProposal = proposals.find((p) => p.id === 'ontime-order-1')
      expect(ontimeProposal).toBeDefined()
      expect(ontimeProposal?.title).toContain('발주 프로세스')
      expect(ontimeProposal?.priority).toBe('high')
      expect(ontimeProposal?.kpiCategory).toBe('order')
    })

    it('적시 발주율 차이가 3% 이하이면 제안을 생성하지 않는다', () => {
      const metrics = createMetrics({ onTimeOrderRate: 93.0 })
      const targets = createTargets({ onTimeOrderRate: 95.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const ontimeProposal = proposals.find((p) => p.id === 'ontime-order-1')
      expect(ontimeProposal).toBeUndefined()
    })

    it('평균 리드타임 목표 초과 시 제안을 생성한다', () => {
      const metrics = createMetrics({ averageLeadTime: 10 })
      const targets = createTargets({ averageLeadTime: 7 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const leadtimeProposal = proposals.find((p) => p.id === 'leadtime-1')
      expect(leadtimeProposal).toBeDefined()
      expect(leadtimeProposal?.title).toContain('공급자')
      expect(leadtimeProposal?.priority).toBe('medium')
      expect(leadtimeProposal?.kpiCategory).toBe('order')
    })

    it('평균 리드타임 차이가 1일 이하이면 제안을 생성하지 않는다', () => {
      const metrics = createMetrics({ averageLeadTime: 7.5 })
      const targets = createTargets({ averageLeadTime: 7 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const leadtimeProposal = proposals.find((p) => p.id === 'leadtime-1')
      expect(leadtimeProposal).toBeUndefined()
    })

    it('재고 정확도 목표 미달 시 제안을 생성한다', () => {
      const metrics = createMetrics({ inventoryAccuracy: 92.0 })
      const targets = createTargets({ inventoryAccuracy: 98.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const accuracyProposal = proposals.find((p) => p.id === 'accuracy-1')
      expect(accuracyProposal).toBeDefined()
      expect(accuracyProposal?.title).toContain('재고 실사')
      expect(accuracyProposal?.priority).toBe('medium')
      expect(accuracyProposal?.kpiCategory).toBe('inventory')
    })

    it('재고 정확도 차이가 2% 이하이면 제안을 생성하지 않는다', () => {
      const metrics = createMetrics({ inventoryAccuracy: 96.5 })
      const targets = createTargets({ inventoryAccuracy: 98.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const accuracyProposal = proposals.find((p) => p.id === 'accuracy-1')
      expect(accuracyProposal).toBeUndefined()
    })

    it('발주 충족률 목표 미달 시 제안을 생성한다', () => {
      const metrics = createMetrics({ orderFulfillmentRate: 90.0 })
      const targets = createTargets({ orderFulfillmentRate: 98.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const fulfillmentProposal = proposals.find((p) => p.id === 'fulfillment-1')
      expect(fulfillmentProposal).toBeDefined()
      expect(fulfillmentProposal?.title).toContain('공급자 신뢰도')
      expect(fulfillmentProposal?.priority).toBe('medium')
      expect(fulfillmentProposal?.kpiCategory).toBe('order')
    })

    it('발주 충족률 차이가 2% 이하이면 제안을 생성하지 않는다', () => {
      const metrics = createMetrics({ orderFulfillmentRate: 96.5 })
      const targets = createTargets({ orderFulfillmentRate: 98.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const fulfillmentProposal = proposals.find((p) => p.id === 'fulfillment-1')
      expect(fulfillmentProposal).toBeUndefined()
    })

    it('모든 KPI 달성 시 우수 유지 제안을 생성한다', () => {
      const metrics = createMetrics({
        inventoryTurnoverRate: 12.0,
        averageInventoryDays: 30,
        inventoryAccuracy: 98.0,
        stockoutRate: 1.0,
        onTimeOrderRate: 95.0,
        averageLeadTime: 7,
        orderFulfillmentRate: 98.0,
      })
      const targets = createTargets()

      const proposals = generateKPIImprovementProposals(metrics, targets)

      const excellenceProposal = proposals.find((p) => p.id === 'excellence-1')
      expect(excellenceProposal).toBeDefined()
      expect(excellenceProposal?.title).toContain('지속적 개선')
      expect(excellenceProposal?.priority).toBe('medium')
      expect(excellenceProposal?.kpiCategory).toBe('cost')
      expect(excellenceProposal?.affectedKPIs).toContain('모든 KPI')
    })

    it('여러 KPI 미달 시 여러 제안을 생성한다', () => {
      const metrics = createMetrics({
        inventoryTurnoverRate: 6.0, // 목표 미달
        stockoutRate: 3.0, // 목표 초과
        onTimeOrderRate: 85.0, // 목표 미달
      })
      const targets = createTargets()

      const proposals = generateKPIImprovementProposals(metrics, targets)

      expect(proposals.length).toBeGreaterThanOrEqual(3)
      expect(proposals.some((p) => p.id === 'turnover-1')).toBe(true)
      expect(proposals.some((p) => p.id === 'stockout-1')).toBe(true)
      expect(proposals.some((p) => p.id === 'ontime-order-1')).toBe(true)
    })

    it('각 제안은 필수 필드를 포함한다', () => {
      const metrics = createMetrics({ stockoutRate: 3.0 })
      const targets = createTargets({ stockoutRate: 1.0 })

      const proposals = generateKPIImprovementProposals(metrics, targets)

      proposals.forEach((proposal) => {
        expect(proposal.id).toBeTruthy()
        expect(proposal.title).toBeTruthy()
        expect(proposal.description).toBeTruthy()
        expect(proposal.kpiCategory).toMatch(/^(inventory|order|cost)$/)
        expect(proposal.affectedKPIs).toBeInstanceOf(Array)
        expect(proposal.priority).toMatch(/^(high|medium|low)$/)
        expect(proposal.estimatedImpact).toBeTruthy()
        expect(proposal.actionSteps).toBeInstanceOf(Array)
        expect(proposal.actionSteps.length).toBeGreaterThan(0)
        expect(proposal.timeToImplement).toBeTruthy()
      })
    })
  })

  describe('sortProposalsByPriority - 우선순위 정렬', () => {
    it('high > medium > low 순서로 정렬한다', () => {
      const proposals = [
        {
          id: '1',
          title: 'Low',
          description: '',
          kpiCategory: 'inventory' as const,
          affectedKPIs: [],
          priority: 'low' as const,
          estimatedImpact: '',
          actionSteps: [],
          timeToImplement: '',
        },
        {
          id: '2',
          title: 'High',
          description: '',
          kpiCategory: 'inventory' as const,
          affectedKPIs: [],
          priority: 'high' as const,
          estimatedImpact: '',
          actionSteps: [],
          timeToImplement: '',
        },
        {
          id: '3',
          title: 'Medium',
          description: '',
          kpiCategory: 'inventory' as const,
          affectedKPIs: [],
          priority: 'medium' as const,
          estimatedImpact: '',
          actionSteps: [],
          timeToImplement: '',
        },
      ]

      const sorted = sortProposalsByPriority(proposals)

      expect(sorted[0].priority).toBe('high')
      expect(sorted[1].priority).toBe('medium')
      expect(sorted[2].priority).toBe('low')
    })

    it('원본 배열을 수정하지 않는다', () => {
      const proposals = [
        {
          id: '1',
          title: 'Low',
          description: '',
          kpiCategory: 'inventory' as const,
          affectedKPIs: [],
          priority: 'low' as const,
          estimatedImpact: '',
          actionSteps: [],
          timeToImplement: '',
        },
      ]

      const originalFirst = proposals[0]
      sortProposalsByPriority(proposals)

      expect(proposals[0]).toBe(originalFirst)
    })

    it('빈 배열을 입력하면 빈 배열을 반환한다', () => {
      const sorted = sortProposalsByPriority([])

      expect(sorted).toHaveLength(0)
    })
  })

  describe('filterProposalsByCategory - 카테고리 필터링', () => {
    const createProposal = (id: string, category: 'inventory' | 'order' | 'cost') => ({
      id,
      title: `Proposal ${id}`,
      description: '',
      kpiCategory: category,
      affectedKPIs: [],
      priority: 'medium' as const,
      estimatedImpact: '',
      actionSteps: [],
      timeToImplement: '',
    })

    it('지정한 카테고리의 제안만 반환한다', () => {
      const proposals = [
        createProposal('1', 'inventory'),
        createProposal('2', 'order'),
        createProposal('3', 'inventory'),
        createProposal('4', 'cost'),
      ]

      const filtered = filterProposalsByCategory(proposals, 'inventory')

      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('3')
    })

    it('조건을 만족하는 제안이 없으면 빈 배열을 반환한다', () => {
      const proposals = [
        createProposal('1', 'inventory'),
        createProposal('2', 'order'),
      ]

      const filtered = filterProposalsByCategory(proposals, 'cost')

      expect(filtered).toHaveLength(0)
    })

    it('빈 배열을 입력하면 빈 배열을 반환한다', () => {
      const filtered = filterProposalsByCategory([], 'inventory')

      expect(filtered).toHaveLength(0)
    })
  })
})
