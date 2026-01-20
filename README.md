# AI サポートアシスタント

画面をキャプチャしてAIに質問できるWebアプリケーションです。目標を設定し、ステップを自動生成して、進捗を管理できます。

## 機能

- 🎯 **目標管理**: AIが目標を自動的にステップ分解
- 📸 **画面キャプチャ**: ワンクリックで画面を撮影してAIに質問
- 💬 **会話履歴**: 各目標ごとに会話を管理
- ✅ **進捗管理**: ステップの完了状況をトラッキング
- 🔐 **ユーザー認証**: Googleアカウントでログイン
- ☁️ **クラウド同期**: Firestoreでデータを自動同期

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/eda-kitahiroshima/ai-support-assistant.git
cd ai-support-assistant/web-app
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `ai-support-assistant`）
4. Google Analyticsは任意で設定

### 4. Authentication の有効化

1. Firebase Console で作成したプロジェクトを開く
2. 左メニューから「Authentication」を選択
3. 「始める」をクリック
4. 「Sign-in method」タブを選択
5. 「Google」を有効化

###  5. Firestore Database の作成

1. 左メニューから「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. **テストモードで開始**（後でルールを変更）
4. ロケーションを選択（asia-northeast1推奨）

### 6. Web アプリの登録

1. プロジェクト設定（⚙アイコン）> 「全般」
2. 「マイアプリ」セクションで「</>」（Web）を選択
3. アプリのニックネームを入力
4. 「アプリを登録」をクリック
5. 表示される設定情報をコピー

### 7. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

```bash
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase設定（Firebaseコンソールから取得）
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### 8. Firestore セキュリティルールの設定

Firebase Console > Firestore Database > ルール タブで以下を設定：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のデータのみアクセス可能
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

「公開」をクリックしてルールを適用してください。

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

### ビルド

```bash
npm run build
```

### 本番環境へのデプロイ

Vercelでのデプロイを推奨：

1. [Vercel](https://vercel.com/) にサインアップ
2. GitHubリポジトリを接続
3. 環境変数を設定（`.env.local`と同じ内容）
4. デプロイ

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **認証**: Firebase Authentication
- **データベース**: Cloud Firestore
- **AI**: Google Gemini 1.5 Flash
- **ホスティング**: Vercel

## ライセンス

MIT
