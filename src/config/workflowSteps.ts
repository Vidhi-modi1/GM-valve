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
  // Planning → Material Issue
  "planning": ["material-issue"],

  // 1) Material Issue → Semi QC
  "material-issue": ["semi-qc"],

  // 2) Semi QC → Phosphating
  "semi-qc": ["phosphating"],

  // 3) Phosphating → Assembly
  "phosphating": ["assembly"],

  // 4) Assembly → Testing 1 or Testing 2 (selection restricted by assembly line in UI)
  "assembly": ["testing1", "testing2"],

  // 5) Testing 1 → Marking 1; Testing 2 → Marking 2
  "testing1": ["marking1"],
  "testing2": ["marking2"],

  // 6) Marking 1 → PDI 1; Marking 2 → PDI 2
  "marking1": ["pdi1"],
  "marking2": ["pdi2"],

  // 7) After PDI, final option: TPI or Dispatch (both final)
  "pdi1": ["tpi", "dispatch"],
  "pdi2": ["tpi", "dispatch"],

  // 8) SVS only goes to Marking 1
  "svs": ["marking1"],

  // Final steps: Dispatch is final, TPI moves to Dispatch
  "dispatch": [],
  "tpi": ["dispatch"],
};

/**
 * Human-readable labels for dropdowns and UI.
 * Keeps names consistent across all workflow pages.
 */
export const stepLabels: Record<string, string> = {
  "planning": "Planning",
  "material-issue": "Material Issue",
  "semi-qc": "Semi QC",
  "phosphating": "Phosphating QC",
  "assembly": "Assembly",
  "testing1": "Testing1",
  "testing2": "Testing2",
  "svs": "SVS",
  "marking1": "Marking1",
  "marking2": "Marking2",
  "pdi1": "PDI1",
  "pdi2": "PDI2",
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
