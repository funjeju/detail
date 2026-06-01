import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import DraftReview from './components/DraftReview';
import PromptResults from './components/PromptResults';
import { generateDraftStrategy } from './data/mockGenerator';
import { generatePrompts } from './api/gemini';
import { Sparkles } from 'lucide-react';

function App() {
  const [step, setStep] = useState(() => localStorage.getItem('appStep') || 'INPUT'); // INPUT, LOADING_DRAFT, REVIEW, LOADING_RESULTS, RESULTS
  const [draft, setDraft] = useState(() => {
    const saved = localStorage.getItem('appDraft');
    return saved ? JSON.parse(saved) : null;
  });
  const [prompts, setPrompts] = useState(() => {
    const saved = localStorage.getItem('appPrompts');
    return saved ? JSON.parse(saved) : null;
  });
  const [productInfo, setProductInfo] = useState(() => localStorage.getItem('appProductInfo') || '');

  useEffect(() => {
    localStorage.setItem('appStep', step);
    localStorage.setItem('appProductInfo', productInfo);
    if (draft) localStorage.setItem('appDraft', JSON.stringify(draft));
    else localStorage.removeItem('appDraft');
    if (prompts) localStorage.setItem('appPrompts', JSON.stringify(prompts));
    else localStorage.removeItem('appPrompts');
  }, [step, draft, prompts, productInfo]);

  const handleInputSubmit = (content) => {
    setProductInfo(content);
    setStep('LOADING_DRAFT');
    
    // Use mock draft generation (could be replaced with LLM later)
    const draftData = generateDraftStrategy(content);
    setDraft(draftData);
    setStep('REVIEW');
  };

  const handleConfirmDraft = async () => {
    setStep('LOADING_RESULTS');
    try {
      const finalPrompts = await generatePrompts(productInfo);
      setPrompts(finalPrompts);
      setStep('RESULTS');
    } catch (e) {
      console.error(e);
      alert('프롬프트 생성에 실패했습니다. 콘솔을 확인해 주세요.');
      setStep('REVIEW');
    }
  };

  const handleReset = () => {
    setStep('INPUT');
    setDraft(null);
    setPrompts(null);
  };

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
          <Sparkles color="var(--primary-color)" size={32} />
          <h1>SmartStore Prompt Gen AI</h1>
        </div>
        <p>최소한의 입력으로 완벽한 스마트스토어 상세페이지 이미지 생성 프롬프트를 만드세요</p>
      </header>

      <main>
        {step === 'INPUT' && (
          <InputForm onSubmit={handleInputSubmit} />
        )}

        {(step === 'LOADING_DRAFT' || step === 'LOADING_RESULTS') && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <div className="spinner" style={{ marginBottom: '2rem' }}></div>
            <h2 style={{ color: 'var(--primary-color)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {step === 'LOADING_DRAFT' ? '입력된 정보를 분석하여 전략 초안을 구성 중입니다...' : '전략을 바탕으로 최적의 프롬프트를 설계하고 있습니다...'}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>AI가 고밀도 설득 구조를 적용 중입니다. 잠시만 기다려주세요.</p>
          </div>
        )}

        {step === 'REVIEW' && draft && (
          <DraftReview draft={draft} onConfirm={handleConfirmDraft} />
        )}

        {step === 'RESULTS' && prompts && (
          <PromptResults prompts={prompts} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
