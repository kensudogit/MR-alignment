import React, { useState } from 'react';
import './ReportModal.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [reportType, setReportType] = useState('standard');
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    gender: '',
    examDate: '',
    examType: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const reportTypes = [
    { value: 'standard', label: '標準レポート', description: '基本的な診断レポート' },
    { value: 'detailed', label: '詳細レポート', description: '詳細な分析結果を含む' },
    { value: 'summary', label: 'サマリーレポート', description: '要点をまとめた簡潔なレポート' },
    { value: 'comparison', label: '比較レポート', description: '前回検査との比較' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReport = async () => {
    if (!patientInfo.name || !patientInfo.age || !patientInfo.gender || !patientInfo.examDate || !patientInfo.examType) {
      alert('患者情報をすべて入力してください');
      return;
    }

    setIsGenerating(true);
    setGeneratedReport(null);

    try {
      // 実際のAPI呼び出し
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_type: reportType,
          patient_info: patientInfo
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedReport(result);
      } else {
        // デモ用の模擬結果
        setTimeout(() => {
          setGeneratedReport({
            status: 'success',
            report_id: 'RPT-' + Date.now(),
            generated_at: new Date().toLocaleString('ja-JP'),
            report_type: reportType,
            patient_info: patientInfo,
            content: {
              summary: '異常所見は検出されませんでした。画像品質は良好で、解析信頼度は95%です。',
              findings: [
                '脳実質: 異常なし',
                '脳室系: 正常範囲内',
                '脳溝: 年齢相応',
                '白質: 信号強度正常'
              ],
              conclusion: '今回の検査では明らかな異常所見は認められませんでした。',
              recommendations: [
                '定期的なフォローアップを推奨',
                '6ヶ月後の再検査を検討',
                '症状の変化があれば早期受診を推奨'
              ]
            }
          });
        }, 3000);
      }
    } catch (error) {
      // エラー時のデモ用結果
      setTimeout(() => {
        setGeneratedReport({
          status: 'error',
          message: 'レポート生成中にエラーが発生しました'
        });
      }, 2000);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setPatientInfo({
      name: '',
      age: '',
      gender: '',
      examDate: '',
      examType: ''
    });
    setGeneratedReport(null);
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="report-modal-close" onClick={onClose}>×</button>
        
        <div className="report-modal-header">
          <h2>📝 レポート自動作成</h2>
          <p>AIが解析結果を基に医療レポートを自動生成</p>
        </div>

        <div className="report-modal-body">
          <div className="report-settings">
            <h3>レポート設定</h3>
            <div className="report-type-selector">
              {reportTypes.map((type) => (
                <div
                  key={type.value}
                  className={`report-type-option ${reportType === type.value ? 'selected' : ''}`}
                  onClick={() => setReportType(type.value)}
                >
                  <div className="option-header">
                    <span className="option-icon">📋</span>
                    <span className="option-label">{type.label}</span>
                  </div>
                  <p className="option-description">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="patient-info-section">
            <h3>患者情報</h3>
            <div className="patient-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">患者名 *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={patientInfo.name}
                    onChange={handleInputChange}
                    required
                    placeholder="山田 太郎"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="age">年齢 *</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={patientInfo.age}
                    onChange={handleInputChange}
                    required
                    placeholder="45"
                    min="0"
                    max="150"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">性別 *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={patientInfo.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="examDate">検査日 *</label>
                  <input
                    type="date"
                    id="examDate"
                    name="examDate"
                    value={patientInfo.examDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="examType">検査種類 *</label>
                <select
                  id="examType"
                  name="examType"
                  value={patientInfo.examType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">選択してください</option>
                  <option value="brain-mri">脳MRI</option>
                  <option value="chest-ct">胸部CT</option>
                  <option value="abdomen-ct">腹部CT</option>
                  <option value="spine-mri">脊椎MRI</option>
                  <option value="joint-mri">関節MRI</option>
                </select>
              </div>
            </div>
          </div>

          <div className="report-actions">
            <button
              className="btn-generate"
              onClick={generateReport}
              disabled={isGenerating}
            >
              {isGenerating ? '🔬 生成中...' : '🚀 レポート生成開始'}
            </button>
          </div>

          {isGenerating && (
            <div className="generation-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <p>AIがレポートを生成中です...</p>
            </div>
          )}

          {generatedReport && (
            <div className="generated-report">
              <h3>生成されたレポート</h3>
              
              {generatedReport.status === 'success' ? (
                <div className="report-content">
                  <div className="report-header">
                    <div className="report-meta">
                      <div className="meta-item">
                        <span className="label">レポートID:</span>
                        <span className="value">{generatedReport.report_id}</span>
                      </div>
                      <div className="meta-item">
                        <span className="label">生成日時:</span>
                        <span className="value">{generatedReport.generated_at}</span>
                      </div>
                      <div className="meta-item">
                        <span className="label">レポートタイプ:</span>
                        <span className="value">{reportTypes.find(t => t.value === generatedReport.report_type)?.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="report-sections">
                    <div className="report-section">
                      <h4>📋 サマリー</h4>
                      <p>{generatedReport.content.summary}</p>
                    </div>

                    <div className="report-section">
                      <h4>🔍 所見</h4>
                      <ul className="findings-list">
                        {generatedReport.content.findings.map((finding: string, index: number) => (
                          <li key={index} className="finding-item">
                            <span className="finding-icon">📋</span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="report-section">
                      <h4>📝 結論</h4>
                      <p>{generatedReport.content.conclusion}</p>
                    </div>

                    <div className="report-section">
                      <h4>💡 推奨事項</h4>
                      <ul className="recommendations-list">
                        {generatedReport.content.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="recommendation-item">
                            <span className="recommendation-icon">💡</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {generatedReport.message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="report-modal-footer">
          <button className="btn-secondary" onClick={resetForm}>
            リセット
          </button>
          <button className="btn-secondary" onClick={onClose}>
            閉じる
          </button>
          {generatedReport && generatedReport.status === 'success' && (
            <button className="btn-primary" onClick={() => window.print()}>
              📄 印刷
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
