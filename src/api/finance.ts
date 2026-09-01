import { newIdempotencyKey, request } from './client';
import type { ContractResponse, PaymentResponse, PriceCalculation, ProcessingMode, UUID } from '@/types/api';

export const financeApi = {
  setMode: (caseId: UUID, mode: ProcessingMode) =>
    request<unknown>(`/api/accounting/cases/${caseId}/processing-mode`, { method: 'POST', body: { mode } }),
  calculate: (caseId: UUID) =>
    request<PriceCalculation>(`/api/accounting/cases/${caseId}/price/calculate`, {
      method: 'POST', idempotencyKey: newIdempotencyKey(),
    }),
  price: (caseId: UUID) => request<PriceCalculation>(`/api/accounting/cases/${caseId}/price`),
  confirmPrice: (caseId: UUID, actualAmount?: string, reason?: string) =>
    request<ContractResponse>(`/api/accounting/cases/${caseId}/price/confirm`, {
      method: 'POST', body: { actualAmount: actualAmount || null, reason: reason || null },
      idempotencyKey: newIdempotencyKey(),
    }),
  recordContract: (caseId: UUID, body: {
    contractNumber: string; contractDate: string; sentChannel: string; sentAt: string;
    invoiceReference?: string | null; invoiceDate?: string | null;
  }) => request<ContractResponse>(`/api/accounting/cases/${caseId}/contract`, { method: 'POST', body }),
  payment: (caseId: UUID) => request<PaymentResponse>(`/api/accounting/cases/${caseId}/payment`),
  confirmPayment: (caseId: UUID, body: { amount: string; externalReference?: string; note?: string }) =>
    request<PaymentResponse>(`/api/accounting/cases/${caseId}/payment/confirm`, {
      method: 'POST', body, idempotencyKey: newIdempotencyKey(),
    }),
  setPaymentStatus: (caseId: UUID, status: string, note: string) =>
    request<PaymentResponse>(`/api/accounting/cases/${caseId}/payment/status`, { method: 'POST', body: { status, note } }),
};
