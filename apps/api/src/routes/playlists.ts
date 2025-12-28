import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import axios from 'axios';

const router = express.Router();

// Helper function to extract video IDs from playlist page HTML
async function fetchPlaylistVideos(playlistId: string): Promise<Array<{ videoId: string; title: string }>> {
  const videos: Array<{ videoId: string; title: string }> = [];
  
  // Method 1: Try YouTube RSS Feed first (most reliable)
  try {
    console.log(`Trying RSS feed for playlist: ${playlistId}`);
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
    const rssResponse = await axios.get(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/xml, text/xml, */*',
      },
      timeout: 15000,
    });
    
    const rssXml = rssResponse.data;
    
    // Extract entries from RSS feed
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const entries: string[] = [];
    let entryMatch;
    
    while ((entryMatch = entryRegex.exec(rssXml)) !== null) {
      entries.push(entryMatch[1]);
    }
    
    // Extract video ID and title from each entry
    entries.forEach((entry) => {
      // Extract video ID
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      if (!videoIdMatch || !videoIdMatch[1]) return;
      
      const videoId = videoIdMatch[1].trim();
      if (videoId.length !== 11) return;
      
      // Extract title - try multiple formats
      let title = '';
      
      // Try CDATA format: <title><![CDATA[Title]]></title>
      const cdataMatch = entry.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/);
      if (cdataMatch && cdataMatch[1]) {
        title = cdataMatch[1].trim();
      } else {
        // Try regular format: <title>Title</title>
        const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
        }
      }
      
      // Filter out playlist/channel titles
      if (title && !title.toLowerCase().includes('youtube') && 
          !title.toLowerCase().includes('playlist') &&
          !title.toLowerCase().includes('channel')) {
        videos.push({
          videoId,
          title: title || `درس ${videos.length + 1}`,
        });
      } else if (videoId) {
        // Add video even without title
        videos.push({
          videoId,
          title: `درس ${videos.length + 1}`,
        });
      }
    });
    
    if (videos.length > 0) {
      console.log(`Successfully extracted ${videos.length} videos from RSS feed`);
      return videos;
    }
  } catch (rssError: any) {
    console.error('RSS feed method failed:', rssError.message);
  }

  // Method 2: Try scraping the playlist page HTML
  try {
    console.log(`Trying HTML scraping for playlist: ${playlistId}`);
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    const response = await axios.get(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      timeout: 15000,
    });

    const html = response.data;

    // Method 1: Extract from ytInitialData JSON (most reliable)
    // Try multiple patterns for ytInitialData
    const ytInitialDataPatterns = [
      /var ytInitialData = ({.+?});/s,
      /window\["ytInitialData"\] = ({.+?});/s,
      /ytInitialData\s*=\s*({.+?});/s,
    ];
    
    for (const pattern of ytInitialDataPatterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          
          // Navigate through the nested structure to find playlist videos
          const findVideos = (obj: any, depth = 0): void => {
            if (depth > 15) return; // Prevent infinite recursion
            
            if (Array.isArray(obj)) {
              obj.forEach(item => findVideos(item, depth + 1));
            } else if (obj && typeof obj === 'object') {
              // Check if this is a playlist video renderer
              if (obj.playlistVideoRenderer) {
                const video = obj.playlistVideoRenderer;
                const videoId = video?.videoId;
                const title = video?.title?.runs?.[0]?.text || 
                            video?.title?.simpleText || 
                            video?.title?.accessibility?.accessibilityData?.label ||
                            `فيديو ${videos.length + 1}`;
                if (videoId && !videos.find(v => v.videoId === videoId)) {
                  videos.push({ videoId, title });
                }
              }
              
              // Also check for videoRenderer (alternative structure)
              if (obj.videoRenderer) {
                const video = obj.videoRenderer;
                const videoId = video?.videoId;
                const title = video?.title?.runs?.[0]?.text || 
                            video?.title?.simpleText || 
                            `فيديو ${videos.length + 1}`;
                if (videoId && !videos.find(v => v.videoId === videoId)) {
                  videos.push({ videoId, title });
                }
              }
              
              // Check for playlistPanelVideoRenderer
              if (obj.playlistPanelVideoRenderer) {
                const video = obj.playlistPanelVideoRenderer;
                const videoId = video?.videoId;
                const title = video?.title?.runs?.[0]?.text || 
                            video?.title?.simpleText || 
                            `فيديو ${videos.length + 1}`;
                if (videoId && !videos.find(v => v.videoId === videoId)) {
                  videos.push({ videoId, title });
                }
              }
              
              // Recursively search in all object properties
              Object.values(obj).forEach(value => findVideos(value, depth + 1));
            }
          };
          
          findVideos(data);
          
          if (videos.length > 0) break; // Found videos, stop trying other patterns
        } catch (e) {
          console.error('Failed to parse YouTube data:', e);
          continue; // Try next pattern
        }
      }
    }

    // Method 2: Extract from ytInitialPlayerResponse (alternative)
    if (videos.length === 0) {
      const ytPlayerPatterns = [
        /var ytInitialPlayerResponse = ({.+?});/s,
        /window\["ytInitialPlayerResponse"\] = ({.+?});/s,
        /ytInitialPlayerResponse\s*=\s*({.+?});/s,
      ];
      
      for (const pattern of ytPlayerPatterns) {
        const match = html.match(pattern);
        if (match) {
          try {
            const playerData = JSON.parse(match[1]);
            const playlistData = playerData?.playlistPanel?.playlistPanelRenderer?.contents;
            if (Array.isArray(playlistData)) {
              playlistData.forEach((item: any) => {
                const video = item?.playlistPanelVideoRenderer;
                if (video?.videoId) {
                  const title = video?.title?.runs?.[0]?.text || 
                              video?.title?.simpleText || 
                              `فيديو ${videos.length + 1}`;
                  if (!videos.find(v => v.videoId === video.videoId)) {
                    videos.push({ videoId: video.videoId, title });
                  }
                }
              });
            }
            if (videos.length > 0) break;
          } catch (e) {
            console.error('Failed to parse YouTube player data:', e);
            continue;
          }
        }
      }
    }

    // Method 3: Extract from watch URLs in the HTML (fallback)
    if (videos.length === 0) {
      // Look for video IDs in various formats
      const patterns = [
        /watch\?v=([a-zA-Z0-9_-]{11})/g,
        /\/v\/([a-zA-Z0-9_-]{11})/g,
        /embed\/([a-zA-Z0-9_-]{11})/g,
        /"videoId":"([a-zA-Z0-9_-]{11})"/g,
        /"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g,
        /videoId=([a-zA-Z0-9_-]{11})/g,
      ];
      
      const seenIds = new Set<string>();
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const videoId = match[1];
          if (!seenIds.has(videoId) && videoId.length === 11) {
            seenIds.add(videoId);
            videos.push({ videoId, title: `فيديو ${videos.length + 1}` });
          }
        }
      });
    }
    
    // Method 4: Try alternative RSS format
    if (videos.length === 0) {
      try {
        const rssUrl2 = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
        const rssResponse2 = await axios.get(rssUrl2, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/xml, text/xml, */*',
          },
          timeout: 10000,
        });
        
        const rssXml2 = rssResponse2.data;
        const entries = rssXml2.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        
        entries.forEach((entry: string) => {
          const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
          const titleMatch = entry.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/) || 
                           entry.match(/<title>([^<]+)<\/title>/);
          
          if (videoIdMatch && videoIdMatch[1]) {
            const videoId = videoIdMatch[1];
            const title = titleMatch ? titleMatch[1].trim() : `فيديو ${videos.length + 1}`;
            if (!videos.find(v => v.videoId === videoId)) {
              videos.push({ videoId, title });
            }
          }
        });
      } catch (e) {
        console.error('Failed to fetch from RSS (method 4):', e);
      }
    }

    // Remove duplicates
    const uniqueVideos = videos.filter((video, index, self) =>
      index === self.findIndex(v => v.videoId === video.videoId)
    );

    console.log(`Found ${uniqueVideos.length} videos in playlist ${playlistId}`);
    return uniqueVideos;
  } catch (htmlError: any) {
    console.error('HTML scraping method failed:', htmlError.message);
  }

  // If all methods failed, return empty array
  console.error(`All methods failed to extract videos from playlist ${playlistId}`);
  return [];
}

