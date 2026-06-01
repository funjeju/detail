import React, { useState } from 'react';
import { Upload, Link, AlignLeft, Sparkles } from 'lucide-react';

const InputForm = ({ onSubmit }) => {
  const [inputType, setInputType] = useState('text'); // text, url, image
  const [content, setContent] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content) onSubmit(content);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setContent(file.name);
      onSubmit(file.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content) return;
    onSubmit(content);
  };

  return (
    <div className="glass-card animate-fade-in-up">
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
          상품 정보 입력
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          상세페이지를 만들 상품의 정보를 텍스트, URL, 또는 이미지로 입력해주세요.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <button
          type="button"
          className={`btn-secondary ${inputType === 'text' ? 'active' : ''}`}
          style={inputType === 'text' ? { borderColor: 'var(--primary-color)', background: 'rgba(79, 70, 229, 0.05)' } : {}}
          onClick={() => setInputType('text')}
        >
          <AlignLeft size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          텍스트/프롬프트
        </button>
        <button
          type="button"
          className={`btn-secondary ${inputType === 'url' ? 'active' : ''}`}
          style={inputType === 'url' ? { borderColor: 'var(--primary-color)', background: 'rgba(79, 70, 229, 0.05)' } : {}}
          onClick={() => setInputType('url')}
        >
          <Link size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          상품 URL
        </button>
        <button
          type="button"
          className={`btn-secondary ${inputType === 'image' ? 'active' : ''}`}
          style={inputType === 'image' ? { borderColor: 'var(--primary-color)', background: 'rgba(79, 70, 229, 0.05)' } : {}}
          onClick={() => setInputType('image')}
        >
          <Upload size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          이미지 업로드
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {inputType === 'text' && (
          <div className="input-group">
            <label>상세 설명 (브랜드, 특징 등)</label>
            <textarea
              className="styled-textarea"
              placeholder="예: 인터뷰어 토마토즙. 국산 토마토 100% 사용, NFC 착즙 방식, 무첨가..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {inputType === 'url' && (
          <div className="input-group">
            <label>상품 상세페이지 또는 스토어 URL</label>
            <input
              type="url"
              className="styled-input"
              placeholder="https://smartstore.naver.com/..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {inputType === 'image' && (
          <div className="input-group">
            <label>대표 이미지 또는 참고 이미지</label>
            <div className="file-upload-area" onClick={() => document.getElementById('fileInput').click()}>
              <Upload size={48} />
              <p>클릭하거나 이미지를 여기로 드래그하세요.</p>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>PNG, JPG, WEBP (최대 5MB)</span>
              <input 
                id="fileInput" 
                type="file" 
                style={{ display: 'none' }} 
                onChange={handleFileSelect} 
              />
              {content && <p style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{content} 선택됨</p>}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default InputForm;

