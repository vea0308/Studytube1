import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API!);
const EMBEDDING_MODEL = "models/embedding-001";

export async function embedText(text: string, type: "QUERY" | "DOC" = "DOC"): Promise<number[]> {
    try {
        if (!process.env.GOOGLE_GEMINI_API) {
            throw new Error("GOOGLE_GEMINI_API environment variable is not set");
        }

        if (!text || text.trim().length === 0) {
            throw new Error("Text cannot be empty");
        }

        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

        const result = await model.embedContent({
            content: { role: "user", parts: [{ text: text.trim() }] },
            taskType: type === "QUERY" ? TaskType.RETRIEVAL_QUERY : TaskType.RETRIEVAL_DOCUMENT,
        });

        if (!result.embedding || !result.embedding.values) {
            throw new Error("No embedding values returned from API");
        }

        return result.embedding.values;
    } catch (error) {
        console.error("Embedding error:", error);
        throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
