import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CheckCircle, Star, ArrowRight, Mic, Calendar, Settings, Lightbulb } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AuthError } from '@supabase/supabase-js';

// Centralized hooks/types
import { useSupabase } from '@leadspark/common/src/utils/supabase/useSupabase';
import { type Tenant } from '@leadspark/common/src/types';

type PlanKey = 'starter' | 'professional' | 'enterprise';

interface Plan {
  name: string;
  price: string;
  priceId: string;
  features: string[];
  recommended?: boolean;
}
interface Plans { [key: string]: Plan; }

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  plan: PlanKey;
}
interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  general?: string;
}

export default function LeadsparkIntro() {
  const router = useRouter();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const portalUrl = 'https://leadspark-tenant.vercel.app/';

  const plans = useMemo<Plans>(
    () => ({
      starter: {
        name: 'Starter',
        price: '$29/month',
        priceId: 'prod_SoziIISihvVYy3',
        features: [
          'Up to 100 conversations per month',
          'Basic AI voice assistant',
          'Calendar integration',
          'Email notifications',
          'Standard support',
        ],
      },
      professional: {
        name: 'Professional',
        price: '$99/month',
        priceId: 'prod_SozkQ2yZtisIaG',
        recommended: true,
        features: [
          'Up to 500 conversations per month',
          'Advanced AI with custom knowledge base',
          'CRM integrations',
          'Detailed analytics dashboard',
          'Priority support',
          'Custom branding',
        ],
      },
      enterprise: {
        name: 'Enterprise',
        price: '$299/month',
        priceId: 'prod_SozkFpslZbjZn9',
        features: [
          'Unlimited conversations',
          'Multi-tenant management',
          'Advanced customization',
          'Dedicated success manager',
          'Custom integrations',
          'White-label options',
        ],
      },
    }),
    []
  );

  const [loading, setLoading] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('professional');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    plan: 'professional',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.companyName) newErrors.companyName = 'Company name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm() || !supabase) return;

    setLoading(true);
    try {
      const tenantId = uuidv4();
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company_name: formData.companyName,
            tenant_id: tenantId,
          },
          emailRedirectTo: `${portalUrl}login`,
        },
      });
      if (error) throw error;

      await supabase.from<Tenant>('tenants').insert({
        id: tenantId,
        name: formData.companyName,
        config_json: {},
        subscription_status: 'trialing',
        created_at: new Date().toISOString(),
      });

      router.push('/thank-you');
    } catch (err) {
      console.error('Signup error:', err);
      let errorMessage = 'Signup failed. Please try again.';
      if (err instanceof AuthError) errorMessage = err.message;
      else if (err instanceof Error) errorMessage = err.message;
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${portalUrl}auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google login error:', err);
      setErrors({ general: 'Google sign-in failed. Please try again.' });
    }
  };

  const handlePlanHover = (key: PlanKey) => {
    setSelectedPlan(key);
    setFormData((prev) => ({ ...prev, plan: key }));
  };

  // Loading guard (single instance)
  console.log('Component mounted, supabaseLoading:', { supabaseLoading });
  if (supabaseLoading) {
    console.log('Supabase is loading...', { supabaseLoading });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-500 text-white p-4">Tailwind Test</div>
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Leadspark - AI Sales Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Let Next manage the widget script */}
      <Script
        src="/leadspark-widget.js" // ensure this file exists in /public
        strategy="afterInteractive"
        onLoad={() => console.log('Widget loaded')}
      />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container-wide">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="hero-title">
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Leadspark
              </span>
            </h1>
            <p className="hero-subtitle font-semibold">
              Transform Your Website Visitors Into Qualified Leads 24/7
            </p>
            <p className="text-lg md:text-xl mb-8 max-w-4xl mx-auto opacity-90">
              Never miss another opportunity. <strong>Leadspark</strong> is the intelligent voice assistant that
              engages visitors, qualifies leads, and books discovery calls automatically.
            </p>
            <div className="flex flex-col items-center space-y-4">
              <Link href="#" onClick={() => setShowSignupForm(true)} className="cta-button">
                Start Your Leadspark Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <p className="text-sm opacity-80">No credit card required • Setup in 5 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section bg-white">
        <div className="container-wide">
          <h2 className="section-title">
            Why <span className="text-primary-600">Leadspark</span> is Different
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <article className="feature-card">
              <div className="feature-icon feature-icon-blue">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Instant Engagement</h3>
              <p className="text-gray-600">AI assistant ready the moment someone lands on your site. No forms, just natural conversation.</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon feature-icon-green">
                <Settings className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart & Personalized</h3>
              <p className="text-gray-600">Advanced AI that understands your business and tailors every conversation to visitor needs.</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon feature-icon-purple">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Books Calls Automatically</h3>
              <p className="text-gray-600">Qualified leads get seamlessly booked directly in your calendar. No missed opportunities.</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon feature-icon-orange">
                <Mic className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Natural Voice Conversations</h3>
              <p className="text-gray-600">Visitors speak naturally with advanced voice technology that feels human.</p>
            </article>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-gray-100">
        <div className="container-wide">
          <h2 className="section-title">How It Works</h2>
          <div className="grid md:grid-cols-5 gap-8">
            {[
              { step: '1', title: 'Easy Integration', desc: 'Add one line of code to your website' },
              { step: '2', title: 'Smart Conversations', desc: 'AI engages visitors with natural questions' },
              { step: '3', title: 'Automatic Qualification', desc: 'AI determines if visitor is qualified' },
              { step: '4', title: 'Seamless Booking', desc: 'Qualified leads book calls automatically' },
              { step: '5', title: 'Full Transcripts', desc: 'Every conversation transcribed and organized' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audiences */}
      <section className="section bg-white">
        <div className="container-wide">
          <h2 className="section-title">Perfect For Growing Businesses</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Financial Advisors',
                desc: "Qualify investment goals, risk tolerance, and timeline before prospects book calls with Leadspark.",
              },
              {
                title: 'Business Consultants',
                desc: 'Understand client challenges and budget before discovery calls using Leadspark.',
              },
              { title: 'SaaS Companies', desc: "Pre-qualify leads based on company size and use case with Leadspark's AI assistant." },
              { title: 'Professional Services', desc: 'Capture project requirements and budgets upfront using Leadspark.' },
            ].map((item, i) => (
              <article key={i} className="card p-6">
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligent Features */}
      <section className="section bg-gray-100">
        <div className="container-wide">
          <h2 className="section-title">
            Intelligent <span className="text-primary-600">Leadspark</span> Features That Set You Apart
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Multi-LLM Consensus Technology', desc: 'Multiple AI models work together for accurate, helpful responses.' },
              { title: 'Custom Knowledge Base', desc: 'Upload your materials so your AI knows your business.' },
              { title: 'Smart Handoff', desc: 'When needed, the AI transitions to booking a call with you.' },
              { title: 'Real-time Analytics', desc: 'See which topics drive interest and optimize your messaging.' },
              { title: 'Seamless CRM Integration', desc: 'Lead data flows into your systems. No manual entry.' },
              { title: '24/7 Operation', desc: 'Capture leads and book calls outside business hours.' },
            ].map((f, i) => (
              <article key={i} className="card p-6">
                <h3 className="text-lg font-semibold mb-3">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section bg-white" id="pricing">
        <div className="container-wide">
          <h2 className="section-title">
            Choose Your <span className="text-primary-600">Leadspark</span> Plan
          </h2>
        <p className="section-subtitle">Start your Leadspark free trial today. No setup fees, no long-term contracts.</p>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {(Object.entries(plans) as [PlanKey, Plan][]).map(([key, plan]) => (
              <div
                key={key}
                className={`pricing-card ${selectedPlan === key ? 'pricing-card-featured' : ''}`}
                onMouseEnter={() => handlePlanHover(key)}
              >
                {plan.recommended && (
                  <div className="pricing-badge">
                    <Star className="w-4 h-4 inline mr-1" /> Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-primary-600 mb-2">{plan.price}</div>
                  {key === 'starter' && <p className="text-sm text-gray-600">Perfect for Solo Professionals</p>}
                  {key === 'professional' && <p className="text-sm text-gray-600">Built for Growing Teams</p>}
                  {key === 'enterprise' && <p className="text-sm text-gray-600">Scale Without Limits</p>}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-success-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    handlePlanHover(key);
                    setShowSignupForm(true);
                  }}
                  className={`block text-center ${plan.recommended ? 'btn-primary' : 'btn-secondary'} w-full`}
                >
                  Start Leadspark Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-gray-100">
        <div className="container-narrow">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {[
              { q: 'How quickly can I get started?', a: 'Setup takes less than 5 minutes. Add our widget code and configure your AI assistant.' },
              { q: "Will visitors know they're talking to AI?", a: 'The AI is transparent and helpful. Visitors appreciate instant, accurate responses.' },
              { q: 'What if my business is too complex for AI?', a: 'Load your knowledge base. For complex cases, it smoothly books a call with you.' },
              { q: 'Do I need technical skills?', a: 'No. The platform is designed for business owners, not developers.' },
              { q: 'How does pricing work?', a: 'Simple monthly plans by conversation volume. No hidden fees. Scale anytime.' },
            ].map((faq, i, arr) => (
              <div key={i} className={`card p-6 ${i < arr.length - 1 ? 'border-b border-gray-200' : ''}`}>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="hero-section">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Your <span className="text-yellow-300">Leadspark</span> Free Trial Today
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Transform your website from a digital brochure into a 24/7 lead generation machine with Leadspark.
          </p>
          <button onClick={() => setShowSignupForm(true)} className="cta-button mb-8 inline-flex">
            Get Started with Leadspark Free <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          <p className="text-sm opacity-80 mb-12">No credit card required • Setup in under 5 minutes</p>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {['Choose your plan & create account', '5-minute guided setup', 'Your AI assistant goes live', 'Start capturing leads'].map((text, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  {i + 1}
                </div>
                <p className="text-sm opacity-90">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Modal */}
      {showSignupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Create Your <span className="text-primary-600">Leadspark</span> Account
              </h2>
              <button
                onClick={() => setShowSignupForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="card-content">
              <p className="text-sm text-gray-600 mb-4">
                Selected plan: <span className="font-medium text-primary-600">{plans[selectedPlan].name}</span> — {plans[selectedPlan].price}
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                {errors.general && <div className="bg-error-50 text-error-600 p-3 rounded-md text-sm">{errors.general}</div>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First name</label>
                    <input
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`input-field ${errors.firstName ? 'input-error' : ''}`}
                    />
                    {errors.firstName && <p className="error-text">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="label">Last name</label>
                    <input
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`input-field ${errors.lastName ? 'input-error' : ''}`}
                    />
                    {errors.lastName && <p className="error-text">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="label">Company name</label>
                  <input
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`input-field ${errors.companyName ? 'input-error' : ''}`}
                  />
                  {errors.companyName && <p className="error-text">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="label">Email address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input-field ${errors.email ? 'input-error' : ''}`}
                  />
                  {errors.email && <p className="error-text">{errors.email}</p>}
                </div>

                <div>
                  <label className="label">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`input-field ${errors.password ? 'input-error' : ''}`}
                  />
                  {errors.password && <p className="error-text">{errors.password}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating account...
                    </span>
                  ) : (
                    'Start Your Leadspark Free Trial & Continue to Setup'
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <button type="button" onClick={handleGoogleLogin} disabled={loading} className="btn-secondary w-full">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
