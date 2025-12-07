import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import OpenAIClient from '../utils/openaiClient';

const DownloadModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    position: '',
    industry: '',
    interest: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('お名前を入力してください。');
      return false;
    }
    if (!formData.email.trim()) {
      setError('メールアドレスを入力してください。');
      return false;
    }
    if (!formData.company.trim()) {
      setError('会社名を入力してください。');
      return false;
    }
    return true;
  };

  const generateITEpoch = () => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 11);
    return `IT-EPOCH-${timestamp}-${randomId}`;
  };

  const generateAIContent = async (userInfo) => {
    try {
      setIsGeneratingAI(true);
      setError('');

      // OpenAI APIキーを環境変数から取得
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your-openai-api-key-here' || apiKey === 'demo-mode') {
        throw new Error('OpenAI APIキーが設定されていません');
      }

      const openaiClient = new OpenAIClient(apiKey);
      const prompt = openaiClient.generatePrompt(userInfo);
      const aiResponse = await openaiClient.generateContent(prompt, userInfo);

      // JSONレスポンスをパース
      let parsedContent;
      try {
        parsedContent = JSON.parse(aiResponse);
      } catch (parseError) {
        console.warn('Failed to parse AI response as JSON:', parseError);
        // JSONパースに失敗した場合は、テキストをそのまま使用
        parsedContent = {
          serviceOverview: aiResponse,
          recommendedServices: 'AI生成された推奨サービス情報',
          expectedEffects: 'AI生成された期待効果情報',
          implementationSteps: 'AI生成された導入ステップ情報',
          supportSystem: 'AI生成されたサポート体制情報',
          riskManagement: 'AI生成されたリスク管理情報',
          investmentReturn: 'AI生成された投資対効果情報'
        };
      }

      return parsedContent;
    } catch (err) {
      console.error('AI generation error:', err);
      setError(`AI生成エラー: ${err.message}`);
      return null;
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const createDownloadContent = (aiContent = null) => {
    const epoch = generateITEpoch();
    
    // AI生成コンテンツがある場合はそれを使用、ない場合はデフォルトコンテンツを使用
    const content = aiContent || {
      serviceOverview: "須藤技術士事務所では、システム開発・クラウド移行・データ分析・セキュリティ・DX推進・ITコンサルティングを提供しています。",
      recommendedServices: "• システム開発：Webアプリケーション、モバイルアプリ、API開発\n• クラウド移行：AWS、Azure、GCPへの移行支援\n• データ分析：BI、機械学習、AI活用\n• セキュリティ：セキュリティ診断、対策支援\n• DX推進：デジタル変革の戦略立案・実行支援\n• ITコンサルティング：技術戦略、アーキテクチャ設計",
      expectedEffects: "• 製造業向け統合システム構築（年間売上100億円規模）\n• 金融機関向けリスク管理システム開発\n• スタートアップ企業への技術指導\n• 複数のプロジェクトで生産性向上30%、コスト削減20%を実現",
      implementationSteps: "• フロントエンド：React、Vue.js、TypeScript\n• バックエンド：Node.js、Python、JavaSE-21 LTS、Spring Boot\n• データベース：PostgreSQL、MySQL、MongoDB\n• クラウド：AWS、Azure、GCP\n• インフラ：Docker、Kubernetes、Terraform",
      supportSystem: "ご質問やご相談がございましたら、お気軽にお問い合わせください。\n\n須藤技術士事務所\nEmail: info@kensudo.jp\nPhone: 03-1234-5678",
      riskManagement: "• セキュリティ診断と脆弱性対策\n• データ暗号化とアクセス制御\n• 災害復旧計画とバックアップ体制\n• コンプライアンス対応と監査支援",
      investmentReturn: "• 初期投資：500万円〜2,000万円\n• 3年間ROI：150%〜300%\n• 運用コスト削減：年間20%〜40%\n• 競合優位性の獲得と市場シェア拡大"
    };

    const downloadData = {
      epoch: epoch,
      timestamp: new Date().toISOString(),
      userInfo: formData,
      content: {
        title: "ITサービス資料",
        subtitle: "須藤技術士事務所 サービス概要",
        sections: [
          {
            title: "サービス概要",
            content: content.serviceOverview
          },
          {
            title: "推奨サービス",
            content: content.recommendedServices
          },
          {
            title: "期待される効果",
            content: content.expectedEffects
          },
          {
            title: "導入ステップ",
            content: content.implementationSteps
          },
          {
            title: "サポート体制",
            content: content.supportSystem
          },
          {
            title: "リスク管理",
            content: content.riskManagement
          },
          {
            title: "投資対効果",
            content: content.investmentReturn
          }
        ]
      }
    };
    return downloadData;
  };

  const handleDownload = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      // 入力情報をローカルストレージに保存
      const downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
      const downloadRecord = {
        id: generateITEpoch(),
        timestamp: new Date().toISOString(),
        userInfo: formData,
        downloaded: true
      };
      
      downloadHistory.unshift(downloadRecord);
      
      // 最新20件のみ保持
      if (downloadHistory.length > 20) {
        downloadHistory.splice(20);
      }
      
      localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));

      // AI生成コンテンツを取得
      const aiContent = await generateAIContent(formData);
      
      // ITエポックを生成してダウンロード
      const downloadData = createDownloadContent(aiContent);
      
      // PDF形式でダウンロード
      const htmlContent = generatePDFContent(downloadData);
      downloadFile(htmlContent, `ITサービス資料_${downloadData.epoch}.pdf`);
      
      setSuccess(true);
      
      // 3秒後にモーダルを閉じる
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          position: '',
          industry: '',
          interest: '',
          message: ''
        });
      }, 3000);

    } catch (err) {
      console.error('Download error:', err);
      setError('ダウンロードに失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDFContent = (data) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ITサービス資料 - ${data.epoch}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 16px;
            color: #666;
          }
          .epoch-info {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #2563eb;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .user-info {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .info-item {
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
          }
          .content-text {
            margin-bottom: 15px;
            text-align: justify;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          li {
            margin-bottom: 5px;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          }
          .print-button:hover {
            background: #1d4ed8;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">PDFとして保存</button>
        
        <div class="header">
          <div class="title">ITサービス資料</div>
          <div class="subtitle">須藤技術士事務所</div>
        </div>

        <div class="epoch-info">
          <div><strong>エポック:</strong> ${data.epoch}</div>
          <div><strong>生成日時:</strong> ${new Date(data.timestamp).toLocaleString('ja-JP')}</div>
        </div>

        <div class="section">
          <div class="section-title">ユーザー情報</div>
          <div class="user-info">
            <div class="info-item"><span class="info-label">お名前:</span> ${data.userInfo.name}</div>
            <div class="info-item"><span class="info-label">メールアドレス:</span> ${data.userInfo.email}</div>
            <div class="info-item"><span class="info-label">会社名:</span> ${data.userInfo.company}</div>
            <div class="info-item"><span class="info-label">電話番号:</span> ${data.userInfo.phone || '未入力'}</div>
            <div class="info-item"><span class="info-label">役職:</span> ${data.userInfo.position || '未入力'}</div>
            <div class="info-item"><span class="info-label">業界:</span> ${data.userInfo.industry || '未入力'}</div>
            <div class="info-item"><span class="info-label">興味のある分野:</span> ${data.userInfo.interest || '未入力'}</div>
            <div class="info-item"><span class="info-label">メッセージ:</span> ${data.userInfo.message || '未入力'}</div>
          </div>
        </div>

        ${data.content.sections.map(section => `
          <div class="section">
            <div class="section-title">${section.title}</div>
            <div class="content-text">${section.content.replace(/\n/g, '<br>')}</div>
          </div>
        `).join('')}

        <div class="footer">
          <div>この資料は ${data.epoch} で生成されました。</div>
          <div>須藤技術士事務所</div>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  };

  const downloadFile = (htmlContent, filename) => {
    // 新しいウィンドウを開いてPDFを表示
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // 少し待ってから印刷ダイアログを開く
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* オーバーレイ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* モーダル */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">ITサービス資料ダウンロード</h2>
              <p className="text-gray-600 mt-1">無料でITサービス資料をダウンロードできます</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ダウンロード完了！</h3>
              <p className="text-gray-600">ITサービス資料をダウンロードしました。</p>
            </div>
          ) : (
            <>
              {/* フォーム */}
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                {/* エラーメッセージ */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* 基本情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      お名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="山田太郎"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      会社名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="株式会社サンプル"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="03-1234-5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                      役職
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="部長、課長、担当者など"
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                      業界
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">選択してください</option>
                      <option value="製造業">製造業</option>
                      <option value="金融業">金融業</option>
                      <option value="小売業">小売業</option>
                      <option value="IT・通信">IT・通信</option>
                      <option value="医療・福祉">医療・福祉</option>
                      <option value="教育">教育</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="interest" className="block text-sm font-medium text-gray-700 mb-2">
                    興味のある分野
                  </label>
                  <select
                    id="interest"
                    name="interest"
                    value={formData.interest}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">選択してください</option>
                    <option value="システム開発">システム開発</option>
                    <option value="クラウド移行">クラウド移行</option>
                    <option value="データ分析">データ分析</option>
                    <option value="セキュリティ">セキュリティ</option>
                    <option value="DX推進">DX推進</option>
                    <option value="ITコンサルティング">ITコンサルティング</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    メッセージ・ご質問
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="ご質問やご要望がございましたら、お気軽にお書きください"
                  />
                </div>

                {/* ダウンロードボタン */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isLoading || isGeneratingAI}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover-lift text-lg"
                >
                  {isLoading || isGeneratingAI ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      {isGeneratingAI ? 'AI生成中...' : '資料を生成中...'}
                    </div>
                  ) : (
                    'AI生成で資料をダウンロード(無料)'
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

DownloadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DownloadModal;
