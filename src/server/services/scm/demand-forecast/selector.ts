/**
 * 예측 방법 자동 선택 알고리즘
 *
 * 선택 로직:
 * 1. 데이터 기간 확인
 * 2. XYZ 등급 고려
 * 3. 추세 존재 여부 확인
 * 4. 복수 방법 비교 후 최적 선택
 */

import { ForecastInput, ForecastResult, ForecastMetadata, ForecastMethod } from "./types";
import { smaMethod } from "./methods/simple-moving-average";
import { sesMethod, sesMethodWithGrade } from "./methods/exponential-smoothing";
import { holtsMethod_auto, detectTrend } from "./methods/holts-method";
import { calculateMAPE } from "./accuracy/metrics";

/**
 * 메타데이터 추출
 *
 * @param input 예측 입력
 * @returns 메타데이터
 */
function extractMetadata(input: ForecastInput): ForecastMetadata {
  const dataMonths = input.history.length;
  const values = input.history.map((d) => d.value);
  const hasTrend = detectTrend(values);

  return {
    dataMonths,
    xyzGrade: input.xyzGrade,
    hasTrend,
  };
}

/**
 * 사용 가능한 예측 방법 목록 반환
 *
 * @param metadata 메타데이터
 * @returns 사용 가능한 방법 배열
 */
function getAvailableMethods(metadata: ForecastMetadata): ForecastMethod[] {
  const methods: ForecastMethod[] = [];

  // SMA: 항상 사용 가능 (최소 1개 데이터)
  if (metadata.dataMonths >= smaMethod.minDataPoints) {
    methods.push(smaMethod);
  }

  // SES: 3개월 이상
  if (metadata.dataMonths >= sesMethod.minDataPoints) {
    // XYZ 등급이 있으면 등급 기반 SES 사용
    if (metadata.xyzGrade) {
      methods.push(sesMethodWithGrade(metadata.xyzGrade));
    } else {
      methods.push(sesMethod);
    }
  }

  // Holt's: 6개월 이상 && 추세 있음
  if (metadata.dataMonths >= holtsMethod_auto.minDataPoints && metadata.hasTrend) {
    methods.push(holtsMethod_auto);
  }

  return methods;
}

/**
 * 교차 검증을 통한 방법 비교
 *
 * @param history 판매 이력
 * @param methods 비교할 방법들
 * @param testSize 테스트 셋 크기
 * @returns 각 방법의 MAPE
 */
function crossValidateMethods(
  history: number[],
  methods: ForecastMethod[],
  testSize: number = 3
): { method: ForecastMethod; mape: number }[] {
  if (history.length < testSize + 3) {
    // 데이터 부족: MAPE 계산 불가, 모두 동일 점수
    return methods.map((method) => ({ method, mape: 999 }));
  }

  const trainData = history.slice(0, -testSize);
  const testData = history.slice(-testSize);

  return methods.map((method) => {
    try {
      const result = method.forecast(trainData, testSize);
      const mape = calculateMAPE(testData, result.forecast);
      return { method, mape: isFinite(mape) ? mape : 999 };
    } catch {
      return { method, mape: 999 };
    }
  });
}

/**
 * 최적 예측 방법 선택 (자동)
 *
 * @param input 예측 입력
 * @returns 선택된 방법 및 예측 결과
 */
export function selectBestMethod(input: ForecastInput): ForecastResult {
  const metadata = extractMetadata(input);
  const values = input.history.map((d) => d.value);

  // 1. 사용 가능한 방법 필터링
  const availableMethods = getAvailableMethods(metadata);

  if (availableMethods.length === 0) {
    // 데이터가 전혀 없는 경우: 0 반환
    return {
      method: "SMA",
      parameters: {},
      forecast: Array(input.periods).fill(0),
      mape: 999,
      confidence: "low",
    };
  }

  // 2. 방법이 1개면 바로 사용
  if (availableMethods.length === 1) {
    const result = availableMethods[0].forecast(values, input.periods);
    result.confidence = "medium";
    return result;
  }

  // 3. 교차 검증으로 최적 방법 선택
  const validationResults = crossValidateMethods(values, availableMethods);

  // MAPE 기준 정렬 (오름차순)
  validationResults.sort((a, b) => a.mape - b.mape);

  // XYZ 등급별 조정
  if (metadata.xyzGrade === "Z") {
    // Z등급(불규칙 수요): 단순 방법 선호
    const simpleMethod = validationResults.find(
      (r) => r.method.name === "SMA" || r.method.name === "SES"
    );
    // 최적 방법 MAPE의 1.2배 이내면 단순 방법 선택
    if (simpleMethod && simpleMethod.mape < validationResults[0].mape * 1.2) {
      const result = simpleMethod.method.forecast(values, input.periods);
      result.mape = simpleMethod.mape;
      result.confidence = simpleMethod.mape < 30 ? "medium" : "low";
      return result;
    }
  }

  // 4. 최적 방법 사용
  const bestMethod = validationResults[0].method;
  const result = bestMethod.forecast(values, input.periods);
  result.mape = validationResults[0].mape;

  // 신뢰도 등급 부여
  if (result.mape < 15) {
    result.confidence = "high";
  } else if (result.mape < 30) {
    result.confidence = "medium";
  } else {
    result.confidence = "low";
  }

  return result;
}

/**
 * 규칙 기반 방법 선택 (교차 검증 없이)
 *
 * @param metadata 메타데이터
 * @returns 권장 방법 이름
 */
export function selectMethodByRules(metadata: ForecastMetadata): ForecastMethod {
  const { dataMonths, xyzGrade, hasTrend } = metadata;

  // 데이터 부족 (< 3개월): SMA
  if (dataMonths < 3) {
    return smaMethod;
  }

  // 데이터 중간 (3~6개월)
  if (dataMonths < 6) {
    // XYZ 등급별
    if (xyzGrade === "X") return sesMethodWithGrade("X");
    if (xyzGrade === "Z") return smaMethod;
    return sesMethod;
  }

  // 데이터 충분 (6개월 이상)
  if (hasTrend && dataMonths >= 6) {
    // 추세 있으면 Holt's
    return holtsMethod_auto;
  }

  // XYZ 등급별 선택
  if (xyzGrade === "X") return sesMethodWithGrade("X");
  if (xyzGrade === "Y") return hasTrend ? holtsMethod_auto : sesMethod;
  if (xyzGrade === "Z") return smaMethod;

  // 기본: SES
  return sesMethod;
}
