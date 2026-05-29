import { Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * GET /api/messages/:coupleId
 * Returns paginated chat history for a couple.
 */
export const getMessages = async (req: any, res: Response) => {
  const userId = req.userId;
  const { coupleId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  const before = req.query.before as string | undefined;

  if (!coupleId) {
    return res.status(400).json({ message: 'coupleId is required' });
  }

  // Verify user belongs to this couple
  const { data: membership } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .eq('couple_id', coupleId)
    .single();

  if (!membership) {
    return res.status(403).json({ message: 'Not authorised for this couple' });
  }

  let query = supabase
    .from('messages')
    .select('id, couple_id, sender_id, message, read, created_at')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error('getMessages error:', error);
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }

  // Mark messages as read
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('couple_id', coupleId)
    .neq('sender_id', userId)
    .eq('read', false);

  return res.json({
    messages: (messages ?? []).reverse(), // oldest first for display
  });
};

/**
 * POST /api/messages
 * Persists a new message to the database.
 * Body: { coupleId: string, message: string }
 */
export const createMessage = async (req: any, res: Response) => {
  const userId = req.userId;
  const { coupleId, message } = req.body;

  if (!coupleId || !message?.trim()) {
    return res.status(400).json({ message: 'coupleId and message are required' });
  }

  // Verify user belongs to this couple
  const { data: membership } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .eq('couple_id', coupleId)
    .single();

  if (!membership) {
    return res.status(403).json({ message: 'Not authorised for this couple' });
  }

  const { data: newMessage, error } = await supabase
    .from('messages')
    .insert({
      couple_id: coupleId,
      sender_id: userId,
      message: message.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('createMessage error:', error);
    return res.status(500).json({ message: 'Failed to save message' });
  }

  return res.status(201).json({ message: newMessage });
};
