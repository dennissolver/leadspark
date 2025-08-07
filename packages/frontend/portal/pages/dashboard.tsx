// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Tenant {
  id: string;
  name: string;
  owner_id: string;
  config_json: {
    system_prompt?: string;
    elevenlabs_voice?: string;
    notification_emails?: string[];
    calendar_integration?: boolean;
    llm_consensus_enabled?: boolean;
    llm_consensus_strategy?: string;
  };
  subscription_status: 'active' | 'trialing' | 'canceled';
  created_at: string;
  updated_at?: string;
}

interface Voice {
  id: string;
  name: string;
  description: string;
}

interface SetupStep1Data {
  companyName: string;
  systemPrompt: string;
  voiceId: string;
}

interface SetupStep1Props {
  user: User;
  onNext: (data: SetupStep1Data) => void;
  loading: boolean;
}

interface SetupStep2Props {
  user: User;
  tenant: Tenant;
  onNext: (data: {}) => void;
  loading: boolean;
}

export default function Dashboard(): JSX.Element {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async (): Promise<void> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Check if user has completed onboarding
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (tenantData) {
        setTenant(tenantData);
        // User has completed onboarding, redirect to main portal
        window.location.href = process.env.NEXT_PUBLIC_PORTAL_URL || '/portal';
        return;
      }

      // User hasn't completed onboarding, show setup
      setLoading(false);

    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  const handleSetupStep = async (stepData: SetupStep1Data | {}): Promise<void> => {
    try {
      setLoading(true);

      if (step === 1 && user) {
        const setupData = stepData as SetupStep1Data;

        // Create tenant record
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .insert([{
            name: setupData.companyName,
            owner_id: user.id,
            config_json: {
              system_prompt: setupData.systemPrompt || "You are a helpful AI assistant for lead generation.",
              elevenlabs_voice: setupData.voiceId || "default",
              notification_emails: [user.email || ''],
              calendar_integration: false,
              llm_consensus_enabled: false
            },
            subscription_status: 'trialing' as const,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (tenantError) {
          throw tenantError;
        }

        setTenant(tenantData);
        setStep(2);
      } else if (step === 2) {
        // Widget setup complete, redirect to portal
        window.location.href = process.env.NEXT_PUBLIC_PORTAL_URL || '/portal';
      }

    } catch (error) {
      console.error('Setup error:', error);
      alert('An error occurred during setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Leadspark</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {user?.user_metadata?.first_name || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {step === 1 && (
          <SetupStep1
            user={user}
            onNext={handleSetupStep}
            loading={loading}
          />
        )}

        {step === 2 && tenant && (
          <SetupStep2
            user={user}
            tenant={tenant}
            onNext={handleSetupStep}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

// Step 1: Company Setup
function SetupStep1({ user, onNext, loading }: SetupStep1Props): JSX.Element {
  const [formData, setFormData] = useState<SetupStep1Data>({
    companyName: user?.user_metadata?.company_name || '',
    systemPrompt: '',
    voiceId: 'default'
  });

  const voices: Voice[] = [
    { id: 'default', name: 'Professional (Default)', description: 'Clear, professional voice' },
    { id: 'friendly', name: 'Friendly', description: 'Warm and approachable' },
    { id: 'authoritative', name: 'Authoritative', description: 'Confident and commanding' }
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onNext(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData(prev => ({ ...prev, voiceId: e.target.value }));
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Leadspark!</h2>
          <p className="mt-2 text-gray-600">
            Let's set up your AI voice assistant. This will only take a few minutes.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className="flex items-center text-blue-600">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-sm font-medium">Company Setup</span>
            </div>
            <div className="flex-1 mx-4 h-1 bg-gray-200 rounded"></div>
            <div className="flex items-center text-gray-400">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-gray-600 text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium">Widget Integration</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <div className="mt-1">
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Your Company Inc."
              />
            </div>
          </div>

          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700">
              System Prompt (Optional)
            </label>
            <div className="mt-1">
              <textarea
                id="systemPrompt"
                name="systemPrompt"
                rows={4}
                value={formData.systemPrompt}
                onChange={handleInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Customize how your AI assistant should behave and respond to visitors..."
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Leave blank to use our default professional prompt, or customize to match your brand voice.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Voice Selection
            </label>
            <div className="space-y-3">
              {voices.map((voice) => (
                <label key={voice.id} className="flex items-start">
                  <input
                    type="radio"
                    name="voiceId"
                    value={voice.id}
                    checked={formData.voiceId === voice.id}
                    onChange={handleVoiceChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{voice.name}</div>
                    <div className="text-sm text-gray-500">{voice.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Continue to Widget Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Step 2: Widget Integration
function SetupStep2({ user, tenant, onNext, loading }: SetupStep2Props): JSX.Element {
  const widgetCode = `<!-- Leadspark Widget -->
<script>
  window.leadsparkConfig = {
    tenantId: '${tenant?.id}',
    apiUrl: '${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://your-backend.onrender.com'}'
  };
</script>
<script src="${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://widget.leadspark.com'}/leadspark-widget.js"></script>`;

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(widgetCode);
      alert('Widget code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openDocumentation = (): void => {
    window.open('https://docs.leadspark.com', '_blank');
  };

  const handleComplete = (): void => {
    onNext({});
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Widget Integration</h2>
          <p className="mt-2 text-gray-600">
            Copy and paste this code into your website to add the Leadspark voice assistant.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className="flex items-center text-green-600">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full text-white text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium">Company Setup</span>
            </div>
            <div className="flex-1 mx-4 h-1 bg-blue-600 rounded"></div>
            <div className="flex items-center text-blue-600">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium">Widget Integration</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Widget Code
            </label>
            <div className="relative">
              <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm overflow-x-auto">
                <code>{widgetCode}</code>
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">How to install:</h3>
            <ol className="text-sm text-blue-700 space-y-1 ml-4 list-decimal">
              <li>Copy the code above</li>
              <li>Paste it before the closing &lt;/body&gt; tag on your website</li>
              <li>The widget will appear as a floating button on your site</li>
              <li>Visitors can click it to start voice conversations</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">What happens next:</h3>
            <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
              <li>Leads will appear in your portal dashboard</li>
              <li>You'll receive email notifications for new conversations</li>
              <li>All conversation transcripts are automatically saved</li>
              <li>Analytics and insights are available in your dashboard</li>
            </ul>
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              onClick={openDocumentation}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Documentation
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Complete Setup & Go to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}