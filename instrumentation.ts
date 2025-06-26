import { BillyAiClient } from './server/lib/billy-ai-client';

export async function register() {
  try {
    const billyAiClient = BillyAiClient.getInstance();
    await billyAiClient.init();
    console.log('✅ [INSTRUMENTATION] Billy AI client initialized');
  } catch (error) {
    console.error('❌ [INSTRUMENTATION] Failed to initialize Billy AI client:', error);
  }
}
