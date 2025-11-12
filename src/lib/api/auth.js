import { supabase } from '../supabaseClient';

export const signUp = async (email, password, displayName) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            display_name: displayName,
            school_verified: false,
            trust_score: 0.0,
            total_reviews: 0
          }
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      return {
        res_code: 200,
        res_msg: 'User registration completed successfully',
        user: profileData,
        session: authData.session
      };
    }
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    return {
      res_code: 200,
      res_msg: 'Login successful',
      user: userProfile,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      }
    };
  } catch (error) {
    return {
      res_code: 401,
      res_msg: error.message,
      error: error
    };
  }
};

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;

    return {
      res_code: 200,
      res_msg: 'Google login redirect',
      data: data
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const validateEmailDomain = async (email) => {
  const allowedDomains = ['sunykorea.ac.kr', 'stonybrook.edu'];
  const domain = email.split('@')[1];

  const isValid = allowedDomains.includes(domain);

  return {
    res_code: 200,
    res_msg: isValid ? 'Valid university email' : 'Email domain not allowed',
    valid: isValid,
    domain: domain,
    message: isValid ? 'Valid university email domain' : 'Invalid email domain'
  };
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return {
      res_code: 200,
      res_msg: 'Logout successful'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (user) {
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        res_code: 200,
        res_msg: 'User information retrieved successfully',
        user: userProfile
      };
    } else {
      return {
        res_code: 401,
        res_msg: 'User not logged in'
      };
    }
  } catch (error) {
    return {
      res_code: 401,
      res_msg: error.message,
      error: error
    };
  }
};
