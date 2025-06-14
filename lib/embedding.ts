import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API!);
const EMBEDDING_MODEL = "models/embedding-001";

export async function embedText(text: string, type: "QUERY" | "DOC" = "DOC"): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    const result = await model.embedContent({
        content: { role: "user", parts: [{ text }] },
        taskType: type === "QUERY" ? TaskType.RETRIEVAL_QUERY : TaskType.RETRIEVAL_DOCUMENT,
    });

    return result.embedding.values;
}
