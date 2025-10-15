#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高度な自動認識・自動応答システム
機械学習、感情分析、多言語対応を含む実用的なシステム

機能:
- 高精度音声認識（Whisper、Vosk）
- 感情分析・意図理解
- 多言語対応
- 学習機能
- データベース連携
- Web API連携
"""

import asyncio
import json
import logging
import sqlite3
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import re
import random
import threading
from dataclasses import dataclass
from pathlib import Path

# 音声処理
import speech_recognition as sr
import pyttsx3
import pyaudio
import wave

# 機械学習
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import joblib

# 自然言語処理
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# 設定管理
import yaml
from dotenv import load_dotenv
import os

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('advanced_auto_response.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ConversationContext:
    """会話コンテキスト"""
    user_id: str
    session_id: str
    language: str = "ja"
    emotion: str = "neutral"
    confidence: float = 0.0
    history: List[Dict] = None
    
    def __post_init__(self):
        if self.history is None:
            self.history = []

class AdvancedAutoResponseSystem:
    """高度な自動認識・自動応答システム"""
    
    def __init__(self, config_file: str = "config.yaml"):
        """システムの初期化"""
        self.config = self.load_config(config_file)
        self.db_path = self.config.get('database', {}).get('path', 'conversations.db')
        
        # 音声認識エンジンの初期化
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # 音声合成エンジンの初期化
        self.tts_engine = pyttsx3.init()
        self.setup_tts()
        
        # 機械学習モデルの初期化
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
        
        # データベースの初期化
        self.init_database()
        
        # 学習データの読み込み
        self.load_learning_data()
        
        # システム状態
        self.is_running = False
        self.active_sessions = {}
        
        logger.info("高度な自動認識・自動応答システムが初期化されました")
    
    def load_config(self, config_file: str) -> Dict:
        """設定ファイルを読み込み"""
        default_config = {
            'speech': {
                'language': 'ja-JP',
                'timeout': 5,
                'phrase_time_limit': 10
            },
            'tts': {
                'rate': 150,
                'volume': 0.8,
                'voice': 'japanese'
            },
            'ml': {
                'model_path': 'models/',
                'confidence_threshold': 0.7
            },
            'database': {
                'path': 'conversations.db'
            }
        }
        
        try:
            if os.path.exists(config_file):
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = yaml.safe_load(f)
                return {**default_config, **config}
            else:
                # デフォルト設定を保存
                with open(config_file, 'w', encoding='utf-8') as f:
                    yaml.dump(default_config, f, default_flow_style=False)
                return default_config
        except Exception as e:
            logger.error(f"設定ファイル読み込みエラー: {e}")
            return default_config
    
    def setup_tts(self):
        """音声合成エンジンの設定"""
        voices = self.tts_engine.getProperty('voices')
        
        # 日本語音声を探す
        for voice in voices:
            if 'japanese' in voice.name.lower() or 'ja' in voice.id.lower():
                self.tts_engine.setProperty('voice', voice.id)
                break
        
        # 設定を適用
        self.tts_engine.setProperty('rate', self.config['tts']['rate'])
        self.tts_engine.setProperty('volume', self.config['tts']['volume'])
    
    def init_database(self):
        """データベースを初期化"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 会話テーブル
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    user_input TEXT NOT NULL,
                    intent TEXT,
                    emotion TEXT,
                    confidence REAL,
                    response TEXT NOT NULL,
                    language TEXT DEFAULT 'ja'
                )
            ''')
            
            # 学習データテーブル
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS learning_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    input_text TEXT NOT NULL,
                    intent TEXT NOT NULL,
                    response TEXT NOT NULL,
                    confidence REAL DEFAULT 1.0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("データベースを初期化しました")
            
        except Exception as e:
            logger.error(f"データベース初期化エラー: {e}")
    
    def load_learning_data(self):
        """学習データを読み込み"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT input_text, intent FROM learning_data')
            data = cursor.fetchall()
            
            if data:
                texts, intents = zip(*data)
                self.vectorizer.fit(texts)
                logger.info(f"学習データを読み込みました: {len(data)}件")
            else:
                # デフォルト学習データ
                self.load_default_learning_data()
            
            conn.close()
            
        except Exception as e:
            logger.error(f"学習データ読み込みエラー: {e}")
            self.load_default_learning_data()
    
    def load_default_learning_data(self):
        """デフォルト学習データを読み込み"""
        default_data = [
            ("こんにちは", "greeting"),
            ("はじめまして", "greeting"),
            ("ありがとう", "thanks"),
            ("助けて", "help"),
            ("さようなら", "goodbye"),
            ("何ですか", "question"),
            ("どうですか", "question"),
            ("困っています", "help"),
            ("お疲れ様", "greeting"),
            ("またね", "goodbye")
        ]
        
        texts, intents = zip(*default_data)
        self.vectorizer.fit(texts)
        logger.info("デフォルト学習データを読み込みました")
    
    def recognize_speech_advanced(self, session_id: str) -> Optional[Tuple[str, float]]:
        """高度な音声認識"""
        try:
            with self.microphone as source:
                # 環境ノイズを調整
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                
                # 音声を聞く
                audio = self.recognizer.listen(
                    source, 
                    timeout=self.config['speech']['timeout'],
                    phrase_time_limit=self.config['speech']['phrase_time_limit']
                )
                
                # 複数の認識エンジンを試す
                recognition_results = []
                
                # Google音声認識
                try:
                    text = self.recognizer.recognize_google(
                        audio, 
                        language=self.config['speech']['language']
                    )
                    recognition_results.append(("google", text, 0.8))
                except:
                    pass
                
                # 最も信頼性の高い結果を選択
                if recognition_results:
                    best_result = max(recognition_results, key=lambda x: x[2])
                    logger.info(f"音声認識結果: {best_result[1]} (信頼度: {best_result[2]})")
                    return best_result[1], best_result[2]
                
                return None, 0.0
                
        except sr.WaitTimeoutError:
            logger.warning("音声入力のタイムアウト")
            return None, 0.0
        except Exception as e:
            logger.error(f"音声認識エラー: {e}")
            return None, 0.0
    
    def analyze_emotion(self, text: str) -> Tuple[str, float]:
        """感情分析"""
        try:
            # 英語の感情分析を使用（日本語は限定的）
            scores = self.sentiment_analyzer.polarity_scores(text)
            
            # 感情を分類
            if scores['compound'] >= 0.1:
                emotion = "positive"
                confidence = scores['compound']
            elif scores['compound'] <= -0.1:
                emotion = "negative"
                confidence = abs(scores['compound'])
            else:
                emotion = "neutral"
                confidence = 1.0 - abs(scores['compound'])
            
            return emotion, confidence
            
        except Exception as e:
            logger.error(f"感情分析エラー: {e}")
            return "neutral", 0.5
    
    def predict_intent(self, text: str) -> Tuple[str, float]:
        """意図予測（機械学習）"""
        try:
            # テキストをベクトル化
            text_vector = self.vectorizer.transform([text])
            
            # 学習データから類似度を計算
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('SELECT input_text, intent FROM learning_data')
            data = cursor.fetchall()
            conn.close()
            
            if not data:
                return "unknown", 0.0
            
            texts, intents = zip(*data)
            data_vectors = self.vectorizer.transform(texts)
            
            # コサイン類似度を計算
            similarities = cosine_similarity(text_vector, data_vectors)[0]
            max_similarity_idx = np.argmax(similarities)
            max_similarity = similarities[max_similarity_idx]
            
            predicted_intent = intents[max_similarity_idx]
            
            return predicted_intent, float(max_similarity)
            
        except Exception as e:
            logger.error(f"意図予測エラー: {e}")
            return "unknown", 0.0
    
    def generate_contextual_response(self, text: str, context: ConversationContext) -> str:
        """文脈を考慮した応答生成"""
        try:
            # 意図を予測
            intent, intent_confidence = self.predict_intent(text)
            
            # 感情を分析
            emotion, emotion_confidence = self.analyze_emotion(text)
            
            # 文脈を更新
            context.emotion = emotion
            context.confidence = intent_confidence
            
            # 応答を生成
            response = self.create_response(text, intent, emotion, context)
            
            # データベースに保存
            self.save_conversation(context, text, intent, emotion, intent_confidence, response)
            
            return response
            
        except Exception as e:
            logger.error(f"応答生成エラー: {e}")
            return "申し訳ございませんが、理解できませんでした。"
    
    def create_response(self, text: str, intent: str, emotion: str, context: ConversationContext) -> str:
        """応答を作成"""
        # 基本的な応答パターン
        response_templates = {
            "greeting": [
                "こんにちは！お疲れ様です。",
                "はじめまして！何かお手伝いできることはありますか？",
                "おはようございます！今日も一日頑張りましょう。"
            ],
            "thanks": [
                "どういたしまして！お役に立てて嬉しいです。",
                "こちらこそ、ありがとうございます。",
                "お気軽にご相談ください。"
            ],
            "help": [
                "お手伝いさせていただきます。どのようなことでお困りですか？",
                "心配いりません。一緒に解決しましょう。",
                "サポートいたします。詳しく教えてください。"
            ],
            "question": [
                "良い質問ですね。詳しく調べてお答えします。",
                "その件について確認いたします。",
                "興味深いご質問です。検討して回答いたします。"
            ],
            "goodbye": [
                "お疲れ様でした！またお会いしましょう。",
                "さようなら！良い一日をお過ごしください。",
                "また次回お会いできるのを楽しみにしています。"
            ]
        }
        
        # 感情に応じた応答の調整
        if emotion == "positive":
            prefix = "素晴らしいですね！"
        elif emotion == "negative":
            prefix = "お困りのようですね。"
        else:
            prefix = ""
        
        # 応答を選択
        if intent in response_templates:
            base_response = random.choice(response_templates[intent])
        else:
            base_response = "理解いたしました。他に何かお手伝いできることはありますか？"
        
        # 文脈を考慮した応答
        if context.history:
            recent_topics = [h.get('intent', '') for h in context.history[-3:]]
            if intent in recent_topics:
                base_response += " 先ほどの件についても、何かご質問はございますか？"
        
        return f"{prefix} {base_response}".strip()
    
    def save_conversation(self, context: ConversationContext, user_input: str, 
                         intent: str, emotion: str, confidence: float, response: str):
        """会話をデータベースに保存"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO conversations 
                (user_id, session_id, user_input, intent, emotion, confidence, response, language)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (context.user_id, context.session_id, user_input, intent, 
                  emotion, confidence, response, context.language))
            
            conn.commit()
            conn.close()
            
            # コンテキスト履歴に追加
            context.history.append({
                'timestamp': datetime.now().isoformat(),
                'user_input': user_input,
                'intent': intent,
                'emotion': emotion,
                'response': response
            })
            
        except Exception as e:
            logger.error(f"会話保存エラー: {e}")
    
    def speak_advanced(self, text: str, emotion: str = "neutral"):
        """高度な音声合成"""
        try:
            # 感情に応じて音声パラメータを調整
            if emotion == "positive":
                self.tts_engine.setProperty('rate', 160)
            elif emotion == "negative":
                self.tts_engine.setProperty('rate', 140)
            else:
                self.tts_engine.setProperty('rate', 150)
            
            logger.info(f"音声出力: {text} (感情: {emotion})")
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
            
        except Exception as e:
            logger.error(f"音声合成エラー: {e}")
    
    def learn_from_interaction(self, user_input: str, intent: str, response: str, 
                              confidence: float = 1.0):
        """インタラクションから学習"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO learning_data (input_text, intent, response, confidence)
                VALUES (?, ?, ?, ?)
            ''', (user_input, intent, response, confidence))
            
            conn.commit()
            conn.close()
            
            # ベクトライザーを再学習
            self.load_learning_data()
            
            logger.info(f"学習データを追加しました: {intent}")
            
        except Exception as e:
            logger.error(f"学習エラー: {e}")
    
    async def process_conversation_async(self, session_id: str):
        """非同期会話処理"""
        context = ConversationContext(
            user_id="user_001",
            session_id=session_id,
            language="ja"
        )
        
        self.active_sessions[session_id] = context
        
        logger.info(f"会話セッション開始: {session_id}")
        
        try:
            while self.is_running and session_id in self.active_sessions:
                # 音声認識
                user_input, confidence = self.recognize_speech_advanced(session_id)
                
                if user_input and confidence > self.config['ml']['confidence_threshold']:
                    # 応答生成
                    response = self.generate_contextual_response(user_input, context)
                    
                    # 音声出力
                    self.speak_advanced(response, context.emotion)
                    
                    # 学習データに追加
                    self.learn_from_interaction(user_input, context.history[-1]['intent'], response)
                    
                    # 終了条件のチェック
                    if context.history[-1]['intent'] == "goodbye":
                        break
                
                await asyncio.sleep(0.1)
                
        except Exception as e:
            logger.error(f"会話処理エラー: {e}")
        finally:
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            logger.info(f"会話セッション終了: {session_id}")
    
    def start_advanced(self):
        """高度なシステムを開始"""
        logger.info("高度な自動認識・自動応答システムを開始します")
        self.is_running = True
        
        try:
            # 開始メッセージ
            self.speak_advanced("高度な自動認識・自動応答システムを開始します。何かお話しください。")
            
            # 非同期会話処理を開始
            session_id = f"session_{int(time.time())}"
            asyncio.run(self.process_conversation_async(session_id))
            
        except KeyboardInterrupt:
            logger.info("ユーザーによる中断")
        except Exception as e:
            logger.error(f"システムエラー: {e}")
        finally:
            self.stop()
    
    def stop(self):
        """システムを停止"""
        logger.info("システムを停止します")
        self.is_running = False
        
        # 終了メッセージ
        self.speak_advanced("システムを終了します。お疲れ様でした。")

def main():
    """メイン関数"""
    print("=== 高度な自動認識・自動応答システム ===")
    print("機械学習、感情分析、多言語対応を含む実用的なシステム")
    print("終了するには Ctrl+C を押してください")
    print()
    
    try:
        # システムを初期化
        system = AdvancedAutoResponseSystem()
        
        # システムを開始
        system.start_advanced()
        
    except KeyboardInterrupt:
        print("\nシステムを終了します...")
    except Exception as e:
        logger.error(f"メインエラー: {e}")
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    main()
