export const statusTones = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info text-info-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
  pending: "bg-muted text-muted-foreground border-dashed border-control-border",
} as const;
export type StatusTone = keyof typeof statusTones;
// Presentation only. Authorization continues to use domain capabilities.
export const businessStatusTone: Record<string, StatusTone> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  REVOKED: "danger",
  PENDING: "pending",
  INACTIVE: "neutral",
};
