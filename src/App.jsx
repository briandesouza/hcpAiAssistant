import React, { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import PhoneFrame from './components/PhoneFrame'
import useDragScroll from './hooks/useDragScroll'

// ─── Pro Memory Content ────────────────────────────────────────────────────────
const PRO_MEMORY_CONTENT = `# Rowan Flooring

## Team
- **Jesse Rowan** — Owner / Lead Installer (15 years experience)
- **Marcus Rivera** — Installer (8 years experience)
- **Brenda Rowan** — Office Manager / Scheduling

## Services & Pricing

| Service | Price Range |
|---------|------------|
| Luxury Vinyl Plank (LVP) | $4.50 – $6.50 / sq ft installed |
| Hardwood Installation | $8 – $12 / sq ft installed |
| Tile Installation | $7 – $10 / sq ft installed |
| Floor Leveling (Self-Leveling Compound) | $2 – $4 / sq ft |
| Carpet Removal & Disposal | $1 – $2 / sq ft |
| Transition Strips | $15 – $20 each |
| Moisture Testing (concrete subfloors) | $150 flat fee |
| Free In-Home Estimates | Always |

## Standard Policies
- **Deposits**: 50% deposit required for jobs over $2,000
- **Payment**: Due upon completion — Venmo, Zelle, check, or card
- **Warranty**: 2-year workmanship warranty on all installations
- **Scheduling**: Typically 1–2 week lead time
- **Material Overage**: 10% extra material is standard to account for cuts around walls, corners, and doorways

## Frequently Asked Questions

**Q: Why is there a floor leveling / float charge?**
Most subfloors aren't perfectly level. We apply self-leveling compound so your new floor sits flat and doesn't develop gaps or creaks over time. We can't see the subfloor condition until old flooring is removed, so this is often discovered during the job. It's needed on roughly 70% of installations.

**Q: Why am I paying for more square footage than my room size?**
Industry standard is 10% overage to account for cuts around walls, corners, and doorways. This ensures we have enough material to complete the job without delays.

**Q: What are transition strips and why do I need them?**
Transition strips go in every doorway where flooring meets another surface. They create a clean edge and prevent tripping hazards. Most homes need 4–8 strips.

**Q: How long does installation take?**
A typical living room + kitchen is 2 days. Larger homes or complex patterns (herringbone, diagonal) may take 3 days.

**Q: Do I need to move my furniture?**
Yes — we ask that rooms be cleared before we arrive. We can move heavy items for an additional fee.

## Business Hours
- Monday – Friday: 8 AM – 5 PM
- Saturday: By appointment
- Sunday: Closed
`

// ─── Customer Memory Content ───────────────────────────────────────────────────
const CUSTOMER_MEMORY = {}

CUSTOMER_MEMORY['conv_1'] = `# Sarah Chen
## Customer Profile
- **Phone**: (555) 123-4567
- **Service Area**: Residential
- **Communication**: Prefers text, quick responder

## Job History
- **AC Repair** — Compressor capacitor replacement, $380
  - Completed, invoice overdue
  - Promised to pay "by end of today" but hasn't yet

## Notes
- Friendly and appreciative of work quality
- First-time customer
`

CUSTOMER_MEMORY['conv_2'] = `# Tom Rodriguez
## Customer Profile
- **Phone**: (555) 234-5678
- **Service Area**: Residential
- **Communication**: Direct, asks questions about charges

## Job History
- **Furnace Repair** — Ignitor replacement, $520
  - Completed, invoice overdue (5 days past due)
  - Questioning the $95 diagnostic fee

## Notes
- Expected diagnostic to be included with repair
- Need to explain diagnostic fee policy clearly
`

CUSTOMER_MEMORY['conv_3'] = `# Mike Johnson
## Customer Profile
- **Phone**: (555) 345-6789
- **Service Area**: Residential — Living room + kitchen
- **Communication**: Prefers text, detail-oriented

## Job History
- **LVP Installation** — Living room & kitchen, $3,200
  - Luxury vinyl plank material: $1,400
  - Floor leveling compound: $450
  - Installation labor: $1,350
  - Invoice sent, due in 7 days

## Notes
- Subfloor had low spots discovered during old flooring removal
- Questioning the $450 floor leveling charge — feels blindsided
- Need to explain why leveling wasn't in original quote
- Very happy with the finished floor quality
`

CUSTOMER_MEMORY['conv_4'] = `# David Kim
## Customer Profile
- **Phone**: (555) 456-7890
- **Service Area**: Residential
- **Communication**: Responsive, budget-conscious

## Job History
- **Full AC System** — 14 SEER Carrier unit, $5,800
  - Unit + installation + ductwork modification
  - Invoice sent, due in 10 days
  - Requesting payment plan — can't pay $5,800 at once

## Notes
- Old unit was 18 years old
- Very pleased with the new system's quiet operation
- May need flexible payment terms
`

CUSTOMER_MEMORY['conv_5'] = `# Lisa Park
## Customer Profile
- **Phone**: (555) 567-8901
- **Service Area**: Residential
- **Communication**: Responsive, appreciative

## Job History
- **Water Heater Installation** — 50-gal Rheem, $2,100
  - Emergency call — no hot water
  - Old tank had crack at bottom
  - Invoice just sent (1 hour ago)

## Notes
- Emergency customer — very grateful for fast response
- Good candidate for proactive invoice summary
`

CUSTOMER_MEMORY['conv_6'] = `# Rachel Thompson
## Customer Profile
- **Phone**: (555) 678-9012
- **Service Area**: Residential
- **Communication**: Friendly, loyal repeat customer

## Job History
- **Annual HVAC Tune-up** — $150 (PAID)
  - Filters replaced, coils cleaned, refrigerant levels checked

## Notes
- Annual maintenance customer — schedule next visit
- Always pays promptly
- Asking about next maintenance scheduling
`

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
function ConversationView({ conversation, aiDraft, isLoadingDraft, onBack, onSendDraft, onSendMessage, onShowReasoning, onEditDraft, onShowCustomerMemory, senderMode, onToggleSender }) {
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
            <h2 className="actions-section-title">Suggested Actions</h2>
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
                    <button className="action-btn action-btn-primary" onClick={() => onActionReply(action)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M21 11.5C21 16.75 16.75 21 11.5 21C6.25 21 2 16.75 2 11.5C2 6.25 6.25 2 11.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      AI Draft
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

function ProMemoryView({ onClose }) {
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
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{PRO_MEMORY_CONTENT}</ReactMarkdown>
      </div>
    </div>
  )
}

function CustomerMemoryView({ conversation, onClose }) {
  const content = CUSTOMER_MEMORY[conversation.id] ||
    `# ${conversation.customer?.name || 'Customer'}\n## Customer Notes\n\nNo notes yet for this customer.`
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
  const [conversations, setConversations] = useState([])
  const [actions, setActions] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [aiDraft, setAiDraft] = useState(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
  const [sentMessages, setSentMessages] = useState({})
  const [dismissedActionIds, setDismissedActionIds] = useState(new Set())
  const [actionsSectionDismissed, setActionsSectionDismissed] = useState(false)
  const [showProMemory, setShowProMemory] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [senderMode, setSenderMode] = useState('pro')
  const [showCustomerMemory, setShowCustomerMemory] = useState(false)

  const visibleActions = actions.filter(a => !dismissedActionIds.has(a.id))

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

  const refreshInbox = useCallback(async () => {
    try {
      const [convRes, actionsRes] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/actions'),
      ])
      const [convData, actionsData] = await Promise.all([
        convRes.json(),
        actionsRes.json(),
      ])
      setConversations(convData)
      setActions(actionsData)
    } catch (err) {
      console.error('Failed to refresh inbox:', err)
    }
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
    const convId = selectedConversation?.id
    setSelectedConversation(null)
    setAiDraft(null)
    setSenderMode('pro')
    setShowCustomerMemory(false)
    if (convId) {
      setSentMessages(prev => {
        const next = { ...prev }
        delete next[convId]
        return next
      })
    }
    refreshInbox()
  }, [selectedConversation, refreshInbox])

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
      isFromCustomer: senderMode === 'customer',
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
        body: JSON.stringify({ text, sender: senderMode }),
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }, [selectedConversation, senderMode])

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

  const handleCreateConversation = useCallback(async (name) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const newConv = await res.json()
      setConversations(prev => [newConv, ...prev])
      setShowNewConversation(false)
      setSelectedConversation(newConv)
      setSenderMode('pro')
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }, [])

  return (
    <div className="app-container">
      <PhoneFrame>
        {showProMemory ? (
          <ProMemoryView onClose={handleCloseProMemory} />
        ) : showCustomerMemory && selectedConversation ? (
          <CustomerMemoryView
            conversation={selectedConversation}
            onClose={handleCloseCustomerMemory}
          />
        ) : selectedConversation ? (
          <ConversationView
            conversation={selectedConversation}
            aiDraft={aiDraft}
            isLoadingDraft={isLoadingDraft}
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
          onClose={handleCloseReasoning}
        />
      )}
    </div>
  )
}
