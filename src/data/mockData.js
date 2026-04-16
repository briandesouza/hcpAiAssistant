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

// ─── Conversation 1: Mike Johnson — LVP Installation (invoice_question) ────

const conv1 = {
  id: "conv_1",
  customer: { name: "Mike Johnson", initials: "MJ", phone: "(239) 555-1234" },
  invoice: {
    id: "inv_1001",
    number: "1001",
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
    { id: "msg_1_1", text: "Hi Sandro, I'm looking to get luxury vinyl plank installed in my living room and kitchen. Can you give me a quote?", timestamp: ts(-14 * DAY), isFromCustomer: true, type: "text" },
    { id: "msg_1_2", text: "Hey Mike! I'd be happy to help. I can come by this week to measure and check the subfloor. How's Wednesday afternoon?", timestamp: ts(-14 * DAY + 2 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_1_3", text: "Wednesday works. See you then.", timestamp: ts(-14 * DAY + 3 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_1_4", text: "Thanks for showing me the space today Mike. Living room + kitchen comes out to about 480 sq ft. The subfloor has a few low spots that'll need leveling before we can lay the planks. I've put together a quote for $3,200 covering material, floor prep, and labor. Sending it over now.", timestamp: ts(-12 * DAY), isFromCustomer: false, type: "text" },
    { id: "msg_1_5", text: "Looks good, let's do it. When can you start?", timestamp: ts(-12 * DAY + 4 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_1_6", text: "I can start next Monday. Should take about 2 days with the leveling. Fabiana will be there too so we'll knock it out. I'll confirm the morning of.", timestamp: ts(-12 * DAY + 5 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_1_7", text: "Floors are done! Everything came out great. Give it 24 hours before moving heavy furniture back. I'll send the invoice over.", timestamp: ts(-3 * DAY), isFromCustomer: false, type: "text" },
    { id: "msg_1_8", text: "They look amazing, thank you!", timestamp: ts(-3 * DAY + 1 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_1_9", text: "Invoice #1001 for $3,200.00 has been sent.", timestamp: ts(-1 * DAY), isFromCustomer: false, type: "invoice" },
    { id: "msg_1_10", text: "What's the float charge for? $450 seems like a lot for something I didn't ask for.", timestamp: ts(-2 * HOUR), isFromCustomer: true, type: "text" },
  ],
  lastMessage: { text: "What's the float charge for? $450 seems like a lot for something I didn't ask for.", timestamp: ts(-2 * HOUR), isFromCustomer: true },
  unreadCount: 1,
  hasAIAction: true,
  actionType: "invoice_question",
};

// ─── Conversation 2: Patricia Almeida — Hardwood Refinishing (invoice_summary) ─

const conv2 = {
  id: "conv_2",
  customer: { name: "Patricia Almeida", initials: "PA", phone: "(239) 555-2345" },
  invoice: {
    id: "inv_1002",
    number: "1002",
    total: 2800,
    status: "sent",
    dueDate: datestamp(14 * DAY),
    sentDate: datestamp(-1 * HOUR),
    lineItems: [
      { description: "Hardwood sanding & prep", amount: 600 },
      { description: "Stain application (Provincial)", amount: 450 },
      { description: "Polyurethane finish (3 coats)", amount: 550 },
      { description: "Labor", amount: 1200 },
    ],
  },
  messages: [
    { id: "msg_2_1", text: "Hi Sandro, my hardwood floors in the master bedroom and hallway are looking pretty worn. Do you do refinishing?", timestamp: ts(-12 * DAY), isFromCustomer: true, type: "text" },
    { id: "msg_2_2", text: "Hey Patricia! Yes we do. I can come take a look and see what shape they're in. How about Thursday morning?", timestamp: ts(-12 * DAY + 1 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_2_3", text: "Thursday morning works great.", timestamp: ts(-12 * DAY + 2 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_2_4", text: "Good news — your floors are solid oak and in great shape underneath the wear. Just need a full sand-down, stain, and 3 coats of poly. I'd recommend Provincial stain, it'll bring out the natural grain. Quote comes to $2,800 for everything.", timestamp: ts(-10 * DAY), isFromCustomer: false, type: "text" },
    { id: "msg_2_5", text: "Provincial sounds perfect. Let's go with that!", timestamp: ts(-10 * DAY + 3 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_2_6", text: "Great! I can start Monday. It'll take about 3 days — sanding, stain, then the poly coats need to dry between applications. You'll want to keep off the floors for 24 hours after the last coat.", timestamp: ts(-10 * DAY + 4 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_2_7", text: "All done Patricia! The floors turned out beautiful. The Provincial stain really brought out the grain. Remember, no shoes on them for 48 hours and avoid rugs for a week while the finish fully cures.", timestamp: ts(-3 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_2_8", text: "They look beautiful! I can't believe these are the same floors.", timestamp: ts(-2.5 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_2_9", text: "Invoice #1002 for $2,800.00 has been sent.", timestamp: ts(-1 * HOUR), isFromCustomer: false, type: "invoice" },
    { id: "msg_2_10", text: "Got it, I'll take a look!", timestamp: ts(-0.5 * HOUR), isFromCustomer: true, type: "text" },
  ],
  lastMessage: { text: "Got it, I'll take a look!", timestamp: ts(-0.5 * HOUR), isFromCustomer: true },
  unreadCount: 0,
  hasAIAction: true,
  actionType: "invoice_summary",
};

// ─── Conversation 3: Carlos Rivera — Tile Installation (no action, scheduling) ─

const conv3 = {
  id: "conv_3",
  customer: { name: "Carlos Rivera", initials: "CR", phone: "(239) 555-3456" },
  invoice: null,
  messages: [
    { id: "msg_3_1", text: "Hey Sandro, I need tile installed in my bathroom. It's about 60 sq ft. Can you do it?", timestamp: ts(-3 * DAY), isFromCustomer: true, type: "text" },
    { id: "msg_3_2", text: "Hey Carlos! Absolutely. What kind of tile are you thinking? I can come out and measure up. How's Tuesday work for you?", timestamp: ts(-3 * DAY + 1 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_3_3", text: "I'm thinking a 12x24 porcelain in a light gray. Tuesday works.", timestamp: ts(-3 * DAY + 2 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_3_4", text: "Great choice, that'll look sharp. I'll swing by Tuesday morning to measure and we can go over the layout. What time works best?", timestamp: ts(-3 * DAY + 3 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_3_5", text: "Tuesday at 9am works, see you then!", timestamp: ts(-3 * DAY + 4 * HOUR), isFromCustomer: true, type: "text" },
  ],
  lastMessage: { text: "Tuesday at 9am works, see you then!", timestamp: ts(-3 * DAY + 4 * HOUR), isFromCustomer: true },
  unreadCount: 0,
  hasAIAction: false,
  actionType: null,
};

// ─── Conversation 4: Emily Watson — Carpet Removal + LVP (no action, paid) ────

const conv4 = {
  id: "conv_4",
  customer: { name: "Emily Watson", initials: "EW", phone: "(239) 555-4567" },
  invoice: {
    id: "inv_1004",
    number: "1004",
    total: 1850,
    status: "paid",
    dueDate: datestamp(-5 * DAY),
    sentDate: datestamp(-10 * DAY),
    paidDate: datestamp(-7 * DAY),
    lineItems: [
      { description: "Carpet removal & disposal", amount: 250 },
      { description: "LVP material", amount: 650 },
      { description: "Installation labor", amount: 950 },
    ],
  },
  messages: [
    { id: "msg_4_1", text: "Hi Sandro, I have old carpet in my guest bedroom that I'd like to rip out and replace with LVP. Is that something you can do?", timestamp: ts(-18 * DAY), isFromCustomer: true, type: "text" },
    { id: "msg_4_2", text: "Hey Emily! Yep, we do carpet removal and LVP all the time. I can come measure and give you a quote. How's this week?", timestamp: ts(-18 * DAY + 1 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_4_3", text: "How about Wednesday?", timestamp: ts(-18 * DAY + 2 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_4_4", text: "Perfect. Came out to about 180 sq ft. I can do carpet removal, disposal, and LVP install for $1,850. That includes material and labor.", timestamp: ts(-16 * DAY), isFromCustomer: false, type: "text" },
    { id: "msg_4_5", text: "Sounds great, let's do it!", timestamp: ts(-16 * DAY + 3 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_4_6", text: "All done Emily! Carpet's gone and the new LVP is in. Room looks completely different. I'll send the invoice over.", timestamp: ts(-10 * DAY + 4 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_4_7", text: "Invoice #1004 for $1,850.00 has been sent.", timestamp: ts(-10 * DAY), isFromCustomer: false, type: "invoice" },
    { id: "msg_4_8", text: "Paid! Thanks Sandro, floors look great.", timestamp: ts(-7 * DAY), isFromCustomer: true, type: "text" },
  ],
  lastMessage: { text: "Paid! Thanks Sandro, floors look great.", timestamp: ts(-7 * DAY), isFromCustomer: true },
  unreadCount: 0,
  hasAIAction: false,
  actionType: null,
};

// ─── Conversation 5: James Cooper — Transition Strips (no action, paid) ────────

const conv5 = {
  id: "conv_5",
  customer: { name: "James Cooper", initials: "JC", phone: "(239) 555-5678" },
  invoice: {
    id: "inv_1005",
    number: "1005",
    total: 280,
    status: "paid",
    dueDate: datestamp(-10 * DAY),
    sentDate: datestamp(-14 * DAY),
    paidDate: datestamp(-12 * DAY),
    lineItems: [
      { description: "Transition strips x6", amount: 120 },
      { description: "Installation labor", amount: 160 },
    ],
  },
  messages: [
    { id: "msg_5_1", text: "Hey Sandro, I need transition strips installed between my rooms — 3 doorways where the flooring changes. Can you handle that?", timestamp: ts(-16 * DAY), isFromCustomer: true, type: "text" },
    { id: "msg_5_2", text: "Hey James! Yeah that's a quick job. I can come by Friday. 6 strips should cover 3 doorways (top and bottom). $280 total including install.", timestamp: ts(-16 * DAY + 1 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_5_3", text: "Friday works. Thanks!", timestamp: ts(-16 * DAY + 2 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_5_4", text: "All done! Transitions are in and looking clean. Sending the invoice now.", timestamp: ts(-14 * DAY + 3 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_5_5", text: "Invoice #1005 for $280.00 has been sent.", timestamp: ts(-14 * DAY), isFromCustomer: false, type: "invoice" },
    { id: "msg_5_6", text: "Paid. Thanks again, the transitions look really clean.", timestamp: ts(-12 * DAY), isFromCustomer: true, type: "text" },
  ],
  lastMessage: { text: "Paid. Thanks again, the transitions look really clean.", timestamp: ts(-12 * DAY), isFromCustomer: true },
  unreadCount: 0,
  hasAIAction: false,
  actionType: null,
};

// ─── Conversation 6: Maria Santos — Herringbone LVP Estimate (no action) ──────

const conv6 = {
  id: "conv_6",
  customer: { name: "Maria Santos", initials: "MS", phone: "(239) 555-6789" },
  invoice: null,
  messages: [
    { id: "msg_6_1", text: "Hi Sandro, I just bought a condo and I'm looking at herringbone LVP for the main living areas. Do you install that pattern?", timestamp: ts(-2 * DAY), isFromCustomer: true, type: "text" },
    { id: "msg_6_2", text: "Hey Maria! Yes we do herringbone. It's one of my favorite patterns. I'd need to come out and measure to give you an accurate quote — it takes a bit more material and labor than a standard layout. I offer free in-home estimates, when works for you?", timestamp: ts(-2 * DAY + 1 * HOUR), isFromCustomer: false, type: "text" },
    { id: "msg_6_3", text: "Sounds good, Friday morning works for the estimate.", timestamp: ts(-2 * DAY + 2 * HOUR), isFromCustomer: true, type: "text" },
    { id: "msg_6_4", text: "Perfect, I'll see you Friday morning. Looking forward to seeing the space!", timestamp: ts(-2 * DAY + 3 * HOUR), isFromCustomer: false, type: "text" },
  ],
  lastMessage: { text: "Sounds good, Friday morning works for the estimate.", timestamp: ts(-2 * DAY + 2 * HOUR), isFromCustomer: true },
  unreadCount: 0,
  hasAIAction: false,
  actionType: null,
};

// ─── Exports ────────────────────────────────────────────────────────────────

export const initialConversations = [conv1, conv2, conv3, conv4, conv5, conv6];
