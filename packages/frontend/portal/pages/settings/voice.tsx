import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout';
import useSupabase from '../../hooks/useSupabase';
import styles from './voice.module.scss';

interface VoiceConfig {
  elevenlabsVoiceId: string;
  voiceModel: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speakerBoost: boolean;
  audioFormat: string;
  sampleRate: number;
  responseSpeed: number;
  voiceCloning: boolean;
  customVoiceFile?: File;
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
}

const VoiceSettingsPage: React.FC = () => {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [playingVoice, setPlayingVoice] = useState<string>('');
  const [testText, setTestText] = useState('Hello! This is how I will sound when speaking to your leads. I can help capture their information and schedule discovery calls.');
  const [generatingPreview, setGeneratingPreview] = useState(false);

  const [config, setConfig] = useState<VoiceConfig>({
    elevenlabsVoiceId: '',
    voiceModel: 'eleven_monolingual_v1',
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    speakerBoost: true,
    audioFormat: 'mp3_44100_128',
    sampleRate: 44100,
    responseSpeed: 1.0,
    voiceCloning: false
  });

  const voiceModels = [
    { value: 'eleven_monolingual_v1', label: 'Eleven Monolingual v1 (English)' },
    { value: 'eleven_multilingual_v1', label: 'Eleven Multilingual v1' },
    { value: 'eleven_multilingual_v2', label: 'Eleven Multilingual v2 (Beta)' },
    { value: 'eleven_turbo_v2', label: 'Eleven Turbo v2 (Fastest)' }
  ];

  const audioFormats = [
    { value: 'mp3_44100_128', label: 'MP3 - 44.1kHz, 128kbps (Recommended)' },
    { value: 'mp3_22050_32', label: 'MP3 - 22kHz, 32kbps (Low Quality)' },
    { value: 'pcm_16000', label: 'PCM - 16kHz (Raw Audio)' },
    { value: 'pcm_22050', label: 'PCM - 22kHz (High Quality)' }
  ];

  useEffect(() => {
    loadConfig();
    loadAvailableVoices();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('config_json')
        .eq('id', user?.tenant_id)
        .single();

      if (error) throw error;

      if (data?.config_json?.voice) {
        setConfig({ ...config, ...data.config_json.voice });
      }
    } catch (error) {
      console.error('Error loading voice configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableVoices = async () => {
    try {
      // Call backend API to get available ElevenLabs voices
      const response = await fetch('/api/elevenlabs/voices');
      const voices = await response.json();
      setAvailableVoices(voices);
    } catch (error) {
      console.error('Error loading available voices:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // Get current config
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('config_json')
        .eq('id', user?.tenant_id)
        .single();

      if (fetchError) throw fetchError;

      const updatedConfig = {
        ...data.config_json,
        voice: config
      };

      const { error } = await supabase
        .from('tenants')
        .update({
          config_json: updatedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.tenant_id);

      if (error) throw error;

      alert('Voice configuration saved successfully!');
    } catch (error) {
      console.error('Error saving voice configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const playVoicePreview = async (voiceId: string) => {
    if (playingVoice === voiceId) {
      audioRef.current?.pause();
      setPlayingVoice('');
      return;
    }

    setPlayingVoice(voiceId);
    try {
      // Use existing preview URL or generate new one
      const voice = availableVoices.find(v => v.voice_id === voiceId);
      if (voice?.preview_url) {
        if (audioRef.current) {
          audioRef.current.src = voice.preview_url;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error playing voice preview:', error);
      setPlayingVoice('');
    }
  };

  const generateCustomPreview = async () => {
    if (!testText.trim() || !config.elevenlabsVoiceId) return;

    setGeneratingPreview(true);
    try {
      const response = await fetch('/api/elevenlabs/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceId: config.elevenlabsVoiceId,
          settings: {
            stability: config.stability,
            similarityBoost: config.similarityBoost,
            style: config.style,
            speakerBoost: config.speakerBoost
          }
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error generating custom preview:', error);
      alert('Failed to generate preview. Please try again.');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleCustomVoiceUpload = (file: File) => {
    setConfig({ ...config, customVoiceFile: file, voiceCloning: true });
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading voice configuration...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.voiceContainer}>
        <audio ref={audioRef} onEnded={() => setPlayingVoice('')} />

        <div className={styles.header}>
          <Link href="/settings" className={styles.backButton}>
            ← Back to Settings
          </Link>
          <h1 className={styles.title}>Voice Settings</h1>
          <p className={styles.subtitle}>
            Configure your AI assistant's voice and audio preferences
          </p>
        </div>

        <div className={styles.configGrid}>
          <div className={styles.mainConfig}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Voice Selection</h2>
              <p className={styles.sectionDescription}>
                Choose from our library of professional voices
              </p>

              <div className={styles.voicesGrid}>
                {availableVoices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    className={`${styles.voiceCard} ${
                      config.elevenlabsVoiceId === voice.voice_id ? styles.selected : ''
                    }`}
                    onClick={() => setConfig({ ...config, elevenlabsVoiceId: voice.voice_id })}
                  >
                    <div className={styles.voiceHeader}>
                      <h4 className={styles.voiceName}>{voice.name}</h4>
                      <span className={styles.voiceCategory}>{voice.category}</span>
                    </div>

                    {voice.description && (
                      <p className={styles.voiceDescription}>{voice.description}</p>
                    )}

                    <button
                      className={styles.playButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        playVoicePreview(voice.voice_id);
                      }}
                      disabled={playingVoice !== '' && playingVoice !== voice.voice_id}
                    >
                      {playingVoice === voice.voice_id ? '⏸️' : '▶️'}
                      {playingVoice === voice.voice_id ? 'Pause' : 'Preview'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Voice Model & Settings</h2>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Voice Model</label>
                  <select
                    className={styles.select}
                    value={config.voiceModel}
                    onChange={(e) => setConfig({ ...config, voiceModel: e.target.value })}
                  >
                    {voiceModels.map(model => (
                      <option key={model.value} value={model.value}>{model.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Audio Format</label>
                  <select
                    className={styles.select}
                    value={config.audioFormat}
                    onChange={(e) => setConfig({ ...config, audioFormat: e.target.value })}
                  >
                    {audioFormats.map(format => (
                      <option key={format.value} value={format.value}>{format.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.sliderGroup}>
                <div className={styles.sliderItem}>
                  <label className={styles.sliderLabel}>
                    Stability: {config.stability.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    className={styles.slider}
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.stability}
                    onChange={(e) => setConfig({ ...config, stability: parseFloat(e.target.value) })}
                  />
                  <div className={styles.sliderDescription}>
                    Higher values make the voice more stable but less expressive
                  </div>
                </div>

                <div className={styles.sliderItem}>
                  <label className={styles.sliderLabel}>
                    Similarity Boost: {config.similarityBoost.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    className={styles.slider}
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.similarityBoost}
                    onChange={(e) => setConfig({ ...config, similarityBoost: parseFloat(e.target.value) })}
                  />
                  <div className={styles.sliderDescription}>
                    Enhances similarity to the original voice
                  </div>
                </div>

                <div className={styles.sliderItem}>
                  <label className={styles.sliderLabel}>
                    Style: {config.style.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    className={styles.slider}
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.style}
                    onChange={(e) => setConfig({ ...config, style: parseFloat(e.target.value) })}
                  />
                  <div className={styles.sliderDescription}>
                    Adds more character and style variation
                  </div>
                </div>

                <div className={styles.sliderItem}>
                  <label className={styles.sliderLabel}>
                    Response Speed: {config.responseSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    className={styles.slider}
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={config.responseSpeed}
                    onChange={(e) => setConfig({ ...config, responseSpeed: parseFloat(e.target.value) })}
                  />
                  <div className={styles.sliderDescription}>
                    Playback speed multiplier
                  </div>
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="speakerBoost"
                  checked={config.speakerBoost}
                  onChange={(e) => setConfig({ ...config, speakerBoost: e.target.checked })}
                />
                <label htmlFor="speakerBoost" className={styles.checkboxLabel}>
                  Enable Speaker Boost
                </label>
                <div className={styles.checkboxDescription}>
                  Enhances voice clarity for speakers and phone calls
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Voice Cloning (Premium)</h2>
              <p className={styles.sectionDescription}>
                Create a custom voice using your own audio samples
              </p>

              <div className={styles.cloningSection}>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="voiceCloning"
                    checked={config.voiceCloning}
                    onChange={(e) => setConfig({ ...config, voiceCloning: e.target.checked })}
                  />
                  <label htmlFor="voiceCloning" className={styles.checkboxLabel}>
                    Enable Voice Cloning
                  </label>
                </div>

                {config.voiceCloning && (
                  <div className={styles.cloningOptions}>
                    <div className={styles.uploadSection}>
                      <label className={styles.uploadLabel}>
                        Upload Audio Sample (MP3, WAV)
                      </label>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => e.target.files?.[0] && handleCustomVoiceUpload(e.target.files[0])}
                        className={styles.fileInput}
                      />
                      <div className={styles.uploadHint}>
                        Upload 1-5 minutes of clear speech for best results
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.previewSection}>
              <h3 className={styles.previewTitle}>Voice Preview</h3>

              <textarea
                className={styles.testTextarea}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test your voice settings..."
                rows={4}
              />

              <button
                className={styles.previewButton}
                onClick={generateCustomPreview}
                disabled={generatingPreview || !config.elevenlabsVoiceId || !testText.trim()}
              >
                {generatingPreview ? 'Generating...' : '🎵 Generate Preview'}
              </button>

              <div className={styles.previewInfo}>
                <p>Selected Voice: <strong>
                  {availableVoices.find(v => v.voice_id === config.elevenlabsVoiceId)?.name || 'None'}
                </strong></p>
                <p>Model: <strong>{config.voiceModel}</strong></p>
              </div>
            </div>

            <div className={styles.actionsSection}>
              <button
                className={styles.saveButton}
                onClick={saveConfig}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Voice Settings'}
              </button>

              <button
                className={styles.testButton}
                onClick={() => router.push('/test-voice-assistant')}
              >
                Test Full Assistant
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VoiceSettingsPage;