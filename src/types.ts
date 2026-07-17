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
    { category: 'Structure', item: 'Main Frame Alignment' },
    { category: 'Structure', item: 'Bolt Tightening Torque' },
    { category: 'Moving Parts', item: 'Bearing Lubrication' },
    { category: 'Moving Parts', item: 'Belt Tension' },
  ],
  Hydraulic: [
    { category: 'Pressure', item: 'Main Pump Pressure' },
    { category: 'Pressure', item: 'Accumulator Charge' },
    { category: 'Leaking', item: 'Cylinder Seal Check' },
    { category: 'Leaking', item: 'Hose Connection Integrity' },
  ],
  Automation: [
    { category: 'Control', item: 'PLC Communication Status' },
    { category: 'Control', item: 'Emergency Stop Function' },
    { category: 'Sensor', item: 'Proximity Sensor Calibration' },
    { category: 'Sensor', item: 'Vision System Accuracy' },
  ],
};
