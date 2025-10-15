#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動認識・自動応答システムのテストスクリプト
"""

import unittest
import tempfile
import os
import sqlite3
from unittest.mock import Mock, patch
import sys

# テスト対象のモジュールをインポート
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auto_response_system import AutoResponseSystem
from advanced_auto_response import AdvancedAutoResponseSystem

class TestAutoResponseSystem(unittest.TestCase):
    """基本的な自動応答システムのテスト"""
    
    def setUp(self):
        """テスト前の準備"""
        self.system = AutoResponseSystem()
    
    def test_initialization(self):
        """初期化テスト"""
        self.assertIsNotNone(self.system.recognizer)
        self.assertIsNotNone(self.system.microphone)
        self.assertIsNotNone(self.system.tts_engine)
        self.assertIsNotNone(self.system.response_patterns)
    
    def test_analyze_intent(self):
        """意図分析テスト"""
        # 挨拶のテスト
        intent = self.system.analyze_intent("こんにちは")
        self.assertEqual(intent, "greeting")
        
        # 質問のテスト
        intent = self.system.analyze_intent("何ですか？")
        self.assertEqual(intent, "question")
        
        # 感謝のテスト
        intent = self.system.analyze_intent("ありがとう")
        self.assertEqual(intent, "thanks")
        
        # デフォルトのテスト
        intent = self.system.analyze_intent("不明なテキスト")
        self.assertEqual(intent, "default")
    
    def test_generate_response(self):
        """応答生成テスト"""
        # 挨拶の応答テスト
        response = self.system.generate_response("こんにちは", "greeting")
        self.assertIsInstance(response, str)
        self.assertGreater(len(response), 0)
        
        # 質問の応答テスト
        response = self.system.generate_response("何ですか？", "question")
        self.assertIsInstance(response, str)
        self.assertGreater(len(response), 0)
    
    def test_response_patterns(self):
        """応答パターンテスト"""
        patterns = self.system.response_patterns
        
        # 必要なパターンが存在することを確認
        self.assertIn("greeting", patterns)
        self.assertIn("question", patterns)
        self.assertIn("help", patterns)
        self.assertIn("thanks", patterns)
        self.assertIn("goodbye", patterns)
        self.assertIn("default", patterns)
        
        # 各パターンにキーワードと応答が含まれることを確認
        for pattern_name, pattern_data in patterns.items():
            if pattern_name != "default":
                self.assertIn("keywords", pattern_data)
                self.assertIn("responses", pattern_data)
                self.assertGreater(len(pattern_data["keywords"]), 0)
                self.assertGreater(len(pattern_data["responses"]), 0)

class TestAdvancedAutoResponseSystem(unittest.TestCase):
    """高度な自動応答システムのテスト"""
    
    def setUp(self):
        """テスト前の準備"""
        # 一時的な設定ファイルを作成
        self.temp_config = tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False)
        self.temp_config.write("""
speech:
  language: "ja-JP"
  timeout: 5
  phrase_time_limit: 10
tts:
  rate: 150
  volume: 0.8
  voice: "japanese"
ml:
  model_path: "models/"
  confidence_threshold: 0.7
database:
  path: "test_conversations.db"
""")
        self.temp_config.close()
        
        # 一時的なデータベースファイルを作成
        self.temp_db = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
        self.temp_db.close()
        
        # システムを初期化
        self.system = AdvancedAutoResponseSystem(self.temp_config.name)
    
    def tearDown(self):
        """テスト後のクリーンアップ"""
        # 一時ファイルを削除
        os.unlink(self.temp_config.name)
        if os.path.exists(self.temp_db.name):
            os.unlink(self.temp_db.name)
        if os.path.exists("test_conversations.db"):
            os.unlink("test_conversations.db")
    
    def test_initialization(self):
        """初期化テスト"""
        self.assertIsNotNone(self.system.config)
        self.assertIsNotNone(self.system.recognizer)
        self.assertIsNotNone(self.system.microphone)
        self.assertIsNotNone(self.system.tts_engine)
        self.assertIsNotNone(self.system.vectorizer)
        self.assertIsNotNone(self.system.sentiment_analyzer)
    
    def test_analyze_emotion(self):
        """感情分析テスト"""
        # ポジティブなテキスト
        emotion, confidence = self.system.analyze_emotion("I am very happy!")
        self.assertIn(emotion, ["positive", "neutral"])
        
        # ネガティブなテキスト
        emotion, confidence = self.system.analyze_emotion("I am very sad.")
        self.assertIn(emotion, ["negative", "neutral"])
        
        # ニュートラルなテキスト
        emotion, confidence = self.system.analyze_emotion("This is a test.")
        self.assertIn(emotion, ["positive", "negative", "neutral"])
    
    def test_predict_intent(self):
        """意図予測テスト"""
        # 学習データを追加
        self.system.learn_from_interaction("こんにちは", "greeting", "こんにちは！", 1.0)
        
        # 意図を予測
        intent, confidence = self.system.predict_intent("こんにちは")
        self.assertIsInstance(intent, str)
        self.assertIsInstance(confidence, float)
        self.assertGreaterEqual(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)
    
    def test_database_operations(self):
        """データベース操作テスト"""
        # 会話コンテキストを作成
        context = self.system.active_sessions.get("test_session")
        if context is None:
            context = type('ConversationContext', (), {
                'user_id': 'test_user',
                'session_id': 'test_session',
                'language': 'ja',
                'emotion': 'neutral',
                'confidence': 0.0,
                'history': []
            })()
        
        # 会話を保存
        self.system.save_conversation(
            context, "テスト入力", "test_intent", "neutral", 0.8, "テスト応答"
        )
        
        # データベースから確認
        conn = sqlite3.connect(self.system.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM conversations")
        count = cursor.fetchone()[0]
        conn.close()
        
        self.assertGreater(count, 0)
    
    def test_learn_from_interaction(self):
        """学習機能テスト"""
        # 学習データを追加
        self.system.learn_from_interaction("テスト入力", "test_intent", "テスト応答", 1.0)
        
        # データベースから確認
        conn = sqlite3.connect(self.system.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM learning_data")
        count = cursor.fetchone()[0]
        conn.close()
        
        self.assertGreater(count, 0)

class TestIntegration(unittest.TestCase):
    """統合テスト"""
    
    def test_basic_system_integration(self):
        """基本システムの統合テスト"""
        system = AutoResponseSystem()
        
        # 意図分析と応答生成の統合テスト
        test_cases = [
            ("こんにちは", "greeting"),
            ("ありがとう", "thanks"),
            ("助けて", "help"),
            ("さようなら", "goodbye"),
            ("何ですか？", "question")
        ]
        
        for text, expected_intent in test_cases:
            intent = system.analyze_intent(text)
            self.assertEqual(intent, expected_intent)
            
            response = system.generate_response(text, intent)
            self.assertIsInstance(response, str)
            self.assertGreater(len(response), 0)
    
    def test_advanced_system_integration(self):
        """高度システムの統合テスト"""
        # 一時的な設定ファイルを作成
        temp_config = tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False)
        temp_config.write("""
