import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Save, CheckCircle, Image as ImageIcon, FileText, Zap } from 'lucide-react';
import { db } from '../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';

const Workspace = ({ prompts, setPrompts, user, currentDocId, onReset }) => {
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  const activePrompt = prompts[activePromptIndex];
  
  // Backward compatibility: old prompts might not have isGenerated flag, but they have mainCopy
  const isPromptGenerated = activePrompt ? (activePrompt.isGenerated || !!activePrompt.mainCopy) : false;

  // Dynamically combine image prompt with text copy for the image generator
  const finalPrompt = activePrompt && isPromptGenerated ? `${activePrompt.imagePrompt}
  
CRITICAL INSTRUCTION FOR IMAGE GENERATION:
You MUST render the following typography text beautifully overlaid on the image's negative space:
- Headline: "${activePrompt.mainCopy}"
- Sub-headline: "${activePrompt.subCopy}"
- Key Points: ${activePrompt.points?.join(', ')}
` : '';

  const handleGenerateImage = async () => {
    if (!activePrompt || !isPromptGenerated) return;
    setIsGeneratingImage(true);

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
        // Strip out base64 image data before saving to Firestore to prevent 1MB limit or invalid entity errors
        const promptsForDb = updatedPrompts.map(p => ({
          ...p,
          imageUrl: p.imageUrl?.startsWith('data:image') ? null : p.imageUrl
        }));
        
        await updateDoc(doc(db, 'prompts', user.uid, 'projects', currentDocId), {
          prompts: promptsForDb
        });
      }
    } catch (e) {
      console.error(e);
      alert('이미지 생성은 성공했으나 저장 중 오류가 발생했습니다 (단, 화면에는 유지됩니다).');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = (prompt) => {
    if (!prompt || !prompt.imageUrl) return;
    const link = document.createElement('a');
    link.href = prompt.imageUrl;
    link.download = `${prompt.section}_image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSinglePrompt = async (indexToGenerate) => {
    const targetPrompt = prompts[indexToGenerate];
    if (targetPrompt.isGenerated) return targetPrompt; // already generated

    // Get product info from localStorage (as it was used to create the draft)
    const productInfo = localStorage.getItem('appProductInfo') || '';

    const response = await fetch('/api/generate-single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        productInfo, 
        sectionTitle: targetPrompt.section,
        sectionId: targetPrompt.id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate prompt');
    }

    const generatedData = await response.json();
    return { ...targetPrompt, ...generatedData, isGenerated: true };
  };

  const handleGenerateSingleTextPrompt = async (index = activePromptIndex) => {
    setIsGeneratingText(true);
    try {
      const updatedData = await generateSinglePrompt(index);
      
      const newPrompts = [...prompts];
      newPrompts[index] = updatedData;
      setPrompts(newPrompts);

      if (user && currentDocId) {
        await updateDoc(doc(db, 'prompts', user.uid, 'projects', currentDocId), {
          prompts: newPrompts
        });
      }
    } catch (e) {
      console.error(e);
      alert('프롬프트 생성에 실패했습니다.');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleAutoGenerateAll = async () => {
    if (isAutoGenerating) return;
    setIsAutoGenerating(true);

    try {
      let currentPrompts = [...prompts];
      
      for (let i = 0; i < currentPrompts.length; i++) {
        if (!currentPrompts[i].isGenerated) {
          setActivePromptIndex(i); // Move UI to currently generating item
          const updatedData = await generateSinglePrompt(i);
          currentPrompts[i] = updatedData;
          setPrompts([...currentPrompts]);
          
          if (user && currentDocId) {
            await updateDoc(doc(db, 'prompts', user.uid, 'projects', currentDocId), {
              prompts: currentPrompts
            });
          }
          // Small delay to prevent API rate limiting
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    } catch (e) {
      console.error(e);
      alert('자동 생성 중 오류가 발생했습니다.');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '1rem', marginTop: '1rem' }}>
      
      {/* 1. Left Panel: Module List */}
      <div className="glass-card" style={{ width: '250px', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1rem' }}>
        <button 
          onClick={handleAutoGenerateAll}
          disabled={isAutoGenerating}
          style={{
            marginBottom: '1rem',
            padding: '0.8rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#fff',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: isAutoGenerating ? 'not-allowed' : 'pointer',
            opacity: isAutoGenerating ? 0.7 : 1,
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
          }}
        >
          {isAutoGenerating ? (
            <><div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: '#fff', borderTopColor: 'transparent' }}></div> 생성 중...</>
          ) : (
            <><Zap size={16} /> 전체 자동 생성</>
          )}
        </button>

        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>섹션 목록</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {prompts.map((prompt, index) => (
            <div 
              key={prompt.id}
              onClick={() => !isAutoGenerating && setActivePromptIndex(index)}
              style={{
                padding: '0.8rem',
                borderRadius: '8px',
                cursor: isAutoGenerating ? 'not-allowed' : 'pointer',
                backgroundColor: activePromptIndex === index ? 'var(--primary-color)' : 'var(--bg-secondary)',
                color: activePromptIndex === index ? '#fff' : 'var(--text-primary)',
                fontWeight: activePromptIndex === index ? 'bold' : 'normal',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s',
                opacity: isAutoGenerating && activePromptIndex !== index ? 0.5 : 1
              }}
            >
              <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {prompt.section}
              </span>
              {(prompt.isGenerated || !!prompt.mainCopy) && !prompt.imageUrl && <FileText size={14} color={activePromptIndex === index ? '#fff' : 'var(--primary-color)'} opacity={0.7} />}
              {prompt.imageUrl && <CheckCircle size={14} color={activePromptIndex === index ? '#fff' : 'var(--success-color)'} />}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Middle Panel: Prompt Editor & Generate Button */}
      <div className="glass-card" style={{ flex: '1', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '0', position: 'relative', overflow: 'hidden' }}>
        
        {/* Header Area */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(to right, rgba(99, 102, 241, 0.05), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0, fontWeight: '800', lineHeight: '1.3' }}>
              <span style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}>✨</span>
              {activePrompt?.section}
            </h2>
            {isPromptGenerated && (
              <div style={{ background: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                <ImageIcon size={14} /> 860px × {activePrompt?.height}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Content based on isGenerated state */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {!isPromptGenerated ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
              <FileText size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>이 모듈의 텍스트 및 프롬프트가 아직 생성되지 않았습니다.</h3>
              <button 
                className="btn-primary" 
                onClick={() => handleGenerateSingleTextPrompt()}
                disabled={isGeneratingText || isAutoGenerating}
                style={{ padding: '1rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isGeneratingText ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : <Zap size={20} />}
                {isGeneratingText ? 'AI가 프롬프트 작성 중...' : '프롬프트 생성하기'}
              </button>
            </div>
          ) : (
            <>
              {/* Main & Sub Copy Card */}
              <div style={{ 
                background: 'linear-gradient(145deg, #ffffff, #f3f4f6)', 
                padding: '1.5rem', 
                borderRadius: '16px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                border: '1px solid rgba(255,255,255,0.6)'
              }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <FileText size={16} /> 메인 & 서브 카피
                </h4>
                <div style={{ borderLeft: '4px solid var(--primary-color)', paddingLeft: '1rem' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1f2937', lineHeight: '1.4' }}>"{activePrompt?.mainCopy}"</p>
                  <p style={{ fontSize: '1rem', color: '#4b5563', lineHeight: '1.6' }}>{activePrompt?.subCopy}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                {/* Key Points Card */}
                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 'bold' }}>보조 포인트</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {activePrompt?.points?.map((pt, i) => (
                      <span key={i} style={{ 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        color: 'var(--primary-color)', 
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '20px', 
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}>
                        {pt}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trust Element Card */}
                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={14} color="var(--success-color)" /> 신뢰 요소
                  </h4>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '1rem' }}>
                    <p style={{ fontSize: '1rem', color: '#334155', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>{activePrompt?.trustElement}</p>
                  </div>
                </div>
              </div>

              {/* Prompt Terminal Card */}
              <div style={{ 
                backgroundColor: '#0f172a', 
                color: '#e2e8f0', 
                padding: '1.5rem', 
                borderRadius: '16px', 
                fontFamily: '"Fira Code", monospace', 
                fontSize: '0.85rem',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                marginTop: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #334155' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                  </div>
                  <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '1px' }}>GPT-IMAGE-2 PROMPT</span>
                </div>
                <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#38bdf8' }}>
                  {finalPrompt}
                </p>
              </div>
            </>
          )}

        </div>

        {/* Action Footer */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-primary" 
            style={{ 
              flex: 1, 
              padding: '1.2rem', 
              fontSize: '1.1rem', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.8rem',
              borderRadius: '12px',
              fontWeight: 'bold',
              boxShadow: isPromptGenerated ? '0 8px 20px rgba(99, 102, 241, 0.3)' : 'none',
              opacity: isPromptGenerated ? 1 : 0.5,
              cursor: isPromptGenerated ? 'pointer' : 'not-allowed'
            }}
            onClick={handleGenerateImage}
            disabled={!isPromptGenerated || isGeneratingImage || isAutoGenerating}
          >
            {isGeneratingImage ? <div className="spinner" style={{ width: '22px', height: '22px', borderWidth: '3px' }}></div> : <Play size={22} />}
            {isGeneratingImage ? 'AI가 예술혼을 불태우는 중...' : '이 모듈 이미지 생성하기 (gpt-image-2)'}
          </button>
          <button className="btn-secondary" onClick={onReset} style={{ padding: '0 1.5rem', borderRadius: '12px' }}>
            <RefreshCw size={22} />
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
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img 
                        src={prompt.imageUrl} 
                        alt={prompt.section}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadImage(prompt); }}
                        style={{
                          position: 'absolute',
                          bottom: '20px',
                          right: '20px',
                          padding: '10px 20px',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontWeight: 'bold',
                          zIndex: 20
                        }}
                      >
                        <Save size={16} /> 다운로드
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#aaa' }}>
                      <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                      <h2 style={{ fontSize: '2rem', margin: 0 }}>{prompt.section}</h2>
                      <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
                        {(prompt.isGenerated || !!prompt.mainCopy) ? `이미지를 생성해주세요 (${prompt.height})` : '프롬프트를 먼저 생성해주세요'}
                      </p>
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
