import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image, quest } = await req.json();

    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    console.log("🟡 Sending image to MiniMax Vision...");

    const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: "abab6.5-chat", // Or MiniMax-Text-01 if enabled for vision
        messages: [
          {
            role: "system",
            content: "You are a scavenger hunt judge. You will be given a quest and an image. Your job is to determine if the image proves the user completed the quest. Respond ONLY in JSON format: { \"success\": boolean, \"reason\": \"a short 1-sentence hyped beast-style comment\" }"
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Quest: ${quest}` },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    // Parse the stringified JSON content from the LLM
    const result = JSON.parse(data.choices[0].message.content);

    console.log("🟢 Vision Result:", result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("🔴 Vision Pipeline Error:", error);
    return NextResponse.json({ success: false, reason: "My brain glitched! Try again." }, { status: 500 });
  }
}