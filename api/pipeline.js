// Vercel serverless function for message evaluation pipeline
import { evaluateMessage } from '../server/claude.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversation, message, proMemory, customerMemory, sender } = req.body;

  if (!conversation || !message) {
    return res.status(400).json({ error: 'conversation and message are required' });
  }

  try {
    const result = await evaluateMessage(conversation, message, proMemory || '', customerMemory || '', sender || 'customer');
    res.json(result);
  } catch (err) {
    console.error('Pipeline evaluation error:', err);
    // Return safe fallback — never crash
    res.json({
      shouldCreateAction: false,
      actionType: 'none',
      actionTitle: '',
      actionSubtitle: '',
      actionPriority: 'low',
      hasSufficientContext: false,
      customerMemoryUpdate: '',
      reasoning: 'Pipeline error — fallback response'
    });
  }
}
