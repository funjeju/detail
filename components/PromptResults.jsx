"use client";

import React from 'react';
import { Copy, Image as ImageIcon, Layout, Type } from 'lucide-react';

const PromptCard = ({ data }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(data.imagePrompt);
    alert('프롬프트가 복사되었습니다.');
  };

  return (
    <div className="glass-card prompt-card animate-fade-in-up">
      <div className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <h3 className="prompt-section-title">{data.section}</h3>
        <span className="prompt-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Layout size={14} /> 가로 860px × 세로 {data.height}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div className="prompt-text-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Type size={16} color="var(--primary-color)" />
            <h4 style={{ margin: 0 }}>메인 카피 & 서브 카피</h4>
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)' }}>{data.mainCopy}</p>
          <p style={{ marginTop: '0.3rem' }}>{data.subCopy}</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="prompt-text-block" style={{ flex: 1 }}>
            <h4>보조 포인트</h4>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem', fontSize: '0.9rem' }}>
              {data.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
          <div className="prompt-text-block" style={{ flex: 1 }}>
            <h4>신뢰 요소</h4>
            <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>{data.trustElement}</p>
          </div>
        </div>

        <div className="prompt-text-block">
          <h4>폰트 스타일 (타이포그래피)</h4>
          <p style={{ fontSize: '0.9rem' }}>{data.fontStyle}</p>
        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <ImageIcon size={16} color="var(--secondary-color)" />
              이미지 생성용 프롬프트 (Image 2)
            </h4>
            <button 
              onClick={handleCopy}
              style={{ 
                background: 'none', border: 'none', color: 'var(--primary-color)', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', fontWeight: 600 
              }}
            >
              <Copy size={14} /> 복사
            </button>
          </div>
          <div className="copy-code">
            {data.imagePrompt}
          </div>
        </div>
      </div>
    </div>
  );
};

const PromptResults = ({ prompts, onReset, readOnly = false }) => {
  return (
    <div className="animate-fade-in-up">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.2rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
          최종 상세페이지 프롬프트
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          모든 모듈의 설계가 완료되었습니다. 아래 프롬프트를 Image 2 또는 미드저니에 복사하여 사용하세요.
        </p>
        {!readOnly && (
          <button className="btn-secondary" onClick={onReset} style={{ marginTop: '1.5rem' }}>
            새로운 프로젝트 시작
          </button>
        )}
      </div>

      <div className="results-grid">
        {prompts.map((p) => (
          <PromptCard key={p.id} data={p} />
        ))}
      </div>
    </div>
  );
};

export default PromptResults;
