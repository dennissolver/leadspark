import styles from './styles/ConversationWindow.module.scss';


const ConversationWindow = () => {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(prev => !prev);
    // Connect to ElevenLabs STT here