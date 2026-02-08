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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `This is a German vehicle registration document (Fahrzeugschein/Zulassungsbescheinigung Teil I).

CRITICAL: Extract ALL readable vehicle information. Be thorough!

Look for these specific fields and extract EVERYTHING visible:

ESSENTIAL FIELDS:
- Field 2 or D.1: Manufacturer (Hersteller) - usually top right, e.g. "VOLKSWAGEN, VW"
- Field 2.2 or D.3: Commercial name (Handelsbezeichnung) - e.g. "GOLF", "PASSAT"
- Field B: First registration date (Erstzulassung) - format DD.MM.YYYY
- Field E: VIN (Fahrzeug-Identifizierungsnummer) - 17 characters
- Field 5 or P.3: Fuel type (Kraftstoff/Art) - "Benzin", "Diesel", "Elektro"
- Field 7 or P.2: Power in kW - convert to PS (kW × 1.36)
- Field 8 or P.1: Engine displacement (Hubraum) in ccm
- Field 10 or J: Vehicle category (Fahrzeugklasse) - e.g. "M1"
- Field 2.1 or D: Type/Variant code - long alphanumeric code

ADDITIONAL DETAILS (extract if visible):
- Engine code (Motorcode) - usually 3-4 characters
- Transmission type (manual/automatic/DSG)
- Body style (Aufbau) - "Limousine", "Kombi", "Kombinlimousine"
- Emission class - "EURO5", "EURO6"
- Number of cylinders
- CO2 emissions

RESPOND WITH THIS JSON FORMAT:
{
  "make": "full manufacturer name",
  "model": "commercial model name",
  "variant": "type code or variant",
  "firstRegistration": "YYYY-MM-DD",
  "vin": "17-character VIN",
  "displacement": "number (in ccm)",
  "powerKW": "number (in kW)",
  "powerPS": "number (calculated from kW)",
  "fuelType": "Benzin/Diesel/Elektro/etc",
  "engineCode": "engine code if visible",
  "bodyStyle": "Limousine/Kombi/etc",
  "emissionClass": "EURO5/EURO6/etc",
  "transmission": "manual/automatic/DSG if visible",
  "extractedInfo": "VW Golf 7 1.8 TSI, Benzin, 160 PS, 2013" (comprehensive formatted string)
}

IMPORTANT INSTRUCTIONS:
1. READ CAREFULLY - German registration documents have small text
2. Look at BOTH sides of the document if visible
3. Field numbers may be in format "2." or "D.1" - check both
4. Power: Convert kW to PS by multiplying by 1.36 (e.g., 116 kW = 158 PS)
5. The extractedInfo string should be comprehensive and include:
   - Make Model
   - Generation/variant if known
   - Engine size (from displacement)
   - Engine type code if visible
   - Fuel type
   - Power in PS
   - First registration year
   Example: "VW Golf 7 1.8 TSI, Benzin, 160 PS, 2013"

6. If the image is unclear or not a registration document, respond with:
{
  "error": "Document not readable or not a vehicle registration",
  "extractedInfo": ""
}

7. Extract EVERYTHING visible - even partial information is better than nothing!`
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
            temperature: 0.1, // Very low temperature for maximum OCR accuracy
            maxOutputTokens: 2048, // Increased for detailed extraction
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
