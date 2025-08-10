import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import styles from './login.module.scss'; // Reuse login page styles

export default function ResetPassword(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for a password reset token in the URL
    // Supabase will automatically handle this, but we'll check for an auth error.
    const handleReset = async () => {
      const { error: authError } = await supabase.auth.getSession();
      if (authError) {
        setError('An error occurred during password reset. Please try again.');
      }
    };
    handleReset();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setMessage('Your password has been reset successfully. You can now log in.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>Reset Password - LeadSpark Portal</title>
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => router.push('/login')} className={styles.logo}>
            Leadspark
          </button>
        </div>
        <h2 className={styles.title}>
          Reset Your Password
        </h2>
        <p className={styles.subtitle}>
          Enter a new password for your account.
        </p>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.formCard}>
          <form className={styles.form} onSubmit={handlePasswordReset}>
            {error && (
              <div className={styles.errorBanner}>
                {error}
              </div>
            )}
            {message && (
              <div className={styles.successBanner}>
                {message}
              </div>
            )}

            <div>
              <label htmlFor="password" className={styles.label}>
                New Password
              </label>
              <div className={styles.inputGroup}>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !!message}
                className={`${styles.submitButton} ${loading ? styles.submitButtonLoading : ''}`}
              >
                {loading ? (
                  <div className={styles.loadingContent}>
                    <div className={styles.spinner}></div>
                    Resetting...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
