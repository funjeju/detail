export const generateDraftStrategy = (input) => {
  // Mock function to simulate Step 1 analysis
  return {
    targetModel: "30대 직장인, 피로가 누적된 아침",
    coreProblems: ["바쁜 아침 식사 대용 부족", "인공 첨가물에 대한 거부감"],
    coreValues: [
      "국산 토마토 100%의 진정성",
      "영양 파괴를 최소화한 NFC 착즙",
      "갈아만든 듯한 포만감과 식감",
      "무첨가 원칙의 자연스러운 단맛",
      "바쁜 일상에 최적화된 휴대성"
    ],
    purchaseTrigger: "건강한 아침 습관으로 활력 되찾기",
    brandTone: "프리미엄, 신뢰감, 생동감",
    colorDirection: "토마토 레드 & 프레시 그린"
  };
};

export const generateImagePrompts = (strategy) => {
  // Mock function to simulate Step 2~4 generation based on strategy
  return [
    {
      id: "section-1",
      section: "1. Hook (모델 등장)",
      height: "2000px",
      mainCopy: "바쁜 아침, 당신의 활력을 깨우는 100% 진짜 토마토",
      subCopy: "물 한 방울 섞지 않은 진짜를 만나보세요",
      points: ["국산 토마토 100%", "NFC 착즙", "무첨가"],
      trustElement: "누적 판매 100만포 돌파",
      fontStyle: "헤드라인: S-Core Dream Bold (매우 크게)",
      imagePrompt: "photorealistic, commercial photography, natural lighting, minimal background, clean ecommerce design, realistic texture. A 30-year-old female office worker looking refreshed and energetic in the morning, holding a red tomato juice pouch. Fresh red tomatoes on a clean white kitchen counter. Premium lighting, vibrant colors.",
    },
    {
      id: "section-2",
      section: "2. 문제 공감",
      height: "1800px",
      mainCopy: "매일 아침, 빈속으로 출근하시나요?",
      subCopy: "설탕 가득한 주스 대신 건강한 선택이 필요합니다",
      points: ["피로 누적", "불규칙한 식사", "인공적인 단맛 거부"],
      trustElement: "직장인 1,000명 설문: 아침 식사 대용 만족도 98%",
      fontStyle: "본문: Pretendard Regular",
      imagePrompt: "photorealistic, commercial photography, natural lighting. A slightly tired office worker looking at a watch in a modern minimalist home. Soft, slightly moody morning light. Clean aesthetic, glass of artificial juice crossed out implicitly. Highly detailed, cinematic.",
    },
    {
      id: "section-3",
      section: "3. 해결 제안 (Before / After)",
      height: "2000px",
      mainCopy: "한 포로 채우는 든든한 포만감",
      subCopy: "갈아만든 텍스처로 씹히는 과육을 느껴보세요",
      points: ["포만감 UP", "영양 가득", "간편한 섭취"],
      trustElement: "리뷰: '아침에 이거 하나면 점심까지 든든해요'",
      fontStyle: "강조: Pretendard SemiBold",
      imagePrompt: "photorealistic, commercial photography, bright natural lighting. Split screen concept or clear transition. Fresh tomato juice poured into a transparent glass showing thick, rich texture with visible pulp. Clean white background, premium ecommerce style.",
    },
    {
      id: "section-4",
      section: "4. 핵심 가치 (성분)",
      height: "1800px",
      mainCopy: "오직 국내산 토마토 100%만 담았습니다",
      subCopy: "자연이 주는 건강한 감칠맛",
      points: ["엄선된 농가", "당도 높은 토마토", "신선함 유지"],
      trustElement: "원산지 증명서 및 유기농 인증 마크",
      fontStyle: "헤드라인: S-Core Dream Bold",
      imagePrompt: "photorealistic, commercial photography. Close up of perfectly ripe, vibrant red tomatoes with water droplets, sitting in a wooden basket in a sunlit field. Natural, organic, fresh vibe. High resolution, hyper-detailed.",
    },
    {
      id: "section-5",
      section: "5. 핵심 가치 (공법)",
      height: "1800px",
      mainCopy: "영양소 파괴를 막는 NFC 착즙",
      subCopy: "끓이지 않고 그대로 짜냈습니다",
      points: ["Not From Concentrate", "콜드프레스", "비타민 보존"],
      trustElement: "제조 공정 특허 인증",
      fontStyle: "강조: Pretendard SemiBold",
      imagePrompt: "photorealistic, commercial photography. Conceptual visual of a cold-press machine gently extracting juice from fresh tomatoes. Clean, stainless steel and glass elements. Modern, hygienic, scientific yet natural aesthetic.",
    },
    {
      id: "section-6",
      section: "6. 신뢰 요소",
      height: "2500px",
      mainCopy: "이미 수많은 고객님들이 증명합니다",
      subCopy: "평점 4.8/5.0, 재구매율 1위",
      points: ["리뷰 1만건", "가족 추천", "선물용 인기"],
      trustElement: "실제 고객 포토 리뷰 및 별점",
      fontStyle: "본문: Pretendard Regular",
      imagePrompt: "photorealistic, clean ecommerce design. A grid or beautifully arranged collage of UI review cards floating slightly over a soft, minimal grey background. High-end, trustworthy layout.",
    },
    {
      id: "section-7",
      section: "7. 상세 정보",
      height: "2800px",
      mainCopy: "제품 상세 정보",
      subCopy: "꼼꼼하게 확인하세요",
      points: ["용량: 100ml", "원재료: 토마토 100%", "보관: 실온"],
      trustElement: "HACCP 인증 마크",
      fontStyle: "본문: Pretendard Regular (표 형태)",
      imagePrompt: "clean ecommerce design, minimal background. Clean, minimalist typography layout. Simple icons representing ingredients, storage, and capacity. White background with very subtle light grey structured lines.",
    },
    {
      id: "section-8",
      section: "8. CTA (행동 유도)",
      height: "1600px",
      mainCopy: "지금 바로 건강한 아침을 시작하세요",
      subCopy: "한정 기간 특별 할인 중",
      points: ["무료 배송", "당일 출고", "세트 할인"],
      trustElement: "오늘 출발 아이콘",
      fontStyle: "헤드라인: S-Core Dream Bold",
      imagePrompt: "photorealistic, commercial photography, warm inviting lighting. A beautifully arranged gift set box of the tomato juice pouches, wrapped with a premium ribbon. A hand gently placing the last pouch inside. High conversion, desirable aesthetic.",
    }
  ];
};
