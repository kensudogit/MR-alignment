// APIキー設定確認テスト
console.log('=== APIキー設定確認 ===');

// 環境変数の確認
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const apiUrl = import.meta.env.VITE_API_URL;
const environment = import.meta.env.VITE_ENVIRONMENT;

console.log('VITE_API_URL:', apiUrl);
console.log('VITE_ENVIRONMENT:', environment);
console.log('VITE_OPENAI_API_KEY:', apiKey ? '設定済み' : '未設定');
console.log('APIキーの長さ:', apiKey ? apiKey.length : 0);
console.log('APIキーの先頭:', apiKey ? apiKey.substring(0, 10) + '...' : 'なし');

// OpenAI APIキーの形式チェック
if (apiKey) {
  const isValidFormat = apiKey.startsWith('sk-') || apiKey.startsWith('ysk-');
  console.log('APIキー形式:', isValidFormat ? '有効' : '無効');
  
  if (isValidFormat) {
    console.log('✅ OpenAI APIキーが正しく設定されています');
  } else {
    console.log('⚠️ APIキーの形式が正しくない可能性があります');
  }
} else {
  console.log('❌ OpenAI APIキーが設定されていません');
}

export { apiKey, apiUrl, environment };
