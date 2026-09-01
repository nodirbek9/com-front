// Every shape here is transcribed directly from the backend's Java records/DTO classes
// (uz.ithunter.crm.**.dto) — not guessed from convention. See the field-by-field notes inline
// where the backend itself documents something non-obvious.

export type UUID = string;

// ---- enums (mirrors the backend's own enums, verbatim) ----
export type RoleCode = 'ADMIN' | 'APPLICANT' | 'ACCOUNTANT' | 'HEAD_OF_CERTIFICATION_BODY'
  | 'DEPARTMENT_HEAD' | 'SPECIALIST' | 'OPERATOR';

export type ProcessingMode = 'TRADITIONAL' | 'EXPEDITED';

export type CaseStatus = 'REGISTERED' | 'PRIMARY_CHECK' | 'PRIMARY_CHECK_DONE' | 'IN_ACCOUNTING'
  | 'WAITING_PAYMENT' | 'IN_EXECUTION' | 'FINAL_REVIEW' | 'ON_SIGNING' | 'COMPLETED' | 'RETURNED' | 'REJECTED';

export type CaseStageStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED' | 'RETURNED' | 'CANCELLED';

export type StageType = 'PRIMARY_CHECK' | 'ROUTING' | 'ACCOUNTING' | 'PAYMENT_CONTROL' | 'EXECUTION'
  | 'ENDORSEMENT' | 'FINAL_REVIEW' | 'SIGNING' | 'COMPLETION' | 'NON_APPLICABILITY_OPINION';

export type PrimaryCheckCategory = 'RED' | 'YELLOW' | 'GREEN';

export type PrimaryCheckDecision = 'ACCEPTED' | 'RETURNED_TO_APPLICANT' | 'NON_APPLICABILITY_OPINION'
  | 'ROUTE_CHANGED' | 'REJECTED';

export type TaskStatus = 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED_FOR_REVIEW' | 'COMPLETED'
  | 'RETURNED_FOR_REVISION' | 'CANCELLED';

export type TaskResultStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SUPERSEDED' | 'REJECTED';

export type PaymentStatus = 'WAITING_PAYMENT' | 'PAID' | 'PARTIALLY_PAID' | 'DEBT' | 'NOT_CONFIRMED';

export type PriceCalculationStatus = 'ACTIVE' | 'SUPERSEDED' | 'CONFIRMED';
export type PriceCalculationTrigger = 'INITIAL' | 'MODE_CHANGED' | 'ITEMS_CHANGED' | 'MANUAL_RECALC';

export type ContractSentChannel = 'DIDOX' | 'OTHER';

export type DocumentStatus = 'DRAFT' | 'UNDER_ENDORSEMENT' | 'RETURNED_FOR_REVISION' | 'ENDORSED' | 'SIGNED' | 'CANCELLED';
export type DocumentVersionStatus = 'DRAFT' | 'UNDER_ENDORSEMENT' | 'ENDORSED' | 'REJECTED' | 'SUPERSEDED' | 'SIGNED';

export type ApprovalMode = 'SEQUENTIAL' | 'PARALLEL';
export type ApprovalRoundStatus = 'IN_PROGRESS' | 'COMPLETED_APPROVED' | 'COMPLETED_REJECTED' | 'CANCELLED';
export type ApprovalTaskStatus = 'SENT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
export type ParticipantKind = 'USER' | 'DEPARTMENT';

export type SubmissionChannel = 'PERSONAL_CABINET' | 'SINGLE_WINDOW' | 'OTHER_SERVICE' | 'PAPER';

// ---- shared envelope ----
export interface ErrorBody {
  timestamp: string; status: number; error: string; code: string; message: string;
  path: string; traceId: string; details: { field?: string; issue?: string }[];
}

/** API_SPEC.md 0's fixed shape. Some endpoints (audit, my-approvals) return a raw Spring Page
 *  instead (field `number` not `page`) — normalizePage() in api/client.ts reconciles both. */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ---- auth ----
export interface UserSummary { id: UUID; email: string; fullName: string; roles: RoleCode[] }
export interface TokenResponse { accessToken: string; refreshToken: string; expiresIn: number; user: UserSummary }
export interface CurrentUser {
  id: UUID; email: string; fullName: string; roles: RoleCode[]; permissions: string[];
  departmentId: UUID | null; applicantId: UUID | null;
}

// ---- applicant ----
export interface ApplicantResponse {
  id: UUID; type: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  lastName: string | null; firstName: string | null; middleName: string | null; birthDate: string | null;
  passportSeries: string | null; passportNumber: string | null; pinfl: string | null;
  orgName: string | null; tin: string | null; representativeFullName: string | null;
  representativePosition: string | null; powerOfAttorneyRef: string | null;
  address: string; phone: string; email: string;
  version: number; createdAt: string; updatedAt: string;
}

// ---- application ----
export interface ServiceSummary { id: UUID; code: string; name: string; submissionChannels: string[] }

