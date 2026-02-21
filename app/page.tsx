'use client';
import { useState, useRef } from 'react';

export default function ScavengerHuntUI() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8 text-yellow-400">KADDET 🏆</h1>
      
      <div className="bg-zinc-800 p-6 rounded-xl w-full max-w-md text-center shadow-lg">
        <h2 className="text-xl mb-4">Current Task: Find a Red Building!</h2>
        
        <button 
          onMouseDown={startRecording} 
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`w-40 h-40 rounded-full font-bold text-xl transition-all ${
            isRecording ? 'bg-red-500 scale-110 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          {isRecording ? 'Listening...' : 'Hold to Talk'}
        </button>

        {isLoading && <p className="mt-6 text-yellow-400 animate-bounce">MrBeast is thinking...</p>}
      </div>
    </div>
  );
}