'use server';

import { db } from '@/lib/db';

const INCLUDED_USER_FIELDS = {
    requisitions: true,
    transactions: true
}

// User operations
export async function createUser(email?: string) {
    return await db.user.create({
        data: {
            email,
        },
    })
}

export async function getUserById(id: string) {
    return await db.user.findUnique({
        where: { id },
        include: INCLUDED_USER_FIELDS
    })
}

export async function getUserByRequisitionId(requisitionId: string) {
    return await db.user.findFirst({
        where: {
            requisition: {
                requisitionId
            }
        },
        include: INCLUDED_USER_FIELDS
    })
}


