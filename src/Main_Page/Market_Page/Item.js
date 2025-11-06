import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar.js';
import './Item.css';
import { getItemDetails, addToWishlist, removeFromWishlist, isItemInWishlist, createChatRoom, getItemReviews, createReview, getCurrentUser } from '../../lib/api';

function Item() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    useEffect(() => {
        const loadItem = async () => {
            if (!id) {
                setError('Item ID is required');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const res = await getItemDetails(id);
                if (res.res_code === 200) {
                    setItem(res.item);
                } else {
                    setError(res.res_msg || 'Failed to load item');
                }
            } catch (e) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };
        loadItem();
        
        // Load current user
        const loadUser = async () => {
            try {
                const userRes = await getCurrentUser();
                if (userRes.res_code === 200 && userRes.user) {
                    setCurrentUserId(userRes.user.id);
                }
            } catch (e) {
                console.error('Error loading user:', e);
            }
        };
        loadUser();
    }, [id]);

    useEffect(() => {
        const checkWishlist = async () => {
            if (!id) return;
            try {
                const res = await isItemInWishlist(id);
                if (res.res_code === 200) {
                    setIsInWishlist(res.in_wishlist || false);
                }
            } catch (e) {
                console.error('Error checking wishlist:', e);
            }
        };
        checkWishlist();
    }, [id]);

    useEffect(() => {
        const loadReviews = async () => {
            if (!id) return;
            setReviewsLoading(true);
            try {
                const res = await getItemReviews(id, { limit: 10 });
                if (res.res_code === 200) {
                    setReviews(res.reviews || []);
                }
            } catch (e) {
                console.error('Error loading reviews:', e);
            } finally {
                setReviewsLoading(false);
            }
        };
        loadReviews();
    }, [id]);

    const handleCreateReview = async () => {
        if (!item || !reviewComment.trim() || reviewLoading) return;
        if (currentUserId === item.seller_id) {
            alert('You cannot review your own item');
            return;
        }
        setReviewLoading(true);
        try {
            const res = await createReview({
                reviewee_id: item.seller_id,
                item_id: item.id,
                rating: reviewRating,
                comment: reviewComment.trim()
            });
            if (res.res_code === 201) {
                alert('Review created successfully!');
                setShowReviewForm(false);
                setReviewComment('');
                setReviewRating(5);
                // Reload reviews
                const reviewsRes = await getItemReviews(id, { limit: 10 });
                if (reviewsRes.res_code === 200) {
                    setReviews(reviewsRes.reviews || []);
                }
            } else {
                alert(res.res_msg || 'Failed to create review');
            }
        } catch (e) {
            alert('Network error');
        } finally {
            setReviewLoading(false);
        }
    };

    const handleFavorite = async () => {
        if (!id) return;
        setWishlistLoading(true);
        try {
            let res;
            if (isInWishlist) {
                res = await removeFromWishlist(id);
            } else {
                res = await addToWishlist(id);
            }
            if (res.res_code === 200 || res.res_code === 201) {
                setIsInWishlist(!isInWishlist);
            } else {
                alert(res.res_msg || 'Failed to update wishlist');
            }
        } catch (e) {
            alert('Network error');
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleChat = async () => {
        if (!id) return;
        setChatLoading(true);
        try {
            const res = await createChatRoom(id);
            if (res.res_code === 201 || res.res_code === 409) {
                const chatRoomId = res.chat_room?.id;
                if (chatRoomId) {
                    navigate(`/chat?room=${chatRoomId}`);
                }
            } else {
                alert(res.res_msg || 'Failed to create chat room');
            }
        } catch (e) {
            alert('Network error');
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="item-page-wrapper">
                <Navbar />
                <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="item-page-wrapper">
                <Navbar />
                <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
                    {error || 'Item not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="item-page-wrapper">
            <Navbar />
            <div className="item-description-container">
                {/* Image Section */}
                <div className="item-image-section">
                    <img 
                        src={(item.images && item.images[0] && item.images[0].url) || 'https://via.placeholder.com/300x300/cccccc/666666?text=No+Image'} 
                        alt={item.title} 
                        className="item-main-image" 
                    />
                </div>
                
                {/* Main Content Grid */}
                <div className="item-content-grid">
                    {/* Left Side: Title, Description, Condition */}
                    <div className="item-details-section">
                        <h1 className="item-title">{item.title}</h1>
                        <p className="item-description">{item.description || 'No description'}</p>
                    </div>
                    
                    {/* Right Side: Price/Seller Info + Buttons */}
                    <div className="item-right-section">
                        <div className="item-price-seller-box">
                            <div className="item-price">{item.price ? `${item.price.toLocaleString()} won` : 'Price not set'}</div>
                            <div className="item-seller">{item.seller?.display_name || 'Unknown seller'}</div>
                            <div className="item-reputation">Reputation: {item.seller?.trust_score || 0}/5.0</div>
                        </div>
                        
                        <div className="item-actions">
                            <button 
                                className="favorite-btn" 
                                onClick={handleFavorite}
                                disabled={wishlistLoading}
                            >
                                <span className="favorite-icon">
                                    <i className={`bi ${isInWishlist ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                                </span>
                                <span className="favorite-text">{wishlistLoading ? 'Loading...' : 'Favorite'}</span>
                            </button>
                            <button 
                                className="chat-btn"
                                onClick={handleChat}
                                disabled={chatLoading}
                            >
                                <span className="chat-icon"><i className="bi bi-chat-dots"></i></span>
                                <span className="chat-text">{chatLoading ? 'Loading...' : 'Click to chat with the seller'}</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Reviews Section */}
                <div className="item-reviews-section" style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2>Reviews ({reviews.length})</h2>
                        {currentUserId && currentUserId !== item.seller_id && (
                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                            >
                                {showReviewForm ? 'Cancel' : 'Write Review'}
                            </button>
                        )}
                    </div>
                    {showReviewForm && (
                        <div style={{ padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 20 }}>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ marginRight: 8 }}>Rating: </label>
                                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} style={{ padding: 4 }}>
                                    {[1, 2, 3, 4, 5].map(r => (
                                        <option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Write your review here..."
                                style={{ width: '100%', minHeight: 80, padding: 8, marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' }}
                            />
                            <button
                                onClick={handleCreateReview}
                                disabled={reviewLoading || !reviewComment.trim()}
                                style={{ padding: '8px 16px', backgroundColor: reviewLoading || !reviewComment.trim() ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: reviewLoading || !reviewComment.trim() ? 'not-allowed' : 'pointer' }}
                            >
                                {reviewLoading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    )}
                    {reviewsLoading && <div style={{ padding: 20, textAlign: 'center' }}>Loading reviews...</div>}
                    {!reviewsLoading && reviews.length === 0 && (
                        <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>No reviews yet</div>
                    )}
                    {!reviewsLoading && reviews.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {reviews.map(review => (
                                <div key={review.id} style={{ padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                        <div>
                                            <strong>{review.reviewer?.display_name || 'Anonymous'}</strong>
                                            <div style={{ marginTop: 4 }}>
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} ({review.rating}/5)
                                            </div>
                                        </div>
                                        <div style={{ color: '#666', fontSize: 14 }}>
                                            {new Date(review.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <div style={{ marginTop: 8, color: '#333' }}>
                                            {review.comment}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Item;
