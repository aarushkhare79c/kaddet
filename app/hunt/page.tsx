'use client';

import Link from 'next/link';
import React, { useState, useRef } from 'react';

export default function ScavengerHuntUI() {
  // --- AUDIO STATE & REFS ---
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- IMAGE STATE & REFS ---
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    try {
      console.log("Sending audio to backend...");
      const response = await fetch('/api/agent', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Backend failed");

      const data = await response.json();
      alert("MrBeast says: " + data.text); 
    } catch (error) {
      console.error("Error talking to agent:", error);
      alert("Oops, something broke! Check the terminal.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 2. IMAGE CAPTURE LOGIC
  // ==========================================
  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a temporary local URL to preview the image instantly
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
    }
  };

  const handleSubmitProof = () => {
    setIsSubmitting(true);
    // TODO: Send image to Convex Action -> MiniMax Vision API
    setTimeout(() => {
      setIsSubmitting(false);
      setImagePreview(null);
      alert("MiniMax says: THAT IS A RED BUILDING! +500 PTS!");
    }, 2000); // Fake network delay
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
    </div>
  );
}