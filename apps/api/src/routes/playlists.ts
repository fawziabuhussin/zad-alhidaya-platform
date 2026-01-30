/**
 * Playlist Routes
 * HTTP layer - delegates to PlaylistManager for creating courses from YouTube playlists
 */
import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { playlistManager } from '../managers/playlist.manager';
import { createCourseFromPlaylistSchema } from '../schemas/playlist.schema';

const router = express.Router();

/**
 * POST /playlists/create-course - Create course from YouTube playlist
 */
router.post('/create-course', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createCourseFromPlaylistSchema.parse(req.body);

    const result = await playlistManager.createCourseFromPlaylist(
      { userId: req.user!.userId, role: req.user!.role },
      data
    );

    if (!result.success) {
      return res.status(result.error!.status).json({ message: result.error!.message });
    }

    res.status(201).json(result.data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    console.error('Failed to create course from playlist:', error);
    res.status(500).json({ message: error.message || 'Failed to create course from playlist' });
  }
});

export default router;