speech:
  language: "ja-JP"
  timeout: 5
  phrase_time_limit: 10
tts:
  rate: 150
  volume: 0.8
  voice: "japanese"
ml:
  model_path: "models/"
  confidence_threshold: 0.7
database:
  path: "test_integration.db"
""")
        temp_config.close()
        
        try:
            system = AdvancedAutoResponseSystem(temp_config.name)
            
            # 学習データを追加
            system.learn_from_interaction("こんにちは", "greeting", "こんにちは！", 1.0)
            system.learn_from_interaction("ありがとう", "thanks", "どういたしまして！", 1.0)
            
            # 意図予測テスト
            intent, confidence = system.predict_intent("こんにちは")
            self.assertIsInstance(intent, str)
            self.assertIsInstance(confidence, float)
            
            # 感情分析テスト
            emotion, emotion_conf = system.analyze_emotion("I am happy!")
            self.assertIn(emotion, ["positive", "negative", "neutral"])
            
        finally:
            # クリーンアップ
            os.unlink(temp_config.name)
            if os.path.exists("test_integration.db"):
                os.unlink("test_integration.db")

def run_performance_test():
    """パフォーマンステスト"""
    import time
    
    print("=== パフォーマンステスト ===")
    
    # 基本システムのテスト
    print("基本システムのテスト...")
    system = AutoResponseSystem()
    
    test_texts = [
        "こんにちは", "ありがとう", "助けて", "さようなら", "何ですか？",
        "おはよう", "お疲れ様", "またね", "困っています", "教えて"
    ]
    
    start_time = time.time()
    for text in test_texts:
        intent = system.analyze_intent(text)
        response = system.generate_response(text, intent)
    end_time = time.time()
    
    print(f"基本システム処理時間: {end_time - start_time:.4f}秒")
    print(f"1回あたりの平均時間: {(end_time - start_time) / len(test_texts):.4f}秒")
    
    # 高度システムのテスト
    print("\n高度システムのテスト...")
    temp_config = tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False)
    temp_config.write("""
speech:
  language: "ja-JP"
  timeout: 5
  phrase_time_limit: 10
tts:
  rate: 150
  volume: 0.8
  voice: "japanese"
ml:
  model_path: "models/"
  confidence_threshold: 0.7
database:
  path: "test_performance.db"
""")
    temp_config.close()
    
    try:
        advanced_system = AdvancedAutoResponseSystem(temp_config.name)
        
        # 学習データを追加
        for text in test_texts:
            advanced_system.learn_from_interaction(text, "test_intent", "test_response", 1.0)
        
        start_time = time.time()
        for text in test_texts:
            intent, confidence = advanced_system.predict_intent(text)
            emotion, emotion_conf = advanced_system.analyze_emotion(text)
        end_time = time.time()
        
        print(f"高度システム処理時間: {end_time - start_time:.4f}秒")
        print(f"1回あたりの平均時間: {(end_time - start_time) / len(test_texts):.4f}秒")
        
    finally:
        os.unlink(temp_config.name)
        if os.path.exists("test_performance.db"):
            os.unlink("test_performance.db")

if __name__ == "__main__":
    print("=== 自動認識・自動応答システム テストスイート ===")
    print()
    
    # ユニットテストを実行
    print("ユニットテストを実行中...")
    unittest.main(argv=[''], exit=False, verbosity=2)
    
    print("\n" + "="*50)
    
    # パフォーマンステストを実行
    run_performance_test()
    
    print("\nテスト完了！")
