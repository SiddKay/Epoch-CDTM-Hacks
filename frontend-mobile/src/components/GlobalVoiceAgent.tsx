import React, { useCallback } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useUploadInteraction } from '@/contexts/UploadInteractionContext'; // Adjust path

const AGENT_ID = 'syHWaObWae1s7F423sFJ';

const GlobalVoiceAgent: React.FC = () => {
  const { interactionData } = useUploadInteraction();
  const {
    startSession,
    endSession,
    status,
    // Add other properties from useConversation if needed:
    // messages, transcript, isRecording, isPlaying, isConnected, error
  } = useConversation({
    onConnect: () => console.log('Voice agent connected'),
    onDisconnect: () => console.log('Voice agent disconnected'),
    onMessage: (message) => console.log('Voice agent message:', message), // Agent's spoken response
    onError: (error) => console.error('Voice agent error:', error),
    // onUserInput: (input) => console.log('User input transcript:', input), // Transcript of user speech
  });

  const handleStartConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const dynamicVariables: {
        skipped: boolean;
        accepted?: boolean;
        reason?: string;
      } = {
        skipped: false, // Default
      };

      if (interactionData) {
        dynamicVariables.skipped = interactionData.skipped === true;
        if (interactionData.skipped === false) {
          // Only include accepted and reason if not skipped
          dynamicVariables.accepted = interactionData.accepted === true;
          dynamicVariables.reason =
            interactionData.reason || 'No specific reason provided.';
        }
        // You could also add:
        // dynamicVariables.document_type = interactionData.documentType;
      } else {
        // Default context if no interaction data is available (e.g., agent started on a different page)
        dynamicVariables.reason = 'No recent document interaction.';
      }

      console.log(
        'Starting conversation with dynamic variables:',
        dynamicVariables
      );

      await startSession({
        agentId: AGENT_ID,
        dynamicVariables: dynamicVariables,
        // clientTools: { /* Define any client tools if needed */ }
      });
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      // Consider user-friendly error display, e.g., using a toast
    }
  }, [startSession, interactionData]);

  const handleStopConversation = useCallback(async () => {
    try {
      await endSession();
    } catch (error) {
      console.error('Failed to stop voice conversation:', error);
    }
  }, [endSession]);

  return (
    <div className="flex justify-center w-full my-4">
      {status === 'connected' ? (
        <Button
          onClick={handleStopConversation}
          variant="destructive"
          size="icon"
          className="rounded-full w-24 h-24 shadow-lg"
        >
          <MicOff className="h-14 w-14" />
          <span className="sr-only">Stop Agent</span>
        </Button>
      ) : (
        <Button
          onClick={handleStartConversation}
          variant="secondary" // Or your preferred style
          size="icon"
          className="rounded-full w-24 h-24 shadow-lg bg-blue-500 hover:bg-blue-600 text-white" // Example styling
        >
          <Mic className="h-14 w-14" />
          <span className="sr-only">Start Agent</span>
        </Button>
      )}
      {/* You can add more UI elements here to display status, messages, etc. */}
      {/* For example: <p className="text-xs text-gray-500 mt-1">Status: {status}</p> */}
    </div>
  );
};

export default GlobalVoiceAgent;
