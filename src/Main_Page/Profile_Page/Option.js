import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Option.css';
import Navbar from '../Navbar.js';
import { getCurrentUser, getUserPosts, getUserItems, getUserWishlists } from '../../lib/api';

function Option() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Determine what to show based on URL or default
    const isPosts = location.pathname.includes('Posts') || location.search.includes('type=posts');
    const isItems = location.pathname.includes('History') || location.search.includes('type=items');
    const isWishlists = location.pathname.includes('Favorite') || location.search.includes('type=wishlists');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError('');
            try {
                // Get current user first
                const userRes = await getCurrentUser();
                if (userRes.res_code !== 200) {
                    setError('Please sign in to view your data');
                    setLoading(false);
                    return;
                }

                const currentUser = userRes.user;
                setUser(currentUser);

                // Load appropriate data based on page type
                if (isPosts) {
                    const res = await getUserPosts(currentUser.id);
                    if (res.res_code === 200) {
                        setItems(res.posts || []);
                    } else {
                        setError(res.res_msg || 'Failed to load posts');
                    }
                } else if (isWishlists) {
                    const res = await getUserWishlists(currentUser.id);
                    if (res.res_code === 200) {
                        // Transform wishlists to items format for display
                        const transformed = (res.wishlists || []).map(w => ({
                            id: w.items.id,
                            title: w.items.title,
                            price: w.items.price,
                            image: (w.items.item_images && w.items.item_images[0] && w.items.item_images[0].url) || null
                        }));
                        setItems(transformed);
                    } else {
                        setError(res.res_msg || 'Failed to load wishlists');
                    }
                } else {
                    // Default: Post History (items)
                    const res = await getUserItems(currentUser.id);
                    if (res.res_code === 200) {
                        const transformed = (res.items || []).map(item => ({
                            id: item.id,
                            title: item.title,
                            price: item.price,
                            image: (item.item_images && item.item_images[0] && item.item_images[0].url) || null
                        }));
                        setItems(transformed);
                    } else {
                        setError(res.res_msg || 'Failed to load items');
                    }
                }
            } catch (e) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isPosts, isItems, isWishlists]);

    const getTitle = () => {
        if (isPosts) return 'My Posts';
        if (isWishlists) return 'My Favorite Posts';
        return 'Post History';
    };

    return (
        <div>
            <Navbar />
            <div className="optionTitleCtn">
                <div className="optionTitle">{getTitle()}</div>
            </div>
            {loading && <div style={{ padding: 20, textAlign: 'center' }}>Loading...</div>}
            {error && <div style={{ padding: 20, textAlign: 'center', color: 'red' }}>{error}</div>}
            {!loading && !error && (
                <div className="market-items">
                    {items.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>No items found</div>
                    ) : (
                        items.map(item => (
                            <div 
                                key={item.id} 
                                className="market-item"
                                onClick={() => navigate(`/item/${item.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="item-image">
                                    <img 
                                        src={item.image || 'https://via.placeholder.com/100x100/cccccc/666666?text=No+Image'} 
                                        alt={item.title || item.name} 
                                    />
                                </div>
                                <div className="item-info">
                                    <h3 className="item-name">{item.title || item.name}</h3>
                                    <p className="item-price">{item.price ? `${item.price.toLocaleString()} won` : 'Price not set'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default Option;