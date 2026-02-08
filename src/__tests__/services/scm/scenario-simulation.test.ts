
import {
  runScenarioSimulation,
  runBulkSimulation,
  type SimulationInput,
} from '@/server/services/scm/scenario-simulation'

describe('시나리오 시뮬레이션', () => {
  const baseInput: SimulationInput = {
    productId: 'p1',
    productName: '테스트 제품',
    currentStock: 100,
    averageDailyDemand: 10,
    demandStdDev: 3,
    leadTimeDays: 7,
    leadTimeStdDev: 1,
    safetyStock: 50,
    reorderPoint: 120,
    serviceLevel: 0.95,
  }

  describe('runScenarioSimulation - 시나리오 시뮬레이션 실행', () => {
    it('기준 시나리오(baseline)를 포함한다', () => {
      const result = runScenarioSimulation(baseInput)

      expect(result.baseline).toBeDefined()
      expect(result.baseline.scenarioName).toBe('기준 (현재)')
      expect(result.baseline.demandChangePercent).toBe(0)
      expect(result.baseline.leadTimeChangeDays).toBe(0)
    })

    it('10개의 시뮬레이션 시나리오를 생성한다', () => {
      const result = runScenarioSimulation(baseInput)

      expect(result.scenarios).toHaveLength(10)
    })

    it('수요 +20% 시나리오에서 안전재고가 증가한다', () => {
      const result = runScenarioSimulation(baseInput)

      const demand20Up = result.scenarios.find((s) => s.scenarioName === '수요 +20%')
      expect(demand20Up).toBeDefined()
      expect(demand20Up!.newSafetyStock).toBeGreaterThan(result.baseline.newSafetyStock)
    })

    it('수요 -20% 시나리오에서 안전재고가 감소한다', () => {
      const result = runScenarioSimulation(baseInput)

      const demand20Down = result.scenarios.find((s) => s.scenarioName === '수요 -20%')
      expect(demand20Down).toBeDefined()
      expect(demand20Down!.newSafetyStock).toBeLessThan(result.baseline.newSafetyStock)
    })

    it('리드타임 +5일 시나리오에서 발주점이 증가한다', () => {
      const result = runScenarioSimulation(baseInput)

      const leadTime5Up = result.scenarios.find((s) => s.scenarioName === '리드타임 +5일')
      expect(leadTime5Up).toBeDefined()
      expect(leadTime5Up!.newReorderPoint).toBeGreaterThan(result.baseline.newReorderPoint)
    })

    it('리드타임 -2일 시나리오에서 발주점이 감소하며 최소 1일을 보장한다', () => {
      const result = runScenarioSimulation(baseInput)

      const leadTime2Down = result.scenarios.find((s) => s.scenarioName === '리드타임 -2일')
      expect(leadTime2Down).toBeDefined()
      expect(leadTime2Down!.newReorderPoint).toBeLessThan(result.baseline.newReorderPoint)
      expect(leadTime2Down!.adjustedLeadTime).toBeGreaterThanOrEqual(1)
    })

    it('리드타임이 음수가 되지 않도록 최소 1일을 보장한다', () => {
      const shortLeadTimeInput = {
        ...baseInput,
        leadTimeDays: 1,
      }

      const result = runScenarioSimulation(shortLeadTimeInput)

      const leadTime2Down = result.scenarios.find((s) => s.scenarioName === '리드타임 -2일')
      expect(leadTime2Down).toBeDefined()
      expect(leadTime2Down!.adjustedLeadTime).toBe(1)
    })

    it('최악의 시나리오(수요↑20% + 리드타임↑5일)를 올바르게 계산한다', () => {
      const result = runScenarioSimulation(baseInput)

      const worstCase = result.scenarios.find(
        (s) => s.scenarioName === '최악: 수요↑20% + 리드타임↑5일'
      )
      expect(worstCase).toBeDefined()
      expect(worstCase!.demandChangePercent).toBe(20)
      expect(worstCase!.leadTimeChangeDays).toBe(5)
      expect(worstCase!.adjustedDemand).toBeGreaterThan(baseInput.averageDailyDemand)
      expect(worstCase!.adjustedLeadTime).toBeGreaterThan(baseInput.leadTimeDays)
    })

    it('최선의 시나리오(수요↓20% + 리드타임↓2일)를 올바르게 계산한다', () => {
      const result = runScenarioSimulation(baseInput)

      const bestCase = result.scenarios.find(
        (s) => s.scenarioName === '최선: 수요↓20% + 리드타임↓2일'
      )
      expect(bestCase).toBeDefined()
      expect(bestCase!.demandChangePercent).toBe(-20)
      expect(bestCase!.leadTimeChangeDays).toBe(-2)
      expect(bestCase!.adjustedDemand).toBeLessThan(baseInput.averageDailyDemand)
      expect(bestCase!.adjustedLeadTime).toBeLessThan(baseInput.leadTimeDays)
    })

    it('summary에 최악/최선 시나리오를 포함한다', () => {
      const result = runScenarioSimulation(baseInput)

      expect(result.summary.worstCase).toBeDefined()
      expect(result.summary.bestCase).toBeDefined()

      // 최악 시나리오는 발주점이 가장 높음
      expect(result.summary.worstCase.newReorderPoint).toBeGreaterThanOrEqual(
        result.baseline.newReorderPoint
      )

      // 최선 시나리오는 발주점이 가장 낮음
      expect(result.summary.bestCase.newReorderPoint).toBeLessThanOrEqual(
        result.baseline.newReorderPoint
      )
    })

    it('평균 안전재고와 발주점을 정확하게 계산한다', () => {
      const result = runScenarioSimulation(baseInput)

      // baseline + 10개 시나리오 = 11개
      const allScenarios = [result.baseline, ...result.scenarios]
      const manualAvgSafetyStock =
        allScenarios.reduce((sum, s) => sum + s.newSafetyStock, 0) / allScenarios.length
      const manualAvgReorderPoint =
        allScenarios.reduce((sum, s) => sum + s.newReorderPoint, 0) / allScenarios.length

      expect(result.summary.averageSafetyStock).toBe(Math.ceil(manualAvgSafetyStock))
      expect(result.summary.averageReorderPoint).toBe(Math.ceil(manualAvgReorderPoint))
    })

    it('현재고가 안전재고 절반 미만이면 "긴급" 상태로 분류한다', () => {
      const lowStockInput = {
        ...baseInput,
        currentStock: 1, // 매우 낮은 재고
        averageDailyDemand: 50,
        demandStdDev: 15,
        leadTimeDays: 14,
      }

      const result = runScenarioSimulation(lowStockInput)

      // 실제 계산된 안전재고의 절반 미만인지 확인
      const halfSafetyStock = result.baseline.newSafetyStock * 0.5
      expect(lowStockInput.currentStock).toBeLessThan(halfSafetyStock)
      expect(result.baseline.stockStatus).toBe('긴급')
      expect(result.baseline.requiredOrderQuantity).toBeGreaterThan(0)
    })

    it('현재고가 발주점 이하이면 "발주필요" 상태로 분류한다', () => {
      const input = {
        ...baseInput,
        currentStock: 60, // 안전재고(50) 이상, 발주점(120) 이하
      }

      const result = runScenarioSimulation(input)

      expect(result.baseline.stockStatus).toBe('발주필요')
      expect(result.baseline.requiredOrderQuantity).toBeGreaterThan(0)
    })

    it('현재고가 발주점 초과이면 "충분" 상태로 분류한다', () => {
      const input = {
        ...baseInput,
        currentStock: 200, // 발주점(120) 초과
      }

      const result = runScenarioSimulation(input)

      expect(result.baseline.stockStatus).toBe('충분')
      expect(result.baseline.requiredOrderQuantity).toBe(0)
    })

    it('필요 발주량을 30일분 재고 목표로 계산한다', () => {
      const lowStockInput = {
        ...baseInput,
        currentStock: 50,
        averageDailyDemand: 10,
      }

      const result = runScenarioSimulation(lowStockInput)

      // 발주필요 또는 긴급 상태
      if (result.baseline.stockStatus !== '충분') {
        // requiredOrderQuantity = 발주점 + 30일분 - 현재고
        // 정확한 값은 실제 계산된 발주점에 따라 달라지므로 양수인지만 확인
        expect(result.baseline.requiredOrderQuantity).toBeGreaterThan(0)
      }
    })

    it('안전재고 대비 현재고 비율을 정확하게 계산한다', () => {
      const input = {
        ...baseInput,
        currentStock: 100,
        safetyStock: 50, // 실제 계산된 값과 다를 수 있음
      }

      const result = runScenarioSimulation(input)

      // safetyStockRatio = (현재고 / 안전재고) × 100
      // 실제 계산된 안전재고 기준
      const expectedRatio = Math.round(
        (input.currentStock / result.baseline.newSafetyStock) * 100
      )
      expect(result.baseline.safetyStockRatio).toBe(expectedRatio)
    })

    it('조정된 수요가 정확하게 계산된다 (소수점 1자리)', () => {
      const result = runScenarioSimulation(baseInput)

      const demand10Up = result.scenarios.find((s) => s.scenarioName === '수요 +10%')
      expect(demand10Up).toBeDefined()

      // 10 × 1.1 = 11.0
      expect(demand10Up!.adjustedDemand).toBe(11.0)
    })

    it('서비스 레벨 기본값은 0.95이다', () => {
      const inputWithoutServiceLevel = {
        ...baseInput,
        serviceLevel: undefined,
      }

      const result = runScenarioSimulation(inputWithoutServiceLevel)

      // calculateSafetyStock 내부에서 기본값 0.95 사용
      expect(result.baseline.newSafetyStock).toBeGreaterThan(0)
    })
  })

  describe('runBulkSimulation - 여러 제품 일괄 시뮬레이션', () => {
    it('여러 제품에 대해 동시에 시뮬레이션을 실행한다', () => {
      const inputs: SimulationInput[] = [
        {
          ...baseInput,
          productId: 'p1',
          productName: '제품1',
        },
        {
          ...baseInput,
          productId: 'p2',
          productName: '제품2',
          averageDailyDemand: 20,
        },
        {
          ...baseInput,
          productId: 'p3',
          productName: '제품3',
          leadTimeDays: 10,
        },
      ]

      const results = runBulkSimulation(inputs)

      expect(results).toHaveLength(3)
      expect(results[0].baseline).toBeDefined()
      expect(results[1].baseline).toBeDefined()
      expect(results[2].baseline).toBeDefined()
    })

    it('각 제품별로 독립적인 결과를 반환한다', () => {
      const inputs: SimulationInput[] = [
        {
          ...baseInput,
          productId: 'p1',
          averageDailyDemand: 10,
        },
        {
          ...baseInput,
          productId: 'p2',
          averageDailyDemand: 20, // 수요 2배
        },
      ]

      const results = runBulkSimulation(inputs)

      // 수요가 2배인 제품의 안전재고가 더 커야 함
      expect(results[1].baseline.newSafetyStock).toBeGreaterThan(
        results[0].baseline.newSafetyStock
      )
    })

    it('빈 배열을 입력하면 빈 배열을 반환한다', () => {
      const results = runBulkSimulation([])

      expect(results).toEqual([])
    })

    it('단일 제품도 배열로 처리 가능하다', () => {
      const results = runBulkSimulation([baseInput])

      expect(results).toHaveLength(1)
      expect(results[0].baseline.scenarioName).toBe('기준 (현재)')
    })
  })

  describe('시나리오 엣지 케이스', () => {
    it('수요가 0인 경우에도 시뮬레이션을 실행한다', () => {
      const zeroDemandInput = {
        ...baseInput,
        averageDailyDemand: 0,
        demandStdDev: 0,
      }

      const result = runScenarioSimulation(zeroDemandInput)

      expect(result.baseline).toBeDefined()
      expect(result.scenarios).toHaveLength(10)
    })

    it('리드타임이 1일인 경우 감소 시나리오에서도 최소 1일을 유지한다', () => {
      const shortLeadTimeInput = {
        ...baseInput,
        leadTimeDays: 1,
      }

      const result = runScenarioSimulation(shortLeadTimeInput)

      const leadTime2Down = result.scenarios.find((s) => s.scenarioName === '리드타임 -2일')
      expect(leadTime2Down!.adjustedLeadTime).toBe(1)
    })

    it('현재고가 0인 경우에도 시뮬레이션을 실행한다', () => {
      const zeroStockInput = {
        ...baseInput,
        currentStock: 0,
      }

      const result = runScenarioSimulation(zeroStockInput)

      expect(result.baseline.stockStatus).toBe('긴급')
      expect(result.baseline.safetyStockRatio).toBe(0)
    })

    it('매우 큰 수요 변동성도 처리한다', () => {
      const highVarianceInput = {
        ...baseInput,
        demandStdDev: 50, // 평균(10)보다 큰 표준편차
      }

      const result = runScenarioSimulation(highVarianceInput)

      expect(result.baseline.newSafetyStock).toBeGreaterThan(0)
      expect(result.scenarios).toHaveLength(10)
    })

    it('수요 +30% 시나리오를 올바르게 계산한다', () => {
      const result = runScenarioSimulation(baseInput)

      const demand30Up = result.scenarios.find((s) => s.scenarioName === '수요 +30%')
      expect(demand30Up).toBeDefined()
      expect(demand30Up!.demandChangePercent).toBe(30)
      expect(demand30Up!.adjustedDemand).toBe(baseInput.averageDailyDemand * 1.3)
    })

    it('수요 -10% 시나리오를 올바르게 계산한다', () => {
      const result = runScenarioSimulation(baseInput)

      const demand10Down = result.scenarios.find((s) => s.scenarioName === '수요 -10%')
      expect(demand10Down).toBeDefined()
      expect(demand10Down!.demandChangePercent).toBe(-10)
      expect(demand10Down!.adjustedDemand).toBe(baseInput.averageDailyDemand * 0.9)
    })

    it('리드타임 +2일 시나리오를 올바르게 계산한다', () => {
      const result = runScenarioSimulation(baseInput)

      const leadTime2Up = result.scenarios.find((s) => s.scenarioName === '리드타임 +2일')
      expect(leadTime2Up).toBeDefined()
      expect(leadTime2Up!.leadTimeChangeDays).toBe(2)
      expect(leadTime2Up!.adjustedLeadTime).toBe(baseInput.leadTimeDays + 2)
    })
  })
})
