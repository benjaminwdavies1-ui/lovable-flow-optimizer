import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Recording = Tables<"recordings">;
export type Step = Tables<"steps">;
export type RecordingInsert = TablesInsert<"recordings">;
export type StepInsert = TablesInsert<"steps">;

// Create a new recording
export async function createRecording(title: string, userId: string): Promise<Recording | null> {
  const { data, error } = await supabase
    .from("recordings")
    .insert({
      title,
      user_id: userId,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating recording:", error);
    return null;
  }

  return data;
}

// Update recording when stopped
export async function updateRecording(
  recordingId: string,
  updates: {
    status?: string;
    ended_at?: string;
    duration_seconds?: number;
    step_count?: number;
    title?: string;
  }
): Promise<Recording | null> {
  const { data, error } = await supabase
    .from("recordings")
    .update(updates)
    .eq("id", recordingId)
    .select()
    .single();

  if (error) {
    console.error("Error updating recording:", error);
    return null;
  }

  return data;
}

// Upload screenshot to storage
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
      console.error("Error uploading screenshot:", error);
      return null;
    }

    // Get public URL
    const { data } = supabase.storage
      .from("screenshots")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error("Error processing screenshot:", err);
    return null;
  }
}

// Create a step
export async function createStep(step: StepInsert): Promise<Step | null> {
  const { data, error } = await supabase
    .from("steps")
    .insert(step)
    .select()
    .single();

  if (error) {
    console.error("Error creating step:", error);
    return null;
  }

  return data;
}

// Update a step
export async function updateStep(
  stepId: string,
  updates: Partial<Step>
): Promise<Step | null> {
  const { data, error } = await supabase
    .from("steps")
    .update(updates)
    .eq("id", stepId)
    .select()
    .single();

  if (error) {
    console.error("Error updating step:", error);
    return null;
  }

  return data;
}

// Delete a step
export async function deleteStep(stepId: string): Promise<boolean> {
  const { error } = await supabase
    .from("steps")
    .delete()
    .eq("id", stepId);

  if (error) {
    console.error("Error deleting step:", error);
    return false;
  }

  return true;
}

// Get all recordings for a user
export async function getUserRecordings(): Promise<Recording[]> {
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recordings:", error);
    return [];
  }

  return data || [];
}

// Get a recording with its steps
export async function getRecordingWithSteps(
  recordingId: string
): Promise<{ recording: Recording; steps: Step[] } | null> {
  const { data: recording, error: recordingError } = await supabase
    .from("recordings")
    .select("*")
    .eq("id", recordingId)
    .maybeSingle();

  if (recordingError || !recording) {
    console.error("Error fetching recording:", recordingError);
    return null;
  }

  const { data: steps, error: stepsError } = await supabase
    .from("steps")
    .select("*")
    .eq("recording_id", recordingId)
    .order("order_number", { ascending: true });

  if (stepsError) {
    console.error("Error fetching steps:", stepsError);
    return null;
  }

  return { recording, steps: steps || [] };
}

// Delete a recording and all its steps
export async function deleteRecording(recordingId: string): Promise<boolean> {
  // Delete steps first (foreign key constraint)
  const { error: stepsError } = await supabase
    .from("steps")
    .delete()
    .eq("recording_id", recordingId);

  if (stepsError) {
    console.error("Error deleting steps:", stepsError);
    return false;
  }

  const { error } = await supabase
    .from("recordings")
    .delete()
    .eq("id", recordingId);

  if (error) {
    console.error("Error deleting recording:", error);
    return false;
  }

  return true;
}

// Get recordings with step count for list view
export interface RecordingWithStepCount extends Recording {
  step_count: number;
}

export async function getUserRecordingsWithCounts(): Promise<RecordingWithStepCount[]> {
  const { data: recordings, error } = await supabase
    .from("recordings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recordings:", error);
    return [];
  }

  // Get step counts for each recording
  const recordingIds = recordings?.map(r => r.id) || [];
  if (recordingIds.length === 0) return [];

  const { data: stepCounts, error: countError } = await supabase
    .from("steps")
    .select("recording_id")
    .in("recording_id", recordingIds);

  if (countError) {
    console.error("Error fetching step counts:", countError);
    return recordings?.map(r => ({ ...r, step_count: r.step_count || 0 })) || [];
  }

  // Count steps per recording
  const countMap: Record<string, number> = {};
  stepCounts?.forEach(step => {
    countMap[step.recording_id] = (countMap[step.recording_id] || 0) + 1;
  });

  return recordings?.map(r => ({
    ...r,
    step_count: countMap[r.id] || r.step_count || 0,
  })) || [];
}
