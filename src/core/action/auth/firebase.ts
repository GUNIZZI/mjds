'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

interface FirebaseAuthResponse {
    localId: string;
    email: string;
    idToken: string;
    refreshToken: string;
    expiresIn: string;
}

interface FirebaseError {
    error: {
        code: number;
        message: string;
        errors: Array<{
            message: string;
            domain: string;
            reason: string;
        }>;
    };
}

// 로그인 서버 액션
export async function signInWithEmail(email: string, password: string) {
    try {
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = data as FirebaseError;
            let errorMessage = '로그인에 실패했습니다.';

            if (error.error.message === 'EMAIL_NOT_FOUND') {
                errorMessage = '등록되지 않은 이메일입니다.';
            } else if (error.error.message === 'INVALID_PASSWORD') {
                errorMessage = '비밀번호가 올바르지 않습니다.';
            } else if (error.error.message === 'INVALID_LOGIN_CREDENTIALS') {
                errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
            } else if (error.error.message === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
                errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
            }

            return { success: false, error: errorMessage };
        }

        const authData = data as FirebaseAuthResponse;

        // 쿠키에 토큰 저장 (httpOnly, secure)
        const cookieStore = await cookies();
        cookieStore.set('firebase-token', authData.idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: parseInt(authData.expiresIn),
            path: '/',
        });

        cookieStore.set('firebase-refresh-token', authData.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30, // 30일
            path: '/',
        });

        return {
            success: true,
            user: {
                uid: authData.localId,
                email: authData.email,
            },
        };
    } catch (error) {
        console.error('Server auth error:', error);
        return { success: false, error: '서버 오류가 발생했습니다.' };
    }
}

// 회원가입 서버 액션
export async function signUpWithEmail(email: string, password: string) {
    try {
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = data as FirebaseError;
            let errorMessage = '회원가입에 실패했습니다.';

            if (error.error.message === 'EMAIL_EXISTS') {
                errorMessage = '이미 사용 중인 이메일입니다.';
            } else if (error.error.message === 'WEAK_PASSWORD') {
                errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
            } else if (error.error.message === 'INVALID_EMAIL') {
                errorMessage = '유효하지 않은 이메일 형식입니다.';
            }

            return { success: false, error: errorMessage };
        }

        const authData = data as FirebaseAuthResponse;

        // 쿠키에 토큰 저장
        const cookieStore = await cookies();
        cookieStore.set('firebase-token', authData.idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: parseInt(authData.expiresIn),
            path: '/',
        });

        return {
            success: true,
            user: {
                uid: authData.localId,
                email: authData.email,
            },
        };
    } catch (error) {
        console.error('Server auth error:', error);
        return { success: false, error: '서버 오류가 발생했습니다.' };
    }
}

// 로그아웃 서버 액션
export async function signOut() {
    const cookieStore = await cookies();
    cookieStore.delete('firebase-token');
    cookieStore.delete('firebase-refresh-token');
    redirect('/login');
}

// 토큰 검증 함수
export async function verifyToken(token: string) {
    try {
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                idToken: token,
            }),
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.users?.[0] || null;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

// 현재 사용자 가져오기
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-token')?.value;

    if (!token) {
        return null;
    }

    return await verifyToken(token);
}
