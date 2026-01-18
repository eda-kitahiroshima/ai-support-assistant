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

        // Google Search groundingを有効化
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: [{ googleSearchRetrieval: {} }]
        });

        // 検索を明示的に指示するプロンプト
        const prompt = `あなたは目標達成のサポートをするアシスタントです。

【重要】まず、Google検索で「${goalTitle}」に関する最新の情報、チュートリアル、公式ドキュメント、ベストプラクティスを検索してください。

【目標】
${goalTitle}

${description ? `【詳細】\n${description}` : ''}

【タスク】
1. 上記の目標について、インターネットで検索して最新の情報を収集してください
2. 検索結果を基に、実践的で具体的なステップ（5-8個）を作成してください
3. 初心者でも実行可能な順序で並べてください
4. 各ステップには、具体的なツール名、サービス名、技術名を含めてください

【出力形式】
以下のJSON配列のみを出力してください（説明文やコードブロック記号は不要）:
[
  {
    "title": "ステップ1のタイトル",
    "description": "具体的な説明（ツール名やサービス名を含む）"
  },
  {
    "title": "ステップ2のタイトル",
    "description": "具体的な説明"
  }
]`;

        console.log('Calling Gemini API with search grounding...');

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        console.log('AI Response received, length:', response.length);
        console.log('First 300 chars:', response.substring(0, 300));

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

        console.log('Attempting to parse JSON...');

        const stepsData = JSON.parse(jsonText);

        if (!Array.isArray(stepsData) || stepsData.length === 0) {
            throw new Error('Invalid steps data format');
        }

        console.log('Successfully generated', stepsData.length, 'steps');

        return NextResponse.json({ steps: stepsData });

    } catch (error: any) {
        console.error('Failed to generate steps:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);

        // エラー時はデフォルトのステップを返す
        return NextResponse.json({
            error: 'ステップ生成でエラーが発生しました: ' + error.message,
            steps: [
                {
                    title: '目標について調べる',
                    description: 'インターネットで情報を検索し、何が必要かを確認する'
                },
                {
                    title: '必要なツールを準備',
                    description: '開発環境やアカウントなど、必要なものを揃える'
                },
                {
                    title: '基礎を学ぶ',
                    description: 'チュートリアルやドキュメントで基本的な使い方を学ぶ'
                },
                {
                    title: '小さく始める',
                    description: '簡単なプロジェクトから実際に手を動かして試す'
                },
                {
                    title: '機能を追加',
                    description: '徐々に機能を追加して、目標に近づける'
                },
                {
                    title: '完成と共有',
                    description: '最終的な確認をして、必要に応じて公開・共有する'
                }
            ]
        }, { status: 200 });
    }
}
