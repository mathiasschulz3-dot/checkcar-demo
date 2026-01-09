// api/analyze-image.js
// Gemini Vision API for car photo recognition

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, analysisType } = req.body;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({ 
        error: 'API Key not configured' 
      });
    }

    // Call Gemini Vision API
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
                text: `Analyze this car image and identify:
- Make (brand)
- Model
- Approximate year/generation
- Body type (sedan, hatchback, SUV, etc.)

Respond ONLY with a JSON object:
{
  "make": "string",
  "model": "string",
  "year": "string or range",
  "bodyType": "string",
  "vehicleDescription": "Make Model Year" (concise string for text input)
}

If you cannot identify the car with confidence, set all fields to "unknown".`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
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
