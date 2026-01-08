// React-Komponente: ChecklistGenerator.jsx
// Diese Komponente kannst du in deine CheckCar-App einbauen

import { useState } from 'react';

export default function ChecklistGenerator() {
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!vehicleInfo.trim()) {
      setError('Bitte Fahrzeugdaten eingeben');
      return;
    }

    setLoading(true);
    setError(null);
    setChecklist(null);

    try {
      const response = await fetch('/api/generate-checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleInfo }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Generieren der Checkliste');
      }

      const data = await response.json();
      setChecklist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          Intelligente Checklisten für deinen Gebrauchtwagenkauf
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fahrzeug-Informationen
        </label>
        <input
          type="text"
          placeholder="z.B. VW Golf 7, Baujahr 2015, Diesel, 120.000 km"
          value={vehicleInfo}
          onChange={(e) => setVehicleInfo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Checkliste wird erstellt...
            </span>
          ) : (
            '🔍 Checkliste generieren'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Checklist Display */}
      {checklist && (
        <div className="space-y-6">
          {/* Vehicle Info Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">
              {checklist.vehicleInfo.model}
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Baujahr</p>
                <p className="text-xl font-semibold">{checklist.vehicleInfo.year}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Laufleistung</p>
                <p className="text-xl font-semibold">{checklist.vehicleInfo.mileage}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Risiko-Score</p>
                <p className="text-xl font-semibold">{checklist.riskScore}/100</p>
              </div>
            </div>
          </div>

          {/* Price Estimate */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">💰 Geschätzter Marktwert</h3>
            <p className="text-2xl font-bold text-green-700">
              {checklist.priceEstimate.min.toLocaleString('de-DE')} € - {checklist.priceEstimate.max.toLocaleString('de-DE')} €
            </p>
          </div>

          {/* Checklist Items by Category */}
          {['Motor & Antrieb', 'Fahrwerk & Bremsen', 'Karosserie & Rost', 'Innenraum & Elektronik'].map(category => {
            const items = checklist.checklistItems.filter(item => item.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">{category}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {getRiskIcon(item.risk)}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{item.item}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(item.risk)}`}>
                              {item.risk === 'high' ? 'Hohes Risiko' : item.risk === 'medium' ? 'Mittleres Risiko' : 'Geringes Risiko'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{item.why}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Premium CTA */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white text-center">
            <h3 className="text-xl font-bold mb-2">🚀 Upgrade für mehr Features</h3>
            <p className="mb-4 text-purple-100">
              Detaillierte Reparaturkosten, Werkstatt-Empfehlungen & mehr
            </p>
            <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
              Premium für 4,99€ freischalten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
