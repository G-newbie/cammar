
export * from './auth';


export * from './users';


export * from './items';

export * from './wishlists';

export * from './communities';

export * from './posts';

export * from './comments';

export * from './votes';

export * from './chat';

export * from './messages';

export * from './search';

export * from './categories';

export * from './reviews';

export * from './notifications';

export * from './upload';

export const createApiResponse = (success, data = null, message = '', error = null) => {
  return {
    success,
    data,
    message,
    error
  };
};

export const handleApiError = (error, defaultMessage = '알 수 없는 오류가 발생했습니다') => {
  console.error('API Error:', error);
  
  return createApiResponse(false, null, error.message || defaultMessage, error);
};

export const standardizeResponse = (response) => {
  if (response.success === undefined) {
    return {
      success: response.res_code >= 200 && response.res_code < 300,
      data: response.data || response.user || response.item || response.items || response.post || response.posts || response.message || response.notification || response.notifications || response.review || response.reviews || response.category || response.categories || response.chat_room || response.chat_rooms || response.message || response.messages || response.wishlist || response.wishlists || response.community || response.communities || response.comment || response.comments || response.vote || response.search_history || response.images || response.image_url,
      message: response.res_msg || response.message || '',
      error: response.error || null,
      pagination: response.pagination || null,
      unread_count: response.unread_count || null
    };
  }
  
  return response;
};
