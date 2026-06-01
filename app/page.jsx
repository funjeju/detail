"use client";

import React, { useState, useEffect } from 'react';
import InputForm from '../components/InputForm';
import DraftReview from '../components/DraftReview';
import PromptResults from '../components/PromptResults';
import Workspace from '../components/Workspace';


import { Sparkles, LogIn, LogOut, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

function App() {
  const [step, setStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('appStep');
      if (savedStep === 'LOADING_RESULTS' || savedStep === 'LOADING_DRAFT') return 'INPUT';
      return savedStep || 'INPUT';
    }
    return 'INPUT';
  });
  const [draft, setDraft] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appDraft');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [prompts, setPrompts] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appPrompts');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [productInfo, setProductInfo] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('appProductInfo') || '';
    return '';
  });
  const [currentDocId, setCurrentDocId] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('appDocId') || null;
    return null;
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('appStep', step);
    localStorage.setItem('appProductInfo', productInfo);
    if (draft) localStorage.setItem('appDraft', JSON.stringify(draft));
    else localStorage.removeItem('appDraft');
    if (prompts) localStorage.setItem('appPrompts', JSON.stringify(prompts));
    else localStorage.removeItem('appPrompts');
    if (currentDocId) localStorage.setItem('appDocId', currentDocId);
    else localStorage.removeItem('appDocId');
  }, [step, draft, prompts, productInfo, currentDocId]);

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

  const handleInputSubmit = async (content) => {
    setProductInfo(content);
    setStep('LOADING_DRAFT');
    
    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productInfo: content })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate draft');
      }
      
      const draftData = await response.json();
      setDraft(draftData);
      
      // Save draft step to Firestore immediately
      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'prompts', user.uid, 'projects'), {
            productInfo: content,
            draft: draftData,
            createdAt: serverTimestamp()
          });
          setCurrentDocId(docRef.id);
          console.log("Draft saved to Firestore:", docRef.id);
        } catch (dbError) {
          console.error("Firestore save error:", dbError);
        }
      }

      setStep('REVIEW');
    } catch (e) {
      console.error(e);
      alert('초안 생성에 실패했습니다. 콘솔을 확인해 주세요.');
      setStep('INPUT');
    }
  };

  const handleConfirmDraft = async () => {
    // Instead of calling /api/generate and waiting for 10 prompts,
    // we initialize empty "skeletons" and immediately go to Workspace.
    
    if (!draft || !draft.sections) return;

    const skeletons = draft.sections.map((sec, idx) => ({
      id: sec.id || `section-${idx + 1}`,
      section: sec.title,
      // The rest of the fields will be populated later when generated
      height: "1000px", // default fallback
      mainCopy: "",
      subCopy: "",
      points: [],
      trustElement: "",
      fontStyle: "",
      imagePrompt: "",
      imageUrl: null,
      isGenerated: false // custom flag to track if text prompt is generated
    }));

    setPrompts(skeletons);
    
    // Update Firestore with skeletons
    if (user) {
      try {
        if (currentDocId) {
          await updateDoc(doc(db, 'prompts', user.uid, 'projects', currentDocId), {
            prompts: skeletons
          });
          console.log("Skeletons updated in Firestore!");
        } else {
          // Fallback if docId is missing
          const docRef = await addDoc(collection(db, 'prompts', user.uid, 'projects'), {
            productInfo,
            draft,
            prompts: skeletons,
            createdAt: serverTimestamp()
          });
          setCurrentDocId(docRef.id);
        }
      } catch (dbError) {
        console.error("Firestore update error:", dbError);
      }
    }
    
    setStep('RESULTS');
  };

  const handleReset = () => {
    if (step === 'INPUT') return;
    if (window.confirm('현재 작업 내역을 닫고 새로운 프로젝트를 시작하시겠습니까?')) {
      localStorage.removeItem('appStep');
      localStorage.removeItem('appProductInfo');
      localStorage.removeItem('appDraft');
      localStorage.removeItem('appPrompts');
      localStorage.removeItem('appDocId');
      setStep('INPUT');
      setProductInfo('');
      setDraft(null);
      setPrompts(null);
      setCurrentDocId(null);
    }
  };

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', width: '100%' }}>
          {step !== 'INPUT' && (
            <button onClick={handleReset} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px', whiteSpace: 'nowrap' }}>
              <Plus size={16} /> 새 프로젝트
            </button>
          )}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <img src={user.photoURL} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              <Link href="/mypage" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                <FileText size={16} /> 내 저장함
              </Link>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                <LogOut size={16} /> 로그아웃
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
              <LogIn size={16} /> 구글 로그인
            </button>
          )}
        </div>

        <div 
          onClick={handleReset}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '0.5rem', marginTop: '2rem', cursor: step === 'INPUT' ? 'default' : 'pointer' }}
          title={step !== 'INPUT' ? '메인 화면으로 가기' : ''}
        >
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
          <Workspace 
            prompts={prompts} 
            setPrompts={setPrompts} 
            user={user} 
            currentDocId={currentDocId} 
            onReset={handleReset} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
