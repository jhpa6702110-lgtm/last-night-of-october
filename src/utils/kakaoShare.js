/**
 * KakaoTalk & Web Share API Utility
 * Allows sharing alumni profiles, album photos, radio stories, and hall of fame cards.
 */

// Initialize Kakao SDK if key is provided (place your JavaScript key here)
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || '';

export const initKakaoSDK = () => {
  if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized() && KAKAO_JS_KEY) {
    window.Kakao.init(KAKAO_JS_KEY);
    console.log('[KakaoShare] Kakao SDK initialized');
  }
};

/**
 * Share item via KakaoTalk if available, otherwise Web Share API or Clipboard Copy
 * @param {Object} options - { title, text, url, imageUrl }
 */
export const shareContent = async ({ title, text, url, imageUrl }) => {
  const targetUrl = url || window.location.href;
  const shareTitle = title || '10월의 마지막 밤';
  const shareText = text || '학창 시절 추억과 노래가 있는 동창회 커뮤니티';

  // 1. Try KakaoTalk Share if Kakao SDK is loaded & initialized
  if (typeof window !== 'undefined' && window.Kakao && window.Kakao.isInitialized()) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: shareText,
          imageUrl: imageUrl || 'https://last-night-of-october.vercel.app/favicon.svg',
          link: {
            mobileWebUrl: targetUrl,
            webUrl: targetUrl,
          },
        },
        buttons: [
          {
            title: '10월의 마지막 밤 보러가기',
            link: {
              mobileWebUrl: targetUrl,
              webUrl: targetUrl,
            },
          },
        ],
      });
      return { success: true, method: 'kakao' };
    } catch (err) {
      console.warn('[KakaoShare] Kakao SDK share error:', err);
    }
  }

  // 2. Try Native Web Share API (Mobile Safari, Chrome for Android)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: targetUrl,
      });
      return { success: true, method: 'webshare' };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('[KakaoShare] Web Share API error:', err);
      }
    }
  }

  // 3. Fallback: Copy link to clipboard
  try {
    await navigator.clipboard.writeText(targetUrl);
    alert('✨ 링크가 클립보드에 복사되었습니다! 카카오톡이나 SNS에 붙여넣어 공유해 보세요.');
    return { success: true, method: 'clipboard' };
  } catch (err) {
    console.error('[KakaoShare] Copy error:', err);
    alert('링크: ' + targetUrl);
    return { success: false, error: err };
  }
};
