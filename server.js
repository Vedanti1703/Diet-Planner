// Enhanced Diet Planner Backend with Comprehensive Meal APIs

// ...

const express = require('express');
require('dotenv').config(); // <-- this line
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'diet_planner_secret_2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Data folder and files
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const usersFile = path.join(dataDir, 'users.json');
const mealsFile = path.join(dataDir, 'meals.json');
const preferencesFile = path.join(dataDir, 'preferences.json');
const healthLogsFile = path.join(dataDir, 'health_logs.json');

// Initialize files
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf8');
if (!fs.existsSync(mealsFile)) fs.writeFileSync(mealsFile, '{}', 'utf8');
if (!fs.existsSync(preferencesFile)) fs.writeFileSync(preferencesFile, '{}', 'utf8');
if (!fs.existsSync(healthLogsFile)) fs.writeFileSync(healthLogsFile, '{}', 'utf8');

// Helper functions
function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('readJSON error:', err);
    return [];
  }
}

function writeJSON(filePath, obj) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('writeJSON error:', err);
    return false;
  }
}

// Authentication middleware
function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No authorization header' });

  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// Utility to clean incoming values
function toNumberOrUndefined(val) {
  const n = (val === '' || val === null || val === undefined) ? undefined : Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function mergeDietPrefs(existing, incoming) {
  const base = existing && typeof existing === 'object' ? { ...existing } : {};

  if (incoming.dietType) base.dietType = incoming.dietType;

  const h = toNumberOrUndefined(incoming.height);
  if (h !== undefined) base.height = h;

  const w = toNumberOrUndefined(incoming.weight);
  if (w !== undefined) base.weight = w;

  const gw = toNumberOrUndefined(incoming.goalWeight);
  if (gw !== undefined) base.goalWeight = gw;

  if (incoming.activityLevel) base.activityLevel = incoming.activityLevel;

  const ct = toNumberOrUndefined(incoming.calorieTarget);
  if (ct !== undefined) base.calorieTarget = ct;

  const b = toNumberOrUndefined(incoming.bmi);
  if (b !== undefined) base.bmi = b;

  base.updatedAt = new Date().toISOString();
  return base;
}

// ============ ROUTES ============

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Diet Planner Backend Running' });
});

