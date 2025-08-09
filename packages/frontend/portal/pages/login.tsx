import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { AuthError } from '@supabase/supabase-js';
import Link from 'next/link';
import styles from './login.module.scss';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function Login(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const portalUrl = 'https://leadspark-tenant.vercel.app/'; // The portal app URL

  // Add this useEffect to handle redirection if the user is already authenticated.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const nextUrl = router.query.next as string | undefined;
        if (nextUrl) {
          router.push(nextUrl);
        } else {
          router.push('/dashboard');
        }
      }
    });
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Successful login - now correctly redirect to the intended page or dashboard.
        const nextUrl = router.query.next as string | undefined;
        if (nextUrl) {
          // Use `router.push` for client-side navigation.
          router.push(nextUrl);
        } else {
          // Redirect to the default dashboard if no `next` URL is specified.
          router.push('/dashboard');
        }
      }

    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'Login failed. Please check your credentials and try again.';

      if (error instanceof AuthError) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else {
          errorMessage = error.message;
        }
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
          Sign in to your account
        </h2>
        <p className={styles.subtitle}>
          Or{' '}
          <Link href="/signup">
            <button className={styles.linkButton}>
              start your 14-day free trial
            </button>
          </Link>
        </p>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.formCard}>
          <form className={styles.form} onSubmit={handleLogin}>
            {errors.general && (
              <div className={styles.errorBanner}>
                {errors.general}
              </div>
            )}

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
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className={styles.errorMessage}>{errors.email}</p>
                )}
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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                />
                {errors.password && (
                  <p className={styles.errorMessage}>{errors.password}</p>
                )}
              </div>
            </div>

            <div className={styles.formOptions}>
              <div className={styles.checkboxGroup}>
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className={styles.checkbox}
                />
                <label htmlFor="remember-me" className={styles.checkboxLabel}>
                  Remember me
                </label>
              </div>

              <div className={styles.forgotPassword}>
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className={styles.linkButton}
                >
                  Forgot your password?
                </button>
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
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
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

          <div className={styles.signupSection}>
            <div className={styles.signupPrompt}>
              <span className={styles.signupText}>
                Don't have an account?{' '}
                <Link href="/signup">
                  <button className={styles.linkButton}>
                    Sign up for free
                  </button>
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
