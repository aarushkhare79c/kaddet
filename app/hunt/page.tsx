'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function ScavengerHuntUI() {

	const [showSuccess, setShowSuccess] = useState(false);
	const [winData, setWinData] = useState({ points: 0, reason: "" });

  // --- AUDIO STATE & REFS ---
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- IMAGE STATE & REFS ---
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null); // New state for the raw file
  const fileInputRef = useRef<HTMLInputElement>(null);

  // MOCK DATA: Roster
  const mockRoster = [
    { id: "1", name: "You", avatar: "😎", points: 1200, isSpeaking: false },
    { id: "2", name: "Alex", avatar: "🤠", points: 800, isSpeaking: true },
    { id: "3", name: "Sam", avatar: "🤖", points: 450, isSpeaking: false },
  ];

  // ==========================================
  // 1. AUDIO RECORDING LOGIC
  // ==========================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = sendAudioToAgent;
      
      audioChunksRef.current = [];
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Please allow microphone access to talk to the Game Master.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsLoading(true); // Triggers the "Sending..." UI state
    }
  };

 const sendAudioToAgent = async () => {
  const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
  const formData = new FormData();
  formData.append('audio', audioBlob);

  formData.append('username', "Dylan");

  try {
    console.log("Sending audio to backend...");
    const response = await fetch('/api/agent', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error("Backend failed");

    const data = await response.json();

    // 1. Check if MiniMax thinks the user completed a task
    // (We assume MiniMax returns a 'success' boolean based on your prompt)
    if (data.success) {
      setWinData({ 
        points: 500, // Audio tasks might be worth fewer points than photo tasks
        reason: data.text 
      });
      setShowSuccess(true);
      
      // TODO: Trigger Convex mutation to add points
      // await addPoints({ amount: 250 });
    } else {
      // If it's just a regular chat response, you can use a Toast 
      // or just a temporary text overlay instead of a full modal
      alert("MrBeast says: " + data.text); 
    }

  } catch (error) {
    console.error("Error talking to agent:", error);
    alert("Oops, the Game Master is busy. Try again!");
  } finally {
    setIsLoading(false);
  }
};

  // ==========================================
  // 2. IMAGE CAPTURE LOGIC
  // ==========================================
	const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
	const file = event.target.files?.[0]; // Get the first file from the input

	if (file) {
		// 1. Store the raw File object for handleSubmitProof
		setCapturedFile(file);

		// 2. Create a temporary local URL for the UI preview
		const localUrl = URL.createObjectURL(file);
		setImagePreview(localUrl);

		// 3. (Optional) Log the size to make sure it's not too massive for the API
		console.log(`📸 Image Captured: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
	}
	};

  // Inside your ScavengerHuntUI component
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // We want to strip the "data:image/png;base64," prefix for some APIs
      // but keep it for others. MiniMax usually prefers the full data URL.
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
};

const handleSubmitProof = async () => {
  if (!capturedFile) {
    alert("No image captured!");
    return;
  }
  
  setIsSubmitting(true);

  try {
    // 1. Convert the File to Base64
    console.log("🟡 Converting image to Base64...");
    const base64Image = await convertToBase64(capturedFile);

    // 2. Send to the Vision API route
    console.log("🟡 Sending to MiniMax Vision Judge...");
    const response = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        image: base64Image,
        quest: "The giant glass pyramid by the museum" // You can pull this from your quest state
      }),
    });

    if (!response.ok) throw new Error("Vision API failed");

    const data = await response.json();
    
    // 3. Handle the AI's Decision
    // Inside handleSubmitProof after getting data from /api/vision
	if (data.success) {
	setWinData({ points: 500, reason: data.reason }); // or dynamic points
	setShowSuccess(true);
	setImagePreview(null);
	setCapturedFile(null);
	// Trigger Convex point update here!
	} else {
	// You might want a "FailModal" too, but for now:
	alert(`REJECTED: ${data.reason}`);
	}

  } catch (error) {
    console.error("🔴 Vision Error:", error);
    alert("The Judge is busy! Try submitting again.");
  } finally {
    setIsSubmitting(false);
  }
};

  

  // ==========================================
  // 3. THE UI RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-yellow-50 text-slate-900 flex flex-col items-center p-4 font-sans selection:bg-pink-300">
      <div className="w-full max-w-md flex flex-col gap-6 mt-4 pb-12">
        
        {/* Header: Navigation, Score, & Team Name */}
        <header className="flex flex-col gap-3 bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-start">
            <Link 
              href="/" 
              className="bg-yellow-400 border-2 border-black px-4 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm transform transition-transform active:translate-y-1 active:shadow-none hover:bg-yellow-300 flex items-center gap-2"
            >
              ◀ <span className="uppercase">Home</span>
            </Link>
            
            <div className="text-right flex flex-col items-end">
              <div className="bg-yellow-400 border-2 border-black px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-1">
                <p className="text-xl font-black text-black leading-none">2,450</p>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Points</p>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-blue-600 uppercase leading-none mb-1">City Hunter</h1>
            <p className="text-sm font-bold text-slate-500">Team: Night Owls</p>
          </div>
        </header>

        {/* Team Roster Strip */}
        <section className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x hide-scrollbar">
          {mockRoster.map((player) => (
            <div key={player.id} className={`flex-shrink-0 flex items-center gap-2 bg-white border-4 border-black p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] snap-center transition-transform ${player.isSpeaking ? 'scale-105 border-green-500 bg-green-50' : ''}`}>
              <div className="w-10 h-10 flex items-center justify-center bg-slate-200 border-2 border-black rounded-lg text-xl relative">
                {player.avatar}
                {player.isSpeaking && (
                  <span className="absolute -top-2 -right-2 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-black"></span>
                  </span>
                )}
              </div>
              <div className="flex flex-col pr-2">
                <span className="font-black text-sm uppercase leading-tight">{player.name}</span>
                <span className="text-xs font-bold text-blue-600">{player.points} pts</span>
              </div>
            </div>
          ))}
        </section>

        {/* Current Quest Card */}
        <section className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden transform rotate-1">
          <div className="absolute -right-6 -top-2 bg-pink-500 text-white font-black text-xs px-8 py-2 uppercase rotate-12 border-2 border-black">
            Hot
          </div>
          <h2 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-2">Current Mission</h2>
          <p className="text-3xl font-black leading-tight mb-4">
            Find the giant glass pyramid by the museum! 🏛️
          </p>
          <div className="flex items-center justify-between mt-6 pt-4 border-t-4 border-dashed border-slate-200">
            <span className="font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border-2 border-slate-300">
              📍 0.2 mi
            </span>
            <span className="font-black text-2xl text-pink-500 animate-pulse">+500 PTS</span>
          </div>
        </section>

        {/* Dynamic Action Zone: Image Review OR Dual Inputs */}
        {imagePreview ? (
          /* Image Review Modal */
          <section className="bg-slate-900 border-4 border-black rounded-3xl p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-white font-black uppercase tracking-widest text-center">Review Proof</h3>
            
            <div className="w-full h-64 border-4 border-white rounded-xl overflow-hidden bg-black relative">
              <img src={imagePreview} alt="Proof preview" className="object-cover w-full h-full" />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setImagePreview(null)}
                disabled={isSubmitting}
                className="flex-1 bg-slate-500 text-white border-4 border-black py-3 rounded-xl font-black uppercase hover:bg-slate-400 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:transform-none"
              >
                Retake
              </button>
              <button 
                onClick={handleSubmitProof}
                disabled={isSubmitting}
                className="flex-[2] bg-green-400 text-black border-4 border-black py-3 rounded-xl font-black uppercase hover:bg-green-300 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? 'Analyzing...' : 'Submit to Judge'}
              </button>
            </div>
          </section>
        ) : (
          /* Dual Input Zone: Camera and Mic */
          <section className="flex flex-row justify-center items-center gap-6 py-4">
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageCapture}
            />

            {/* Camera Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="relative w-24 h-24 flex flex-col items-center justify-center rounded-full text-white bg-pink-500 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-400 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all outline-none disabled:opacity-50 disabled:transform-none"
            >
              <span className="text-3xl mb-1">📸</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Snap</span>
            </button>

            {/* Microphone Button (Now wired to your actual logic!) */}
            <button 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isLoading}
              className={`relative z-10 w-32 h-32 flex flex-col items-center justify-center rounded-full text-white transition-all duration-150 border-4 border-black outline-none select-none disabled:transform-none ${
                isRecording 
                  ? 'bg-red-500 scale-95 shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] translate-y-2 translate-x-2' 
                  : (isLoading ? 'bg-slate-400 shadow-none' : 'bg-blue-500 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400')
              }`}
            >
              <span className="text-4xl mb-1">{isRecording ? '🔥' : (isLoading ? '⏳' : '🎤')}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isRecording ? 'Listening' : (isLoading ? 'Sending...' : 'Talk')}
              </span>
            </button>

          </section>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

	  <SuccessModal 
        isOpen={showSuccess} 
        points={winData.points} 
        reason={winData.reason} 
        onClose={() => setShowSuccess(false)} 
      />
    </div>
  );
}

// Simple Success Modal Component
function SuccessModal({ isOpen, points, reason, onClose }: { 
  isOpen: boolean; 
  points: number; 
  reason: string; 
  onClose: () => void 
}) {
  if (!isOpen) return null;

  useEffect(() => {
  if (isOpen) {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']
    });
  }
}, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-yellow-400 border-8 border-black p-8 rounded-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full transform animate-in zoom-in slide-in-from-bottom-10 duration-300">
        
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">🏆</div>
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">Epic Win!</h2>
          <div className="inline-block bg-black text-white px-4 py-1 rounded-full font-black text-xl mb-6">
            +{points} PTS
          </div>
          
          <p className="text-lg font-bold leading-tight mb-8">
            "{reason}"
          </p>

          <button 
            onClick={onClose}
            className="w-full bg-blue-600 text-white border-4 border-black py-4 rounded-2xl font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none hover:bg-blue-500"
          >
            Next Mission!
          </button>
        </div>
        
      </div>
    </div>
  );
}