// Enhanced AI Chat endpoint with personalization and context awareness
app.post('/ai/chat', async (req, res) => {
  try {
    const { message, history = [], userProfile = {}, healthData = {} } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    // Enhanced local responder with comprehensive answers for common questions
    const localResponder = (text) => {
      const q = String(text).toLowerCase();
      
      // Greetings
      if (/hello|hi|hey/.test(q)) return 'Hi! I\'m your personal nutrition and fitness assistant. I can help you with diet planning, meal suggestions, exercise recommendations, and health tracking. What would you like to know?';
      
      // Weight loss and fat loss questions
      if (/lose\s*stomach\s*fat|belly\s*fat|abdominal\s*fat|lose\s*belly/.test(q)) {
        return 'To lose stomach fat: 1) Create a calorie deficit (300-500 calories below maintenance), 2) Do cardio 3-4x/week (30-45 min), 3) Strength training 2-3x/week (focus on compound movements), 4) Eat high protein (1.2-2g per kg body weight), 5) Reduce processed foods and sugar, 6) Get 7-9 hours sleep, 7) Manage stress. Note: You can\'t spot-reduce fat, but these strategies help overall fat loss including the stomach area.';
      }
      if (/lose\s*weight|weight\s*loss/.test(q)) {
        return 'Weight loss strategy: 1) Moderate calorie deficit (300-500 calories), 2) High protein intake (1.2-2g per kg), 3) Strength training 2-3x/week, 4) Cardio 3-4x/week, 5) 7-9 hours sleep, 6) Stay hydrated, 7) Be consistent and patient. Aim for 0.5-1kg loss per week for sustainable results.';
      }
      if (/burn\s*fat|fat\s*burning/.test(q)) {
        return 'To burn fat effectively: 1) Maintain a calorie deficit, 2) Do HIIT workouts 2-3x/week, 3) Strength training to build muscle (muscle burns more calories), 4) Eat protein with every meal, 5) Stay hydrated, 6) Get adequate sleep, 7) Be consistent. Fat burning happens when you burn more calories than you consume.';
      }
      
      // Exercise and fitness
      if (/exercise|workout|fitness/.test(q)) {
        return 'Exercise recommendations: 150 minutes moderate cardio + 2 strength sessions weekly. Start gradually, find activities you enjoy, and focus on consistency over intensity. Include both cardio and strength training for best results.';
      }
      if (/abs|abdominal|core/.test(q)) {
        return 'For stronger abs: 1) Planks (30-60 seconds), 2) Dead bugs, 3) Bird dogs, 4) Russian twists, 5) Mountain climbers. Do 3-4 sets, 2-3x/week. Remember: visible abs require low body fat percentage (10-15% for men, 16-20% for women) achieved through diet and overall fat loss.';
      }
      if (/cardio|running|walking/.test(q)) {
        return 'Cardio benefits: improves heart health, burns calories, boosts mood. Types: 1) Steady-state (30-45 min moderate pace), 2) HIIT (20-30 min intervals), 3) Walking (10,000 steps daily). Start with 3x/week, gradually increase frequency and intensity.';
      }
      
      // Nutrition and diet
      if (/calorie|calories/.test(q)) {
        return 'Daily calorie needs depend on age, sex, height, weight, and activity level. For weight loss, aim for a 300-500 calorie deficit. For maintenance, eat at your TDEE. Track your progress and adjust as needed.';
      }
      if (/protein/.test(q)) {
        return 'Protein needs: 1.2-2.2g per kg body weight daily. Higher for athletes or those in a calorie deficit. Good sources: lean meats, fish, eggs, dairy, legumes, nuts, and seeds. Protein helps with muscle building and satiety.';
      }
      if (/keto/.test(q)) {
        return 'Keto diet: <20g carbs daily, 70-80% fat, 15-25% protein. Focus on: meats, fish, eggs, cheese, avocados, nuts, low-carb vegetables. Avoid: grains, fruits, sugars, starchy vegetables. Can be effective for weight loss but may be difficult to maintain long-term.';
      }
      if (/vegan/.test(q)) {
        return 'Vegan diet excludes all animal products. Focus on: legumes, tofu/tempeh, whole grains, nuts, seeds, fruits, vegetables. Important: supplement B12, consider D3, iron, and omega-3. Can be healthy with proper planning.';
      }
      if (/gluten[- ]?free|gluten/.test(q)) {
        return 'Gluten-free is essential for celiac disease or gluten sensitivity. Otherwise, it\'s not inherently healthier. Focus on naturally gluten-free foods: rice, quinoa, fruits, vegetables, lean proteins.';
      }
      
      // BMI and body composition
      if (/bmi|body\s*mass\s*index/.test(q)) {
        return 'BMI = weight(kg) / (height(m)^2). Healthy ranges: 18.5–24.9. Remember, BMI is just one indicator - muscle mass, body composition, and overall health matter more than just the number.';
      }
      
      // Meal and food questions (moved to end to avoid catching specific questions)
      if (/breakfast/.test(q)) {
        return 'Healthy breakfast ideas: 1) Oatmeal with berries and nuts, 2) Greek yogurt with fruit, 3) Eggs with vegetables, 4) Smoothie with protein powder, 5) Whole grain toast with avocado. Include protein and fiber for sustained energy.';
      }
      if (/snack|snacks/.test(q)) {
        return 'Healthy snack options: 1) Nuts and seeds, 2) Greek yogurt, 3) Apple with nut butter, 4) Hummus with vegetables, 5) Hard-boiled eggs, 6) Berries, 7) Dark chocolate (70%+ cocoa). Choose snacks with protein and fiber.';
      }
      if (/meals\s*per\s*day|how\s*many\s*meals|meal\s*frequency/.test(q)) {
        return 'Meal frequency: Most people do well with 3-4 meals per day. Some prefer 5-6 smaller meals. Key is consistency and not skipping meals. Listen to your hunger cues and eat when hungry, stop when satisfied.';
      }
      if (/muscle\s*building|build\s*muscle|muscle\s*growth|best.*muscle|foods.*muscle/.test(q)) {
        return 'For muscle building: 1) Eat 1.6-2.2g protein per kg body weight, 2) Strength training 3-4x/week, 3) Eat in slight calorie surplus (200-300 calories), 4) Focus on compound exercises, 5) Get 7-9 hours sleep, 6) Stay consistent for 3-6 months to see results.';
      }
      if (/digestion|digestive|gut\s*health|help.*digest|foods.*digest/.test(q)) {
        return 'Foods for better digestion: 1) Fiber-rich foods (fruits, vegetables, whole grains), 2) Probiotics (yogurt, kefir, sauerkraut), 3) Ginger and peppermint, 4) Stay hydrated, 5) Eat slowly and chew well, 6) Limit processed foods and artificial sweeteners.';
      }
      if (/energy|energ|tired|fatigue/.test(q)) {
        return 'For sustained energy: 1) Eat balanced meals with protein, carbs, and healthy fats, 2) Stay hydrated, 3) Get 7-9 hours sleep, 4) Limit sugar and caffeine crashes, 5) Eat regular meals, 6) Include iron-rich foods (lean meats, spinach, beans).';
      }
      if (/inflammation|anti.inflamm/.test(q)) {
        return 'Anti-inflammatory foods: 1) Fatty fish (salmon, sardines), 2) Berries, 3) Leafy greens, 4) Nuts and seeds, 5) Olive oil, 6) Turmeric and ginger, 7) Green tea. Avoid processed foods, sugar, and trans fats.';
      }
      if (/heart\s*health|cardiovascular/.test(q)) {
        return 'Heart-healthy foods: 1) Fatty fish (omega-3s), 2) Oats and whole grains, 3) Nuts and seeds, 4) Berries, 5) Leafy greens, 6) Olive oil, 7) Dark chocolate (70%+ cocoa). Limit sodium, saturated fats, and processed foods.';
      }
      if (/bone\s*health|calcium|osteoporosis/.test(q)) {
        return 'Bone health foods: 1) Dairy products (milk, cheese, yogurt), 2) Leafy greens (spinach, kale), 3) Fatty fish with bones (sardines), 4) Fortified foods, 5) Nuts and seeds, 6) Get vitamin D from sunlight or supplements.';
      }
      if (/brain\s*health|memory|cognitive/.test(q)) {
        return 'Brain-boosting foods: 1) Fatty fish (omega-3s), 2) Blueberries, 3) Nuts and seeds, 4) Dark leafy greens, 5) Avocados, 6) Dark chocolate, 7) Turmeric. Stay hydrated and get regular exercise for optimal brain function.';
      }
      if (/immune\s*system|immunity/.test(q)) {
        return 'Immune-boosting foods: 1) Citrus fruits (vitamin C), 2) Red bell peppers, 3) Broccoli, 4) Garlic, 5) Ginger, 6) Spinach, 7) Yogurt (probiotics), 8) Almonds (vitamin E). Get adequate sleep and manage stress.';
      }
      if (/metabolism|metabolic/.test(q)) {
        return 'Foods that support metabolism: 1) Protein-rich foods (thermic effect), 2) Green tea, 3) Spicy foods (capsaicin), 4) Whole grains, 5) Lean meats, 6) Water, 7) Coffee (moderate amounts). Combine with regular exercise and adequate sleep.';
      }
      if (/detox|cleans|cleanse/.test(q)) {
        return 'Natural detox foods: 1) Water and herbal teas, 2) Leafy greens, 3) Cruciferous vegetables (broccoli, cabbage), 4) Berries, 5) Green tea, 6) Lemon water, 7) Garlic and onions. Your liver and kidneys naturally detox - focus on whole foods and hydration.';
      }
      
      // Water and hydration
      if (/water|hydrat|drink/.test(q)) {
        return 'Water intake: Aim for 8-10 glasses (2-2.5 liters) daily. More if you exercise or live in hot climates. Signs of dehydration: thirst, dark urine, fatigue. Water helps with metabolism, digestion, and overall health.';
      }
      
      // Sleep and recovery
      if (/sleep/.test(q)) {
        return 'Sleep importance: 7-9 hours nightly for adults. Poor sleep affects hormones (ghrelin, leptin), appetite, and weight management. Create a bedtime routine, avoid screens before bed, keep room cool and dark.';
      }
      
      // General health
      if (/healthy|health/.test(q)) {
        return 'Healthy lifestyle: 1) Balanced diet with whole foods, 2) Regular exercise (cardio + strength), 3) 7-9 hours sleep, 4) Stress management, 5) Stay hydrated, 6) Avoid smoking/excessive alcohol, 7) Regular health checkups.';
      }
      
      // General meal and food questions (catch-all for food-related questions)
      if (/meal|food|recipe/.test(q)) {
        return 'I can suggest meals based on your diet preferences! Tell me your dietary restrictions (vegan, keto, etc.) and I\'ll recommend some healthy options. Focus on whole foods, lean proteins, vegetables, and complex carbohydrates.';
      }
      
      // More general diet and nutrition questions
      if (/nutrition|diet|health|wellness|wellbeing/.test(q)) {
        return 'I can help with nutrition and health questions! For specific topics, try asking about: weight loss, muscle building, digestion, energy, heart health, brain health, immune system, metabolism, or specific foods. What specific aspect of nutrition or health would you like to know about?';
      }
      
      return "I'm here to help with nutrition, fitness, and health! Ask me about diets, meal planning, exercise, weight loss, or any health-related questions. What's on your mind?";
    };

    try {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
      const model = process.env.OLLAMA_MODEL || 'llama3.1';
      
      // Build comprehensive system prompt with user context
      const userContext = [];
      if (userProfile.dietType) userContext.push(`User's diet preference: ${userProfile.dietType}`);
      if (userProfile.height && userProfile.weight) {
        const bmi = (userProfile.weight / ((userProfile.height / 100) ** 2)).toFixed(1);
        userContext.push(`User's BMI: ${bmi} (height: ${userProfile.height}cm, weight: ${userProfile.weight}kg)`);
      }
      if (userProfile.goalWeight) userContext.push(`Goal weight: ${userProfile.goalWeight}kg`);
      if (userProfile.calorieTarget) userContext.push(`Daily calorie target: ${userProfile.calorieTarget} calories`);
      
      // Add health data context
      if (healthData.recentWeight) userContext.push(`Recent weight: ${healthData.recentWeight}kg`);
      if (healthData.avgExercise) userContext.push(`Average exercise: ${healthData.avgExercise} minutes/day`);
      if (healthData.avgSleep) userContext.push(`Average sleep: ${healthData.avgSleep} hours/night`);
      if (healthData.dominantMood) userContext.push(`Recent mood pattern: ${healthData.dominantMood}`);

      const contextString = userContext.length > 0 ? `\nUser Context:\n${userContext.join('\n')}\n` : '';
      
      // Enhanced system prompt
      const sys = `You are an expert nutritionist and fitness coach with a warm, supportive personality. You provide personalized, evidence-based advice about diet, nutrition, exercise, and health.

${contextString}Guidelines:
- Be encouraging and motivating
- Provide specific, actionable advice with clear steps
- Consider the user's context and preferences
- Keep responses concise but comprehensive (2-4 sentences)
- Use emojis occasionally to make responses friendly
- If you don't know something, say so and suggest where to find reliable information
- Focus on sustainable, long-term health habits
- Always prioritize safety and recommend consulting healthcare providers for medical concerns
- For weight loss questions, emphasize calorie deficit, protein intake, and exercise
- For fat loss questions, explain that spot reduction isn't possible but overall fat loss helps
- For exercise questions, provide specific recommendations with frequency and duration
- For nutrition questions, focus on whole foods, balanced macronutrients, and portion control`;

      // Build conversation context
      const convo = Array.isArray(history) ? history.slice(-8) : []; // Keep more context
      const convoText = convo
        .filter(h => h && typeof h.content === 'string')
        .map(h => `${(h.role || 'user').toUpperCase()}: ${h.content}`)
        .join('\n');
      
      const prompt = `${sys}\n\nConversation History:\n${convoText}\n\nUSER: ${message}\n\nASSISTANT:`;

      const resp = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model, 
          prompt, 
          stream: false,
          options: {
            temperature: 0.7, // Add some creativity
            top_p: 0.9,
            max_tokens: 500 // Limit response length
          }
        })
      });
      
      if (resp.ok) {
        const data = await resp.json();
        const reply = (data && (data.response || data.message || data.output || '')).toString().trim();
        if (reply && reply.length > 10) { // Ensure we have a substantial response
          // Clean up the response
          const cleanReply = reply.replace(/^ASSISTANT:\s*/i, '').trim();
          console.log('Ollama response:', cleanReply);
          return res.json({ reply: cleanReply });
        } else {
          console.log('Ollama response too short or empty:', reply);
        }
      } else {
        console.log('Ollama request failed with status:', resp.status);
      }
    } catch (e) {
      console.warn('Ollama chat failed; using local fallback:', e.message || e);
    }

    return res.json({ reply: localResponder(message) });
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Meal Plan generation via API (prefers Ollama if available) with robust fallback
app.post('/ai-meal-plan', async (req, res) => {
  try {
    const {
      bmi,
      goalWeight,
      dietPreference,
      calorieLimit
    } = req.body || {};

    // Basic validation and normalization
    const normalized = {
      bmi: toNumberOrUndefined(bmi),
      goalWeight: toNumberOrUndefined(goalWeight),
      dietPreference: (dietPreference || '').toString().trim() || 'Vegan',
      calorieLimit: toNumberOrUndefined(calorieLimit) || 1800
    };

    // Guardrails on calories
    if (normalized.calorieLimit < 1000) normalized.calorieLimit = 1000;
    if (normalized.calorieLimit > 3500) normalized.calorieLimit = 3500;

    // Attempt AI generation using a free local API (Ollama) if running
    // This requires the user to have Ollama installed and a model pulled, e.g. `ollama run llama3.1`
    // We strictly request JSON to simplify parsing.
    let aiPlan = null;
    try {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
      const model = process.env.OLLAMA_MODEL || 'llama3.1';
      
      // Add variety to prompts to ensure different results each time
      const varietyHints = [
        'Be creative and suggest unique, interesting meal combinations.',
        'Focus on seasonal and fresh ingredients.',
        'Include international cuisine influences.',
        'Suggest comfort food options.',
        'Emphasize protein-rich options.',
        'Include colorful, nutrient-dense meals.',
        'Suggest quick and easy preparation methods.',
        'Focus on whole, unprocessed foods.',
        'Include traditional and modern cooking styles.',
        'Emphasize balanced macronutrients.'
      ];
      
      const randomHint = varietyHints[Math.floor(Math.random() * varietyHints.length)];
      const timestamp = Date.now(); // Add timestamp for uniqueness
      
      const prompt = [
        'You are a creative nutrition planner. Generate a unique one-day meal plan as strict JSON.',
        'Return ONLY JSON, no prose, in this exact shape:',
        '{"breakfast":{"name":"...","calories":123},"lunch":{"name":"...","calories":456},"dinner":{"name":"...","calories":789},"snacks":[{"name":"...","calories":120}] }',
        'Rules:',
        `- Diet preference: ${normalized.dietPreference}. Respect it strictly.`,
        `- Target calories (daily): ${normalized.calorieLimit}.`,
        '- Calorie allocation guideline: 25-30% breakfast, 30-35% lunch, 25-30% dinner, 10-15% snacks.',
        `- BMI (if helpful): ${normalized.bmi ?? 'unknown'}.`,
        `- Goal weight (kg, if provided): ${normalized.goalWeight ?? 'unknown'}.`,
        '- Names should be concise real foods. Calories are integers. No macros required.',
        `- ${randomHint}`,
        `- Request ID: ${timestamp} (ensure variety)`
      ].join('\n');

      // Prefer global fetch (Node 18+). If unavailable, this will throw and fall back below.
      const resp = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const raw = (data && (data.response || data.message || data.output || '')) || '';
        // Try parsing a pure JSON response, or extract JSON object from text
        const jsonText = (() => {
          const trimmed = raw.trim();
          if (trimmed.startsWith('{')) return trimmed;
          const match = trimmed.match(/\{[\s\S]*\}/);
          return match ? match[0] : '';
        })();
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          aiPlan = normalizePlanShape(parsed, normalized.calorieLimit);
        }
      }
    } catch (e) {
      // Ignore and fall back to local generator
      console.warn('Ollama generation failed; using fallback:', e.message || e);
    }

    // Fallback local generator if AI unavailable or malformed
    if (!aiPlan) {
      aiPlan = localFallbackPlan(normalized.dietPreference, normalized.calorieLimit);
    }

    return res.json({
      plan: aiPlan
    });
  } catch (error) {
    console.error('AI meal plan error:', error);
    // Absolute fallback stub, in case even local fails unexpectedly
    return res.status(200).json({
      plan: localFallbackPlan('Vegan', 1800),
      warning: 'AI generation failed; returned safe fallback plan.'
    });
  }
});

