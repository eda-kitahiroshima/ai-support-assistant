'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import QuickCaptureButton from '@/components/QuickCaptureButton';
import AnswerDisplay from '@/components/AnswerDisplay';
import GoalList from '@/components/GoalList';
import GoalDetails from '@/components/GoalDetails';
import ConversationPane from '@/components/ConversationPane';
import NewGoalModal from '@/components/NewGoalModal';
import UserProfile from '@/components/UserProfile';
import { Goal, ConversationItem } from '@/lib/types';
import {
  getAllGoals,
  getActiveGoal,
  setActiveGoal as setActiveGoalLocal,
  saveGoal as saveGoalLocal,
  deleteGoal as deleteGoalLocal
} from '@/lib/goal-management';
import {
  getConversationsByGoal,
  saveConversation as saveConversationLocal,
  generateId
} from '@/lib/conversation-history';
import {
  getGoalsFromFirestore,
  saveGoalToFirestore,
  deleteGoalFromFirestore,
  getConversationsFromFirestore,
  saveConversationToFirestore
} from '@/lib/firestore';
import { migrateLocalStorageToFirestore, needsMigration } from '@/lib/migration';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoal, setActiveGoalState] = useState<Goal | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // リサイズ用の状態
  const [leftWidth, setLeftWidth] = useState(25);
  const [rightWidth, setRightWidth] = useState(30);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 認証チェックとリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // データ読み込みと移行
  useEffect(() => {
    if (user && !authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  // 目標更新イベントリスナー
  useEffect(() => {
    const handleGoalUpdate = () => {
      if (user) {
        loadData();
      }
    };
    window.addEventListener('goal-updated', handleGoalUpdate);

    return () => {
      window.removeEventListener('goal-updated', handleGoalUpdate);
    };
  }, [user]);

  // アクティブな目標が変わったら会話を読み込み
  useEffect(() => {
    if (activeGoal && user) {
      loadConversations(activeGoal.id);
    } else {
      setConversations([]);
    }
  }, [activeGoal?.id, user]);

  // リサイズハンドラー
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;

      if (isResizingLeft) {
        const newLeftWidth = (e.clientX / containerWidth) * 100;
        if (newLeftWidth >= 15 && newLeftWidth <= 40) {
          setLeftWidth(newLeftWidth);
        }
      } else if (isResizingRight) {
        const newRightWidth = ((containerWidth - e.clientX) / containerWidth) * 100;
        if (newRightWidth >= 20 && newRightWidth <= 45) {
          setRightWidth(newRightWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight]);

  const loadData = async () => {
    if (!user) return;

    try {
      // localStorage→Firestore移行チェック
      if (needsMigration()) {
        setIsMigrating(true);
        await migrateLocalStorageToFirestore(user.uid);
        setIsMigrating(false);
      }

      // Firestoreからデータ読み込み
      const firestoreGoals = await getGoalsFromFirestore(user.uid);
      setGoals(firestoreGoals);

      const active = firestoreGoals.find(g => g.isActive) || null;
      setActiveGoalState(active);

      if (firestoreGoals.length === 0) {
        setIsNewGoalModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('データの読み込みに失敗しました');
    }
  };

  const loadConversations = async (goalId: string) => {
    if (!user) return;

    try {
      const convs = await getConversationsFromFirestore(user.uid, goalId);
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleSelectGoal = async (goalId: string) => {
    if (!user) return;

    try {
      // Firestoreで全目標を非アクティブに
      const updatedGoals = goals.map(g => ({ ...g, isActive: g.id === goalId }));

      for (const goal of updatedGoals) {
        await saveGoalToFirestore(user.uid, goal);
      }

      setGoals(updatedGoals);
      const active = updatedGoals.find(g => g.id === goalId) || null;
      setActiveGoalState(active);
      setCurrentAnswer('');
      setCurrentImage(null);
    } catch (error) {
      console.error('Failed to select goal:', error);
      setError('目標の選択に失敗しました');
    }
  };

  const handleNewGoal = () => {
    setIsNewGoalModalOpen(true);
  };

  const handleSaveGoal = async (newGoal: Goal) => {
    if (!user) return;

    try {
      // 既存の全ての目標を非アクティブに
      const updatedGoals = goals.map(g => ({ ...g, isActive: false }));
      for (const goal of updatedGoals) {
        await saveGoalToFirestore(user.uid, goal);
      }

      // 新しい目標を保存
      await saveGoalToFirestore(user.uid, newGoal);

      await loadData();
      setIsNewGoalModalOpen(false);
    } catch (error) {
      console.error('Failed to save goal:', error);
      setError('目標の保存に失敗しました');
    }
  };

  const handleQuickCapture = (capturedImage: string, autoQuestion: string) => {
    setCurrentImage(capturedImage);
    submitQuestion(capturedImage, autoQuestion);
  };

  const submitQuestion = async (img: string, q: string) => {
    if (!activeGoal || !user) {
      setError('先に目標を選択してください');
      return;
    }

    setIsLoading(true);
    setError('');
    setCurrentAnswer('');

    try {
      const recentHistory = conversations.slice(0, 3).map(item => ({
        question: item.question,
        answer: item.answer
      }));

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: img,
          question: q,
          goal: activeGoal,
          history: recentHistory
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'エラーが発生しました');
      }

      setCurrentAnswer(data.response);
      setRemaining(data.remaining);

      // 会話を保存
      const newConversation: ConversationItem = {
        id: generateId(),
        goalId: activeGoal.id,
        timestamp: Date.now(),
        question: q,
        answer: data.response,
        image: img
      };

      await saveConversationToFirestore(user.uid, newConversation);
      await loadConversations(activeGoal.id);

    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (conv: ConversationItem) => {
    setCurrentAnswer(conv.answer);
    setCurrentImage(conv.image || null);
  };

  const handleDeleteGoal = async () => {
    await loadData();
  };

  // ローディング中
  if (authLoading || isMigrating) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-16 w-16 text-indigo-400 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-white text-xl">
            {isMigrating ? 'データを移行中...' : '読み込み中...'}
          </p>
        </div>
      </div>
    );
  }

  // 未認証の場合は何も表示しない（リダイレクト中）
  if (!user) {
    return null;
  }

  const centerWidth = 100 - leftWidth - rightWidth;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-700 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              🤖 AI サポートアシスタント
            </h1>
          </div>

          <div className="flex-1 max-w-2xl">
            <QuickCaptureButton
              onCapture={handleQuickCapture}
              goal={activeGoal || undefined}
              disabled={isLoading || !activeGoal}
            />
          </div>

          <div className="flex-1 flex items-center justify-end gap-4">
            {remaining !== null && (
              <div className="text-right">
                <p className="text-xs text-gray-400">残り</p>
                <p className="text-xl font-bold text-indigo-400">{remaining}回</p>
              </div>
            )}
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <div style={{ width: `${leftWidth}%` }} className="flex-shrink-0">
          <GoalList
            goals={goals}
            activeGoalId={activeGoal?.id || null}
            onSelectGoal={handleSelectGoal}
            onNewGoal={handleNewGoal}
            onDelete={handleDeleteGoal}
          />
        </div>

        {/* Left Resize Handle */}
        <div
          className="w-1 bg-gray-700 hover:bg-indigo-500 cursor-col-resize flex-shrink-0 transition-colors relative group"
          onMouseDown={() => setIsResizingLeft(true)}
        >
          <div className="absolute inset-0 -mx-1" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-12 bg-gray-700 group-hover:bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-xs text-white">⋮</span>
          </div>
        </div>

        {/* Center Panel */}
        <div style={{ width: `${centerWidth}%` }} className="flex-shrink-0 flex flex-col">
          {(currentAnswer || isLoading) && (
            <div className="bg-gray-900/50 border-b border-gray-700 p-6 overflow-y-auto max-h-[50%]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-indigo-400 mx-auto mb-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-gray-300 text-lg font-medium">AIが画面を分析中...</p>
                  </div>
                </div>
              ) : currentAnswer ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">✨</span>
                    <h2 className="text-2xl font-bold text-white">次のステップ</h2>
                  </div>
                  <AnswerDisplay answer={currentAnswer} />
                  {currentImage && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">解析した画像:</p>
                      <img
                        src={currentImage}
                        alt="解析した画面"
                        className="max-w-md rounded-lg border border-gray-600"
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border-b border-red-500/50 p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <ConversationPane
              conversations={conversations}
              onSelect={handleSelectConversation}
            />
          </div>

          {!currentAnswer && !isLoading && conversations.length === 0 && activeGoal && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-bold text-white mb-2">使い方</h3>
                <p className="text-gray-400 mb-4">
                  上部の「📸 今の画面で次のステップを聞く」ボタンをクリックして、
                  画面をキャプチャしてください。
                </p>
                <p className="text-sm text-gray-500">
                  AIが現在のステップに合わせて、具体的な操作を教えてくれます。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Resize Handle */}
        <div
          className="w-1 bg-gray-700 hover:bg-indigo-500 cursor-col-resize flex-shrink-0 transition-colors relative group"
          onMouseDown={() => setIsResizingRight(true)}
        >
          <div className="absolute inset-0 -mx-1" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-12 bg-gray-700 group-hover:bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-xs text-white">⋮</span>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ width: `${rightWidth}%` }} className="flex-shrink-0">
          <GoalDetails
            goal={activeGoal}
            onEdit={() => {/* TODO */ }}
            onDelete={async () => {
              if (activeGoal && user && confirm('この目標を削除しますか？')) {
                await deleteGoalFromFirestore(user.uid, activeGoal.id);
                await loadData();
              }
            }}
          />
        </div>
      </main>

      <NewGoalModal
        isOpen={isNewGoalModalOpen}
        onClose={() => setIsNewGoalModalOpen(false)}
        onSave={handleSaveGoal}
      />
    </div>
  );
}
