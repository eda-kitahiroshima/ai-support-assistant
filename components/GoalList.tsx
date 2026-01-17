'use client';

import React from 'react';
import { Goal } from '@/lib/types';

interface GoalListProps {
    goals: Goal[];
    activeGoalId: string | null;
    onSelectGoal: (goalId: string) => void;
    onNewGoal: () => void;
}

export default function GoalList({
    goals,
    activeGoalId,
    onSelectGoal,
    onNewGoal
}: GoalListProps) {
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

    return (
        <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📋</span>
                    <span>目標リスト</span>
                </h2>
            </div>

            {/* Goals List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sortedGoals.map((goal) => {
                    const isActive = goal.id === activeGoalId;
                    const progress = getProgressPercentage(goal);
                    const isCompleted = goal.completedAt !== undefined;

                    return (
                        <div
                            key={goal.id}
                            onClick={() => onSelectGoal(goal.id)}
                            className={`
                p-3 rounded-lg cursor-pointer transition-all
                ${isActive
                                    ? 'bg-indigo-900/50 border-2 border-indigo-500'
                                    : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                                }
                ${isCompleted ? 'opacity-60' : ''}
              `}
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-300'} line-clamp-2`}>
                                    {isActive && <span className="text-indigo-400">● </span>}
                                    {goal.title}
                                </h3>
                                {isCompleted && <span className="text-green-500 text-xl">✓</span>}
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-2">
                                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'
                                            }`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Progress Text */}
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">
                                    {goal.steps.filter(s => s.completed).length}/{goal.steps.length} 完了
                                </span>
                                <span className={progress === 100 ? 'text-green-400 font-bold' : 'text-indigo-400'}>
                                    {progress}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* New Goal Button */}
            <div className="p-3 border-t border-gray-700">
                <button
                    onClick={onNewGoal}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                    <span className="text-xl">+</span>
                    <span>新しい目標</span>
                </button>
            </div>
        </div>
    );
}
