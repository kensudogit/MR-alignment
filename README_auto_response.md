# 自動認識・自動応答システム

音声認識、自然言語処理、音声合成を組み合わせた実用的な自動応答システムです。

## 機能

### 基本システム (`auto_response_system.py`)
- **音声認識**: マイクからの音声入力をテキストに変換
- **意図理解**: テキストからユーザーの意図を分析
- **自動応答**: 意図に基づいた適切な応答を生成
- **音声合成**: 応答を音声で出力
- **ログ記録**: 会話履歴の保存

### 高度システム (`advanced_auto_response.py`)
- **機械学習**: 過去の会話から学習して応答精度を向上
- **感情分析**: ユーザーの感情を分析して応答を調整
- **多言語対応**: 複数言語での音声認識・合成
- **データベース連携**: SQLiteを使用した会話履歴の管理
- **非同期処理**: 複数の会話セッションを同時処理
- **学習機能**: インタラクションから自動学習

## インストール

### 1. 必要なライブラリのインストール

```bash
pip install -r requirements_auto_response.txt
```

### 2. 音声認識エンジンの設定

#### Google音声認識（推奨）
```bash
# 追加の設定は不要（インターネット接続が必要）
```

#### オフライン音声認識（Vosk）
```bash
# Voskモデルをダウンロード
wget https://alphacephei.com/vosk/models/vosk-model-small-ja-0.22.zip
unzip vosk-model-small-ja-0.22.zip
```

### 3. 音声合成エンジンの設定

#### Windows
```bash
# pyttsx3はWindowsの内蔵音声エンジンを使用
# 追加設定は不要
```

#### Linux
```bash
# espeakをインストール
sudo apt-get install espeak
```

#### macOS
```bash
# 内蔵音声エンジンを使用
# 追加設定は不要
```

## 使用方法

### 基本システムの実行

```bash
python auto_response_system.py
```

### 高度システムの実行

```bash
python advanced_auto_response.py
```

### テストの実行

```bash
python test_auto_response.py
```

## 設定

### 設定ファイル (`config.yaml`)

```yaml
# 音声認識設定
speech:
  language: "ja-JP"  # 認識言語
  timeout: 5         # タイムアウト（秒）
  phrase_time_limit: 10  # フレーズ時間制限（秒）

# 音声合成設定
tts:
  rate: 150          # 話速
  volume: 0.8        # 音量
  voice: "japanese"  # 音声

# 機械学習設定
ml:
  model_path: "models/"           # モデル保存パス
  confidence_threshold: 0.7       # 信頼度閾値
```

## 応答パターン

### 基本パターン

- **挨拶**: "こんにちは", "はじめまして", "おはよう"
- **感謝**: "ありがとう", "感謝"
- **質問**: "何", "どう", "なぜ", "いつ"
- **ヘルプ**: "助けて", "困った", "わからない"
- **別れ**: "さようなら", "またね", "お疲れ様"

### カスタマイズ

応答パターンは `response_patterns` 辞書でカスタマイズ可能：

```python
response_patterns = {
    "greeting": {
        "keywords": ["こんにちは", "はじめまして"],
        "responses": ["こんにちは！お疲れ様です。", "はじめまして！"]
    },
    # 新しいパターンを追加
}
```

## データベース

### 会話履歴テーブル

```sql
CREATE TABLE conversations (
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
);
```

### 学習データテーブル

```sql
CREATE TABLE learning_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_text TEXT NOT NULL,
    intent TEXT NOT NULL,
    response TEXT NOT NULL,
    confidence REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API仕様

### 基本システム

```python
# システムの初期化
system = AutoResponseSystem()

# 音声認識
text = system.recognize_speech()

# 意図分析
intent = system.analyze_intent(text)

# 応答生成
response = system.generate_response(text, intent)

# 音声出力
system.speak(response)
```

### 高度システム

```python
# システムの初期化
system = AdvancedAutoResponseSystem("config.yaml")

# 非同期会話処理
await system.process_conversation_async("session_id")

# 学習データの追加
system.learn_from_interaction("入力", "意図", "応答", 1.0)
```

## トラブルシューティング

### 音声認識が動作しない

1. **マイクの確認**
   ```python
   import speech_recognition as sr
   print(sr.Microphone.list_microphone_names())
   ```

2. **権限の確認**
   - macOS: システム環境設定 > セキュリティとプライバシー > マイク
   - Windows: 設定 > プライバシー > マイク
   - Linux: マイクデバイスの権限確認

3. **音声認識エンジンの確認**
   ```python
   r = sr.Recognizer()
   with sr.Microphone() as source:
       audio = r.listen(source)
   try:
       text = r.recognize_google(audio, language='ja-JP')
       print(text)
   except sr.UnknownValueError:
       print("音声を認識できませんでした")
   ```

### 音声合成が動作しない

1. **音声エンジンの確認**
   ```python
   import pyttsx3
   engine = pyttsx3.init()
   voices = engine.getProperty('voices')
   for voice in voices:
       print(voice.id, voice.name)
   ```

2. **音声の設定**
   ```python
   engine.setProperty('voice', 'voice_id')
   engine.setProperty('rate', 150)
   engine.setProperty('volume', 0.8)
   ```

### データベースエラー

1. **ファイル権限の確認**
   ```bash
   ls -la conversations.db
   ```

2. **データベースの修復**
   ```python
   import sqlite3
   conn = sqlite3.connect('conversations.db')
   conn.execute('VACUUM')
   conn.close()
   ```

## パフォーマンス最適化

### 音声認識の最適化

```python
# 環境ノイズの調整
recognizer.adjust_for_ambient_noise(source, duration=0.5)

# タイムアウトの設定
audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
```

### 機械学習の最適化

```python
# ベクトライザーの最適化
vectorizer = TfidfVectorizer(
    max_features=1000,
    stop_words='english',
    ngram_range=(1, 2)
)
```

### データベースの最適化

```python
# インデックスの作成
cursor.execute('CREATE INDEX idx_user_id ON conversations(user_id)')
cursor.execute('CREATE INDEX idx_timestamp ON conversations(timestamp)')
```

## 拡張機能

### 新しい音声認識エンジンの追加

```python
def recognize_with_whisper(self, audio):
    import whisper
    model = whisper.load_model("base")
    result = model.transcribe(audio)
    return result["text"]
```

### 新しい音声合成エンジンの追加

```python
def speak_with_gtts(self, text):
    from gtts import gTTS
    import pygame
    
    tts = gTTS(text=text, lang='ja')
    tts.save('temp.mp3')
    
    pygame.mixer.init()
    pygame.mixer.music.load('temp.mp3')
    pygame.mixer.music.play()
```

### Web API連携

```python
def call_external_api(self, text):
    import requests
    
    response = requests.post(
        'https://api.example.com/chat',
        json={'message': text}
    )
    return response.json()['reply']
```

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。

## 更新履歴

### v1.0.0
- 基本的な音声認識・応答機能
- 音声合成機能
- ログ記録機能

### v2.0.0
- 機械学習による意図予測
- 感情分析機能
- データベース連携
- 非同期処理
- 学習機能

## サポート

問題が発生した場合は、以下の方法でサポートを受けられます：

1. GitHubのIssuesページで問題を報告
2. ログファイルを確認
3. テストスクリプトを実行して問題を特定

## 参考資料

- [SpeechRecognition Documentation](https://pypi.org/project/SpeechRecognition/)
- [pyttsx3 Documentation](https://pypi.org/project/pyttsx3/)
- [scikit-learn Documentation](https://scikit-learn.org/)
- [NLTK Documentation](https://www.nltk.org/)
