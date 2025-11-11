import { Link, useNavigate } from "react-router-dom";
import "./Market.css";

function Market({ items = [], loading, errorMsg }) {
  const navigate = useNavigate();

  if (loading) {
    return <div className="market-container">Loading items...</div>;
  }

  if (errorMsg) {
    return <div className="market-container error-text">{errorMsg}</div>;
  }

  return (
    <div className="market-container">
      <h2 className="market-title">Latest Items</h2>

      {items.length === 0 ? (
        <div className="market-empty">No items yet.</div>
      ) : (
        <div className="market-grid">
          {items.map((item) => (
            <div
              key={item.id}
              className="market-card"
              onClick={() => navigate(`/item/${item.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="market-image-wrapper">
                <img
                  src={
                    item.image_url ||
                    (item.images && item.images[0] && item.images[0].url) ||
                    "https://placehold.co/300x200?text=No+Image"
                  }
                  alt={item.title}
                  className="market-image"
                />
              </div>

              <div className="market-info">
                <div className="market-item-title">{item.title}</div>
                <div className="market-item-price">
                  {item.price != null ? `${item.price}₩` : ""}
                </div>
                <div className="market-item-meta">
                  <span className="market-item-category">
                    {item.category || "etc"}
                  </span>
                  {item.tags && item.tags.length > 0 && (
                    <div className="market-tags">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="market-tag-chip">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="post-button">
        <Link to="/item-post" className="post-btn">
          <span className="post-icon">+</span>
          <span className="post-text">Post</span>
        </Link>
      </div>
    </div>
  );
}

export default Market;
