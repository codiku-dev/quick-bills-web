import { LLM, LMStudioClient } from "@lmstudio/sdk";
import { z } from "zod";

const CONTEXT = `
You are a billing image analyser API. 


As input here is an array of bills objects ( label, price and date of bill).

You will receive an image of billl.
Return the matching element from the array exactly as is.

Add an extra propertie in the object that is "detail" where you explain what made you chose this one

Try to find even partial information that could help you find the right item

There must be at least a partial match between the label and the image otherwise return null

DATA: 
[
    {
        "id": "ff4673fe0bbfd7b8ae74fff882bdf5ff",
        "label": "PAIEMENT PAR CARTE X3141 BAGELSTEIN PARIS 914 28/12",
        "price": "19.10",
        "date": "2018-12-28"
    },
    {
        "id": "7b9182125c648a43a58426875a2d8089",
        "label": "PAIEMENT PAR CARTE X3141 STARBUCKS STPIE09811 11/03",
        "price": "8.50",
        "date": "2018-03-11"
    },
    {
        "id": "c23fc5053e1c2381c1b36046a0f087a3",
        "label": "PAIEMENT PAR CARTE X3141 BAGELSTEIN PARIS 914 25/03",
        "price": "9.7",
        "date": "2025-03-26"
    },
    {
        "id": "4655a644f7a6c512ba437b5f661ec08f",
        "label": "PAIEMENT PAR CARTE X3141 UEP*SUPER U MONTLOUI 25/05",
        "price": "23.99",
        "date": "2024-07-06"
    },
    {
        "id": "c26d0cefed9f704b5b90b95d605b227d",
        "label": "PAIEMENT PAR CARTE X3141 STARBUCKS STPIE09811 27/05",
        "price": "12",
        "date": "2018-04-11"
    },
    {
        "id": "20d12a1aaa3234a87b043d1decc9190c",
        "label": "PAIEMENT PAR CARTE X3141 UEP*SUPER U MONTLOUI 25/05",
        "price": "171.11",
        "date": "2025-05-26"
    },
    {
        "id": "7bffb509469d1f7bcd4248108e7b065d",
        "label": "PAIEMENT PAR CARTE X3141 STARBUCKS STPIE09811 06/07",
        "price": "6.50",
        "date": "2008-07-06"
    },
    {
        "id": "5316388eb02875b0d71f091565eb227e",
        "label": "PAIEMENT PAR CARTE X3141 MONOP MARK SPEN PARI 15/04",
        "price": "14.06",
        "date": "2025-04-16"
    },
    {
        "id": "a6597379b2f4693b9ba43beccbb7c999",
        "label": "PAIEMENT PAR CARTE X3141 BAGELSTEIN PARIS 914 25/03",
        "price": "3.7",
        "date": "2017-12-28"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea45",
        "label": "PAIEMENT PAR CARTE X3141 MONOP MARK SPEN PARI 15/04",
        "price": "5.75",
        "date": "2025-04-16"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea46",
        "label": "PAIEMENT PAR CARTE X3141 PITAYA NEUILLY SUR S 26/09",
        "price": "13.5",
        "date": "2022-09-26"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea47",
        "label": "PAIEMENT PAR CARTE X3141 PITAYA NEUILLY SUR S 28/03",
        "price": "12.5",
        "date": "2025-03-28"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea48",
        "label": "PAIEMENT PAR CARTE X3141 TOKYO PARIS 914 25/03",
        "price": "3.7",
        "date": "2025-12-28"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea49",
        "label": "PAIEMENT PAR CARTE X3141 CGF17255PAUL PARIS 29/08",
        "price": "3.95",
        "date": "2017-08-29"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea50",
        "label": "PAIEMENT PAR CARTE X3141 LECOINTRE PARIS S La 25/03",
        "price": "17.06",
        "date": "2025-03-26"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea51",
        "label": "VIREMENT EN VOTRE FAVEUR TLD EUROPE EURSEPA030660",
        "price": "760.00",
        "date": "2025-05-13"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea52",
        "label": "PRELEVEMENT ORANGE SA-ORANGE",
        "price": "19.65",
        "date": "2025-05-12"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea53",
        "label": "PAIEMENT PAR CARTE X3141 SQSP* INV181404000 N 10/05",
        "price": "16.8",
        "date": "2025-05-12"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea54",
        "label": "PAIEMENT PAR CARTE X3141 LW-SNCF CONNECT Pari 08/05",
        "price": "56.8",
        "date": "2025-05-09"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea55",
        "label": "PRELEVEMENT POLARIS CONSEILS",
        "price": "374.67",
        "date": "2025-05-20"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea56",
        "label": "PAIEMENT PAR CARTE X3141 TEN CHI SUN PARIS 14/05",
        "price": "18.0",
        "date": "2025-05-15"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea57",
        "label": "VIREMENT EMIS WEB Anais Galisson Remuneration",
        "price": "4000.0",
        "date": "2025-05-15"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea58",
        "label": "VIREMENT EN VOTRE FAVEUR VIR INST de CREME DE LA CREME",
        "price": "2403.20",
        "date": "2025-05-15"
    },
    {
        "id": "b531ae28edf03f80feb322190913ea59",
        "label": "PRELEVEMENT B2B DGFIP",
        "price": "6078.0",
        "date": "2025-05-15"
    }
]
`

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
                        content: CONTEXT
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