
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Mic, MicOff } from 'lucide-react';

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Setup speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice assistant is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscript(finalTranscript || interimTranscript);
      
      // Process voice commands
      if (finalTranscript.trim()) {
        handleVoiceCommand(finalTranscript.trim());
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'no-speech') {
        toast({
          title: "No speech detected",
          description: "Please try speaking again.",
        });
      } else {
        toast({
          title: "Error",
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive",
        });
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    if (isListening) {
      recognition.start();
    }
    
    return () => {
      recognition.stop();
    };
  }, [isListening]);

  // Handle voice commands
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Simple command processing - in a real app, this would be more sophisticated
    if (lowerCommand.includes('upload')) {
      // Simulate click on upload button
      document.getElementById('file-upload')?.click();
      
      toast({
        title: "Voice Command",
        description: "Opening file upload dialog",
      });
    } 
    else if (lowerCommand.includes('doctor') || lowerCommand.includes('dashboard')) {
      // Navigate to doctor dashboard
      window.location.href = '/doctor';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-4">
        <Button
          variant={isListening ? "destructive" : "default"}
          onClick={() => setIsListening(prev => !prev)}
        >
          <div className="flex items-center space-x-2">
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                <span>Stop Voice Assistant</span>
                <span className="recording-indicator ml-2"></span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Start Voice Assistant</span>
              </>
            )}
          </div>
        </Button>
        
        {isListening && (
          <div className="relative p-4 bg-card border rounded-md w-full">
            <p className="text-sm font-medium">Listening... Try saying "Upload" or "Go to doctor dashboard"</p>
            <div className="mt-2 text-muted-foreground text-sm">
              {transcript || (
                <span className="italic">
                  Speak now...
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
