import { LLM, LMStudioClient } from "@lmstudio/sdk";
import { z } from "zod";



export class BillyAiClient {
    private client: LMStudioClient;
    private modelName: string;
    private model: LLM | null;

    constructor(modelName: string = "google/gemma-3-12b") {
        this.modelName = modelName;
        this.client = new LMStudioClient();
        this.model = null;
    }

    async init() {
        this.model = await this.client.llm.model(this.modelName);
        return await this.model.getModelInfo();
    }

    async clearContext() {
        if (this.model) {
            // Reinitialize the model to clear conversation history
            this.model = await this.client.llm.model(this.modelName);
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
            // Prepare the images from base64 - use the correct format
            const images = await Promise.all(attachmentsBase64.map((base64, i) => this.client.files.prepareImageBase64(`billImage-${i}.jpg`, base64)));

            // Send the images to the model with structured response
            const prediction = await this.model!.respond(
                [
                    {
                        role: "system",
                        content: context
                    },
                    {
                        role: "user",
                        content: prompt,
                        images
                    }
                ],
                { temperature: 0, topKSampling: 40, repeatPenalty: 1.1, minPSampling: 0.05, topPSampling: 0.95, maxTokens: false, structured: zodSchema }

            );


            // Return the parsed and validated result
            return zodSchema ? zodSchema.parse(JSON.parse(prediction.content)) : JSON.parse(prediction.content) as T;
        } catch (error: any) {
            console.error('❌ [BILLY-AI] Error sending structured message:', error.message);
            throw new Error(`Failed to send structured message: ${error.message}`);
        }
    }

}

const billyAiClient = new BillyAiClient();

export { billyAiClient };