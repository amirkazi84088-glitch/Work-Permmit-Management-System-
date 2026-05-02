// ============================================
// Core Models - Work Permit Management System
// ============================================

// --- Auth & User Models ---

export type UserRole =
  | 'WORKER'
  | 'SUPERVISOR'
  | 'SAFETY_OFFICER'
  | 'ADMIN'
  | 'PERMIT_APPROVER'
  | 'SUPER_ADMIN';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  organizationId?: number;
  organizationName?: string;
  departmentId?: number;
  departmentName?: string;
  employeeId?: string;
  profilePicture?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  tokenType?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface BackendLoginTokenResponse {
  token: string;
  tokenType?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// --- Organization Models ---

export type OrgStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL';

export interface Organization {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  industry?: string;
  status: OrgStatus;
  logoUrl?: string;
  maxUsers?: number;
  currentUsers?: number;
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Department {
  id: number;
  name: string;
  organizationId: number;
  managerId?: number;
  managerName?: string;
  isActive: boolean;
}

export interface PermitTypeOption {
  id: number;
  code?: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

// --- Work Permit Models ---

export type PermitStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_SUPERVISOR'
  | 'PENDING_SAFETY_OFFICER'
  | 'APPROVED'
  | 'ACTIVE'
  | 'CLOSURE_REQUESTED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PermitType =
  | 'HOT_WORK'
  | 'CONFINED_SPACE'
  | 'ELECTRICAL'
  | 'WORKING_AT_HEIGHT'
  | 'EXCAVATION'
  | 'CHEMICAL_HANDLING'
  | 'COLD_WORK'
  | 'GENERAL';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface WorkPermit {
  id: number;
  permitNumber: string;
  title: string;
  description: string;
  permitType: PermitType | string;
  permitTypeId?: number;
  permitTypeName?: string;
  status: PermitStatus;
  riskLevel?: RiskLevel;
  location?: string;
  workArea?: string;
  organizationId: number;
  organizationName?: string;
  departmentId?: number;
  departmentName?: string;
  requestedById: number;
  requestedByName: string;
  supervisorId?: number;
  supervisorName?: string;
  safetyOfficerId?: number;
  safetyOfficerName?: string;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedDuration?: string;
  workers?: PermitWorker[];
  equipment?: string[];
  hazards?: Hazard[];
  precautions?: Precaution[];
  attachments?: Attachment[];
  approvalHistory?: ApprovalRecord[];
  inspections?: Inspection[];
  closingRemarks?: string;
  rejectionReason?: string;
  submittedAt?: string;
  expiryAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PermitWorker {
  id: number;
  userId?: number;
  name: string;
  employeeId?: string;
  role?: string;
  certifications?: string[];
}

export interface Hazard {
  id?: number;
  description: string;
  severity: RiskLevel;
  mitigationMeasure: string;
}

export interface Precaution {
  id?: number;
  description: string;
  isCompleted?: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ApprovalRecord {
  id: number;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'CLOSED' | 'CANCELLED';
  performedById: number;
  performedByName: string;
  performedByRole: UserRole;
  comment?: string;
  timestamp: string;
}

// --- Inspection Models ---

export type InspectionResult = 'PASSED' | 'FAILED' | 'CONDITIONAL';

export interface Inspection {
  id: number;
  permitId: number;
  permitNumber?: string;
  inspectedById: number;
  inspectedByName: string;
  inspectionDate: string;
  result: InspectionResult;
  findings: string;
  recommendations?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  attachments?: Attachment[];
}

// --- Notification Models ---

export type NotificationType =
  | 'PERMIT_SUBMITTED'
  | 'PERMIT_APPROVED'
  | 'PERMIT_REJECTED'
  | 'PERMIT_EXPIRED'
  | 'INSPECTION_DUE'
  | 'SYSTEM_ALERT';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: number;
  relatedEntityType?: string;
  createdAt: string;
}

// --- API Response Models ---

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface PermitFilter extends PageRequest {
  status?: PermitStatus;
  permitType?: PermitType;
  riskLevel?: RiskLevel;
  search?: string;
  startDate?: string;
  endDate?: string;
  organizationId?: number;
  departmentId?: number;
  requestedById?: number;
}

export interface UserFilter extends PageRequest {
  role?: UserRole;
  organizationId?: number;
  isActive?: boolean;
  search?: string;
}

// --- Dashboard Models ---

export interface DashboardStats {
  totalPermits: number;
  pendingPermits: number;
  activePermits: number;
  approvedToday: number;
  rejectedTotal: number;
  expiringSoon: number;
  complianceRate: number;
  permitsByType: Record<string, number>;
  permitsByStatus: Record<string, number>;
  recentActivity: ActivityItem[];
  role?: string;
  cards?: Array<{ title: string; value: number }>;
}

export interface ActivityItem {
  id: number;
  description: string;
  timestamp: string;
  user: string;
  type: string;
  entityId?: number;
  entityType?: string;
}

export interface AuditLogEntry {
  id: number;
  userEmail?: string;
  module: string;
  action: string;
  entityId?: number;
  loggedAt: string;
}

// --- Create / Update Request Models ---

export interface CreatePermitRequest {
  title: string;
  description: string;
  permitType: PermitType;
  riskLevel: RiskLevel;
  location: string;
  workArea?: string;
  departmentId?: number;
  startDate: string;
  endDate: string;
  estimatedDuration?: string;
  workers?: Omit<PermitWorker, 'id'>[];
  equipment?: string[];
  hazards?: Omit<Hazard, 'id'>[];
  precautions?: Omit<Precaution, 'id'>[];
}

export interface ApprovalRequest {
  permitId: number;
  action: 'APPROVE' | 'REJECT' | 'RETURN';
  comment?: string;
}

export interface ClosePermitRequest {
  permitId: number;
  closingRemarks: string;
  actualEndDate?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  organizationId?: number;
  departmentId?: number;
  employeeId?: string;
  password?: string;
  isActive?: boolean;
}
