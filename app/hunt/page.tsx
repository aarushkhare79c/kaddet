'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function ScavengerHuntUI() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [winData, setWinData] = useState({ points: 0, reason: "" });
  const [beastSpeech, setBeastSpeech] = useState<string | null>(null); // New: For MrBeast's chat bubble

  // --- AUDIO STATE & REFS ---
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- IMAGE STATE & REFS ---
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
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
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = sendAudioToAgent;
      audioChunksRef.current = [];
      mediaRecorder.start();
      setIsRecording(true);
      setBeastSpeech(null); // Clear old speech when recording new
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsLoading(true);
    }
  };

  const sendAudioToAgent = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('username', "Dylan");

    try {
      const response = await fetch('/api/agent', { method: 'POST', body: formData });
      const data = await response.json();

      // Renamed 'success' to 'isAtLocation' to differentiate from 'Win'
      if (data.isAtLocation || data.success) {
        setBeastSpeech("🔥 YOU'RE IN THE RIGHT SPOT! Snap a photo now to claim your points!");
      } else {
        setBeastSpeech(data.text); 
      }
    } catch (error) {
      console.error("Audio Agent Error:", error);
      setBeastSpeech("Connection lost! Try talking to me again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 2. IMAGE CAPTURE & VISION LOGIC
  // ==========================================
  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCapturedFile(file);
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitProof = async () => {
    if (!capturedFile) return;
    setIsSubmitting(true);
    setBeastSpeech(null);

    try {
      const base64Image = await convertToBase64(capturedFile);
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64Image,
          quest: "The giant glass pyramid by the museum",
          username: "Dylan"
        }),
      });

      if (!response.ok) throw new Error("Vision API failed");
      const data = await response.json();

      if (data.success) {
        setWinData({ points: 500, reason: data.reason });
        setShowSuccess(true);
        setImagePreview(null);
        setCapturedFile(null);
      } else {
        alert(`REJECTED: ${data.reason}`);
      }
    } catch (error) {
      console.error("Vision Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 text-slate-900 flex flex-col items-center p-4 font-sans selection:bg-pink-300">
      <div className="w-full max-w-md flex flex-col gap-6 mt-4 pb-24">
        
        {/* Header */}
        <header className="flex flex-col gap-3 bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-start">
            <Link href="/" className="bg-yellow-400 border-2 border-black px-4 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm hover:bg-yellow-300 transition-all">
              ◀ <span className="uppercase font-black">Home</span>
            </Link>
            <div className="text-right flex flex-col items-end">
              <div className="bg-yellow-400 border-2 border-black px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-xl font-black leading-none">2,450</p>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Points</p>
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-blue-600 uppercase">City Hunter</h1>
        </header>

        {/* Roster Strip */}
        <section className="flex gap-2 overflow-x-auto pb-2 px-1 hide-scrollbar">
          {mockRoster.map((player) => (
            <div key={player.id} className={`flex-shrink-0 flex items-center gap-2 bg-white border-4 border-black p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${player.isSpeaking ? 'border-green-500 ring-4 ring-green-200' : ''}`}>
              <div className="w-10 h-10 flex items-center justify-center bg-slate-200 border-2 border-black rounded-lg text-xl relative">
                {player.avatar}
                {player.isSpeaking && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative h-3 w-3 rounded-full bg-green-500 border border-black"></span></span>}
              </div>
              <div className="flex flex-col pr-1">
                <span className="font-black text-xs uppercase leading-tight">{player.name}</span>
                <span className="text-[10px] font-bold text-blue-600">{player.points} pts</span>
              </div>
            </div>
          ))}
        </section>

        {/* Current Quest Card */}
        <section className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden transform rotate-1">
          <div className="absolute -right-6 -top-2 bg-pink-500 text-white font-black text-xs px-8 py-2 uppercase rotate-12 border-2 border-black">Hot</div>
          <h2 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-1">Current Mission</h2>
          <p className="text-3xl font-black leading-tight">Find the giant glass pyramid by the museum! 🏛️</p>
        </section>

        {/* MR BEAST CHAT BUBBLE */}
        {beastSpeech && (
          <div className="bg-blue-600 border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-4 duration-300">
            <p className="text-white font-black text-[10px] uppercase tracking-widest mb-1">💬 Message from GM</p>
            <p className="text-white font-bold italic leading-tight">"{beastSpeech}"</p>
          </div>
        )}

        {/* Action Zone */}
        {imagePreview ? (
          <section className="bg-slate-900 border-4 border-black rounded-3xl p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 relative">
            <div className="w-full h-64 border-4 border-white rounded-xl overflow-hidden bg-black relative">
              <img src={imagePreview} alt="Proof" className="object-cover w-full h-full opacity-80" />
              {isSubmitting && (
                <div className="absolute inset-0 z-20 overflow-hidden">
                   <div className="scanner-line"></div>
                   <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                   <div className="absolute bottom-4 left-4 text-green-400 font-mono text-[10px] font-bold animate-pulse uppercase tracking-widest">
                     Analyzing Pixels...
                   </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setImagePreview(null)} disabled={isSubmitting} className="flex-1 bg-slate-500 text-white border-4 border-black py-3 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-50">Retake</button>
              <button onClick={handleSubmitProof} disabled={isSubmitting} className="flex-[2] bg-green-400 text-black border-4 border-black py-3 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit Proof'}
              </button>
            </div>
          </section>
        ) : (
          <section className="flex flex-row justify-center items-center gap-6 py-4">
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageCapture} />
            <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-24 h-24 flex flex-col items-center justify-center rounded-full text-white bg-pink-500 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-pink-400">
              <span className="text-3xl mb-1">📸</span>
              <span className="text-[10px] font-black uppercase">Snap</span>
            </button>
            <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} disabled={isLoading} 
              className={`w-32 h-32 flex flex-col items-center justify-center rounded-full text-white transition-all border-4 border-black select-none ${isRecording ? 'bg-red-500 scale-95 shadow-none translate-y-2' : (isLoading ? 'bg-slate-400 shadow-none' : 'bg-blue-500 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-400')}`}>
              <span className="text-4xl mb-1">{isRecording ? '🔥' : (isLoading ? '⏳' : '🎤')}</span>
              <span className="text-[10px] font-black uppercase">{isRecording ? 'Listening' : (isLoading ? 'Thinking' : 'Talk')}</span>
            </button>
          </section>
        )}
      </div>

      <SuccessModal isOpen={showSuccess} points={winData.points} reason={winData.reason} onClose={() => setShowSuccess(false)} />

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .scanner-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: #4ade80;
          box-shadow: 0 0 15px #4ade80, 0 0 30px #4ade80;
          animation: scan 2s linear infinite;
        }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}} />
    </div>
  );
}

function SuccessModal({ isOpen, points, reason, onClose }: { isOpen: boolean; points: number; reason: string; onClose: () => void }) {
  useEffect(() => {
    if (isOpen) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#FF0000', '#00FF00', '#FFFF00', '#0000FF'] });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-yellow-400 border-8 border-black p-8 rounded-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full animate-in zoom-in slide-in-from-bottom-10">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">🏆</div>
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2 italic">Epic Win!</h2>
          <div className="inline-block bg-black text-white px-4 py-1 rounded-full font-black text-xl mb-6">+{points} PTS</div>
          <p className="text-lg font-bold leading-tight mb-8">"{reason}"</p>
          <button onClick={onClose} className="w-full bg-blue-600 text-white border-4 border-black py-4 rounded-2xl font-black text-xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">Next Mission!</button>
        </div>
      </div>
    </div>
  );
}