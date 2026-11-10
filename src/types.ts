/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EquipmentCategory =
  | 'Optical & Microscopy'
  | 'Glassware & Measuring'
  | 'Heating & Thermal'
  | 'Balances & Analytical'
  | 'Safety & PPE';

export type SafetyStatusLevel = 'SAFE' | 'CAUTION' | 'UNSAFE';

export type EquipmentCondition = 'Good' | 'Fair' | 'Damaged';

export interface Equipment {
  id: number;
  qr_code: string;
  name: string;
  category: EquipmentCategory;
  image_url?: string;
  description: string;
  storage_compartment: string;
  total_qty: number;
  available_qty: number;
  unit: string;
  condition: EquipmentCondition;
  safety_level: 'SAFE' | 'CAUTION';
  prerequisites: string[];
  is_active: boolean;
  created_at: string;
}

export interface BasketItem {
  equipment_id: number;
  qr_code: string;
  name: string;
  category: EquipmentCategory;
  image_url?: string;
  storage_compartment: string;
  quantity: number;
  unit: string;
  safety_level: 'SAFE' | 'CAUTION';
  prerequisites: string[];
}

export interface CheckoutSession {
  session_token: string;
  basket_items: BasketItem[];
  qr_data_url?: string;
  mobile_url?: string;
  status: 'pending_student_info' | 'completed' | 'expired';
  created_at: string;
  expires_at: string;
  completed_transaction?: StudentTransactionLog;
}

export type TransactionStatus = 'Borrowed / In Lab' | 'Returned / Logged Out' | 'Overdue';

export interface StudentTransactionLog {
  id: number;
  transaction_code: string;
  student_name: string;
  student_id_lrn: string;
  grade_section: string;
  school_email: string;
  subject_activity: string;
  teacher_name: string;
  items: BasketItem[];
  total_items_count: number;
  safety_prerequisites_checked: string[];
  time_in: string;
  expected_return: string;
  time_out: string | null;
  return_condition: 'Good' | 'Damaged' | 'Missing' | null;
  return_notes: string;
  status: TransactionStatus;
}

export interface SafetyStatusState {
  level: SafetyStatusLevel;
  headline: string;
  message: string;
  updated_by: string;
  updated_at: string;
}

export interface LabStudentPreset {
  id: number;
  student_name: string;
  student_id_lrn: string;
  grade_section: string;
  school_email: string;
  default_subject: string;
  default_teacher: string;
}
