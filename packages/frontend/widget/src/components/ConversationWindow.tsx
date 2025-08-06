import React, { useEffect, useState } from 'react';
import './styles/ConversationWindow.module.scss';

const ConversationWindow = () => {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(prev => !prev);
    // Connect to ElevenLabs STT here
  };

  useEffect(() => {
    if (isRecording) {
      // Simulate live transcript input (stub)
      const id = setInterval(() => {
        setTranscript(t => [...t, "Sample voice input..."]);
      }, 3000);
      return () => clearInterval(id);
    }
  }, [isRecording]);

  return (
    <div className="conversation-window">
      <h3>Talk to Jess</h3>
      <button onClick={toggleRecording}>{isRecording ? "Stop" : "Start"} Chat</button>
      <div className="transcript">
        {transcript.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
};

export default ConversationWindow;
