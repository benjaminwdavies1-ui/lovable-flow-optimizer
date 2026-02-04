import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { getRecordingWithSteps, updateRecording } from "./recordingService";

export type SOP = Tables<"sops"> & {
  employee_tags?: string[] | null;
  department_tags?: string[] | null;
  tools_tags?: string[] | null;
};
export type SOPStep = Tables<"sop_steps">;
export type SOPInsert = TablesInsert<"sops">;
export type SOPStepInsert = TablesInsert<"sop_steps">;

export interface SOPWithStepCount extends SOP {
  step_count: number;
}

// Get all SOPs for the current user with step count
export async function getUserSOPs(): Promise<SOPWithStepCount[]> {
  const { data: sops, error } = await supabase
    .from("sops")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching SOPs:", error);
    return [];
  }

  // Get step counts for each SOP
  const sopIds = sops?.map(sop => sop.id) || [];
  if (sopIds.length === 0) return [];

  const { data: stepCounts, error: countError } = await supabase
    .from("sop_steps")
    .select("sop_id")
    .in("sop_id", sopIds);

  if (countError) {
    console.error("Error fetching step counts:", countError);
    return sops?.map(sop => ({ ...sop, step_count: 0 })) || [];
  }

  // Count steps per SOP
  const countMap: Record<string, number> = {};
  stepCounts?.forEach(step => {
    countMap[step.sop_id] = (countMap[step.sop_id] || 0) + 1;
  });

  return sops?.map(sop => ({
    ...sop,
    step_count: countMap[sop.id] || 0,
  })) || [];
}

// Get a single SOP with its steps
export async function getSOPWithSteps(
  sopId: string
): Promise<{ sop: SOP; steps: SOPStep[] } | null> {
  const { data: sop, error: sopError } = await supabase
    .from("sops")
    .select("*")
    .eq("id", sopId)
    .maybeSingle();

  if (sopError || !sop) {
    console.error("Error fetching SOP:", sopError);
    return null;
  }

  const { data: steps, error: stepsError } = await supabase
    .from("sop_steps")
    .select("*")
    .eq("sop_id", sopId)
    .order("order_number", { ascending: true });

  if (stepsError) {
    console.error("Error fetching SOP steps:", stepsError);
    return null;
  }

  return { sop, steps: steps || [] };
}

// Create SOP from a recording
export async function createSOPFromRecording(
  recordingId: string,
  userId: string
): Promise<SOP | null> {
  // Get the recording and its steps
  const recordingData = await getRecordingWithSteps(recordingId);
  if (!recordingData) {
    console.error("Recording not found");
    return null;
  }

  const { recording, steps } = recordingData;

  // Create the SOP
  const { data: sop, error: sopError } = await supabase
    .from("sops")
    .insert({
      title: recording.title,
      description: `SOP created from recording: ${recording.title}`,
      user_id: userId,
      recording_id: recordingId,
      status: "draft",
      version: 1,
    })
    .select()
    .single();

  if (sopError || !sop) {
    console.error("Error creating SOP:", sopError);
    return null;
  }

  // Copy steps from recording to SOP
  if (steps.length > 0) {
    const sopSteps: SOPStepInsert[] = steps.map(step => ({
      sop_id: sop.id,
      order_number: step.order_number,
      title: step.instruction_text || `Step ${step.order_number}`,
      description: step.instruction_text,
      screenshot_url: step.screenshot_url,
      has_warning: step.has_warning || false,
      warning_text: step.warning_text,
      is_redacted: step.is_redacted || false,
      show_screenshot: true,
    }));

    const { error: stepsError } = await supabase
      .from("sop_steps")
      .insert(sopSteps);

    if (stepsError) {
      console.error("Error creating SOP steps:", stepsError);
      // Delete the SOP if steps failed
      await supabase.from("sops").delete().eq("id", sop.id);
      return null;
    }
  }

  // Mark recording as converted
  await updateRecording(recordingId, { status: "converted" });

  return sop;
}

