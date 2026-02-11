import { NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if(!File){
        return NextResponse.json({ error: "No file uploaded"}, {status: 400})
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await mammoth.extractRawText({ buffer });

    return NextResponse.json({
        text: result.value.trim()
    });
}