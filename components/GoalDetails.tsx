'use client';

import React from 'react';
import { Goal } from '@/lib/types';
import { updateStepCompletion } from '@/lib/goal-management';

interface GoalDetailsProps {
    goal: Goal | null;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function GoalDetails({ goal, onEdit, onDelete }: GoalDetailsProps) {
    if (!goal) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-900 border-l border-gray-700 text-gray-500">
                <div className="text-center">
                    <p className="text-4xl mb-2">🎯</p>
                    <p>目標を選択してください</p>
                </div>
            </div>
        );
    }

    const handleToggleStep = (stepId: string, completed: boolean) => {
        updateStepCompletion(goal.id, stepId, completed);
        // 親コンポーネントに再レンダリングを促す
        window.dispatchEvent(new Event('goal-updated'));
    };

    const progressPercentage = goal.steps.length > 0
        ? Math.round((goal.steps.filter(s => s.completed).length / goal.steps.length) * 100)
        : 0;

    const currentStepIndex = goal.steps.findIndex(s => !s.completed);

    return (
        <div className="h-full flex flex-col bg-gray-900 border-l border-gray-700">
            {/* 上部30% - 目標情報 */}
            <div className="h-[30%] min-h-[150px] flex flex-col border-b border-gray-700 overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">🎯</span>
                                <h2 className="text-lg font-bold text-white">{goal.title}</h2>
                            </div>
                            {goal.description && (
                                <p className="text-sm text-gray-400 mt-1">{goal.description}</p>
                            )}
                        </div>

                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="text-gray-400 hover:text-white text-sm p-1"
                                title="編集"
                            >
                                ✎
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="p-4 flex-shrink-0">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>進捗</span>
                        <span className={progressPercentage === 100 ? 'text-green-400 font-bold' : 'text-indigo-400'}>
                            {progressPercentage}%
                        </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${progressPercentage === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {goal.steps.filter(s => s.completed).length} / {goal.steps.length} ステップ完了
                    </p>
                </div>
            </div>

            {/* 下部70% - ステップリスト */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                    <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                        <span>📝</span>
                        <span>ステップ</span>
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {goal.steps.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-4xl mb-2">📝</p>
                                <p className="text-sm">ステップがありません</p>
                                <p className="text-xs mt-1">目標作成時にAIでステップを生成してください</p>
                            </div>
                        ) : (
                            goal.steps.map((step, index) => {
                                const isCurrent = index === currentStepIndex;

                                return (
                                    <div
                                        key={step.id}
                                        className={`
                      p-3 rounded-lg border transition-all
                      ${step.completed
                                                ? 'bg-gray-800/30 border-gray-700/50'
                                                : isCurrent
                                                    ? 'bg-indigo-900/20 border-indigo-700/50'
                                                    : 'bg-gray-800/50 border-gray-700'
                                            }
                    `}
                                    >
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={step.completed}
                                                onChange={(e) => handleToggleStep(step.id, e.target.checked)}
                                                className="mt-1 w-5 h-5 rounded border-gray-600 text-green-600 focus:ring-2 focus:ring-indigo-500"
                                            />

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {isCurrent && !step.completed && (
                                                        <span className="text-indigo-400">▶️</span>
                                                    )}
                                                    <span className={`
                            font-medium
                            ${step.completed
                                                            ? 'text-gray-500 line-through'
                                                            : isCurrent
                                                                ? 'text-white'
                                                                : 'text-gray-300'
                                                        }
                          `}>
                                                        {index + 1}. {step.title}
                                                    </span>
                                                </div>

                                                <p className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    {step.description}
                                                </p>

                                                {step.completedAt && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        ✓ {new Date(step.completedAt).toLocaleDateString('ja-JP')} に完了
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Completion Message */}
                    {progressPercentage === 100 && (
                        <div className="mt-6 p-4 bg-green-900/20 border border-green-700/50 rounded-lg text-center">
                            <p className="text-2xl mb-2">🎉</p>
                            <p className="text-green-400 font-bold mb-1">目標達成おめでとうございます！</p>
                            <p className="text-sm text-gray-400">全てのステップが完了しました</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
