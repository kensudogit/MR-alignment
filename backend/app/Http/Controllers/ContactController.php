<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'organization' => 'nullable|string|max:255',
            'role' => 'nullable|string|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
            'contactMethod' => 'nullable|string|in:email,phone,both',
            'urgency' => 'nullable|string|in:low,normal,high,urgent',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // ここで実際の処理を行う（例：メール送信、データベース保存など）
            // 現在はデモ用の成功レスポンスを返す
            
            // お問い合わせ情報をログに記録（本番環境では適切な処理を行う）
            \Log::info('Contact form submission', [
                'name' => $request->name,
                'email' => $request->email,
                'subject' => $request->subject,
                'organization' => $request->organization,
                'role' => $request->role,
                'contact_method' => $request->contactMethod,
                'urgency' => $request->urgency,
                'submitted_at' => now(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'お問い合わせを受け付けました。担当者よりご連絡いたします。',
                'contact_id' => 'CT-' . time(),
                'submitted_at' => now()->toISOString(),
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Contact form error: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'お問い合わせの送信中にエラーが発生しました。しばらく時間をおいて再度お試しください。',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
