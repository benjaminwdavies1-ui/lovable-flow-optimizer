import React, { useState, useEffect, useCallback } from "react";
import type { RecordingSession, CapturedStep, AuthState } from "../shared/types";
import { sendToBackground } from "../shared/messaging";
import {
  supabase,
  setAuthFromStorage,
  createRecording,
  createStep,
  updateRecordingStatus,
  uploadScreenshot,
} from "../shared/supabase";
// Icons as inline SVGs for the extension
const PlayIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
  </svg>
);

const SquareIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

const PauseIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const SaveIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const TrashIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const HomeIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const VideoIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

export function SidebarApp() {
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("Untitled Recording");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [cloudRecordingId, setCloudRecordingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");

  // Load session and auth state on mount
  useEffect(() => {
    loadSession();
    loadAuthState();
    
    // Listen for step captures from background
    const handleMessage = (message: { type: string; payload?: { step?: CapturedStep } }) => {
      if (message.type === "STEP_CAPTURED" && message.payload?.step) {
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            steps: [...prev.steps, message.payload!.step!],
          };
        });
      }
    };
    
    // Listen for storage changes as a reliable fallback for session updates
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === "local" && changes.opstrace_session?.newValue) {
        const updatedSession = changes.opstrace_session.newValue as RecordingSession;
        console.log("[Sidebar] Session updated via storage:", updatedSession.isRecording, updatedSession.steps.length);
        setSession(updatedSession);
      }
    };
    
    chrome.runtime.onMessage.addListener(handleMessage);
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (session?.isRecording && !session.isPaused) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session?.isRecording, session?.isPaused]);

  const loadSession = async () => {
    const result = await chrome.storage.local.get("opstrace_session");
    if (result.opstrace_session) {
      setSession(result.opstrace_session);
      if (result.opstrace_session.startTime) {
        const elapsed = Math.floor((Date.now() - result.opstrace_session.startTime) / 1000);
        setElapsedTime(elapsed);
      }
    }
  };

  const loadAuthState = async () => {
    // Try to set auth from storage first
    const hasAuth = await setAuthFromStorage();
    if (hasAuth) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.id);
        return;
      }
    }
    
    // Fallback to storage check
    const result = await chrome.storage.sync.get("opstrace_auth");
    if (result.opstrace_auth) {
      setIsAuthenticated(result.opstrace_auth.isAuthenticated);
      setUserId(result.opstrace_auth.userId || null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    console.log("[Sidebar] Starting recording...");
    
    // Start recording in background
    let response: { success?: boolean; session?: RecordingSession } | undefined;
    try {
      response = await sendToBackground<{ title: string; userId: string }, { success: boolean; session: RecordingSession }>(
        "START_RECORDING",
        { title, userId: userId || "anonymous" }
      );
      console.log("[Sidebar] Background response:", response);
    } catch (err) {
      console.error("[Sidebar] sendToBackground threw:", err);
    }
    
    if (response?.success && response.session) {
      setSession(response.session);
      setElapsedTime(0);
    } else {
      // Fallback: wait briefly then check storage directly
      console.warn("[Sidebar] No response from background, checking storage...");
      await new Promise((r) => setTimeout(r, 500));
      const stored = await chrome.storage.local.get("opstrace_session");
      if (stored.opstrace_session?.isRecording) {
        console.log("[Sidebar] Found session in storage, using it");
        setSession(stored.opstrace_session);
        setElapsedTime(0);
      } else {
        console.error("[Sidebar] Recording failed to start");
        return;
      }
    }

    // Then try cloud sync (non-blocking)
    if (isAuthenticated && userId) {
      setSyncStatus("syncing");
      try {
        const cloudRecording = await createRecording(title, userId);
        if (cloudRecording) {
          setCloudRecordingId(cloudRecording.id);
          setSyncStatus("synced");
        } else {
          setSyncStatus("error");
        }
      } catch (err) {
        console.warn("[Sidebar] Cloud sync failed:", err);
        setSyncStatus("error");
      }
    }
  };

  const stopRecording = async () => {
    console.log("[Sidebar] Stopping recording...");
    
    // Optimistic UI update — stop immediately regardless of background response
    const stoppedSession: RecordingSession = {
      ...(session || { id: "", title, startTime: Date.now(), steps: [] }),
      isRecording: false,
      isPaused: false,
    };
    setSession(stoppedSession);
    await chrome.storage.local.set({ opstrace_session: stoppedSession });
    
    // Notify background (fire-and-forget, UI already updated)
    sendToBackground("STOP_RECORDING").catch((err) =>
      console.warn("[Sidebar] Background stop notification failed:", err)
    );
    
    // Update cloud recording status
    if (cloudRecordingId) {
      await updateRecordingStatus(
        cloudRecordingId,
        "completed",
        elapsedTime,
        stoppedSession.steps.length
      );
    }
  };

  const pauseRecording = async () => {
    await sendToBackground("PAUSE_RECORDING");
    setSession((prev) => prev ? { ...prev, isPaused: true } : null);
  };

  const resumeRecording = async () => {
    await sendToBackground("RESUME_RECORDING");
    setSession((prev) => prev ? { ...prev, isPaused: false } : null);
  };

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const updateStepInstruction = (stepId: string, instruction: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: prev.steps.map((step) =>
          step.id === stepId ? { ...step, instructionText: instruction } : step
        ),
      };
    });
  };

  const removeStep = (stepId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: prev.steps
          .filter((step) => step.id !== stepId)
          .map((step, index) => ({ ...step, orderNumber: index + 1 })),
      };
    });
  };

  const saveRecording = async () => {
    if (!session || session.steps.length === 0) return;
    
    setIsSaving(true);
    setSyncStatus("syncing");
    
    try {
      // If authenticated and we have a cloud recording ID, sync steps
      if (isAuthenticated && userId && cloudRecordingId) {
        for (const step of session.steps) {
          // Upload screenshot if exists
          let screenshotUrl: string | undefined;
          if (step.screenshotDataUrl) {
            const url = await uploadScreenshot(
              userId,
              cloudRecordingId,
              step.id,
              step.screenshotDataUrl
            );
            if (url) screenshotUrl = url;
          }
          
          // Create step in database
          await createStep(cloudRecordingId, {
            id: step.id,
            order_number: step.orderNumber,
            action_type: step.actionType,
            instruction_text: step.instructionText,
            screenshot_url: screenshotUrl,
            url: step.url,
            has_warning: step.hasWarning,
            is_redacted: step.isRedacted,
          });
        }
        
        setSyncStatus("synced");
        alert("Recording saved to cloud!");
      } else {
        // Store locally only
        await chrome.storage.local.set({ opstrace_session: session });
        alert("Recording saved locally. Log in to sync to cloud.");
      }
    } catch (error) {
      console.error("[Sidebar] Save error:", error);
      setSyncStatus("error");
      alert("Failed to save. Recording stored locally.");
      await chrome.storage.local.set({ opstrace_session: session });
    }
    
    setIsSaving(false);
  };

  const convertToSOP = async () => {
    await saveRecording();
    
    if (cloudRecordingId && isAuthenticated) {
      // Open the web app to convert
      chrome.tabs.create({
        url: `${window.location.origin}/recordings`,
      });
    } else {
      alert("Log in to convert recordings to SOPs in the web app.");
    }
  };

  const newRecording = () => {
    setSession(null);
    setTitle("Untitled Recording");
    setElapsedTime(0);
    setCloudRecordingId(null);
    setSyncStatus("idle");
    chrome.storage.local.remove("opstrace_session");
  };

  const isRecording = session?.isRecording || false;
  const isPaused = session?.isPaused || false;
  const steps = session?.steps || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>Opstrace SOP Creator</h1>
            <p>Capture your workflow step by step</p>
          </div>
          <button
            className="btn btn-outline"
            style={{ padding: "6px 10px", fontSize: 12 }}
            onClick={() => {
              chrome.tabs.create({ url: "https://id-preview--e0b633b5-43b9-4ea8-ab11-a84491b1e3e7.lovable.app/" });
            }}
            title="Open Dashboard"
          >
            <HomeIcon /> Dashboard
          </button>
        </div>
      </div>

      {/* Recording Status */}
      <div className={`recording-status ${isRecording ? "active" : ""}`}>
        <span className={`recording-indicator ${isRecording && !isPaused ? "active" : ""}`} />
        <span className="recording-timer">{formatTime(elapsedTime)}</span>
        <span style={{ flex: 1 }} />
        {syncStatus === "synced" && <span style={{ fontSize: 10, color: "#22c55e" }}>☁️ Synced</span>}
        {syncStatus === "syncing" && <span style={{ fontSize: 10, color: "#eab308" }}>⏳ Syncing...</span>}
        {syncStatus === "error" && <span style={{ fontSize: 10, color: "#ef4444" }}>⚠️ Local only</span>}
        <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: 8 }}>
          {steps.length} step{steps.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Title Input */}
      {!isRecording && steps.length === 0 && (
        <div className="title-input-container">
          <input
            type="text"
            className="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recording title..."
          />
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        {!isRecording && steps.length === 0 ? (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={startRecording}>
            <PlayIcon /> Start Recording
          </button>
        ) : isRecording ? (
          <>
            {isPaused ? (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={resumeRecording}>
                <PlayIcon /> Resume
              </button>
            ) : (
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={pauseRecording}>
                <PauseIcon /> Pause
              </button>
            )}
            <button className="btn btn-destructive" onClick={stopRecording}>
              <SquareIcon /> Stop
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={startRecording}>
              <PlayIcon /> Resume Recording
            </button>
            <button className="btn btn-outline" onClick={newRecording}>
              New
            </button>
          </>
        )}
      </div>

      {/* Steps List */}
      <div className="steps-list">
        {steps.length === 0 ? (
          <div className="steps-empty">
            <VideoIcon />
            <p>No steps captured yet</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              {isRecording
                ? "Interact with any webpage to capture steps"
                : "Click Start Recording to begin"}
            </p>
          </div>
        ) : (
          steps.map((step) => (
            <div key={step.id} className="step-card">
              <div
                className="step-card-header"
                onClick={() => toggleStepExpanded(step.id)}
              >
                <span className="step-number">{step.orderNumber}</span>
                <span className="step-instruction">{step.instructionText}</span>
                <div className="step-actions">
                  <button
                    className="step-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(step.id);
                    }}
                  >
                    <TrashIcon />
                  </button>
                  <button className="step-action-btn">
                    <ChevronDownIcon />
                  </button>
                </div>
              </div>
              
              {expandedSteps.has(step.id) && (
                <div className="step-card-content">
                  {step.screenshotDataUrl && (
                    <img
                      src={step.screenshotDataUrl}
                      alt={`Step ${step.orderNumber}`}
                      className="step-screenshot"
                    />
                  )}
                  <textarea
                    className="step-input"
                    value={step.instructionText}
                    onChange={(e) => updateStepInstruction(step.id, e.target.value)}
                    rows={2}
                    placeholder="Edit instruction..."
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Bar */}
      {steps.length > 0 && !isRecording && (
        <div className="action-bar">
          <button className="btn btn-outline" onClick={saveRecording} disabled={isSaving}>
            <SaveIcon /> {isSaving ? "Saving..." : "Save"}
          </button>
          <button className="btn btn-primary" onClick={convertToSOP} disabled={isSaving}>
            <FileTextIcon /> Convert to SOP
          </button>
        </div>
      )}
    </div>
  );
}
