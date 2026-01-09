// ChecklistGenerator.jsx - Updated with Auto-Closing Payment Modal
import { useState } from 'react';

export default function ChecklistGenerator() {
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [liteChecklist, setLiteChecklist] = useState(null);
  const [premiumChecklist, setPremiumChecklist] = useState(null);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Generate Free Lite Check
  const handleGenerateLite = async () => {
    if (!vehicleInfo.trim()) {
      setError('Please enter vehicle information');
      return;
    }

    setLoading(true);
    setError(null);
    setLiteChecklist(null);
    setPremiumChecklist(null);

    try {
      const response = await fetch('/api/generate-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vehicleInfo, 
          checkType: 'lite' 
        }),
      });

      if (!response.ok) {
        throw new Error('Error generating checklist');
      }

      const data = await response.json();
      setLiteChecklist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Premium Upgrade
  const handlePremiumUpgrade = async () => {
    setIsProcessingPayment(true);
    
    try {
      // Simulate payment processing (replace with real payment logic)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate Premium Checklist
      const response = await fetch('/api/generate-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vehicleInfo, 
          checkType: 'premium' 
        }),
      });

      if (!response.ok) {
        throw new Error('Error generating premium checklist');
      }

      const data = await response.json();
      setPremiumChecklist(data);
      
      // ✅ FIX: Auto-close modal after successful payment
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      
    } catch (err) {
      setError(err.message);
      setIsProcessingPayment(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚗 CheckCar AI
        </h1>
        <p className="text-gray-600">
          AI-Powered Used Car Inspection Checklists
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Information
        </label>
        <input
          type="text"
          placeholder="e.g. BMW 3 Series E90, Year 2010, Petrol, 180,000 km"
          value={vehicleInfo}
          onChange={(e) => setVehicleInfo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleGenerateLite()}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        
        <button
          onClick={handleGenerateLite}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Free Lite Check...
            </span>
          ) : (
            '✓ Generate Free Lite Check'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Lite Checklist Display */}
      {liteChecklist && !premiumChecklist && (
        <div className="space-y-6">
          {/* Vehicle Info */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">
              {liteChecklist.vehicleInfo.make} {liteChecklist.vehicleInfo.model}
            </h2>
            <p className="text-blue-100">{liteChecklist.vehicleInfo.year} • {liteChecklist.vehicleInfo.type}</p>
          </div>

          {/* Price Estimate */}
          {liteChecklist.priceEstimate && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">💰 Estimated Market Value</h3>
              <p className="text-2xl font-bold text-green-700">
                €{liteChecklist.priceEstimate.min.toLocaleString()} - €{liteChecklist.priceEstimate.max.toLocaleString()}
              </p>
            </div>
          )}

          {/* Lite Checklist */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">🔍 Free Lite Check (Basic Points)</h3>
            <div className="space-y-3">
              {Object.entries(liteChecklist.liteChecklist || {}).map(([category, items]) => (
                items.map((item, idx) => (
                  <div key={`${category}-${idx}`} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
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
                ))
              ))}
            </div>
          </div>

          {/* Premium Upgrade CTA */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">🚀 Unlock Premium Full Check</h3>
            <p className="mb-4 text-purple-100">
              Get 15+ detailed inspection points, risk analysis, repair costs & negotiation tips
            </p>
            <button 
              onClick={() => setShowPaymentModal(true)}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors w-full"
            >
              Pay €2.50 to Unlock Premium Check
            </button>
          </div>
        </div>
      )}

      {/* Premium Checklist Display */}
      {premiumChecklist && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✓</span>
              <h2 className="text-2xl font-bold">Premium Full Check Unlocked!</h2>
            </div>
            <p className="text-green-100">Complete inspection checklist for your purchase decision</p>
          </div>

          {/* Full Checklist by Category */}
          {Object.entries(premiumChecklist.fullChecklist || {}).map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 capitalize">{category}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {items.map((item, idx) => (
                  <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{getRiskIcon(item.risk)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{item.point}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(item.risk)}`}>
                            {item.risk}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{item.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal - WITH AUTO-CLOSE FIX */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Upgrade to Premium</h2>
            <div className="mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-purple-900 mb-2">Premium Full Check includes:</p>
                <ul className="space-y-1 text-sm text-purple-800">
                  <li>✓ 15+ detailed inspection points</li>
                  <li>✓ Model-specific weak points</li>
                  <li>✓ Repair cost estimates</li>
                  <li>✓ Negotiation leverage tips</li>
                  <li>✓ Complete risk analysis</li>
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
                disabled={isProcessingPayment}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePremiumUpgrade}
                disabled={isProcessingPayment}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Pay €2.50'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
