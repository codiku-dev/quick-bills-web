import {
  GoCardlessAgreementRequest,
  GoCardlessAgreementResponse,
  GoCardlessInstitution,
  GoCardlessRefreshTokenRequest,
  GoCardlessRefreshTokenResponse,
  GoCardlessRequisitionResponse,
  GoCardlessTokenRequest,
  GoCardlessTokenResponse,
  GoCardlessTransactionsResponse,
} from '@/types/gocardless-types';

export class GoCardlessService {
  private readonly apiBaseUrl: string;
  private readonly secretId: string;
  private readonly secretKey: string;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.apiBaseUrl = 'https://bankaccountdata.gocardless.com/api/v2';
    this.secretId = process.env.GOCARDLESS_SECRET_ID || 'secret_id_123';
    this.secretKey = process.env.GOCARDLESS_SECRET_KEY || '';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token (with 60-second buffer)
    if (this.accessToken && this.tokenExpiry > Date.now() + 60000) {
      return this.accessToken;
    }

    // If we have a refresh token, try to refresh first
    if (this.refreshToken && this.tokenExpiry < Date.now()) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify({
            refresh: this.refreshToken,
          } as GoCardlessRefreshTokenRequest),
        });

        if (response.ok) {
          const tokenData = (await response.json()) as GoCardlessRefreshTokenResponse;

          if (tokenData.access) {
            this.accessToken = tokenData.access;
            this.tokenExpiry = Date.now() + tokenData.access_expires * 1000;
            return this.accessToken;
          }
        }
      } catch (error) {
        // Token refresh failed, will generate new token
      }
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/token/new/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          secret_id: this.secretId,
          secret_key: this.secretKey,
        } as GoCardlessTokenRequest),
      });

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.status} ${response.statusText}`);
      }

      const tokenData = (await response.json()) as GoCardlessTokenResponse;

      if (!tokenData.access) {
        throw new Error('No access token received from API');
      }

      this.accessToken = tokenData.access;
      this.refreshToken = tokenData.refresh;
      this.tokenExpiry = Date.now() + tokenData.access_expires * 1000;

      return this.accessToken;
    } catch (error: any) {
      console.error('❌ [CLIENT] Error generating access token:', error.message);
      // Reset tokens on failure
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = 0;
      throw new Error('Failed to generate access token. Please check your credentials.');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Add a small delay before each request to avoid rate limits
    await this.delay(1000); // 1 second delay between requests

    const token = await this.getAccessToken();

    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        ...options,
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (response.status === 429) {
        // Parse detailed rate limit information from response body
        let rateLimitInfo = {};
        try {
          const errorBody = await response.json();
          rateLimitInfo = {
            summary: errorBody.summary,
            detail: errorBody.detail,
            status_code: errorBody.status_code,
          };
        } catch (e) {
          // If we can't parse the response body, use headers
          const retryAfter = response.headers.get('Retry-After');
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = response.headers.get('X-RateLimit-Reset');
          rateLimitInfo = { retryAfter, rateLimitRemaining, rateLimitReset };
        }

        console.error('❌ [CLIENT] Rate limit exceeded:', rateLimitInfo);
        throw new Error(`Rate limit exceeded: ${JSON.stringify(rateLimitInfo)}`);
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      throw error;
    }
  }

  // Institution methods
  async getInstitutions(country: string): Promise<GoCardlessInstitution[]> {
    return this.request<GoCardlessInstitution[]>(`/institutions/?country=${country}`);
  }

  // Agreement methods
  async createEndUserAgreement(institutionId: string): Promise<GoCardlessAgreementResponse> {
    return this.request<GoCardlessAgreementResponse>('/agreements/enduser/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: 90,
        access_valid_for_days: 90,
        access_scope: ['balances', 'details', 'transactions'],
      } as GoCardlessAgreementRequest),
    });
  }

  async getAgreementById(agreementId: string): Promise<GoCardlessAgreementResponse> {
    return this.request<GoCardlessAgreementResponse>(`/agreements/enduser/${agreementId}/`);
  }

  // Requisition methods
  async createRequisition(
    institutionId: string,
    referenceId: string,
    redirectUrl: string,
    agreementId?: string
  ): Promise<{ id: string; link: string; status: string; institution_id: string; created: string }> {
    return this.request<{ id: string; link: string; status: string; institution_id: string; created: string }>('/requisitions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: institutionId,
        reference: referenceId,
        ...(agreementId && { agreement: agreementId }),
        user_language: 'FR',
      }),
    });
  }

  async getRequisition(requisitionId: string): Promise<GoCardlessRequisitionResponse> {
    return this.request<GoCardlessRequisitionResponse>(`/requisitions/${requisitionId}/`);
  }

  // Transaction methods
  async getTransactions(accountId: string): Promise<GoCardlessTransactionsResponse> {
    return this.request<GoCardlessTransactionsResponse>(`/accounts/${accountId}/transactions/`);
  }

  // Connection test
  async testConnection(): Promise<{ success: boolean; institutionsCount?: number; hasSandbox?: boolean; error?: string }> {
    try {
      const institutions = await this.getInstitutions('fr');
      const sandboxInstitution = institutions.find((inst: GoCardlessInstitution) => inst.id === 'AGRICOLE_TOURAINE_POITOU_AGRIFRPPXXX');

      return {
        success: true,
        institutionsCount: institutions.length,
        hasSandbox: !!sandboxInstitution,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Rate limit check
  async checkRateLimit(requisitionId?: string): Promise<{ rateLimited: boolean;[key: string]: any }> {
    try {
      const testEndpoint = requisitionId ? `/requisitions/${requisitionId}/` : '/institutions/?country=fr';

      const response = await fetch(`${this.apiBaseUrl}${testEndpoint}`, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${await this.getAccessToken()}`,
        },
      });

      if (response.status === 429) {
        let rateLimitInfo = {};
        try {
          const errorBody = await response.json();
          rateLimitInfo = {
            summary: errorBody.summary,
            detail: errorBody.detail,
            status_code: errorBody.status_code,
          };
        } catch (e) {
          const retryAfter = response.headers.get('Retry-After');
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = response.headers.get('X-RateLimit-Reset');
          rateLimitInfo = { retryAfter, rateLimitRemaining, rateLimitReset };
        }

        return {
          rateLimited: true,
          ...rateLimitInfo,
        };
      }

      return { rateLimited: false };
    } catch (error: any) {
      console.error('❌ [CLIENT] Error checking rate limit status:', error.message);
      return { rateLimited: true, error: error.message };
    }
  }
}
