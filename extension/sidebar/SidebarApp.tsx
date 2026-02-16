import React, { useState, useEffect, useCallback } from "react";
import type { RecordingSession, CapturedStep, AuthState, ProcessCluster } from "../shared/types";
import { sendToBackground } from "../shared/messaging";
import {
  supabase,
  setAuthFromStorage,
  createRecording,
  createStep,
  updateRecordingStatus,
  uploadScreenshot,
  fetchUserSOPs,
  fetchSOPSteps,
  fetchTodayClusters,
  updateClusterStatus,
  fetchTodayEventCount,
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

const ActivityIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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
  const [activeTab, setActiveTab] = useState<"record" | "sops" | "monitor">("record");
  const [sops, setSops] = useState<Awaited<ReturnType<typeof fetchUserSOPs>>>([]);
  const [sopsLoading, setSopsLoading] = useState(false);
  const [expandedSops, setExpandedSops] = useState<Set<string>>(new Set());
  const [sopStepsCache, setSopStepsCache] = useState<Record<string, Awaited<ReturnType<typeof fetchSOPSteps>>>>({});

  // Monitor tab state
  const [continuousEnabled, setContinuousEnabled] = useState(false);
  const [continuousEventCount, setContinuousEventCount] = useState(0);
  const [clusters, setClusters] = useState<ProcessCluster[]>([]);
  const [clustersLoading, setClustersLoading] = useState(false);

  // Load session and auth state on mount
  useEffect(() => {
    loadSession();
    loadAuthState();
    loadContinuousState();
    
    const handleMessage = (message: { type: string; payload?: { step?: CapturedStep; enabled?: boolean; eventCount?: number } }) => {
      if (message.type === "STEP_CAPTURED" && message.payload?.step) {
        setSession((prev) => {
          if (!prev) return prev;
          return { ...prev, steps: [...prev.steps, message.payload!.step!] };
        });
      }
      if (message.type === "CONTINUOUS_STATUS" && message.payload) {
        setContinuousEventCount(message.payload.eventCount || 0);
      }
    };
    
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === "local" && changes.opstrace_session?.newValue) {
        const updatedSession = changes.opstrace_session.newValue as RecordingSession;
        setSession(updatedSession);
      }
      if (area === "local" && changes.opstrace_continuous?.newValue) {
        const continuous = changes.opstrace_continuous.newValue;
        setContinuousEnabled(continuous.enabled || false);
        setContinuousEventCount(continuous.eventCount || 0);
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
      interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [session?.isRecording, session?.isPaused]);

  const loadSession = async () => {
    const result = await chrome.storage.local.get("opstrace_session");
    if (result.opstrace_session) {
      setSession(result.opstrace_session);
      if (result.opstrace_session.startTime) {
        setElapsedTime(Math.floor((Date.now() - result.opstrace_session.startTime) / 1000));
      }
    }
  };

  const loadAuthState = async () => {
    const hasAuth = await setAuthFromStorage();
    if (hasAuth) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.id);
        return;
      }
    }
    const result = await chrome.storage.sync.get("opstrace_auth");
    if (result.opstrace_auth) {
      setIsAuthenticated(result.opstrace_auth.isAuthenticated);
      setUserId(result.opstrace_auth.userId || null);
    }
  };

  const loadContinuousState = async () => {
    const result = await chrome.storage.local.get("opstrace_continuous");
    if (result.opstrace_continuous) {
      setContinuousEnabled(result.opstrace_continuous.enabled || false);
      setContinuousEventCount(result.opstrace_continuous.eventCount || 0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    let response: { success?: boolean; session?: RecordingSession } | undefined;
    try {
      response = await sendToBackground<{ title: string; userId: string }, { success: boolean; session: RecordingSession }>(
        "START_RECORDING", { title, userId: userId || "anonymous" }
      );
    } catch (err) { console.error("[Sidebar] sendToBackground threw:", err); }
    
    if (response?.success && response.session) {
      setSession(response.session);
      setElapsedTime(0);
    } else {
      await new Promise((r) => setTimeout(r, 500));
      const stored = await chrome.storage.local.get("opstrace_session");
      if (stored.opstrace_session?.isRecording) {
        setSession(stored.opstrace_session);
        setElapsedTime(0);
      } else { return; }
    }

    if (isAuthenticated && userId) {
      setSyncStatus("syncing");
      try {
        const cloudRecording = await createRecording(title, userId);
        if (cloudRecording) { setCloudRecordingId(cloudRecording.id); setSyncStatus("synced"); }
        else { setSyncStatus("error"); }
      } catch { setSyncStatus("error"); }
    }
  };

  const stopRecording = async () => {
    const stoppedSession: RecordingSession = {
      ...(session || { id: "", title, startTime: Date.now(), steps: [] }),
      isRecording: false, isPaused: false,
    };
    setSession(stoppedSession);
    await chrome.storage.local.set({ opstrace_session: stoppedSession });
    sendToBackground("STOP_RECORDING").catch(() => {});
    if (cloudRecordingId) {
      await updateRecordingStatus(cloudRecordingId, "completed", elapsedTime, stoppedSession.steps.length);
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
      next.has(stepId) ? next.delete(stepId) : next.add(stepId);
      return next;
    });
  };

  const updateStepInstruction = (stepId: string, instruction: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, steps: prev.steps.map((s) => s.id === stepId ? { ...s, instructionText: instruction } : s) };
    });
  };

  const removeStep = (stepId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, steps: prev.steps.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, orderNumber: i + 1 })) };
    });
  };

  const saveRecording = async () => {
    if (!session || session.steps.length === 0) return;
    setIsSaving(true);
    setSyncStatus("syncing");
    try {
      if (isAuthenticated && userId && cloudRecordingId) {
        for (const step of session.steps) {
          let screenshotUrl: string | undefined;
          if (step.screenshotDataUrl) {
            const url = await uploadScreenshot(userId, cloudRecordingId, step.id, step.screenshotDataUrl);
            if (url) screenshotUrl = url;
          }
          await createStep(cloudRecordingId, {
            id: step.id, order_number: step.orderNumber, action_type: step.actionType,
            instruction_text: step.instructionText, screenshot_url: screenshotUrl,
            url: step.url, has_warning: step.hasWarning, is_redacted: step.isRedacted,
          });
        }
        setSyncStatus("synced");
        alert("Recording saved to cloud!");
      } else {
        await chrome.storage.local.set({ opstrace_session: session });
        alert("Recording saved locally. Log in to sync to cloud.");
      }
    } catch {
      setSyncStatus("error");
      alert("Failed to save. Recording stored locally.");
      await chrome.storage.local.set({ opstrace_session: session });
    }
    setIsSaving(false);
  };

  const convertToSOP = async () => {
    await saveRecording();
    if (cloudRecordingId && isAuthenticated) {
      chrome.tabs.create({ url: `${window.location.origin}/recordings` });
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

  // SOPs tab
  useEffect(() => {
    if (activeTab === "sops" && isAuthenticated) {
      setSopsLoading(true);
      fetchUserSOPs().then((data) => { setSops(data); setSopsLoading(false); });
    }
  }, [activeTab, isAuthenticated]);

  const toggleSopExpanded = async (sopId: string) => {
    const next = new Set(expandedSops);
    if (next.has(sopId)) { next.delete(sopId); }
    else {
      next.add(sopId);
      if (!sopStepsCache[sopId]) {
        const steps = await fetchSOPSteps(sopId);
        setSopStepsCache((prev) => ({ ...prev, [sopId]: steps }));
      }
    }
    setExpandedSops(next);
  };

  // Monitor tab
  useEffect(() => {
    if (activeTab === "monitor" && isAuthenticated) {
      setClustersLoading(true);
      Promise.all([fetchTodayClusters(), fetchTodayEventCount()]).then(([c, count]) => {
        setClusters(c);
        if (count > continuousEventCount) setContinuousEventCount(count);
        setClustersLoading(false);
      });
    }
  }, [activeTab, isAuthenticated]);

  const toggleContinuousMode = async () => {
    const newEnabled = !continuousEnabled;
    setContinuousEnabled(newEnabled);
    await sendToBackground("TOGGLE_CONTINUOUS", { enabled: newEnabled, userId });
  };

  const handleDismissCluster = async (clusterId: string) => {
    await updateClusterStatus(clusterId, "dismissed");
    setClusters((prev) => prev.filter((c) => c.id !== clusterId));
  };

  const handleConfirmCluster = async (clusterId: string) => {
    await updateClusterStatus(clusterId, "confirmed");
    setClusters((prev) => prev.map((c) => c.id === clusterId ? { ...c, status: "confirmed" } : c));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const formatClusterTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const isRecording = session?.isRecording || false;
  const isPaused = session?.isPaused || false;
  const steps = session?.steps || [];

  // Auth gate
  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div className="sidebar-header">
          <h1>Opstrace SOP Creator</h1>
          <p>Capture your workflow step by step</p>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", gap: "16px" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Sign in required</h2>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
            Log in to the Opstrace web app to start capturing and converting recordings into SOPs.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 8 }}
            onClick={() => { chrome.tabs.create({ url: "https://id-preview--e0b633b5-43b9-4ea8-ab11-a84491b1e3e7.lovable.app/auth" }); }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>Opstrace SOP Creator</h1>
            <p>Capture your workflow step by step</p>
          </div>
          <button className="btn btn-outline" style={{ padding: "6px 10px", fontSize: 12 }}
            onClick={() => { chrome.tabs.create({ url: "https://id-preview--e0b633b5-43b9-4ea8-ab11-a84491b1e3e7.lovable.app/" }); }}
            title="Open Dashboard">
            <HomeIcon /> Dashboard
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === "record" ? "active" : ""}`} onClick={() => setActiveTab("record")}>
          <VideoIcon /> Record
        </button>
        <button className={`tab-btn ${activeTab === "monitor" ? "active" : ""}`} onClick={() => setActiveTab("monitor")}>
          <ActivityIcon /> Monitor
          {continuousEnabled && <span className="monitor-dot" />}
        </button>
        <button className={`tab-btn ${activeTab === "sops" ? "active" : ""}`} onClick={() => setActiveTab("sops")}>
          <FileTextIcon /> My SOPs
        </button>
      </div>

      {activeTab === "record" ? (
        <>
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
              <input type="text" className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Recording title..." />
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
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={resumeRecording}><PlayIcon /> Resume</button>
                ) : (
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={pauseRecording}><PauseIcon /> Pause</button>
                )}
                <button className="btn btn-destructive" onClick={stopRecording}><SquareIcon /> Stop</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={startRecording}><PlayIcon /> Resume Recording</button>
                <button className="btn btn-outline" onClick={newRecording}>New</button>
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
                  {isRecording ? "Interact with any webpage to capture steps" : "Click Start Recording to begin"}
                </p>
              </div>
            ) : (
              steps.map((step) => (
                <div key={step.id} className="step-card">
                  <div className="step-card-header" onClick={() => toggleStepExpanded(step.id)}>
                    <span className="step-number">{step.orderNumber}</span>
                    <span className="step-instruction">{step.instructionText}</span>
                    <div className="step-actions">
                      <button className="step-action-btn" onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}>
                        <TrashIcon />
                      </button>
                      <button className="step-action-btn"><ChevronDownIcon /></button>
                    </div>
                  </div>
                  {expandedSteps.has(step.id) && (
                    <div className="step-card-content">
                      {step.screenshotDataUrl && <img src={step.screenshotDataUrl} alt={`Step ${step.orderNumber}`} className="step-screenshot" />}
                      <textarea className="step-input" value={step.instructionText}
                        onChange={(e) => updateStepInstruction(step.id, e.target.value)} rows={2} placeholder="Edit instruction..." />
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
        </>
      ) : activeTab === "monitor" ? (
        /* Monitor Tab */
        <div className="monitor-tab">
          {/* Toggle */}
          <div className="monitor-toggle-row">
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Always-On Monitoring</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                Passively captures your browser activity
              </p>
            </div>
            <button
              className={`toggle-switch ${continuousEnabled ? "active" : ""}`}
              onClick={toggleContinuousMode}
              aria-label="Toggle continuous monitoring"
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          {/* Stats */}
          <div className="monitor-stats">
            <div className="monitor-stat">
              <span className="monitor-stat-value">{continuousEventCount}</span>
              <span className="monitor-stat-label">events today</span>
            </div>
            <div className="monitor-stat">
              <span className="monitor-stat-value">{clusters.filter((c) => c.status !== "dismissed").length}</span>
              <span className="monitor-stat-label">processes detected</span>
            </div>
          </div>

          {/* Clusters */}
          <div className="monitor-clusters">
            <h3 style={{ padding: "0 12px", fontSize: 13, fontWeight: 600, color: "var(--muted-foreground)" }}>
              Detected Processes
            </h3>

            {clustersLoading ? (
              <>
                <div className="skeleton skeleton-card" style={{ margin: "0 12px" }} />
                <div className="skeleton skeleton-card" style={{ margin: "0 12px" }} />
              </>
            ) : clusters.filter((c) => c.status !== "dismissed").length === 0 ? (
              <div className="monitor-empty">
                <ActivityIcon />
                <p>No processes detected yet</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>
                  {continuousEnabled
                    ? "Events are being captured. Run segmentation from the Insights page to detect processes."
                    : "Enable monitoring to start capturing your browser activity."}
                </p>
              </div>
            ) : (
              clusters
                .filter((c) => c.status !== "dismissed")
                .map((cluster) => (
                  <div key={cluster.id} className="cluster-card">
                    <div className="cluster-header">
                      <div className="cluster-info">
                        <h4>{cluster.title}</h4>
                        <div className="cluster-meta">
                          <span>{formatClusterTime(cluster.start_time)} – {formatClusterTime(cluster.end_time)}</span>
                          <span>·</span>
                          <span>{cluster.event_count} events</span>
                        </div>
                      </div>
                      <div className={`cluster-confidence ${cluster.confidence_score >= 0.7 ? "high" : cluster.confidence_score >= 0.4 ? "medium" : "low"}`}>
                        {Math.round(cluster.confidence_score * 100)}%
                      </div>
                    </div>
                    {cluster.description && (
                      <p className="cluster-desc">{cluster.description}</p>
                    )}
                    <div className="cluster-actions">
                      {cluster.status === "detected" && (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => handleConfirmCluster(cluster.id)}>
                            ✓ Confirm
                          </button>
                          <button className="btn btn-sm btn-outline" onClick={() => handleDismissCluster(cluster.id)}>
                            ✕ Dismiss
                          </button>
                        </>
                      )}
                      {cluster.status === "confirmed" && (
                        <span className="cluster-confirmed-badge">✓ Confirmed</span>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      ) : (
        /* My SOPs Tab */
        <div className="sop-list">
          {sopsLoading ? (
            <>
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-card" />
              <div className="skeleton skeleton-card" />
            </>
          ) : sops.length === 0 ? (
            <div className="sop-empty">
              <FileTextIcon />
              <p>No SOPs created yet</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Record a workflow and convert it to an SOP to see it here.</p>
            </div>
          ) : (
            sops.map((sop) => (
              <div key={sop.id} className="sop-card">
                <div className="sop-card-header" onClick={() => toggleSopExpanded(sop.id)}>
                  <div className="sop-title">
                    <h3>{sop.title}</h3>
                    <div className="sop-meta">
                      <span className={`sop-badge ${sop.status}`}>{sop.status}</span>
                      <span>{sop.step_count} steps</span>
                      <span>{formatDate(sop.updated_at)}</span>
                    </div>
                    {((sop as any).employee_tags?.length > 0 || (sop as any).department_tags?.length > 0 || (sop as any).tools_tags?.length > 0) && (
                      <div className="sop-tags">
                        {(sop as any).employee_tags?.map((tag: string) => (
                          <span key={`e-${tag}`} className="sop-tag employee">{tag}</span>
                        ))}
                        {(sop as any).department_tags?.map((tag: string) => (
                          <span key={`d-${tag}`} className="sop-tag department">{tag}</span>
                        ))}
                        {(sop as any).tools_tags?.map((tag: string) => (
                          <span key={`t-${tag}`} className="sop-tag tools">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`sop-chevron ${expandedSops.has(sop.id) ? "open" : ""}`}>
                    <ChevronDownIcon />
                  </span>
                </div>

                {expandedSops.has(sop.id) && (
                  <div className="sop-steps-list">
                    {!sopStepsCache[sop.id] ? (
                      <div className="skeleton skeleton-card" />
                    ) : sopStepsCache[sop.id].length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--muted-foreground)", textAlign: "center", padding: 8 }}>No steps in this SOP</p>
                    ) : (
                      sopStepsCache[sop.id].map((sopStep) => (
                        <div key={sopStep.id} className="sop-step-item">
                          <span className="sop-step-num">{sopStep.order_number}</span>
                          <div className="sop-step-content">
                            <h4>{sopStep.title || sopStep.description || `Step ${sopStep.order_number}`}</h4>
                            {sopStep.description && sopStep.title && <p>{sopStep.description}</p>}
                            {sopStep.has_warning && sopStep.warning_text && <div className="sop-step-warning">⚠️ {sopStep.warning_text}</div>}
                            {sopStep.screenshot_url && <img src={sopStep.screenshot_url} alt={`Step ${sopStep.order_number}`} loading="lazy" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