export interface ApplicationSummary {
  id: UUID; number: string; applicantId: UUID; serviceId: UUID; submissionChannel: SubmissionChannel;
  status: string; submittedAt: string | null; registeredAt: string | null;
}
export interface ApplicationResponse extends ApplicationSummary {
  registeredById: UUID | null; formData: Record<string, unknown>; version: number;
  createdAt: string; updatedAt: string;
}

export interface CaseItemInput { name: string; quantity: number; unit: string; objectAddress?: string | null }

// ---- case ----
export interface CaseSummary {
  id: UUID; caseNumber: string; applicationNumber: string; applicantName: string | null;
  serviceName: string | null; status: CaseStatus; currentStageCode: string | null;
  currentStageName: string | null; parallelStages: number; processingMode: ProcessingMode | null;
  dueAt: string | null; overdue: boolean; createdAt: string;
}

export interface StageRef {
  id: UUID; code: string; name: string; stageType: StageType; internalStatusLabel: string | null;
  sequence: number; parallelGroup: string | null; required: boolean; status: CaseStageStatus;
  activatedAt: string | null; dueAt: string | null; overdue: boolean;
}

export interface CaseResponse {
  id: UUID; caseNumber: string; applicationNumber: string;
  applicant: { id: UUID; type: string; displayName: string; tin: string | null; phone: string | null } | null;
  service: { id: UUID; code: string; name: string } | null;
  status: CaseStatus; currentStage: StageRef | null; activeStages: StageRef[];
  primaryCheckCategory: PrimaryCheckCategory | null; primaryCheckDecision: PrimaryCheckDecision | null;
  processingMode: ProcessingMode | null;
  workflow: { id: UUID; code: string; version: number } | null;
  mainResponsibleDepartment: { id: UUID; code: string; name: string } | null;
  participatingDepartments: { id: UUID; code: string; name: string }[];
  dueAt: string | null; paymentDueAt: string | null; paymentOverdue: boolean;
  finance: { contractNumber: string | null; totalAmount: string | null; confirmedAmount: string | null; debtAmount: string | null; paymentStatus: string | null } | null;
  version: number; createdAt: string;
}

export interface StageTimelineItem {
  id: UUID; stageCode: string; stageName: string; stageType: StageType; internalStatusLabel: string | null;
  sequence: number; parallelGroup: string | null; required: boolean; status: CaseStageStatus;
  activatedAt: string | null; completedAt: string | null; dueAt: string | null; overdue: boolean; activationCount: number;
}

export interface ApplicantTracking {
  applicationNumber: string; submittedAt: string | null; serviceName: string | null;
  externalStage: { code: string; nameForApplicant: string } | null;
  contract: { number: string | null; date: string | null; actualAmount: string | null; currency: string | null } | null;
  payment: { status: PaymentStatus; confirmedAmount: string | null; debtAmount: string | null } | null;
  returnedForCorrection: { reason: string; remarks: string | null; dueDate: string | null } | null;
  finalDocument: { id: UUID; name: string; issuedAt: string } | null;
  notifications: { type: string; message: string; sentAt: string }[];
}

export interface CaseItem {
  id?: UUID; lineNo?: number; itemName: string; itemCode?: string | null;
  quantity: number; unit: string; objectAddress: string | null; attributes?: Record<string, unknown>;
}

export interface CommentResponse {
  id: UUID; caseId: UUID; documentVersionId: UUID | null; authorId: UUID; authorName: string | null;
  authorDepartmentId: UUID | null; visibility: 'INTERNAL'; body: string; createdAt: string;
}

// ---- task ----
export interface TaskSummary {
  id: UUID; caseId: UUID; caseStageId: UUID; title: string; assignedDepartmentId: UUID | null;
  assignedUserId: UUID | null; status: TaskStatus; processingMode: ProcessingMode | null;
  deadline: string | null; overdue: boolean; version: number;
}
export interface TaskResponse extends TaskSummary {
  workflowStageId: UUID; description: string | null; assignedById: UUID | null; assignedAt: string | null;
  startedAt: string | null; completedAt: string | null; revisionCount: number; createdAt: string;
}
export interface TaskResult {
  id: UUID; taskId: UUID; versionNo: number; payload: string; summary: string | null;
  status: TaskResultStatus; authorId: UUID; createdAt: string; supersedesId: UUID | null;
  revisionReason: string | null; approvedById: UUID | null; approvedAt: string | null;
}

