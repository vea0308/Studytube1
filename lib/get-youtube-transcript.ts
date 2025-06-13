import TranscriptAPI from 'youtube-transcript-api';

type TranscriptCacheEntry = {
  data: any[];
  expiry: number;
};

const transcriptCache: Record<string, TranscriptCacheEntry> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getYoutubeTranscript(videoId: string): Promise<any[]> {
  const now = Date.now();
  const cached = transcriptCache[videoId];

  if (cached && cached.expiry > now) {
    console.log(`✅ Cache hit for videoId=${videoId}`);
    return cached.data;
  }

  try {
    const transcript = await TranscriptAPI.getTranscript(videoId);
    transcriptCache[videoId] = {
      data: transcript,
      expiry: now + CACHE_TTL_MS,
    };
    console.log(`📥 Cache miss - fetched transcript for videoId=${videoId}`);
    return transcript;
  } catch (error) {
    console.error(`❌ Failed to fetch transcript for videoId=${videoId}:`, error);
    throw error;
  }
}
