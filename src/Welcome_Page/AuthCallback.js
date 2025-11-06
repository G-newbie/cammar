import { useEffect, useState } from 'react';
import { getCurrentUser } from '../lib/api';

function AuthCallback() {
    const [message, setMessage] = useState('Signing you in...');

    useEffect(() => {
        const finalizeLogin = async () => {
            try {
                const result = await getCurrentUser();
                if (result && result.res_code === 200) {
                    setMessage('Sign-in complete! Redirecting to home...');
                    setTimeout(() => window.location.replace('/home'), 500);
                } else {
                    setMessage('Session verification failed. Redirecting to home...');
                    setTimeout(() => window.location.replace('/home'), 1000);
                }
            } catch (e) {
                setMessage('An error occurred. Redirecting to home...');
                setTimeout(() => window.location.replace('/home'), 1000);
            }
        };
        finalizeLogin();
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <p>{message}</p>
        </div>
    );
}

export default AuthCallback;

