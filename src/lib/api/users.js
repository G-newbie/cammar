import { supabase } from '../supabaseClient';

// 1. 현재 사용자 프로필 조회 - SQL 호환
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, display_name, profile_image_url, school_verified, trust_score, total_reviews, created_at')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    return {
      res_code: 200,
      res_msg: '사용자 프로필 조회 성공',
      user: userProfile
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

// 2. 사용자 프로필 조회 (기존 함수명 유지)
export const getUserProfile = getCurrentUser;

// 3. 다른 사용자 프로필 조회 - SQL 호환
export const getOtherUserProfile = async (userId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, display_name, profile_image_url, trust_score, total_reviews, created_at')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    return {
      res_code: 200,
      res_msg: '사용자 프로필 조회 성공',
      user: userProfile
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

// 4. 사용자 프로필 수정 - SQL 호환
export const updateUserProfile = async (updates) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      res_code: 200,
      res_msg: '프로필이 성공적으로 업데이트되었습니다',
      user: updatedProfile
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

// 3. 다른 사용자 프로필 조회
export const getOtherUserProfile = async (userId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, display_name, profile_image_url, trust_score, total_reviews, created_at')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    return {
      res_code: 200,
      res_msg: '사용자 프로필 조회 성공',
      user: userProfile
    };
  } catch (error) {
    return {
      res_code: 404,
      res_msg: error.message,
      error: error
    };
  }
};

// 5. 사용자 게시글 조회 - SQL 호환
export const getUserPosts = async (userId, options = {}) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { page = 1, limit = 20, sort = 'newest' } = options;
    const offset = (page - 1) * limit;

    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select(`
        id, title, content, upvotes, comment_count, created_at,
        communities!inner(id, name)
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: sort === 'oldest' })
      .range(offset, offset + limit - 1);

    if (postsError) throw postsError;

    return {
      res_code: 200,
      res_msg: '사용자 게시글 조회 성공',
      posts: posts,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(posts.length / limit),
        total_count: posts.length,
        has_next: posts.length === limit,
        has_prev: page > 1
      },
      meta: {
        sort: sort,
        filters: {}
      }
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

// 6. 사용자 아이템 조회 - SQL 호환
export const getUserItems = async (userId, options = {}) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { page = 1, limit = 20, sort = 'newest' } = options;
    const offset = (page - 1) * limit;

    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(`
        id, title, price, created_at,
        categories(id, name),
        item_images(id, url)
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: sort === 'oldest' })
      .range(offset, offset + limit - 1);

    if (itemsError) throw itemsError;

    return {
      res_code: 200,
      res_msg: '사용자 아이템 조회 성공',
      items: items,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(items.length / limit),
        total_count: items.length,
        has_next: items.length === limit,
        has_prev: page > 1
      },
      meta: {
        sort: sort,
        filters: {}
      }
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

// 7. 사용자 위시리스트 조회 - SQL 호환
export const getUserWishlists = async (userId, options = {}) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { page = 1, limit = 20, sort = 'newest' } = options;
    const offset = (page - 1) * limit;

    const { data: wishlists, error: wishlistsError } = await supabase
      .from('wishlists')
      .select(`
        id, created_at,
        items!inner(id, title, price, item_images(id, url))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: sort === 'oldest' })
      .range(offset, offset + limit - 1);

    if (wishlistsError) throw wishlistsError;

    return {
      res_code: 200,
      res_msg: '사용자 위시리스트 조회 성공',
      wishlists: wishlists,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(wishlists.length / limit),
        total_count: wishlists.length,
        has_next: wishlists.length === limit,
        has_prev: page > 1
      },
      meta: {
        sort: sort,
        filters: {}
      }
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

// 8. 사용자 리뷰 조회 - SQL 호환
export const getUserReviews = async (userId, options = {}) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { page = 1, limit = 20, sort = 'newest' } = options;
    const offset = (page - 1) * limit;

    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id, rating, comment, created_at,
        items!inner(id, title),
        users!reviews_reviewer_id_fkey(id, display_name, profile_image_url)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: sort === 'oldest' })
      .range(offset, offset + limit - 1);

    if (reviewsError) throw reviewsError;

    return {
      res_code: 200,
      res_msg: '사용자 리뷰 조회 성공',
      reviews: reviews,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(reviews.length / limit),
        total_count: reviews.length,
        has_next: reviews.length === limit,
        has_prev: page > 1
      },
      meta: {
        sort: sort,
        filters: {}
      }
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

// 9. 사용자 구매 이력 조회 - SQL 호환
export const getUserPurchases = async (userId, options = {}) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        upvotes,
        comment_count,
        created_at,
        communities (
          name
        )
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    return {
      res_code: 200,
      res_msg: '사용자 게시글 조회 성공',
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        community: {
          name: post.communities?.name
        },
        upvotes: post.upvotes,
        comment_count: post.comment_count,
        created_at: post.created_at
      }))
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

// 5. 사용자 판매 이력 조회
export const getUserSales = async (userId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    // 현재 스키마에는 seller_id가 없으므로, 사용자가 등록한 아이템들을 조회
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, title, price, created_at')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    return {
      res_code: 200,
      res_msg: '사용자 판매 이력 조회 성공',
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        status: 'sold', // 현재 스키마에 status 컬럼이 없으므로 임시값
        created_at: item.created_at,
        buyer_count: 0 // 현재 스키마에 해당 정보가 없음
      }))
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

// 6. 사용자 구매 이력 조회
export const getUserPurchases = async (userId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    // 현재 스키마에는 구매 이력을 저장하는 테이블이 없으므로
    // 임시로 빈 배열 반환 (실제 구현 시에는 구매 테이블이 필요)
    return {
      res_code: 200,
      res_msg: '사용자 구매 이력 조회 성공',
      items: []
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};
