'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { signInWithGoogle, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // 既にログイン済みの場合はホームにリダイレクト
    React.useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');

        try {
            await signInWithGoogle();
            // ログイン成功後、自動的にホームページにリダイレクトされる
        } catch (err: any) {
            console.error(err);
            setError('ログインに失敗しました。もう一度お試しください。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl p-8 shadow-2xl">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🤖</div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            AI サポートアシスタント
                        </h1>
                        <p className="text-gray-400 text-sm">
                            画面をキャプチャして、AIに質問しよう
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Google Sign In Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full py-4 px-6 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-medium transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>ログイン中...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Googleでログイン</span>
                            </>
                        )}
                    </button>

                    {/* Features */}
                    <div className="mt-8 space-y-3">
                        <div className="flex items-start gap-3 text-sm text-gray-400">
                            <span className="text-green-500">✓</span>
                            <span>目標を設定して、ステップを自動生成</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-gray-400">
                            <span className="text-green-500">✓</span>
                            <span>画面をキャプチャして、AIに質問</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-gray-400">
                            <span className="text-green-500">✓</span>
                            <span>進捗を管理して、目標を達成</span>
                        </div>
                    </div>
                </div>

                {/* Privacy Note */}
                <p className="mt-6 text-center text-xs text-gray-500">
                    ログインすることで、利用規約とプライバシーポリシーに同意したことになります
                </p>
            </div>
        </div>
    );
}
