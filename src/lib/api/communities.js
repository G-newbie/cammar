import { supabase } from '../supabaseClient';

export const getCommunities = async () => {
  try {
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select(`
        id,
        name,
        description,
        member_count,
        post_count,
        created_at,
        users!communities_creator_id_fkey (
          id,
          display_name
        )
      `)
      .order('created_at', { ascending: false });

    if (communitiesError) throw communitiesError;

    const transformedCommunities = communities.map(community => ({
      id: community.id,
      name: community.name,
      description: community.description,
      creator: {
        id: community.users.id,
        display_name: community.users.display_name
      },
      member_count: community.member_count,
      post_count: community.post_count,
      created_at: community.created_at
    }));

    return {
      res_code: 200,
      res_msg: 'Communities retrieved successfully',
      communities: transformedCommunities
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const createCommunity = async (communityData) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { name, description } = communityData;

    const { data: newCommunity, error: communityError } = await supabase
      .from('communities')
      .insert([
        {
          name,
          description,
          creator_id: user.id,
          member_count: 1, 
          post_count: 0
        }
      ])
      .select()
      .single();

    if (communityError) throw communityError;

    return {
      res_code: 201,
      res_msg: 'Community created successfully',
      community: newCommunity
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const getCommunityPosts = async (communityId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 20
    } = filters;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        upvotes,
        downvotes,
        comment_count,
        created_at,
        users!community_posts_author_id_fkey (
          id,
          display_name,
          trust_score
        ),
        post_media (
          id,
          media_url,
          media_type,
          display_order
        )
      `, { count: 'exact', head: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data: posts, error: postsError, count } = await query;

    if (postsError) throw postsError;

    const transformedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.users ? {
        id: post.users.id,
        display_name: post.users.display_name,
        trust_score: post.users.trust_score
      } : null,
      community: post.communities ? {
        id: post.communities.id,
        name: post.communities.name
      } : null,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      comment_count: post.comment_count,
      media: post.post_media ? post.post_media.map(media => ({
        id: media.id,
        media_url: media.media_url,
        media_type: media.media_type,
        display_order: media.display_order
      })) : [],
      created_at: post.created_at
    }));

    const totalPages = count != null ? Math.ceil(count / limit) : null;

    return {
      res_code: 200,
      res_msg: 'Community posts retrieved successfully',
      posts: transformedPosts,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: count,
        has_next: totalPages ? page < totalPages : false
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

export const joinCommunity = async (communityId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { error: updateError } = await supabase
      .from('communities')
      .update({
        member_count: supabase.raw('member_count + 1')
      })
      .eq('id', communityId);

    if (updateError) throw updateError;

    return {
      res_code: 200,
      res_msg: 'Joined community',
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};

export const leaveCommunity = async (communityId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: 'Authentication required'
      };
    }

    const { error: updateError } = await supabase
      .from('communities')
      .update({
        member_count: supabase.raw('member_count - 1')
      })
      .eq('id', communityId);

    if (updateError) throw updateError;

    return {
      res_code: 200,
      res_msg: 'Left community'
    };
  } catch (error) {
    return {
      res_code: 400,
      res_msg: error.message,
      error: error
    };
  }
};
