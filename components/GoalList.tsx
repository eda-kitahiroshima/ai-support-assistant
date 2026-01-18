'use client';

import React, { useState } from 'react';
import { Goal } from '@/lib/types';
import { clearAllGoals, deleteGoal } from '@/lib/goal-management';

interface GoalListProps {
    goals: Goal[];
    activeGoalId: string | null;
    onSelectGoal: (goalId: string) => void;
    onNewGoal: () => void;
    onClearAll?: () => void;
    onDelete?: () => void;
}

export default function GoalList({
    goals,
    activeGoalId,
    onSelectGoal,
    onNewGoal,
    onClearAll,
    onDelete
}: GoalListProps) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const sortedGoals = [...goals].sort((a, b) => {
        // アクティブな目標を最初に
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        // 未完了を優先
        if (!a.completedAt && b.completedAt) return -1;
        if (a.completedAt && !b.completedAt) return 1;
        // 作成日時で降順
        return b.createdAt - a.createdAt;
    });

    const getProgressPercentage = (goal: Goal) => {
        if (goal.steps.length === 0) return 0;
        const completed = goal.steps.filter(s => s.completed).length;
        return Math.round((completed / goal.steps.length) * 100);
    };

    const handleClearAll = () => {
        if (confirm('本当に全ての目標を削除しますか？\n\n全ての目標と会話履歴が削除されます。\nこの操作は取り消せません。')) {
            clearAllGoals();
            if (onClearAll) {
                onClearAll();
            } else {
                window.location.reload();
            }
        }
    };

    const handleDeleteSingle = (goalId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('この目標を削除しますか？\n\n関連する会話履歴も削除されます。')) {
            deleteGoal(goalId);
            if (onDelete) {
                onDelete();
            } else {
                window.location.reload();
            }
        }
    };

    const handleToggleSelection = (goalId: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(goalId)) {
            newSelected.delete(goalId);
        } else {
            newSelected.add(goalId);
        }
        setSelectedIds(newSelected);
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;

        if (confirm(`選択した${selectedIds.size}件の目標を削除しますか？\n\n関連する会話履歴も削除されます。`)) {
            selectedIds.forEach(id => deleteGoal(id));
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            if (onDelete) {
                onDelete();
            } else {
                window.location.reload();
            }
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.size === sortedGoals.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(sortedGoals.map(g => g.id)));
        }
    };

    const handleCancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>📋</span>
                        <span>目標リスト</span>
                    </h2>

                    {!isSelectionMode && goals.length > 0 && (
                        <button
                            onClick={() => setIsSelectionMode(true)}
                            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                            title="複数選択モード"
                        >
                            選択
                        </button>
                    )}
                </div>

                {/* Selection Mode Header */}
                {isSelectionMode && (
                    <div className="flex items-center justify-between text-sm">
                        <button
                            onClick={handleSelectAll}
                            className="text-indigo-400 hover:text-indigo-300"
                        >
                            {selectedIds.size === sortedGoals.length ? '全解除' : '全選択'}
                        </button>
                        <span className="text-gray-400">
                            {selectedIds.size}件選択中
                        </span>
                    </div>
                )}
            </div>

            {/* Goals List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sortedGoals.map((goal) => {
                    const isActive = goal.id === activeGoalId;
                    const progress = getProgressPercentage(goal);
                    const isCompleted = goal.completedAt !== undefined;
                    const isSelected = selectedIds.has(goal.id);

                    return (
                        <div
                            key={goal.id}
                            onClick={() => {
                                if (isSelectionMode) {
                                    handleToggleSelection(goal.id);
                                } else {
                                    onSelectGoal(goal.id);
                                }
                            }}
                            className={`
                p-3 rounded-lg cursor-pointer transition-all relative
                ${isSelectionMode && isSelected
                                    ? 'bg-indigo-900/50 border-2 border-indigo-500'
                                    : isActive && !isSelectionMode
                                        ? 'bg-indigo-900/50 border-2 border-indigo-500'
                                        : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                                }
                ${isCompleted ? 'opacity-60' : ''}
              `}
                        >
                            {/* Selection Mode Checkbox */}
                            {isSelectionMode && (
                                <div className="absolute top-2 left-2">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelection(goal.id)}
                                        className="w-5 h-5 rounded border-gray-600 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}

                            {/* Delete Button (Normal Mode) */}
                            {!isSelectionMode && (
                                <button
                                    onClick={(e) => handleDeleteSingle(goal.id, e)}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="削除"
                                >
                                    <span className="text-lg">×</span>
                                </button>
                            )}

                            <div className={`flex items-start justify-between gap-2 mb-2 ${isSelectionMode ? 'ml-7' : ''}`}>
                                <h3 className={`font-medium text-sm ${isActive && !isSelectionMode ? 'text-white' : 'text-gray-300'} line-clamp-2`}>
                                    {isActive && !isSelectionMode && <span className="text-indigo-400">● </span>}
                                    {goal.title}
                                </h3>
                                {isCompleted && <span className="text-green-500 text-xl">✓</span>}
                            </div>

                            {/* Progress Bar */}
                            <div className={`mb-2 ${isSelectionMode ? 'ml-7' : ''}`}>
                                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Progress Text */}
                            <div className={`flex items-center justify-between text-xs ${isSelectionMode ? 'ml-7' : ''}`}>
                                <span className="text-gray-400">
                                    {goal.steps.filter(s => s.completed).length}/{goal.steps.length} 完了
                                </span>
                                <span className={progress === 100 ? 'text-green-400 font-bold' : 'text-indigo-400'}>
                                    {progress}%
                                </span>
                            </div>

                            {/* Hover effect parent class */}
                            <div className="group"></div>
                        </div>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="p-3 border-t border-gray-700 space-y-2">
                {isSelectionMode ? (
                    <>
                        {/* Delete Selected Button */}
                        <button
                            onClick={handleDeleteSelected}
                            disabled={selectedIds.size === 0}
                            className="w-full py-3 px-4 bg-red-900 hover:bg-red-800 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <span>🗑️</span>
                            <span>選択した{selectedIds.size}件を削除</span>
                        </button>

                        {/* Cancel Button */}
                        <button
                            onClick={handleCancelSelection}
                            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-all"
                        >
                            キャンセル
                        </button>
                    </>
                ) : (
                    <>
                        {/* New Goal Button */}
                        <button
                            onClick={onNewGoal}
                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">+</span>
                            <span>新しい目標</span>
                        </button>

                        {/* Clear All Goals Button */}
                        {goals.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="w-full py-2 px-4 bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border border-gray-700 hover:border-red-700"
                            >
                                <span>🗑️</span>
                                <span>全ての目標を削除</span>
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
