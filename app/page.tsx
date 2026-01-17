'use client';

import { useState, useEffect } from 'react';
import QuickCaptureButton from '@/components/QuickCaptureButton';
import AnswerDisplay from '@/components/AnswerDisplay';
import GoalList from '@/components/GoalList';
import GoalDetails from '@/components/GoalDetails';
import ConversationPane from '@/components/ConversationPane';
import NewGoalModal from '@/components/NewGoalModal';
import { Goal, ConversationItem } from '@/lib/types';
import {
  getAllGoals,
  getActiveGoal,
  setActiveGoal,
  saveGoal,
  deleteGoal
} from '@/lib/goal-management';
import {
  getConversationsByGoal,
  saveConversation,
  generateId
} from '@/lib/conversation-history';

export default function Home() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoal, setActiveGoalState] = useState<Goal | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);

  // 初期データ読み込み
  useEffect(() => {
    loadGoals();

    // 目標更新イベントリスナー（ステップチェック時）
    const handleGoalUpdate = () => {
      loadGoals();
    };
    window.addEventListener('goal-updated', handleGoalUpdate);

    return () => {
      window.removeEventListener('goal-updated', handleGoalUpdate);
    };
  }, []);

  // アクティブな目標が変わったら会話を読み込み
  useEffect(() => {
    if (activeGoal) {
      const convs = getConversationsByGoal(activeGoal.id);
      setConversations(convs);
    } else {
      setConversations([]);
    }
  }, [activeGoal?.id]);

  const loadGoals = () => {
    const allGoals = getAllGoals();
    setGoals(allGoals);

    const active = getActiveGoal();
    setActiveGoalState(active);

    // 目標がない場合はモーダルを開く
    if (allGoals.length === 0) {
      setIsNewGoalModalOpen(true);
    }
  };

  const handleSelectGoal = (goalId: string) => {
    setActiveGoal(goalId);
    loadGoals();
    setCurrentAnswer('');
    setCurrentImage(null);
  };

  const handleNewGoal = () => {
    setIsNewGoalModalOpen(true);
  };

  const handleSaveGoal = (newGoal: Goal) => {
    // 既存の全ての目標を非アクティブに
    const allGoals = getAllGoals();
    allGoals.forEach(g => {
      g.isActive = false;
      saveGoal(g);
    });

    // 新しい目標を保存
    saveGoal(newGoal);

    loadGoals();
    setIsNewGoalModalOpen(false);
  };

  const handleQuickCapture = (capturedImage: string, autoQuestion: string) => {
    setCurrentImage(capturedImage);
    submitQuestion(capturedImage, autoQuestion);
  };

  const submitQuestion = async (img: string, q: string) => {
    if (!activeGoal) {
      setError('先に目標を選択してください');
      return;
    }

    setIsLoading(true);
    setError('');
    setCurrentAnswer('');

    try {
      // 直近3件の会話を取得
      const recentHistory = getConversationsByGoal(activeGoal.id, 3).map(item => ({
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
      saveConversation(newConversation);

      // 会話リストを更新
      setConversations(getConversationsByGoal(activeGoal.id));

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

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden">
      {/* Top Bar - キャプチャボタン */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-700 p-4">
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

          <div className="flex-1 text-right">
            {remaining !== null && (
              <div>
                <p className="text-xs text-gray-400">残り</p>
                <p className="text-xl font-bold text-indigo-400">{remaining}回</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - 3分割 */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - 目標リスト (25%) */}
        <div className="w-1/4 min-w-[250px] max-w-[350px]">
          <GoalList
            goals={goals}
            activeGoalId={activeGoal?.id || null}
            onSelectGoal={handleSelectGoal}
            onNewGoal={handleNewGoal}
          />
        </div>

        {/* Center Panel - 会話履歴 (45%) */}
        <div className="flex-1 flex flex-col">
          {/* Answer Display Area */}
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

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border-b border-red-500/50 p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Conversation History */}
          <div className="flex-1 overflow-hidden">
            <ConversationPane
              conversations={conversations}
              onSelect={handleSelectConversation}
            />
          </div>

          {/* Initial Guide */}
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


        {/* Right Panel - 目標詳細 (30%) */}
        <div className="w-1/3 min-w-[300px] max-w-[400px]">
          <GoalDetails
            goal={activeGoal}
            onEdit={() => {/* TODO: 編集機能 */ }}
            onDelete={() => {
              if (activeGoal && confirm('この目標を削除しますか？')) {
                deleteGoal(activeGoal.id);
                loadGoals();
              }
            }}
          />
        </div>
      </main>

      {/* New Goal Modal */}
      <NewGoalModal
        isOpen={isNewGoalModalOpen}
        onClose={() => setIsNewGoalModalOpen(false)}
        onSave={handleSaveGoal}
      />
    </div>
  );
}
