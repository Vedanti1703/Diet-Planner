// Enhanced Diet Planner Backend with Comprehensive Meal APIs


const express = require('express');
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

// Initialize files
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf8');
if (!fs.existsSync(mealsFile)) fs.writeFileSync(mealsFile, '{}', 'utf8');
if (!fs.existsSync(preferencesFile)) fs.writeFileSync(preferencesFile, '{}', 'utf8');

// Comprehensive meal database
const MEAL_DATABASE = {
  'Vegan': {
    breakfast: [
      { 
        id: 1, name: 'Quinoa Breakfast Bowl', calories: 320, protein: 12, carbs: 58, fat: 6, fiber: 8,
        ingredients: ['quinoa', 'almond milk', 'banana', 'berries', 'chia seeds'],
        cookTime: 15, difficulty: 'Easy', image: 'quinoa-bowl.jpg'
      },
      { 
        id: 2, name: 'Avocado Toast with Hemp Seeds', calories: 280, protein: 8, carbs: 32, fat: 18, fiber: 12,
        ingredients: ['whole grain bread', 'avocado', 'hemp seeds', 'lemon', 'tomato'],
        cookTime: 10, difficulty: 'Easy', image: 'avocado-toast.jpg'
      },
      { 
        id: 3, name: 'Chia Pudding with Mango', calories: 250, protein: 6, carbs: 35, fat: 12, fiber: 10,
        ingredients: ['chia seeds', 'coconut milk', 'mango', 'vanilla', 'maple syrup'],
        cookTime: 5, difficulty: 'Easy', image: 'chia-pudding.jpg'
      },
      { 
        id: 4, name: 'Green Smoothie Bowl', calories: 290, protein: 10, carbs: 45, fat: 8, fiber: 14,
        ingredients: ['spinach', 'banana', 'mango', 'coconut water', 'granola'],
        cookTime: 8, difficulty: 'Easy', image: 'green-smoothie.jpg'
      },
      { 
        id: 5, name: 'Oatmeal with Berries and Nuts', calories: 270, protein: 8, carbs: 50, fat: 5, fiber: 8,
        ingredients: ['rolled oats', 'almond milk', 'mixed berries', 'walnuts', 'cinnamon'],
        cookTime: 12, difficulty: 'Easy', image: 'berry-oatmeal.jpg'
      }
    ],
    lunch: [
      { 
        id: 6, name: 'Mediterranean Chickpea Salad', calories: 380, protein: 15, carbs: 45, fat: 16, fiber: 12,
        ingredients: ['chickpeas', 'cucumber', 'tomatoes', 'olives', 'tahini'],
        cookTime: 20, difficulty: 'Easy', image: 'chickpea-salad.jpg'
      },
      { 
        id: 7, name: 'Buddha Bowl with Tofu', calories: 420, protein: 18, carbs: 52, fat: 15, fiber: 10,
        ingredients: ['tofu', 'quinoa', 'sweet potato', 'broccoli', 'tahini dressing'],
        cookTime: 30, difficulty: 'Medium', image: 'buddha-bowl.jpg'
      },
      { 
        id: 8, name: 'Lentil Curry with Rice', calories: 390, protein: 16, carbs: 65, fat: 8, fiber: 15,
        ingredients: ['red lentils', 'brown rice', 'coconut milk', 'curry spices', 'spinach'],
        cookTime: 25, difficulty: 'Medium', image: 'lentil-curry.jpg'
      },
      { 
        id: 9, name: 'Black Bean Tacos', calories: 330, protein: 12, carbs: 45, fat: 10, fiber: 14,
        ingredients: ['black beans', 'corn tortillas', 'avocado', 'salsa', 'lettuce'],
        cookTime: 18, difficulty: 'Easy', image: 'bean-tacos.jpg'
      }
    ],
    dinner: [
      { 
        id: 10, name: 'Stuffed Bell Peppers', calories: 350, protein: 12, carbs: 48, fat: 14, fiber: 8,
        ingredients: ['bell peppers', 'quinoa', 'black beans', 'corn', 'nutritional yeast'],
        cookTime: 40, difficulty: 'Medium', image: 'stuffed-peppers.jpg'
      },
      { 
        id: 11, name: 'Mushroom Walnut Pasta', calories: 420, protein: 14, carbs: 55, fat: 18, fiber: 6,
        ingredients: ['whole wheat pasta', 'mushrooms', 'walnuts', 'nutritional yeast', 'herbs'],
        cookTime: 25, difficulty: 'Easy', image: 'mushroom-pasta.jpg'
      },
      { 
        id: 12, name: 'Sweet Potato and Kale Curry', calories: 340, protein: 10, carbs: 55, fat: 12, fiber: 10,
        ingredients: ['sweet potato', 'kale', 'coconut milk', 'chickpeas', 'curry powder'],
        cookTime: 35, difficulty: 'Medium', image: 'sweet-potato-curry.jpg'
      }
    ],
    snacks: [
      { 
        id: 13, name: 'Hummus with Veggie Sticks', calories: 150, protein: 6, carbs: 18, fat: 8, fiber: 6,
        ingredients: ['chickpeas', 'tahini', 'carrots', 'cucumber', 'bell peppers'],
        cookTime: 10, difficulty: 'Easy', image: 'hummus-veggies.jpg'
      },
      { 
        id: 14, name: 'Energy Balls', calories: 180, protein: 5, carbs: 22, fat: 9, fiber: 4,
        ingredients: ['dates', 'almonds', 'coconut', 'chia seeds', 'vanilla'],
        cookTime: 15, difficulty: 'Easy', image: 'energy-balls.jpg'
      },
      { 
        id: 15, name: 'Almond Butter Toast', calories: 220, protein: 8, carbs: 20, fat: 14, fiber: 6,
        ingredients: ['whole grain bread', 'almond butter', 'banana', 'hemp seeds'],
        cookTime: 5, difficulty: 'Easy', image: 'almond-toast.jpg'
      }
    ]
  },
  'Non-Veg': {
    breakfast: [
      { 
        id: 16, name: 'Scrambled Eggs with Salmon', calories: 350, protein: 28, carbs: 8, fat: 24, fiber: 2,
        ingredients: ['eggs', 'smoked salmon', 'cream cheese', 'dill', 'whole grain toast'],
        cookTime: 12, difficulty: 'Easy', image: 'eggs-salmon.jpg'
      },
      { 
        id: 17, name: 'Greek Yogurt Parfait with Honey', calories: 280, protein: 20, carbs: 35, fat: 8, fiber: 4,
        ingredients: ['greek yogurt', 'honey', 'granola', 'mixed berries', 'almonds'],
        cookTime: 5, difficulty: 'Easy', image: 'yogurt-parfait.jpg'
      },
      { 
        id: 18, name: 'Chicken Sausage Omelet', calories: 320, protein: 25, carbs: 6, fat: 22, fiber: 2,
        ingredients: ['eggs', 'chicken sausage', 'cheese', 'spinach', 'mushrooms'],
        cookTime: 15, difficulty: 'Medium', image: 'sausage-omelet.jpg'
      },
      { 
        id: 19, name: 'Protein Pancakes with Turkey Bacon', calories: 380, protein: 28, carbs: 32, fat: 16, fiber: 4,
        ingredients: ['protein powder', 'eggs', 'banana', 'turkey bacon', 'berries'],
        cookTime: 20, difficulty: 'Medium', image: 'protein-pancakes.jpg'
      }
    ],
    lunch: [
      { 
        id: 20, name: 'Grilled Chicken Caesar Salad', calories: 420, protein: 35, carbs: 18, fat: 25, fiber: 6,
        ingredients: ['chicken breast', 'romaine lettuce', 'parmesan', 'caesar dressing', 'croutons'],
        cookTime: 20, difficulty: 'Easy', image: 'chicken-caesar.jpg'
      },
      { 
        id: 21, name: 'Salmon Bowl with Quinoa', calories: 480, protein: 32, carbs: 45, fat: 20, fiber: 8,
        ingredients: ['salmon fillet', 'quinoa', 'avocado', 'cucumber', 'edamame'],
        cookTime: 25, difficulty: 'Medium', image: 'salmon-bowl.jpg'
      },
      { 
        id: 22, name: 'Turkey and Avocado Wrap', calories: 380, protein: 28, carbs: 32, fat: 16, fiber: 8,
        ingredients: ['turkey breast', 'whole wheat tortilla', 'avocado', 'lettuce', 'tomato'],
        cookTime: 10, difficulty: 'Easy', image: 'turkey-wrap.jpg'
      },
      { 
        id: 23, name: 'Tuna Salad Power Bowl', calories: 360, protein: 30, carbs: 25, fat: 18, fiber: 6,
        ingredients: ['tuna', 'mixed greens', 'quinoa', 'cherry tomatoes', 'olive oil'],
        cookTime: 15, difficulty: 'Easy', image: 'tuna-bowl.jpg'
      }
    ],
    dinner: [
      { 
        id: 24, name: 'Grilled Steak with Sweet Potato', calories: 520, protein: 38, carbs: 35, fat: 26, fiber: 6,
        ingredients: ['beef sirloin', 'sweet potato', 'asparagus', 'garlic', 'herbs'],
        cookTime: 30, difficulty: 'Medium', image: 'steak-potato.jpg'
      },
      { 
        id: 25, name: 'Baked Cod with Vegetables', calories: 320, protein: 28, carbs: 25, fat: 12, fiber: 8,
        ingredients: ['cod fillet', 'zucchini', 'bell peppers', 'onions', 'olive oil'],
        cookTime: 25, difficulty: 'Easy', image: 'baked-cod.jpg'
      },
      { 
        id: 26, name: 'Chicken Stir Fry with Brown Rice', calories: 380, protein: 32, carbs: 35, fat: 14, fiber: 5,
        ingredients: ['chicken breast', 'mixed vegetables', 'brown rice', 'soy sauce', 'ginger'],
        cookTime: 20, difficulty: 'Easy', image: 'chicken-stirfry.jpg'
      }
    ],
    snacks: [
      { 
        id: 27, name: 'Hard Boiled Eggs with Crackers', calories: 160, protein: 14, carbs: 12, fat: 8, fiber: 2,
        ingredients: ['eggs', 'whole grain crackers', 'mustard', 'pepper'],
        cookTime: 12, difficulty: 'Easy', image: 'eggs-crackers.jpg'
      },
      { 
        id: 28, name: 'Tuna Salad with Whole Grain Crackers', calories: 220, protein: 18, carbs: 15, fat: 12, fiber: 3,
        ingredients: ['tuna', 'whole grain crackers', 'celery', 'greek yogurt', 'lemon'],
        cookTime: 8, difficulty: 'Easy', image: 'tuna-crackers.jpg'
      },
      { 
        id: 29, name: 'Protein Smoothie', calories: 200, protein: 20, carbs: 18, fat: 6, fiber: 4,
        ingredients: ['protein powder', 'banana', 'almond milk', 'peanut butter', 'ice'],
        cookTime: 5, difficulty: 'Easy', image: 'protein-smoothie.jpg'
      }
    ]
  },
  'Vegetarian': {
    breakfast: [
      { 
        id: 30, name: 'Veggie Scrambled Eggs', calories: 290, protein: 18, carbs: 12, fat: 20, fiber: 4,
        ingredients: ['eggs', 'cheese', 'spinach', 'tomatoes', 'mushrooms'],
        cookTime: 15, difficulty: 'Easy', image: 'veggie-eggs.jpg'
      },
      { 
        id: 31, name: 'Pancakes with Greek Yogurt', calories: 340, protein: 16, carbs: 48, fat: 10, fiber: 6,
        ingredients: ['whole wheat flour', 'eggs', 'milk', 'greek yogurt', 'berries'],
        cookTime: 20, difficulty: 'Medium', image: 'greek-pancakes.jpg'
      }
    ],
    lunch: [
      { 
        id: 32, name: 'Caprese Salad with Fresh Mozzarella', calories: 320, protein: 18, carbs: 12, fat: 24, fiber: 4,
        ingredients: ['fresh mozzarella', 'tomatoes', 'basil', 'balsamic vinegar', 'olive oil'],
        cookTime: 10, difficulty: 'Easy', image: 'caprese-salad.jpg'
      },
      { 
        id: 33, name: 'Vegetarian Quesadilla', calories: 420, protein: 20, carbs: 45, fat: 18, fiber: 8,
        ingredients: ['whole wheat tortilla', 'cheese', 'black beans', 'peppers', 'onions'],
        cookTime: 15, difficulty: 'Easy', image: 'veggie-quesadilla.jpg'
      }
    ],
    dinner: [
      { 
        id: 34, name: 'Eggplant Parmesan', calories: 380, protein: 16, carbs: 35, fat: 22, fiber: 8,
        ingredients: ['eggplant', 'mozzarella', 'parmesan', 'marinara sauce', 'breadcrumbs'],
        cookTime: 45, difficulty: 'Medium', image: 'eggplant-parm.jpg'
      }
    ],
    snacks: [
      { 
        id: 35, name: 'Cheese and Whole Grain Crackers', calories: 180, protein: 8, carbs: 18, fat: 10, fiber: 3,
        ingredients: ['cheddar cheese', 'whole grain crackers', 'grapes'],
        cookTime: 2, difficulty: 'Easy', image: 'cheese-crackers.jpg'
      }
    ]
  },
  'Keto': {
    breakfast: [
      { 
        id: 36, name: 'Keto Avocado Eggs', calories: 380, protein: 16, carbs: 8, fat: 34, fiber: 10,
        ingredients: ['avocado', 'eggs', 'bacon', 'cheese', 'herbs'],
        cookTime: 15, difficulty: 'Easy', image: 'keto-avocado-eggs.jpg'
      },
      { 
        id: 37, name: 'Coconut Chia Pudding', calories: 320, protein: 8, carbs: 12, fat: 28, fiber: 12,
        ingredients: ['chia seeds', 'coconut cream', 'stevia', 'vanilla', 'berries'],
        cookTime: 10, difficulty: 'Easy', image: 'keto-chia.jpg'
      }
    ],
    lunch: [
      { 
        id: 38, name: 'Keto Caesar Salad with Chicken', calories: 420, protein: 25, carbs: 8, fat: 34, fiber: 4,
        ingredients: ['romaine lettuce', 'chicken', 'parmesan', 'caesar dressing', 'pork rinds'],
        cookTime: 15, difficulty: 'Easy', image: 'keto-caesar.jpg'
      }
    ],
    dinner: [
      { 
        id: 39, name: 'Keto Salmon with Asparagus', calories: 450, protein: 32, carbs: 6, fat: 35, fiber: 3,
        ingredients: ['salmon fillet', 'asparagus', 'butter', 'lemon', 'herbs'],
        cookTime: 20, difficulty: 'Medium', image: 'keto-salmon.jpg'
      }
    ],
    snacks: [
      { 
        id: 40, name: 'Keto Fat Bombs', calories: 200, protein: 4, carbs: 3, fat: 20, fiber: 2,
        ingredients: ['coconut oil', 'almond butter', 'cocoa powder', 'stevia'],
        cookTime: 5, difficulty: 'Easy', image: 'fat-bombs.jpg'
      }
    ]
  },
  'Gluten-Free': {
    breakfast: [
      { 
        id: 41, name: 'Quinoa Breakfast Porridge', calories: 310, protein: 12, carbs: 52, fat: 8, fiber: 6,
        ingredients: ['quinoa', 'almond milk', 'cinnamon', 'berries', 'almonds'],
        cookTime: 20, difficulty: 'Easy', image: 'quinoa-porridge.jpg'
      }
    ],
    lunch: [
      { 
        id: 42, name: 'Rice Bowl with Grilled Vegetables', calories: 350, protein: 10, carbs: 65, fat: 8, fiber: 6,
        ingredients: ['brown rice', 'mixed vegetables', 'tamari', 'sesame oil'],
        cookTime: 25, difficulty: 'Easy', image: 'rice-veggie-bowl.jpg'
      }
    ],
    dinner: [
      { 
        id: 43, name: 'Zucchini Noodles with Pesto', calories: 280, protein: 8, carbs: 18, fat: 22, fiber: 6,
        ingredients: ['zucchini', 'basil pesto', 'pine nuts', 'parmesan', 'cherry tomatoes'],
        cookTime: 15, difficulty: 'Easy', image: 'zucchini-noodles.jpg'
      }
    ],
    snacks: [
      { 
        id: 44, name: 'Rice Cakes with Almond Butter', calories: 160, protein: 6, carbs: 18, fat: 8, fiber: 4,
        ingredients: ['brown rice cakes', 'almond butter', 'banana'],
        cookTime: 3, difficulty: 'Easy', image: 'rice-cakes.jpg'
      }
    ]
  }
};

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

