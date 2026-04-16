// Mock data for Housecall Pro AI Smart Inbox MVP
// All timestamps are relative to Date.now() so conversations always feel current.

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function ts(offset) {
  return new Date(NOW + offset).toISOString();
}

function datestamp(offset) {
  return NOW + offset;
}

// ─── Conversation 1: Sarah Chen — AC Repair ────────────────────────────────

const conv1 = {
  id: "conv_1",
  customer: { name: "Sarah Chen", initials: "SC", phone: "(555) 123-4567" },
  invoice: {
    id: "inv_1001",
    number: "1001",
    total: 380,
    status: "overdue",
    dueDate: datestamp(-3 * DAY),
    sentDate: datestamp(-5 * DAY),
    lineItems: [
      { description: "AC Diagnostic", amount: 95 },
      { description: "Compressor capacitor replacement", amount: 135 },
      { description: "Labor (1.5 hrs)", amount: 150 },
    ],
  },
  messages: [
    {
      id: "msg_1_1",
      text: "Hi! I'd like to schedule an AC repair — my unit is blowing warm air.",
      timestamp: ts(-7 * DAY),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_1_2",
      text: "Hey Sarah! I can come out tomorrow morning between 9-11. Does that work for you?",
      timestamp: ts(-7 * DAY + 0.5 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_1_3",
      text: "Perfect, tomorrow morning works!",
      timestamp: ts(-7 * DAY + 1 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_1_4",
      text: "On my way! Should be there in about 20 minutes.",
      timestamp: ts(-6 * DAY),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_1_5",
      text: "Great, see you soon!",
      timestamp: ts(-6 * DAY + 5 * 60000),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_1_6",
      text: "All done! Your compressor capacitor was failing — that's what caused the warm air. Everything is running cold again. I'll send the invoice over shortly.",
      timestamp: ts(-6 * DAY + 2 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_1_7",
      text: "Thank you so much, it already feels cooler in here!",
      timestamp: ts(-6 * DAY + 2.5 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_1_8",
      text: "Invoice #1001 for $380.00 has been sent.",
      timestamp: ts(-5 * DAY),
      isFromCustomer: false,
      type: "invoice",
    },
    {
      id: "msg_1_9",
      text: "Got it, I'll pay by end of today!",
      timestamp: ts(-1 * DAY + 14.5 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
  ],
  lastMessage: {
    text: "Got it, I'll pay by end of today!",
    timestamp: ts(-1 * DAY + 14.5 * HOUR),
    isFromCustomer: true,
  },
  unreadCount: 1,
  hasAIAction: true,
  actionType: "payment_followup",
};

// ─── Conversation 2: Tom Rodriguez — Furnace Repair ─────────────────────────

const conv2 = {
  id: "conv_2",
  customer: { name: "Tom Rodriguez", initials: "TR", phone: "(555) 234-5678" },
  invoice: {
    id: "inv_1002",
    number: "1002",
    total: 520,
    status: "overdue",
    dueDate: datestamp(-5 * DAY),
    sentDate: datestamp(-8 * DAY),
    lineItems: [
      { description: "Furnace diagnostic", amount: 95 },
      { description: "Ignitor replacement", amount: 185 },
      { description: "Labor (2 hrs)", amount: 240 },
    ],
  },
  messages: [
    {
      id: "msg_2_1",
      text: "Hey, my furnace isn't turning on. Can you take a look?",
      timestamp: ts(-10 * DAY),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_2_2",
      text: "Sure thing Tom. I can come by Thursday afternoon. Will you be home around 2pm?",
      timestamp: ts(-10 * DAY + 1 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_2_3",
      text: "Yep, I'll be here. Thanks!",
      timestamp: ts(-10 * DAY + 1.5 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_2_4",
      text: "All fixed! Your ignitor had cracked — replaced it and the furnace is firing up fine now. You should feel heat within a few minutes.",
      timestamp: ts(-9 * DAY + 3 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_2_5",
      text: "Awesome, it's already warming up. Appreciate the quick fix.",
      timestamp: ts(-9 * DAY + 3.5 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_2_6",
      text: "Invoice #1002 for $520.00 has been sent.",
      timestamp: ts(-8 * DAY),
      isFromCustomer: false,
      type: "invoice",
    },
    {
      id: "msg_2_7",
      text: "Hey what's the diagnostic fee for? I thought the inspection was included with the repair.",
      timestamp: ts(-2 * DAY),
      isFromCustomer: true,
      type: "text",
    },
  ],
  lastMessage: {
    text: "Hey what's the diagnostic fee for? I thought the inspection was included with the repair.",
    timestamp: ts(-2 * DAY),
    isFromCustomer: true,
  },
  unreadCount: 1,
  hasAIAction: true,
  actionType: "invoice_question",
};

// ─── Conversation 3: Mike Johnson — Flooring Installation ───────────────────

const conv3 = {
  id: "conv_3",
  customer: { name: "Mike Johnson", initials: "MJ", phone: "(555) 345-6789" },
  invoice: {
    id: "inv_1003",
    number: "1003",
    total: 3200,
    status: "sent",
    dueDate: datestamp(7 * DAY),
    sentDate: datestamp(-1 * DAY),
    lineItems: [
      { description: "Luxury vinyl plank material", amount: 1400 },
      { description: "Floor leveling compound (float)", amount: 450 },
      { description: "Installation labor", amount: 1350 },
    ],
  },
  messages: [
    {
      id: "msg_3_1",
      text: "Hi Jesse, I'm interested in getting luxury vinyl plank installed in my living room and kitchen. Can you give me a quote?",
      timestamp: ts(-14 * DAY),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_3_2",
      text: "Hey Mike! I'd love to help. I can swing by this week to measure and take a look at the subfloor. How's Wednesday?",
      timestamp: ts(-14 * DAY + 2 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_3_3",
      text: "Wednesday works. See you then.",
      timestamp: ts(-14 * DAY + 3 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_3_4",
      text: "Thanks for showing me around today. I've put together a quote for $3,200 which covers the vinyl plank material, floor prep, and installation. I'll send it over now.",
      timestamp: ts(-12 * DAY),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_3_5",
      text: "Looks good, let's do it. When can you start?",
      timestamp: ts(-12 * DAY + 4 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_3_6",
      text: "I can start next Monday. Should take about 2 days. I'll confirm the morning of.",
      timestamp: ts(-12 * DAY + 5 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_3_7",
      text: "Floors are done! Everything looks great. Avoid heavy furniture for 24 hours to let the adhesive set fully. I'll send the invoice over.",
      timestamp: ts(-3 * DAY),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_3_8",
      text: "They look amazing, thank you!",
      timestamp: ts(-3 * DAY + 1 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_3_9",
      text: "Invoice #1003 for $3,200.00 has been sent.",
      timestamp: ts(-1 * DAY),
      isFromCustomer: false,
      type: "invoice",
    },
    {
      id: "msg_3_10",
      text: "What's the float charge for? $450 seems like a lot for something I didn't ask for.",
      timestamp: ts(-0 * DAY + 9 * HOUR - NOW % DAY),
      isFromCustomer: true,
      type: "text",
    },
  ],
  lastMessage: {
    text: "What's the float charge for? $450 seems like a lot for something I didn't ask for.",
    timestamp: ts(-0 * DAY + 9 * HOUR - NOW % DAY),
    isFromCustomer: true,
  },
  unreadCount: 1,
  hasAIAction: true,
  actionType: "invoice_question",
};

// ─── Conversation 4: David Kim — Full AC System Installation ────────────────

const conv4 = {
  id: "conv_4",
  customer: { name: "David Kim", initials: "DK", phone: "(555) 456-7890" },
  invoice: {
    id: "inv_1004",
    number: "1004",
    total: 5800,
    status: "sent",
    dueDate: datestamp(10 * DAY),
    sentDate: datestamp(-2 * DAY),
    lineItems: [
      { description: "14 SEER Carrier AC unit", amount: 3200 },
      { description: "Installation labor", amount: 1800 },
      { description: "Ductwork modification", amount: 800 },
    ],
  },
  messages: [
    {
      id: "msg_4_1",
      text: "Hi, I need a new AC system. My current one is 18 years old and barely keeping up. Can you come out and give me an estimate?",
      timestamp: ts(-21 * DAY),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_4_2",
      text: "Absolutely David. I do free in-home estimates. How's this Friday morning?",
      timestamp: ts(-21 * DAY + 3 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_4_3",
      text: "Friday works, see you then.",
      timestamp: ts(-21 * DAY + 4 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_4_4",
      text: "Thanks for having me out. Based on your home's size and ductwork, I'd recommend a 14 SEER Carrier unit. Total estimate comes to $5,800 including the unit, installation, and some ductwork modifications you'll need. I'll send the detailed estimate now.",
      timestamp: ts(-19 * DAY),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_4_5",
      text: "OK let's go ahead with it. When can you install?",
      timestamp: ts(-18 * DAY),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_4_6",
      text: "Great! I can schedule you for next Tuesday. Installation usually takes a full day. I'll confirm the night before.",
      timestamp: ts(-18 * DAY + 2 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_4_7",
      text: "New AC is in and running! Set it to 72 and let it run for a few hours to stabilize. You should notice a huge difference in efficiency over your old unit. I'll send the invoice over.",
      timestamp: ts(-4 * DAY),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_4_8",
      text: "It's so quiet compared to the old one, love it.",
      timestamp: ts(-4 * DAY + 2 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_4_9",
      text: "Invoice #1004 for $5,800.00 has been sent.",
      timestamp: ts(-2 * DAY),
      isFromCustomer: false,
      type: "invoice",
    },
    {
      id: "msg_4_10",
      text: "This is way more than I was expecting. I can't pay $5,800 all at once. Is there any way to break this up?",
      timestamp: ts(-1 * DAY),
      isFromCustomer: true,
      type: "text",
    },
  ],
  lastMessage: {
    text: "This is way more than I was expecting. I can't pay $5,800 all at once. Is there any way to break this up?",
    timestamp: ts(-1 * DAY),
    isFromCustomer: true,
  },
  unreadCount: 1,
  hasAIAction: true,
  actionType: "payment_plan",
};

// ─── Conversation 5: Lisa Park — Water Heater Installation ──────────────────

const conv5 = {
  id: "conv_5",
  customer: { name: "Lisa Park", initials: "LP", phone: "(555) 567-8901" },
  invoice: {
    id: "inv_1005",
    number: "1005",
    total: 2100,
    status: "sent",
    dueDate: datestamp(14 * DAY),
    sentDate: datestamp(-1 * HOUR),
    lineItems: [
      { description: "50-gal Rheem water heater", amount: 950 },
      { description: "Installation labor", amount: 850 },
      { description: "Permit fees", amount: 150 },
      { description: "Old unit disposal", amount: 150 },
    ],
  },
  messages: [
    {
      id: "msg_5_1",
      text: "Hi, I have no hot water at all this morning. Can someone come out today?",
      timestamp: ts(-4 * DAY),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_5_2",
      text: "Oh no! I can come out this afternoon around 3pm to take a look. Hang tight, Lisa.",
      timestamp: ts(-4 * DAY + 1 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_5_3",
      text: "Thank you so much, that would be great.",
      timestamp: ts(-4 * DAY + 1.5 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_5_4",
      text: "Took a look — your water heater tank has a crack at the bottom, unfortunately it can't be repaired. I'd recommend replacing it with a new 50-gallon Rheem. I can do the install tomorrow if you'd like.",
      timestamp: ts(-4 * DAY + 6 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_5_5",
      text: "Yes please, go ahead. I definitely need hot water back!",
      timestamp: ts(-4 * DAY + 7 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_5_6",
      text: "New water heater is installed and running! You should have hot water within about 30-40 minutes. I'll get the invoice together for you.",
      timestamp: ts(-3 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_5_7",
      text: "Already warming up, you're a lifesaver!",
      timestamp: ts(-2.5 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_5_8",
      text: "Invoice #1005 for $2,100.00 has been sent.",
      timestamp: ts(-1 * HOUR),
      isFromCustomer: false,
      type: "invoice",
    },
  ],
  lastMessage: {
    text: "Invoice #1005 for $2,100.00 has been sent.",
    timestamp: ts(-1 * HOUR),
    isFromCustomer: false,
  },
  unreadCount: 0,
  hasAIAction: true,
  actionType: "invoice_summary",
};

// ─── Conversation 6: Rachel Thompson — Annual HVAC Maintenance ──────────────

const conv6 = {
  id: "conv_6",
  customer: {
    name: "Rachel Thompson",
    initials: "RT",
    phone: "(555) 678-9012",
  },
  invoice: {
    id: "inv_1006",
    number: "1006",
    total: 150,
    status: "paid",
    dueDate: datestamp(-7 * DAY),
    sentDate: datestamp(-10 * DAY),
    paidDate: datestamp(-7 * DAY),
    lineItems: [{ description: "Annual HVAC tune-up", amount: 150 }],
  },
  messages: [
    {
      id: "msg_6_1",
      text: "Hi Jesse, it's that time of year again! Can I schedule my annual HVAC maintenance?",
      timestamp: ts(-14 * DAY),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_6_2",
      text: "Hey Rachel! Of course. How's next Wednesday morning?",
      timestamp: ts(-14 * DAY + 1 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_6_3",
      text: "Wednesday at 10am works perfectly.",
      timestamp: ts(-14 * DAY + 2 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_6_4",
      text: "All done with the tune-up! Everything looks good — filters replaced, coils cleaned, refrigerant levels are solid. System is running efficiently. I'll send the invoice.",
      timestamp: ts(-10 * DAY + 2 * HOUR),
      isFromCustomer: false,
      type: "text",
    },
    {
      id: "msg_6_5",
      text: "Invoice #1006 for $150.00 has been sent.",
      timestamp: ts(-10 * DAY),
      isFromCustomer: false,
      type: "invoice",
    },
    {
      id: "msg_6_6",
      text: "Paid! Thanks Jesse.",
      timestamp: ts(-7 * DAY),
      isFromCustomer: true,
      type: "text",
    },
    {
      id: "msg_6_7",
      text: "Thanks! When should I schedule my next maintenance?",
      timestamp: ts(-2 * HOUR),
      isFromCustomer: true,
      type: "text",
    },
  ],
  lastMessage: {
    text: "Thanks! When should I schedule my next maintenance?",
    timestamp: ts(-2 * HOUR),
    isFromCustomer: true,
  },
  unreadCount: 0,
  hasAIAction: false,
  actionType: null,
};

// ─── All conversations ──────────────────────────────────────────────────────

const conversations = [conv1, conv2, conv3, conv4, conv5, conv6];

// ─── Action cards for conversations 1–5 ─────────────────────────────────────

const actions = [
  {
    id: "action_1",
    conversationId: "conv_1",
    type: "payment_followup",
    title: "Sarah promised to pay yesterday",
    subtitle: "Follow up on missed payment deadline",
    customerName: "Sarah Chen",
    priority: "high",
    accentColor: "#FF9500",
  },
  {
    id: "action_2",
    conversationId: "conv_2",
    type: "invoice_question",
    title: "Tom is questioning the diagnostic fee",
    subtitle: "Explain the $95 diagnostic charge",
    customerName: "Tom Rodriguez",
    priority: "medium",
    accentColor: "#007AFF",
  },
  {
    id: "action_3",
    conversationId: "conv_3",
    type: "invoice_question",
    title: "Mike is questioning the float charge",
    subtitle: "Explain the $450 leveling compound fee",
    customerName: "Mike Johnson",
    priority: "medium",
    accentColor: "#007AFF",
  },
  {
    id: "action_4",
    conversationId: "conv_4",
    type: "payment_plan",
    title: "David can't pay $5,800 at once",
    subtitle: "Offer a payment plan option",
    customerName: "David Kim",
    priority: "high",
    accentColor: "#0061FF",
  },
  {
    id: "action_5",
    conversationId: "conv_5",
    type: "invoice_summary",
    title: "Send Lisa an invoice summary",
    subtitle: "New invoice needs a friendly breakdown",
    customerName: "Lisa Park",
    priority: "low",
    accentColor: "#34C759",
  },
];

// ─── Exports ────────────────────────────────────────────────────────────────

export function getConversations() {
  return conversations.map(({ messages, ...rest }) => rest);
}

export function getConversation(id) {
  return conversations.find((c) => c.id === id) || null;
}

export function addMessage(conversationId, text, sender = "pro") {
  const conv = conversations.find((c) => c.id === conversationId);
  if (!conv) return null;

  const isFromCustomer = sender === "customer";

  const newMsg = {
    id: `msg_${conversationId.split("_")[1]}_${conv.messages.length + 1}`,
    text,
    timestamp: new Date().toISOString(),
    isFromCustomer,
    type: "text",
  };

  conv.messages.push(newMsg);
  conv.lastMessage = {
    text,
    timestamp: newMsg.timestamp,
    isFromCustomer,
  };

  // Mark as read only if the Pro responded
  if (!isFromCustomer) {
    conv.unreadCount = 0;
  }

  return newMsg;
}

export function addConversation(name) {
  const id = `conv_${Date.now()}`;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const newConv = {
    id,
    customer: { name, initials, phone: "" },
    invoice: null,
    messages: [],
    lastMessage: null,
    unreadCount: 0,
    hasAIAction: false,
    actionType: null,
  };
  conversations.push(newConv);
  return newConv;
}

export function getActions() {
  return actions;
}
