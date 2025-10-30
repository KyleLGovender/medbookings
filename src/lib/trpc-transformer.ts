/**
 * Lambda-compatible tRPC transformer
 *
 * Handles Date serialization/deserialization without the complexity
 * of SuperJSON, which fails in AWS Lambda serverless environment.
 *
 * This simple transformer:
 * - Serializes Date objects to ISO strings with a marker
 * - Deserializes marked ISO strings back to Date objects
 * - Works reliably in AWS Lambda
 */

interface SerializedDate {
  __type: 'Date';
  value: string;
}

function isSerializedDate(obj: unknown): obj is SerializedDate {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '__type' in obj &&
    obj.__type === 'Date' &&
    'value' in obj &&
    typeof obj.value === 'string'
  );
}

function transformValue(value: unknown): unknown {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Date objects - serialize to marked ISO string
  if (value instanceof Date) {
    return {
      __type: 'Date',
      value: value.toISOString(),
    } as SerializedDate;
  }

  // Handle arrays recursively
  if (Array.isArray(value)) {
    return value.map(transformValue);
  }

  // Handle plain objects recursively
  if (typeof value === 'object' && value.constructor === Object) {
    const transformed: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      transformed[key] = transformValue(val);
    }
    return transformed;
  }

  // Return primitives as-is
  return value;
}

function untransformValue(value: unknown): unknown {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle serialized dates - deserialize back to Date objects
  if (isSerializedDate(value)) {
    return new Date(value.value);
  }

  // Handle arrays recursively
  if (Array.isArray(value)) {
    return value.map(untransformValue);
  }

  // Handle plain objects recursively
  if (typeof value === 'object' && value.constructor === Object) {
    const untransformed: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      untransformed[key] = untransformValue(val);
    }
    return untransformed;
  }

  // Return primitives as-is
  return value;
}

/**
 * Lambda-compatible transformer for tRPC
 *
 * Use this instead of SuperJSON to avoid serialization failures in Lambda
 */
export const lambdaTransformer = {
  input: {
    serialize: (object: unknown) => transformValue(object),
    deserialize: (object: unknown) => untransformValue(object),
  },
  output: {
    serialize: (object: unknown) => transformValue(object),
    deserialize: (object: unknown) => untransformValue(object),
  },
};
