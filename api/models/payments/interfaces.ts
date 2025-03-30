export interface TransactionRecord {
  patientid?: number;
  from?: string;
  to?: string;
  count?: number;
  page?: number;
}

export interface BillingInfo {
  total: number;
  paid: number;
}

export interface TransactionData {
  billingid: number;
  patientid: number;
}

export interface ClientDebtTransaction {
  date: string;
  billingid: number;
  outstanding: number;
  paid: number;
  payable: number;
  discount: number;
}
