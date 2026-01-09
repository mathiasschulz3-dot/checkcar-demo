// ChecklistGenerator-MULTIMODAL.jsx
// 🚀 BOLD Awards Version - Multimodal Input
// Photo | Document | Text | Voice

import { useState, useRef } from 'react';

export default function ChecklistGenerator() {
  // Input modes
  const [inputMode, setInputMode] = useState('select'); // select, photo, document, text, voice
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // States from previous version
  const [loading, setLoading] = useState(false);
  const [liteChecklist, setLiteChecklist] = useState(null);
  const [premiumChecklist, setPremiumChecklist] = useState(null);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  // Handle Photo Upload
  const handlePhotoUpload = async (file) => {
    setUploadedFile(file);
    setLoading(true);
    setError(null);

    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64,
          analysisType: 'vehicle-identification'
        }),
      });

      if (!response.ok) throw new Error('Image analysis failed');

      const data = await response.json();
      setVehicleInfo(data.vehicleDescription || '');
      setInputMode('text');
      
    } catch (err) {
      setError('Could not analyze image. Please try text input instead.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Document Scan (Fahrzeugschein)
  const handleDocumentScan = async (file) => {
    setUploadedFile(file);
    setLoading(true);
    setError(null);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          document: base64,
          documentType: 'registration'
        }),
      });

      if (!response.ok) throw new Error('Document analysis failed');

      const data = await response.json();
      setVehicleInfo(data.extractedInfo || '');
      setInputMode('text');
      
    } catch (err) {
      setError('Could not read document. Please try text input instead.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Voice Input
  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice input not supported in your browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'de-DE'; // German
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVehicleInfo(transcript);
      setInputMode('text');
      setIsRecording(false);
    };

    recognitionRef.current.onerror = (event) => {
      setError('Voice recognition error. Please try again.');
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Generate Checklist (from previous version)
  const handleGenerateLite = async () => {
    if (!vehicleInfo.trim()) {
      setError('Please enter vehicle information');
      return;
    }

    setLoading(true);
    setError(null);
    setLiteChecklist(null);
    setPremiumChecklist(null);
    setCheckedItems({});

    try {
      const response = await fetch('/api/generate-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vehicleInfo, 
          checkType: 'lite' 
        }),
      });

      if (!response.ok) throw new Error('Error generating checklist');

      const data = await response.json();
      setLiteChecklist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Premium Upgrade (from previous version)
  const handlePremiumUpgrade = async () => {
    setIsProcessingPayment(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await fetch('/api/generate-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vehicleInfo, 
          checkType: 'premium' 
        }),
      });

      if (!response.ok) throw new Error('Error generating premium checklist');

      const data = await response.json();
      setPremiumChecklist(data);
      
      setTimeout(() => {
        setIsProcessingPayment(false);
        setShowPaymentModal(false);
      }, 500);
      
    } catch (err) {
      setError(err.message);
      setIsProcessingPayment(false);
    }
  };

  const toggleCheckbox = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="text-5xl">🚗</div>
          <h1 className="text-4xl font-bold text-gray-900">CheckCar</h1>
        </div>
        <p className="text-xl text-gray-600 mb-2">
          AI-Powered Used Car Inspection
        </p>
        <p className="text-sm text-gray-500">
          Photo • Document • Text • Voice
        </p>
      </div>

      {/* MODE SELECTION - The WOW Factor! */}
      {inputMode === 'select' && !liteChecklist && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              How do you want to start?
            </h2>
            <p className="text-gray-600">
              Choose your preferred input method
            </p>
          </div>

          {/* 4 Input Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Photo Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]);
                }}
              />
              <div className="text-center">
                <div className="text-5xl mb-3">📸</div>
                <h3 className="text-xl font-bold mb-2">Take Photo</h3>
                <p className="text-blue-100 text-sm">
                  Snap a picture of the car
                </p>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
            </button>

            {/* Document Scan */}
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  if (e.target.files?.[0]) handleDocumentScan(e.target.files[0]);
                };
                input.click();
              }}
              className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 text-white hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">📄</div>
                <h3 className="text-xl font-bold mb-2">Scan Document</h3>
                <p className="text-purple-100 text-sm">
                  Upload registration/VIN
                </p>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
            </button>

            {/* Text Input */}
            <button
              onClick={() => setInputMode('text')}
              className="group relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">✍️</div>
                <h3 className="text-xl font-bold mb-2">Type Details</h3>
                <p className="text-green-100 text-sm">
                  Enter vehicle information
                </p>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
            </button>

            {/* Voice Input */}
            <button
              onClick={startVoiceRecording}
              className="group relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">🎤</div>
                <h3 className="text-xl font-bold mb-2">Voice Input</h3>
                <p className="text-orange-100 text-sm">
                  Just speak the details
                </p>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
            </button>

          </div>

          {/* Quick Examples */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">💡 Quick Start Examples:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>• BMW 3 Series E90, 2010, 180k km</div>
              <div>• VW Golf 7 GTI, 2015, DSG</div>
              <div>• Audi A4 B8, 2012, TDI, 200k km</div>
              <div>• Mercedes C-Class W204, 2011</div>
            </div>
          </div>
        </div>
      )}

      {/* VOICE RECORDING ACTIVE */}
      {isRecording && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="inline-block relative mb-6">
                <div className="text-6xl">🎤</div>
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Listening...</h3>
              <p className="text-gray-600 mb-6">
                Speak the vehicle details clearly
              </p>
              <button
                onClick={stopVoiceRecording}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Stop Recording
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEXT INPUT MODE */}
      {inputMode === 'text' && !liteChecklist && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Vehicle Information
            </label>
            <button
              onClick={() => {
                setInputMode('select');
                setVehicleInfo('');
                setUploadedFile(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Change Input Method
            </button>
          </div>
          
          <input
            type="text"
            placeholder="e.g. BMW 3 Series E90, Year 2010, Petrol, 180,000 km"
            value={vehicleInfo}
            onChange={(e) => setVehicleInfo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerateLite()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            disabled={loading}
          />
          
          <button
            onClick={handleGenerateLite}
            disabled={loading || !vehicleInfo.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing Vehicle...
              </span>
            ) : (
              '✓ Generate Free Inspection Check'
            )}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && inputMode !== 'text' && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing...</h3>
          <p className="text-gray-600">Processing your input</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">❌ {error}</p>
          <button
            onClick={() => {
              setError(null);
              setInputMode('select');
            }}
            className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium"
          >
            Try another method →
          </button>
        </div>
      )}

      {/* REST OF THE COMPONENT - Checklist Display, Premium Modal, etc. */}
      {/* [Previous checklist display code remains the same] */}
      {/* ... keeping all the existing checklist rendering logic ... */}
      
      {/* Lite Checklist Display */}
      {liteChecklist && !premiumChecklist && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">
              {liteChecklist.vehicleInfo.make} {liteChecklist.vehicleInfo.model}
            </h2>
            <p className="text-blue-100">{liteChecklist.vehicleInfo.year} • {liteChecklist.vehicleInfo.type}</p>
          </div>

          {liteChecklist.priceEstimate && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">💰 Estimated Market Value</h3>
              <p className="text-2xl font-bold text-green-700">
                €{liteChecklist.priceEstimate.min.toLocaleString()} - €{liteChecklist.priceEstimate.max.toLocaleString()}
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">🔍 Free Lite Check</h3>
            <div className="space-y-3">
              {Object.entries(liteChecklist.liteChecklist || {}).map(([category, items]) => (
                items.map((item, idx) => {
                  const itemId = `lite-${category}-${idx}`;
                  return (
                    <div key={itemId} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
                      <span className="text-2xl">{getRiskIcon(item.risk)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{item.point}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(item.risk)}`}>
                            {item.risk}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{item.details}</p>
                      </div>
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">🚀 Unlock Premium Full Check</h3>
            <p className="mb-4 text-purple-100">
              Get 25-30+ detailed inspection points with interactive checkboxes
            </p>
            <button 
              onClick={() => setShowPaymentModal(true)}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors w-full"
            >
              Upgrade to Premium - €2.50
            </button>
          </div>
        </div>
      )}

      {/* Premium Checklist with Checkboxes */}
      {premiumChecklist && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✓</span>
              <h2 className="text-2xl font-bold">Premium Check Unlocked!</h2>
            </div>
            <p className="text-green-100">Complete inspection with interactive checkboxes</p>
          </div>

          {Object.keys(checkedItems).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">
                  {Object.values(checkedItems).filter(Boolean).length} / {Object.keys(checkedItems).length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(Object.values(checkedItems).filter(Boolean).length / Object.keys(checkedItems).length) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {Object.entries(premiumChecklist.fullChecklist || {}).map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 capitalize">{category}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {items.map((item, idx) => {
                  const itemId = `${category}-${idx}`;
                  const isChecked = checkedItems[itemId];
                  
                  return (
                    <div 
                      key={itemId} 
                      className={`p-4 hover:bg-gray-50 transition-colors ${isChecked ? 'bg-green-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={() => toggleCheckbox(itemId)}
                          className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                        <span className="text-2xl flex-shrink-0">{getRiskIcon(item.risk)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold ${isChecked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {item.point}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(item.risk)}`}>
                              {item.risk}
                            </span>
                          </div>
                          <p className={`text-sm ${isChecked ? 'text-gray-500' : 'text-gray-600'}`}>
                            {item.details}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(checkedItems).length > 0 && 
           Object.values(checkedItems).filter(Boolean).length === Object.keys(checkedItems).length && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <span className="text-4xl mb-2 block">🎉</span>
              <h3 className="text-xl font-bold text-green-900 mb-2">Inspection Complete!</h3>
              <p className="text-green-700">All items checked. Make your decision!</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {!isProcessingPayment ? (
              <>
                <h2 className="text-2xl font-bold mb-4">Upgrade to Premium</h2>
                <div className="mb-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <p className="font-semibold text-purple-900 mb-2">Premium includes:</p>
                    <ul className="space-y-1 text-sm text-purple-800">
                      <li>✓ 25-30+ detailed points</li>
                      <li>✓ Interactive checkboxes</li>
                      <li>✓ Model-specific issues</li>
                      <li>✓ Repair cost estimates</li>
                      <li>✓ Negotiation tips</li>
                    </ul>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">€2.50</p>
                    <p className="text-sm text-gray-600">One-time payment</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handlePremiumUpgrade}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Pay €2.50 & Unlock
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-purple-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Processing...</h3>
                <p className="text-gray-600">Generating premium checklist</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
