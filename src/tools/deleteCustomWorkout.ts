import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, customWorkoutsPath, McpError } from './utils/toolHelpers.js';

export const method = 'deleteCustomWorkout';
export const description = `Delete one custom cycling workout from the user's MyWhoosh library by its workout Id (the Id used in uploadCustomWorkout, also listed by downloadCustomWorkoutsFromS3). Irreversible: only do it on an explicit request, and confirm which workout with the user if there is any doubt.
Returns {"message": "Custom workout is being deleted."} when accepted; the deletion is asynchronous, so a list read straight afterwards may still show it for a moment.`;
export const parameters = z.object({
  workoutId: z
    .number()
    .int()
    .positive()
    .safe()
    .describe('Id of the custom workout, the same number used in uploadCustomWorkout'),
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const result = await extra.client.delete(customWorkoutsPath(args.workoutId), { baseUrl: 'COACHING' });

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
