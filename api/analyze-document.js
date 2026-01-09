// api/analyze-document.js
// Gemini Vision API for Fahrzeugschein (registration document) OCR

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { document, documentType } = req.body;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({ 
        error: 'API Key not configured' 
      });
    }

    // Call Gemini Vision API for OCR
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `This is a vehicle registration document (Fahrzeugschein/Zulassungsbescheinigung).

Extract the following information:
- Make (Hersteller/Marke) - field D.1 or 2.1
- Model (Handelsbezeichnung) - field D.2 or 2.2
- Type/Variant (Typ/Variante) - field D.3 or D
- First Registration (Erstzulassung) - field B or I
- VIN (Fahrzeug-Identifizierungsnummer) - field E or 4
- Engine Displacement (Hubraum) - field P.1 or 8
- Power (Leistung) - field P.2 or 7
- Fuel Type (Kraftstoff) - field P.3 or 5

Respond ONLY with a JSON object:
{
  "make": "string",
  "model": "string",
  "variant": "string",
  "firstRegistration": "YYYY-MM-DD",
  "vin": "string",
  "displacement": "number ccm",
  "power": "number kW/PS",
  "fuelType": "string",
  "extractedInfo": "Make Model, Year FirstReg, FuelType, Power" (concise string for text input)
}

If the document is not readable or not a vehicle registration, respond with:
{
  "error": "Document not readable or not a vehicle registration",
  "extractedInfo": ""
}

Important: 
- Look for fields with labels like "2.", "2.1", "2.2", "D.1", "D.2", "B", "E", etc.
- German registration documents have these specific field numbers
- Extract ALL readable information even if some fields are unclear`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: document
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2, // Lower temperature for accurate OCR
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Vision API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Vision API Error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response:', data);
      return res.status(500).json({ 
        error: 'Invalid response from Vision API' 
      });
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      
      // Check if there was an error reading the document
      if (result.error) {
        return res.status(400).json({ 
          error: result.error,
          extractedInfo: '' 
        });
      }
      
      return res.status(200).json(result);
    } else {
      console.error('Could not parse JSON from:', generatedText);
      return res.status(500).json({ 
        error: 'Could not parse API response',
        rawResponse: generatedText 
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