// AI Health Insights: generate progress summary, tips, and goals based on health data
app.post('/ai-health-insights', async (req, res) => {
  try {
    const {
      weight,
      calories,
      exercise,
      sleep,
      mood,
      notes,
      diet,
      previousData = []
    } = req.body || {};

    const norm = {
      weight: toNumberOrUndefined(weight),
      calories: toNumberOrUndefined(calories),
      exercise: toNumberOrUndefined(exercise),
      sleep: toNumberOrUndefined(sleep),
      mood: (mood || '').toString().trim(),
      notes: (notes || '').toString().trim(),
      diet: (diet || '').toString().trim(),
      previousData: Array.isArray(previousData) ? previousData : []
    };

    // Try AI via Ollama
    let ai = null;
    try {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
      const model = process.env.OLLAMA_MODEL || 'llama3.1';
      
      // Add variety to health insights
      const insightHints = [
        'Focus on positive reinforcement and motivation.',
        'Emphasize sustainable lifestyle changes.',
        'Consider the connection between sleep, mood, and performance.',
        'Highlight the importance of consistency over perfection.',
        'Address both physical and mental well-being.',
        'Provide actionable, specific recommendations.',
        'Consider individual circumstances and challenges.',
        'Emphasize progress over perfection.',
        'Focus on building healthy habits.',
        'Consider the holistic nature of health.'
      ];
      
      const randomHint = insightHints[Math.floor(Math.random() * insightHints.length)];
      const timestamp = Date.now();
      
      const prompt = [
        'You are a supportive health coach and nutrition expert. Analyze the user\'s comprehensive health data and provide personalized insights.',
        'Return ONLY JSON with this exact shape:',
        '{"summary":"Brief encouraging paragraph about their progress including diet analysis","tips":["tip1","tip2","tip3"],"goals":["goal1","goal2"]}',
        'Rules:',
        `- Today\'s data: weight=${norm.weight || 'unknown'}kg, calories=${norm.calories || 'unknown'}kcal, exercise=${norm.exercise || 'unknown'}min, sleep=${norm.sleep || 'unknown'}hrs, mood=${norm.mood || 'unknown'}`,
        `- Previous data points: ${norm.previousData.length} entries`,
        `- Notes: ${norm.notes || 'none'}`,
        `- Diet preference: ${norm.diet || 'unknown'}`,
        '- Analyze their diet patterns, calorie intake, and nutritional balance',
        '- Consider how their current diet affects their energy, mood, and exercise performance',
        '- Evaluate the relationship between their sleep, mood, and dietary choices',
        '- Assess their exercise consistency and how it relates to their nutritional intake',
        '- Summary: 2-3 sentences, encouraging and motivating tone, include specific diet and health analysis',
        '- Tips: 2-3 specific, actionable health tips based on their data, diet patterns, and lifestyle',
        '- Goals: 1-2 achievable goals for tomorrow based on today\'s patterns, dietary needs, and health trends',
        `- ${randomHint}`,
        `- Request ID: ${timestamp} (ensure variety)`,
        '- Be friendly, supportive, and realistic. No medical advice.',
        '- Focus on sustainable lifestyle changes and holistic health.',
        '- No text besides JSON.'
      ].join('\n');

      const resp = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
      });
      if (resp.ok) {
        const data = await resp.json();
        const raw = (data && (data.response || data.message || data.output || '')) || '';
        const jsonText = (() => {
          const t = raw.trim();
          if (t.startsWith('{')) return t;
          const m = t.match(/\{[\s\S]*\}/);
          return m ? m[0] : '';
        })();
        if (jsonText) ai = JSON.parse(jsonText);
      }
    } catch (e) {
      console.warn('Ollama health insights failed; using fallback:', e.message || e);
    }

    // Normalize / fallback using local insights
    const result = normalizeHealthInsights(ai, norm);
    return res.json(result);
  } catch (err) {
    console.error('AI health insights error:', err);
    // Final safety fallback
    const safe = normalizeHealthInsights(null, {
      weight: 70, calories: 1800, exercise: 30, sleep: 7.5, mood: 'Neutral', notes: '', previousData: []
    });
    return res.status(200).json({ ...safe, warning: 'AI failed; using safe fallback.' });
  }
});

