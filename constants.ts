
import { UnitKey, FormDataState } from './types';

export const UNITS: UnitKey[] = ['SUR', 'KDC', 'CKU', 'EMB', 'LMN'];

export const INITIAL_UNIT_DATA = { orderValue: 0, dispatchValue: 0 };

export const INITIAL_FORM_STATE: FormDataState = {
  SUR: { ...INITIAL_UNIT_DATA },
  KDC: { ...INITIAL_UNIT_DATA },
  CKU: { ...INITIAL_UNIT_DATA },
  EMB: { ...INITIAL_UNIT_DATA },
  LMN: { ...INITIAL_UNIT_DATA },
};

export const GOOGLE_SHEET_ID = "1j7zhkwKZYAufxkwsEUBHnauqMowQ_IPaQT5sVYFpT2w";
