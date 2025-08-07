import { useState } from 'react';
import {
  CheckCircle,
  Star,
  ArrowRight,
  Mic,
  Calendar,
  BarChart,
  Settings,
  Users,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  plan: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  general?: string;
}

interface Plan {
  name: string;
  price: string;
  priceId: string;
  features: string[];
  recommended?: boolean;
}

interface Plans {
  [key: string]: Plan;
}

export default function LeadsparkIntro() {
  const [loading, setLoading] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    plan: 'professional'
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const plans: Plans = {
    starter: {
      name: 'Starter',
      price: '$29/month',
      priceId: 'prod_SoziIISihvVYy3',
      features: [
        'Up to 100 conversations per month',
        'Basic AI voice assistant',
        'Calendar integration',
        'Email notifications',
        'Standard support'
      ]
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
        'Custom branding'
      ]
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
        'White-label options'
      ]
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.companyName) {
      newErrors.companyName = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // The function is now a proper form submission handler
  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Signup successful! (This is a demo)');
    }, 2000);
  };

  const handlePlanSelect = (planKey: string) => {
    setSelectedPlan(planKey);
    setFormData(prev => ({ ...prev, plan: planKey }));
    setShowSignupForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-6xl md:text-7xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Leadspark
                </span>
              </h1>
              <p className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
                Transform Your Website Visitors Into Qualified Leads 24/7
              </p>
            </div>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Never miss another opportunity. <strong>Leadspark</strong> is the intelligent voice assistant that engages visitors,
              qualifies leads, and books discovery calls automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center gap-2"
                >
                  Start Your Leadspark Free Trial <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <p className="text-sm text-gray-500">No credit card required • Setup in 5 minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why <span className="text-blue-600">Leadspark</span> is Different
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Engagement</h3>
              <p className="text-gray-600">AI assistant ready the moment someone lands on your site. No forms, just natural conversation.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart & Personalized</h3>
              <p className="text-gray-600">Advanced AI that understands your business and tailors every conversation to visitor needs.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Books Calls Automatically</h3>
              <p className="text-gray-600">Qualified leads get seamlessly booked directly in your calendar. No missed opportunities.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mic className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Natural Voice Conversations</h3>
              <p className="text-gray-600">Visitors speak naturally with advanced voice technology that feels human.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-5 gap-8">
            {[
              { step: '1', title: 'Easy Integration', desc: 'Add one line of code to your website' },
              { step: '2', title: 'Smart Conversations', desc: 'AI engages visitors with natural questions' },
              { step: '3', title: 'Automatic Qualification', desc: 'AI determines if visitor is qualified' },
              { step: '4', title: 'Seamless Booking', desc: 'Qualified leads book calls automatically' },
              { step: '5', title: 'Complete Insights', desc: 'Every conversation transcribed and organized' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Audiences */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Perfect For Growing Businesses</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Financial Advisors', desc: 'Qualify investment goals, risk tolerance, and timeline before prospects book calls with Leadspark.' },
              { title: 'Business Consultants', desc: 'Understand client challenges and budget before discovery calls using Leadspark.' },
              { title: 'SaaS Companies', desc: 'Pre-qualify leads based on company size and use case with Leadspark\'s AI assistant.' },
              { title: 'Professional Services', desc: 'Capture project requirements and budgets upfront using Leadspark.' }
            ].map((item, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intelligent Features */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Intelligent <span className="text-blue-600">Leadspark</span> Features That Set You Apart
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Multi-LLM Consensus Technology</h3>
              <p className="text-gray-600">Our unique approach uses multiple AI models working together to ensure the most accurate and helpful responses.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Custom Knowledge Base</h3>
              <p className="text-gray-600">Upload your marketing materials, FAQs, and service descriptions. Your AI knows your business inside and out.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Smart Handoff</h3>
              <p className="text-gray-600">When conversations get complex, your AI smoothly transitions to booking a call with you.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">See exactly which topics generate the most interest and optimize your messaging accordingly.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Seamless CRM Integration</h3>
              <p className="text-gray-600">All lead data flows directly into your existing systems. No manual data entry required.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">24/7 Operation</h3>
              <p className="text-gray-600">Your AI assistant never sleeps, capturing leads and booking calls even outside business hours.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-16 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Choose Your <span className="text-blue-600">Leadspark</span> Plan</h2>
          <p className="text-center text-gray-600 mb-12">Start your Leadspark free trial today. No setup fees, no long-term contracts.</p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                className={`relative bg-white rounded-2xl p-8 shadow-lg ${
                  plan.recommended ? 'border-2 border-blue-500 scale-105' : 'border border-gray-200'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4" /> Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-1">{plan.price}</div>
                  {key === 'starter' && <p className="text-sm text-gray-500">Perfect for Solo Professionals</p>}
                  {key === 'professional' && <p className="text-sm text-gray-500">Built for Growing Teams</p>}
                  {key === 'enterprise' && <p className="text-sm text-gray-500">Scale Without Limits</p>}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                  <Link href="/signup">
                    <button
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                        plan.recommended
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      Start Leadspark Free Trial
                    </button>
                  </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signup Form Modal */}
      {showSignupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Your <span className="text-blue-600">Leadspark</span> Account</h2>
                <button
                  onClick={() => setShowSignupForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-center text-sm text-gray-600 mb-6">
                Selected Leadspark plan: <span className="font-medium text-blue-600">{plans[selectedPlan].name}</span> - {plans[selectedPlan].price}
              </p>
              {/* Corrected: Form now has onSubmit handler */}
              <form onSubmit={handleSignup} className="space-y-4">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {errors.general}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                    <input
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                    <input
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
                  <input
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.companyName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                {/* Corrected: Button has type="submit" and no onClick handler */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Start Your Leadspark Free Trial & Continue to Setup'
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {[
              {
                q: "How quickly can I get started?",
                a: "Setup takes less than 5 minutes. Just add our widget code to your site and configure your AI assistant through our intuitive dashboard."
              },
              {
                q: "Will visitors know they're talking to AI?",
                a: "Our AI is transparent but natural. Visitors appreciate the instant response and helpful information, regardless of whether it's AI or human."
              },
              {
                q: "What if my business is too complex for AI?",
                a: "Our AI learns your business through your custom knowledge base. For complex situations, it smoothly transitions to booking a call with you."
              },
              {
                q: "Do I need technical skills?",
                a: "None at all. Our platform is designed for business owners, not developers. If you can use email, you can use Leadspark."
              },
              {
                q: "How does pricing work?",
                a: "Simple monthly plans based on conversation volume. No hidden fees, no per-lead charges. Scale up or down anytime."
              }
            ].map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Start Your <span className="text-blue-100">Leadspark</span> Free Trial Today</h2>
          <p className="text-xl text-blue-100 mb-8">
            Transform your website from a digital brochure into a 24/7 lead generation machine with Leadspark.
          </p>
          <button
            onClick={() => setShowSignupForm(true)}
            className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center gap-2"
          >
            Get Started with Leadspark Free <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-blue-100 mt-4 text-sm">No credit card required • Setup in under 5 minutes</p>

            <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold text-white mb-4">What happens when you join <span className="text-blue-100">Leadspark</span>?</h3>
            <div className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold">1</div>
                <p className="text-blue-100 text-sm">Choose your Leadspark plan and create account</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold">2</div>
                <p className="text-blue-100 text-sm">5-minute guided Leadspark setup</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold">3</div>
                <p className="text-blue-100 text-sm">Your Leadspark AI assistant goes live</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold">4</div>
                <p className="text-blue-100 text-sm">Start capturing leads with Leadspark today</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
