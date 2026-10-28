import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, customWorkoutsPath, McpError } from './utils/toolHelpers.js';
import AdmZip from 'adm-zip';

export const method = 'downloadCustomWorkoutsFromS3';
export const description = `List the user's custom cycling workouts with their full definition (Id, name, steps, power targets, intervals): downloads the account's workout ZIP from MyWhoosh storage and returns {workouts: [...parsed JSON...], count, totalCount}. Use it to check which workouts exist before creating a duplicate, to find the Id of a workout to update or delete, or to confirm that an upload landed (uploads are asynchronous, so a workout sent a moment ago may not be listed yet).`;
export const parameters = z.object({});

export async function handler(
  _args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const uploadInfo = (await extra.client.get(customWorkoutsPath(), { baseUrl: 'COACHING' })) as {
      data: { workoutZipUrl: string; workoutCount: number };
    };

    if (!uploadInfo.data?.workoutZipUrl) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ workouts: [], count: 0 }, null, 2) }],
      };
    }

    // Download ZIP from S3
    const response = await fetch(uploadInfo.data.workoutZipUrl);
    if (!response.ok) {
      throw new McpError(-32603, `Failed to download workouts: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Extract ZIP
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    const workouts = [];
    for (const entry of zipEntries) {
      if (!entry.isDirectory && entry.entryName.endsWith('.json')) {
        const content = new TextDecoder('utf-8').decode(entry.getData());
        try {
          const workout = JSON.parse(content);
          workouts.push(workout);
        } catch (parseError) {
          console.error(`Failed to parse ${entry.entryName}:`, parseError);
        }
      }
    }

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({ 
          workouts, 
          count: workouts.length,
          totalCount: uploadInfo.data.workoutCount 
        }, null, 2) 
      }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
