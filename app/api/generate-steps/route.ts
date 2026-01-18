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

        console.log('Generating steps for goal:', goalTitle);

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
        });

        // シンプルで確実なプロンプト
        const prompt = `以下の目標を達成するために必要なステップを5-8個に分解してください。

目標: ${goalTitle}
${description ? `詳細: ${description}` : ''}

要件:
- 各ステップは具体的で実行可能にしてください
- 初心者でもわかる表現を使ってください
- 時系列順に並べてください
- 最新のベストプラクティスを考慮してください

以下のJSON配列形式で出力してください（コードブロックなし）:
[
  {"title": "ステップ1のタイトル", "description": "ステップ1の説明"},
  {"title": "ステップ2のタイトル", "description": "ステップ2の説明"}
]`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        console.log('AI Response:', response.substring(0, 200));

        // JSONを抽出
        let jsonText = response.trim();

        // コードブロックを除去
        jsonText = jsonText.replace(/```json\s*/g, '');
        jsonText = jsonText.replace(/```\s*/g, '');
        jsonText = jsonText.trim();

        // 最初の[と最後の]を探す
        const firstBracket = jsonText.indexOf('[');
        const lastBracket = jsonText.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1) {
            jsonText = jsonText.substring(firstBracket, lastBracket + 1);
        }

        console.log('Parsed JSON text:', jsonText.substring(0, 200));

        const stepsData = JSON.parse(jsonText);

        console.log('Successfully parsed steps:', stepsData.length);

        return NextResponse.json({ steps: stepsData });
    } catch (error: any) {
        console.error('Failed to generate steps:', error);
        console.error('Error details:', error.message);

        // より詳細なエラーレスポンス
        return NextResponse.json({
            error: 'ステップの生成に失敗しました: ' + error.message,
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
        }, { status: 200 }); // エラーでも200を返してフォールバックステップを使用
    }
}
