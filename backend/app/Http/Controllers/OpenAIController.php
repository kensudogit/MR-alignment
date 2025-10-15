<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class OpenAIController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'prompt' => 'required|string',
                'userInfo' => 'required|array',
                'apiKey' => 'required|string'
            ]);

            $prompt = $request->input('prompt');
            $userInfo = $request->input('userInfo');
            $apiKey = $request->input('apiKey');

            // OpenAI APIを呼び出し
            $client = new Client();
            $response = $client->post('https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'gpt-3.5-turbo',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'あなたは須藤技術士事務所のITコンサルタントです。ユーザーの情報を基に、パーソナライズされたITサービス提案資料を作成してください。'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'max_tokens' => 2000,
                    'temperature' => 0.7
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            
            return response()->json([
                'success' => true,
                'content' => $data['choices'][0]['message']['content']
            ]);

        } catch (RequestException $e) {
            return response()->json([
                'success' => false,
                'error' => 'OpenAI API error: ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
}
