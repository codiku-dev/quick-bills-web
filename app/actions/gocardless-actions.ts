// Re-export all functions from the new modular structure
// This maintains backward compatibility while using the new organized structure
export {
    testGoCardlessConnection,
    checkRateLimitStatus,
    getInstitutions,
    initializeSession,
    getAgreementById,
    testRequisitionExists,
    getRequisitionIdFromReference,
    getTransactionsFromRequisition,
    getCachedTransactionsOnly,
} from './gocardless';
