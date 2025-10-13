import { Link } from 'react-router-dom';
import Navbar from '../Navbar.js';
import './ItemPost.css';

function ItemPost() {
    return (
        <div className="item-creation-wrapper">
            <Navbar />
            <div className="item-creation-container">
                <div className="item-creation-content">
                    {/* Image Upload Section */}
                    <div className="image-upload-section">
                        <div className="image-upload-area">
                            <div className="upload-icon">+</div>
                            <p className="upload-text">Select to insert images (up to 10)</p>
                        </div>
                    </div>
                    
                    {/* Form Inputs */}
                    <div className="form-section">
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input 
                                type="text" 
                                className="form-input"
                                placeholder="Enter item title"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea 
                                className="form-textarea"
                                placeholder="Enter item description"
                                rows="4"
                            ></textarea>
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Price</label>
                            <input 
                                type="text" 
                                className="form-input"
                                placeholder="Enter price (e.g., 40,000 won)"
                            />
                        </div>
                        
                        {/* Post Button - Price 바로 아래에 위치 */}
                        <div className="post-section">
                            <button className="post-button">
                                Click to post
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ItemPost;
