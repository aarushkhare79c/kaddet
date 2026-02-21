import { NextResponse } from 'next/server';
import { MR_BEAST_PROMPT } from '../../../lib/prompt';

export async function POST(req: Request) {
  try {
    console.log("🟢 1. Receiving audio from frontend...");
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    // ==========================================
    // STEP 1: SPEECHMATICS (Speech to Text)
    // ==========================================
    const speechmaticsData = new FormData();
    speechmaticsData.append('data_file', audioFile, 'audio.webm'); 
    
    const config = {
      type: "transcription",
      transcription_config: { operating_point: "enhanced", language: "en" }
    };
    speechmaticsData.append('config', JSON.stringify(config));

    console.log("🟡 2. Sending directly to Speechmatics API...");

    const response = await fetch('https://asr.api.speechmatics.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SPEECHMATICS_API_KEY}`
      },
      body: speechmaticsData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Speechmatics API Error: ${errorText}`);
    }

    const jobData = await response.json();
    console.log("🔵 3. Job created! ID:", jobData.id);
    const jobId = jobData.id;
    let jobStatus = "running";
    let transcriptText = "";

    console.log("⏳ 4. Waiting for Speechmatics to process the audio...");

    // Poll the API every 2 seconds until the job is done
    while (jobStatus === "running" || jobStatus === "new") {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusRes = await fetch(`https://asr.api.speechmatics.com/v2/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${process.env.SPEECHMATICS_API_KEY}` }
      });
      const statusData = await statusRes.json();
      jobStatus = statusData.job.status;

      if (jobStatus === "done") {
        const transcriptRes = await fetch(`https://asr.api.speechmatics.com/v2/jobs/${jobId}/transcript?format=txt`, {
          headers: { 'Authorization': `Bearer ${process.env.SPEECHMATICS_API_KEY}` }
        });
        
        transcriptText = await transcriptRes.text();
        console.log("🟢 5. Transcript received:", transcriptText);
        break; 
      } else if (jobStatus === "rejected") {
        throw new Error("Speechmatics rejected the audio during processing.");
      }
    }

    // Safety Check: If the user didn't say anything, skip MiniMax
    if (!transcriptText || transcriptText.trim() === "") {
      return NextResponse.json({ text: "I didn't hear anything! Hold the button and speak up!" });
    }

    // ==========================================
    // STEP 2: MINIMAX (The Brain / LLM)
    // ==========================================
    console.log("🟡 6. Sending transcript to MiniMax...");
    
    // app/api/agent/route.ts

    const llmResponse = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01", 
        messages: [
          { 
            role: "system", 
            content: MR_BEAST_PROMPT + " \n\nIMPORTANT: You must respond ONLY with a JSON object. No conversational filler before or after. Format: {\"text\": \"your message\", \"success\": boolean}" 
          },
          { role: "user", content: transcriptText }
        ],
        // 🛑 REMOVE 'response_format' entirely to fix the error
      })
    });
    
    const llmData = await llmResponse.json();

    // 1. Get the raw string content
    let rawContent = llmData.choices[0].message.content;

    // 2. THE CLEANER: Strip out Markdown code blocks if they exist
    const jsonRegex = /\{[\s\S]*\}/; // Matches anything between the first { and last }
    const match = rawContent.match(jsonRegex);

    if (!match) {
      throw new Error("MiniMax didn't return a valid JSON object.");
    }

    const parsedData = JSON.parse(match[0]);

    console.log("🟢 5. Cleaned MiniMax reply:", parsedData);

    // 3. Send the structured data back to the frontend
    return NextResponse.json({ 
      text: parsedData.text, 
      success: parsedData.success 
    });

    const beastReply = llmData.choices[0].message.content;
    console.log("🟢 7. Real MiniMax reply:", beastReply);

    // 🛑 Return the final MrBeast response to the frontend alert
    return NextResponse.json({ text: beastReply });

  } catch (error: any) {
    console.error("🔴 Pipeline Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}