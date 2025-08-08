import { useState } from 'react';
import {
  CheckCircle,
  Star,
  ArrowRight,
  Mic,
  Calendar,
  Settings,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';
import styles from './leadspark-intro.module.scss';

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

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
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
    <div className={styles.page}>
      {/* Hero Section */}
      <div className={styles['hero-wrap']}>
        <div className={styles.container}>
          <div className={styles.center}>
            <div className={styles['heading-block']}>
              <h1 className={styles.title}>
                <span className={styles['title-gradient']}>Leadspark</span>
              </h1>
              <p className={styles.subtitle}>
                Transform Your Website Visitors Into Qualified Leads 24/7
              </p>
            </div>
            <p className={styles.tagline}>
              Never miss another opportunity. <strong>Leadspark</strong> is the intelligent voice assistant that
              engages visitors, qualifies leads, and books discovery calls automatically.
            </p>
            <div className={styles['cta-row']}>
              <Link href="/signup" className={styles.cta}>
                Start Your Leadspark Free Trial <ArrowRight className={styles['cta-icon']} />
              </Link>
              <p className={styles.note}>No credit card required • Setup in 5 minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className={styles['features-section']}>
        <div className={styles['features-container']}>
          <h2 className={styles['features-title']}>
            Why <span>Leadspark</span> is Different
          </h2>
          <div className={styles['features-grid']}>
            <div className={styles['feature-item']}>
              <div className={`${styles['feature-icon']} ${styles['feature-icon-blue']}`}>
                <Lightbulb className={styles['feature-icon-blue']} />
              </div>
              <h3 className={styles['feature-title']}>Instant Engagement</h3>
              <p className={styles['feature-desc']}>
                AI assistant ready the moment someone lands on your site. No forms, just natural conversation.
              </p>
            </div>
            <div className={styles['feature-item']}>
              <div className={`${styles['feature-icon']} ${styles['feature-icon-green']}`}>
                <Settings className={styles['feature-icon-green']} />
              </div>
              <h3 className={styles['feature-title']}>Smart & Personalized</h3>
              <p className={styles['feature-desc']}>
                Advanced AI that understands your business and tailors every conversation to visitor needs.
              </p>
            </div>
            <div className={styles['feature-item']}>
              <div className={`${styles['feature-icon']} ${styles['feature-icon-purple']}`}>
                <Calendar className={styles['feature-icon-purple']} />
              </div>
              <h3 className={styles['feature-title']}>Books Calls Automatically</h3>
              <p className={styles['feature-desc']}>
                Qualified leads get seamlessly booked directly in your calendar. No missed opportunities.
              </p>
            </div>
            <div className={styles['feature-item']}>
              <div className={`${styles['feature-icon']} ${styles['feature-icon-orange']}`}>
                <Mic className={styles['feature-icon-orange']} />
              </div>
              <h3 className={styles['feature-title']}>Natural Voice Conversations</h3>
              <p className={styles['feature-desc']}>
                Visitors speak naturally with advanced voice technology that feels human.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className={styles['how-it-works-section']}>
        <div className={styles['how-it-works-container']}>
          <h2 className={styles['how-it-works-title']}>How It Works</h2>
          <div className={styles['how-it-works-grid']}>
            {[
              { step: '1', title: 'Easy Integration', desc: 'Add one line of code to your website' },
              { step: '2', title: 'Smart Conversations', desc: 'AI engages visitors with natural questions' },
              { step: '3', title: 'Automatic Qualification', desc: 'AI determines if visitor is qualified' },
              { step: '4', title: 'Seamless Booking', desc: 'Qualified leads book calls automatically' },
              { step: '5', title: 'Complete Insights', desc: 'Every conversation transcribed and organized' }
            ].map((item, index) => (
              <div key={index} className={styles['step-item']}>
                <div className={styles['step-number']}>{item.step}</div>
                <h3 className={styles['step-title']}>{item.title}</h3>
                <p className={styles['step-desc']}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Audiences */}
      <div className={styles['audience-section']}>
        <div className={styles['audience-container']}>
          <h2 className={styles['audience-title']}>Perfect For Growing Businesses</h2>
          <div className={styles['audience-grid']}>
            {[
              { title: 'Financial Advisors', desc: 'Qualify investment goals, risk tolerance, and timeline before prospects book calls with Leadspark.' },
              { title: 'Business Consultants', desc: 'Understand client challenges and budget before discovery calls using Leadspark.' },
              { title: 'SaaS Companies', desc: 'Pre-qualify leads based on company size and use case with Leadspark\'s AI assistant.' },
              { title: 'Professional Services', desc: 'Capture project requirements and budgets upfront using Leadspark.' }
            ].map((item, index) => (
              <div key={index} className={styles['audience-item']}>
                <h3 className={styles['audience-item-title']}>{item.title}</h3>
                <p className={styles['audience-item-desc']}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intelligent Features */}
      <div className={styles['intelligent-features-section']}>
        <div className={styles['intelligent-features-container']}>
          <h2 className={styles['intelligent-features-title']}>
            Intelligent <span>Leadspark</span> Features That Set You Apart
          </h2>
          <div className={styles['intelligent-features-grid']}>
            <div className={styles['feature-card']}>
              <h3 className={styles['feature-card-title']}>Multi-LLM Consensus Technology</h3>
              <p className={styles['feature-card-desc']}>
                Our unique approach uses multiple AI models working together to ensure the most accurate and helpful responses.
              </p>
            </div>
            <div className={styles['feature-card']}>
              <h3 className={styles['feature-card-title']}>Custom Knowledge Base</h3>
              <p className={styles['feature-card-desc']}>
                Upload your marketing materials, FAQs, and service descriptions. Your AI knows your business inside and out.
              </p>
            </div>
            <div className={styles['feature-card']}>
              <h3 className={styles['feature-card-title']}>Smart Handoff</h3>
              <p className={styles['feature-card-desc']}>
                When conversations get complex, your AI smoothly transitions to booking a call with you.
              </p>
            </div>
            <div className={styles['feature-card']}>
              <h3 className={styles['feature-card-title']}>Real-time Analytics</h3>
              <p className={styles['feature-card-desc']}>
                See exactly which topics generate the most interest and optimize your messaging accordingly.
              </p>
            </div>
            <div className={styles['feature-card']}>
              <h3 className={styles['feature-card-title']}>Seamless CRM Integration</h3>
              <p className={styles['feature-card-desc']}>
                All lead data flows directly into your existing systems. No manual data entry required.
              </p>
            </div>
            <div className={styles['feature-card']}>
              <h3 className={styles['feature-card-title']}>24/7 Operation</h3>
              <p className={styles['feature-card-desc']}>
                Your AI assistant never sleeps, capturing leads and booking calls even outside business hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className={styles['pricing-section']} id="pricing">
        <div className={styles['pricing-container']}>
          <h2 className={styles['pricing-title']}>
            Choose Your <span>Leadspark</span> Plan
          </h2>
          <p className={styles['pricing-subtitle']}>
            Start your Leadspark free trial today. No setup fees, no long-term contracts.
          </p>
          <div className={styles['pricing-grid']}>
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                className={`${styles['plan-card']} ${plan.recommended ? styles.recommended : ''}`}
              >
                {plan.recommended && (
                  <div className={styles['plan-badge']}>
                    <Star className="w-4 h-4" /> Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className={styles['plan-title']}>{plan.name}</h3>
                  <div className={styles['plan-price']}>{plan.price}</div>
                  {key === 'starter' && <p className={styles['plan-desc']}>Perfect for Solo Professionals</p>}
                  {key === 'professional' && <p className={styles['plan-desc']}>Built for Growing Teams</p>}
                  {key === 'enterprise' && <p className={styles['plan-desc']}>Scale Without Limits</p>}
                </div>
                <ul className={styles['features-list']}>
                  {plan.features.map((feature, index) => (
                    <li key={index} className={styles['feature-item']}>
                      <CheckCircle className={styles['feature-icon']} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <button
                    className={`${styles['plan-button']} ${plan.recommended ? styles.recommended : ''}`}
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
        <div className={styles.modal}>
          <div className={styles['modal-content']}>
            <div className={styles['modal-header']}>
              <h2 className={styles['modal-title']}>
                Create Your <span>Leadspark</span> Account
              </h2>
              <button
                onClick={() => setShowSignupForm(false)}
                className={styles['close-button']}
              >
                ×
              </button>
            </div>
            <p className={styles['modal-plan-info']}>
              Selected Leadspark plan: <span>{plans[selectedPlan].name}</span> - {plans[selectedPlan].price}
            </p>
            <form onSubmit={handleSignup} className={styles.form}>
              {errors.general && (
                <div className={styles['error-message']}>{errors.general}</div>
              )}
              <div className={styles['form-grid']}>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']}>First name</label>
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`${styles['form-input']} ${errors.firstName ? styles.error : ''}`}
                  />
                  {errors.firstName && <p className={styles['form-error']}>{errors.firstName}</p>}
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']}>Last name</label>
                  <input
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`${styles['form-input']} ${errors.lastName ? styles.error : ''}`}
                  />
                  {errors.lastName && <p className={styles['form-error']}>{errors.lastName}</p>}
                </div>
              </div>
              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Company name</label>
                <input
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={`${styles['form-input']} ${errors.companyName ? styles.error : ''}`}
                />
                {errors.companyName && <p className={styles['form-error']}>{errors.companyName}</p>}
              </div>
              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Email address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`${styles['form-input']} ${errors.email ? styles.error : ''}`}
                />
                {errors.email && <p className={styles['form-error']}>{errors.email}</p>}
              </div>
              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`${styles['form-input']} ${errors.password ? styles.error : ''}`}
                />
                {errors.password && <p className={styles['form-error']}>{errors.password}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`${styles['submit-button']} ${loading ? styles.disabled : ''}`}
              >
                {loading ? (
                  <div className={styles.spinner}>
                    <div className={styles['spinner-icon']}></div>
                    Creating account...
                  </div>
                ) : (
                  'Start Your Leadspark Free Trial & Continue to Setup'
                )}
              </button>
            </form>
            <div className={styles['divider-container']}>
              <div className={styles.divider}></div>
              <div className={styles['divider-text']}>Or continue with</div>
            </div>
            <button
              type="button"
              disabled={loading}
              className={`${styles['google-button']} ${loading ? styles.disabled : ''}`}
            >
              <svg className={styles['google-icon']} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className={styles['faq-section']}>
        <div className={styles['faq-container']}>
          <h2 className={styles['faq-title']}>Frequently Asked Questions</h2>
          <div className={styles['faq-items']}>
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
              <div key={index} className={styles['faq-item']}>
                <h3 className={styles['faq-question']}>{faq.q}</h3>
                <p className={styles['faq-answer']}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className={styles['final-cta-section']}>
        <div className={styles['final-cta-container']}>
          <h2 className={styles['final-cta-title']}>
            Start Your <span>Leadspark</span> Free Trial Today
          </h2>
          <p className={styles['final-cta-subtitle']}>
            Transform your website from a digital brochure into a 24/7 lead generation machine with Leadspark.
          </p>
          <button
            onClick={() => setShowSignupForm(true)}
            className={styles['final-cta-button']}
          >
            Get Started with Leadspark Free <ArrowRight className="w-5 h-5" />
          </button>
          <p className={styles['final-cta-note']}>
            No credit card required • Setup in under 5 minutes
          </p>
          <div className={styles['final-cta-steps']}>
            <h3 className={styles['final-cta-steps-title']}>
              What happens when you join <span>Leadspark</span>?
            </h3>
            <div className={styles['final-cta-steps-grid']}>
              {[
                { step: '1', text: 'Choose your Leadspark plan and create account' },
                { step: '2', text: '5-minute guided Leadspark setup' },
                { step: '3', text: 'Your Leadspark AI assistant goes live' },
                { step: '4', text: 'Start capturing leads with Leadspark today' }
              ].map((item, index) => (
                <div key={index} className={styles['step-item']}>
                  <div className={styles['step-circle']}>{item.step}</div>
                  <p className={styles['step-text']}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}