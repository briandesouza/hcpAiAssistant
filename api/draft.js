// Vercel serverless function for AI draft generation
import { generateDraft } from '../server/claude.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversation, actionType, proMemory, customerMemory } = req.body;

  if (!conversation || !actionType) {
    return res.status(400).json({ error: 'conversation and actionType are required' });
  }

  // invoice_request actions never have drafts
  if (actionType === 'invoice_request') {
    return res.status(400).json({ error: 'no_draft_available', message: 'This action type does not support AI drafts' });
  }

  try {
    const draft = await generateDraft(
      conversation,
      actionType,
      proMemory || '',
      customerMemory || ''
    );

    if (!draft) {
      return res.status(400).json({ error: 'no_draft_available', message: 'Insufficient context to generate draft' });
    }

    res.json(draft);
  } catch (err) {
    console.error('Draft generation error:', err);
    res.status(500).json({ error: 'Draft generation failed' });
  }
}
