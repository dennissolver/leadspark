import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Star,
  ArrowRight,
  Mic,
  Calendar,
  Settings,
  Lightbulb,
} from "lucide-react";
import s from "./leadspark-intro.module.scss";

type PlanKey = "starter" | "professional" | "enterprise";

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
  const plans = useMemo<Plans>(
    () => ({
      starter: {
        name: "Starter",
        price: "$29/month",
        priceId: "prod_SoziIISihvVYy3",
        features: [
          "Up to 100 conversations per month",
          "Basic AI voice assistant",
          "Calendar integration",
          "Email notifications",
          "Standard support",
        ],
      },
      professional: {
        name: "Professional",
        price: "$99/month",
        priceId: "prod_SozkQ2yZtisIaG",
        recommended: true,
        features: [
          "Up to 500 conversations per month",
          "Advanced AI with custom knowledge base",
          "CRM integrations",
          "Detailed analytics dashboard",
          "Priority support",
          "Custom branding",
        ],
      },
      enterprise: {
        name: "Enterprise",
        price: "$299/month",
        priceId: "prod_SozkFpslZbjZn9",
        features: [
          "Unlimited conversations",
          "Multi-tenant management",
          "Advanced customization",
          "Dedicated success manager",
          "Custom integrations",
          "White-label options",
        ],
      },
    }),
    []
  );

  const [loading, setLoading] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("professional");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    companyName: "",
    plan: "professional",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.companyName) newErrors.companyName = "Company name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      // TODO: Replace with your real signup/integration call
      await new Promise((r) => setTimeout(r, 800));
      setShowSignupForm(false);
    } catch (err) {
      setErrors({ general: "Sign up failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanHover = (key: string) => {
    const k = key as PlanKey;
    setSelectedPlan(k);
    setFormData((prev) => ({ ...prev, plan: k }));
  };

  return (
    <div className={s.page}>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.container}>
          <div className={s.heroInner}>
            <h1 className={s.title}>
              <span className={s.titleGradient}>Leadspark</span>
            </h1>
            <p className={s.subtitle}>
              Transform Your Website Visitors Into Qualified Leads 24/7
            </p>
            <p className={s.tagline}>
              Never miss another opportunity. <strong>Leadspark</strong> is the
              intelligent voice assistant that engages visitors, qualifies leads,
              and books discovery calls automatically.
            </p>
            <div className={s.ctaRow}>
              <Link href="/signup" className={s.cta}>
                Start Your Leadspark Free Trial <ArrowRight className={s.ctaIcon} />
              </Link>
              <p className={s.note}>
                No credit card required • Setup in 5 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={s.sectionLight}>
        <div className={s.container}>
          <h2 className={s.sectionHeading}>
            Why <span className={s.brand}>Leadspark</span> is Different
          </h2>
          <div className={s.grid4}>
            <article className={s.cardCenter}>
              <div className={`${s.iconWrap} ${s.iconBlue}`}>
                <Lightbulb className={s.icon} />
              </div>
              <h3 className={s.cardTitle}>Instant Engagement</h3>
              <p className={s.cardBody}>
                AI assistant ready the moment someone lands on your site. No
                forms, just natural conversation.
              </p>
            </article>

            <article className={s.cardCenter}>
              <div className={`${s.iconWrap} ${s.iconGreen}`}>
                <Settings className={s.icon} />
              </div>
              <h3 className={s.cardTitle}>Smart & Personalized</h3>
              <p className={s.cardBody}>
                Advanced AI that understands your business and tailors every
                conversation to visitor needs.
              </p>
            </article>

            <article className={s.cardCenter}>
              <div className={`${s.iconWrap} ${s.iconPurple}`}>
                <Calendar className={s.icon} />
              </div>
              <h3 className={s.cardTitle}>Books Calls Automatically</h3>
              <p className={s.cardBody}>
                Qualified leads get seamlessly booked directly in your calendar.
                No missed opportunities.
              </p>
            </article>

            <article className={s.cardCenter}>
              <div className={`${s.iconWrap} ${s.iconOrange}`}>
                <Mic className={s.icon} />
              </div>
              <h3 className={s.cardTitle}>Natural Voice Conversations</h3>
              <p className={s.cardBody}>
                Visitors speak naturally with advanced voice technology that feels
                human.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={s.sectionGray}>
        <div className={s.container}>
          <h2 className={s.sectionHeading}>How It Works</h2>
          <div className={s.grid5}>
            {[
              {
                step: "1",
                title: "Easy Integration",
                desc: "Add one line of code to your website",
              },
              {
                step: "2",
                title: "Smart Conversations",
                desc: "AI engages visitors with natural questions",
              },
              {
                step: "3",
                title: "Automatic Qualification",
                desc: "AI determines if visitor is qualified",
              },
              {
                step: "4",
                title: "Seamless Booking",
                desc: "Qualified leads book calls automatically",
              },
              {
                step: "5",
                title: "Complete Insights",
                desc: "Every conversation transcribed and organized",
              },
            ].map((item, i) => (
              <div key={i} className={s.howCard}>
                <div className={s.stepDot}>{item.step}</div>
                <h3 className={s.howTitle}>{item.title}</h3>
                <p className={s.howBody}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audiences */}
      <section className={s.sectionLight}>
        <div className={s.container}>
          <h2 className={s.sectionHeading}>Perfect For Growing Businesses</h2>
          <div className={s.grid4}>
            {[
              {
                title: "Financial Advisors",
                desc: "Qualify investment goals, risk tolerance, and timeline before prospects book calls with Leadspark.",
              },
              {
                title: "Business Consultants",
                desc: "Understand client challenges and budget before discovery calls using Leadspark.",
              },
              {
                title: "SaaS Companies",
                desc: "Pre-qualify leads based on company size and use case with Leadspark's AI assistant.",
              },
              {
                title: "Professional Services",
                desc: "Capture project requirements and budgets upfront using Leadspark.",
              },
            ].map((item, i) => (
              <article key={i} className={s.audienceCard}>
                <h3 className={s.cardTitle}>{item.title}</h3>
                <p className={s.cardBody}>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligent Features */}
      <section className={s.sectionGray}>
        <div className={s.container}>
          <h2 className={s.sectionHeading}>
            Intelligent <span className={s.brand}>Leadspark</span> Features That
            Set You Apart
          </h2>
          <div className={s.grid3}>
            {[
              {
                title: "Multi-LLM Consensus Technology",
                desc: "Our unique approach uses multiple AI models working together to ensure the most accurate and helpful responses.",
              },
              {
                title: "Custom Knowledge Base",
                desc: "Upload your marketing materials, FAQs, and service descriptions. Your AI knows your business inside and out.",
              },
              {
                title: "Smart Handoff",
                desc: "When conversations get complex, your AI smoothly transitions to booking a call with you.",
              },
              {
                title: "Real-time Analytics",
                desc: "See exactly which topics generate the most interest and optimize your messaging accordingly.",
              },
              {
                title: "Seamless CRM Integration",
                desc: "All lead data flows directly into your existing systems. No manual data entry required.",
              },
              {
                title: "24/7 Operation",
                desc: "Your AI assistant never sleeps, capturing leads and booking calls even outside business hours.",
              },
            ].map((f, i) => (
              <article key={i} className={s.featureCard}>
                <h3 className={s.cardTitle}>{f.title}</h3>
                <p className={s.cardBody}>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={s.sectionLight} id="pricing">
        <div className={s.container}>
          <h2 className={s.sectionHeading}>
            Choose Your <span className={s.brand}>Leadspark</span> Plan
          </h2>
          <p className={s.sectionSub}>
            Start your Leadspark free trial today. No setup fees, no long-term
            contracts.
          </p>

          <div className={s.pricingGrid}>
            {(Object.entries(plans) as [PlanKey, Plan][]).map(([key, plan]) => (
              <div
                key={key}
                className={`${s.plan} ${plan.recommended ? s.planRecommended : ""}`}
                onMouseEnter={() => handlePlanHover(key)}
              >
                {plan.recommended && (
                  <div className={s.recommendedBadge}>
                    <span className={s.recommendedPill}>
                      <Star className={s.badgeIcon} /> Most Popular
                    </span>
                  </div>
                )}

                <div className={s.planHeader}>
                  <h3 className={s.planName}>{plan.name}</h3>
                  <div className={s.planPrice}>{plan.price}</div>
                  {key === "starter" && (
                    <p className={s.planNote}>Perfect for Solo Professionals</p>
                  )}
                  {key === "professional" && (
                    <p className={s.planNote}>Built for Growing Teams</p>
                  )}
                  {key === "enterprise" && (
                    <p className={s.planNote}>Scale Without Limits</p>
                  )}
                </div>

                <ul className={s.featureList}>
                  {plan.features.map((feature, i) => (
                    <li key={i} className={s.featureItem}>
                      <CheckCircle className={s.checkIcon} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup" className={`${s.planBtn} ${plan.recommended ? s.planBtnPrimary : s.planBtnGhost}`}>
                  Start Leadspark Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={s.sectionGray}>
        <div className={s.containerNarrow}>
          <h2 className={s.sectionHeading}>Frequently Asked Questions</h2>
          <div className={s.faqList}>
            {[
              {
                q: "How quickly can I get started?",
                a: "Setup takes less than 5 minutes. Just add our widget code to your site and configure your AI assistant through our intuitive dashboard.",
              },
              {
                q: "Will visitors know they're talking to AI?",
                a: "Our AI is transparent but natural. Visitors appreciate the instant response and helpful information, regardless of whether it's AI or human.",
              },
              {
                q: "What if my business is too complex for AI?",
                a: "Our AI learns your business through your custom knowledge base. For complex situations, it smoothly transitions to booking a call with you.",
              },
              {
                q: "Do I need technical skills?",
                a: "None at all. Our platform is designed for business owners, not developers. If you can use email, you can use Leadspark.",
              },
              {
                q: "How does pricing work?",
                a: "Simple monthly plans based on conversation volume. No hidden fees, no per-lead charges. Scale up or down anytime.",
              },
            ].map((faq, i, arr) => (
              <div key={i} className={`${s.faqItem} ${i < arr.length - 1 ? s.faqItemBorder : ""}`}>
                <h3 className={s.faqQ}>{faq.q}</h3>
                <p className={s.faqA}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={s.finalCta}>
        <div className={s.containerNarrow}>
          <h2 className={s.finalTitle}>
            Start Your <span className={s.finalTitleAlt}>Leadspark</span> Free Trial Today
          </h2>
          <p className={s.finalSub}>
            Transform your website from a digital brochure into a 24/7 lead generation machine with Leadspark.
          </p>
          <button className={s.finalBtn} onClick={() => setShowSignupForm(true)}>
            Get Started with Leadspark Free <ArrowRight className={s.ctaIcon} />
          </button>
          <p className={s.finalNote}>No credit card required • Setup in under 5 minutes</p>

          <div className={s.finalSteps}>
            {[
              "Choose your plan & create account",
              "5-minute guided setup",
              "Your AI assistant goes live",
              "Start capturing leads",
            ].map((text, i) => (
              <div key={i} className={s.stepCard}>
                <div className={s.stepNum}>{i + 1}</div>
                <p className={s.stepText}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Modal */}
      {showSignupForm && (
        <div className={s.modalBackdrop} role="dialog" aria-modal="true">
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>
                Create Your <span className={s.brand}>Leadspark</span> Account
              </h2>
              <button
                onClick={() => setShowSignupForm(false)}
                className={s.modalClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className={s.modalLead}>
              Selected plan: <span className={s.brand}>{plans[selectedPlan].name}</span> —{" "}
              {plans[selectedPlan].price}
            </p>

            <form onSubmit={handleSignup} className={s.form}>
              {errors.general && <div className={s.errorBox}>{errors.general}</div>}

              <div className={s.formGrid2}>
                <div>
                  <label className={s.label}>First name</label>
                  <input
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={s.input}
                  />
                  {errors.firstName && (
                    <p className={s.inputError}>{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className={s.label}>Last name</label>
                  <input
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={s.input}
                  />
                  {errors.lastName && (
                    <p className={s.inputError}>{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={s.label}>Company name</label>
                <input
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={s.input}
                />
                {errors.companyName && (
                  <p className={s.inputError}>{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className={s.label}>Email address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={s.input}
                />
                {errors.email && <p className={s.inputError}>{errors.email}</p>}
              </div>

              <div>
                <label className={s.label}>Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={s.input}
                />
                {errors.password && (
                  <p className={s.inputError}>{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`${s.submit} ${loading ? s.submitLoading : ""}`}
              >
                {loading ? (
                  <span className={s.spinnerWrap}>
                    <span className={s.spinner} /> Creating account...
                  </span>
                ) : (
                  "Start Your Leadspark Free Trial & Continue to Setup"
                )}
              </button>
            </form>

            <div className={s.divider}>
              <span>Or continue with</span>
            </div>

            <button type="button" disabled={loading} className={s.googleBtn}>
              <svg className={s.googleIcon} viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
