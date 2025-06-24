// GoCardless API Types
export type GoCardlessTokenRequest = {
    secret_id: string;
    secret_key: string;
};

export type GoCardlessTokenResponse = {
    access: string;
    access_expires: number;
    refresh: string;
    refresh_expires: number;
};

export type GoCardlessRefreshTokenRequest = {
    refresh: string;
};

export type GoCardlessRefreshTokenResponse = {
    access: string;
    access_expires: number;
};

export type GoCardlessInstitution = {
    id: string;
    name: string;
    bic: string;
    transaction_total_days: string;
    countries: string[];
    logo: string;
    max_access_valid_for_days: string;
};

export type GoCardlessAgreementRequest = {
    institution_id: string;
    max_historical_days: number;
    access_valid_for_days: number;
    access_scope: string[];
};

export type GoCardlessAgreementResponse = {
    id: string;
    created: string;
    accepted?: string;
    institution_id: string;
    max_historical_days: number;
    access_valid_for_days: number;
    access_scope: string[];
    status: string;
};

export type GoCardlessRequisitionRequest = {
    redirect: string;
    institution_id: string;
    reference: string;
    agreement?: string;
    user_language: string;
};

export type GoCardlessRequisitionResponse = {
    id: string;
    created: string;
    redirect: string;
    status: string;
    institution_id: string;
    agreement?: string;
    reference: string;
    accounts: string[];
    user_language: string;
    link: string;
    ssn?: string;
    account_selection: boolean;
    redirect_immediate: boolean;
};

export type GoCardlessAccountResponse = {
    account: {
        id: string;
        iban?: string;
        currency: string;
        ownerName?: string;
        product?: string;
        cashAccountType?: string;
        status?: string;
        bic?: string;
        linkedAccounts?: string;
        usage?: string;
        details?: string;
    };
};

export type GoCardlessBalance = {
    balanceAmount: {
        amount: string;
        currency: string;
    };
    balanceType: string;
    lastChangeDateTime: string;
    referenceDate: string;
};

export type GoCardlessBalancesResponse = {
    balances: GoCardlessBalance[];
};

export type GoCardlessTransaction = {
    entryReference?: string;
    internalTransactionId?: string;
    debtorName?: string;
    debtorAccount?: {
        iban: string;
    };
    transactionAmount: {
        currency: string;
        amount: string;
    };
    bookingDate: string;
    valueDate: string;
    remittanceInformationUnstructured?: string;
    remittanceInformationUnstructuredArray?: string[];
    bankTransactionCode?: string;
};

export type GoCardlessTransactionsResponse = {
    transactions: {
        booked: GoCardlessTransaction[];
        pending?: GoCardlessTransaction[];
    };
};



export type Institution = {
    id: string;
    name: string;
    bic: string;
    transaction_total_days: string;
    countries: string[];
    logo: string;
    max_access_valid_for_days: string;
};

export type Transaction = {
    entryReference?: string;
    internalTransactionId?: string;
    debtorName?: string;
    debtorAccount?: {
        iban: string;
    };
    transactionAmount: {
        currency: string;
        amount: string;
    };
    bookingDate: string;
    valueDate: string;
    remittanceInformationUnstructured?: string;
    remittanceInformationUnstructuredArray?: string[];
    bankTransactionCode?: string;
};

export type Account = {
    id: string;
    iban?: string;
    currency: string;
    ownerName?: string;
    product?: string;
    cashAccountType?: string;
    status?: string;
    bic?: string;
    linkedAccounts?: string;
    usage?: string;
    details?: string;
    balances?: {
        balanceAmount: {
            amount: string;
            currency: string;
        };
        balanceType: string;
        lastChangeDateTime: string;
        referenceDate: string;
    }[];
};

export type Balance = {
    balanceAmount: {
        amount: string;
        currency: string;
    };
    balanceType: string;
    lastChangeDateTime: string;
    referenceDate: string;
};