import { supabase } from '../supabaseClient';

export const getAuthenticatedUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (!user) {
      throw new Error('Authentication required');
    }
    
    return user;
  } catch (error) {
    throw new Error(error.message || 'Authentication error occurred');
  }
};

export const checkAdminPermission = async () => {
  try {
    const user = await getAuthenticatedUser();
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError) throw profileError;
    
    if (!userProfile?.is_admin) {
      throw new Error('Admin permission required');
    }
    
    return user;
  } catch (error) {
    throw new Error(error.message || 'Error occurred while checking permissions');
  }
};

export const checkAuthorPermission = async (tableName, recordId, authorField = 'author_id') => {
  try {
    const user = await getAuthenticatedUser();
    
    const { data: record, error: recordError } = await supabase
      .from(tableName)
      .select(authorField)
      .eq('id', recordId)
      .single();
    
    if (recordError) throw recordError;
    
    if (record[authorField] !== user.id) {
      throw new Error('Only author can access this resource');
    }
    
    return { user, record };
  } catch (error) {
    throw new Error(error.message || 'Error occurred while checking permissions');
  }
};

export const checkSellerPermission = async (itemId) => {
  try {
    const user = await getAuthenticatedUser();
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('seller_id')
      .eq('id', itemId)
      .single();
    
    if (itemError) throw itemError;
    
    if (item.seller_id !== user.id) {
      throw new Error('Only seller can access this resource');
    }
    
    return { user, item };
  } catch (error) {
    throw new Error(error.message || 'Error occurred while checking seller permissions');
  }
};

export const validateInput = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }
    return email;
  },
  
  password: (password) => {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    return password;
  },
  
  text: (text, maxLength = 1000) => {
    if (!text || typeof text !== 'string') {
      throw new Error('Please enter valid text');
    }
    
    const sanitized = text.replace(/<[^>]*>/g, '');
    
    if (sanitized.length > maxLength) {
      throw new Error(`Text can be up to ${maxLength} characters long`);
    }
    
    return sanitized.trim();
  },
  
  number: (num, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const number = Number(num);
    if (isNaN(number) || number < min || number > max) {
      throw new Error(`Please enter a valid number (${min}-${max})`);
    }
    return number;
  },
  
  uuid: (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new Error('Please enter a valid ID');
    }
    return id;
  }
};

export const safeIncrement = (field) => {
  const allowedFields = [
    'upvotes', 'downvotes', 'comment_count', 'member_count', 
    'post_count', 'total_reviews', 'unread_by_buyer', 'unread_by_seller'
  ];
  
  if (!allowedFields.includes(field)) {
    throw new Error(`Field name not allowed: ${field}`);
  }
  
  return supabase.raw(`${field} + 1`);
};

export const safeDecrement = (field) => {
  const allowedFields = [
    'upvotes', 'downvotes', 'comment_count', 'member_count', 
    'post_count', 'total_reviews', 'unread_by_buyer', 'unread_by_seller'
  ];
  
  if (!allowedFields.includes(field)) {
    throw new Error(`Field name not allowed: ${field}`);
  }
  
  return supabase.raw(`${field} - 1`);
};

export const createErrorResponse = (statusCode, message, error = null) => {
  return {
    res_code: statusCode,
    res_msg: message,
    error: error?.message || error
  };
};

export const createSuccessResponse = (message, data = null, meta = null) => {
  const response = {
    res_code: 200,
    res_msg: message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (meta !== null) {
    response.meta = meta;
  }
  
  return response;
};
