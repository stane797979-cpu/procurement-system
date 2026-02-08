
import {
  performABCAnalysis,
  performXYZAnalysis,
  combineABCXYZ,
  getABCXYZGrade,
  type ABCAnalysisItem,
  type XYZAnalysisItem,
} from '@/server/services/scm/abc-xyz-analysis'

describe('ABC-XYZ 분석', () => {
  describe('performABCAnalysis', () => {
    it('A/B/C 등급을 누적 비율로 정확히 분류한다', () => {
      const items: ABCAnalysisItem[] = [
        { id: '1', name: '제품1', value: 500 }, // 50% → A
        { id: '2', name: '제품2', value: 300 }, // 80% → A
        { id: '3', name: '제품3', value: 150 }, // 95% → B
        { id: '4', name: '제품4', value: 50 },  // 100% → C
      ]

      const results = performABCAnalysis(items)

      expect(results[0].grade).toBe('A')
      expect(results[1].grade).toBe('A')
      expect(results[2].grade).toBe('B')
      expect(results[3].grade).toBe('C')
    })

    it('값 기준으로 내림차순 정렬한다', () => {
      const items: ABCAnalysisItem[] = [
        { id: '1', name: '제품1', value: 100 },
        { id: '2', name: '제품2', value: 500 },
        { id: '3', name: '제품3', value: 300 },
      ]

      const results = performABCAnalysis(items)

      expect(results[0].value).toBe(500)
      expect(results[1].value).toBe(300)
      expect(results[2].value).toBe(100)
    })

    it('빈 배열 시 빈 결과를 반환한다', () => {
      const items: ABCAnalysisItem[] = []

      const results = performABCAnalysis(items)

      expect(results).toEqual([])
    })

    it('모든 값이 0이면 전부 C등급으로 분류한다', () => {
      const items: ABCAnalysisItem[] = [
        { id: '1', name: '제품1', value: 0 },
        { id: '2', name: '제품2', value: 0 },
        { id: '3', name: '제품3', value: 0 },
      ]

      const results = performABCAnalysis(items)

      results.forEach((result) => {
        expect(result.grade).toBe('C')
      })
    })

    it('누적 비율이 정확히 계산된다', () => {
      const items: ABCAnalysisItem[] = [
        { id: '1', name: '제품1', value: 60 },
        { id: '2', name: '제품2', value: 30 },
        { id: '3', name: '제품3', value: 10 },
      ]

      const results = performABCAnalysis(items)

      expect(results[0].cumulativePercentage).toBeCloseTo(0.6, 2)
      expect(results[1].cumulativePercentage).toBeCloseTo(0.9, 2)
      expect(results[2].cumulativePercentage).toBeCloseTo(1.0, 2)
    })

    it('rank가 순서대로 부여된다', () => {
      const items: ABCAnalysisItem[] = [
        { id: '1', name: '제품1', value: 100 },
        { id: '2', name: '제품2', value: 200 },
        { id: '3', name: '제품3', value: 150 },
      ]

      const results = performABCAnalysis(items)

      expect(results[0].rank).toBe(1)
      expect(results[1].rank).toBe(2)
      expect(results[2].rank).toBe(3)
    })

    it('커스텀 임계값을 적용한다', () => {
      const items: ABCAnalysisItem[] = [
        { id: '1', name: '제품1', value: 700 },
        { id: '2', name: '제품2', value: 200 },
        { id: '3', name: '제품3', value: 100 },
      ]

      // A: 70%, B: 90%
      const results = performABCAnalysis(items, { a: 0.7, b: 0.9 })

      expect(results[0].grade).toBe('A')
      expect(results[1].grade).toBe('B')
      expect(results[2].grade).toBe('C')
    })
  })

  describe('performXYZAnalysis', () => {
    it('CV에 따라 X/Y/Z 등급을 정확히 분류한다', () => {
      const items: XYZAnalysisItem[] = [
        { id: '1', name: '제품1', demandHistory: [100, 101, 99, 100] },   // CV ≈ 0.008 < 0.5 → X
        { id: '2', name: '제품2', demandHistory: [50, 150, 30, 170] },    // CV ≈ 0.7 → Y
        { id: '3', name: '제품3', demandHistory: [0, 300, 0, 400] },      // CV ≥ 1.0 → Z
      ]

      const results = performXYZAnalysis(items)

      expect(results[0].grade).toBe('X')
      expect(results[1].grade).toBe('Y')
      expect(results[2].grade).toBe('Z')
    })

    it('평균과 표준편차를 정확히 계산한다', () => {
      const items: XYZAnalysisItem[] = [
        { id: '1', name: '제품1', demandHistory: [100, 200, 300] },
      ]

      const results = performXYZAnalysis(items)

      // 평균 = (100 + 200 + 300) / 3 = 200
      expect(results[0].averageDemand).toBe(200)

      // 표준편차 = √(((100-200)² + (200-200)² + (300-200)²) / 3)
      //          = √((10000 + 0 + 10000) / 3) = √6666.67 ≈ 81.65
      expect(results[0].stdDev).toBeCloseTo(81.65, 1)

      // CV = 81.65 / 200 ≈ 0.41
      expect(results[0].coefficientOfVariation).toBeCloseTo(0.41, 1)
    })

    it('평균이 0이면 Z등급으로 분류한다', () => {
      const items: XYZAnalysisItem[] = [
        { id: '1', name: '제품1', demandHistory: [0, 0, 0] },
      ]

      const results = performXYZAnalysis(items)

      expect(results[0].grade).toBe('Z')
      expect(results[0].coefficientOfVariation).toBe(999)
    })

    it('수요가 완전히 안정적이면 X등급이다', () => {
      const items: XYZAnalysisItem[] = [
        { id: '1', name: '제품1', demandHistory: [100, 100, 100, 100] },
      ]

      const results = performXYZAnalysis(items)

      expect(results[0].grade).toBe('X')
      expect(results[0].coefficientOfVariation).toBe(0)
    })

    it('커스텀 임계값을 적용한다', () => {
      const items: XYZAnalysisItem[] = [
        { id: '1', name: '제품1', demandHistory: [100, 120, 80, 110] },
      ]

      // X: 0.3, Y: 0.8
      const results = performXYZAnalysis(items, { x: 0.3, y: 0.8 })

      const cv = results[0].coefficientOfVariation
      if (cv < 0.3) {
        expect(results[0].grade).toBe('X')
      } else if (cv < 0.8) {
        expect(results[0].grade).toBe('Y')
      } else {
        expect(results[0].grade).toBe('Z')
      }
    })

    it('빈 이력 시 평균 0으로 처리한다', () => {
      const items: XYZAnalysisItem[] = [
        { id: '1', name: '제품1', demandHistory: [] },
      ]

      const results = performXYZAnalysis(items)

      expect(results[0].averageDemand).toBe(0)
      expect(results[0].grade).toBe('Z')
    })
  })

  describe('combineABCXYZ', () => {
    it('ABC와 XYZ를 결합하여 9개 복합 등급을 생성한다', () => {
      const abcResults = [
        { id: '1', name: '제품1', value: 500, cumulativePercentage: 0.5, grade: 'A' as const, rank: 1 },
        { id: '2', name: '제품2', value: 300, cumulativePercentage: 0.8, grade: 'A' as const, rank: 2 },
      ]

      const xyzResults = [
        { id: '1', name: '제품1', averageDemand: 100, stdDev: 10, coefficientOfVariation: 0.1, grade: 'X' as const },
        { id: '2', name: '제품2', averageDemand: 100, stdDev: 60, coefficientOfVariation: 0.6, grade: 'Y' as const },
      ]

      const results = combineABCXYZ(abcResults, xyzResults)

      expect(results[0].combinedGrade).toBe('AX')
      expect(results[1].combinedGrade).toBe('AY')
    })

    it('우선순위를 정확히 할당한다', () => {
      const abcResults = [
        { id: '1', name: '제품1', value: 500, cumulativePercentage: 0.5, grade: 'A' as const, rank: 1 },
        { id: '2', name: '제품2', value: 100, cumulativePercentage: 1.0, grade: 'C' as const, rank: 2 },
      ]

      const xyzResults = [
        { id: '1', name: '제품1', averageDemand: 100, stdDev: 10, coefficientOfVariation: 0.1, grade: 'X' as const },
        { id: '2', name: '제품2', averageDemand: 100, stdDev: 150, coefficientOfVariation: 1.5, grade: 'Z' as const },
      ]

      const results = combineABCXYZ(abcResults, xyzResults)

      // AX: 최고 우선순위 1
      expect(results[0].priority).toBe(1)

      // CZ: 최저 우선순위 9
      expect(results[1].priority).toBe(9)
    })

    it('관리 전략을 매칭한다', () => {
      const abcResults = [
        { id: '1', name: '제품1', value: 500, cumulativePercentage: 0.5, grade: 'A' as const, rank: 1 },
      ]

      const xyzResults = [
        { id: '1', name: '제품1', averageDemand: 100, stdDev: 10, coefficientOfVariation: 0.1, grade: 'X' as const },
      ]

      const results = combineABCXYZ(abcResults, xyzResults)

      expect(results[0].strategy).toContain('JIT')
    })

    it('XYZ 결과에 없는 항목은 제외한다', () => {
      const abcResults = [
        { id: '1', name: '제품1', value: 500, cumulativePercentage: 0.5, grade: 'A' as const, rank: 1 },
        { id: '2', name: '제품2', value: 300, cumulativePercentage: 0.8, grade: 'B' as const, rank: 2 },
      ]

      const xyzResults = [
        { id: '1', name: '제품1', averageDemand: 100, stdDev: 10, coefficientOfVariation: 0.1, grade: 'X' as const },
      ]

      const results = combineABCXYZ(abcResults, xyzResults)

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('1')
    })
  })

  describe('getABCXYZGrade', () => {
    it('단일 품목의 ABC-XYZ 등급을 계산한다', () => {
      const result = getABCXYZGrade(
        500,        // value
        1000,       // totalValue
        0,          // cumulativeValueBefore
        [100, 101, 99, 100] // demandHistory (안정)
      )

      expect(result.abc).toBe('A')
      expect(result.xyz).toBe('X')
      expect(result.combined).toBe('AX')
    })

    it('누적 비율로 ABC 등급을 정확히 계산한다', () => {
      // 80% 경계
      const resultA = getABCXYZGrade(800, 1000, 0, [100])
      expect(resultA.abc).toBe('A')

      // 95% 경계
      const resultB = getABCXYZGrade(150, 1000, 800, [100])
      expect(resultB.abc).toBe('B')

      // 100%
      const resultC = getABCXYZGrade(50, 1000, 950, [100])
      expect(resultC.abc).toBe('C')
    })

    it('변동계수로 XYZ 등급을 정확히 계산한다', () => {
      // X: CV < 0.5
      const resultX = getABCXYZGrade(100, 100, 0, [100, 101, 99, 100])
      expect(resultX.xyz).toBe('X')

      // Y: 0.5 ≤ CV < 1.0
      const resultY = getABCXYZGrade(100, 100, 0, [50, 150, 30, 170])
      expect(resultY.xyz).toBe('Y')

      // Z: CV ≥ 1.0
      const resultZ = getABCXYZGrade(100, 100, 0, [0, 300, 0, 400])
      expect(resultZ.xyz).toBe('Z')
    })

    it('커스텀 임계값을 적용한다', () => {
      const result = getABCXYZGrade(
        700,
        1000,
        0,
        [100, 110, 90, 105],
        {
          abc: { a: 0.7, b: 0.9 },
          xyz: { x: 0.3, y: 0.8 },
        }
      )

      expect(result.abc).toBe('A')
      expect(['X', 'Y', 'Z']).toContain(result.xyz)
    })
  })
})
