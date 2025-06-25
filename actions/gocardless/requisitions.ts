'use server';

import { GoCardlessInstitution } from '@/types/gocardless-types';
import { getRequisitionDb } from '@/utils/db-utils';
import { randomUUID } from 'crypto';
import { GoCardlessClient } from '@/lib/gocardless-client';

// Create a singleton instance for server actions
const client = new GoCardlessClient();

async function saveRequisitionMapping(referenceId: string, requisitionId: string) {
    const db = await getRequisitionDb();
    await db.update(({ mappings }) => {
        mappings[referenceId] = requisitionId;
    });
}

export async function getInstitutions(country: string): Promise<GoCardlessInstitution[]> {
    try {
        const institutions = await client.getInstitutions(country);
        return institutions;
    } catch (error: any) {
        throw new Error('Failed to fetch institutions');
    }
}

async function createEndUserAgreement(institutionId: string) {
    try {
        const agreement = await client.createEndUserAgreement(institutionId);
        return agreement;
    } catch (error: any) {
        throw error; // Re-throw to be handled by caller
    }
}

async function createRequisition(institutionId: string, referenceId: string, redirectUrl: string, agreementId?: string) {
    const session = await client.createRequisition(institutionId, referenceId, redirectUrl, agreementId);
    return session;
}

export async function initializeSession(institutionId: string) {
    try {
        const referenceId = randomUUID();
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/gocardless/callback`;

        // Optional: Create an end user agreement with custom terms
        let agreementId: string | undefined;
        try {
            const agreement = await createEndUserAgreement(institutionId);
            agreementId = agreement.id;
        } catch (error) {
            // Token refresh failed, will generate new token
        }

        // Create requisition
        const session = await createRequisition(institutionId, referenceId, redirectUrl, agreementId);

        // Store the mapping for callback handling
        await saveRequisitionMapping(referenceId, session.id);

        return {
            link: session.link,
            requisitionId: session.id,
            referenceId: referenceId,
        };
    } catch (error: any) {
        throw new Error('Failed to initialize session');
    }
}

export async function getAgreementById(agreementId: string) {
    try {
        const agreement = await client.getAgreementById(agreementId);
        return agreement;
    } catch (error: any) {
        throw new Error('Failed to fetch agreement details');
    }
}

export async function testRequisitionExists(requisitionId: string) {
    try {
        const requisition = await client.getRequisition(requisitionId);
        return requisition;
    } catch (error: any) {
        return null;
    }
}

export async function getRequisitionIdFromReference(referenceId: string): Promise<string | null> {
    const requisitionId = await getRequisitionIdFromMapping(referenceId);
    if (requisitionId) {
        return requisitionId;
    }
    return null;
}

export async function getRequisitionIdFromMapping(referenceId: string): Promise<string | null> {
    const db = await getRequisitionDb();
    return db.data.mappings[referenceId] || null;
}
