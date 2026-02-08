// api/analyze-image.js
// Gemini Vision API for vehicle photo analysis

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({ 
        error: 'API Key not configured' 
      });
    }

    // Call Gemini Vision API for vehicle recognition
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
                text: `Analyze this vehicle photo and provide detailed information.

TASK: Identify the vehicle and extract all visible details.

RESPOND WITH THIS JSON FORMAT:
{
  "make": "manufacturer name",
  "model": "model name",
  "generation": "generation/series if identifiable",
  "year": "approximate year range",
  "bodyStyle": "sedan/hatchback/SUV/etc",
  "color": "exterior color",
  "estimatedMileage": "high/medium/low based on condition",
  "condition": "excellent/good/fair/poor",
  "visibleIssues": ["list any visible damage or issues"],
  "extractedInfo": "concise string: Make Model Year, BodyStyle, Color"
}

IMPORTANT:
- Be as specific as possible with make/model/generation
- Note any visible damage, rust, wear
- If you cannot identify the vehicle clearly, respond with:
{
  "error": "Cannot identify vehicle from image",
  "extractedInfo": ""
}

- Extract everything visible even if some details are uncertain`
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
            temperature: 0.2,
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
