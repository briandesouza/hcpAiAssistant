import React, { useState, useEffect, useCallback } from 'react'
import PhoneFrame from './components/PhoneFrame'
import useDragScroll from './hooks/useDragScroll'

// Helper: format ISO timestamp to readable time (e.g. "3:45 PM")
function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Helper: relative time from ISO string (e.g. "5m", "2h", "Yesterday")
function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

// Helper: deterministic avatar color from customer name
function avatarColor(name) {
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F'];
  let hash = 0;
  for (let i = 0; i < (name||'').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Placeholder components — will be replaced by other agents
function ConversationView({ conversation, aiDraft, isLoadingDraft, onBack, onSendDraft, onSendMessage, onShowReasoning, onEditDraft }) {
  const messageListRef = useDragScroll('vertical')
  return (
    <div className="conversation-view">
      <div className="conversation-header">
        <button className="back-button" onClick={onBack}>
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1 9L9 17" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back</span>
        </button>
        <div className="conversation-header-info">
          <span className="conversation-header-name">{conversation.customer?.name}</span>
        </div>
        <div className="conversation-header-spacer" />
      </div>
      <div className="message-list" ref={messageListRef}>
        {conversation.messages && conversation.messages.map((msg, i) => (
          <React.Fragment key={i}>
            {msg.type === 'invoice' ? (
              <div className="invoice-card">
                <div className="invoice-card-header">
                  <span className="invoice-icon">📄</span>
                  <span>Invoice #{conversation.invoice?.number}</span>
                  <span className={`invoice-status ${conversation.invoice?.status}`}>
                    {conversation.invoice?.status?.toUpperCase()}
                  </span>
                </div>
                <div className="invoice-line-items">
                  {conversation.invoice?.lineItems?.map((item, j) => (
                    <div key={j} className="invoice-line-item">
                      <span>{item.description}</span>
                      <span>${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="invoice-total">
                  <span>Total</span>
                  <span>${conversation.invoice?.total?.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className={`message-bubble ${msg.isFromCustomer ? 'customer' : 'pro'}`}>
                <p>{msg.text}</p>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
            )}
          </React.Fragment>
        ))}
        {isLoadingDraft && (
          <div className="ai-typing-indicator">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
            <span className="typing-label">AI is drafting a reply...</span>
          </div>
        )}
      </div>
      {aiDraft && (
        <div className="ai-draft-banner">
          <div className="ai-draft-header">
            <div className="ai-draft-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="var(--accent-purple)" />
              </svg>
              <span>AI Draft</span>
            </div>
            <div className="ai-draft-actions">
              <button className="ai-reasoning-btn" onClick={onShowReasoning}>Why this?</button>
            </div>
          </div>
          <textarea
            className="ai-draft-text"
            value={aiDraft.draft}
            onChange={(e) => onEditDraft(e.target.value)}
          />
          <div className="ai-draft-buttons">
            <button className="draft-send-btn" onClick={() => onSendDraft(aiDraft.draft)}>
              Send
            </button>
          </div>
        </div>
      )}
      {!aiDraft && (
        <div className="message-input-bar">
          <input
            type="text"
            placeholder="Type a message..."
            className="message-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                onSendMessage(e.target.value.trim())
                e.target.value = ''
              }
            }}
          />
          <button className="send-button" onClick={(e) => {
            const input = e.target.closest('.message-input-bar').querySelector('.message-input')
            if (input.value.trim()) {
              onSendMessage(input.value.trim())
              input.value = ''
            }
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function InboxView({ conversations, actions, onSelectConversation, onActionReply, onActionView, onShowReasoning }) {
  const carouselRef = useDragScroll('horizontal')
  return (
    <div className="inbox-view">
      <div className="inbox-header">
        <h1 className="inbox-title">Smart Inbox</h1>
        <div className="inbox-header-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="var(--accent-purple)" />
          </svg>
          <span>AI Powered</span>
        </div>
      </div>

      {actions.length > 0 && (
        <div className="actions-section">
          <div className="actions-section-header">
            <h2 className="actions-section-title">Suggested Actions</h2>
            <span className="actions-count">{actions.length}</span>
          </div>
          <div className="action-cards-carousel" ref={carouselRef}>
            {actions.map((action) => (
              <div key={action.id} className="action-card" data-priority={action.priority || 'medium'}>
                <div className="action-card-accent" style={{ backgroundColor: action.accentColor }} />
                <div className="action-card-content">
                  <div className="action-card-header">
                    <span className="action-card-type">{action.type || 'Reply'}</span>
                    {action.priority === 'high' && <span className="action-card-priority">Urgent</span>}
                  </div>
                  <h3 className="action-card-title">{action.customerName}</h3>
                  <p className="action-card-preview">{action.subtitle}</p>
                  <div className="action-card-meta">
                    <span className="action-card-time">{action.title}</span>
                  </div>
                  <div className="action-card-buttons">
                    <button className="action-btn action-btn-primary" onClick={() => onActionReply(action)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M21 11.5C21 16.75 16.75 21 11.5 21C6.25 21 2 16.75 2 11.5C2 6.25 6.25 2 11.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      AI Reply
                    </button>
                    <button className="action-btn action-btn-secondary" onClick={() => onActionView(action)}>
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="conversations-section">
        <h2 className="conversations-section-title">All Messages</h2>
        <div className="conversation-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="conversation-list-item"
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="conversation-avatar" style={{ backgroundColor: avatarColor(conv.customer?.name) }}>
                {conv.customer?.initials || conv.customer?.name?.charAt(0) || 'U'}
              </div>
              <div className="conversation-item-content">
                <div className="conversation-item-top">
                  <span className="conversation-item-name">{conv.customer?.name || 'Unknown'}</span>
                  <span className="conversation-item-time">{timeAgo(conv.lastMessage?.timestamp)}</span>
                </div>
                <div className="conversation-item-bottom">
                  <p className="conversation-item-preview">{conv.lastMessage?.text || ''}</p>
                  {conv.unreadCount > 0 && (
                    <span className="conversation-item-badge">{conv.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="empty-state">
              <p>No conversations yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AIReasoningModal({ draft, onClose }) {
  return (
    <div className="reasoning-modal-overlay" onClick={onClose}>
      <div className="reasoning-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reasoning-modal-handle" />
        <div className="reasoning-modal-header">
          <h2 className="reasoning-modal-title">AI Reasoning</h2>
          <button className="reasoning-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="reasoning-modal-body">
          <div className="reasoning-section">
            <h3 className="reasoning-section-title">Draft Response</h3>
            <p className="reasoning-section-text">{draft.draft}</p>
          </div>
          {draft.reasoning && (
            <div className="reasoning-section">
              <h3 className="reasoning-section-title">Why this response?</h3>
              <p className="reasoning-section-text">{draft.reasoning}</p>
            </div>
          )}
          {draft.confidence && (
            <div className="reasoning-section">
              <h3 className="reasoning-section-title">Confidence</h3>
              <div className="confidence-bar-container">
                <div className="confidence-bar" style={{ width: `${draft.confidence * 100}%` }} />
              </div>
              <span className="confidence-label">{Math.round(draft.confidence * 100)}%</span>
            </div>
          )}
          {draft.sourceMessages && draft.sourceMessages.length > 0 && (
            <div className="reasoning-section">
              <h3 className="reasoning-section-title">Based on these messages</h3>
              {draft.sourceMessages.map((msg, i) => (
                <div key={i} className="reasoning-source-message">
                  <span className="reasoning-source-sender">{msg.from}</span>
                  <p className="reasoning-source-text">{msg.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [conversations, setConversations] = useState([])
  const [actions, setActions] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [aiDraft, setAiDraft] = useState(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
  const [sentMessages, setSentMessages] = useState({})

  // Fetch conversations and actions on mount
  useEffect(() => {
    fetch('/api/conversations')
      .then(res => res.json())
      .then(data => setConversations(data))
      .catch(err => console.error('Failed to fetch conversations:', err))

    fetch('/api/actions')
      .then(res => res.json())
      .then(data => setActions(data))
      .catch(err => console.error('Failed to fetch actions:', err))
  }, [])

  const fetchAiDraft = useCallback(async (conversationId) => {
    setIsLoadingDraft(true)
    try {
      const action = actions.find(a => a.conversationId === conversationId);
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, actionType: action?.type || 'invoice_question' }),
      })
      const data = await res.json()
      setAiDraft(data)
    } catch (err) {
      console.error('Failed to fetch AI draft:', err)
    } finally {
      setIsLoadingDraft(false)
    }
  }, [actions])

  const handleSelectConversation = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/conversations/${id}`)
      const data = await res.json()
      // Merge in any optimistically sent messages
      if (sentMessages[id]) {
        data.messages = [...(data.messages || []), ...sentMessages[id]]
      }
      setSelectedConversation(data)
      setAiDraft(null)
    } catch (err) {
      console.error('Failed to fetch conversation:', err)
    }
  }, [sentMessages])

  const handleBack = useCallback(() => {
    setSelectedConversation(null)
    setAiDraft(null)
  }, [])

  const handleActionReply = useCallback(async (action) => {
    const convId = action.conversationId
    try {
      const res = await fetch(`/api/conversations/${convId}`)
      const data = await res.json()
      if (sentMessages[convId]) {
        data.messages = [...(data.messages || []), ...sentMessages[convId]]
      }
      data.hasAIAction = true
      setSelectedConversation(data)
      setAiDraft(null)
      fetchAiDraft(convId)
    } catch (err) {
      console.error('Failed to handle action reply:', err)
    }
  }, [sentMessages, fetchAiDraft])

  const handleActionView = useCallback(async (action) => {
    const convId = action.conversationId
    try {
      const res = await fetch(`/api/conversations/${convId}`)
      const data = await res.json()
      if (sentMessages[convId]) {
        data.messages = [...(data.messages || []), ...sentMessages[convId]]
      }
      setSelectedConversation(data)
      setAiDraft(null)
    } catch (err) {
      console.error('Failed to handle action view:', err)
    }
  }, [sentMessages])

  const handleShowReasoning = useCallback(() => {
    setShowReasoning(true)
  }, [])

  const handleCloseReasoning = useCallback(() => {
    setShowReasoning(false)
  }, [])

  const handleSendDraft = useCallback(async (text) => {
    if (!selectedConversation) return
    const convId = selectedConversation.id

    // Optimistic update
    const newMessage = {
      isFromCustomer: false,
      text,
      timestamp: new Date().toISOString(),
    }
    setSelectedConversation(prev => ({
      ...prev,
      messages: [...(prev.messages || []), newMessage],
    }))
    setSentMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMessage],
    }))
    setAiDraft(null)

    try {
      await fetch(`/api/messages/${convId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sender: 'pro' }),
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }, [selectedConversation])

  const handleSendMessage = useCallback(async (text) => {
    if (!selectedConversation) return
    const convId = selectedConversation.id

    const newMessage = {
      isFromCustomer: false,
      text,
      timestamp: new Date().toISOString(),
    }
    setSelectedConversation(prev => ({
      ...prev,
      messages: [...(prev.messages || []), newMessage],
    }))
    setSentMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMessage],
    }))

    try {
      await fetch(`/api/messages/${convId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sender: 'pro' }),
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }, [selectedConversation])

  const handleEditDraft = useCallback((newText) => {
    setAiDraft(prev => prev ? { ...prev, draft: newText } : null)
  }, [])

  return (
    <div className="app-container">
      <PhoneFrame>
        {selectedConversation ? (
          <ConversationView
            conversation={selectedConversation}
            aiDraft={aiDraft}
            isLoadingDraft={isLoadingDraft}
            onBack={handleBack}
            onSendDraft={handleSendDraft}
            onSendMessage={handleSendMessage}
            onShowReasoning={handleShowReasoning}
            onEditDraft={handleEditDraft}
          />
        ) : (
          <InboxView
            conversations={conversations}
            actions={actions}
            onSelectConversation={handleSelectConversation}
            onActionReply={handleActionReply}
            onActionView={handleActionView}
            onShowReasoning={handleShowReasoning}
          />
        )}
      </PhoneFrame>
      {showReasoning && aiDraft && (
        <AIReasoningModal
          draft={aiDraft}
          onClose={handleCloseReasoning}
        />
      )}
    </div>
  )
}
