import { Step } from './types';
import { generateStepId } from './goal-management';

/**
 * AIで目標を分析してステップを自動生成（サーバーサイドAPI経由）
 */
export async function generateSteps(
    goalTitle: string,
    description: string
): Promise<Step[]> {
    try {
        const response = await fetch('/api/generate-steps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                goalTitle,
                description
            })
        });

        if (!response.ok) {
            throw new Error('ステップの生成に失敗しました');
        }

        const data = await response.json();

        // Step型に変換
        const steps: Step[] = data.steps.map((step: any) => ({
            id: generateStepId(),
            title: step.title,
            description: step.description,
            completed: false,
        }));

        return steps;
    } catch (error: any) {
        console.error('Failed to generate steps:', error);

        // エラー時はデフォルトのステップを返す
        return [
            {
                id: generateStepId(),
                title: '目標の詳細を確認',
                description: '何が必要かを調べる',
                completed: false,
            },
            {
                id: generateStepId(),
                title: '準備を始める',
                description: '必要なものを揃える',
                completed: false,
            },
            {
                id: generateStepId(),
                title: '実行する',
                description: '実際に作業を進める',
                completed: false,
            },
            {
                id: generateStepId(),
                title: '完了を確認',
                description: '目標が達成できたか確認',
                completed: false,
            },
        ];
    }
}
