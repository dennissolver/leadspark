// pages/pricing.tsx
import { useRouter } from 'next/router';
import { useState } from 'react';

type BillingCycle = 'monthly' | 'annually';

interface Plan {
  name: string;
  description: string;
  monthly: number;
  annually: number;
  features: string[];
  cta: string;
  popular: boolean;
}

interface Plans {
  [key: string]: Plan;
}

export default function Pricing(): JSX.Element {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const plans: Plans = {
    starter: {
      name: 'Starter',
      description: 'Perfect for small businesses getting started with AI lead generation',
      monthly: 29,
      annually: 290, // ~17% discount
      features: [
        'Up to 100 conversations/month',
        'Basic AI voice assistant',
        'Email lead notifications',
        'Standard response time',
        'Knowledge base (up to 10 entries)',
        'Basic analytics dashboard',
        'Email support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    professional: {
      name: 'Professional',
      description: 'For growing businesses that need advanced features and higher limits',
      monthly: 99,
      annually: 990, // ~17% discount
      features: [
        'Up to 500 conversations/month',
        'Advanced AI with custom prompts',
        'SMS + Email notifications',
        'Priority response time',
        'Unlimited knowledge base entries',
        'Advanced analytics & reporting',
        'Calendar integration',
        'Custom voice selection',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    enterprise: {
      name: 'Enterprise',
      description: 'For large organizations with custom needs and unlimited scale',
      monthly: 299,
      annually: 2990, // ~17% discount
      features: [
        'Unlimited conversations',
        'Multi-LLM consensus system',
        'Advanced integrations (CRM, etc.)',
        'Custom AI training',
        'Dedicated account manager',
        'Custom analytics & reporting',
        'Advanced security features',
        'Custom voice cloning',
        'White-label options',
        '24/7 phone support',
        'SLA guarantees'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  };

  const handleSelectPlan = (planKey: string): void => {
    if (planKey === 'enterprise') {
      // Redirect to contact sales
      router.push('/contact-sales');
    } else {
      // Redirect to signup with selected plan
      router.push(`/signup?plan=${planKey}`);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getDiscountPercentage = (monthly: number, annually: number): number => {
    const monthlyTotal = monthly * 12;
    const discount = ((monthlyTotal - annually) / monthlyTotal) * 100;
    return Math.round(discount);
  };

  const handleBillingToggle = (cycle: BillingCycle): void => {
    setBillingCycle(cycle);
  };

  const handleContactSales = (): void => {
    router.push('/contact-sales');
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="sm:text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your business. Start with a 14-day free trial, no credit card required.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-12 flex justify-center">
          <div className="relative bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => handleBillingToggle('monthly')}
              className={`relative px-6 py-2 text-sm font-medium rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => handleBillingToggle('annually')}
              className={`relative px-6 py-2 text-sm font-medium rounded-md transition-all ${
                billingCycle === 'annually'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Save {getDiscountPercentage(plans.professional.monthly, plans.professional.annually)}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-x-8">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`relative bg-white border rounded-2xl shadow-sm ${
                plan.popular
                  ? 'border-blue-500 ring-2 ring-blue-500'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-gray-500">{plan.description}</p>

                <div className="mt-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold tracking-tight text-gray-900">
                      {formatPrice(plan[billingCycle])}
                    </span>
                    <span className="ml-1 text-xl font-semibold text-gray-500">
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                  </div>
                  {billingCycle === 'annually' && (
                    <p className="mt-1 text-sm text-gray-500">
                      {formatPrice(plan.monthly)} per month, billed annually
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(key)}
                  className={`mt-8 w-full py-3 px-6 border border-transparent rounded-md text-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 focus:ring-blue-500'
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-6 w-6 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h3>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-600">
                Yes! All plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h4>
              <p className="text-gray-600">
                Absolutely. You can upgrade or downgrade your plan at any time from your dashboard.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                What happens if I exceed my conversation limit?
              </h4>
              <p className="text-gray-600">
                We'll notify you when you're approaching your limit. You can upgrade your plan or purchase additional conversations.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer custom enterprise solutions?
              </h4>
              <p className="text-gray-600">
                Yes! Our Enterprise plan includes custom integrations, dedicated support, and can be tailored to your specific needs.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-gray-50 rounded-2xl p-8 lg:p-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900">
              Ready to transform your lead generation?
            </h3>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Join hundreds of businesses already using Leadspark to capture and convert more leads with AI-powered conversations.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleSelectPlan('professional')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Free Trial
              </button>
              <button
                onClick={handleContactSales}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}