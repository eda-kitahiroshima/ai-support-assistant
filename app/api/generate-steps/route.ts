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

        // URLと具体的な手順を含むステップを生成するプロンプト
        const prompt = `あなたは目標達成のサポートアシスタントです。以下の目標を達成するための詳細で具体的なステップを作成してください。

【目標】
${goalTitle}

${description ? `【詳細】\n${description}\n` : ''}

【重要な指示】
1. まず、Google検索で「${goalTitle}」について調べてください
2. 公式サイト、チュートリアル、ダウンロードページを探してください
3. 検索結果を基に、以下の観点で具体的なステップ（5-8個）を作成してください：
   - 公式サイトや公式ドキュメントのURL
   - 具体的なダウンロード方法やインストール手順
   - 初期設定や環境構築の方法
   - 簡単な使い方や実践例
   - 具体的なツール名、サービス名、技術名

【ステップの例】
例えば、「WordPressでブログを開設」という目標なら：
1. レンタルサーバーの公式サイト（例: https://www.xserver.ne.jp/）にアクセス
2. アカウント登録とプラン選択（スタンダードプランを推奨）
3. WordPressの自動インストール機能を使用
4. 管理画面にログイン（ドメイン名/wp-admin）
5. テーマを選択してインストール
6. 最初の記事を作成して公開

このように、URLや具体的な手順を含めてください。

【出力形式】
以下のJSON配列のみを出力（コードブロック記号は不要）:
[
  {
    "title": "公式サイトにアクセス",
    "description": "https://example.com にアクセスして、ダウンロードページを開く"
  },
  {
    "title": "ダウンロードとインストール",
    "description": "インストーラーをダウンロードし、実行してセットアップを完了する"
  }
]`;

        console.log('Calling Gemini API with search grounding...');

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        console.log('AI Response received, length:', response.length);
        console.log('First 500 chars:', response.substring(0, 500));

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
        console.log('JSON text length:', jsonText.length);

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
                    title: '公式サイトを探す',
                    description: 'Google検索で公式サイトやダウンロードページを探す'
                },
                {
                    title: 'ダウンロードする',
                    description: '公式サイトからインストーラーやファイルをダウンロード'
                },
                {
                    title: 'インストールと初期設定',
                    description: 'ダウンロードしたファイルを実行して、初期設定を完了'
                },
                {
                    title: '基本的な使い方を学ぶ',
                    description: 'チュートリアルやドキュメントで基本操作を確認'
                },
                {
                    title: '簡単なプロジェクトを作る',
                    description: 'Hello Worldなど、簡単なプロジェクトを作成して動作確認'
                },
                {
                    title: '機能を追加する',
                    description: 'チュートリアルを参考に、徐々に機能を追加'
                }
            ]
        }, { status: 200 });
    }
}
