import { useEffect } from 'react';
import { signInWithGoogle } from '../lib/api';

function GoogleSignIn() {
    useEffect(() => {
        const doSignIn = async () => {
            try {
                await signInWithGoogle();
                // Supabase will handle the redirect; do not override it here.
            } catch (e) {
                window.location.replace('/signIn');
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