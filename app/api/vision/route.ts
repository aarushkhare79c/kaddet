import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image, quest } = await req.json();

    if (!image) {
      return NextResponse.json({ success: false, reason: "No image received." }, { status: 400 });
    }

    // MiniMax sometimes fails if the Base64 string is too large or has a messy header.
    // Ensure it starts with 'data:image/...' 
    const formattedImage = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

    console.log("🟡 [VISION] Sending to MiniMax...");

    const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
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
            content: "You are a scavenger hunt judge. Answer ONLY in JSON: { \"success\": boolean, \"reason\": \"string\" }"
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Does this photo prove the user found: ${quest}?` },
              { 
                type: "image_url", 
                image_url: { url: formattedImage } 
              }
            ]
          }
        ]
      })
    });

    // --- DEEP LOGGING START ---
    if (!response.ok) {
      const errorDetail = await response.text();
      console.error("🔴 [MINIMAX ERROR]:", errorDetail);
      return NextResponse.json({ success: false, reason: "MiniMax rejected the request." }, { status: response.status });
    }
    // --- DEEP LOGGING END ---

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
	console.log("🤖 AI RAW CONTENT:", rawContent);

	// 1. Try to find JSON with Regex
	const match = rawContent.match(/\{[\s\S]*\}/);
	let result;

	if (match) {
	try {
		result = JSON.parse(match[0]);
	} catch (e) {
		console.error("JSON Parse failed, falling back to heuristic...");
	}
	}

	// 2. If JSON fails, use a "Heuristic" (The Safety Net)
	if (!result) {
	const isPositive = rawContent.toLowerCase().includes("yes") || 
						rawContent.toLowerCase().includes("true") ||
						rawContent.toLowerCase().includes("proves");
						
	result = {
		success: isPositive,
		reason: rawContent.slice(0, 100) // Just grab the first 100 chars of the AI's explanation
	};
	}

	return NextResponse.json(result);

  } catch (error: any) {
    console.error("🔴 [PIPELINE CRASH]:", error.message);
    return NextResponse.json({ success: false, reason: "Internal Server Error" }, { status: 500 });
  }
}