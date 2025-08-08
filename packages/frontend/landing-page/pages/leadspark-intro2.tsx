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
import './leadspark-intro.module.scss';

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
        'ვ

System: You are Grok 3 built by xAI.

<xaiArtifact artifact_id="25a92acb-2826-4225-96b6-adf26097a923" artifact_version_id="c7defc3d-81cf-46b3-a928-ecd297033d4a" title="leadspark-intro.module.scss" contentType="text/scss">
.page {
  width: 100%;
}

.hero-wrap {
  background: linear-gradient(to right, #2563eb, #4f46e5);
  padding: 4rem 1rem;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.center {
  text-align: center;
}

.heading-block {
  margin-bottom: 2rem;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.title-gradient {
  background: linear-gradient(to right, #3b82f6, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.5rem;
  color: white;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

.tagline {
  font-size: 1.25rem;
  color: white;
  max-width: 700px;
  margin: 1.5rem auto;
}

.cta-row {
  margin-top: 2rem;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background-color: white;
  color: #2563eb;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
}

.cta-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.note {
  color: white;
  opacity: 0.8;
  font-size: 0.875rem;
  margin-top: 1rem;
}

.features-section {
  padding: 4rem 1rem;
  background-color: white;
}

.features-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.features-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 3rem;

  span {
    color: #2563eb;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-item {
  text-align: center;
  padding: 1.5rem;
}

.feature-icon {
  width: 3rem;
  height: 3rem;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.feature-icon-blue {
  color: #2563eb;
}

.feature-icon-green {
  color: #16a34a;
}

.feature-icon-purple {
  color: #7c3aed;
}

.feature-icon-orange {
  color: #ea580c;
}

.feature-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.feature-desc {
  color: #4b5563;
}

.how-it-works-section {
  padding: 4rem 1rem;
  background-color: #f9fafb;
}

.how-it-works-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.how-it-works-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 3rem;
}

.how-it-works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 2rem;
}

.step-item {
  text-align: center;
}

.step-number {
  width: 3rem;
  height: 3rem;
  background-color: #2563eb;
  color: white;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-weight: 700;
  font-size: 1.125rem;
}

.step-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.step-desc {
  color: #4b5563;
  font-size: 0.875rem;
}

.audience-section {
  padding: 4rem 1rem;
  background-color: white;
}

.audience-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.audience-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 3rem;
}

.audience-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.audience-item {
  padding: 1.5rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.audience-item-title {
  font-weight: 600;
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.audience-item-desc {
  color: #4b5563;
}

.intelligent-features-section {
  padding: 4rem 1rem;
  background-color: #f9fafb;
}

.intelligent-features-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.intelligent-features-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 3rem;

  span {
    color: #2563eb;
  }
}

.intelligent-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.feature-card-title {
  font-weight: 600;
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.feature-card-desc {
  color: #4b5563;
}

.pricing-section {
  padding: 4rem 1rem;
  background-color: white;
}

.pricing-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.pricing-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 1rem;

  span {
    color: #2563eb;
  }
}

.pricing-subtitle {
  color: #4b5563;
  text-align: center;
  margin-bottom: 3rem;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1280px;
  margin: 0 auto;
}

.plan-card {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  &.recommended {
    border: 2px solid #2563eb;
    transform: scale(1.05);
  }
}

.plan-badge {
  position: absolute;
  top: -1rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.plan-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 0.5rem;
}

.plan-price {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 0.25rem;
}

.plan-desc {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

.features-list {
  list-style: none;
  padding: 0;
  margin-bottom: 2rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.feature-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #16a34a;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.plan-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background-color 0.2s;

  &.recommended {
    background-color: #2563eb;
    color: white;

    &:hover {
      background-color: #1d4ed8;
    }
  }

  &:not(.recommended) {
    background-color: #f3f4f6;
    color: #111827;

    &:hover {
      background-color: #e5e7eb;
    }
  }
}

.modal {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  max-width: 28rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;

  span {
    color: #2563eb;
  }
}

.close-button {
  color: #9ca3af;
  font-size: 1.5rem;

  &:hover {
    color: #4b5563;
  }
}

.modal-plan-info {
  text-align: center;
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 1.5rem;

  span {
    font-weight: 500;
    color: #2563eb;
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  outline: none;

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &.error {
    border-color: #f87171;
  }
}

.form-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
  background-color: #2563eb;
  color: white;

  &:hover {
    background-color: #1d4ed8;
  }

  &.disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
    color: white;
  }
}

.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner-icon {
  width: 1rem;
  height: 1rem;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}

.divider-container {
  position: relative;
  margin: 1.5rem 0;
}

.divider {
  border-top: 1px solid #d1d5db;
}

.divider-text {
  position: relative;
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  background-color: white;
  padding: 0 0.5rem;
}

.google-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9fafb;
  }

  &.disabled {
    opacity: 0.5;
  }
}

.google-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.faq-section {
  padding: 4rem 1rem;
  background-color: #f9fafb;
}

.faq-container {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 1rem;
}

.faq-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 3rem;
}

.faq-item {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 2rem;

  &:last-child {
    border-bottom: none;
  }
}

.faq-question {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.faq-answer {
  color: #4b5563;
}

.final-cta-section {
  padding: 4rem 1rem;
  background: linear-gradient(to right, #2563eb, #4f46e5);
}

.final-cta-container {
  max-width: 1024px;
  margin: 0 auto;
  text-align: center;
  padding: 0 1rem;
}

.final-cta-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;

  span {
    color: #bfdbfe;
  }
}

.final-cta-subtitle {
  font-size: 1.25rem;
  color: #bfdbfe;
  margin-bottom: 2rem;
}

.final-cta-button {
  background-color: white;
  color: #2563eb;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9fafb;
  }
}

.final-cta-note {
  color: #bfdbfe;
  font-size: 0.875rem;
  margin-top: 1rem;
}

.final-cta-steps-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1rem;

  span {
    color: #bfdbfe;
  }
}

.final-cta-steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  max-width: 768px;
  margin: 0 auto;
}

.step-circle {
  width: 2rem;
  height: 2rem;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
  color: white;
  font-weight: 700;
}

.step-text {
  color: #bfdbfe;
  font-size: 0.875rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}