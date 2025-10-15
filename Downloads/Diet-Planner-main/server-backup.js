// Enhanced Server with Recipe Database and Meal Planning
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-diet-planner-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory recipe database (expandable)
const recipeDatabase = {
  Vegan: {
    breakfast: [
      {
        id: 1,
        name: "Quinoa Breakfast Bowl",
        calories: 320,
        protein: 12,
        carbs: 58,
        fat: 6,
        fiber: 8,
        ingredients: ["quinoa", "almond milk", "banana", "berries", "chia seeds"],
        cookTime: 15,
        difficulty: "Easy",
        image: "quinoa-bowl.jpg"
      },
      {
        id: 2,
        name: "Avocado Toast with Hemp Seeds",
        calories: 280,
        protein: 8,
        carbs: 32,
        fat: 18,
        fiber: 12,
        ingredients: ["whole grain bread", "avocado", "hemp seeds", "lemon", "tomato"],
        cookTime: 10,
        difficulty: "Easy",
        image: "avocado-toast.jpg"
      },
      {
        id: 3,
        name: "Chia Pudding with Mango",
        calories: 250,
        protein: 6,
        carbs: 35,
        fat: 12,
        fiber: 10,
        ingredients: ["chia seeds", "coconut milk", "mango", "vanilla", "maple syrup"],
        cookTime: 5,
        difficulty: "Easy",
        image: "chia-pudding.jpg"
      },
      {
        id: 4,
        name: "Green Smoothie Bowl",
        calories: 290,
        protein: 10,
        carbs: 45,
        fat: 8,
        fiber: 14,
        ingredients: ["spinach", "banana", "mango", "coconut water", "granola"],
        cookTime: 8,
        difficulty: "Easy",
        image: "green-smoothie.jpg"
      }
    ],
    lunch: [
      {
        id: 5,
        name: "Mediterranean Chickpea Salad",
        calories: 380,
        protein: 15,
        carbs: 45,
        fat: 16,
        fiber: 12,
        ingredients: ["chickpeas", "cucumber", "tomatoes", "olives", "tahini"],
        cookTime: 20,
        difficulty: "Easy",
        image: "chickpea-salad.jpg"
      },
      {
        id: 6,
        name: "Buddha Bowl with Tofu",
        calories: 420,
        protein: 18,
        carbs: 52,
        fat: 15,
        fiber: 10,
        ingredients: ["tofu", "quinoa", "sweet potato", "broccoli", "tahini dressing"],
        cookTime: 30,
        difficulty: "Medium",
        image: "buddha-bowl.jpg"
      },
      {
        id: 7,
        name: "Lentil Curry with Rice",
        calories: 390,
        protein: 16,
        carbs: 65,
        fat: 8,
        fiber: 15,
        ingredients: ["red lentils", "brown rice", "coconut milk", "curry spices", "spinach"],
        cookTime: 25,
        difficulty: "Medium",
        image: "lentil-curry.jpg"
      }
    ],
    dinner: [
      {
        id: 8,
        name: "Stuffed Bell Peppers",
        calories: 350,
        protein: 12,
        carbs: 48,
        fat: 14,
        fiber: 8,
        ingredients: ["bell peppers", "quinoa", "black beans", "corn", "nutritional yeast"],
        cookTime: 40,
        difficulty: "Medium",
        image: "stuffed-peppers.jpg"
      },
      {
        id: 9,
        name: "Mushroom Walnut Pasta",
        calories: 420,
        protein: 14,
        carbs: 55,
        fat: 18,
        fiber: 6,
        ingredients: ["whole wheat pasta", "mushrooms", "walnuts", "nutritional yeast", "herbs"],
        cookTime: 25,
        difficulty: "Easy",
        image: "mushroom-pasta.jpg"
      }
    ],
    snacks: [
      {
        id: 10,
        name: "Hummus with Veggie Sticks",
        calories: 150,
        protein: 6,
        carbs: 18,
        fat: 8,
        fiber: 6,
        ingredients: ["chickpeas", "tahini", "carrots", "cucumber", "bell peppers"],
        cookTime: 10,
        difficulty: "Easy",
        image: "hummus-veggies.jpg"
      },
      {
        id: 11,
        name: "Energy Balls",
        calories: 180,
        protein: 5,
        carbs: 22,
        fat: 9,
        fiber: 4,
        ingredients: ["dates", "almonds", "coconut", "chia seeds", "vanilla"],
        cookTime: 15,
        difficulty: "Easy",
        image: "energy-balls.jpg"
      }
    ]
  },
  "Non-Veg": {
    breakfast: [
      {
        id: 12,
        name: "Scrambled Eggs with Salmon",
        calories: 350,
        protein: 28,
        carbs: 8,
        fat: 24,
        fiber: 2,
        ingredients: ["eggs", "smoked salmon", "cream cheese", "dill", "toast"],
        cookTime: 12,
        difficulty: "Easy",
        image: "eggs-salmon.jpg"
      },
      {
        id: 13,
        name: "Greek Yogurt Parfait with Honey",
        calories: 280,
        protein: 20,
        carbs: 35,
        fat: 8,
        fiber: 4,
        ingredients: ["greek yogurt", "honey", "granola", "berries", "nuts"],
        cookTime: 5,
        difficulty: "Easy",
        image: "yogurt-parfait.jpg"
      },
      {
        id: 14,
        name: "Chicken Sausage Omelet",
        calories: 320,
        protein: 25,
        carbs: 6,
        fat: 22,
        fiber: 2,
        ingredients: ["eggs", "chicken sausage", "cheese", "spinach", "mushrooms"],
        cookTime: 15,
        difficulty: "Medium",
        image: "sausage-omelet.jpg"
      }
    ],
    lunch: [
      {
        id: 15,
        name: "Grilled Chicken Caesar Salad",
        calories: 420,
        protein: 35,
        carbs: 18,
        fat: 25,
        fiber: 6,
        ingredients: ["chicken breast", "romaine lettuce", "parmesan", "caesar dressing", "croutons"],
        cookTime: 20,
        difficulty: "Easy",
        image: "chicken-caesar.jpg"
      },
      {
        id: 16,
        name: "Salmon Bowl with Quinoa",
        calories: 480,
        protein: 32,
        carbs: 45,
        fat: 20,
        fiber: 8,
        ingredients: ["salmon fillet", "quinoa", "avocado", "cucumber", "edamame"],
        cookTime: 25,
        difficulty: "Medium",
        image: "salmon-bowl.jpg"
      },
      {
        id: 17,
        name: "Turkey and Avocado Wrap",
        calories: 380,
        protein: 28,
        carbs: 32,
        fat: 16,
        fiber: 8,
        ingredients: ["turkey breast", "whole wheat tortilla", "avocado", "lettuce", "tomato"],
        cookTime: 10,
        difficulty: "Easy",
        image: "turkey-wrap.jpg"
      }
    ],
    dinner: [
      {
        id: 18,
        name: "Grilled Steak with Sweet Potato",
        calories: 520,
        protein: 38,
        carbs: 35,
        fat: 26,
        fiber: 6,
        ingredients: ["beef sirloin", "sweet potato", "asparagus", "garlic", "herbs"],
        cookTime: 30,
        difficulty: "Medium",
        image: "steak-potato.jpg"
      },
      {
        id: 19,
        name: "Baked Cod with Vegetables",
        calories: 320,
        protein: 28,
        carbs: 25,
        fat: 12,
        fiber: 8,
        ingredients: ["cod fillet", "zucchini", "bell peppers", "onions", "olive oil"],
        cookTime: 25,
        difficulty: "Easy",
        image: "baked-cod.jpg"
      }
    ],
    snacks: [
      {
        id: 20,
        name: "Hard Boiled Eggs",
        calories: 140,
        protein: 12,
        carbs: 2,
        fat: 10,
        fiber: 0,
        ingredients: ["eggs", "salt", "pepper"],
        cookTime: 12,
        difficulty: "Easy",
        image: "boiled-eggs.jpg"
      },
      {
        id: 21,
        name: "Tuna Salad with Crackers",
        calories: 220,
        protein: 18,
        carbs: 15,
        fat: 12,
        fiber: 2,
        ingredients: ["tuna", "whole grain crackers", "celery", "mayo", "lemon"],
        cookTime: 8,
        difficulty: "Easy",
        image: "tuna-crackers.jpg"
      }
    ]
  },
  "Vegetarian": {
    breakfast: [
      {
        id: 22,
        name: "Veggie Scrambled Eggs",
        calories: 290,
        protein: 18,
        carbs: 12,
        fat: 20,
        fiber: 4,
        ingredients: ["eggs", "cheese", "spinach", "tomatoes", "mushrooms"],
        cookTime: 15,
        difficulty: "Easy",
        image: "veggie-eggs.jpg"
      },
      {
        id: 23,
        name: "Pancakes with Greek Yogurt",
        calories: 340,
        protein: 16,
        carbs: 48,
        fat: 10,
        fiber: 6,
        ingredients: ["whole wheat flour", "eggs", "milk", "greek yogurt", "berries"],
        cookTime: 20,
        difficulty: "Medium",
        image: "protein-pancakes.jpg"
      }
    ],
    lunch: [
      {
        id: 24,
        name: "Caprese Salad with Mozzarella",
        calories: 320,
        protein: 18,
        carbs: 12,
        fat: 24,
        fiber: 4,
        ingredients: ["mozzarella", "tomatoes", "basil", "balsamic", "olive oil"],
        cookTime: 10,
        difficulty: "Easy",
        image: "caprese-salad.jpg"
      },
      {
        id: 25,
        name: "Vegetarian Quesadilla",
        calories: 420,
        protein: 20,
        carbs: 45,
        fat: 18,
        fiber: 8,
        ingredients: ["tortilla", "cheese", "black beans", "peppers", "onions"],
        cookTime: 15,
        difficulty: "Easy",
        image: "veggie-quesadilla.jpg"
      }
    ],
    dinner: [
      {
        id: 26,
        name: "Eggplant Parmesan",
        calories: 380,
        protein: 16,
        carbs: 35,
        fat: 22,
        fiber: 8,
        ingredients: ["eggplant", "mozzarella", "parmesan", "marinara", "breadcrumbs"],
        cookTime: 45,
        difficulty: "Medium",
        image: "eggplant-parm.jpg"
      }
    ],
    snacks: [
      {
        id: 27,
        name: "Cheese and Crackers",
        calories: 180,
        protein: 8,
        carbs: 18,
        fat: 10,
        fiber: 3,
        ingredients: ["whole grain crackers", "cheddar cheese", "grapes"],
        cookTime: 2,
        difficulty: "Easy",
        image: "cheese-crackers.jpg"
      }
    ]
  },
  "Gluten-Free": {
    breakfast: [
      {
        id: 28,
        name: "Quinoa Breakfast Porridge",
        calories: 310,
        protein: 12,
        carbs: 52,
        fat: 8,
        fiber: 6,
        ingredients: ["quinoa", "almond milk", "cinnamon", "berries", "almonds"],
        cookTime: 20,
        difficulty: "Easy",
        image: "quinoa-porridge.jpg"
      }
    ],
    lunch: [
      {
        id: 29,
        name: "Rice Bowl with Vegetables",
        calories: 350,
        protein: 10,
        carbs: 65,
        fat: 8,
        fiber: 6,
        ingredients: ["brown rice", "mixed vegetables", "tamari", "sesame oil"],
        cookTime: 25,
        difficulty: "Easy",
        image: "rice-veggie-bowl.jpg"
      }
    ],
    dinner: [
      {
        id: 30,
        name: "Zucchini Noodles with Pesto",
        calories: 280,
        protein: 8,
        carbs: 18,
        fat: 22,
        fiber: 6,
        ingredients: ["zucchini", "basil pesto", "pine nuts", "parmesan", "cherry tomatoes"],
        cookTime: 15,
        difficulty: "Easy",
        image: "zucchini-noodles.jpg"
      }
    ],
    snacks: [
      {
        id: 31,
        name: "Rice Cakes with Almond Butter",
        calories: 160,
        protein: 6,
        carbs: 18,
        fat: 8,
        fiber: 4,
        ingredients: ["brown rice cakes", "almond butter", "banana"],
        cookTime: 3,
        difficulty: "Easy",
        image: "rice-cakes.jpg"
      }
    ]
  },
  "Keto": {
    breakfast: [
      {
        id: 32,
        name: "Keto Avocado Eggs",
        calories: 380,
        protein: 16,
        carbs: 8,
        fat: 34,
        fiber: 10,
        ingredients: ["avocado", "eggs", "bacon", "cheese", "herbs"],
        cookTime: 15,
        difficulty: "Easy",
        image: "keto-avocado-eggs.jpg"
      },
      {
        id: 33,
        name: "Coconut Chia Pudding",
        calories: 320,
        protein: 8,
        carbs: 12,
        fat: 28,
        fiber: 12,
        ingredients: ["chia seeds", "coconut cream", "stevia", "vanilla", "berries"],
        cookTime: 10,
        difficulty: "Easy",
        image: "keto-chia.jpg"
      }
    ],
    lunch: [
      {
        id: 34,
        name: "Keto Caesar Salad",
        calories: 420,
        protein: 25,
        carbs: 8,
        fat: 34,
        fiber: 4,
        ingredients: ["romaine", "chicken", "parmesan", "caesar dressing", "pork rinds"],
        cookTime: 15,
        difficulty: "Easy",
        image: "keto-caesar.jpg"
      }
    ],
    dinner: [
      {
        id: 35,
        name: "Keto Salmon with Asparagus",
        calories: 450,
        protein: 32,
        carbs: 6,
        fat: 35,
        fiber: 3,
        ingredients: ["salmon", "asparagus", "butter", "lemon", "herbs"],
        cookTime: 20,
        difficulty: "Medium",
        image: "keto-salmon.jpg"
      }
    ],
    snacks: [
      {
        id: 36,
        name: "Keto Fat Bombs",
        calories: 200,
        protein: 4,
        carbs: 3,
        fat: 20,
        fiber: 2,
        ingredients: ["coconut oil", "almond butter", "cocoa powder", "stevia"],
        cookTime: 5,
        difficulty: "Easy",
        image: "fat-bombs.jpg"
      }
    ]
  }
};

