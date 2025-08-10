import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient'; // Make sure this import is correct
import { AuthError } from '@supabase/supabase-js';
import styles from './signup.module.scss';

interface SignupFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

interface SignupErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  general?: string;
}

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });
  const [errors, setErrors] = useState<SignupErrors>({});
  // This is the base URL for the portal application
  const portalUrl = 'https://leadspark-tenant.vercel.app/';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name as keyof SignupErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: SignupErrors = {};

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

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // ✅ Call the Supabase sign-up method with email and password
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // You can pass additional user metadata here
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company_name: formData.companyName,
          },
          // Redirect the user to the portal's login page after confirmation
          emailRedirectTo: `${portalUrl}login`,
        },
      });

      if (error) {
        throw error;
      }

      // If no error, show a success message and redirect to the portal login page
      // ✅ Redirect to a new "thank-you" page on the landing app
      router.push('/thank-you');
    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = 'Signup failed. Please try again.';

      if (error instanceof AuthError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect to the portal app after successful login
          redirectTo: `${portalUrl}dashboard`
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google login error:', error);
      setErrors({
        general: 'Google sign-in failed. Please try again.'
      });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/leadspark-intro">
            <button className={styles.logo}>
              Leadspark
            </button>
          </Link>
        </div>
        <h2 className={styles.title}>
          Create a new account
        </h2>
        <p className={styles.subtitle}>
          Or{' '}
          {/* ✅ Corrected link to the portal app's login page */}
          <Link href={`${portalUrl}login`}>
            <button className={styles.linkButton}>
              sign in to your existing account
            </button>
          </Link>
        </p>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.formCard}>
          <form className={styles.form} onSubmit={handleSignup}>
            {errors.general && (
              <div className={styles.errorBanner}>
                {errors.general}
              </div>
            )}

            <div className={styles.formGrid2}>
              <div>
                <label htmlFor="firstName" className={styles.label}>
                  First name
                </label>
                <div className={styles.inputGroup}>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                  />
                  {errors.firstName && <p className={styles.errorMessage}>{errors.firstName}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className={styles.label}>
                  Last name
                </label>
                <div className={styles.inputGroup}>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                  />
                  {errors.lastName && <p className={styles.errorMessage}>{errors.lastName}</p>}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="companyName" className={styles.label}>
                Company name
              </label>
              <div className={styles.inputGroup}>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.companyName ? styles.inputError : ''}`}
                />
                {errors.companyName && <p className={styles.errorMessage}>{errors.companyName}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className={styles.label}>
                Email address
              </label>
              <div className={styles.inputGroup}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                />
                {errors.email && <p className={styles.errorMessage}>{errors.email}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputGroup}>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                />
                {errors.password && <p className={styles.errorMessage}>{errors.password}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`${styles.submitButton} ${loading ? styles.submitButtonLoading : ''}`}
              >
                {loading ? (
                  <div className={styles.loadingContent}>
                    <div className={styles.spinner}></div>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>

            <div className={styles.dividerSection}>
              <div className={styles.divider}>
                <span>Or continue with</span>
              </div>

              <div className={styles.googleButtonContainer}>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className={styles.googleButton}
                >
                  <svg className={styles.googleIcon} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
