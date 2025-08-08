import { useRouter } from 'next/router';
import { useState } from 'react';
import styles from './pricing.module.scss';

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
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Simple, transparent pricing
          </h2>
          <p className={styles.subtitle}>
            Choose the perfect plan for your business. Start with a 14-day free trial, no credit card required.
          </p>
        </div>

        {/* Billing toggle */}
        <div className={styles.billingToggleContainer}>
          <div className={styles.billingToggle}>
            <button
              onClick={() => handleBillingToggle('monthly')}
              className={`${styles.billingButton} ${
                billingCycle === 'monthly' ? styles.billingButtonActive : ''
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => handleBillingToggle('annually')}
              className={`${styles.billingButton} ${
                billingCycle === 'annually' ? styles.billingButtonActive : ''
              }`}
            >
              Annual
              <span className={styles.discountBadge}>
                Save {getDiscountPercentage(plans.professional.monthly, plans.professional.annually)}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className={styles.pricingGrid}>
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`${styles.pricingCard} ${
                plan.popular ? styles.pricingCardPopular : ''
              }`}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>
                  <span className={styles.popularBadgeText}>
                    Most Popular
                  </span>
                </div>
              )}

              <div className={styles.cardContent}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>

                <div className={styles.priceSection}>
                  <div className={styles.priceDisplay}>
                    <span className={styles.price}>
                      {formatPrice(plan[billingCycle])}
                    </span>
                    <span className={styles.pricePeriod}>
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                  </div>
                  {billingCycle === 'annually' && (
                    <p className={styles.annualNote}>
                      {formatPrice(plan.monthly)} per month, billed annually
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(key)}
                  className={`${styles.planButton} ${
                    plan.popular ? styles.planButtonPrimary : styles.planButtonSecondary
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className={styles.featureList}>
                  {plan.features.map((feature, index) => (
                    <li key={index} className={styles.featureItem}>
                      <div className={styles.checkIcon}>
                        <svg
                          className={styles.checkSvg}
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
                      <p className={styles.featureText}>{feature}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className={styles.faqSection}>
          <h3 className={styles.faqTitle}>
            Frequently Asked Questions
          </h3>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>
                Is there a free trial?
              </h4>
              <p className={styles.faqAnswer}>
                Yes! All plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>
                Can I change plans later?
              </h4>
              <p className={styles.faqAnswer}>
                Absolutely. You can upgrade or downgrade your plan at any time from your dashboard.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>
                What happens if I exceed my conversation limit?
              </h4>
              <p className={styles.faqAnswer}>
                We'll notify you when you're approaching your limit. You can upgrade your plan or purchase additional conversations.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>
                Do you offer custom enterprise solutions?
              </h4>
              <p className={styles.faqAnswer}>
                Yes! Our Enterprise plan includes custom integrations, dedicated support, and can be tailored to your specific needs.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h3 className={styles.ctaTitle}>
              Ready to transform your lead generation?
            </h3>
            <p className={styles.ctaSubtitle}>
              Join hundreds of businesses already using Leadspark to capture and convert more leads with AI-powered conversations.
            </p>
            <div className={styles.ctaButtons}>
              <button
                onClick={() => handleSelectPlan('professional')}
                className={styles.ctaPrimary}
              >
                Start Free Trial
              </button>
              <button
                onClick={handleContactSales}
                className={styles.ctaSecondary}
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