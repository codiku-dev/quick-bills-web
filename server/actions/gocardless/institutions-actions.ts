'use server';
import { GoCardlessInstitution } from '@/types/gocardless-types';
import { GoCardlessService } from '@/server/services/gocardless-service';

const client = new GoCardlessService();

export async function getInstitutions(country: string): Promise<GoCardlessInstitution[]> {
  try {
    const institutions = await client.getInstitutions(country);
    return institutions;
  } catch (error: any) {
    throw new Error(`Failed to fetch institutions, ${error.message}`);
  }
}
