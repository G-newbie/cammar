import { Link } from 'react-router-dom';
import './Market.css';

function Market() {
    // Dummy data for market items
    const marketItems = [
        {
            id: 1,
            name: "Laptop Stand 13 inch.",
            price: "40,000 won",
            seller: "Jane Doe",
            image: "https://via.placeholder.com/100x100/cccccc/666666?text=Laptop+Stand"
        },
        {
            id: 2,
            name: "CSE300 Textbook",
            price: "70,000 won",
            seller: "Sophia Kim",
            image: "https://via.placeholder.com/100x100/cccccc/666666?text=CSE300"
        },
        {
            id: 3,
            name: "Mini Fridge for Dorm",
            price: "35,900 won",
            seller: "Bongpal Park",
            image: "https://via.placeholder.com/100x100/cccccc/666666?text=Mini+Fridge"
        },
        {
            id: 4,
            name: "Macbook Air 2024",
            price: "199,000 won",
            seller: "Gildong Hong",
            image: "https://via.placeholder.com/100x100/cccccc/666666?text=Macbook"
        },
        {
            id: 5,
            name: "Google Stake",
            price: "9,999,999 won",
            seller: "Geojit Zeol",
            image: "https://via.placeholder.com/100x100/cccccc/666666?text=Google"
        }
    ];

    return (
        <div className="market-container">
            <div className="market-header">
                <h1 className="market-title">Market</h1>
            </div>
            
            
            
            <div className="divider-line"></div>
            
            <div className="market-items">
                {marketItems.map(item => (
                    <div key={item.id} className="market-item">
                        <div className="item-image">
                            <img src={item.image} alt={item.name} />
                        </div>
                        <div className="item-info">
                            <h3 className="item-name">{item.name}</h3>
                            <p className="item-price">{item.price}</p>
                            <p className="item-seller">{item.seller}</p>
                        </div>
                    </div>
                ))}
            </div>
            
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