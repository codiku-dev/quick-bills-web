'use server';
import { GoCardlessInstitution } from '@/types/gocardless-types';
import { GoCardlessClient } from '@/server/lib/gocardless-client';

const client = new GoCardlessClient();

export async function getInstitutions(country: string): Promise<GoCardlessInstitution[]> {
  try {
    const institutions = await client.getInstitutions(country);
    return institutions;
  } catch (error: any) {
    throw new Error(`Failed to fetch institutions, ${error.message}`);
  }
}
