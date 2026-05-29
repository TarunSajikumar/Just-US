import { Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * POST /api/invite/create
 * Generates a unique 6-char invite code for the authenticated user.
 * Response: { "success": true, "code": "AB12CD" }
 */
export const createInvite = async (req: any, res: Response) => {
  const userId: string = req.userId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Invalidate any previous pending invites from this user
    await supabase
      .from('invites')
      .update({ status: 'cancelled' })
      .eq('created_by', userId)
      .eq('status', 'pending');

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: invite, error } = await supabase
      .from('invites')
      .insert({
        code,
        created_by: userId,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (error) {
      console.error('createInvite error:', error);
      return res.status(500).json({ success: false, message: 'Error generating invite code' });
    }

    return res.json({ success: true, code: invite.code });
  } catch (err) {
    console.error('createInvite exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/invite/join
 * Body: { "inviteCode": "AB12CD" }
 * Validates the code, creates a couple, and links both users.
 */
export const joinInvite = async (req: any, res: Response) => {
  const userId: string = req.userId;
  const { inviteCode } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!inviteCode) return res.status(400).json({ message: 'inviteCode is required' });

  try {
    // 1. Find the pending invite
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('code', inviteCode.toUpperCase().trim())
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return res.status(404).json({ message: 'Invalid or expired invite code' });
    }

    if (invite.created_by === userId) {
      return res.status(400).json({ message: 'You cannot use your own invite code' });
    }

    const creatorId: string = invite.created_by;

    // 2. Create a new couple record
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({})
      .select()
      .single();

    if (coupleError || !couple) {
      console.error('couple creation error:', coupleError);
      return res.status(500).json({ message: 'Failed to create couple record' });
    }

    const coupleId = couple.id;

    // 3. Mark invite as used
    await supabase
      .from('invites')
      .update({ status: 'used', used_by: userId })
      .eq('id', invite.id);

    // 4. Update both users: set couple_id + relationship_status + partner_id
    const [r1, r2] = await Promise.all([
      supabase
        .from('users')
        .update({
          couple_id: coupleId,
          partner_id: creatorId,
          relationship_status: 'couple',
        })
        .eq('id', userId),
      supabase
        .from('users')
        .update({
          couple_id: coupleId,
          partner_id: userId,
          relationship_status: 'couple',
        })
        .eq('id', creatorId),
    ]);

    if (r1.error || r2.error) {
      console.error('user link errors:', r1.error, r2.error);
      return res.status(500).json({ message: 'Failed to link partners' });
    }

    return res.json({
      success: true,
      message: 'Successfully connected with your partner! 💑',
      coupleId
    });
  } catch (err) {
    console.error('joinInvite exception:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
