"use client";

import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Mic } from 'lucide-react';

interface DoctorVoiceAssistantProps {
    isRecording: boolean;
    handleToggleRecording: () => void;
}

function DoctorVoiceAssistant({ isRecording, handleToggleRecording }: DoctorVoiceAssistantProps) {
    const [isListening, setIsListening] = useState(false);
    const [connection, setConnection] = useState<RTCPeerConnection | null>(null);
    const [micStream, setMicStream] = useState<MediaStream | null>(null);


    function onClickAction() {
        if (isListening) {
            stopAssistant();
        } else {
            startAssistant();
        }
        handleToggleRecording();
    }


    const startAssistant = async () => {
      const apiBaseUrl =
        window.location.hostname === 'localhost'
          ? 'http://localhost:8000'
          : 'https://epoch-cdtm-hacks-186667666313.europe-west3.run.app';
  
      try {
        const res = await fetch(`${apiBaseUrl}/session`);
        const { client_secret } = await res.json();
  
        const EPHEMERAL_KEY = client_secret.value;
  
        const pc = new RTCPeerConnection();
        setConnection(pc);
  
        const audioEl = new Audio();
        audioEl.autoplay = true;
        pc.ontrack = (event) => {
          audioEl.srcObject = event.streams[0];
        };
  
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        setMicStream(stream);
  
        const dc = pc.createDataChannel('oai-events');
        dc.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          console.log('[Realtime Event]', msg);
        };
  
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
  
        const sdpRes = await fetch(
          `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${EPHEMERAL_KEY}`,
              'Content-Type': 'application/sdp',
            },
            body: offer.sdp,
          }
        );
  
        const answerSDP = await sdpRes.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSDP });
  
        setIsListening(true);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: 'Failed to start voice assistant.',
          variant: 'destructive',
        });
      }
    };
  
    const stopAssistant = () => {
      // Stop all mic tracks
      micStream?.getTracks().forEach(track => track.stop());
      setMicStream(null);
  
      // Close the connection
      connection?.getSenders().forEach(sender => {
        try {
          sender.track?.stop();
        } catch (_) {}
      });
      connection?.close();
      setConnection(null);
  
      setIsListening(false);
    };

    return (
        <button
        onClick={onClickAction}
        aria-pressed={isRecording}
        aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 transition-all duration-200
          ${isRecording ? 'bg-red-600 border-red-700 animate-pulse-glow' : 'bg-blue-heading border-blue-heading hover:bg-blue-heading/80'}
          focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-heading/40`}
        style={{ boxShadow: isRecording ? '0 0 0 8px rgba(220,38,38,0.25), 0 4px 24px 0 rgba(0,0,0,0.25)' : '0 4px 24px 0 rgba(0,0,0,0.25)' }}
      >
        <Mic className="h-10 w-10 text-white" />
        <span className="sr-only">{isRecording ? 'Stop voice recording' : 'Start voice recording'}</span>
      </button>
    );
}

export default DoctorVoiceAssistant;