function normalizeHealthInsights(ai, norm) {
  // Local fallback insights based on data patterns
  const getSummary = () => {
    const parts = [];
    
    // Diet and calorie analysis
    if (norm.calories && norm.calories >= 1500 && norm.calories <= 2200) {
      parts.push('Great job maintaining a balanced calorie intake that supports your energy needs');
    } else if (norm.calories && norm.calories < 1500) {
      parts.push('Consider increasing your calorie intake for better energy and metabolic function');
    } else if (norm.calories && norm.calories > 2200) {
      parts.push('Your calorie intake is on the higher side - consider portion control for optimal health');
    }
    
    // Exercise analysis
    if (norm.exercise && norm.exercise >= 30) {
      parts.push('excellent work staying active with your exercise routine');
    } else if (norm.exercise && norm.exercise > 0) {
      parts.push('nice job getting some movement in today');
    } else {
      parts.push('consider adding some light activity to your day');
    }
    
    // Sleep analysis
    if (norm.sleep && norm.sleep >= 7 && norm.sleep <= 9) {
      parts.push('and your sleep duration looks healthy');
    } else if (norm.sleep && norm.sleep < 7) {
      parts.push('and try to prioritize getting more rest');
    }
    
    // Mood and diet connection analysis
    const moodEmoji = norm.mood.includes('😊') ? 'positive' : norm.mood.includes('😟') ? 'challenging' : 'neutral';
    if (norm.mood.includes('😟') && norm.calories && norm.calories < 1500) {
      parts.push(`Your ${moodEmoji} mood might be related to insufficient calorie intake - proper nutrition supports mental well-being.`);
    } else {
      parts.push(`Your ${moodEmoji} mood today shows you're being mindful of your mental well-being.`);
    }
    
    return parts.join(', ') + ' Keep up the great work!';
  };

  const getTips = () => {
    const tips = [];
    
    // Diet and nutrition tips
    if (norm.calories && norm.calories < 1500) {
      tips.push('Consider adding nutrient-dense snacks between meals to boost your calorie intake and energy levels.');
    } else if (norm.calories && norm.calories > 2200) {
      tips.push('Focus on portion control and include more vegetables to balance your calorie intake with nutrition.');
    } else {
      tips.push('Maintain your balanced calorie intake and ensure you\'re getting adequate protein, healthy fats, and complex carbs.');
    }
    
    // Exercise tips
    if (norm.exercise && norm.exercise < 30) {
      tips.push('Try to aim for at least 30 minutes of moderate activity daily - even a brisk walk counts!');
    } else {
      tips.push('Great job with your exercise routine! Consider adding variety to prevent plateaus and maintain motivation.');
    }
    
    // Sleep and mood tips
    if (norm.sleep && norm.sleep < 7) {
      tips.push('Prioritize 7-9 hours of sleep for better recovery, mood regulation, and appetite control.');
    } else if (norm.mood && norm.mood.includes('😟')) {
      tips.push('Consider stress-reduction techniques like deep breathing or meditation when feeling overwhelmed.');
    } else {
      tips.push('Stay hydrated throughout the day - aim for 8 glasses of water to support your active lifestyle and metabolism.');
    }
    
    return tips.slice(0, 3);
  };

  const getGoals = () => {
    const goals = [];
    
    // Diet-related goals
    if (norm.calories && norm.calories < 1500) {
      goals.push('Add one healthy snack tomorrow (nuts, fruit, or yogurt) to boost your calorie intake and energy');
    } else if (norm.calories && norm.calories > 2200) {
      goals.push('Focus on portion control tomorrow - use smaller plates and include more vegetables in your meals');
    } else {
      goals.push('Maintain your balanced calorie intake and try to include a new healthy food in your diet tomorrow');
    }
    
    // Exercise goals
    if (norm.exercise && norm.exercise < 30) {
      goals.push('Add 10-15 minutes of light activity tomorrow (walking, stretching, or gentle yoga)');
    } else {
      goals.push('Maintain your current exercise routine and consider adding a new activity or increasing intensity');
    }
    
    // Sleep goals
    if (norm.sleep && norm.sleep < 7) {
      goals.push('Aim for 7+ hours of sleep tonight by going to bed 30 minutes earlier');
    } else {
      goals.push('Continue your healthy sleep pattern and try to wake up at the same time');
    }
    
    return goals.slice(0, 2);
  };

  const parsed = {
    summary: (ai?.summary && typeof ai.summary === 'string') ? ai.summary.trim() : getSummary(),
    tips: Array.isArray(ai?.tips) ? ai.tips.filter(t => typeof t === 'string').slice(0, 3) : getTips(),
    goals: Array.isArray(ai?.goals) ? ai.goals.filter(g => typeof g === 'string').slice(0, 2) : getGoals()
  };

  // Ensure we have valid content
  if (!parsed.summary || parsed.summary.length < 20) parsed.summary = getSummary();
  if (!parsed.tips || parsed.tips.length === 0) parsed.tips = getTips();
  if (!parsed.goals || parsed.goals.length === 0) parsed.goals = getGoals();

  return parsed;
}

// AI Exercise Recommendations: generate personalized exercises based on health data
app.post('/ai-exercise-recommendations', async (req, res) => {
  try {
    const {
      weight,
      bmi,
      diet,
      sleep,
      mood,
      exercise,
      calories,
      age,
      gender,
      previousData = [],
      healthTrends = {},
      requestType = 'normal',
      timestamp
    } = req.body || {};

    const norm = {
      weight: toNumberOrUndefined(weight),
      bmi: toNumberOrUndefined(bmi),
      diet: (diet || '').toString().trim(),
      sleep: toNumberOrUndefined(sleep),
      mood: (mood || '').toString().trim(),
      exercise: toNumberOrUndefined(exercise),
      calories: toNumberOrUndefined(calories),
      age: toNumberOrUndefined(age),
      gender: (gender || '').toString().trim(),
      previousData: Array.isArray(previousData) ? previousData : [],
      healthTrends: healthTrends || {},
      requestType: (requestType || 'normal').toString(),
      timestamp: timestamp || Date.now()
    };

    // Try AI via Ollama
    let ai = null;
    try {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
      const model = process.env.OLLAMA_MODEL || 'llama3.1';
      
      // Enhanced variety for exercise recommendations
      const exerciseHints = [
        'Focus on beginner-friendly exercises with clear instructions.',
        'Emphasize exercises that can be done at home with minimal equipment.',
        'Consider low-impact options for joint health and recovery.',
        'Include both cardio and strength training recommendations.',
        'Suggest exercises that improve mood and energy levels.',
        'Focus on functional movements that improve daily activities.',
        'Consider time-efficient workouts for busy schedules.',
        'Include flexibility and mobility exercises.',
        'Suggest progressive exercises that can be scaled up.',
        'Emphasize exercises that complement the user\'s diet and lifestyle.',
        'Consider age-appropriate exercises and modifications.',
        'Focus on exercises that support specific health goals.',
        'Include exercises that work well with different dietary patterns.',
        'Suggest exercises that can be done in small spaces.',
        'Emphasize exercises that improve sleep quality.',
        'Consider exercises that help with stress management.',
        'Include exercises that support weight management goals.',
        'Suggest exercises that improve cardiovascular health.',
        'Focus on exercises that build functional strength.',
        'Include exercises that enhance flexibility and mobility.'
      ];
      
      const randomHint = exerciseHints[Math.floor(Math.random() * exerciseHints.length)];
      
      // Build comprehensive prompt with health trends
      const healthTrendsText = norm.healthTrends && Object.keys(norm.healthTrends).length > 0 
        ? `Health Trends: avgWeight=${norm.healthTrends.avgWeight || 'unknown'}kg, avgExercise=${norm.healthTrends.avgExercise || 'unknown'}min, avgSleep=${norm.healthTrends.avgSleep || 'unknown'}hrs, avgCalories=${norm.healthTrends.avgCalories || 'unknown'}kcal, dominantMood=${norm.healthTrends.dominantMood || 'unknown'}, weightTrend=${norm.healthTrends.weightTrend || 'unknown'}kg, exerciseConsistency=${norm.healthTrends.exerciseConsistency || 'unknown'}`
        : 'No health trends data available';
      
      const prompt = [
        'You are a certified fitness trainer and nutrition coach. Generate personalized exercise recommendations based on comprehensive health data.',
        'Return ONLY JSON with this exact shape:',
        '{"exercises":[{"name":"Exercise Name","duration":"X minutes","intensity":"Low/Medium/High","instructions":"Detailed step-by-step instructions","benefits":"Specific health benefits and how it complements their diet"}]}',
        'Rules:',
        `- Current data: weight=${norm.weight || 'unknown'}kg, BMI=${norm.bmi || 'unknown'}, diet=${norm.diet || 'unknown'}, sleep=${norm.sleep || 'unknown'}hrs, mood=${norm.mood || 'unknown'}, current_exercise=${norm.exercise || 'unknown'}min, calories=${norm.calories || 'unknown'}kcal, age=${norm.age || 'unknown'}, gender=${norm.gender || 'unknown'}`,
        `- ${healthTrendsText}`,
        `- Previous exercise data: ${norm.previousData.length} entries`,
        `- Request type: ${norm.requestType} (refresh requests should provide different exercises)`,
        '- Analyze their diet type and calorie intake to recommend appropriate exercises',
        '- Consider how their diet affects their energy levels and exercise capacity',
        '- Generate 3-4 different exercises with varying intensities based on their nutritional status and health trends',
        '- Consider their current fitness level, health status, dietary needs, and age',
        '- Include duration, intensity level, and clear step-by-step instructions',
        '- Explain the specific health benefits of each exercise and how it complements their diet',
        '- Consider their sleep patterns and mood when recommending exercise intensity',
        '- For refresh requests, provide completely different exercise options',
        `- ${randomHint}`,
        `- Request ID: ${norm.timestamp} (ensure variety)`,
        '- Be encouraging and realistic. No medical advice.',
        '- No text besides JSON.'
      ].join('\n');

      const resp = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
      });
      if (resp.ok) {
        const data = await resp.json();
        const raw = (data && (data.response || data.message || data.output || '')) || '';
        const jsonText = (() => {
          const t = raw.trim();
          if (t.startsWith('{')) return t;
          const m = t.match(/\{[\s\S]*\}/);
          return m ? m[0] : '';
        })();
        if (jsonText) ai = JSON.parse(jsonText);
      }
    } catch (e) {
      console.warn('Ollama exercise recommendations failed; using fallback:', e.message || e);
    }

    // Normalize / fallback using enhanced local exercise database
    const result = normalizeExerciseRecommendations(ai, norm);
    return res.json(result);
  } catch (err) {
    console.error('AI exercise recommendations error:', err);
    // Final safety fallback
    const safe = normalizeExerciseRecommendations(null, {
      weight: 70, bmi: 24, diet: 'Balanced', sleep: 7.5, mood: 'Neutral', exercise: 30, calories: 1800, previousData: []
    });
    return res.status(200).json({ ...safe, warning: 'AI failed; using safe fallback.' });
  }
});