// Create course from YouTube playlist
router.post('/create-course', authenticate, authorize('TEACHER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { playlistUrl, courseTitle, courseDescription, categoryId, coverImage, price, status } = req.body;

    if (!playlistUrl || !courseTitle || !categoryId) {
      return res.status(400).json({ message: 'playlistUrl, courseTitle, and categoryId are required' });
    }

    // Extract playlist ID - support multiple URL formats
    let playlistId: string | null = null;
    
    // Try different patterns
    const patterns = [
      /[?&]list=([^#&?]*)/,  // Standard: ?list=... or &list=...
      /\/playlist\?list=([^#&?]*)/,  // /playlist?list=...
      /list=([^#&?]*)/,  // Just list=...
    ];
    
    for (const pattern of patterns) {
      const match = playlistUrl.match(pattern);
      if (match && match[1]) {
        playlistId = match[1];
        break;
      }
    }
    
    if (!playlistId) {
      return res.status(400).json({ message: 'Invalid playlist URL. Please provide a valid YouTube playlist URL.' });
    }

    const teacherId = req.user!.role === 'ADMIN' && req.body.teacherId
      ? req.body.teacherId
      : req.user!.userId;

    // Create course
    const course = await prisma.course.create({
      data: {
        title: courseTitle,
        description: courseDescription || `دورة من قائمة تشغيل YouTube`,
        categoryId,
        teacherId,
        coverImage: coverImage || undefined,
        price: price || 0,
        status: status || 'DRAFT',
      },
      include: {
        category: true,
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create module
    const module = await prisma.module.create({
      data: {
        courseId: course.id,
        title: 'المحاضرات',
        order: 1,
      },
    });

    // Fetch playlist videos
    console.log(`Fetching videos for playlist: ${playlistId}`);
    const videos = await fetchPlaylistVideos(playlistId);
    console.log(`Found ${videos.length} videos in playlist`);
    
    if (videos.length > 0) {
      // Create a lesson for each video
      console.log(`Creating ${videos.length} lessons...`);
      const lessons = await Promise.all(
        videos.map((video, index) =>
          prisma.lesson.create({
            data: {
              moduleId: module.id,
              title: video.title || `درس ${index + 1}`,
              type: 'VIDEO',
              youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
              order: index + 1,
            },
          })
        )
      );

      console.log(`Successfully created ${lessons.length} lessons`);

      res.status(201).json({
        course,
        module,
        lessons,
        videosCount: videos.length,
        message: `تم إنشاء الدورة بنجاح مع ${lessons.length} درس من قائمة التشغيل`,
      });
    } else {
      console.log('No videos found, creating fallback playlist lesson');
      // Fallback: create a single lesson with the playlist
      const lesson = await prisma.lesson.create({
        data: {
          moduleId: module.id,
          title: courseTitle,
          type: 'PLAYLIST',
          youtubeUrl: playlistUrl,
          youtubePlaylistId: playlistId,
          order: 1,
        },
      });

      res.status(201).json({
        course,
        module,
        lesson,
        videosCount: 0,
        message: 'تم إنشاء الدورة من قائمة التشغيل. لم يتم استخراج الفيديوهات الفردية. سيتم استخدام قائمة التشغيل المدمجة.',
      });
    }
  } catch (error: any) {
    console.error('Failed to create course from playlist:', error);
    res.status(500).json({ message: error.message || 'Failed to create course from playlist' });
  }
});

export default router;
