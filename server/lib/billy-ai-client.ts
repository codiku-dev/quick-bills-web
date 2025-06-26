import { SimplifiedTransaction, SimplifiedTransactionWithBillImage } from '@/types/simplified-transaction-types';
import { LLM, LMStudioClient } from '@lmstudio/sdk';
import { z } from 'zod';
import { fileToBase64 } from '../../lib/utils';
import { SimplifiedTransactionSchema } from '@/schemas/simplified-transaction-schema';

/*
 Client is a singleton instance of the Billy Ai client.
 It is used to generate matching transactions from images of bills.
 It's made to be used from server actions.
 
 The constructor runs ONCE at server startup and creates the LMStudioClient immediately.
 The model is loaded lazily on first use, but the client is ready from startup.
 The model context is cleared between requests.
*/

const getContextFromSimplifiedTransactionList = (simplifiedTransactionList: SimplifiedTransaction[]) => `
You are a billing image analyser API. 

As input is an array of bills objects ( label, price and date of bill).

You will receive an image of bill.
Return the matching element from the array exactly as is.

Add an extra propertie in the object that is "detail" where you explain what made you chose this one

Try to find even partial information that could help you find the right item

There must be at least a partial match between the label and the image otherwise return null

Make sure to return the exact item from the array, same id, same label, same price, same date.

Return the exact item from the array in pure JSON, no markdown, no code blocks.

DATA: 
${JSON.stringify(
  simplifiedTransactionList.map(item => ({ id: item.id, label: item.label, price: item.price, date: item.date })),
  null,
  2
)}
`;

export class BillyAiClient {
  private static instance: BillyAiClient | null = null;
  private client: LMStudioClient | null = null;
  private modelName: string;
  private model: LLM | null = null;
  private isInitialized: boolean = false;

  private constructor(modelName: string = 'google/gemma-3-12b') {
    this.modelName = modelName;
  }

  public static getInstance(modelName?: string): BillyAiClient {
    if (!BillyAiClient.instance) {
      BillyAiClient.instance = new BillyAiClient(modelName);
    }
    return BillyAiClient.instance;
  }

  async init() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🔄 [BILLY-AI] Creating LMStudioClient...');

      // Create client with basic configuration
      this.client = new LMStudioClient({
        baseUrl: process.env.LMSTUDIO_URL || 'http://localhost:1234',
        verboseErrorMessages: true,
      });

      console.log(`🔄 [BILLY-AI] Loading model ${this.modelName}...`);

      try {
        this.model = await this.client.llm.model(this.modelName);
        console.log('🔄 [BILLY-AI] Model loaded successfully');
        const modelInfo = await this.model.getModelInfo();
        console.log('🔄 [BILLY-AI] Model info:', modelInfo);
      } catch (modelError: any) {
        console.warn(`⚠️ [BILLY-AI] Model loading attempt failed:`, modelError.message);
        throw new Error(
          `Failed to load model. Make sure LMStudio is running and the model ${this.modelName} is available. Error: ${modelError.message}`
        );
      }

      this.isInitialized = true;
      console.log('✅ [BILLY-AI] Model loaded successfully');
    } catch (error) {
      console.error('❌ [BILLY-AI] Error loading model:', error);
      throw error;
    }
  }

  async clearContext() {
    if (this.model) {
      try {
        // Reinitialize the model to clear conversation history
        this.model = await this.client!.llm.model(this.modelName);
      } catch (error) {
        console.warn('⚠️ [BILLY-AI] Error clearing context:', error);
      }
    } else {
      console.warn('⚠️ [BILLY-AI] No model initialized, cannot clear context');
    }
  }

  async requestAiForStructuredResponse<T>(
    prompt: string,
    attachmentsBase64: string[],
    context: string,
    zodSchema?: z.ZodSchema<T>
  ): Promise<T> {
    try {
      // Ensure client is initialized
      await this.init();
      console.log('🔄 [BILLY-AI] context:', context);
      // Prepare the images from base64 - use the correct format
      const images = await Promise.all(
        attachmentsBase64.map((base64, i) => this.client!.files.prepareImageBase64(`billImage-${i}.jpg`, base64))
      );

      // Send the images to the model with structured response
      const prediction = await this.model!.respond(
        [
          {
            role: 'system',
            content: context,
          },
          {
            role: 'user',
            content: prompt,
            images,
          },
        ],
        {
          temperature: 0,
          topKSampling: 40,
          repeatPenalty: 1.1,
          minPSampling: 0.05,
          topPSampling: 0.95,
          maxTokens: 3000,
          // structured: zodSchema,
        }
      );

      console.log('🔄 [BILLY-AI] Raw prediction:', prediction.content);

      // Handle the response - it might come with markdown formatting even with structured output
      let content = prediction.content;

      // Remove markdown code blocks if present
      if (content.includes('```json')) {
        console.log('🔄 [BILLY-AI] Detected ```json markdown, cleaning...');
        // Remove ```json at the beginning and ``` at the end
        content = content
          .replace(/^```json\n?/, '') // Remove ```json at the beginning
          .replace(/\n?```$/, '') // Remove ``` at the end
          .trim();
      } else if (content.includes('```')) {
        console.log('🔄 [BILLY-AI] Detected ``` markdown, cleaning...');
        content = content
          .replace(/^```\n?/, '') // Remove ``` at the beginning
          .replace(/\n?```$/, '') // Remove ``` at the end
          .trim();
      } else {
        console.log('🔄 [BILLY-AI] No markdown detected');
      }

      console.log('🔄 [BILLY-AI] Cleaned content:', content);

      // Validate with Zod schema if provided
      if (zodSchema) {
        try {
          // Parse the cleaned JSON content
          const parsedContent = JSON.parse(content);
          console.log('🔄 [BILLY-AI] Successfully parsed JSON:', parsedContent);
          return zodSchema.parse(parsedContent);
        } catch (validationError) {
          console.error('❌ [BILLY-AI] Zod validation failed:', validationError);
          throw new Error(`Failed to validate structured output: ${validationError}`);
        }
      } else {
        return JSON.parse(content) as T;
      }
    } catch (error: any) {
      console.error('❌ [BILLY-AI] Error sending structured message:', error.message);
      throw new Error(`Failed to send structured message: ${error.message}`);
    }
  }

  async generateMatchingTransactions(
    billsImages: File[],
    simplifiedTransactionsToCheck: SimplifiedTransaction[]
  ): Promise<SimplifiedTransactionWithBillImage[]> {
    const matchingTransactions = await Promise.all(
      billsImages.map(async (billsImage, i) => {
        const matchingTransaction = await this.generateMatchingTransaction(billsImage, simplifiedTransactionsToCheck);
        return matchingTransaction;
      })
    );
    return matchingTransactions;
  }

  async generateMatchingTransaction(
    billsImage: File,
    simplifiedTransactionsToCheck: SimplifiedTransaction[]
  ): Promise<SimplifiedTransactionWithBillImage> {
    await this.clearContext();
    const base64Image = await fileToBase64(billsImage);
    const response = await this.requestAiForStructuredResponse(
      '',
      [base64Image],
      getContextFromSimplifiedTransactionList(simplifiedTransactionsToCheck),
      SimplifiedTransactionSchema
    );
    return { ...response, base64Image };
  }
}

// Export the singleton instance
export const billyAiClient = BillyAiClient.getInstance();
