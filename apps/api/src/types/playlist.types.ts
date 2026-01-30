/**
 * Playlist-specific types and DTOs
 */

/**
 * DTO for creating a course from a YouTube playlist
 */
export interface CreateCourseFromPlaylistDTO {
  playlistUrl: string;
  courseTitle: string;
  courseDescription?: string;
  categoryId: string;
  coverImage?: string;
  price?: number;
  status?: string;
  teacherId?: string; // Only for admins
}

/**
 * Video information extracted from playlist
 */
export interface PlaylistVideo {
  videoId: string;
  title: string;
}

/**
 * Response for course creation from playlist
 */
export interface CourseFromPlaylistResponse {
  course: any; // Full course with relations
  module: any;
  lessons?: any[];
  lesson?: any; // Fallback single lesson
  videosCount: number;
  message: string;
}