// Utility functions for meal generation
function getRandomMealsForDiet(dietType, mealType, count = 1) {
  const meals = MEAL_DATABASE[dietType]?.[mealType] || [];
  if (meals.length === 0) return [];
  
  const shuffled = [...meals].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateDailyMealPlan(dietType, calorieTarget = 1600) {
  const breakfast = getRandomMealsForDiet(dietType, 'breakfast', 1)[0];
  const lunch = getRandomMealsForDiet(dietType, 'lunch', 1)[0];
  const dinner = getRandomMealsForDiet(dietType, 'dinner', 1)[0];
  const snacks = getRandomMealsForDiet(dietType, 'snacks', 2);

  const totalCalories = (breakfast?.calories || 0) + (lunch?.calories || 0) + 
                       (dinner?.calories || 0) + snacks.reduce((sum, snack) => sum + (snack?.calories || 0), 0);

  return {
    breakfast: breakfast || { name: 'No breakfast available', calories: 0, protein: 0, carbs: 0, fat: 0 },
    lunch: lunch || { name: 'No lunch available', calories: 0, protein: 0, carbs: 0, fat: 0 },
    dinner: dinner || { name: 'No dinner available', calories: 0, protein: 0, carbs: 0, fat: 0 },
    snacks: snacks.length > 0 ? snacks : [{ name: 'No snacks available', calories: 0, protein: 0, carbs: 0, fat: 0 }],
    totalCalories,
    calorieTarget,
    remainingCalories: calorieTarget - totalCalories
  };
}

function generateWeeklyMealPlan(dietType, calorieTarget = 1600) {
  const weekPlan = {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach(day => {
    weekPlan[day] = generateDailyMealPlan(dietType, calorieTarget);
  });
  
  return weekPlan;
}

// ============ ROUTES ============

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Enhanced Diet Planner Backend Running', features: ['meal-planning', 'user-auth', 'preferences'] });
});

