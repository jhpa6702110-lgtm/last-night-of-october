-- Supabase 테이블 생성용 SQL 스크립트
-- Supabase Dashboard -> SQL Editor에 복사하여 실행(Run)해 주세요.

-- 1. 동문(친구) 테이블
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  birthday DATE,
  avatar_url TEXT,
  description TEXT,
  is_president BOOLEAN DEFAULT false,
  is_treasurer BOOLEAN DEFAULT false,
  points INT DEFAULT 0, -- 누적 참여 포인트
  last_visited_at DATE DEFAULT CURRENT_DATE, -- 마지막 방문 일자
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 갤러리(사진) 테이블
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  likes_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  author_id UUID,
  author_name TEXT DEFAULT '익명',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 갤러리 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES gallery(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_id UUID,
  author_name TEXT DEFAULT '익명',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 앨범 테이블
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 앨범 이미지 테이블
CREATE TABLE IF NOT EXISTS album_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 대문 배경 이미지 테이블
CREATE TABLE IF NOT EXISTS hero_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 소통 게시판 테이블
CREATE TABLE IF NOT EXISTS board (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_notice BOOLEAN DEFAULT false,
  author_id UUID REFERENCES alumni(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT '익명',
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. 게시판 댓글 및 대댓글 테이블
CREATE TABLE IF NOT EXISTS board_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES board(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES board_comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES alumni(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT '익명',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. 포인트 이력 로그 테이블
CREATE TABLE IF NOT EXISTS point_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID REFERENCES alumni(id) ON DELETE CASCADE,
  points INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
