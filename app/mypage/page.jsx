"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Calendar, FileText } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import DraftReview from '../../components/DraftReview';
import PromptResults from '../../components/PromptResults';

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchHistory(currentUser.uid);
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchHistory = async (uid) => {
    try {
      const q = query(collection(db, 'prompts', uid, 'projects'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setHistory(docs);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("정말 이 내역을 삭제하시겠습니까?")) return;
    
    try {
      await deleteDoc(doc(db, 'prompts', user.uid, 'projects', id));
      setHistory(history.filter(item => item.id !== id));
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" className="btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>내 저장함</h1>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img src={user.photoURL} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.displayName}</span>
          </div>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              저장된 내역이 없습니다.
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                className={`glass-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                style={{ 
                  padding: '1.2rem', 
                  cursor: 'pointer',
                  border: selectedItem?.id === item.id ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedItem(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.productInfo || "이미지 분석 프로젝트"}
                  </h3>
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer', padding: '0.2rem' }}
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <Calendar size={12} />
                  <span>{item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : '최근'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="history-detail">
          {selectedItem ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} /> 원본 입력 정보
                </h2>
                <div className="glass-card" style={{ padding: '1.5rem', whiteSpace: 'pre-wrap' }}>
                  {selectedItem.productInfo || "(이미지 업로드로 생성됨)"}
                </div>
              </div>
              
              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>전략 초안</h2>
                <DraftReview draft={selectedItem.draft} readOnly={true} />
              </div>

              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>생성된 프롬프트</h2>
                <PromptResults prompts={selectedItem.prompts} readOnly={true} />
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ height: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              좌측 목록에서 내역을 선택해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
