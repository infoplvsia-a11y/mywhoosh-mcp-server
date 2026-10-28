import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export { McpError };

export function asMcpError(error: unknown): McpError {
  const message = error instanceof Error ? error.message : String(error);
  return new McpError(ErrorCode.InternalError, message);
}

// MyWhoosh keeps custom workouts per sport, and the sport type (0 = cycling) is both the top-level
// SportsModeType of an upload and the first path segment of the list/delete routes. That segment
// used to hold the WhooshId, which the server casts to a number: the "Cast to Number failed for
// value NaN at path sportsModeType" error of issue #1.
export const CYCLING_SPORT_TYPE = 0;

export function customWorkoutsPath(workoutId?: number): string {
  const base = `/client/custom-workout-upload/${CYCLING_SPORT_TYPE}`;
  return workoutId === undefined ? base : `${base}/${workoutId}`;
}
