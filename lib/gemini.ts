import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// デバッグ: APIキーの存在確認
if (!apiKey) {
    console.error('❌ GEMINI_API_KEY が設定されていません！');
} else {
    console.log('✅ GEMINI_API_KEY が読み込まれました:', apiKey.substring(0, 10) + '...');
}

export interface AIResponse {
    summary: string;
    causes: string[];
    steps: string[];
    additionalInfo: string[];
}

export async function analyzeImage(
    imageBase64: string,
    question: string
): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
    });

    const systemPrompt = `あなたはPC操作のサポート係です。ユーザーのスクリーンショットと質問を見て、以下の形式で回答してください：

## 状況要約
[スクリーンショットから読み取れる状況を簡潔に説明]

## 原因候補（優先順）
1. [最も可能性が高い原因]
2. [次に考えられる原因]
3. [その他の原因]

## すぐ試せる手順
1. [具体的な操作手順1]
2. [具体的な操作手順2]
3. [具体的な操作手順3]

## 追加で確認したい情報
- [確認すべき設定やログなど]
- [その他、問題解決に役立つ情報]

必ず上記の構造で回答し、ユーザーが即座に行動できる具体的な手順を提供してください。`;

    try {
        // Base64文字列からMIMEタイプとデータを抽出
        const mimeMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (!mimeMatch) {
            throw new Error('無効な画像形式です');
        }

        const mimeType = mimeMatch[1];
        const base64Data = mimeMatch[2];

        const result = await model.generateContent([
            `${systemPrompt}\n\nユーザーの質問: ${question}`,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = result.response;
        return response.text();
    } catch (error: any) {
        console.error('Gemini API Error:', error);

        // より詳細なエラーメッセージ
        if (error.message?.includes('API key')) {
            throw new Error('APIキーが無効です。.env.localファイルを確認してください。');
        }
        if (error.message?.includes('404')) {
            throw new Error('Gemini APIモデルが見つかりません。APIキーが正しいか確認してください。');
        }

        throw new Error(`画像解析エラー: ${error.message || '不明なエラー'}`);
    }
}

export interface Goal {
    objective: string;
    currentStatus: string;
    deadline?: string;
}

/**
 * 目標コンテキスト付きで画像を解析
 */
export async function analyzeImageWithGoal(
    imageBase64: string,
    question: string,
    goal?: Goal
): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
    });

    // 目標がある場合はコンテキストを追加
    const goalContext = goal
        ? `【ユーザーの目標】
- 目標: ${goal.objective}
- 現在の状況: ${goal.currentStatus}
${goal.deadline ? `- 期限: ${goal.deadline}` : ''}

`
        : '';

    const systemPrompt = `あなたはPC操作のサポート係です。ユーザーのスクリーンショットと質問を見て、以下の形式で回答してください：

## 状況要約
[スクリーンショットから読み取れる状況を簡潔に説明]

## 次のステップ（優先順）
1. [まず最初にやるべきこと]
2. [その次にやるべきこと]
3. [さらに必要なこと]

## 具体的な操作手順
**重要: 画面に表示されている要素（ボタン名、リンク、入力欄など）を具体的に指定してください**

1. **[操作1]**
   - 画面の[位置]にある「[ボタン/リンク名]」をクリック
   - または、[入力欄の名前]に「[入力する値]」を入力
   
2. **[操作2]**
   - [具体的な要素名]を探して[操作]
   
3. **[操作3]**
   - [詳細な手順]

## 注意点・ヒント
- [気をつけるべきこと]
- [うまくいかない場合の対処法]
- [見落としがちなポイント]

**画面上の要素を具体的に指示すること！** 例：
- 「右上の『設定』ボタンをクリック」
- 「API Key という欄に、取得したキーを貼り付け」
- 「画面下部の青い『保存』ボタンを押す」

必ず上記の構造で回答し、ユーザーが迷わず操作できるよう、画面に見える要素を具体的に指示してください。${goal ? '\n\nユーザーの最終目標を常に意識して、そこに向かって進むためのアドバイスをしてください。' : ''}`;

    try {
        // Base64文字列からMIMEタイプとデータを抽出
        const mimeMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (!mimeMatch) {
            throw new Error('無効な画像形式です');
        }

        const mimeType = mimeMatch[1];
        const base64Data = mimeMatch[2];

        const result = await model.generateContent([
            `${goalContext}${systemPrompt}\n\nユーザーの質問: ${question}`,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = result.response;
        return response.text();
    } catch (error: any) {
        console.error('Gemini API Error:', error);

        // より詳細なエラーメッセージ
        if (error.message?.includes('API key')) {
            throw new Error('APIキーが無効です。.env.localファイルを確認してください。');
        }
        if (error.message?.includes('404')) {
            throw new Error('Gemini APIモデルが見つかりません。APIキーが正しいか確認してください。');
        }

        throw new Error(`画像解析エラー: ${error.message || '不明なエラー'}`);
    }
}

