import {GoogleGenerativeAI} from '@google/generative-ai';
import {NextRequest, NextResponse} from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest){
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) return NextResponse.json({ error: "no image provided"}, {status: 400})

        const buffer = await file.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");

        const model = genAI.getGenerativeModel({model: "gemini-3-flash-preview"});

        const prompt = `Perform a high-accuracy OCR on this image. Extract all text and maintain the logical structure. If it is a receipt or invoice, format it clearly. Return only the extracted text.`;
        
        const result = await model.generateContent([
            prompt, 
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                },
            },
        ]);

        return NextResponse.json({ text: result.response.text() });
    } catch (error) {
        console.error('Gemini OCR Error: ', error);
        return NextResponse.json({ error: "OCR failed" }, {status: 500})
    }
}