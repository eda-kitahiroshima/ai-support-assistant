import { GoogleGenerativeAI } from '@google/generative-ai';
import { Step } from './types';
import { generateStepId } from './goal-management';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * AIで目標を分析してステップを自動生成
 */
export async function generateSteps(
    goalTitle: string,
    description: string
): Promise<Step[]> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
        });

        const prompt = `あなたは目標達成のサポートをするアシスタントです。
以下の目標を達成するために必要なステップを5-10個に分解してください。

【目標】
${goalTitle}

【詳細・現在の状況】
${description || '特になし'}

【要件】
- 各ステップは具体的で実行可能なものにしてください
- 初心者でもわかる表現を使ってください
- ステップは時系列順に並べてください
- 各ステップに短い説明を追加してください

【出力形式】
以下のJSON形式で出力してください：
[
  {
    "title": "ステップのタイトル",
    "description": "ステップの簡単な説明"
  }
]

JSONのみを出力し、他の文章は含めないでください。`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // JSONを抽出（マークダウンコードブロックを除去）
        let jsonText = response.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const stepsData = JSON.parse(jsonText);

        // Step型に変換
        const steps: Step[] = stepsData.map((step: any) => ({
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
