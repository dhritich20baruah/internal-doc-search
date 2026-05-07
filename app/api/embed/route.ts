import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request){
    try {
        const {text} = await request.json();
        const model = genAI.getGenerativeModel({model: "gemini-embedding-2"});
        
        const result = await model.embedContent(text);
        const embedding = result.embedding.values;

        return Response.json({ embedding: result.embedding.values })
    } catch (error) {
        console.error("Embedding Error:", error);
        return NextResponse.json({ error: "Failure to embed" }, {status: 500})
    }
}