function normalizeExerciseRecommendations(ai, norm) {
  // Local fallback exercise database
  const getFallbackExercises = () => {
    const exercises = [];
    
    // Determine intensity based on current exercise level
    const currentExercise = norm.exercise || 0;
    const isBeginner = currentExercise < 30;
    const isIntermediate = currentExercise >= 30 && currentExercise < 60;
    const isAdvanced = currentExercise >= 60;
    
    // Adjust based on mood and sleep
    const isTired = norm.mood && (norm.mood.includes('😴') || norm.mood.includes('Tired'));
    const isStressed = norm.mood && norm.mood.includes('😟');
    const lowSleep = norm.sleep && norm.sleep < 7;
    
    // Cardio exercises
    if (isTired || lowSleep) {
      exercises.push({
        name: "Gentle Walking",
        duration: "15-20 minutes",
        intensity: "Low",
        instructions: "Start with a slow, comfortable pace. Focus on steady breathing and gentle movement. Walk at a pace where you can hold a conversation.",
        benefits: "Improves circulation, reduces stress, and provides gentle energy boost without overexertion."
      });
    } else if (isBeginner) {
      exercises.push({
        name: "Brisk Walking",
        duration: "20-30 minutes",
        intensity: "Medium",
        instructions: "Walk at a pace that raises your heart rate but allows you to speak in short sentences. Swing your arms naturally and maintain good posture.",
        benefits: "Builds cardiovascular endurance, burns calories, and improves mood through endorphin release."
      });
    } else {
      exercises.push({
        name: "Interval Walking/Jogging",
        duration: "25-35 minutes",
        intensity: "Medium-High",
        instructions: "Alternate between 2 minutes of brisk walking and 1 minute of light jogging. Repeat for the duration.",
        benefits: "Improves cardiovascular fitness, burns more calories, and builds endurance efficiently."
      });
    }
    
    // Strength exercises
    if (isStressed) {
      exercises.push({
        name: "Yoga Flow",
        duration: "15-25 minutes",
        intensity: "Low-Medium",
        instructions: "Perform gentle yoga poses focusing on breathing. Include cat-cow, child's pose, and gentle twists. Hold each pose for 30-60 seconds.",
        benefits: "Reduces stress hormones, improves flexibility, and promotes mental relaxation."
      });
    } else if (isBeginner) {
      exercises.push({
        name: "Bodyweight Strength Circuit",
        duration: "15-20 minutes",
        intensity: "Medium",
        instructions: "Perform 3 rounds of: 10 squats, 10 push-ups (knee or wall), 10 lunges each leg, 30-second plank. Rest 1 minute between rounds.",
        benefits: "Builds functional strength, improves muscle tone, and increases metabolism."
      });
    } else {
      exercises.push({
        name: "Advanced Bodyweight Circuit",
        duration: "25-30 minutes",
        intensity: "High",
        instructions: "Perform 4 rounds of: 15 jump squats, 15 burpees, 20 mountain climbers, 15 tricep dips, 1-minute plank. Rest 90 seconds between rounds.",
        benefits: "Builds explosive power, improves cardiovascular fitness, and burns significant calories."
      });
    }
    
    // Flexibility/Mobility
    exercises.push({
      name: "Dynamic Stretching Routine",
      duration: "10-15 minutes",
      intensity: "Low",
      instructions: "Perform arm circles, leg swings, hip circles, and gentle spinal twists. Move slowly and controlled through each movement.",
      benefits: "Improves joint mobility, reduces injury risk, and enhances recovery between workouts."
    });
    
    // Mood-specific exercise
    if (norm.mood && norm.mood.includes('😊')) {
      exercises.push({
        name: "Dance Cardio",
        duration: "20-25 minutes",
        intensity: "Medium",
        instructions: "Put on your favorite upbeat music and dance freely. Include jumping, arm movements, and hip movements. Have fun with it!",
        benefits: "Boosts mood further, improves coordination, and makes exercise enjoyable and sustainable."
      });
    }
    
    return exercises.slice(0, 4); // Return max 4 exercises
  };

  const parsed = {
    exercises: Array.isArray(ai?.exercises) && ai.exercises.length > 0 
      ? ai.exercises.filter(ex => ex && ex.name && ex.instructions).slice(0, 4)
      : getFallbackExercises()
  };

  // Ensure we have valid exercises
  if (!parsed.exercises || parsed.exercises.length === 0) {
    parsed.exercises = getFallbackExercises();
  }

  return parsed;
}

// AI Goals: suggest goal weight and daily calories based on inputs
app.post('/ai-goals', async (req, res) => {
  try {
    const {
      gender,
      age,
      heightCm,
      weightKg,
      activity = 1.2,
      dietPreference = 'Vegan',
      bmi
    } = req.body || {};

    const norm = {
      gender: (gender || '').toString().toLowerCase() === 'male' ? 'male' : 'female',
      age: toNumberOrUndefined(age) || 25,
      heightCm: toNumberOrUndefined(heightCm) || 170,
      weightKg: toNumberOrUndefined(weightKg) || 70,
      activity: toNumberOrUndefined(activity) || 1.2,
      dietPreference: (dietPreference || 'Vegan').toString(),
      bmi: toNumberOrUndefined(bmi)
    };

    // Try AI via Ollama
    let ai = null;
    try {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
      const model = process.env.OLLAMA_MODEL || 'llama3.1';
      
      // Add variety to goal suggestions
      const goalHints = [
        'Consider sustainable weight management approach.',
        'Focus on healthy lifestyle changes.',
        'Emphasize gradual, maintainable progress.',
        'Consider individual metabolic factors.',
        'Focus on body composition improvements.',
        'Consider long-term health benefits.',
        'Emphasize balanced nutrition approach.',
        'Consider activity level and lifestyle.',
        'Focus on realistic, achievable goals.',
        'Consider individual preferences and constraints.'
      ];
      
      const randomGoalHint = goalHints[Math.floor(Math.random() * goalHints.length)];
      const timestamp = Date.now();
      
      const prompt = [
        'You are an experienced nutrition coach. Suggest personalized goal weight and daily calories.',
        'Return ONLY JSON with this exact shape: {"goalWeight": 65, "dailyCalories": 1850}',
        'Rules:',
        `- Inputs: gender=${norm.gender}, age=${norm.age}, height_cm=${norm.heightCm}, weight_kg=${norm.weightKg}, activity=${norm.activity}, diet=${norm.dietPreference}, bmi=${norm.bmi ?? 'unknown'}.`,
        '- Goal weight should correspond to a healthy BMI range (roughly 20–24.9), rounded to whole kg.',
        '- Daily calories should be a realistic maintenance or mild-deficit value (1000–3500 range), integer only.',
        `- ${randomGoalHint}`,
        `- Request ID: ${timestamp} (ensure variety)`,
        '- No text besides JSON.'
      ].join('\n');

      const resp = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
      });
      if (resp.ok) {
        const data = await resp.json();
        const raw = (data && (data.response || data.message || data.output || '')) || '';
        const jsonText = (() => {
          const t = raw.trim();
          if (t.startsWith('{')) return t;
          const m = t.match(/\{[\s\S]*\}/);
          return m ? m[0] : '';
        })();
        if (jsonText) ai = JSON.parse(jsonText);
      }
    } catch (e) {
      console.warn('Ollama goals failed; using fallback:', e.message || e);
    }

    // Normalize / fallback using local formulas
    const result = normalizeGoals(ai, norm);
    return res.json(result);
  } catch (err) {
    console.error('AI goals error:', err);
    // Final safety fallback
    const safe = normalizeGoals(null, {
      gender: 'female', age: 25, heightCm: 170, weightKg: 70, activity: 1.2, dietPreference: 'Vegan', bmi: 24.2
    });
    return res.status(200).json({ ...safe, warning: 'AI failed; using safe fallback.' });
  }
});

