import { supabase } from '../supabaseClient';
import { 
  getAuthenticatedUser, 
  validateInput, 
  safeIncrement, 
  safeDecrement,
  createErrorResponse, 
  createSuccessResponse 
} from './authUtils';

export const voteOnPost = async (postId, voteData) => {
  try {
    const user = await getAuthenticatedUser();
    
    validateInput.uuid(postId);
    const { vote_type } = voteData;

    if (!['upvote', 'downvote'].includes(vote_type)) {
      throw new Error('유효하지 않은 투표 타입입니다 (upvote 또는 downvote)');
    }

    const { data: existingVote, error: checkError } = await supabase
      .from('post_votes')
      .select('id, vote_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    let voteResult;

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        await supabase
          .from('post_votes')
          .delete()
          .eq('id', existingVote.id);

        const updateField = vote_type === 'upvote' ? 'upvotes' : 'downvotes';
        await supabase
          .from('community_posts')
          .update({
            [updateField]: safeDecrement(updateField)
          })
          .eq('id', postId);

        voteResult = null;
      } else {
        const { data: updatedVote, error: updateError } = await supabase
          .from('post_votes')
          .update({
            vote_type
          })
          .eq('id', existingVote.id)
          .select()
          .single();

        if (updateError) throw updateError;

        const oldField = existingVote.vote_type === 'upvote' ? 'upvotes' : 'downvotes';
        const newField = vote_type === 'upvote' ? 'upvotes' : 'downvotes';

        await supabase
          .from('community_posts')
          .update({
            [oldField]: safeDecrement(oldField),
            [newField]: safeIncrement(newField)
          })
          .eq('id', postId);

        voteResult = updatedVote;
      }
    } else {
      const { data: newVote, error: createError } = await supabase
        .from('post_votes')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            vote_type
          }
        ])
        .select()
        .single();

      if (createError) throw createError;

      const updateField = vote_type === 'upvote' ? 'upvotes' : 'downvotes';
      await supabase
        .from('community_posts')
        .update({
          [updateField]: safeIncrement(updateField)
        })
        .eq('id', postId);

      voteResult = newVote;
    }

    return createSuccessResponse(
      voteResult ? '투표가 성공적으로 처리되었습니다' : '투표가 취소되었습니다',
      voteResult
    );
  } catch (error) {
    return createErrorResponse(400, error.message, error);
  }
};

export const getPostVotes = async (postId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('upvotes, downvotes')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    const { data: userVote, error: voteError } = await supabase
      .from('post_votes')
      .select('vote_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    return {
      res_code: 200,
      res_msg: '투표 현황 조회 성공',
      votes: {
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        user_vote: userVote ? userVote.vote_type : null
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

export const getUserVote = async (postId) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return {
        res_code: 401,
        res_msg: '인증이 필요합니다'
      };
    }

    const { data: vote, error: voteError } = await supabase
      .from('post_votes')
      .select('vote_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    return {
      res_code: 200,
      res_msg: '투표 상태 확인 완료',
      vote_type: vote ? vote.vote_type : null
    };
  } catch (error) {
    return {
      res_code: 200,
      res_msg: '투표 상태 확인 완료',
      vote_type: null
    };
  }
};
