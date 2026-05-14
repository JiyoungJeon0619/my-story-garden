-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  kakao_id TEXT UNIQUE,
  nickname TEXT,
  avatar_url TEXT,
  birth_decade TEXT,           -- '1950s', '1960s' 등
  region TEXT,                  -- 고향/지역
  story_category TEXT,          -- 온보딩 선택: 'childhood' | 'family' | 'life' | 'daily'
  interests JSONB DEFAULT '[]', -- 대화에서 파악된 관심사 태그
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 대화 세션 테이블
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,                   -- AI가 자동 생성하는 세션 제목
  category TEXT,                -- 'childhood' | 'family' | 'life' | 'daily'
  chapter_id UUID,              -- 어떤 챕터에 속하는지
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 대화 메시지 테이블
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,           -- 'user' | 'assistant'
  content TEXT NOT NULL,
  keywords JSONB DEFAULT '[]',  -- 추출된 키워드 태그
  emotion TEXT,                 -- 감지된 감정
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이미지 테이블
CREATE TABLE story_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,                  -- 사용된 프롬프트
  caption TEXT,                 -- 이미지 설명
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 챕터(이야기 책) 테이블
CREATE TABLE chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,          -- '어린 시절', '결혼과 가족' 등
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 오늘의 질문 테이블
CREATE TABLE daily_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- RLS 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "자신의 프로필만 접근" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "자신의 세션만 접근" ON sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "자신의 메시지만 접근" ON messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "자신의 이미지만 접근" ON story_images FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "자신의 챕터만 접근" ON chapters FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "질문은 모두 읽기 가능" ON daily_questions FOR SELECT USING (TRUE);

-- 기본 질문 데이터
INSERT INTO daily_questions (category, question) VALUES
('childhood', '어린 시절, 가장 자주 뛰어놀던 곳이 어디였나요?'),
('childhood', '초등학교 때 제일 좋아했던 선생님이 계셨나요?'),
('childhood', '어릴 때 즐겨 먹던 음식이 있으셨어요?'),
('family', '처음으로 직접 요리를 해줬던 기억이 있으세요?'),
('family', '결혼하던 날 기억이 나세요? 어떤 날씨였는지 기억하세요?'),
('family', '아이들이 어렸을 때, 가장 기억에 남는 순간이 있나요?'),
('life', '살면서 가장 용기 있었던 순간은 언제였나요?'),
('life', '지금의 나를 만든 가장 중요한 선택이 있다면요?'),
('life', '젊었을 때 꿈꿨던 것 중에 이룬 것이 있으세요?'),
('daily', '요즘 가장 마음이 편안한 시간은 언제예요?'),
('daily', '최근에 맛있게 드신 음식이 뭐였나요?'),
('daily', '오늘 날씨가 어떤 기억을 떠오르게 하나요?');
