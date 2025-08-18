import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSupabase } from '@leadspark/common/src/utils/supabase/useSupabase'; // Corrected import path

export default function ResetPassword(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { supabase, getSession } = useSupabase();

  useEffect(() => {
    // Check for a password reset token in the URL
    // Supabase will automatically handle this, but we'll check for an auth error.
    const handleReset = async () => {
      const { data: authData, error: authError } = await getSession();
      if (authError || !authData.session) {
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
    <div className="page">
      <Head>
        <title>Reset Password - LeadSpark Portal</title>
      </Head>

      <div className="container">
        <div className="header">
          <button onClick={() => router.push('/login')} className="logo">
            Leadspark
          </button>
        </div>
        <h2 className="title">
          Reset Your Password
        </h2>
        <p className="subtitle">
          Enter a new password for your account.
        </p>
      </div>

      <div className="formContainer">
        <div className="formCard">
          <form className="form" onSubmit={handlePasswordReset}>
            {error && (
              <div className="errorBanner">
                {error}
              </div>
            )}
            {message && (
              <div className="successBanner">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="password" className="label">
                New Password
              </label>
              <div className="inputGroup">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !!message}
                className={`}`}
              >
                {loading ? (
                  <div className="loadingContent">
                    <div className="spinner"></div>
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
