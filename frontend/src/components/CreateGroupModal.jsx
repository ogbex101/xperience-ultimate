import React, { useState } from 'react';
import './CreateGroupModal.css';

const CreateGroupModal = ({ onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        name: '',
        game_specialty: '',
        description: '',
        max_members: 20,
        visibility: 'public' // Added visibility field
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.name.trim()) {
            setError('Group name is required');
            return;
        }

        if (!formData.game_specialty) {
            setError('Please select a game specialty');
            return;
        }

        setIsSubmitting(true);
        const result = await onCreate(formData);
        
        if (!result.success) {
            setError(result.message);
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="create-group-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="gradient-text">Create New Group</h2>
                    <button className="close-modal" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="group-form">
                    {error && (
                        <div className="error-message animate-fade-in">
                            <span className="error-icon">⚠️</span> {error}
                        </div>
                    )}
                    
                    <div className="form-group animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <label htmlFor="name">
                            <span className="label-icon">🏷️</span>
                            Group Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Phoenix Squad"
                            maxLength="100"
                            required
                            className="form-input"
                            autoFocus
                        />
                        <small className="input-hint">Choose a unique and memorable name for your group</small>
                    </div>

                    <div className="form-group animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <label htmlFor="game_specialty">
                            <span className="label-icon">🎮</span>
                            Game Specialty *
                        </label>
                        <select
                            id="game_specialty"
                            name="game_specialty"
                            value={formData.game_specialty}
                            onChange={handleChange}
                            required
                            className="form-select"
                        >
                            <option value="">Select a game</option>
                            <option value="Call of Duty: Warzone">Call of Duty: Warzone</option>
                            <option value="PUBG">PUBG</option>
                            <option value="Free Fire">Free Fire</option>
                            <option value="Valorant">Valorant</option>
                            <option value="Fortnite">Fortnite</option>
                            <option value="Dota 2">Dota 2</option>
                            <option value="League of Legends">League of Legends</option>
                            <option value="FIFA 23">FIFA 23</option>
                            <option value="Call of Duty: Mobile">Call of Duty: Mobile</option>
                            <option value="Overwatch 2">Overwatch 2</option>
                            <option value="Apex Legends">Apex Legends</option>
                            <option value="CS:GO">Counter-Strike: Global Offensive</option>
                            <option value="Rainbow Six Siege">Rainbow Six Siege</option>
                            <option value="Rocket League">Rocket League</option>
                            <option value="Minecraft">Minecraft</option>
                        </select>
                        <small className="input-hint">Main game your group will focus on</small>
                    </div>

                    <div className="form-group animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <label htmlFor="description">
                            <span className="label-icon">📝</span>
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your group's purpose, rules, or anything else..."
                            rows="4"
                            maxLength="500"
                            className="form-textarea"
                        />
                        <div className="char-counter">
                            {formData.description.length}/500 characters
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            <label htmlFor="max_members">
                                <span className="label-icon">👥</span>
                                Maximum Members
                            </label>
                            <input
                                type="number"
                                id="max_members"
                                name="max_members"
                                value={formData.max_members}
                                onChange={handleChange}
                                min="2"
                                max="100"
                                className="form-input"
                            />
                            <small className="input-hint">Recommended: 5-20 for active groups</small>
                        </div>

                        <div className="form-group animate-fade-in" style={{ animationDelay: '0.5s' }}>
                            <label htmlFor="visibility">
                                <span className="label-icon">🔒</span>
                                Group Visibility
                            </label>
                            <div className="visibility-options">
                                <label className={`visibility-option ${formData.visibility === 'public' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="public"
                                        checked={formData.visibility === 'public'}
                                        onChange={handleChange}
                                    />
                                    <div className="option-content">
                                        <span className="option-icon">🌐</span>
                                        <div className="option-text">
                                            <strong>Public</strong>
                                            <small>Anyone can see and request to join</small>
                                        </div>
                                    </div>
                                </label>
                                
                                <label className={`visibility-option ${formData.visibility === 'private' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="private"
                                        checked={formData.visibility === 'private'}
                                        onChange={handleChange}
                                    />
                                    <div className="option-content">
                                        <span className="option-icon">🔒</span>
                                        <div className="option-text">
                                            <strong>Private</strong>
                                            <small>Invite only, hidden from discovery</small>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="form-info">
                        <div className="info-icon">💡</div>
                        <p>
                            <strong>Pro Tip:</strong> Public groups get discovered more easily and can grow faster. 
                            Private groups are better for exclusive teams and tournaments.
                        </p>
                    </div>

                    <div className="form-actions animate-fade-in" style={{ animationDelay: '0.6s' }}>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="cancel-button"
                            disabled={isSubmitting}
                        >
                            <span className="button-icon">←</span>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`create-button ${isSubmitting ? 'submitting' : ''}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating Group...
                                </>
                            ) : (
                                <>
                                    <span className="button-icon">+</span>
                                    Create Group
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;