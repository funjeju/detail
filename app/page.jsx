"use client";

import React, { useState, useEffect } from 'react';
import InputForm from '../components/InputForm';
import DraftReview from '../components/DraftReview';
import PromptResults from '../components/PromptResults';
import { generateDraftStrategy } from '../data/mockGenerator';

import { Sparkles, LogIn, LogOut } from 'lucide-react';

import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function App() {
  const [step, setStep] = useState(() => localStorage.getItem('appStep') || 'INPUT');
  const [draft, setDraft] = useState(() => {
    const saved = localStorage.getItem('appDraft');
    return saved ? JSON.parse(saved) : null;
  });
  const [prompts, setPrompts] = useState(() => {
    const saved = localStorage.getItem('appPrompts');
    return saved ? JSON.parse(saved) : null;
  });
  const [productInfo, setProductInfo] = useState(() => localStorage.getItem('appProductInfo') || '');
  const [user, setUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('appStep', step);
    localStorage.setItem('appProductInfo', productInfo);
    if (draft) localStorage.setItem('appDraft', JSON.stringify(draft));
    else localStorage.removeItem('appDraft');
    if (prompts) localStorage.setItem('appPrompts', JSON.stringify(prompts));
    else localStorage.removeItem('appPrompts');
  }, [step, draft, prompts, productInfo]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      alert('로그인에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputSubmit = (content) => {
    setProductInfo(content);
    setStep('LOADING_DRAFT');
    
    // Use mock draft generation
    const draftData = generateDraftStrategy(content);
    setDraft(draftData);
    setStep('REVIEW');
  };

  const handleConfirmDraft = async () => {
    setStep('LOADING_RESULTS');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productInfo })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate');
      }
      
      const finalPrompts = await response.json();
      setPrompts(finalPrompts);
      
      // Save to Firestore if user is logged in
      if (user) {
        try {
          await addDoc(collection(db, 'prompts', user.uid, 'projects'), {
            productInfo,
            draft,
            prompts: finalPrompts,
            createdAt: serverTimestamp()
          });
          console.log("Saved to Firestore!");
        } catch (dbError) {
          console.error("Firestore save error:", dbError);
        }
      }
      
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
      <header style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <img src={user.photoURL} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LogOut size={16} /> 로그아웃
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LogIn size={16} /> 구글 로그인
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '0.5rem', marginTop: '2rem' }}>
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
