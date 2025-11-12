// src/config/workflowSteps.ts

/**
 * Defines the logical manufacturing workflow sequence.
 * Each key represents the current step,
 * and its array lists the possible next step(s).
 * 
 * This controls the order assignment flow throughout
 * the GM Valve manufacturing process.
 */
export const workflowSteps: Record<string, string[]> = {
  "planning": ["material-issue"],
  "material-issue": ["semi-qc"],
  "semi-qc": ["after-phosphating"],
  "after-phosphating": ["assembly"],
  "assembly": ["testing1"],
  "testing1": ["testing2"],
  "testing2": ["marking"],
  "marking": ["svs"],
  "svs": ["pdi1"],
  "pdi1": ["pdi2"],
  "pdi2": ["dispatch"],
  "dispatch": ["tpi"],
  "tpi": [], // ✅ Final step (no next stage)
};

/**
 * Human-readable labels for dropdowns and UI.
 * Keeps names consistent across all workflow pages.
 */
export const stepLabels: Record<string, string> = {
  "planning": "Planning",
  "material-issue": "Material Issue",
  "semi-qc": "Semi QC",
  "after-phosphating": "After Phosphating QC",
  "assembly": "Assembly",
  "testing1": "Testing 1",
  "testing2": "Testing 2",
  "marking": "Marking",
  "svs": "Stock Valve Store (SVS)",
  "pdi1": "PDI 1",
  "pdi2": "PDI 2",
  "dispatch": "Dispatch",
  "tpi": "TPI",
};

/**
 * Utility function:
 * Given a current workflow step (or role name),
 * returns the valid next step(s) for order assignment.
 * 
 * - Auto-normalizes strings like "Material Issue" → "material-issue"
 * - Returns [] if the step is not found (final or invalid)
 */
export const getNextSteps = (currentStep: string): string[] => {
  if (!currentStep) return [];
  const normalized = currentStep.trim().toLowerCase().replace(/\s+/g, "-");
  return workflowSteps[normalized] || [];
};

/**
 * Utility function:
 * Converts a workflow step key into a human-readable label.
 * 
 * If no label is found in the mapping, it automatically
 * formats the string (e.g., "semi-qc" → "Semi Qc").
 */
export const getStepLabel = (step: string): string => {
  if (!step) return "";
  const normalized = step.trim().toLowerCase();
  if (stepLabels[normalized]) return stepLabels[normalized];
  return normalized.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
};

/**
 * Utility function:
 * Returns all defined workflow steps as an ordered array.
 * Useful for role validation, dropdown building, etc.
 */
export const getAllWorkflowSteps = (): string[] => Object.keys(workflowSteps);

/**
 * Utility function:
 * Checks whether a given step is the final workflow stage.
 */
export const isFinalStep = (step: string): boolean => {
  const normalized = step.trim().toLowerCase().replace(/\s+/g, "-");
  return (workflowSteps[normalized]?.length ?? 0) === 0;
};
