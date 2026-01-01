'use client';

import { useState, useEffect } from 'react';

interface Goal {
    objective: string;
    currentStatus: string;
    deadline?: string;
}

interface GoalSetupProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Goal) => void;
}

export default function GoalSetup({ isOpen, onClose, onSave }: GoalSetupProps) {
    const [objective, setObjective] = useState('');
    const [currentStatus, setCurrentStatus] = useState('');
    const [deadline, setDeadline] = useState('');

    useEffect(() => {
        // 既存の目標を読み込む
        const savedGoal = localStorage.getItem('userGoal');
        if (savedGoal) {
            const goal = JSON.parse(savedGoal);
            setObjective(goal.objective || '');
            setCurrentStatus(goal.currentStatus || '');
            setDeadline(goal.deadline || '');
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!objective.trim()) {
            alert('目標を入力してください');
            return;
        }

        const goal: Goal = {
            objective: objective.trim(),
            currentStatus: currentStatus.trim(),
            deadline: deadline.trim() || undefined,
        };

        localStorage.setItem('userGoal', JSON.stringify(goal));
        onSave(goal);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl max-w-2xl w-full border border-gray-700 shadow-2xl">
                {/* ヘッダー */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white">🎯 目標を設定</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            何をしたいかを設定すると、AIがより的確にサポートします
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-3xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                {/* フォーム */}
                <div className="p-6 space-y-6">
                    {/* 目標 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            目標・やりたいこと <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            placeholder="例: WordPressでブログを開設したい&#10;例: Pythonで自動化ツールを作りたい&#10;例: 新しいPCの初期設定を完了したい"
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {/* 現在の状況 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            現在の状況
                        </label>
                        <textarea
                            value={currentStatus}
                            onChange={(e) => setCurrentStatus(e.target.value)}
                            placeholder="例: レンタルサーバーを契約したばかり&#10;例: Pythonはインストール済み&#10;例: PCは届いたが何もしていない"
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {/* 期限（任意） */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            期限（任意）
                        </label>
                        <input
                            type="text"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            placeholder="例: 今週中、1月末まで、など"
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* フッター */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all shadow-lg"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}
