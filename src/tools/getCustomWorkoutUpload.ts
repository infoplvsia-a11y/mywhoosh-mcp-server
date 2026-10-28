import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, customWorkoutsPath, McpError } from './utils/toolHelpers.js';

export const method = 'getCustomWorkoutUpload';
export const description = `Low-level: returns the metadata of the user's custom cycling workout ZIP, {data: {userId, workoutZipUrl, workoutCount}}. workoutZipUrl is a pre-signed storage link that expires after about 10 minutes and gives access to the workouts to whoever holds it, so do not share it. You usually want downloadCustomWorkoutsFromS3, which downloads and parses it.`;
export const parameters = z.object({});

export async function handler(
  _args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const result = await extra.client.get(customWorkoutsPath(), { baseUrl: 'COACHING' });
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
