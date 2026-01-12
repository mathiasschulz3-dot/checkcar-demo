// api/generate-checklist.js
// Enhanced with MODEL-SPECIFIC problem detection from KBA, TÜV reports, and owner forums

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

    // System prompts with MODEL-SPECIFIC problem focus
    const systemPrompt = checkType === 'lite' 
      ? `You are CheckCar, an AI expert for used car inspections in the European market with deep knowledge of model-specific problems from KBA recalls, TÜV reports, and owner forums.

TASK: Create a SHORT Lite Checklist (5-7 points) for used car purchase inspection.

CRITICAL INSTRUCTION - MODEL-SPECIFIC PROBLEMS:
1. Research and include KNOWN PROBLEMS for this specific make/model/year
2. Reference common issues from:
   - KBA recalls (Kraftfahrt-Bundesamt)
   - TÜV inspection statistics
   - Owner forums and reports
   - Technical service bulletins
3. Mention SPECIFIC parts and components known to fail
4. Include typical mileage when problems occur
5. Name actual defect patterns (e.g., "versottete Kolbenringe", "defekter AGR-Kühler")

EXAMPLE for VW T6 2.0 BiTDI 204 PS:
- "Hoher Ölverbrauch (versottete Kolbenringe)" 
- "AGR-System-Defekte (Abgasrückführung) - defekte AGR-Kühler/Ventile"
- "Kühlmittelverlust und gerissene Abgasrohre"
- "Zweimassenschwungrad-Probleme"

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
      {"point": "string", "risk": "high|medium|low", "details": "string with SPECIFIC known problems"}
    ],
    "body": [
      {"point": "string", "risk": "high|medium|low", "details": "string with SPECIFIC known problems"}
    ]
  }
}

IMPORTANT: 
- Only 5-7 most critical inspection points
- MUST include known model-specific weaknesses with specific component names
- Realistic European market prices in EUR
- Focus on DOCUMENTED common defects for this exact model/engine variant
- Use technical terminology and specific part names`
      : `You are CheckCar, an AI expert for used car inspections in the European market with deep knowledge of model-specific problems from KBA recalls, TÜV reports, and owner forums.

TASK: Create a COMPREHENSIVE Premium Checklist (25-30 points) for used car purchase inspection.

CRITICAL INSTRUCTION - MODEL-SPECIFIC PROBLEMS:
1. Research and include KNOWN PROBLEMS for this specific make/model/year/engine
2. Reference common issues from:
   - KBA recalls (Kraftfahrt-Bundesamt German Federal Motor Transport Authority)
   - TÜV inspection failure statistics
   - Owner forums (motor-talk.de, vwt6forum.de, etc.)
   - Technical service bulletins and dealer known issues
   - ADAC reports and consumer protection data
3. Mention SPECIFIC parts, components, and part numbers when known
4. Include typical mileage ranges when problems typically occur
5. Name actual defect patterns and failure modes
6. Mention if issues are covered by manufacturer extensions or recalls

EXAMPLE SPECIFICITY for VW T6 2.0 BiTDI 204 PS:
❌ GENERIC: "Check engine oil level"
✅ SPECIFIC: "Hoher Ölverbrauch durch versottete Kolbenringe (bekanntes Problem bei EA288-Motor, besonders bei Baujahren 2015-2017). Ölstand prüfen und Verbrauch dokumentieren. Ölverbrauch >0.5L/1000km deutet auf Motorschaden hin."

❌ GENERIC: "Inspect exhaust system"
✅ SPECIFIC: "AGR-System-Defekte (Abgasrückführung): Prüfe AGR-Kühler und AGR-Ventil auf Verkokung und Defekte. Gerissene Abgasrohre häufig bei diesem Motor. Führt oft zu schweren Motorschäden durch thermische Überlastung. Reparaturkosten: €2000-4000."

❌ GENERIC: "Check transmission"
✅ SPECIFIC: "Zweimassenschwungrad-Probleme: Bei DSG und manuell häufig defekt ab 120.000 km. Prüfe auf Rattern beim Anfahren, Vibrationen im Leerlauf. Austausch: €1500-2500."

FORMAT: Respond ONLY with a JSON object:
{
  "fullChecklist": {
    "engine": [
      {"point": "string with specific component name", "risk": "high|medium|low", "details": "string with KNOWN problems, typical mileage, repair costs"}
    ],
    "transmission": [
      {"point": "string with specific component name", "risk": "high|medium|low", "details": "string with KNOWN problems"}
    ],
    "chassis": [
      {"point": "string with specific component name", "risk": "high|medium|low", "details": "string with KNOWN problems"}
    ],
    "body": [
      {"point": "string with specific component name", "risk": "high|medium|low", "details": "string with KNOWN problems"}
    ],
    "electronics": [
      {"point": "string with specific component name", "risk": "high|medium|low", "details": "string with KNOWN problems"}
    ],
    "interior": [
      {"point": "string with specific component name", "risk": "high|medium|low", "details": "string with KNOWN problems"}
    ],
    "documents": [
      {"point": "string", "risk": "high|medium|low", "details": "string"}
    ]
  }
}

IMPORTANT:
- MINIMUM 25 detailed inspection points, ideally 30
- Distribute across categories: engine (6-7), transmission (4-5), chassis (4-5), body (3-4), electronics (3-4), interior (2-3), documents (2-3)
- EVERY point must reference model-specific known issues when they exist
- Include specific part names, component codes, typical failure patterns
- Mention repair costs when known (German market prices)
- Reference specific forums, recalls, or bulletins when relevant
- Use technical German automotive terminology
- Prioritize issues that lead to expensive repairs or safety concerns
- Include diagnostic tips (sounds, symptoms, visual indicators)`;

    // Call Gemini API with grounding for real-world data
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
              text: `${systemPrompt}\n\nVehicle: ${vehicleInfo}\n\nIMPORTANT: Research known problems for this specific model from KBA recalls, TÜV reports, forums, and technical bulletins. Include specific component names and failure patterns.\n\nCreate the checklist:`
            }]
          }],
          generationConfig: {
            temperature: 0.4, // Lower temperature for more factual, less creative output
            maxOutputTokens: 8192, // Increased for detailed model-specific information
            topP: 0.95,
            topK: 40
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
