
export type UnitKey = 'SUR' | 'KDC' | 'CKU' | 'EMB' | 'LMN';

export interface UnitData {
  orderValue: number;
  dispatchValue: number;
}

export type FormDataState = Record<UnitKey, UnitData>;

export interface SubmissionPayload {
  id: string; // Unique ID for local tracking
  date: string;
  units: FormDataState;
  totalOrder: number;
  totalDispatch: number;
}

export type TimeFilter = 'month' | 'year' | 'all';

export interface DashboardFilters {
  unit: UnitKey | 'ALL';
  range: TimeFilter;
  selectedMonth?: number;
  selectedYear?: number;
}

export interface GeminiAuditResponse {
  summary: string;
  insights: string[];
  status: 'normal' | 'warning' | 'excellent';
}
