import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Market.css';
import { getLatestItems } from '../../lib/api';

function Market() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadItems = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await getLatestItems(20);
                if (res.res_code === 200) {
                    setItems(res.items || []);
                } else {
                    setError(res.res_msg || 'Failed to load items');
                }
            } catch (e) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };
        loadItems();
    }, []);

    return (
        <div className="market-container">
            <div className="market-header">
                <h1 className="market-title">Market</h1>
            </div>
            
            
            
            <div className="divider-line"></div>
            
            {loading && <div style={{ padding: 20, textAlign: 'center' }}>Loading...</div>}
            {error && <div style={{ padding: 20, textAlign: 'center', color: 'red' }}>{error}</div>}
            {!loading && !error && (
                <div className="market-items">
                    {items.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>No items available</div>
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
                                        src={(item.images && item.images[0] && item.images[0].url) || 'https://via.placeholder.com/100x100/cccccc/666666?text=No+Image'} 
                                        alt={item.title} 
                                    />
                                </div>
                                <div className="item-info">
                                    <h3 className="item-name">{item.title}</h3>
                                    <p className="item-price">{item.price ? `${item.price.toLocaleString()} won` : 'Price not set'}</p>
                                    <p className="item-seller">{item.seller?.display_name || 'Unknown seller'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            
            <div className="post-button">
                <Link to='/item-post' className="post-btn">
                    <span className="post-icon">+</span>
                    <span className="post-text">Post</span>
                </Link>
            </div>
        </div>
    );
}

export default Market;