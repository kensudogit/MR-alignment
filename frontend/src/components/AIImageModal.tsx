import React, { useState } from 'react';
import './AIImageModal.css';

interface AIImageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIImageModal: React.FC<AIImageModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState('brain');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const analysisTypes = [
    { value: 'brain', label: '脳MRI', description: '脳の異常検出と解析' },
    { value: 'chest', label: '胸部CT', description: '肺・心臓の異常検出' },
    { value: 'abdomen', label: '腹部CT', description: '内臓器官の解析' },
    { value: 'spine', label: '脊椎MRI', description: '脊椎・脊髄の解析' },
    { value: 'joint', label: '関節MRI', description: '関節・靭帯の解析' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // 実際のAPI呼び出し
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('analysis_type', analysisType);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/ai-analysis`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
      } else {
        // デモ用の模擬結果（APIが利用できない場合）
        console.log('API not available, showing demo results');
        setTimeout(() => {
          setAnalysisResult({
            status: 'success',
            analysis_type: analysisType,
            findings: [
              '異常所見は検出されませんでした',
              '画像品質: 良好',
              '解析信頼度: 95%',
              'デモモード: 実際の解析結果ではありません'
            ],
            recommendations: [
              '定期的なフォローアップを推奨',
              '6ヶ月後の再検査を検討',
              '本格運用時は実際のAI解析を実行します'
            ],
            processing_time: '2.3秒',
            demo_mode: true
          });
        }, 3000);
      }
    } catch (error) {
      // エラー時のデモ用結果
      console.log('API error, showing demo results:', error);
      setTimeout(() => {
        setAnalysisResult({
          status: 'success',
          analysis_type: analysisType,
          findings: [
            'ネットワークエラーのためデモ結果を表示',
            '画像品質: 良好',
            '解析信頼度: 95%',
            'デモモード: 実際の解析結果ではありません'
          ],
          recommendations: [
            '定期的なフォローアップを推奨',
            '6ヶ月後の再検査を検討',
            '本格運用時は実際のAI解析を実行します'
          ],
          processing_time: '2.3秒',
          demo_mode: true
        });
      }, 2000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setPreviewUrl('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-image-modal-overlay" onClick={onClose}>
      <div className="ai-image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="ai-image-modal-close" onClick={onClose}>×</button>
        
        <div className="ai-image-modal-header">
          <h2>🔍 AI画像解析</h2>
          <p>MRI画像をアップロードしてAIによる自動解析を実行</p>
        </div>

        <div className="ai-image-modal-body">
          <div className="upload-section">
            <h3>画像アップロード</h3>
            
            <div className="file-upload-area">
              {!selectedFile ? (
                <div className="upload-placeholder">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*,.dcm"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-upload" className="upload-button">
                    📁 画像を選択
                  </label>
                  <p>DICOM、JPEG、PNG形式に対応</p>
                </div>
              ) : (
                <div className="file-preview">
                  <img src={previewUrl} alt="プレビュー" className="image-preview" />
                  <div className="file-info">
                    <p><strong>ファイル名:</strong> {selectedFile.name}</p>
                    <p><strong>サイズ:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button className="btn-remove" onClick={resetAnalysis}>
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="analysis-settings">
            <h3>解析設定</h3>
            <div className="analysis-type-selector">
              {analysisTypes.map((type) => (
                <div
                  key={type.value}
                  className={`analysis-type-option ${analysisType === type.value ? 'selected' : ''}`}
                  onClick={() => setAnalysisType(type.value)}
                >
                  <div className="option-header">
                    <span className="option-icon">🔬</span>
                    <span className="option-label">{type.label}</span>
                  </div>
                  <p className="option-description">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-actions">
            <button
              className="btn-analyze"
              onClick={handleAnalysis}
              disabled={!selectedFile || isAnalyzing}
            >
              {isAnalyzing ? '🔬 解析中...' : '🚀 AI解析開始'}
            </button>
          </div>

          {isAnalyzing && (
            <div className="analysis-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <p>AIが画像を解析中です...</p>
            </div>
          )}

          {analysisResult && (
            <div className="analysis-results">
              <h3>解析結果</h3>
              
              {analysisResult.status === 'success' ? (
                <div className="results-content">
                  {analysisResult.demo_mode && (
                    <div className="demo-notice">
                      <span className="demo-icon">⚠️</span>
                      <span className="demo-text">デモモード: 実際のAI解析結果ではありません</span>
                    </div>
                  )}
                  <div className="result-summary">
                    <div className="summary-item">
                      <span className="label">解析タイプ:</span>
                      <span className="value">{analysisResult.analysis_type}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">処理時間:</span>
                      <span className="value">{analysisResult.processing_time}</span>
                    </div>
                  </div>

                  <div className="findings-section">
                    <h4>所見</h4>
                    <ul className="findings-list">
                      {analysisResult.findings.map((finding: string, index: number) => (
                        <li key={index} className="finding-item">
                          <span className="finding-icon">📋</span>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="recommendations-section">
                    <h4>推奨事項</h4>
                    <ul className="recommendations-list">
                      {analysisResult.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="recommendation-item">
                          <span className="recommendation-icon">💡</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {analysisResult.message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ai-image-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            閉じる
          </button>
          {analysisResult && (
            <button className="btn-primary" onClick={() => window.print()}>
              📄 レポート印刷
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIImageModal;