function normalizeGoals(ai, norm) {
  // Local calculation: goal weight from target BMI 22.5, daily calories via Mifflin–St Jeor × activity.
  const heightM = norm.heightCm / 100;
  const targetBMI = 22.5;
  const localGoal = Math.max(30, Math.round(targetBMI * heightM * heightM));

  let bmr;
  if (norm.gender === 'male') {
    bmr = 10 * norm.weightKg + 6.25 * norm.heightCm - 5 * norm.age + 5;
  } else {
    bmr = 10 * norm.weightKg + 6.25 * norm.heightCm - 5 * norm.age - 161;
  }
  let tdee = Math.round(bmr * norm.activity);

  // Diet preference tiny nudge (kept consistent with front-end logic)
  const diet = (norm.dietPreference || '').toLowerCase();
  if (diet.includes('keto')) tdee -= 200;
  else if (diet.includes('vegan')) tdee -= 100;
  else if (diet.includes('vegetarian')) tdee += 50;
  else if (diet.includes('non')) tdee += 100;
  else if (diet.includes('gluten')) tdee -= 50;

  // Clamp calories to sane range
  tdee = Math.min(3500, Math.max(1000, tdee));

  const parsed = {
    goalWeight: toNumberOrUndefined(ai?.goalWeight) || localGoal,
    dailyCalories: toNumberOrUndefined(ai?.dailyCalories) || tdee
  };

  // Final clamps
  if (!Number.isFinite(parsed.goalWeight) || parsed.goalWeight < 30 || parsed.goalWeight > 300) parsed.goalWeight = localGoal;
  if (!Number.isFinite(parsed.dailyCalories) || parsed.dailyCalories < 1000 || parsed.dailyCalories > 3500) parsed.dailyCalories = tdee;

  return parsed;
}

// Normalize and coerce any AI JSON into the expected shape
function normalizePlanShape(input, calorieLimit) {
  const safeName = (v, d) => (typeof v === 'string' && v.trim()) || d;
  const safeCal = (v, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(40, Math.round(n)) : d;
  };

  // Default allocations (percentages)
  const alloc = { breakfast: 0.28, lunch: 0.34, dinner: 0.28, snacks: 0.10 };

  const defaults = {
    breakfast: { name: 'Oatmeal with Berries', calories: Math.round(calorieLimit * alloc.breakfast) },
    lunch: { name: 'Grain Bowl with Beans and Veg', calories: Math.round(calorieLimit * alloc.lunch) },
    dinner: { name: 'Tofu/Paneer Stir-Fry with Veg', calories: Math.round(calorieLimit * alloc.dinner) },
    snacks: [{ name: 'Fruit and Nuts', calories: Math.round(calorieLimit * alloc.snacks) }]
  };

  const plan = {
    breakfast: {
      name: safeName(input?.breakfast?.name, defaults.breakfast.name),
      calories: safeCal(input?.breakfast?.calories, defaults.breakfast.calories)
    },
    lunch: {
      name: safeName(input?.lunch?.name, defaults.lunch.name),
      calories: safeCal(input?.lunch?.calories, defaults.lunch.calories)
    },
    dinner: {
      name: safeName(input?.dinner?.name, defaults.dinner.name),
      calories: safeCal(input?.dinner?.calories, defaults.dinner.calories)
    },
    snacks: Array.isArray(input?.snacks) && input.snacks.length
      ? input.snacks.map(s => ({ name: safeName(s?.name, 'Snack'), calories: safeCal(s?.calories, 120) }))
      : defaults.snacks
  };

  // Compute total calories
  const snackCalories = plan.snacks.reduce((sum, s) => sum + (s.calories || 0), 0);
  plan.totalCalories = (plan.breakfast.calories || 0) + (plan.lunch.calories || 0) + (plan.dinner.calories || 0) + snackCalories;

  return plan;
}

