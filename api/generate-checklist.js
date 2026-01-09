// api/generate-checklist.js
// Updated to generate 25+ inspection points for Premium

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vehicleInfo, checkType } = req.body;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured in Vercel Environment Variables!');
      return res.status(500).json({ 
        error: 'API Key not configured. Please set GEMINI_API_KEY in Vercel Environment Variables.' 
      });
    }

    // System prompts
    const systemPrompt = checkType === 'lite' 
      ? `You are CheckCar, an AI expert for used car inspections in the European market.

TASK: Create a SHORT Lite Checklist (5-7 points) for used car purchase inspection.

FORMAT: Respond ONLY with a JSON object:
{
  "vehicleInfo": {
    "make": "string",
    "model": "string", 
    "year": "string",
    "type": "string"
  },
  "priceEstimate": {
    "min": number,
    "max": number,
    "average": number
  },
  "liteChecklist": {
    "engine": [
      {"point": "string", "risk": "high|medium|low", "details": "string"}
    ],
    "body": [
      {"point": "string", "risk": "high|medium|low", "details": "string"}
    ]
  }
}

IMPORTANT: 
- Only 5-7 most critical inspection points
- Very specific to the model (mention known issues)
- Realistic European market prices in EUR
- Focus on common defects for this specific model`
      : `You are CheckCar, an AI expert for used car inspections in the European market.

TASK: Create a COMPREHENSIVE Premium Checklist (25-30 points) for used car purchase inspection.

FORMAT: Respond ONLY with a JSON object:
{
  "fullChecklist": {
    "engine": [
      {"point": "string", "risk": "high|medium|low", "details": "string"}
    ],
    "body": [
      {"point": "string", "risk": "high|medium|low", "details": "string"}
    ],
    "electronics": [
      {"point": "string", "risk": "high|medium|low", "details": "string"}
    ],
    "documents": [
      {"point": "string", "risk": "high|medium|low", "details": "string"}
    ]
  }
}

IMPORTANT:
- MINIMUM 25 detailed inspection points, ideally 30
- Distribute evenly across all 4 categories (6-8 points each)
- Cover all major systems and components comprehensively
- Model-specific known weaknesses and common failure points
- Detailed explanations for each point (what to check, why it matters, what to look for)
- Categorize by risk level accurately (high/medium/low)
- Include both visible checks and diagnostic recommendations
- Mention specific parts, components, and areas prone to issues on this model`;

    // Call Gemini API with updated model name
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nVehicle: ${vehicleInfo}\n\nCreate the checklist:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096, // Increased for more detailed responses
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Gemini API Error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response:', data);
      return res.status(500).json({ 
        error: 'Invalid response from Gemini API' 
      });
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const checklist = JSON.parse(jsonMatch[0]);
      return res.status(200).json(checklist);
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
