import { useEffect } from 'react';
import { signInWithGoogle } from '../lib/api';

function GoogleSignIn() {
    useEffect(() => {
        const doSignIn = async () => {
            try {
                await signInWithGoogle();
                // Supabase will redirect via OAuth. On failure, fallback to home.
                setTimeout(() => {
                    window.location.replace('/home');
                }, 2000);
            } catch (e) {
                window.location.replace('/home');
            }
        };
        doSignIn();
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <p>Redirecting to Google sign-in...</p>
        </div>
    );
}

export default GoogleSignIn;