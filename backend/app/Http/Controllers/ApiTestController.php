<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ApiTestController extends Controller
{
    public function test()
    {
        return response()->json([
            'status' => 'success',
            'message' => 'API接続成功！',
            'timestamp' => now(),
            'backend' => 'PHP 8.2 + Laravel 10',
            'database' => 'PostgreSQL 15'
        ]);
    }
}