// Enhanced local fallback generator with more variety and dynamic elements
function localFallbackPlan(dietPreference, calorieLimit) {
  const alloc = { breakfast: 0.28, lunch: 0.34, dinner: 0.28, snacks: 0.10 };
  const round = (n) => Math.max(40, Math.round(n));

  // Expanded options with more variety per diet
  const options = {
    'Vegan': {
      breakfast: [
        'Overnight Oats with Banana & Chia', 'Tofu Scramble with Spinach', 'Avocado Toast with Hemp Seeds',
        'Chia Pudding with Berries', 'Green Smoothie Bowl', 'Quinoa Breakfast Bowl',
        'Vegan Pancakes with Maple Syrup', 'Coconut Yogurt Parfait', 'Sweet Potato Toast',
        'Vegan Breakfast Burrito', 'Almond Butter Banana Toast', 'Vegan French Toast',
        'Vegan Waffles with Fruit', 'Tempeh Bacon & Toast', 'Vegan Scrambled Eggs',
        'Buckwheat Pancakes', 'Vegan Omelet with Veggies', 'Coconut Chia Pudding',
        'Vegan Granola Bowl', 'Tofu Benedict', 'Vegan Breakfast Sandwich',
        'Spelt Toast with Nut Butter', 'Vegan Smoothie Bowl', 'Quinoa Porridge',
        'Vegan Crepes', 'Tempeh Hash', 'Vegan Breakfast Tacos'
      ],
      lunch: [
        'Chickpea Salad Bowl', 'Quinoa Buddha Bowl', 'Lentil Curry with Rice',
        'Veggie Stir-fry with Tofu', 'Mediterranean Wrap', 'Black Bean Tacos',
        'Vegan Buddha Bowl', 'Stuffed Bell Peppers', 'Vegan Pasta Primavera',
        'Hummus & Veggie Sandwich', 'Vegan Sushi Bowl', 'Roasted Veggie Bowl',
        'Vegan Caesar Salad', 'Tempeh Reuben Sandwich', 'Vegan Ramen Bowl',
        'Stuffed Portobello Mushrooms', 'Vegan Quesadilla', 'Lentil Soup with Bread',
        'Vegan Falafel Wrap', 'Tofu Teriyaki Bowl', 'Vegan BLT Sandwich',
        'Chickpea Curry', 'Vegan Tuna Salad', 'Stuffed Sweet Potatoes',
        'Vegan Pad Thai', 'Tempeh Stir-fry', 'Vegan Club Sandwich'
      ],
      dinner: [
        'Lentil Curry with Brown Rice', 'Veggie Stir-fry with Tofu', 'Stuffed Bell Peppers',
        'Mushroom Walnut Pasta', 'Eggplant Stir Fry', 'Sweet Potato Curry',
        'Vegan Chili', 'Cauliflower Rice Bowl', 'Vegan Shepherd\'s Pie',
        'Stuffed Zucchini Boats', 'Vegan Ramen Bowl', 'Roasted Vegetable Medley',
        'Vegan Lasagna', 'Tempeh Tacos', 'Vegan Risotto',
        'Stuffed Eggplant', 'Vegan Paella', 'Tofu Scallopini',
        'Vegan Meatballs with Pasta', 'Lentil Loaf', 'Vegan Fish & Chips',
        'Stuffed Cabbage Rolls', 'Vegan Gumbo', 'Tempeh Kebabs',
        'Vegan Pot Pie', 'Stuffed Acorn Squash', 'Vegan Jambalaya'
      ],
      snack: [
        'Apple with Peanut Butter', 'Hummus with Veggie Sticks', 'Energy Balls',
        'Almond Butter Toast', 'Trail Mix', 'Vegan Smoothie',
        'Rice Cakes with Avocado', 'Vegan Yogurt with Berries', 'Roasted Chickpeas',
        'Vegan Cheese & Crackers', 'Dark Chocolate with Nuts', 'Vegan Protein Bar',
        'Coconut Yogurt Parfait', 'Vegan Popcorn', 'Nut Butter Rice Cakes',
        'Vegan Ice Cream', 'Roasted Nuts', 'Vegan Chocolate Chip Cookies',
        'Fresh Fruit Salad', 'Vegan Granola Bar', 'Coconut Chips',
        'Vegan Muffins', 'Dried Fruit Mix', 'Vegan Smoothie Bowl'
      ]
    },
    'Vegetarian': {
      breakfast: [
        'Greek Yogurt with Fruit', 'Veggie Omelet', 'Pancakes with Greek Yogurt',
        'Cheese Toast with Tomato', 'Vegetarian Breakfast Sandwich', 'Eggs Benedict',
        'French Toast with Berries', 'Vegetarian Hash', 'Cheese Omelet',
        'Vegetarian Breakfast Burrito', 'Eggs with Avocado', 'Vegetarian Pancakes',
        'Cheese & Spinach Omelet', 'Eggs Florentine', 'Vegetarian Waffles',
        'Cottage Cheese Bowl', 'Eggs with Cheese', 'Vegetarian French Toast',
        'Cheese & Herb Omelet', 'Eggs with Pesto', 'Vegetarian Crepes',
        'Ricotta Pancakes', 'Eggs with Feta', 'Vegetarian Breakfast Bowl',
        'Cheese & Tomato Toast', 'Eggs with Herbs', 'Vegetarian Muffins'
      ],
      lunch: [
        'Paneer Tikka Salad', 'Caprese Sandwich', 'Vegetarian Quesadilla',
        'Egg Salad Sandwich', 'Vegetarian Pizza Slice', 'Cheese & Veggie Wrap',
        'Vegetarian Buddha Bowl', 'Grilled Cheese with Soup', 'Vegetarian Pasta Salad',
        'Egg Fried Rice', 'Vegetarian Club Sandwich', 'Cheese & Crackers',
        'Vegetarian Caesar Salad', 'Egg & Cheese Sandwich', 'Vegetarian Panini',
        'Cheese & Veggie Pizza', 'Egg Salad Wrap', 'Vegetarian Burrito Bowl',
        'Paneer Curry with Rice', 'Cheese & Spinach Wrap', 'Vegetarian Taco Salad',
        'Egg & Avocado Toast', 'Vegetarian Club Wrap', 'Cheese & Tomato Salad',
        'Vegetarian Sushi Bowl', 'Egg & Cheese Quesadilla', 'Vegetarian Pasta Bowl'
      ],
      dinner: [
        'Eggplant Parmesan', 'Vegetable Pasta with Marinara', 'Paneer & Veg Stir-fry',
        'Cheese Stuffed Peppers', 'Vegetarian Lasagna', 'Egg Curry with Rice',
        'Vegetarian Shepherd\'s Pie', 'Cheese & Spinach Pasta', 'Vegetarian Tacos',
        'Stuffed Mushrooms', 'Vegetarian Risotto', 'Cheese & Broccoli Casserole',
        'Vegetarian Moussaka', 'Egg & Cheese Casserole', 'Vegetarian Stuffed Shells',
        'Paneer Tikka Masala', 'Cheese & Spinach Lasagna', 'Vegetarian Enchiladas',
        'Egg & Vegetable Stir-fry', 'Vegetarian Pot Pie', 'Cheese & Herb Pasta',
        'Vegetarian Stuffed Peppers', 'Egg & Cheese Quiche', 'Vegetarian Casserole',
        'Paneer & Rice Bowl', 'Cheese & Tomato Pasta', 'Vegetarian Stuffed Zucchini'
      ],
      snack: [
        'Trail Mix', 'Cheese and Crackers', 'Greek Yogurt with Honey',
        'Hard Boiled Eggs', 'Cheese Sticks', 'Vegetarian Smoothie',
        'Hummus with Pita', 'Cheese & Apple Slices', 'Vegetarian Energy Bars',
        'Cottage Cheese with Fruit', 'Cheese & Grapes', 'Vegetarian Protein Shake',
        'Egg Muffins', 'Cheese & Nuts', 'Vegetarian Yogurt Parfait',
        'Cheese & Crackers', 'Hard Boiled Eggs with Salt', 'Vegetarian Granola Bar',
        'Cheese & Berries', 'Vegetarian Smoothie Bowl', 'Cheese & Pretzels',
        'Greek Yogurt with Granola', 'Cheese & Dried Fruit', 'Vegetarian Protein Bar'
      ]
    },
    'Non-Veg': {
      breakfast: [
        'Eggs and Avocado Toast', 'Greek Yogurt Parfait', 'Chicken Sausage Omelet',
        'Protein Pancakes', 'Eggs Benedict', 'Breakfast Burrito with Bacon',
        'Scrambled Eggs with Salmon', 'Chicken & Waffles', 'Eggs with Sausage',
        'Breakfast Sandwich', 'Eggs with Ham', 'Protein Smoothie Bowl',
        'Bacon & Eggs', 'Chicken Sausage Hash', 'Eggs with Turkey Bacon',
        'Steak & Eggs', 'Chicken & Egg Scramble', 'Bacon Wrapped Eggs',
        'Turkey Sausage & Eggs', 'Ham & Cheese Omelet', 'Chicken Breakfast Bowl',
        'Beef & Egg Hash', 'Salmon & Scrambled Eggs', 'Chicken & Waffle Sandwich',
        'Bacon & Cheese Omelet', 'Turkey Bacon & Eggs', 'Chicken Sausage & Hash',
        'Steak & Egg Burrito', 'Chicken & Egg Wrap', 'Bacon & Egg Sandwich'
      ],
      lunch: [
        'Grilled Chicken Salad', 'Tuna & Quinoa Bowl', 'Turkey and Avocado Wrap',
        'Chicken Caesar Salad', 'Salmon Bowl', 'Tuna Salad Sandwich',
        'Chicken Stir-fry', 'Beef & Broccoli Bowl', 'Fish Tacos',
        'Chicken & Rice Bowl', 'Turkey Club Sandwich', 'Grilled Fish Salad',
        'Chicken Pasta Salad', 'Beef Wrap', 'Salmon & Sweet Potato',
        'Chicken Teriyaki Bowl', 'Beef & Rice Bowl', 'Tuna Poke Bowl',
        'Chicken & Avocado Salad', 'Beef & Quinoa Bowl', 'Salmon Caesar Salad',
        'Chicken & Hummus Wrap', 'Beef & Vegetable Bowl', 'Tuna & Rice Bowl',
        'Chicken & Broccoli Stir-fry', 'Beef & Sweet Potato', 'Salmon & Quinoa',
        'Chicken & Black Bean Bowl', 'Beef & Rice Noodles', 'Tuna & Avocado Bowl'
      ],
      dinner: [
        'Baked Salmon with Veg', 'Chicken Stir-fry', 'Grilled Steak with Sweet Potato',
        'Baked Cod with Vegetables', 'Chicken & Rice', 'Beef Stir-fry',
        'Grilled Chicken Breast', 'Salmon with Asparagus', 'Turkey Meatballs',
        'Beef & Vegetable Skewers', 'Chicken Curry', 'Fish with Roasted Veg',
        'Beef Tacos', 'Chicken & Broccoli', 'Salmon Teriyaki',
        'Grilled Chicken Thighs', 'Beef & Mushroom Stir-fry', 'Baked Fish with Herbs',
        'Chicken & Vegetable Skewers', 'Beef & Broccoli Stir-fry', 'Salmon with Quinoa',
        'Chicken & Sweet Potato', 'Beef & Rice Bowl', 'Grilled Fish with Veg',
        'Chicken & Asparagus', 'Beef & Vegetable Medley', 'Salmon with Rice',
        'Chicken & Zucchini', 'Beef & Cauliflower Rice', 'Fish & Vegetable Stir-fry'
      ],
      snack: [
        'Boiled Eggs', 'Tuna Salad Crackers', 'Protein Smoothie',
        'Chicken Jerky', 'Hard Boiled Eggs', 'Greek Yogurt with Protein',
        'Beef Sticks', 'Egg Muffins', 'Protein Bars',
        'Turkey Roll-ups', 'Salmon & Crackers', 'Chicken & Hummus',
        'Beef & Cheese', 'Tuna & Rice Cakes', 'Chicken & Avocado',
        'Egg & Cheese Bites', 'Beef Jerky', 'Chicken & Veggie Sticks',
        'Salmon & Cream Cheese', 'Turkey & Cheese', 'Chicken & Nuts',
        'Beef & Crackers', 'Tuna & Celery', 'Chicken & Fruit',
        'Egg & Avocado', 'Beef & Hummus', 'Chicken & Rice Cakes'
      ]
    },
    'Keto': {
      breakfast: [
        'Avocado Egg Bowl', 'Chia Coconut Pudding', 'Keto Pancakes',
        'Bacon & Eggs', 'Keto Smoothie Bowl', 'Eggs with Avocado',
        'Keto Waffles', 'Chorizo & Eggs', 'Keto Muffins',
        'Eggs with Sausage', 'Keto Granola', 'Bulletproof Coffee',
        'Keto Omelet', 'Chia Seed Pudding', 'Keto Breakfast Casserole',
        'Keto French Toast', 'Bacon & Cheese Omelet', 'Keto Crepes',
        'Keto Bagels', 'Sausage & Egg Bowl', 'Keto Donuts',
        'Keto Porridge', 'Ham & Cheese Roll-ups', 'Keto Smoothie Bowl',
        'Keto Pancakes with Berries', 'Bacon & Avocado Bowl', 'Keto Muffins',
        'Keto Waffles with Butter', 'Chorizo & Cheese', 'Keto Breakfast Sandwich'
      ],
      lunch: [
        'Chicken Caesar (no croutons)', 'Salmon Salad', 'Keto Taco Bowl',
        'Bacon Lettuce Tomato', 'Keto Burger Bowl', 'Chicken & Avocado Salad',
        'Keto Wrap', 'Beef & Broccoli', 'Keto Pizza',
        'Tuna Salad', 'Keto Soup', 'Chicken & Zucchini',
        'Keto Club Sandwich', 'Salmon & Avocado Bowl', 'Keto Burrito Bowl',
        'Keto Caesar Wrap', 'Beef & Cauliflower Rice', 'Keto Sushi Bowl',
        'Chicken & Bacon Salad', 'Keto Taco Salad', 'Salmon & Spinach',
        'Keto BLT Wrap', 'Beef & Zucchini Noodles', 'Keto Chicken Bowl',
        'Tuna & Avocado Salad', 'Keto Soup Bowl', 'Chicken & Broccoli Bowl',
        'Keto Fish & Chips', 'Beef & Mushroom Bowl', 'Keto Chicken Salad'
      ],
      dinner: [
        'Grilled Salmon & Asparagus', 'Beef & Broccoli', 'Keto Chicken Curry',
        'Baked Cod with Butter', 'Keto Meatballs', 'Grilled Steak',
        'Keto Stir-fry', 'Chicken Thighs', 'Keto Casserole',
        'Fish with Cauliflower Rice', 'Keto Tacos', 'Beef & Mushrooms',
        'Keto Lasagna', 'Salmon & Zucchini', 'Keto Shepherd\'s Pie',
        'Chicken & Cauliflower Rice', 'Keto Pizza', 'Beef & Asparagus',
        'Keto Fish & Chips', 'Chicken & Broccoli Casserole', 'Keto Risotto',
        'Salmon & Spinach', 'Keto Meatloaf', 'Chicken & Zucchini Noodles',
        'Keto Stuffed Peppers', 'Beef & Cauliflower Mash', 'Keto Fish Curry',
        'Chicken & Mushroom Casserole', 'Keto Beef Stew', 'Salmon & Cauliflower'
      ],
      snack: [
        'Almonds', 'Keto Fat Bombs', 'Cheese Cubes',
        'Pork Rinds', 'Keto Smoothie', 'Macadamia Nuts',
        'Keto Bars', 'Olives', 'Keto Cookies',
        'Keto Trail Mix', 'Cheese & Nuts', 'Keto Chocolate',
        'Keto Crackers', 'Beef Jerky', 'Keto Ice Cream',
        'Keto Granola', 'Cheese Sticks', 'Keto Muffins',
        'Keto Energy Balls', 'Nuts & Seeds', 'Keto Yogurt',
        'Keto Chips', 'Cheese & Olives', 'Keto Smoothie Bowl',
        'Keto Cookies', 'Nuts & Dark Chocolate', 'Keto Protein Bar'
      ]
    },
    'Gluten-Free': {
      breakfast: [
        'Quinoa Porridge', 'Eggs & Veg Hash', 'GF Pancakes',
        'GF Toast with Avocado', 'Quinoa Breakfast Bowl', 'GF Muffins',
        'Eggs with GF Bread', 'GF Waffles', 'Quinoa Cereal',
        'GF Granola', 'Eggs with Sweet Potato', 'GF Breakfast Burrito',
        'GF French Toast', 'Quinoa & Egg Bowl', 'GF Crepes',
        'GF Bagels', 'Rice & Egg Bowl', 'GF Donuts',
        'GF Oatmeal', 'Quinoa & Fruit Bowl', 'GF Smoothie Bowl',
        'GF Pancakes with Berries', 'Rice & Avocado Bowl', 'GF Muffins',
        'GF Waffles with Syrup', 'Quinoa & Nuts', 'GF Breakfast Sandwich'
      ],
      lunch: [
        'Rice Bowl with Beans', 'GF Chicken Salad', 'Quinoa Salad',
        'GF Sandwich', 'Rice & Vegetables', 'GF Pasta Salad',
        'GF Wrap', 'Rice Noodles', 'GF Pizza',
        'Quinoa & Chicken', 'GF Soup', 'Rice & Fish',
        'GF Club Sandwich', 'Quinoa & Salmon Bowl', 'GF Burrito Bowl',
        'GF Caesar Wrap', 'Rice & Beef Bowl', 'GF Sushi Bowl',
        'Chicken & Quinoa Salad', 'GF Taco Salad', 'Rice & Tuna Bowl',
        'GF BLT Wrap', 'Quinoa & Vegetable Bowl', 'GF Chicken Bowl',
        'Rice & Avocado Salad', 'GF Soup Bowl', 'Quinoa & Broccoli Bowl',
        'GF Fish & Chips', 'Rice & Mushroom Bowl', 'GF Chicken Salad'
      ],
      dinner: [
        'Zucchini Noodles Pesto', 'Grilled Fish & Veg', 'GF Pasta',
        'Rice & Chicken', 'GF Pizza', 'Quinoa & Vegetables',
        'GF Tacos', 'Rice & Beef', 'GF Stir-fry',
        'Zoodles & Meatballs', 'GF Casserole', 'Rice & Salmon',
        'GF Lasagna', 'Quinoa & Fish Bowl', 'GF Shepherd\'s Pie',
        'Chicken & Rice Bowl', 'GF Pizza', 'Quinoa & Asparagus',
        'GF Fish & Chips', 'Chicken & Broccoli Casserole', 'GF Risotto',
        'Rice & Spinach Bowl', 'GF Meatloaf', 'Quinoa & Zucchini Noodles',
        'GF Stuffed Peppers', 'Rice & Cauliflower Mash', 'GF Fish Curry',
        'Chicken & Mushroom Casserole', 'GF Beef Stew', 'Quinoa & Cauliflower'
      ],
      snack: [
        'Rice Cakes with Almond Butter', 'GF Crackers', 'Quinoa Bars',
        'GF Cookies', 'Rice Cakes with Hummus', 'GF Granola',
        'Quinoa Crisps', 'GF Muffins', 'Rice Cakes with Cheese',
        'GF Trail Mix', 'Rice Cakes & Nuts', 'GF Chocolate',
        'GF Crackers', 'Quinoa & Seeds', 'GF Ice Cream',
        'GF Granola', 'Rice Cakes & Cheese', 'GF Muffins',
        'GF Energy Balls', 'Nuts & Seeds', 'GF Yogurt',
        'GF Chips', 'Rice Cakes & Olives', 'GF Smoothie Bowl',
        'GF Cookies', 'Nuts & Dark Chocolate', 'GF Protein Bar'
      ]
    }
  };

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const db = options[dietPreference] || options['Vegan'];

  const plan = {
    breakfast: { name: pick(db.breakfast), calories: round(calorieLimit * alloc.breakfast) },
    lunch: { name: pick(db.lunch), calories: round(calorieLimit * alloc.lunch) },
    dinner: { name: pick(db.dinner), calories: round(calorieLimit * alloc.dinner) },
    snacks: [{ name: pick(db.snack), calories: round(calorieLimit * alloc.snacks) }]
  };
  plan.totalCalories = plan.breakfast.calories + plan.lunch.calories + plan.dinner.calories + plan.snacks[0].calories;
  return plan;
}

