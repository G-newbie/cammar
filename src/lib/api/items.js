import { supabase } from '../supabaseClient';

// 1. 아이템 목록 조회 - SQL 호환
export const getItems = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      sort = 'newest',
      price_min,
      price_max
    } = filters;

    let query = supabase
      .from('items')
      .select(`
        id,
        title,
        description,
        price,
        category,
        category_id,
        seller_id,
        created_at,
        categories (
          id,
          name
        ),
        item_images (
          id,
          url
        ),
        users!items_seller_id_fkey (
          id,
          display_name,
          trust_score
        )
      `);

    // 카테고리 필터
    if (category) {
      query = query.eq('category_id', category);
    }

    // 검색 필터
    if (search) {
      query = query.or(`title.ilike.%${search}%, description.ilike.%${search}%`);
    }

    // 가격 필터
    if (price_min) {
      query = query.gte('price', price_min);
    }
    if (price_max) {
      query = query.lte('price', price_max);
    }

    // 정렬
    const sortField = sort === 'oldest' ? 'created_at' : 
                     sort === 'price_asc' ? 'price' : 
                     sort === 'price_desc' ? 'price' : 'created_at';
    const ascending = sort === 'oldest' || sort === 'price_asc';
    query = query.order(sortField, { ascending });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: items, error: itemsError, count } = await query;

    if (itemsError) throw itemsError;

    // 응답 데이터 변환 (스프레드시트 형식에 맞춤)
    const transformedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category || item.categories?.name || null,
      category_id: item.category_id,
      seller: {
        id: item.seller_id,
        display_name: item.users?.display_name || '판매자',
        trust_score: item.users?.trust_score || 0.0
      },
      images: item.item_images ? item.item_images.map(img => ({
        id: img.id,
        url: img.url
      })) : [],
      created_at: item.created_at
    }));

    const totalPages = Math.ceil(count / limit);

    return {
      res_code: 200,
      res_msg: '아이템 목록 조회 성공',
      items: transformedItems,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: count,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      meta: {
        sort: sort,
        filters: {
          category: category,
          search: search,
          price_min: price_min,
          price_max: price_max
        }
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

// 2. 최신 아이템 목록 (홈페이지용)
export const getLatestItems = async (limit = 20) => {
  try {
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(`
        id,
        title,
        price,
        created_at,
        item_images (
          url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (itemsError) throw itemsError;

    const transformedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      seller: {
        display_name: '판매자' // TODO: 실제 판매자 정보 연결 필요
      },
      images: item.item_images ? item.item_images.map(img => ({
        url: img.url
      })) : [],
      created_at: item.created_at
    }));

    return {
      res_code: 200,
      res_msg: '최신 아이템 조회 성공',
      items: transformedItems,
      meta: {
        sort: 'newest',
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

// 3. 아이템 상세 조회
export const getItemDetails = async (itemId) => {
  try {
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select(`
        id,
        title,
        description,
        price,
        seller_id,
        created_at,
        category_id,
        categories (
          id,
          name,
          description
        ),
        item_images (
          id,
          url
        ),
        users!items_seller_id_fkey (
          id,
          display_name,
          trust_score,
          total_reviews
        )
      `)
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // 조회수 증가 (현재 스키마에 view_count 컬럼이 없으므로 생략)

    const transformedItem = {
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.categories?.name || null,
      category_id: item.category_id,
      seller: {
        id: item.seller_id,
        display_name: item.users?.display_name || '판매자',
        trust_score: item.users?.trust_score || 0.0,
        total_reviews: item.users?.total_reviews || 0
      },
      images: item.item_images ? item.item_images.map(img => ({
        id: img.id,
        url: img.url
      })) : [],
      created_at: item.created_at
    };

    return {
      res_code: 200,
      res_msg: '아이템 상세 조회 성공',
      item: transformedItem
    };
  } catch (error) {
    return {
      res_code: 404,
      res_msg: error.message,
      error: error
    };
  }
};

// 4. 아이템 생성
export const createItem = async (itemData) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { title, description, price, category_id, images } = itemData;

    // 아이템 생성
    const { data: newItem, error: itemError } = await supabase
      .from('items')
      .insert([
        {
          title,
          description,
          price,
          category_id,
          seller_id: user.id
        }
      ])
      .select()
      .single();

    if (itemError) throw itemError;

    // 이미지 저장
    if (images && images.length > 0) {
      const imageData = images.map(img => ({
        item_id: newItem.id,
        url: img.image_url
      }));

      const { error: imagesError } = await supabase
        .from('item_images')
        .insert(imageData);

      if (imagesError) throw imagesError;
    }

    return {
      res_code: 201,
      res_msg: '아이템이 성공적으로 생성되었습니다',
      item: {
        id: newItem.id,
        title: newItem.title,
        description: newItem.description,
        price: newItem.price,
        seller_id: user.id, // 실제로는 items 테이블에 seller_id 컬럼이 필요
        created_at: newItem.created_at
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

// 5. 아이템 수정
export const updateItem = async (itemId, updates) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    // 판매자 권한 확인
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('seller_id')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    if (item.seller_id !== user.id) {
      return {
        res_code: 403,
        res_msg: '아이템을 수정할 권한이 없습니다'
      };
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      res_code: 200,
      res_msg: '아이템이 성공적으로 업데이트되었습니다',
      item: {
        id: updatedItem.id,
        title: updatedItem.title,
        description: updatedItem.description,
        price: updatedItem.price,
        updated_at: updatedItem.updated_at
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

// 6. 아이템 삭제
export const deleteItem = async (itemId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    // 판매자 권한 확인
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('seller_id')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    if (item.seller_id !== user.id) {
      return {
        res_code: 403,
        res_msg: '아이템을 삭제할 권한이 없습니다'
      };
    }

    // 관련 이미지들 먼저 삭제
    await supabase
      .from('item_images')
      .delete()
      .eq('item_id', itemId);

    // 아이템 삭제
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (deleteError) throw deleteError;

    return {
      res_code: 200,
      res_msg: '아이템이 성공적으로 삭제되었습니다'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

// 7. 아이템 리뷰 조회 - 스프레드시트에 명시된 API
export const getItemReviews = async (itemId, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = options;
    const offset = (page - 1) * limit;

    const { data: reviews, error: reviewsError, count } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        users!reviews_reviewer_id_fkey (
          id,
          display_name,
          profile_image_url
        )
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: sort === 'oldest' })
      .range(offset, offset + limit - 1);

    if (reviewsError) throw reviewsError;

    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reviewer: {
        id: review.users.id,
        display_name: review.users.display_name,
        profile_image_url: review.users.profile_image_url
      }
    }));

    const totalPages = Math.ceil(count / limit);

    return {
      res_code: 200,
      res_msg: '아이템 리뷰 조회 성공',
      reviews: transformedReviews,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: count,
        has_next: page < totalPages,
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
