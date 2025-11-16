import { useEffect, useRef } from 'react';

function Chatroom({ selectedChat, messages = [], onSendMessage, loading, error }) {
    const canInteract = Boolean(selectedChat);
    const endRef = useRef(null);

    useEffect(() => {
        if (!canInteract) return;
        try {
            if (endRef.current) {
                endRef.current.scrollIntoView({ behavior: loading ? 'auto' : 'smooth', block: 'end' });
            }
        } catch (_) { /* no-op */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, selectedChat, loading]);

    return (
        <div className="chatroom-container">
            <div className="chatroom-header">
                <h2 className="chatroom-title">
                    {selectedChat ? selectedChat.name : 'Select a chat room'}
                </h2>
            </div>
            <div className="chatroom-messages">
                {!canInteract && (
                    <div className="chatroom-placeholder">Choose a chat room from the list.</div>
                )}
                {canInteract && loading && (
                    <div className="chatroom-placeholder">Loading messages…</div>
                )}
                {canInteract && !loading && error && (
                    <div className="chatroom-error">{error}</div>
                )}
                {canInteract && !loading && !error && messages.length === 0 && (
                    <div className="chatroom-placeholder">No messages yet. Send the first one!</div>
                )}
                {canInteract && !loading && !error && messages.map(message => {
                    const key = message.id != null ? message.id : `${message.senderId}-${message.timestamp}`;
                    return (
                    <div key={key} className={`message ${message.isOwn ? 'own-message' : 'other-message'}`}>
                        <div className="message-header">
                            <span className="message-sender">{message.senderName}</span>
                            <span className="message-timestamp">{message.timestamp}</span>
                        </div>
                        <div className="message-content">{message.message}</div>
                    </div>
                )})}
                <div ref={endRef} />
            </div>
            <div className="chatroom-input">
                <input 
                    type="text" 
                    className="message-input"
                    placeholder="Insert to send..."
                    disabled={!canInteract}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                            onSendMessage && onSendMessage(e.target.value);
                            e.target.value = '';
                        }
                    }}
                />
                <button 
                    className="send-button"
                    disabled={!canInteract}
                    onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        if (input.value.trim()) {
                            onSendMessage && onSendMessage(input.value);
                            input.value = '';
                        }
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default Chatroom;

