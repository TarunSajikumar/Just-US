import { Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * GET /api/memories/:coupleId
 * Returns all memories for a couple, newest first.
 */
export const getMemories = async (req: any, res: Response) => {
  const userId = req.userId;
  const { coupleId } = req.params;

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

  const { data: memories, error } = await supabase
    .from('memories')
    .select('id, couple_id, image_url, caption, created_at')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getMemories error:', error);
    return res.status(500).json({ message: 'Failed to fetch memories' });
  }

  return res.json({ memories: memories ?? [] });
};

/**
 * POST /api/memories
 * Body: { coupleId, imageBase64, mimeType, caption }
 * Uploads image to Supabase Storage, inserts a DB row.
 */
export const createMemory = async (req: any, res: Response) => {
  const userId = req.userId;
  const { coupleId, imageBase64, mimeType, caption } = req.body;

  if (!coupleId || !imageBase64 || !mimeType) {
    return res.status(400).json({ message: 'coupleId, imageBase64 and mimeType are required' });
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

  // Convert base64 to buffer and upload to Supabase Storage
  const buffer = Buffer.from(imageBase64, 'base64');
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = `${coupleId}/${Date.now()}_${userId}.${ext}`;

  const { error: uploadError } = await supabase
    .storage
    .from('memories')
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return res.status(500).json({ message: 'Failed to upload image' });
  }

  // Get public URL
  const { data: urlData } = supabase
    .storage
    .from('memories')
    .getPublicUrl(fileName);

  const imageUrl = urlData.publicUrl;

  // Insert memory row into DB
  const { data: memory, error: dbError } = await supabase
    .from('memories')
    .insert({
      couple_id: coupleId,
      image_url: imageUrl,
      caption: caption?.trim() || null,
    })
    .select()
    .single();

  if (dbError) {
    console.error('createMemory DB error:', dbError);
    return res.status(500).json({ message: 'Failed to save memory record' });
  }

  return res.status(201).json({ memory });
};
