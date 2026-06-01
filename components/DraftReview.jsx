"use client";

import React from 'react';
import { CheckCircle2, Edit3, User, Palette } from 'lucide-react';

const DraftReview = ({ draft, onConfirm }) => {
  return (
    <div className="glass-card animate-fade-in-up">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-color)' }}>전략 초안 분석 완료</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          입력하신 정보를 바탕으로 도출된 기획 방향입니다. 이 방향으로 상세페이지를 생성할까요?
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="prompt-text-block">
          <h4>타겟 모델 (상황)</h4>
          <p style={{ fontWeight: 600 }}>{draft.targetModel}</p>
        </div>
        <div className="prompt-text-block">
          <h4>핵심 문제</h4>
          <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-primary)' }}>
            {draft.coreProblems.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
        <div className="prompt-text-block" style={{ gridColumn: '1 / -1' }}>
          <h4>핵심 가치 5가지</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {draft.coreValues.map((v, i) => (
              <span key={i} className="prompt-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary-color)' }}>
                {v}
              </span>
            ))}
          </div>
        </div>
        <div className="prompt-text-block">
          <h4>구매 트리거</h4>
          <p>{draft.purchaseTrigger}</p>
        </div>
        <div className="prompt-text-block">
          <h4>브랜드 톤 & 컬러</h4>
          <p>{draft.brandTone} / {draft.colorDirection}</p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', marginTop: '2rem' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>이 방향으로 진행할까요?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <button className="btn-primary" onClick={onConfirm} style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
            <CheckCircle2 size={20} />
            ① 그대로 진행 (최종 프롬프트 생성)
          </button>
          <button className="btn-secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.2rem' }}>
            <Edit3 size={24} />
            ② 카피 수정
          </button>
          <button className="btn-secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.2rem' }}>
            <User size={24} />
            ③ 모델 변경
          </button>
          <button className="btn-secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.2rem' }}>
            <Palette size={24} />
            ④ 톤 변경
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftReview;