// Helper functions
async function loadUsers() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'users.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveUsers(users) {
  await fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Get random meals for a specific diet
function getRandomMealsForDiet(dietType, mealType, count = 1) {
  const meals = recipeDatabase[dietType]?.[mealType] || [];
  if (meals.length === 0) return [];
  
  const shuffled = [...meals].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate daily meal plan
function generateDailyMealPlan(dietType, calorieTarget = 1600) {
  const breakfast = getRandomMealsForDiet(dietType, 'breakfast', 1)[0];
  const lunch = getRandomMealsForDiet(dietType, 'lunch', 1)[0];
  const dinner = getRandomMealsForDiet(dietType, 'dinner', 1)[0];
  const snacks = getRandomMealsForDiet(dietType, 'snacks', 2);

  const totalCalories = (breakfast?.calories || 0) + (lunch?.calories || 0) + 
                       (dinner?.calories || 0) + snacks.reduce((sum, snack) => sum + (snack?.calories || 0), 0);

  return {
    breakfast: breakfast || { name: 'No breakfast available', calories: 0 },
    lunch: lunch || { name: 'No lunch available', calories: 0 },
    dinner: dinner || { name: 'No dinner available', calories: 0 },
    snacks: snacks.length > 0 ? snacks : [{ name: 'No snacks available', calories: 0 }],
    totalCalories,
    calorieTarget,
    remainingCalories: calorieTarget - totalCalories
  };
}

// Generate weekly meal plan
function generateWeeklyMealPlan(dietType, calorieTarget = 1600) {
  const weekPlan = {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach(day => {
    weekPlan[day] = generateDailyMealPlan(dietType, calorieTarget);
  });
  
  return weekPlan;
}

// Routes

// User signup
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, dob } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const users = await loadUsers();
    
    if (users.find(user => user.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      dob,
      createdAt: new Date().toISOString(),
      dietPreferences: null,
      mealHistory: []
    };

    users.push(newUser);
    await saveUsers(users);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET);
    
    res.json({
      message: 'User created successfully',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await loadUsers();
    const user = users.find(u => u.email === email);

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save diet preferences
app.post('/api/diet-preferences', authenticateToken, async (req, res) => {
  try {
    const { dietType, height, weight, goalWeight, activityLevel, calorieTarget } = req.body;
    const users = await loadUsers();
    const userIndex = users.findIndex(u => u.id === req.user.userId);

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

    await saveUsers(users);
    res.json({ message: 'Diet preferences saved successfully' });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get meal suggestions (daily plan)
app.get('/api/meal-suggestions', authenticateToken, async (req, res) => {
  try {
    const users = await loadUsers();
    const user = users.find(u => u.id === req.user.userId);

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
app.get('/api/weekly-meal-plan', authenticateToken, async (req, res) => {
  try {
    const users = await loadUsers();
    const user = users.find(u => u.id === req.user.userId);

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

// Regenerate meal plan
app.post('/api/regenerate-meals', authenticateToken, async (req, res) => {
  try {
    const { planType, dietType: requestedDietType } = req.body; // 'daily' or 'weekly'
    const users = await loadUsers();
    const user = users.find(u => u.id === req.user.userId);

    if (!user || !user.dietPreferences) {
      return res.status(404).json({ error: 'User or diet preferences not found' });
    }

    // Use requested diet type or fall back to user's preference
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
app.get('/api/recipes/:dietType', authenticateToken, async (req, res) => {
  try {
    const { dietType } = req.params;
    const { mealType } = req.query; // breakfast, lunch, dinner, snacks

    if (!recipeDatabase[dietType]) {
      return res.status(404).json({ error: 'Diet type not found' });
    }

    let recipes;
    if (mealType && recipeDatabase[dietType][mealType]) {
      recipes = recipeDatabase[dietType][mealType];
    } else {
      // Return all recipes for the diet type
      recipes = {
        breakfast: recipeDatabase[dietType].breakfast || [],
        lunch: recipeDatabase[dietType].lunch || [],
        dinner: recipeDatabase[dietType].dinner || [],
        snacks: recipeDatabase[dietType].snacks || []
      };
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
app.get('/api/recipe/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const recipeId = parseInt(id);

    // Search through all diet types and meal types
    let foundRecipe = null;
    for (const dietType in recipeDatabase) {
      for (const mealType in recipeDatabase[dietType]) {
        const recipe = recipeDatabase[dietType][mealType].find(r => r.id === recipeId);
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
app.post('/api/meal-feedback', authenticateToken, async (req, res) => {
  try {
    const { recipeId, liked, mealType, notes } = req.body;
    const users = await loadUsers();
    const userIndex = users.findIndex(u => u.id === req.user.userId);

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

    await saveUsers(users);
    res.json({ message: 'Feedback saved successfully' });
  } catch (error) {
    console.error('Save feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user meal history
app.get('/api/meal-history', authenticateToken, async (req, res) => {
  try {
    const users = await loadUsers();
    const user = users.find(u => u.id === req.user.userId);

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

// Get available diet types
app.get('/api/diet-types', (req, res) => {
  const dietTypes = Object.keys(recipeDatabase);
  res.json({
    success: true,
    dietTypes
  });
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const users = await loadUsers();
    const user = users.find(u => u.id === req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        dietPreferences: user.dietPreferences,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Diet Planner server running on http://localhost:${PORT}`);
  console.log('📊 Recipe database loaded with:', Object.keys(recipeDatabase).join(', '));
  console.log('🍽️ Available meal types: breakfast, lunch, dinner, snacks');
});

module.exports = app;