// Create a new blank SOP
export async function createSOP(
  title: string,
  description: string,
  userId: string
): Promise<SOP | null> {
  const { data, error } = await supabase
    .from("sops")
    .insert({
      title,
      description,
      user_id: userId,
      status: "draft",
      version: 1,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating SOP:", error);
    return null;
  }

  return data;
}

// Update SOP details
export async function updateSOP(
  sopId: string,
  updates: Partial<SOP>
): Promise<SOP | null> {
  const { data, error } = await supabase
    .from("sops")
    .update(updates)
    .eq("id", sopId)
    .select()
    .single();

  if (error) {
    console.error("Error updating SOP:", error);
    return null;
  }

  return data;
}

// Delete an SOP and its steps
export async function deleteSOP(sopId: string): Promise<boolean> {
  // Delete steps first (foreign key constraint)
  const { error: stepsError } = await supabase
    .from("sop_steps")
    .delete()
    .eq("sop_id", sopId);

  if (stepsError) {
    console.error("Error deleting SOP steps:", stepsError);
    return false;
  }

  const { error } = await supabase
    .from("sops")
    .delete()
    .eq("id", sopId);

  if (error) {
    console.error("Error deleting SOP:", error);
    return false;
  }

  return true;
}

// Create a step in an SOP
export async function createSOPStep(step: SOPStepInsert): Promise<SOPStep | null> {
  const { data, error } = await supabase
    .from("sop_steps")
    .insert(step)
    .select()
    .single();

  if (error) {
    console.error("Error creating SOP step:", error);
    return null;
  }

  return data;
}

// Update a step
export async function updateSOPStep(
  stepId: string,
  updates: Partial<SOPStep>
): Promise<SOPStep | null> {
  const { data, error } = await supabase
    .from("sop_steps")
    .update(updates)
    .eq("id", stepId)
    .select()
    .single();

  if (error) {
    console.error("Error updating SOP step:", error);
    return null;
  }

  return data;
}

// Delete a step
export async function deleteSOPStep(stepId: string): Promise<boolean> {
  const { error } = await supabase
    .from("sop_steps")
    .delete()
    .eq("id", stepId);

  if (error) {
    console.error("Error deleting SOP step:", error);
    return false;
  }

  return true;
}

// Dashboard statistics
export interface DashboardStats {
  totalRecordings: number;
  totalSOPs: number;
  totalDurationSeconds: number;
  avgStepsPerSOP: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [recordingsResult, sopsResult, durationResult, stepsResult] = await Promise.all([
    supabase.from("recordings").select("id", { count: "exact", head: true }),
    supabase.from("sops").select("id", { count: "exact", head: true }),
    supabase.from("recordings").select("duration_seconds"),
    supabase.from("sop_steps").select("sop_id"),
  ]);

  const totalRecordings = recordingsResult.count || 0;
  const totalSOPs = sopsResult.count || 0;
  
  const totalDurationSeconds = durationResult.data?.reduce(
    (sum, r) => sum + (r.duration_seconds || 0), 
    0
  ) || 0;

  // Calculate average steps per SOP
  const stepsCount = stepsResult.data?.length || 0;
  const avgStepsPerSOP = totalSOPs > 0 ? Math.round(stepsCount / totalSOPs) : 0;

  return {
    totalRecordings,
    totalSOPs,
    totalDurationSeconds,
    avgStepsPerSOP,
  };
}

// Get recent recordings for dashboard
export async function getRecentRecordings(limit: number = 3) {
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent recordings:", error);
    return [];
  }

  return data || [];
}

// Get recent SOPs for dashboard
export async function getRecentSOPs(limit: number = 2) {
  const { data: sops, error } = await supabase
    .from("sops")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent SOPs:", error);
    return [];
  }

  // Get step counts
  const sopIds = sops?.map(s => s.id) || [];
  if (sopIds.length === 0) return [];

  const { data: stepCounts } = await supabase
    .from("sop_steps")
    .select("sop_id")
    .in("sop_id", sopIds);

  const countMap: Record<string, number> = {};
  stepCounts?.forEach(step => {
    countMap[step.sop_id] = (countMap[step.sop_id] || 0) + 1;
  });

  return sops?.map(sop => ({
    ...sop,
    step_count: countMap[sop.id] || 0,
  })) || [];
}
