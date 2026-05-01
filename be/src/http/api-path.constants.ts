/**
 * Canonical versioned HTTP API path segments (Nest `@Controller` paths, no leading slash).
 * Single source of truth for `/api/v1/...` routing on the backend.
 */
export const HTTP_API_SEGMENT = 'api' as const;
export const HTTP_API_VERSION_V1_SEGMENT = 'v1' as const;

export const HTTP_API_V1_ROOT_PATH = `${HTTP_API_SEGMENT}/${HTTP_API_VERSION_V1_SEGMENT}` as const;

export const HTTP_API_V1_FORMS_PATH = `${HTTP_API_V1_ROOT_PATH}/forms` as const;
export const HTTP_API_V1_SUBMISSIONS_PATH = `${HTTP_API_V1_ROOT_PATH}/submissions` as const;