// User signup with password hashing
app.post('/signup', async (req, res) => {
  const { name, email, password, dob } = req.body || {};
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  try {
    const users = readJSON(usersFile);
    const existing = users.find(u => u.email === email);
    
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
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
    const ok = writeJSON(usersFile, users);
    
    if (!ok) return res.status(500).json({ error: 'Failed to save user' });

    // Auto-login with token
    const token = jwt.sign({ 
      id: newUser.id, 
      email: newUser.email, 
      role: newUser.role 
    }, SECRET_KEY, { expiresIn: '24h' });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ 
      message: 'User created successfully', 
      token, 
      user: safeUser 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login with password verification
app.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const users = readJSON(usersFile);
    const foundUser = users.find(u => u.email === email);
    
    if (!foundUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password (handle both hashed and plain text for backward compatibility)
    let passwordValid = false;
    if (foundUser.password.startsWith('$2b$')) {
      // Hashed password
      passwordValid = await bcrypt.compare(password, foundUser.password);
    } else {
      // Plain text password (for backward compatibility)
      passwordValid = foundUser.password === password;
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({
      id: foundUser.id,
      email: foundUser.email,
      role: foundUser.role || 'user'
    }, SECRET_KEY, { expiresIn: '24h' });

    const { password: _pw, ...safeUser } = foundUser;
    res.json({ 
      message: 'Login successful', 
      token, 
      user: safeUser 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/me', authenticate, (req, res) => {
  const users = readJSON(usersFile);
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Save diet preferences
app.post('/api/diet-preferences', authenticate, (req, res) => {
  const { dietType, height, weight, goalWeight, activityLevel, calorieTarget } = req.body;
  
  try {
    const users = readJSON(usersFile);
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].dietPreferences = {
      dietType,
      height: parseFloat(height),
      weight: parseFloat(weight),
      goalWeight: parseFloat(goalWeight),
      activityLevel,
      calorieTarget: parseInt(calorieTarget),
      updatedAt: new Date().toISOString()
    };

    writeJSON(usersFile, users);
    res.json({ message: 'Diet preferences saved successfully' });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get daily meal suggestions
app.get('/api/meal-suggestions', authenticate, (req, res) => {
  try {
    const users = readJSON(usersFile);
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.dietPreferences) {
      return res.status(404).json({ error: 'No diet preferences found' });
    }

    const { dietType, calorieTarget } = user.dietPreferences;
    const dailyPlan = generateDailyMealPlan(dietType, calorieTarget);

    res.json({
      success: true,
      dietType,
      calorieTarget,
      dailyPlan: dailyPlan,
      totalCalories: dailyPlan.totalCalories,
      suggestedCalories: calorieTarget,
      calorieBalance: dailyPlan.remainingCalories
    });
  } catch (error) {
    console.error('Meal suggestions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get weekly meal plan
app.get('/api/weekly-meal-plan', authenticate, (req, res) => {
  try {
    const users = readJSON(usersFile);
    const user = users.find(u => u.id === req.user.id);

    if (!user || !user.dietPreferences) {
      return res.status(404).json({ error: 'User or diet preferences not found' });
    }

    const { dietType, calorieTarget } = user.dietPreferences;
    const weeklyPlan = generateWeeklyMealPlan(dietType, calorieTarget);

    res.json({
      success: true,
      dietType,
      weeklyPlan,
      calorieTarget
    });
  } catch (error) {
    console.error('Weekly meal plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Regenerate meals
app.post('/api/regenerate-meals', authenticate, (req, res) => {
  try {
    const { planType, dietType: requestedDietType } = req.body;
    const users = readJSON(usersFile);
    const user = users.find(u => u.id === req.user.id);

    if (!user || !user.dietPreferences) {
      return res.status(404).json({ error: 'User or diet preferences not found' });
    }

    const dietType = requestedDietType || user.dietPreferences.dietType;
    const calorieTarget = user.dietPreferences.calorieTarget;

    let result;
    if (planType === 'weekly') {
      const weeklyPlan = generateWeeklyMealPlan(dietType, calorieTarget);
      result = {
        success: true,
        dietType,
        weeklyPlan,
        calorieTarget,
        planType: 'weekly'
      };
    } else {
      const dailyPlan = generateDailyMealPlan(dietType, calorieTarget);
      result = {
        success: true,
        dietType,
        dailyPlan,
        totalCalories: dailyPlan.totalCalories,
        suggestedCalories: calorieTarget,
        calorieBalance: dailyPlan.remainingCalories,
        planType: 'daily'
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Regenerate meals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recipes by diet type
app.get('/api/recipes/:dietType', authenticate, (req, res) => {
  try {
    const { dietType } = req.params;
    const { mealType } = req.query;

    if (!MEAL_DATABASE[dietType]) {
      return res.status(404).json({ error: 'Diet type not found' });
    }

    let recipes;
    if (mealType && MEAL_DATABASE[dietType][mealType]) {
      recipes = MEAL_DATABASE[dietType][mealType];
    } else {
      recipes = MEAL_DATABASE[dietType];
    }

    res.json({
      success: true,
      dietType,
      recipes
    });
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific recipe details
app.get('/api/recipe/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const recipeId = parseInt(id);

    let foundRecipe = null;
    for (const dietType in MEAL_DATABASE) {
      for (const mealType in MEAL_DATABASE[dietType]) {
        const recipe = MEAL_DATABASE[dietType][mealType].find(r => r.id === recipeId);
        if (recipe) {
          foundRecipe = { ...recipe, dietType, mealType };
          break;
        }
      }
      if (foundRecipe) break;
    }

    if (!foundRecipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({
      success: true,
      recipe: foundRecipe
    });
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save meal feedback
app.post('/api/meal-feedback', authenticate, (req, res) => {
  try {
    const { recipeId, liked, mealType, notes } = req.body;
    const users = readJSON(usersFile);
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!users[userIndex].mealHistory) {
      users[userIndex].mealHistory = [];
    }

    users[userIndex].mealHistory.push({
      recipeId: parseInt(recipeId),
      liked: Boolean(liked),
      mealType,
      notes,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 feedback entries
    if (users[userIndex].mealHistory.length > 100) {
      users[userIndex].mealHistory = users[userIndex].mealHistory.slice(-100);
    }

    writeJSON(usersFile, users);
    res.json({ message: 'Feedback saved successfully' });
  } catch (error) {
    console.error('Save feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available diet types
app.get('/api/diet-types', (req, res) => {
  const dietTypes = Object.keys(MEAL_DATABASE);
  res.json({
    success: true,
    dietTypes,
    totalRecipes: Object.values(MEAL_DATABASE).reduce((total, diet) => {
      return total + Object.values(diet).reduce((sum, meals) => sum + meals.length, 0);
    }, 0)
  });
});

// Get meal history
app.get('/api/meal-history', authenticate, (req, res) => {
  try {
    const users = readJSON(usersFile);
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      mealHistory: user.mealHistory || []
    });
  } catch (error) {
    console.error('Get meal history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Diet Planner Server running on http://localhost:${PORT}`);
  console.log(`📊 Recipe database loaded with ${Object.keys(MEAL_DATABASE).length} diet types`);
  console.log(`🍽️ Total recipes available: ${Object.values(MEAL_DATABASE).reduce((total, diet) => {
    return total + Object.values(diet).reduce((sum, meals) => sum + meals.length, 0);
  }, 0)}`);
  console.log(`💡 Available diet types: ${Object.keys(MEAL_DATABASE).join(', ')}`);
});


//Ai
/*const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});


app.post('/ai/meal-plan', authenticate, async (req, res) => {
  const { prompt } = req.body;
  const fullPrompt = `
You are a nutrition expert. Given these goals and restrictions:
${prompt}
Generate a detailed daily meal plan (breakfast, lunch, dinner, snacks) with approximate calories.
`;
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: fullPrompt }],
      temperature: 0.7
    });
    const plan = completion.data.choices[0].message.content;
    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI generation failed' });
  }
});*/

module.exports = app;