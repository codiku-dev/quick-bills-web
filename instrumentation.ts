import { BillyAiService } from './server/services/billy-ai-service';

/** 
 * Code run when the server starts
 *  - Create an instance of the Billy AI client
 */
export async function register() {
  try {
    const billyAiService = BillyAiService.getInstance(process.env.BILLY_AI_MODEL_NAME);
    await billyAiService.init();
    console.log('✅ [INSTRUMENTATION] Billy AI client initialized');
  } catch (error) {
    console.error('❌ [INSTRUMENTATION] Failed to initialize Billy AI client:', error);
  }
}
