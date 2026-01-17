'use client';

import React, { useState } from 'react';
import { Goal, Step } from '@/lib/types';
import { generateSteps } from '@/lib/ai-step-generator';
import { generateGoalId } from '@/lib/goal-management';

interface NewGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Goal) => void;
}

export default function NewGoalModal({ isOpen, onClose, onSave }: NewGoalModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState<Step[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerateSteps = async () => {
        if (!title.trim()) {
            setError('目標タイトルを入力してください');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            const generatedSteps = await generateSteps(title, description);
            setSteps(generatedSteps);
        } catch (err: any) {
            setError('ステップの生成中にエラーが発生しました');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        if (!title.trim()) {
            setError('目標タイトルを入力してください');
            return;
        }

        if (steps.length === 0) {
            setError('AIでステップを生成してください');
            return;
        }

        const newGoal: Goal = {
            id: generateGoalId(),
            title: title.trim(),
            description: description.trim(),
            steps,
            createdAt: Date.now(),
            isActive: true,
        };

        onSave(newGoal);

        // Reset form
        setTitle('');
        setDescription('');
        setSteps([]);
        setError('');
    };

    const handleStepEdit = (index: number, field: 'title' | 'description', value: string) => {
        const newSteps = [...steps];
        newSteps[index][field] = value;
        setSteps(newSteps);
    };

    const handleStepDelete = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>🎯</span>
                        <span>新しい目標を作成</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            目標タイトル *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="例: WordPressでブログを開設したい"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            詳細・現在の状況（任意）
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="例: PCは持っているが何もしていない状態です"
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {/* Generate Button */}
                    {steps.length === 0 && (
                        <button
                            onClick={handleGenerateSteps}
                            disabled={isGenerating}
                            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>AIがステップを生成中...</span>
                                </>
                            ) : (
                                <>
                                    <span>🤖</span>
                                    <span>AIでステップを自動生成</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Generated Steps */}
                    {steps.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-white">
                                    生成されたステップ ({steps.length}個)
                                </h3>
                                <button
                                    onClick={handleGenerateSteps}
                                    disabled={isGenerating}
                                    className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                                >
                                    再生成
                                </button>
                            </div>

                            <div className="space-y-3">
                                {steps.map((step, index) => (
                                    <div key={step.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <span className="text-lg font-bold text-indigo-400">{index + 1}</span>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={step.title}
                                                    onChange={(e) => handleStepEdit(index, 'title', e.target.value)}
                                                    className="w-full px-2 py-1 bg-transparent border-b border-gray-600 text-white focus:outline-none focus:border-indigo-500 mb-2"
                                                />
                                                <textarea
                                                    value={step.description}
                                                    onChange={(e) => handleStepEdit(index, 'description', e.target.value)}
                                                    rows={2}
                                                    className="w-full px-2 py-1 bg-transparent border-b border-gray-600 text-sm text-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleStepDelete(index)}
                                                className="text-gray-500 hover:text-red-400 text-xl"
                                                title="削除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={steps.length === 0}
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}
