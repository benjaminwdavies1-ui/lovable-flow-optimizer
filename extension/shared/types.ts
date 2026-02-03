// Chrome Extension Shared Types

export interface ClickPosition {
  x: number;
  y: number;
}

export interface ClickedElement {
  text: string;
  tagName: string;
  type?: string;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  className?: string;
  selector?: string;
}

export interface CapturedStep {
  id: string;
  orderNumber: number;
  actionType: ActionType;
  instructionText: string;
  screenshotDataUrl?: string;
  screenshotUrl?: string;
  clickPosition?: ClickPosition;
  clickedElement?: ClickedElement;
  url?: string;
  timestamp: number;
  hasWarning: boolean;
  warningText?: string;
  isRedacted: boolean;
}

export type ActionType = "click" | "type" | "navigate" | "scroll" | "custom";

export interface RecordingSession {
  id: string;
  title: string;
  startTime: number;
  steps: CapturedStep[];
  isRecording: boolean;
  isPaused: boolean;
}

// Message types for communication between components
export type MessageType =
  | "START_RECORDING"
  | "STOP_RECORDING"
  | "PAUSE_RECORDING"
  | "RESUME_RECORDING"
  | "CAPTURE_STEP"
  | "STEP_CAPTURED"
  | "GET_SESSION"
  | "SESSION_UPDATE"
  | "CAPTURE_SCREENSHOT"
  | "SCREENSHOT_CAPTURED"
  | "AUTH_STATE_CHANGE"
  | "SYNC_TO_CLOUD";

export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload?: T;
  tabId?: number;
}

export interface StartRecordingPayload {
  title: string;
  userId: string;
}

export interface CaptureStepPayload {
  actionType: ActionType;
  clickPosition?: ClickPosition;
  clickedElement?: ClickedElement;
  url: string;
}

export interface ScreenshotCapturedPayload {
  stepId: string;
  dataUrl: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userId?: string;
  accessToken?: string;
}

// Storage keys for chrome.storage
export const STORAGE_KEYS = {
  SESSION: "opstrace_session",
  AUTH: "opstrace_auth",
  PENDING_STEPS: "opstrace_pending_steps",
} as const;
