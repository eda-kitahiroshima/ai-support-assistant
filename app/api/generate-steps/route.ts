import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest) {
    try {
        const { goalTitle, description } = await request.json();

        if (!goalTitle) {
            return NextResponse.json(
                { error: '目標タイトルが必要です' },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: [{ googleSearchRetrieval: {} }], // Google検索機能を有効化
        });

        const prompt = `あなたは目標達成のサポートをするアシスタントです。
以下の目標を達成するために必要なステップを5-10個に分解してください。

【目標】
${goalTitle}

【詳細・現在の状況】
${description || '特になし'}

【重要な指示】
1. まず、インターネットで「${goalTitle}」に関する最新の情報、チュートリアル、ベストプラクティスを検索してください
2. 検索結果を基に、実践的で具体的なステップを作成してください
3. 初心者でも実行可能な順序で並べてください
4. 各ステップは簡潔で明確にしてください

【要件】
- 各ステップは具体的で実行可能なものにしてください
- 初心者でもわかる表現を使ってください
- ステップは時系列順に並べてください
- 各ステップに短い説明を追加してください
- 最新のツールやベストプラクティスを反映してください

【出力形式】
以下のJSON形式で出力してください：
[
  {
    "title": "ステップのタイトル",
    "description": "ステップの簡単な説明"
  }
]

**重要**: JSONのみを出力し、マークダウンのコードブロック記号やその他の文章は含めないでください。`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // JSONを抽出（マークダウンコードブロックを除去）
        let jsonText = response.trim();

        // ```json または ``` で囲まれている場合は除去
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        // 先頭と末尾の空白を除去
        jsonText = jsonText.trim();

        const stepsData = JSON.parse(jsonText);

        return NextResponse.json({ steps: stepsData });
    } catch (error: any) {
        console.error('Failed to generate steps:', error);

        // エラー時はデフォルトのステップを返す
        return NextResponse.json({
            steps: [
                {
                    title: '目標の詳細を確認',
                    description: '何が必要かを調べる'
                },
                {
                    title: '準備を始める',
                    description: '必要なものを揃える'
                },
                {
                    title: '実行する',
                    description: '実際に作業を進める'
                },
                {
                    title: '完了を確認',
                    description: '目標が達成できたか確認'
                }
            ]
        });
    }
}
