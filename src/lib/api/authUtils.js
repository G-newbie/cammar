import { supabase } from '../supabaseClient';

// 공통 인증 유틸리티 함수들

// 1. 현재 사용자 인증 확인
export const getAuthenticatedUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (!user) {
      throw new Error('인증이 필요합니다');
    }
    
    return user;
  } catch (error) {
    throw new Error(error.message || '인증 오류가 발생했습니다');
  }
};

// 2. 관리자 권한 확인
export const checkAdminPermission = async () => {
  try {
    const user = await getAuthenticatedUser();
    
    // 사용자 프로필에서 관리자 권한 확인
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError) throw profileError;
    
    if (!userProfile?.is_admin) {
      throw new Error('관리자 권한이 필요합니다');
    }
    
    return user;
  } catch (error) {
    throw new Error(error.message || '권한 확인 중 오류가 발생했습니다');
  }
};

// 3. 작성자 권한 확인
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
      throw new Error('작성자만 접근할 수 있습니다');
    }
    
    return { user, record };
  } catch (error) {
    throw new Error(error.message || '권한 확인 중 오류가 발생했습니다');
  }
};

// 4. 판매자 권한 확인 (아이템 관련)
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
      throw new Error('판매자만 접근할 수 있습니다');
    }
    
    return { user, item };
  } catch (error) {
    throw new Error(error.message || '판매자 권한 확인 중 오류가 발생했습니다');
  }
};

// 5. 입력 데이터 검증
export const validateInput = {
  // 이메일 검증
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('유효한 이메일 주소를 입력해주세요');
    }
    return email;
  },
  
  // 비밀번호 검증
  password: (password) => {
    if (!password || password.length < 8) {
      throw new Error('비밀번호는 최소 8자 이상이어야 합니다');
    }
    return password;
  },
  
  // 텍스트 검증 (XSS 방지)
  text: (text, maxLength = 1000) => {
    if (!text || typeof text !== 'string') {
      throw new Error('유효한 텍스트를 입력해주세요');
    }
    
    // HTML 태그 제거
    const sanitized = text.replace(/<[^>]*>/g, '');
    
    if (sanitized.length > maxLength) {
      throw new Error(`텍스트는 최대 ${maxLength}자까지 입력 가능합니다`);
    }
    
    return sanitized.trim();
  },
  
  // 숫자 검증
  number: (num, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const number = Number(num);
    if (isNaN(number) || number < min || number > max) {
      throw new Error(`유효한 숫자를 입력해주세요 (${min}-${max})`);
    }
    return number;
  },
  
  // UUID 검증
  uuid: (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new Error('유효한 ID를 입력해주세요');
    }
    return id;
  }
};

// 6. 안전한 SQL Raw 쿼리 (SQL Injection 방지)
export const safeIncrement = (field) => {
  // 허용된 필드명만 사용 가능하도록 화이트리스트 검증
  const allowedFields = [
    'upvotes', 'downvotes', 'comment_count', 'member_count', 
    'post_count', 'total_reviews', 'unread_by_buyer', 'unread_by_seller'
  ];
  
  if (!allowedFields.includes(field)) {
    throw new Error(`허용되지 않은 필드명입니다: ${field}`);
  }
  
  return supabase.raw(`${field} + 1`);
};

export const safeDecrement = (field) => {
  const allowedFields = [
    'upvotes', 'downvotes', 'comment_count', 'member_count', 
    'post_count', 'total_reviews', 'unread_by_buyer', 'unread_by_seller'
  ];
  
  if (!allowedFields.includes(field)) {
    throw new Error(`허용되지 않은 필드명입니다: ${field}`);
  }
  
  return supabase.raw(`${field} - 1`);
};

// 7. 공통 에러 응답 생성
export const createErrorResponse = (statusCode, message, error = null) => {
  return {
    res_code: statusCode,
    res_msg: message,
    error: error?.message || error
  };
};

// 8. 공통 성공 응답 생성
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
