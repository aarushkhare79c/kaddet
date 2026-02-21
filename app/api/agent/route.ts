import { NextResponse } from 'next/server';
import { MR_BEAST_PROMPT } from '../../../lib/prompt';

// Note: We removed the Convex import here because the Audio Agent 
// no longer awards points directly.

export async function POST(req: Request) {
  try {
    console.log("🟢 1. Receiving audio from frontend...");
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    // ==========================================
    // STEP 1: SPEECHMATICS (STT)
    // ==========================================
    const speechmaticsData = new FormData();
    speechmaticsData.append('data_file', audioFile, 'audio.webm'); 
    
    const config = {
      type: "transcription",
      transcription_config: { operating_point: "enhanced", language: "en" }
    };
    speechmaticsData.append('config', JSON.stringify(config));

    const smResponse = await fetch('https://asr.api.speechmatics.com/v2/jobs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.SPEECHMATICS_API_KEY}` },
      body: speechmaticsData
    });

    const jobData = await smResponse.json();
    const jobId = jobData.id;
    let jobStatus = "running";
    let transcriptText = "";

    // Polling Loop
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
        break; 
      }
    }

    if (!transcriptText.trim()) {
      return NextResponse.json({ text: "I didn't hear anything! Speak up!" });
    }

    // ==========================================
    // STEP 2: MINIMAX (Brain)
    // ==========================================
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
            content: MR_BEAST_PROMPT + " \n\nIMPORTANT: Respond ONLY in JSON. { \"text\": \"your reply\", \"isAtLocation\": boolean }. Set isAtLocation to true ONLY if the user describes being at the quest target." 
          },
          { role: "user", content: transcriptText }
        ]
      })
    });
    
    const llmData = await llmResponse.json();
    const rawContent = llmData.choices[0].message.content;

    // Clean JSON extraction
    const match = rawContent.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("MiniMax failed to return JSON");

    const parsedData = JSON.parse(match[0]);

    // ==========================================
    // RETURN TO FRONTEND
    // ==========================================
    // We do NOT add points here. We just tell the frontend if they are at the spot.
    return NextResponse.json({ 
      text: parsedData.text, 
      isAtLocation: parsedData.isAtLocation || parsedData.success || false
    });

  } catch (error: any) {
    console.error("🔴 Audio Pipeline Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}