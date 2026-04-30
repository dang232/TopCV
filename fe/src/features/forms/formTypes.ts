import { FieldType, FormStatus, type FormDto, type SubmissionDto } from '@topcv/shared';

// List of field types available for forms
export const fieldTypes: FieldType[] = [
  FieldType.Text,
  FieldType.Number,
  FieldType.Date,
  FieldType.Color,
  FieldType.Select,
];

// Represents a Draft Field configuration in a form
export interface DraftField {
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

/**
 * Utility function to parse select options from a raw string
 * @param raw - The raw options string from input
 * @returns An array of trimmed option strings
 */
export function parseSelectOptions(raw: string): string[] {
  return raw.split(',').map((option) => option.trim()).filter(Boolean);
}

/**
 * Builds a Draft Field from input parameters, handling select options appropriately
 * @param input - The input object containing field configuration
 * @returns A DraftField object representing the field configuration
 */
export function buildDraftField(input: { label: string; type: FieldType; required: boolean; selectOptionsRaw?: string }): DraftField {
  const label = input.label.trim();

  if (input.type !== FieldType.Select) {
    return { label, type: input.type, required: input.required };  
  }
  
  return {
    label,
    type: input.type,
    required: input.required,
    options: parseSelectOptions(input.selectOptionsRaw ?? ''),
  };
}

/**
 * Converts a CreateFormDraft into a DraftField, allowing transformation from drafts
 * @param draft - The CreateFormDraft to transform
 * @returns A DraftField based on the provided draft
 */
export function buildDraftFieldFromDraft(draft: CreateFormDraft): DraftField {
  return buildDraftField({
    label: draft.fieldLabel,
    type: draft.fieldType,
    required: draft.required,
    selectOptionsRaw: draft.selectOptions,
  });
}

// Represents the configuration for creating a form draft
export interface CreateFormDraft {
  title: string;
  description: string;
  status: FormStatus;
  fieldLabel: string;
  fieldType: FieldType;
  selectOptions: string;
  required: boolean;
  fields: DraftField[];
}

/**
 * Adds a new draft field to the CreateFormDraft, updates the state accordingly
 * @param draft - The CreateFormDraft to which the field will be added
 * @returns A new CreateFormDraft with the added field
 */
export function addDraftField(draft: CreateFormDraft): CreateFormDraft {
  const nextField = buildDraftField({
    label: draft.fieldLabel,
    type: draft.fieldType,
    required: draft.required,
    selectOptionsRaw: draft.selectOptions,
  });

  return {
    ...draft,
    fields: [...draft.fields, nextField],
    fieldLabel: '',
    fieldType: FieldType.Text,
    selectOptions: '',
    required: true,
  };
}

/**
 * Removes a draft field from the CreateFormDraft based on the specified index
 * @param draft - The CreateFormDraft to modify
 * @param index - The index of the field to remove
 * @returns A new CreateFormDraft without the specified field
 */
export function removeDraftField(draft: CreateFormDraft, index: number): CreateFormDraft {
  return {
    ...draft,
    fields: draft.fields.filter((_, current) => current !== index),
  };
}

/**
 * Moves a draft field within the CreateFormDraft
 * @param draft - The CreateFormDraft to modify
 * @param index - The current index of the field
 * @param direction - The direction to move the field (-1 for up, 1 for down)
 * @returns The modified CreateFormDraft with the field repositioned
 */
export function moveDraftField(draft: CreateFormDraft, index: number, direction: -1 | 1): CreateFormDraft {
  const target = index + direction;
  if (target < 0 || target >= draft.fields.length) {
    return draft;
  }

  const next = [...draft.fields];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);

  return { ...draft, fields: next };
}

// Represents the view state for forms being displayed
export interface FormsViewState {
  forms: FormDto[];
  answers: Record<string, string>;
  submissions: SubmissionDto[];
  message: string;
  error: string;
}
