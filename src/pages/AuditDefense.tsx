import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, FileText, Scale, Clock } from "lucide-react";
import { ai, TAX_YEARS, type AuditAnalysisResponse } from "@/lib/tauri";
import { useSettingsStore } from "@/store";

export default function AuditDefense() {
  const { hasApiKey } = useSettingsStore();
  const [noticeText, setNoticeText] = useState("");
  const [taxYear, setTaxYear] = useState(2024);
  const [analysis, setAnalysis] = useState<AuditAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!noticeText.trim()) {
      setError("Please enter the audit notice text");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await ai.analyzeAudit(noticeText, taxYear);
      setAnalysis(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "low":
        return { bg: "bg-success-100", text: "text-success-700", icon: CheckCircle };
      case "medium":
        return { bg: "bg-warning-100", text: "text-warning-700", icon: AlertTriangle };
      case "high":
      case "critical":
        return { bg: "bg-danger-100", text: "text-danger-700", icon: AlertTriangle };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", icon: Shield };
    }
  };

  if (!hasApiKey) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">API Key Required</h2>
          <p className="text-gray-500 mb-6">
            Configure your Anthropic API key in Settings to use Audit Defense analysis.
          </p>
          <a href="/settings" className="btn btn-primary">
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Defense</h1>
        <p className="text-gray-500 mt-1">AI-powered analysis of IRS audit notices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Audit Notice</h2>
              <p className="text-sm text-gray-500">Paste or type the notice content</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Tax Year</label>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(parseInt(e.target.value))}
                className="input"
              >
                {TAX_YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Notice Text</label>
              <textarea
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                placeholder="Paste the IRS notice or letter content here..."
                rows={12}
                className="input resize-none"
              />
              <p className="helper-text">
                Include all relevant information from the notice for accurate analysis
              </p>
            </div>

            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !noticeText.trim()}
              className="btn btn-primary w-full"
            >
              {isAnalyzing ? (
                <>
                  <div className="spinner spinner-sm" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Analyze Notice
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {analysis ? (
            <>
              {/* Risk Level */}
              <div className={`card p-6 ${getRiskColor(analysis.risk_level).bg}`}>
                <div className="flex items-center gap-4">
                  {(() => {
                    const { icon: Icon, text } = getRiskColor(analysis.risk_level);
                    return (
                      <>
                        <Icon className={`w-12 h-12 ${text}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Risk Level</p>
                          <p className={`text-2xl font-bold ${text} capitalize`}>
                            {analysis.risk_level}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Deadline */}
              {analysis.response_deadline && (
                <div className="card p-4 border-l-4 border-warning-500">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-warning-600" />
                    <div>
                      <p className="text-sm text-gray-500">Response Deadline</p>
                      <p className="font-semibold text-gray-900">{analysis.response_deadline}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
                <p className="text-gray-600">{analysis.summary}</p>
              </div>

              {/* Recommended Actions */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Recommended Actions</h3>
                <ul className="space-y-2">
                  {analysis.recommended_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal Citations */}
              {analysis.legal_citations.length > 0 && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Legal Citations</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.legal_citations.map((citation, i) => (
                      <span key={i} className="badge badge-gray">
                        {citation}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Defense Strategy */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Defense Strategy</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{analysis.defense_strategy}</p>
              </div>

              {/* Disclaimer */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                <p>
                  <strong>Disclaimer:</strong> This analysis is AI-generated and for informational 
                  purposes only. It does not constitute legal or tax advice. Consult with a 
                  qualified tax professional or attorney for your specific situation.
                </p>
              </div>
            </>
          ) : (
            <div className="card p-12 text-center h-full flex flex-col items-center justify-center">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Audit Analysis</h3>
              <p className="text-gray-500 max-w-sm">
                Paste your IRS notice and click Analyze to get a comprehensive defense strategy 
                with relevant legal citations
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
