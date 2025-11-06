import { supabase } from '../supabaseClient';

export const createReview = async (reviewData) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { reviewee_id, item_id, rating, comment } = reviewData;

    if (reviewee_id === user.id) {
      return {
        res_code: 400,
        res_msg: 'You cannot leave a review for yourself'
      };
    }

    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('reviewee_id', reviewee_id)
      .eq('item_id', item_id)
      .single();

    if (existingReview) {
      return {
        res_code: 409,
        res_msg: 'You have already reviewed this item'
      };
    }

       
    const { data: newReview, error: reviewError } = await supabase
      .from('reviews')
      .insert([
        {
          reviewer_id: user.id,
          reviewee_id,
          item_id,
          rating,
          comment
        }
      ])
      .select()
      .single();

    if (reviewError) throw reviewError;

    await supabase
      .from('users')
      .update({
        total_reviews: supabase.raw('total_reviews + 1')
      })
      .eq('id', reviewee_id);

    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', reviewee_id);

    if (!reviewsError && reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      await supabase
        .from('users')
        .update({
          trust_score: Math.round(averageRating * 10) / 10 
        })
        .eq('id', reviewee_id);
    }

    return {
      res_code: 201,
      res_msg: 'Review created successfully',
      review: newReview
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const getUserReviews = async (userId) => {
  try {
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        items (
          id,
          title
        ),
        users!reviews_reviewer_id_fkey (
          id,
          display_name,
          profile_image_url
        )
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;

    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      item: review.items ? {
        id: review.items.id,
        title: review.items.title
      } : null,
      reviewer: {
        id: review.users.id,
        display_name: review.users.display_name,
        profile_image_url: review.users.profile_image_url
      }
    }));

    return {
      res_code: 200,
      res_msg: 'User reviews retrieved successfully',
      reviews: transformedReviews
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const getItemReviews = async (itemId) => {
  try {
    const { data: reviews, error: reviewsError } = await supabase
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
      .order('created_at', { ascending: false });

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

    return {
      res_code: 200,
      res_msg: 'Item reviews retrieved successfully',
      reviews: transformedReviews
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const getReviewStats = async (userId) => {
  try {
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', userId);

    if (reviewsError) throw reviewsError;

    if (reviews.length === 0) {
      return {
        res_code: 200,
        res_msg: 'Review stats retrieved successfully',
        stats: {
          total_reviews: 0,
          average_rating: 0,
          rating_distribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        }
      };
    }

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1;
      return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
      res_code: 200,
      res_msg: 'Review stats retrieved successfully',
      stats: {
        total_reviews: totalReviews,
        average_rating: Math.round(averageRating * 10) / 10,
        rating_distribution: ratingDistribution
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


