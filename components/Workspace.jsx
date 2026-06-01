import React, { useState } from 'react';
import { RefreshCw, Play, Save, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { db } from '../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';

const Workspace = ({ prompts, setPrompts, user, currentDocId, onReset }) => {
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const activePrompt = prompts[activePromptIndex];

  // Dynamically combine image prompt with text copy for the image generator
  const finalPrompt = activePrompt ? `${activePrompt.imagePrompt}
  
CRITICAL INSTRUCTION FOR IMAGE GENERATION:
You MUST render the following typography text beautifully overlaid on the image's negative space:
- Headline: "${activePrompt.mainCopy}"
- Sub-headline: "${activePrompt.subCopy}"
- Key Points: ${activePrompt.points.join(', ')}
` : '';

  const handleGenerateImage = async () => {
    if (!activePrompt) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate image');
      }

      const { imageUrl } = await response.json();

      // Update local state
      const updatedPrompts = [...prompts];
      updatedPrompts[activePromptIndex] = { ...activePrompt, imageUrl };
      setPrompts(updatedPrompts);

      // Update Firestore if user is logged in
      if (user && currentDocId) {
        await updateDoc(doc(db, 'prompts', user.uid, 'projects', currentDocId), {
          prompts: updatedPrompts
        });
        console.log("Image URL saved to Firestore!");
      }
    } catch (e) {
      console.error(e);
      alert('이미지 생성에 실패했습니다: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '1rem', marginTop: '1rem' }}>
      
      {/* 1. Left Panel: Module List */}
      <div className="glass-card" style={{ width: '250px', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>섹션 목록</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {prompts.map((prompt, index) => (
            <div 
              key={prompt.id}
              onClick={() => setActivePromptIndex(index)}
              style={{
                padding: '0.8rem',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: activePromptIndex === index ? 'var(--primary-color)' : 'var(--bg-secondary)',
                color: activePromptIndex === index ? '#fff' : 'var(--text-primary)',
                fontWeight: activePromptIndex === index ? 'bold' : 'normal',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {prompt.section}
              </span>
              {prompt.imageUrl && <CheckCircle size={14} color={activePromptIndex === index ? '#fff' : 'var(--success-color)'} />}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Middle Panel: Prompt Editor & Generate Button */}
      <div className="glass-card" style={{ flex: '1', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>{activePrompt?.section}</h2>
          <span className="badge">권장 크기: 860px × {activePrompt?.height}</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>메인 & 서브 카피</h4>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>{activePrompt?.mainCopy}</p>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{activePrompt?.subCopy}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>보조 포인트</h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.9rem' }}>
                {activePrompt?.points.map((pt, i) => <li key={i}>{pt}</li>)}
              </ul>
            </div>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>신뢰 요소</h4>
              <p style={{ fontSize: '0.9rem' }}>{activePrompt?.trustElement}</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#1a1a2e', color: '#a0a0b0', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>이미지 생성용 프롬프트 (gpt-image-2)</span>
            </div>
            <p style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{finalPrompt}</p>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-primary" 
            style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleGenerateImage}
            disabled={isGenerating}
          >
            {isGenerating ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : <Play size={20} />}
            {isGenerating ? '이미지 생성 중 (gpt-image-2)...' : '이 모듈 이미지 생성하기'}
          </button>
          <button className="btn-secondary" onClick={onReset} style={{ padding: '0 1rem' }}>
            <RefreshCw size={20} /> 처음으로
          </button>
        </div>
      </div>

      {/* 3. Right Panel: Infinite Vertical Canvas */}
      <div className="glass-card" style={{ width: '400px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', backgroundColor: '#e5e5e5' }}>
        <div style={{ padding: '1rem', backgroundColor: '#fff', borderBottom: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>
          상세페이지 프리뷰 캔버스
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Container holding the actual 860px wide canvas, scaled down to fit the 400px panel */}
          <div style={{ 
            width: '860px', 
            transform: 'scale(0.42)', 
            transformOrigin: 'top center',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            {prompts.map((prompt, index) => {
              const heightStr = prompt.height || '1000px';
              // Fallback to 1000px if height string doesn't end with px
              const heightNum = parseInt(heightStr.replace('px', '')) || 1000;

              return (
                <div 
                  key={prompt.id} 
                  style={{ 
                    width: '860px', 
                    height: `${heightNum}px`, 
                    position: 'relative',
                    borderBottom: '1px dashed #ccc',
                    backgroundColor: prompt.imageUrl ? '#fff' : '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {prompt.imageUrl ? (
                    <img 
                      src={prompt.imageUrl} 
                      alt={prompt.section}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#aaa' }}>
                      <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                      <h2 style={{ fontSize: '2rem', margin: 0 }}>{prompt.section}</h2>
                      <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>이미지를 생성해주세요 ({prompt.height})</p>
                    </div>
                  )}
                  
                  {/* Outline overlay if this is the active module */}
                  {activePromptIndex === index && (
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, left: 0, right: 0, bottom: 0, 
                      border: '8px solid var(--primary-color)', 
                      pointerEvents: 'none',
                      zIndex: 10
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
