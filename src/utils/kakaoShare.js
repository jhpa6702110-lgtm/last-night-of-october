/**
 * KakaoTalk Link Share Helper
 * Uses Kakao JavaScript SDK loaded in index.html
 */

// Fallback public demo app key (free tier Kakao developers app key)
// Users can customize this in LocalStorage or via Admin UI
const DEFAULT_KAKAO_JS_KEY = 'b015b672a9e3dcf68a62f483c6d123db';

export const getKakaoKey = () => {
  return localStorage.getItem('kakao_js_key') || DEFAULT_KAKAO_JS_KEY;
};

export const saveKakaoKey = (key) => {
  localStorage.setItem('kakao_js_key', key.trim());
  // Force re-initialization on next use
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
        console.log('Kakao SDK initialized successfully with key.');
      }
    }
    return window.Kakao.isInitialized();
  } catch (err) {
    console.error('Error initializing Kakao SDK:', err);
    return false;
  }
};

/**
 * Share a Board post to KakaoTalk
 * @param {object} post - The post object containing title, content, id
 */
export const shareBoardToKakao = (post) => {
  if (!initKakao()) {
    alert('카카오톡 공유 기능을 준비하는 데 실패했습니다. 잠시 후 다시 시도해 주세요.');
    return;
  }

  const shareUrl = `${window.location.origin}/?tab=board&postId=${post.id}`;
  const cleanContent = post.content
    ? post.content.replace(/<[^>]*>?/gm, '').slice(0, 100) + '...'
    : '상세 내용을 홈페이지에서 확인해 보세요!';

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: post.title || '시월의 마지막 밤 소식',
      description: cleanContent,
      imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=400', // Default starry night logo image
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
};

/**
 * Share a Gallery / Album image to KakaoTalk
 * @param {object} imageObj - Contains title, description, image_url, id
 * @param {string} type - 'gallery' or 'album'
 */
export const shareImageToKakao = (imageObj, type = 'gallery') => {
  if (!initKakao()) {
    alert('카카오톡 공유 기능을 준비하는 데 실패했습니다. 잠시 후 다시 시도해 주세요.');
    return;
  }

  const shareUrl = `${window.location.origin}/?tab=${type}&imageId=${imageObj.id}`;
  const imageUrl = imageObj.image_url || 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=400';
  const cleanContent = imageObj.description || '시월의 마지막 밤에서 멋진 추억 사진이 공유되었습니다!';

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: imageObj.title || '새로운 추억 사진 📸',
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
};
