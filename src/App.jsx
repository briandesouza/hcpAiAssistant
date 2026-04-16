import React, { useState, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import PhoneFrame from './components/PhoneFrame'
import useDragScroll from './hooks/useDragScroll'
import { initialConversations } from './data/mockData'
import { getFallbackDraft } from './data/aiDrafts'
import seedData from './data/seedData.json'
import proMemoryContent from './data/proMemory.md?raw'

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
function ConversationView({ conversation, aiDraft, isLoadingDraft, pipelineProcessing, onBack, onSendDraft, onSendMessage, onShowReasoning, onEditDraft, onShowCustomerMemory, senderMode, onToggleSender }) {
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
        <div className="conversation-header-right">
          <button className="conv-header-btn" onClick={onShowCustomerMemory} title="Customer Memory">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="var(--hcp-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="var(--hcp-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="sender-toggle">
            <button
              className={`sender-toggle-btn ${senderMode === 'pro' ? 'active' : ''}`}
              onClick={() => onToggleSender('pro')}
            >Pro</button>
            <button
              className={`sender-toggle-btn ${senderMode === 'customer' ? 'active' : ''}`}
              onClick={() => onToggleSender('customer')}
            >Cust</button>
          </div>
        </div>
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
        {pipelineProcessing && (
          <div className="ai-typing-indicator">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
            <span className="typing-label">AI is analyzing this message...</span>
          </div>
        )}
      </div>
      {aiDraft && (
        <div className="ai-draft-banner">
          <div className="ai-draft-header">
            <div className="ai-draft-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="var(--hcp-blue)" />
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

function InboxView({ conversations, actions, actionsSectionDismissed, onSelectConversation, onActionReply, onActionView, onShowReasoning, onShowProMemory, onNewConversation, onDismissAction, onDismissAllActions }) {
  const carouselRef = useDragScroll('horizontal')
  const sortedConversations = [...conversations].sort((a, b) => {
    const tA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0
    const tB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0
    return tB - tA
  })
  return (
    <div className="inbox-view">
      <div className="inbox-header">
        <h1 className="inbox-title">Inbox</h1>
        <div className="inbox-header-actions">
          <button className="inbox-header-btn" onClick={onShowProMemory} title="Pro Memory">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="var(--hcp-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="var(--hcp-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 7h8M8 11h5" stroke="var(--hcp-blue)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="inbox-header-btn" onClick={onNewConversation} title="New Conversation">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="var(--hcp-blue)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {actions.length > 0 && !actionsSectionDismissed && (
        <div className="actions-section">
          <div className="actions-section-header">
            <h2 className="actions-section-title">Pending Actions</h2>
            <div className="actions-section-header-right">
              <span className="actions-count">{actions.length}</span>
              <button className="actions-dismiss-btn" onClick={onDismissAllActions} title="Dismiss all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="action-cards-carousel" ref={carouselRef}>
            {actions.map((action) => (
              <div key={action.id} className="action-card" data-priority={action.priority || 'medium'}>
                <button className="action-card-dismiss" onClick={(e) => { e.stopPropagation(); onDismissAction(action.id); }} title="Dismiss">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
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
                    {action.hasDraft !== false && (
                      <button className="action-btn action-btn-primary" onClick={() => onActionReply(action)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M21 11.5C21 16.75 16.75 21 11.5 21C6.25 21 2 16.75 2 11.5C2 6.25 6.25 2 11.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        AI Draft
                      </button>
                    )}
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
          {sortedConversations.map((conv) => (
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

function AIReasoningModal({ draft, conversation, onClose }) {
  // Resolve source messages from IDs
  const resolvedSources = (draft.sourceMessageIds || []).map(id => {
    const msg = conversation?.messages?.find(m => m.id === id)
    return msg ? { text: msg.text, timestamp: msg.timestamp, from: msg.isFromCustomer ? conversation.customer?.name : 'Sandro (Pro)' } : null
  }).filter(Boolean)

  // Also support legacy sourceMessages format
  const sources = resolvedSources.length > 0 ? resolvedSources : (draft.sourceMessages || [])

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
          {sources.length > 0 && (
            <div className="reasoning-section">
              <h3 className="reasoning-section-title">Based on these messages</h3>
              {sources.map((msg, i) => (
                <div key={i} className="reasoning-source-message">
                  <span className="reasoning-source-sender">{msg.from}</span>
                  <p className="reasoning-source-text">{msg.text}</p>
                </div>
              ))}
            </div>
          )}
          {draft.memorySources && draft.memorySources.length > 0 && (
            <div className="reasoning-section">
              <h3 className="reasoning-section-title">From business memory</h3>
              {draft.memorySources.map((src, i) => (
                <div key={i} className="reasoning-source-message">
                  <span className="reasoning-source-sender">{src.source}</span>
                  <p className="reasoning-source-text">{src.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProMemoryView({ proMemory, onClose }) {
  return (
    <div className="memory-view">
      <div className="memory-header">
        <button className="back-button" onClick={onClose}>
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1 9L9 17" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back</span>
        </button>
        <div className="memory-header-title">Pro Memory</div>
        <div className="memory-header-spacer" />
      </div>
      <div className="memory-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{proMemory}</ReactMarkdown>
      </div>
    </div>
  )
}

function CustomerMemoryView({ conversation, customerMemories, onClose }) {
  const content = customerMemories[conversation?.id] ||
    `# ${conversation?.customer?.name || 'Customer'}\n\n## Notes\nNo notes yet for this customer.`
  return (
    <div className="memory-view">
      <div className="memory-header">
        <button className="back-button" onClick={onClose}>
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1 9L9 17" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back</span>
        </button>
        <div className="memory-header-title">Customer Memory</div>
        <div className="memory-header-spacer" />
      </div>
      <div className="memory-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}

function NewConversationModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  return (
    <div className="new-conv-modal-overlay" onClick={onClose}>
      <div className="new-conv-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="new-conv-modal-title">New Conversation</h3>
        <input
          type="text"
          className="new-conv-modal-input"
          placeholder="Customer name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onCreate(name.trim()) }}
          autoFocus
        />
        <div className="new-conv-modal-buttons">
          <button className="new-conv-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="new-conv-create-btn"
            disabled={!name.trim()}
            onClick={() => name.trim() && onCreate(name.trim())}
          >Create</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [conversations, setConversations] = useState(initialConversations)
  const [actions, setActions] = useState(seedData.actions || [])
  const [cachedDrafts] = useState(seedData.cachedDrafts || {})
  const [customerMemories, setCustomerMemories] = useState(seedData.customerMemories || {})
  const proMemory = proMemoryContent

  const [selectedConvId, setSelectedConvId] = useState(null)
  const [aiDraft, setAiDraft] = useState(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
  const [dismissedActionIds, setDismissedActionIds] = useState(new Set())
  const [actionsSectionDismissed, setActionsSectionDismissed] = useState(false)
  const [showProMemory, setShowProMemory] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [senderMode, setSenderMode] = useState('pro')
  const [showCustomerMemory, setShowCustomerMemory] = useState(false)
  const [pipelineProcessing, setPipelineProcessing] = useState(false)

  const selectedConversation = selectedConvId
    ? conversations.find(c => c.id === selectedConvId) || null
    : null

  const visibleActions = useMemo(() => {
    const priorityWeight = { high: 0, medium: 1, low: 2 };
    return actions
      .filter(a => !dismissedActionIds.has(a.id))
      .sort((a, b) => (priorityWeight[a.priority] ?? 1) - (priorityWeight[b.priority] ?? 1));
  }, [actions, dismissedActionIds]);

  const fetchAiDraft = useCallback(async (conversationId) => {
    // Check cached draft first (instant for seeded data)
    if (cachedDrafts[conversationId]) {
      setAiDraft(cachedDrafts[conversationId])
      return
    }
    // Fall back to API call for non-seeded conversations
    setIsLoadingDraft(true)
    try {
      const conv = conversations.find(c => c.id === conversationId)
      const action = actions.find(a => a.conversationId === conversationId)
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: conv,
          actionType: action?.type,
          proMemory,
          customerMemory: customerMemories[conversationId] || ''
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiDraft(data)
    } catch (err) {
      console.error('Draft generation failed, using fallback:', err)
      const conv = conversations.find(c => c.id === conversationId)
      const action = actions.find(a => a.conversationId === conversationId)
      if (conv) setAiDraft(getFallbackDraft(conv, action?.type || 'invoice_question'))
    } finally {
      setIsLoadingDraft(false)
    }
  }, [conversations, actions, cachedDrafts, proMemory, customerMemories])

  const handleSelectConversation = useCallback((id) => {
    setSelectedConvId(id)
    setAiDraft(null)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedConvId(null)
    setAiDraft(null)
    setSenderMode('pro')
    setShowCustomerMemory(false)
  }, [])

  const handleActionReply = useCallback((action) => {
    setSelectedConvId(action.conversationId)
    setAiDraft(null)
    fetchAiDraft(action.conversationId)
  }, [fetchAiDraft])

  const handleActionView = useCallback((action) => {
    setSelectedConvId(action.conversationId)
    setAiDraft(null)
  }, [])

  const handleShowReasoning = useCallback(() => {
    setShowReasoning(true)
  }, [])

  const handleCloseReasoning = useCallback(() => {
    setShowReasoning(false)
  }, [])

  const handleSendDraft = useCallback((text) => {
    if (!selectedConvId) return
    const convId = selectedConvId
    const newMessage = {
      id: `msg_${Date.now()}`,
      isFromCustomer: false,
      text,
      timestamp: new Date().toISOString(),
      type: 'text',
    }
    // Update master conversations list
    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, messages: [...c.messages, newMessage], lastMessage: { text, timestamp: newMessage.timestamp, isFromCustomer: false }, unreadCount: 0 }
        : c
    ))
    setAiDraft(null)

    // Auto-dismiss the related action
    const relatedAction = actions.find(a => a.conversationId === convId)
    if (relatedAction) {
      setActions(prev => prev.filter(a => a.id !== relatedAction.id))
      setDismissedActionIds(prev => new Set([...prev, relatedAction.id]))
    }
  }, [selectedConvId, actions])

  const handleSendMessage = useCallback(async (text) => {
    if (!selectedConvId) return
    const convId = selectedConvId
    const isFromCustomer = senderMode === 'customer'
    const newMessage = {
      id: `msg_${Date.now()}`,
      isFromCustomer,
      text,
      timestamp: new Date().toISOString(),
      type: 'text',
    }
    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, messages: [...c.messages, newMessage], lastMessage: { text, timestamp: newMessage.timestamp, isFromCustomer }, unreadCount: isFromCustomer ? c.unreadCount + 1 : 0 }
        : c
    ))

    // ALL messages go through the pipeline (both pro and customer)
    setPipelineProcessing(true)
    try {
      const updatedConv = conversations.find(c => c.id === convId)
      const convWithNewMsg = {
        ...updatedConv,
        messages: [...(updatedConv?.messages || []), newMessage]
      }
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: convWithNewMsg,
          message: newMessage,
          proMemory,
          customerMemory: customerMemories[convId] || '',
          sender: senderMode
        })
      })
      const result = await res.json()

      // Memory updates apply for ALL messages (pro and customer)
      if (result.customerMemoryUpdate) {
        setCustomerMemories(prev => ({ ...prev, [convId]: result.customerMemoryUpdate }))
      } else if (!customerMemories[convId] && isFromCustomer) {
        const baseline = `# ${convWithNewMsg.customer?.name || 'Customer'}\n\n## Notes\n- ${newMessage.text}\n`
        setCustomerMemories(prev => ({ ...prev, [convId]: baseline }))
      }

      // Action changes ONLY for customer messages (pro messages never create/modify actions)
      if (isFromCustomer) {
        if (result.shouldCreateAction) {
          const priorityColors = { high: '#FF3B30', medium: '#007AFF', low: '#34C759' }
          const newAction = {
            id: `action_${Date.now()}`,
            conversationId: convId,
            type: result.actionType,
            title: result.actionTitle || `Action for ${convWithNewMsg.customer?.name}`,
            subtitle: result.actionSubtitle || '',
            customerName: convWithNewMsg.customer?.name || 'Customer',
            priority: result.actionPriority || 'medium',
            accentColor: priorityColors[result.actionPriority] || '#007AFF',
            hasDraft: result.hasSufficientContext && result.actionType !== 'invoice_request'
          }
          setActions(prev => {
            const filtered = prev.filter(a => a.conversationId !== convId)
            const weight = { high: 0, medium: 1, low: 2 }
            return [...filtered, newAction].sort((a, b) => (weight[a.priority] ?? 1) - (weight[b.priority] ?? 1))
          })
        } else {
          setActions(prev => prev.filter(a => a.conversationId !== convId))
        }
      }
    } catch (err) {
      console.error('Pipeline error:', err)
      if (!customerMemories[convId] && isFromCustomer) {
        const baseline = `# Customer\n\n## Notes\n- ${newMessage.text}\n`
        setCustomerMemories(prev => ({ ...prev, [convId]: baseline }))
      }
    } finally {
      setPipelineProcessing(false)
    }
  }, [selectedConvId, senderMode, conversations, proMemory, customerMemories])

  const handleEditDraft = useCallback((newText) => {
    setAiDraft(prev => prev ? { ...prev, draft: newText } : null)
  }, [])

  const handleDismissAction = useCallback((actionId) => {
    setDismissedActionIds(prev => new Set([...prev, actionId]))
  }, [])

  const handleDismissAllActions = useCallback(() => {
    setActionsSectionDismissed(true)
  }, [])

  const handleShowProMemory = useCallback(() => {
    setShowProMemory(true)
  }, [])

  const handleCloseProMemory = useCallback(() => {
    setShowProMemory(false)
  }, [])

  const handleNewConversation = useCallback(() => {
    setShowNewConversation(true)
  }, [])

  const handleToggleSender = useCallback((mode) => {
    setSenderMode(mode)
  }, [])

  const handleShowCustomerMemory = useCallback(() => {
    setShowCustomerMemory(true)
  }, [])

  const handleCloseCustomerMemory = useCallback(() => {
    setShowCustomerMemory(false)
  }, [])

  const handleCreateConversation = useCallback((name) => {
    const id = `conv_${Date.now()}`
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const newConv = {
      id,
      customer: { name, initials, phone: '' },
      invoice: null,
      messages: [],
      lastMessage: null,
      unreadCount: 0,
      hasAIAction: false,
      actionType: null,
    }
    setConversations(prev => [newConv, ...prev])
    setShowNewConversation(false)
    setSelectedConvId(id)
    setSenderMode('pro')
  }, [])

  return (
    <div className="app-container">
      <PhoneFrame>
        {showProMemory ? (
          <ProMemoryView proMemory={proMemory} onClose={handleCloseProMemory} />
        ) : showCustomerMemory && selectedConversation ? (
          <CustomerMemoryView
            conversation={selectedConversation}
            customerMemories={customerMemories}
            onClose={handleCloseCustomerMemory}
          />
        ) : selectedConversation ? (
          <ConversationView
            conversation={selectedConversation}
            aiDraft={aiDraft}
            isLoadingDraft={isLoadingDraft}
            pipelineProcessing={pipelineProcessing}
            onBack={handleBack}
            onSendDraft={handleSendDraft}
            onSendMessage={handleSendMessage}
            onShowReasoning={handleShowReasoning}
            onEditDraft={handleEditDraft}
            onShowCustomerMemory={handleShowCustomerMemory}
            senderMode={senderMode}
            onToggleSender={handleToggleSender}
          />
        ) : (
          <InboxView
            conversations={conversations}
            actions={visibleActions}
            actionsSectionDismissed={actionsSectionDismissed}
            onSelectConversation={handleSelectConversation}
            onActionReply={handleActionReply}
            onActionView={handleActionView}
            onShowReasoning={handleShowReasoning}
            onShowProMemory={handleShowProMemory}
            onNewConversation={handleNewConversation}
            onDismissAction={handleDismissAction}
            onDismissAllActions={handleDismissAllActions}
          />
        )}
      </PhoneFrame>
      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onCreate={handleCreateConversation}
        />
      )}
      {showReasoning && aiDraft && (
        <AIReasoningModal
          draft={aiDraft}
          conversation={selectedConversation}
          onClose={handleCloseReasoning}
        />
      )}
    </div>
  )
}
