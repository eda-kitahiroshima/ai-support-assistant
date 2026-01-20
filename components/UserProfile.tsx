'use client';

import React from 'react';
import { useAuth } from './AuthProvider';

export default function UserProfile() {
    const { user, signOut } = useAuth();

    if (!user) return null;

    const handleSignOut = async () => {
        if (confirm('ログアウトしますか？')) {
            try {
                await signOut();
            } catch (error) {
                alert('ログアウトに失敗しました');
            }
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* User Avatar */}
            {user.photoURL && (
                <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-indigo-500"
                />
            )}

            {/* User Name */}
            <div className="text-sm">
                <p className="text-white font-medium">{user.displayName || 'ユーザー'}</p>
                <p className="text-gray-400 text-xs">{user.email}</p>
            </div>

            {/* Logout Button */}
            <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
                ログアウト
            </button>
        </div>
    );
}
