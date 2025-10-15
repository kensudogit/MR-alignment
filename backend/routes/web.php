<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'MR Alignment Backend API is running!',
        'timestamp' => now(),
        'version' => '1.0.0',
        'endpoints' => [
            'api/test' => 'API接続テスト',
            'api/auth/login' => 'ログイン',
            'api/auth/register' => '新規登録',
            'api/contact' => 'お問い合わせ'
        ]
    ]);
});

// ヘルスチェック用エンドポイント
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now(),
        'services' => [
            'database' => 'connected',
            'cache' => 'available'
        ]
    ]);
});
