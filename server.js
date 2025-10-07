// Enhanced Diet Planner Backend with Comprehensive Meal APIs

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
let OpenAIClient = null;
try {
  OpenAIClient = require('openai');
} catch (e) {
  // openai package not installed or failed to load; we'll fallback
}

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'diet_planner_secret_2024';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN || '';

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

// AI Chat endpoint (no auth required, optional)
app.post('/ai/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    // Local fallback responder for when OpenAI is not configured
    const localResponder = (text) => {
      const q = String(text).toLowerCase();
      if (/hello|hi|hey/.test(q)) return 'Hi! How can I help with diets, nutrition, or fitness?';
      if (/bmi|body\s*mass\s*index/.test(q)) return 'BMI = weight(kg) / (height(m)^2). Aim for 18.5–24.9.';
      if (/calorie|calories/.test(q)) return 'Calories depend on age, sex, height, weight, activity. Start with your target and adjust ±100–200 kcal based on weekly progress.';
      if (/protein/.test(q)) return 'Aim ~1.2–2.2 g protein per kg body weight daily depending on goals.';
      if (/keto/.test(q)) return 'Keto is low‑carb, high‑fat. Focus on eggs, meat/fish, cheese, non‑starchy veg.';
      if (/vegan/.test(q)) return 'Vegan excludes animal products. Emphasize legumes, tofu/tempeh, whole grains, nuts/seeds; supplement B12.';
      if (/gluten[- ]?free|gluten/.test(q)) return 'Gluten‑free is crucial for celiac/sensitivity; not inherently healthier otherwise.';
      if (/lose\s*weight|weight\s*loss/.test(q)) return 'For weight loss: modest deficit, high protein/fiber, 2–3x/week strength training, 7–8h sleep, daily steps.';
      return "I can help with diets, calories, meals, and fitness. Try: 'How many calories should I eat to lose weight?'";
    };

    // Try OpenAI if configured
    if (OpenAIClient && OPENAI_API_KEY) {
      try {
        const client = new OpenAIClient({ apiKey: OPENAI_API_KEY });
        // Map history into Chat Completions format if provided
        const messages = [];
        if (Array.isArray(history)) {
          for (const h of history.slice(-10)) {
            if (h && typeof h.content === 'string' && (h.role === 'user' || h.role === 'assistant')) {
              messages.push({ role: h.role, content: h.content });
            }
          }
        }
        messages.unshift({ role: 'system', content: 'You are a helpful nutrition and diet planning assistant for a Diet Planner app. Be concise and practical.' });
        messages.push({ role: 'user', content: message });

        // Use chat.completions if available in version installed
        let replyText = '';
        if (client.chat && client.chat.completions && client.chat.completions.create) {
          const completion = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages
          });
          replyText = completion.choices?.[0]?.message?.content?.trim() || '';
        } else if (client.responses && client.responses.create) {
          // New Responses API fallback
          const resp = await client.responses.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            input: messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
          });
          replyText = resp.output_text?.trim?.() || resp.output?.[0]?.content?.[0]?.text || '';
        }

        if (replyText) {
          return res.json({ reply: replyText });
        }
        // If no reply, fall through to local
      } catch (e) {
        console.warn('OpenAI chat failed, using local fallback:', e.message || e);
      }
    }

    // Fallback
    return res.json({ reply: localResponder(message) });
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

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
