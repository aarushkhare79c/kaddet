import { NextResponse } from 'next/server';
import { MR_BEAST_PROMPT } from '../../../lib/prompt';
import { BatchClient } from '@speechmatics/batch-client'; 

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    console.log("🟢 1. Audio received from frontend!");

    const audioFile = (formData.get('audio') || formData.get('file')) as File;
    if (!audioFile || audioFile.size === 0) {
      throw new Error("Audio file is empty or missing!");
    }

    // ==========================================
    // STEP 1: SPEECHMATICS (Speech to Text)
    // ==========================================
    console.log("🟡 2. Sending to Speechmatics (SDK handles the waiting)...");
    
    const smClient = new BatchClient({ 
      apiKey: process.env.SPEECHMATICS_API_KEY as string,
      appId: "kaddet-hackathon" 
    });
    
    const userText = await smClient.transcribe(
      audioFile,
      { transcription_config: { language: "en" } },
      "txt" as any 
    );
    
    if (typeof userText !== 'string' || !userText.trim()) {
      throw new Error("Speechmatics returned empty text.");
    }

    console.log("🟢 3. Real Speechmatics text:", userText);

    // ==========================================
    // STEP 2: MINIMAX (The Brain / LLM)
    // ==========================================
    console.log("🟡 4. Sending to MiniMax...");
    
    // ⬇️ CHANGED TO .io INSTEAD OF .chat! ⬇️
    const llmResponse = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01", // 👈 CHANGED TO THE GLOBAL MODEL
        messages: [
          { role: "system", content: MR_BEAST_PROMPT },
          { role: "user", content: userText }
        ]
      })
    });
    
    const llmData = await llmResponse.json();
    
    if (llmData.base_resp && llmData.base_resp.status_code !== 0) {
      console.error("🔴 MiniMax Internal Error:", llmData.base_resp);
      throw new Error(`MiniMax rejected the request: ${llmData.base_resp.status_msg}`);
    }

    if (!llmData.choices || llmData.choices.length === 0) {
      console.error("🔴 MiniMax Raw Data:", llmData);
      throw new Error("MiniMax failed to return a valid response.");
    }

    const beastReply = llmData.choices[0].message.content;
    console.log("🟢 5. Real MiniMax reply:", beastReply);

    return NextResponse.json({ text: beastReply });

  } catch (error) {
    console.error("🔴 Pipeline Error:", error);
    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}