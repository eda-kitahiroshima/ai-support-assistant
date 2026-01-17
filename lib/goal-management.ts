import { Goal, Step } from './types';

const GOALS_STORAGE_KEY = 'goals';

/**
 * 全ての目標を取得
 */
export function getAllGoals(): Goal[] {
    try {
        const stored = localStorage.getItem(GOALS_STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (error) {
        console.error('Failed to get goals:', error);
        return [];
    }
}

/**
 * 目標を保存
 */
export function saveGoal(goal: Goal): void {
    try {
        const goals = getAllGoals();
        const existingIndex = goals.findIndex(g => g.id === goal.id);

        if (existingIndex >= 0) {
            // 既存の目標を更新
            goals[existingIndex] = goal;
        } else {
            // 新規目標を追加
            goals.push(goal);
        }

        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
        console.error('Failed to save goal:', error);
    }
}

/**
 * アクティブな目標を取得
 */
export function getActiveGoal(): Goal | null {
    try {
        const goals = getAllGoals();
        return goals.find(g => g.isActive) || null;
    } catch (error) {
        console.error('Failed to get active goal:', error);
        return null;
    }
}

/**
 * 目標をアクティブに設定
 */
export function setActiveGoal(goalId: string): void {
    try {
        const goals = getAllGoals();

        // 全ての目標を非アクティブに
        goals.forEach(g => g.isActive = false);

        // 指定した目標をアクティブに
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            goal.isActive = true;
        }

        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
        console.error('Failed to set active goal:', error);
    }
}

/**
 * ステップの完了状態を更新
 */
export function updateStepCompletion(
    goalId: string,
    stepId: string,
    completed: boolean
): void {
    try {
        const goals = getAllGoals();
        const goal = goals.find(g => g.id === goalId);

        if (!goal) return;

        const step = goal.steps.find(s => s.id === stepId);
        if (!step) return;

        step.completed = completed;
        step.completedAt = completed ? Date.now() : undefined;

        // 全てのステップが完了したら目標も完了
        const allCompleted = goal.steps.every(s => s.completed);
        if (allCompleted) {
            goal.completedAt = Date.now();
        } else {
            goal.completedAt = undefined;
        }

        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
        console.error('Failed to update step completion:', error);
    }
}

/**
 * 目標を削除（関連する会話も削除）
 */
export function deleteGoal(goalId: string): void {
    try {
        const goals = getAllGoals();
        const filtered = goals.filter(g => g.id !== goalId);
        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(filtered));

        // 関連する会話も削除
        import('./conversation-history').then(module => {
            module.deleteConversationsByGoal(goalId);
        });
    } catch (error) {
        console.error('Failed to delete goal:', error);
    }
}

/**
 * ユニークIDを生成
 */
export function generateGoalId(): string {
    return `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ステップIDを生成
 */
export function generateStepId(): string {
    return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
