'use client';

import { useState, useEffect } from 'react';
import ImageUpload from '@/components/ImageUpload';
import AnswerDisplay from '@/components/AnswerDisplay';
import QuickCaptureButton from '@/components/QuickCaptureButton';

interface Goal {
  objective: string;
  currentStatus: string;
  deadline?: string;
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  // 目標を読み込む
  useEffect(() => {
    const savedGoal = localStorage.getItem('userGoal');
    if (savedGoal) {
      const parsedGoal = JSON.parse(savedGoal);
      setGoal(parsedGoal);
      setGoalInput(parsedGoal.objective);
    } else {
      setIsEditingGoal(true); // 初回は編集モード
    }
  }, []);

  const handleGoalSave = () => {
    if (!goalInput.trim()) {
      alert('目標を入力してください');
      return;
    }

    const newGoal: Goal = {
      objective: goalInput.trim(),
      currentStatus: '',
    };

    localStorage.setItem('userGoal', JSON.stringify(newGoal));
    setGoal(newGoal);
    setIsEditingGoal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image || !question.trim()) {
      setError('画像と質問の両方を入力してください');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          question: question.trim(),
          goal: goal
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'エラーが発生しました');
      }

      setAnswer(data.response);
      setRemaining(data.remaining);
      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ワンクリックキャプチャ
  const handleQuickCapture = (capturedImage: string, autoQuestion: string) => {
    setImage(capturedImage);
    setQuestion(autoQuestion);
    setError('');
    setAnswer('');

    // 自動的に送信
    setIsLoading(true);

    fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: capturedImage,
        question: autoQuestion,
        goal: goal
      })
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'エラーが発生しました');
        }
        setAnswer(data.response);
        setRemaining(data.remaining);
      })
      .catch((err: any) => {
        setError(err.message || 'エラーが発生しました');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* ヘッダー */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                🤖 AI サポートアシスタント
              </h1>
            </div>
            {remaining !== null && (
              <div className="text-right">
                <p className="text-xs text-gray-400">残り</p>
                <p className="text-xl font-bold text-indigo-400">{remaining}回</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* 目標設定エリア */}
          <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-2xl p-6 border border-indigo-700/50">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🎯</span>
              <div className="flex-1">
                {isEditingGoal ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      今日やりたいこと・目標を教えてください
                    </label>
                    <input
                      type="text"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="例: Google APIの設定方法を知りたい、WordPressでブログを開設したい"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={handleGoalSave}
                      className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all font-medium"
                    >
                      設定完了
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">今日の目標</p>
                      <p className="text-white font-medium">{goal?.objective}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingGoal(true);
                        setGoalInput(goal?.objective || '');
                      }}
                      className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>
            </div>
            {!isEditingGoal && (
              <p className="text-xs text-gray-400 mt-3 ml-12">
                💡 目標を設定すると、AIがより的確な手順を教えてくれます
              </p>
            )}
          </div>

          {/* ワンクリックキャプチャボタン */}
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <QuickCaptureButton
              onCapture={handleQuickCapture}
              goal={goal || undefined}
              disabled={isLoading}
            />
          </div>

          {/* 結果表示エリア */}
          {(answer || isLoading) && (
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-indigo-400 mx-auto mb-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-gray-300 text-lg font-medium">AIが画面を分析中...</p>
                    <p className="text-gray-500 text-sm mt-2">どのボタンを押すべきか判断しています</p>
                  </div>
                </div>
              ) : answer ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    <h2 className="text-xl font-bold text-white">AI のアドバイス</h2>
                  </div>
                  <AnswerDisplay answer={answer} />
                  {image && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">解析した画像:</p>
                      <img
                        src={image}
                        alt="解析した画面"
                        className="max-w-md rounded-lg border border-gray-600"
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* 初期状態のガイド */}
          {!answer && !isLoading && (
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-dashed border-gray-600 text-center">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-bold text-white mb-2">使い方</h3>
              <ol className="text-gray-400 space-y-2 text-left max-w-md mx-auto">
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">1.</span>
                  <span>目標を設定（任意）</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">2.</span>
                  <span>「📸 今の画面で次のステップを聞く」ボタンをクリック</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">3.</span>
                  <span>共有する画面/タブを選択</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">4.</span>
                  <span>AIが「どのボタンを押すべきか」具体的に教えます</span>
                </li>
              </ol>
              <p className="text-sm text-gray-500 mt-6">
                ⚠️ 1日50回まで無料で利用できます
              </p>
            </div>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-gray-700 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>Powered by Google Gemini 2.5 Flash</p>
        </div>
      </footer>
    </div>
  );
}