// User signup
app.post('/signup', async (req, res) => {
  const { name, email, password, dob } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  try {
    const users = readJSON(usersFile);
    const existing = users.find(u => u.email === email);

    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const id = users.length ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
    const newUser = {
      id,
      name,
      email,
      password: hashedPassword,
      dob: dob || null,
      role: 'user',
      createdAt: new Date().toISOString(),
      dietPreferences: null,
      mealHistory: []
    };

    users.push(newUser);
    writeJSON(usersFile, users);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, SECRET_KEY, { expiresIn: '24h' });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ message: 'User created successfully', token, user: safeUser });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const users = readJSON(usersFile);
    const foundUser = users.find(u => u.email === email);

    if (!foundUser) return res.status(401).json({ error: 'Invalid credentials' });

    let passwordValid = false;
    if (foundUser.password.startsWith('$2b$')) {
      passwordValid = await bcrypt.compare(password, foundUser.password);
    } else {
      passwordValid = foundUser.password === password;
    }

    if (!passwordValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: foundUser.id, email: foundUser.email, role: foundUser.role || 'user' }, SECRET_KEY, { expiresIn: '24h' });

    const { password: _pw, ...safeUser } = foundUser;
    res.json({ message: 'Login successful', token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/me', authenticate, (req, res) => {
  const users = readJSON(usersFile);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { password, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Save diet preferences (AUTHENTICATED)
app.post('/api/diet-preferences', authenticate, (req, res) => {
  const { dietType, height, weight, goalWeight, activityLevel, calorieTarget, bmi } = req.body;
  try {
    const users = readJSON(usersFile);
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    users[userIndex].dietPreferences = mergeDietPrefs(users[userIndex].dietPreferences, {
      dietType,
      height,
      weight,
      goalWeight,
      activityLevel,
      calorieTarget,
      bmi
    });

    writeJSON(usersFile, users);
    res.json({ message: 'Diet preferences saved successfully', user: users[userIndex] });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public diet preferences save (by email, no token)
app.post('/api/diet-preferences/save', (req, res) => {
  try {
    const { email, dietType, height, weight, goalWeight, activityLevel, calorieTarget, bmi } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    const users = readJSON(usersFile);
    const userIndex = users.findIndex(u => (u.email || '').toLowerCase() === String(email).toLowerCase());
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    users[userIndex].dietPreferences = mergeDietPrefs(users[userIndex].dietPreferences, {
      dietType,
      height,
      weight,
      goalWeight,
      activityLevel,
      calorieTarget,
      bmi
    });

    writeJSON(usersFile, users);
    const { password, ...safeUser } = users[userIndex];
    res.json({ success: true, user: safeUser });
  } catch (e) {
    console.error('Public save preferences error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server (ONLY ONCE!)
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
