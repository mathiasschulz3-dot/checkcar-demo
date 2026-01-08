// API Route für Vercel: /api/generate-checklist.js
// Diese Datei kommt in deinen Vercel-Projektordner unter /api/

export default async function handler(req, res) {
  // Nur POST-Requests erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vehicleInfo } = req.body;

    // Dein Gemini API Key (später als Environment Variable setzen)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key nicht konfiguriert' });
    }

    // System Prompt - das ist deine "Intelligenz"
    const systemPrompt = `Du bist CheckCar, ein KI-Experte für Gebrauchtwagen-Checks.

DEINE AUFGABE:
Erstelle eine model-spezifische Checkliste für den Gebrauchtwagenkauf basierend auf häufigen Schwachstellen und Verschleißteilen des konkreten Fahrzeugmodells.

FORMAT:
Antworte IMMER als strukturiertes JSON-Objekt mit diesem Format:
{
  "vehicleInfo": {
    "model": "string",
    "year": number,
    "mileage": "string"
  },
  "riskScore": number (0-100),
  "priceEstimate": {
    "min": number,
    "max": number
  },
  "checklistItems": [
    {
      "category": "Motor & Antrieb" | "Fahrwerk & Bremsen" | "Karosserie & Rost" | "Innenraum & Elektronik",
      "item": "string - konkrete Prüfung",
      "risk": "high" | "medium" | "low",
      "why": "string - warum ist das beim konkreten Modell wichtig?"
    }
  ]
}

WICHTIG:
- Sei SEHR spezifisch für das konkrete Modell
- Nenne bekannte Schwachstellen (z.B. "Golf 7 TDI: Prüfe Dieselpartikelfilter auf Verstopfung")
- Kategorisiere nach Risiko: high (kritisch, teuer), medium (wichtig), low (optional)
- Gib realistische Preisspannen an
- Mind. 8-12 Checkpunkte`;

    // API Call zu Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nFahrzeug-Info: ${vehicleInfo}\n\nErstelle die Checkliste:`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;

    // JSON aus der Antwort extrahieren
    let checklist;
    try {
      // Manchmal gibt Gemini ```json ... ``` zurück, das müssen wir bereinigen
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        checklist = JSON.parse(jsonMatch[0]);
      } else {
        checklist = JSON.parse(generatedText);
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', generatedText);
      return res.status(500).json({ 
        error: 'Konnte Checkliste nicht verarbeiten',
        rawResponse: generatedText 
      });
    }

    // Erfolgreiche Antwort
    return res.status(200).json(checklist);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Fehler bei der Checklisten-Erstellung',
      details: error.message 
    });
  }
}
