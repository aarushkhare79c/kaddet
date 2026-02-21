import { NextResponse } from 'next/server';
import { MR_BEAST_PROMPT } from '../../../lib/prompt';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    console.log("🟢 1. Audio received from frontend!");

    // ==========================================
    // STEP 1: SPEECHMATICS (Speech to Text)
    // ==========================================
    console.log("🟡 2. Sending to Speechmatics...");
    
    const sttResponse = await fetch('https://asr.api.speechmatics.com/v2/transcribe', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.SPEECHMATICS_API_KEY}` },
      body: formData 
    });
    
    const sttData = await sttResponse.json();
    const userText = sttData?.transcript || "I just found a really cool red building!"; 
    console.log("🟢 3. Speechmatics heard:", userText);

    // ==========================================
    // STEP 2: MINIMAX (The Brain / LLM)
    // ==========================================
    console.log("🟡 4. Sending to MiniMax...");
    
    const llmResponse = await fetch('https://api.minimax.chat/v1/text/chatcompletion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: "abab6.5s-chat", 
        messages: [
          { role: "system", content: MR_BEAST_PROMPT },
          { role: "user", content: userText }
        ]
      })
    });
    
    const llmData = await llmResponse.json();
    const beastReply = llmData.choices?.[0]?.message?.content || "LET'S GOOO! That's awesome!";

    console.log("🟢 5. MiniMax replied:", beastReply);

    return NextResponse.json({ text: beastReply });

  } catch (error) {
    console.error("🔴 Pipeline Error:", error);
    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}