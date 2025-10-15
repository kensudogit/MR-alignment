#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動認識・自動応答システム
音声認識、自然言語処理、音声合成を組み合わせた実用的なシステム

機能:
- 音声認識（マイク入力）
- 自然言語処理（意図理解）
- 自動応答生成
- 音声合成（スピーカー出力）
- ログ記録
"""

import speech_recognition as sr
import pyttsx3
import json
import logging
import time
import threading
from datetime import datetime
from typing import Dict, List, Optional
import re
import random

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('auto_response.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AutoResponseSystem:
    """自動認識・自動応答システムのメインクラス"""
    
    def __init__(self):
        """システムの初期化"""
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        self.tts_engine = pyttsx3.init()
        
        # 音声合成の設定
        self.setup_tts()
        
        # 応答パターンの定義
        self.response_patterns = self.load_response_patterns()
        
        # システム状態
        self.is_running = False
        self.conversation_history = []
        
        logger.info("自動認識・自動応答システムが初期化されました")
    
    def setup_tts(self):
        """音声合成エンジンの設定"""
        voices = self.tts_engine.getProperty('voices')
        
        # 日本語音声を探す
        for voice in voices:
            if 'japanese' in voice.name.lower() or 'ja' in voice.id.lower():
                self.tts_engine.setProperty('voice', voice.id)
                break
        
        # 音声の速度と音量を設定
        self.tts_engine.setProperty('rate', 150)  # 速度
        self.tts_engine.setProperty('volume', 0.8)  # 音量
    
    def load_response_patterns(self) -> Dict:
        """応答パターンを読み込み"""
        patterns = {
            "greeting": {
                "keywords": ["こんにちは", "はじめまして", "おはよう", "こんばんは", "hello", "hi"],
                "responses": [
                    "こんにちは！お疲れ様です。",
                    "はじめまして！何かお手伝いできることはありますか？",
                    "おはようございます！今日も一日頑張りましょう。",
                    "こんばんは！お疲れ様でした。"
                ]
            },
            "question": {
                "keywords": ["何", "どう", "なぜ", "いつ", "どこ", "誰", "？", "?"],
                "responses": [
                    "良い質問ですね。詳しく調べてお答えします。",
                    "その件について確認いたします。",
                    "申し訳ございませんが、その詳細は後ほどお答えします。",
                    "興味深いご質問です。検討して回答いたします。"
                ]
            },
            "help": {
                "keywords": ["助けて", "困った", "わからない", "教えて", "help"],
                "responses": [
                    "お手伝いさせていただきます。どのようなことでお困りですか？",
                    "心配いりません。一緒に解決しましょう。",
                    "サポートいたします。詳しく教えてください。",
                    "お困りのことがあれば、いつでもお声がけください。"
                ]
            },
            "thanks": {
                "keywords": ["ありがとう", "感謝", "thank", "thanks"],
                "responses": [
                    "どういたしまして！お役に立てて嬉しいです。",
                    "こちらこそ、ありがとうございます。",
                    "お気軽にご相談ください。",
                    "また何かございましたら、お声がけください。"
                ]
            },
            "goodbye": {
                "keywords": ["さようなら", "またね", "お疲れ様", "bye", "goodbye"],
                "responses": [
                    "お疲れ様でした！またお会いしましょう。",
                    "さようなら！良い一日をお過ごしください。",
                    "また次回お会いできるのを楽しみにしています。",
                    "お疲れ様でした。お気をつけて。"
                ]
            },
            "default": {
                "responses": [
                    "申し訳ございませんが、もう少し詳しく教えていただけますか？",
                    "理解いたしました。他に何かお手伝いできることはありますか？",
                    "なるほど。その件について検討いたします。",
                    "おっしゃる通りです。他にご質問はございますか？"
                ]
            }
        }
        return patterns
    
    def recognize_speech(self) -> Optional[str]:
        """音声認識を実行"""
        try:
            with self.microphone as source:
                # 環境ノイズを調整
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                logger.info("音声を待機中...")
                
                # 音声を聞く（タイムアウト: 5秒、無音検出: 1秒）
                audio = self.recognizer.listen(source, timeout=5, phrase_time_limit=10)
                
                # Google音声認識を使用
                text = self.recognizer.recognize_google(audio, language='ja-JP')
                logger.info(f"認識結果: {text}")
                return text
                
        except sr.WaitTimeoutError:
            logger.warning("音声入力のタイムアウト")
            return None
        except sr.UnknownValueError:
            logger.warning("音声を認識できませんでした")
            return None
        except sr.RequestError as e:
            logger.error(f"音声認識サービスエラー: {e}")
            return None
        except Exception as e:
            logger.error(f"音声認識エラー: {e}")
            return None
    
    def analyze_intent(self, text: str) -> str:
        """テキストから意図を分析"""
        text_lower = text.lower()
        
        # 各パターンとのマッチング
        for intent, pattern in self.response_patterns.items():
            if intent == "default":
                continue
                
            keywords = pattern.get("keywords", [])
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    return intent
        
        return "default"
    
    def generate_response(self, text: str, intent: str) -> str:
        """応答を生成"""
        if intent in self.response_patterns:
            responses = self.response_patterns[intent]["responses"]
            response = random.choice(responses)
        else:
            responses = self.response_patterns["default"]["responses"]
            response = random.choice(responses)
        
        # 会話履歴に追加
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "user_input": text,
            "intent": intent,
            "response": response
        })
        
        return response
    
    def speak(self, text: str):
        """音声合成で応答"""
        try:
            logger.info(f"音声出力: {text}")
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
        except Exception as e:
            logger.error(f"音声合成エラー: {e}")
    
    def save_conversation_log(self):
        """会話ログを保存"""
        try:
            with open('conversation_log.json', 'w', encoding='utf-8') as f:
                json.dump(self.conversation_history, f, ensure_ascii=False, indent=2)
            logger.info("会話ログを保存しました")
        except Exception as e:
            logger.error(f"ログ保存エラー: {e}")
    
    def process_conversation(self):
        """会話処理のメインループ"""
        logger.info("会話処理を開始します")
        
        while self.is_running:
            try:
                # 音声認識
                user_input = self.recognize_speech()
                
                if user_input:
                    # 意図分析
                    intent = self.analyze_intent(user_input)
                    
                    # 応答生成
                    response = self.generate_response(user_input, intent)
                    
                    # 音声出力
                    self.speak(response)
                    
                    # 終了条件のチェック
                    if intent == "goodbye":
                        logger.info("終了の意図を検出しました")
                        break
                
                # 短い待機
                time.sleep(0.1)
                
            except KeyboardInterrupt:
                logger.info("ユーザーによる中断")
                break
            except Exception as e:
                logger.error(f"会話処理エラー: {e}")
                time.sleep(1)
    
    def start(self):
        """システムを開始"""
        logger.info("自動認識・自動応答システムを開始します")
        self.is_running = True
        
        try:
            # 開始メッセージ
            self.speak("自動認識・自動応答システムを開始します。何かお話しください。")
            
            # 会話処理を開始
            self.process_conversation()
            
        except Exception as e:
            logger.error(f"システムエラー: {e}")
        finally:
            self.stop()
    
    def stop(self):
        """システムを停止"""
        logger.info("システムを停止します")
        self.is_running = False
        
        # 会話ログを保存
        self.save_conversation_log()
        
        # 終了メッセージ
        self.speak("システムを終了します。お疲れ様でした。")

def main():
    """メイン関数"""
    print("=== 自動認識・自動応答システム ===")
    print("音声認識、自然言語処理、音声合成を組み合わせたシステム")
    print("終了するには Ctrl+C を押してください")
    print()
    
    try:
        # システムを初期化
        system = AutoResponseSystem()
        
        # システムを開始
        system.start()
        
    except KeyboardInterrupt:
        print("\nシステムを終了します...")
    except Exception as e:
        logger.error(f"メインエラー: {e}")
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    main()
