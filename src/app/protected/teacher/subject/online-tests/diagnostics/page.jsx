'use client';
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function AIDiagnosticsPage() {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/protected/teacher/subject/check-ai-models');
      const data = await response.json();

      setDiagnostics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Running diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">AI System Diagnostics</h1>
            <button
              onClick={runDiagnostics}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {diagnostics && (
            <div className="space-y-6">
              {/* Configuration Status */}
              <div className={`border-2 rounded-lg p-6 ${
                diagnostics.configured 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {diagnostics.configured ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <h2 className="text-xl font-semibold">
                      API Key {diagnostics.configured ? 'Configured' : 'Not Configured'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {diagnostics.configured 
                        ? 'GEMINI_API_KEY is present in environment variables'
                        : 'GEMINI_API_KEY is missing from environment variables'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Available Models */}
              {diagnostics.availableModels && diagnostics.availableModels.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Available Models</h2>
                  <div className="space-y-3">
                    {diagnostics.availableModels.map((model, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg ${
                          model.name === diagnostics.recommendedModel
                            ? 'bg-purple-50 border-2 border-purple-500'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {model.displayName || model.name}
                            </h3>
                            <p className="text-sm text-gray-600">{model.name}</p>
                            {model.description && (
                              <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                            )}
                          </div>
                          {model.name === diagnostics.recommendedModel && (
                            <span className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Troubleshooting */}
              {diagnostics.troubleshooting && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-2">Troubleshooting Steps</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
                        {diagnostics.troubleshooting.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
                <div className="space-y-2">
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-blue-900">Get/Manage API Key</p>
                    <p className="text-sm text-blue-700">https://makersuite.google.com/app/apikey</p>
                  </a>
                  <a
                    href="https://ai.google.dev/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-blue-900">Gemini API Documentation</p>
                    <p className="text-sm text-blue-700">https://ai.google.dev/docs</p>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