// ---- finance ----
export interface PriceCalculation {
  id: UUID; calculationNo: number; processingMode: ProcessingMode; calculatedTotal: string; currency: string;
  triggerReason: PriceCalculationTrigger; status: PriceCalculationStatus; calculatedAt: string;
  lines: { lineNo: number; description: string; quantity: string; unitPrice: string; coefficient: string; lineTotal: string; caseItemId: UUID | null }[];
  supersededHistory: { id: UUID; calculationNo: number; processingMode: ProcessingMode; calculatedTotal: string; triggerReason: PriceCalculationTrigger; status: PriceCalculationStatus; calculatedAt: string }[];
  demoNotice: string | null;
}
export interface ContractResponse {
  id: UUID; caseId: UUID; contractNumber: string; contractDate: string;
  calculatedAmount: string; actualAmount: string | null; amountChangedById: UUID | null;
  amountChangedAt: string | null; amountChangeReason: string | null; currency: string;
  sent: boolean; sentAt: string | null; sentChannel: ContractSentChannel | null;
  invoiceReference: string | null; invoiceDate: string | null; version: number;
}
export interface PaymentResponse {
  id: UUID; caseId: UUID; status: PaymentStatus; contractAmount: string; confirmedAmount: string;
  debtAmount: string; waitingSince: string | null; dueAt: string | null; overdue: boolean;
  confirmations: { id: UUID; amount: string; confirmedById: UUID; confirmedAt: string; note: string | null; externalReference: string | null }[];
  version: number;
}

// ---- documents & approvals ----
export interface DocumentVersion {
  id: UUID; documentId: UUID; versionNo: number; contentRef: string; contentHash: string;
  fileName: string | null; mimeType: string | null; sizeBytes: number | null; fields: string | null;
  status: DocumentVersionStatus; createdById: UUID; createdAt: string; supersedesId: UUID | null;
  revisionReason: string | null; signedById: UUID | null; signedAt: string | null;
}
export interface DocumentSummary {
  id: UUID; caseId: UUID; documentType: string; title: string; status: DocumentStatus;
  currentVersionId: UUID | null; createdAt: string; updatedAt: string;
}
export interface DocumentResponse extends DocumentSummary { versions: DocumentVersion[] }

export interface ApprovalTaskResponse {
  id: UUID; approvalRoundId: UUID; participantKind: ParticipantKind; participantUserId: UUID | null;
  participantDepartmentId: UUID | null; required: boolean; sequenceNo: number; status: ApprovalTaskStatus;
  comment: string | null; decidedById: UUID | null; decidedAt: string | null; dueAt: string | null; createdAt: string;
}
export interface ApprovalRound {
  id: UUID; documentVersionId: UUID; caseId: UUID; mode: ApprovalMode; roundNo: number;
  status: ApprovalRoundStatus; initiatedById: UUID; initiatedAt: string; completedAt: string | null;
  tasks: ApprovalTaskResponse[];
}
/** GET /api/approvals/my rows: deliberately a lighter shape, no participant/round metadata — fetch
 *  the round (approvals.round) if you need sequenceNo/required/participantKind. */
export interface ApprovalTaskSummary {
  id: UUID; approvalRoundId: UUID; documentVersionId: UUID; caseId: UUID; status: ApprovalTaskStatus; createdAt: string;
}

// ---- audit ----
export interface AuditEntry {
  id: UUID; seq: number; caseId: UUID | null; taskId: UUID | null; userId: UUID | null;
  actorRoleCode: string | null; actorDepartmentId: UUID | null; action: string; entityType: string;
  entityId: UUID | null; oldValue: string | null; newValue: string | null; reason: string | null;
  ipAddress: string | null; createdAt: string;
}
export interface AuditIntegrity { intact: boolean; firstBrokenSeq: number | null }

// ---- performed work ----
export interface PerformedWork {
  id: UUID; caseId: UUID; workTypeId: UUID; caseStageId: UUID; workflowStageId: UUID; serviceId: UUID;
  departmentId: UUID; executorUserId: UUID; processingMode: ProcessingMode; performedAt: string;
  recordedAt: string; recordedById: UUID; supportingDocumentVersionId: UUID | null;
  invoiceReference: string | null; contractAmountBracket: string | null; countable: boolean;
}

// ---- admin ----
export interface NamedRef { id: UUID; code: string; name: string; active?: boolean }
export interface DepartmentRef extends NamedRef { parentId: UUID | null; headUserId: UUID | null }
export interface ExternalStageRef { id: UUID; code: string; nameForApplicant: string; sequence: number; active: boolean }
export interface ServiceRef extends NamedRef {
  description: string | null; contractRequired: boolean; paymentRequired: boolean;
  standaloneLaboratory: boolean; submissionChannels: string[];
}
export interface WorkTypeRef extends NamedRef {
  serviceScope: string | null; stageKind: string | null; requiresContractAmountBracket: boolean;
  basisDocumentDescription: string | null;
}
export interface AdminUser {
  id: UUID; email: string; fullName: string; departmentId: UUID | null; positionId: UUID | null;
  roles: RoleCode[]; status: string; version: number; createdAt: string; updatedAt: string;
}

// ---- workflow ----
export interface WorkflowSummary { id: UUID; serviceId: UUID; code: string; version: number; name: string; status: string }
