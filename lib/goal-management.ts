import { Goal, Step } from './types';

const STORAGE_KEY = 'goals';

/**
 * 全ての目標を取得
 */
export function getAllGoals(): Goal[] {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load goals:', error);
        return [];
    }
}

/**
 * 目標を保存
 */
export function saveGoal(goal: Goal): void {
    if (typeof window === 'undefined') return;

    try {
        const goals = getAllGoals();
        const index = goals.findIndex(g => g.id === goal.id);

        if (index >= 0) {
            goals[index] = goal;
        } else {
            goals.push(goal);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
        console.error('Failed to save goal:', error);
    }
}

/**
 * アクティブな目標を取得
 */
export function getActiveGoal(): Goal | null {
    const goals = getAllGoals();
    return goals.find(g => g.isActive) || null;
}

/**
 * アクティブな目標を設定
 */
export function setActiveGoal(goalId: string): void {
    const goals = getAllGoals();

    goals.forEach(g => {
        g.isActive = g.id === goalId;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

/**
 * ステップの完了状態を更新
 */
export function updateStepCompletion(goalId: string, stepId: string, completed: boolean): void {
    const goals = getAllGoals();
    const goal = goals.find(g => g.id === goalId);

    if (!goal) return;

    const step = goal.steps.find(s => s.id === stepId);
    if (!step) return;

    step.completed = completed;
    step.completedAt = completed ? Date.now() : undefined;

    // 全てのステップが完了したら目標も完了にする
    const allCompleted = goal.steps.every(s => s.completed);
    if (allCompleted && !goal.completedAt) {
        goal.completedAt = Date.now();
    } else if (!allCompleted && goal.completedAt) {
        goal.completedAt = undefined;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

/**
 * 目標を削除
 */
export function deleteGoal(goalId: string): void {
    if (typeof window === 'undefined') return;

    try {
        const goals = getAllGoals();
        const filtered = goals.filter(g => g.id !== goalId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

        // 関連する会話も削除
        import('./conversation-history').then(({ deleteConversationsByGoal }) => {
            deleteConversationsByGoal(goalId);
        });
    } catch (error) {
        console.error('Failed to delete goal:', error);
    }
}

/**
 * 全ての目標を削除
 */
export function clearAllGoals(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('All goals cleared');

        // 全ての会話も削除
        import('./conversation-history').then(({ clearAllConversations }) => {
            clearAllConversations();
        });
    } catch (error) {
        console.error('Failed to clear goals:', error);
    }
}

/**
 * 目標IDを生成
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
