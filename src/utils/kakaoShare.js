/**
 * KakaoTalk Link Share Helper with Native Web Share Fallbacks
 */

const DEFAULT_KAKAO_JS_KEY = 'b015b672a9e3dcf68a62f483c6d123db';

export const getKakaoKey = () => {
  return localStorage.getItem('kakao_js_key') || DEFAULT_KAKAO_JS_KEY;
};

export const saveKakaoKey = (key) => {
  localStorage.setItem('kakao_js_key', key.trim());
};

export const initKakao = () => {
  if (typeof window === 'undefined' || !window.Kakao) {
    console.warn('Kakao SDK not loaded yet.');
    return false;
  }

  try {
    if (!window.Kakao.isInitialized()) {
      const key = getKakaoKey();
      if (key) {
        window.Kakao.init(key);
        console.log('Kakao SDK initialized with key.');
      }
    }
    return window.Kakao.isInitialized();
  } catch (err) {
    console.error('Error initializing Kakao SDK:', err);
    return false;
  }
};

/**
 * Share a Board post
 */
export const shareBoardToKakao = async (post) => {
  const shareUrl = `${window.location.origin}/?tab=board&postId=${post.id}`;
  const shareTitle = post.title || '시월의 마지막 밤 소식';
  const cleanContent = post.content
    ? post.content.replace(/<[^>]*>?/gm, '').slice(0, 100) + '...'
    : '상세 내용을 홈페이지에서 확인해 보세요!';

  // 1. Try browser native Web Share API (100% success on mobile Chrome/Safari, bypasses API keys)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: `${shareTitle}\n\n${cleanContent}`,
        url: shareUrl
      });
      console.log('Shared via Web Share API successfully');
      return; // Stop execution on success
    } catch (err) {
      // User cancelled or share failed, fallback silently to Kakao SDK
      console.log('Web Share API failed or cancelled, falling back to Kakao Link:', err);
      if (err.name === 'AbortError') return; // User cancelled, don't trigger fallback alert
    }
  }

  // 2. Kakao SDK Fallboard
  if (initKakao()) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: cleanContent,
          imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=400',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '글 보러가기 🔍',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
      return;
    } catch (sdkErr) {
      console.error('Kakao SDK share failed:', sdkErr);
    }
  }

  // 3. Last Fallback: Kakao Web Sharer URL (Desktop browser backup)
  const fallbackUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=${getKakaoKey()}&short_url=false&url=${encodeURIComponent(shareUrl)}`;
  window.open(fallbackUrl, '_blank');
};

/**
 * Share a Gallery or Album image
 */
export const shareImageToKakao = async (imageObj, type = 'gallery') => {
  const shareUrl = `${window.location.origin}/?tab=${type}&imageId=${imageObj.id}`;
  const shareTitle = imageObj.title || '새로운 추억 사진 📸';
  const imageUrl = imageObj.image_url || 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=400';
  const cleanContent = imageObj.description || '시월의 마지막 밤에서 멋진 추억 사진이 공유되었습니다!';

  // 1. Try browser native Web Share API (Mobile native dialog)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: `${shareTitle}\n\n${cleanContent}`,
        url: shareUrl
      });
      console.log('Shared image via Web Share API successfully');
      return;
    } catch (err) {
      console.log('Web Share API failed or cancelled:', err);
      if (err.name === 'AbortError') return;
    }
  }

  // 2. Kakao SDK share
  if (initKakao()) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: cleanContent.slice(0, 100),
          imageUrl: imageUrl,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '사진 크게보기 📸',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
      return;
    } catch (sdkErr) {
      console.error('Kakao SDK share failed:', sdkErr);
    }
  }

  // 3. Last Fallback: Kakao Web Sharer URL
  const fallbackUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=${getKakaoKey()}&short_url=false&url=${encodeURIComponent(shareUrl)}`;
  window.open(fallbackUrl, '_blank');
};
