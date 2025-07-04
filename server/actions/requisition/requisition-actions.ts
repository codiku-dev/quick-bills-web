'use server';

import { db } from '@/lib/db';
import { GoCardlessService } from '@/server/services/gocardless-service';
import { randomUUID } from 'crypto';
import { headers } from 'next/headers';

const gocardlessService = new GoCardlessService();

export async function createRequisition(
    userId: string,
    institutionId: string
) {
    const referenceId = randomUUID();
    const redirectUrl = `${(await headers()).get('x-forwarded-proto') || 'http'}://${(await headers()).get('host')}/gocardless/callback`;

    // Optional: Create an end user agreement with custom terms
    const agreement = await gocardlessService.createEndUserAgreement(institutionId);

    // Create requisition
    const gocardlessRequisition = await gocardlessService.createRequisition(institutionId, referenceId, redirectUrl, agreement.id);

    return await db.requisition.create({
        data: {
            userId,
            requisitionId: gocardlessRequisition.id,
            institutionId,
        },
    });
}

export async function getRequisitionByRequisitionId(requisitionId: string) {
    return await db.requisition.findUnique({
        where: { requisitionId },
        include: { user: true, transactions: true },
    });
}

export async function updateRequisitionStatus(requisitionId: string, status: string) {
    return await db.requisition.update({
        where: { requisitionId },
        data: { status },
    });
}
