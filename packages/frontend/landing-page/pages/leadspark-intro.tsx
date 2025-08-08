import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lightbulb,
  Settings,
  Calendar,
  Mic,
  Star,
  CheckCircle,
} from "lucide-react";
import s from "./leadspark-intro.module.scss";

export default function LeadsparkIntro() {
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const plans = {
    starter: {
      name: "Starter",
      price: "$29/mo",
      features: [
        "Basic AI Assistant",
        "100 Conversations/mo",
        "Email Support",
      ],
    },
    professional: {
      name: "Professional",
      price: "$79/mo",
      recommended: true,
      features: [
        "Advanced AI Assistant",
        "1,000 Conversations/mo",
        "Priority Support",
        "CRM Integration",
      ],
    },
    enterprise: {
      name: "Enterprise",
      price: "Custom",
      features: [
        "Unlimited Conversations",
        "Dedicated Account Manager",
        "Custom Integrations",
      ],
    },
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSignupForm(false);
    }, 1500);
  };

  return (
    <div className={s.page}>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroContent}>
          <h1>
            <span>Leadspark</span>
          </h1>
          <p className={s.heroSubtitle}>
            Transform Your Website Visitors Into Qualified Leads 24/7
          </p>
          <p className={s.heroText}>
            Never miss another opportunity. <strong>Leadspark</strong> is the
            intelligent voice assistant that engages visitors, qualifies leads,
            and books discovery calls automatically.
          </p>
          <div className={s.heroButtons}>
            <Link href="/signup">
              <button>
                Start Your Leadspark Free Trial <ArrowRight />
              </button>
            </Link>
            <p>No credit card required • Setup in 5 minutes</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={s.features}>
        <h2>
          Why <span>Leadspark</span> is Different
        </h2>
        <div className={s.featuresGrid}>
          <div>
            <Lightbulb />
            <h3>Instant Engagement</h3>
            <p>
              AI assistant ready the moment someone lands on your site. No
              forms, just natural conversation.
            </p>
          </div>
          <div>
            <Settings />
            <h3>Smart & Personalized</h3>
            <p>
              Advanced AI that understands your business and tailors every
              conversation to visitor needs.
            </p>
          </div>
          <div>
            <Calendar />
            <h3>Books Calls Automatically</h3>
            <p>
              Qualified leads get seamlessly booked directly in your calendar.
              No missed opportunities.
            </p>
          </div>
          <div>
            <Mic />
            <h3>Natural Voice Conversations</h3>
            <p>
              Visitors speak naturally with advanced voice technology that feels
              human.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={s.pricing} id="pricing">
        <h2>
          Choose Your <span>Leadspark</span> Plan
        </h2>
        <p className={s.pricingIntro}>
          Start your Leadspark free trial today. No setup fees, no long-term
          contracts.
        </p>
        <div className={s.pricingGrid}>
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`${s.planCard} ${
                plan.recommended ? s.planRecommended : ""
              }`}
            >
              {plan.recommended && (
                <div className={s.planBadge}>
                  <Star /> Most Popular
                </div>
              )}
              <div className={s.planHeader}>
                <h3>{plan.name}</h3>
                <div className={s.planPrice}>{plan.price}</div>
              </div>
              <ul>
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <CheckCircle />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <button>Start Leadspark Free Trial</button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

