// Supabase client for Chrome Extension
// This connects to the same Supabase instance as the web app

import { createClient } from "@supabase/supabase-js";

// These values are safe to include in client-side code (publishable keys)
const SUPABASE_URL = "https://hqbnxpcfxngtdsxfxvck.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxYm54cGNmeG5ndGRzeGZ4dmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDYzMjgsImV4cCI6MjA4NTY4MjMyOH0.zCErVB7oJ0gkQt90Jj9U_6SeFHZKjC1UEGfL1oO_I7Q";

// Create Supabase client for extension
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Extension handles its own session storage
    autoRefreshToken: false,
  },
});

// Set auth token from extension storage
export async function setAuthFromStorage(): Promise<boolean> {
  try {
    const result = await chrome.storage.sync.get("opstrace_auth");
    if (result.opstrace_auth?.accessToken) {
      await supabase.auth.setSession({
        access_token: result.opstrace_auth.accessToken,
        refresh_token: result.opstrace_auth.refreshToken || "",
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("[Extension] Failed to set auth from storage:", error);
    return false;
  }
}

// Save auth to extension storage
export async function saveAuthToStorage(
  accessToken: string,
  refreshToken: string,
  userId: string
): Promise<void> {
  await chrome.storage.sync.set({
    opstrace_auth: {
      isAuthenticated: true,
      accessToken,
      refreshToken,
      userId,
    },
  });
}

// Clear auth from storage
export async function clearAuthFromStorage(): Promise<void> {
  await chrome.storage.sync.remove("opstrace_auth");
}

// Upload screenshot to Supabase storage
export async function uploadScreenshot(
  userId: string,
  recordingId: string,
  stepId: string,
  dataUrl: string
): Promise<string | null> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const filePath = `${userId}/${recordingId}/${stepId}.png`;

    const { error } = await supabase.storage
      .from("screenshots")
      .upload(filePath, blob, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("[Extension] Upload error:", error);
      return null;
    }

    // Get public URL
    const { data } = supabase.storage
      .from("screenshots")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("[Extension] Screenshot upload failed:", error);
    return null;
  }
}

// Create recording in Supabase
export async function createRecording(
  title: string,
  userId: string
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabase
      .from("recordings")
      .insert({
        title,
        user_id: userId,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Extension] Create recording error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Extension] Create recording failed:", error);
    return null;
  }
}

// Create step in Supabase
export async function createStep(
  recordingId: string,
  step: {
    id: string;
    order_number: number;
    action_type: string;
    instruction_text: string;
    screenshot_url?: string;
    url?: string;
    has_warning: boolean;
    is_redacted: boolean;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase.from("steps").insert({
      id: step.id,
      recording_id: recordingId,
      order_number: step.order_number,
      action_type: step.action_type,
      instruction_text: step.instruction_text,
      screenshot_url: step.screenshot_url,
      url: step.url,
      has_warning: step.has_warning,
      is_redacted: step.is_redacted,
    });

    if (error) {
      console.error("[Extension] Create step error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Extension] Create step failed:", error);
    return false;
  }
}

// Fetch user's SOPs
export async function fetchUserSOPs(): Promise<
  Array<{
    id: string;
    title: string;
    status: string;
    description: string | null;
    updated_at: string | null;
    step_count: number;
  }>
> {
  try {
    const { data: sops, error } = await supabase
      .from("sops")
      .select("id, title, status, description, updated_at, employee_tags, department_tags, tools_tags")
      .order("updated_at", { ascending: false });

    if (error || !sops) {
      console.error("[Extension] Fetch SOPs error:", error);
      return [];
    }

    // Get step counts
    const sopIds = sops.map((s) => s.id);
    if (sopIds.length === 0) return [];

    const { data: stepRows } = await supabase
      .from("sop_steps")
      .select("sop_id")
      .in("sop_id", sopIds);

    const countMap: Record<string, number> = {};
    stepRows?.forEach((r) => {
      countMap[r.sop_id] = (countMap[r.sop_id] || 0) + 1;
    });

    return sops.map((sop) => ({
      ...sop,
      step_count: countMap[sop.id] || 0,
    }));
  } catch (error) {
    console.error("[Extension] Fetch SOPs failed:", error);
    return [];
  }
}

// Fetch steps for a specific SOP
export async function fetchSOPSteps(
  sopId: string
): Promise<
  Array<{
    id: string;
    order_number: number;
    title: string | null;
    description: string | null;
    screenshot_url: string | null;
    has_warning: boolean | null;
    warning_text: string | null;
  }>
> {
  try {
    const { data, error } = await supabase
      .from("sop_steps")
      .select("id, order_number, title, description, screenshot_url, has_warning, warning_text")
      .eq("sop_id", sopId)
      .order("order_number", { ascending: true });

    if (error) {
      console.error("[Extension] Fetch SOP steps error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[Extension] Fetch SOP steps failed:", error);
    return [];
  }
}

// Update recording status
export async function updateRecordingStatus(
  recordingId: string,
  status: string,
  durationSeconds?: number,
  stepCount?: number
): Promise<boolean> {
  try {
    const updates: Record<string, unknown> = { status };
    if (status === "completed") {
      updates.ended_at = new Date().toISOString();
    }
    if (durationSeconds !== undefined) {
      updates.duration_seconds = durationSeconds;
    }
    if (stepCount !== undefined) {
      updates.step_count = stepCount;
    }

    const { error } = await supabase
      .from("recordings")
      .update(updates)
      .eq("id", recordingId);

    if (error) {
      console.error("[Extension] Update recording error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Extension] Update recording failed:", error);
    return false;
  }
}
