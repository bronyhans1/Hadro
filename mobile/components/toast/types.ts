export type ToastVariant = "success" | "error" | "info";

export type ShowToastOptions = {
  message: string;
  subtitle?: string;
  variant?: ToastVariant;
  /** Auto-dismiss delay (default 5000ms). */
  durationMs?: number;
};

export type ToastItem = ShowToastOptions & {
  id: string;
  variant: ToastVariant;
  durationMs: number;
};
