/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ReportStatus = 'DRAFT' | 'PENDING' | 'REJECTED' | 'APPROVED';

export interface InspectionItem {
  id: string;
  category: string;
  item: string;
  result: 'PASS' | 'FAIL' | 'N/A';
  observation: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'Mechanical' | 'Hydraulic' | 'Automation';
  inspector: string;
  date: string;
  items: InspectionItem[];
  status: ReportStatus;
  comments: string[];
  version: number;
}

export const TEMPLATES = {
  Mechanical: [
    { category: '구조', item: '메인 프레임 정렬 상태' },
    { category: '구조', item: '볼트 체결 토크 확인' },
    { category: '구동부', item: '베어링 윤활 상태' },
    { category: '구동부', item: '벨트 장력 측정' },
  ],
  Hydraulic: [
    { category: '압력', item: '메인 펌프 작동 압력' },
    { category: '압력', item: '어큐뮬레이터 충진 상태' },
    { category: '누유', item: '실린더 씰 점검' },
    { category: '누유', item: '호스 연결부 기밀성' },
  ],
  Automation: [
    { category: '제어', item: 'PLC 통신 연결 상태' },
    { category: '제어', item: '비상 정지 기능 작동 여부' },
    { category: '센서', item: '근접 센서 교정 상태' },
    { category: '센서', item: '비전 시스템 측정 정밀도' },
  ],
};
