// frontend-integration.js - Connect frontend with enhanced backend
const API_BASE = 'http://localhost:3000/api';

// Authentication token management
class AuthManager {
    static getToken() {
        return localStorage.getItem('authToken');
    }

    static setToken(token) {
        localStorage.setItem('authToken', token);
    }

    static removeToken() {
        localStorage.removeItem('authToken');
    }

    static isAuthenticated() {
        const token = this.getToken();
        return token && !this.isTokenExpired(token);
    }

    static isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch (e) {
            return true;
        }
    }

    static getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }
}

// API Service class
class APIService {
    static async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: {
                    ...AuthManager.getHeaders(),
                    ...options.headers
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    static async signup(userData) {
        const result = await this.request('/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (result.token) {
            AuthManager.setToken(result.token);
        }

        return result;
    }

    static async login(credentials) {
        const result = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (result.token) {
            AuthManager.setToken(result.token);
        }

        return result;
    }

    static async getCurrentUser() {
        return await this.request('/me');
    }

    // Diet endpoints
    static async saveDietPreferences(preferences) {
        return await this.request('/diet-preferences', {
            method: 'POST',
            body: JSON.stringify(preferences)
        });
    }

    static async getDietPreferences() {
        return await this.request('/diet-preferences');
    }

    // Meal endpoints
    static async getMealSuggestions() {
        return await this.request('/meal-suggestions');
    }

    static async logMeal(mealData) {
        return await this.request('/meal-log', {
            method: 'POST',
            body: JSON.stringify(mealData)
        });
    }

    static async getMealHistory(date = null) {
        const query = date ? `?date=${date}` : '';
        return await this.request(`/meal-history${query}`);
    }

    // Chatbot endpoints
    static async sendChatMessage(message) {
        return await this.request('/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    static async getChatHistory() {
        return await this.request('/chat-history');
    }

    // Dashboard endpoint
    static async getDashboard() {
        return await this.request('/dashboard');
    }
}

// Enhanced UI Controllers
class UIController {
    // Enhanced signup form handler
    static setupSignupForm() {
        const form = document.getElementById('signupForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                dob: formData.get('dob')
            };

            try {
                this.showLoading('Creating account...');
                await APIService.signup(userData);
                this.showSuccess('Account created successfully! Redirecting...');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.hideLoading();
            }
        });
    }

    // Enhanced login form handler
    static setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            try {
                this.showLoading('Signing in...');
                await APIService.login(credentials);
                this.showSuccess('Login successful! Redirecting...');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.hideLoading();
            }
        });
    }

    // Enhanced BMI calculator with backend integration
    static async calculateAndSaveBMI() {
        const height = parseFloat(document.getElementById('height')?.value);
        const weight = parseFloat(document.getElementById('weight')?.value);
        const goalWeight = parseFloat(document.getElementById('goal')?.value);
        const dietType = document.querySelector('input[name="diet"]:checked')?.value;
        const activityLevel = document.getElementById('activityLevel')?.value || 'moderate';

        if (!height || !weight || !goalWeight || !dietType) {
            alert('Please fill all fields and select a diet type.');
            return;
        }

        try {
            // Calculate BMI locally for immediate display
            const bmi = (weight / ((height / 100) ** 2)).toFixed(1);

            // Display results
            document.getElementById('userSummary').style.display = 'block';
            document.getElementById('bmiVal').innerText = bmi;
            document.getElementById('goalVal').innerText = goalWeight;
            document.getElementById('dietVal').innerText = dietType;

            // Save to backend if user is authenticated
            if (AuthManager.isAuthenticated()) {
                const preferences = {
                    dietType,
                    height,
                    weight,
                    goalWeight,
                    activityLevel
                };

                const result = await APIService.saveDietPreferences(preferences);
                document.getElementById('calorieVal').innerText = result.dietPlan.suggestedCalories;

                // Save to localStorage as backup
                localStorage.setItem('dietPlan', JSON.stringify(result.dietPlan));
            } else {
                // Fallback calorie calculation for non-authenticated users
                let calorieLimit = 1800;
                if (bmi < 18.5) calorieLimit = 2200;
                else if (bmi > 29.9) calorieLimit = 1600;

                document.getElementById('calorieVal').innerText = calorieLimit;

                // Save to localStorage
                localStorage.setItem('bmi', bmi);
                localStorage.setItem('goalWeight', goalWeight);
                localStorage.setItem('dietType', dietType);
                localStorage.setItem('calorieLimit', calorieLimit);
            }
        } catch (error) {
            console.error('Error saving diet preferences:', error);
            // Fallback to localStorage if API fails
            const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
            localStorage.setItem('bmi', bmi);
            localStorage.setItem('goalWeight', goalWeight);
            localStorage.setItem('dietType', dietType);
        }
    }

    // Enhanced meal suggestions loader
    static async loadMealSuggestions() {
        const mealList = document.getElementById('mealList');
        if (!mealList) return;

        try {
            mealList.innerHTML = '<div class="loading">Loading your personalized meal plan...</div>';

            if (AuthManager.isAuthenticated()) {
                const result = await APIService.getMealSuggestions();
                this.displayMealPlan(result);
            } else {
                // Fallback to localStorage data
                this.loadOfflineMealSuggestions();
            }
        } catch (error) {
            console.error('Error loading meal suggestions:', error);
            this.loadOfflineMealSuggestions();
        }
    }

    static displayMealPlan(mealData) {
        const mealList = document.getElementById('mealList');
        const { dailyPlan, totalCalories, suggestedCalories, calorieBalance, dietType } = mealData;

        let html = `
            <div class="meal-summary">
                <h4>Today's Plan (${dietType} Diet)</h4>
                <p><strong>Total Calories:</strong> ${totalCalories} / ${suggestedCalories} kcal</p>
                <p><strong>Balance:</strong> ${calorieBalance > 0 ? '+' : ''}${calorieBalance} kcal</p>
            </div>
        `;

        for (const [mealType, meal] of Object.entries(dailyPlan)) {
            if (mealType === 'snacks') {
                html += `
                    <div class="meal-card">
                        <h4>Snacks</h4>
                        ${meal.map(snack => `<p>• ${snack.name} (${snack.calories} kcal)</p>`).join('')}
                        <div class="meal-actions">
                            <button onclick="UIController.logMeal('${meal[0].name}', 'snack')" title="Log this meal">📝</button>
                            <button onclick="UIController.likeMeal('${meal[0].name}', 'snack')" title="Like">👍</button>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="meal-card">
                        <h4>${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h4>
                        <p><strong>${meal.name}</strong></p>
                        <p>Calories: ${meal.calories} | Protein: ${meal.protein}g | Carbs: ${meal.carbs}g | Fat: ${meal.fat}g</p>
                        <div class="meal-actions">
                            <button onclick="UIController.logMeal('${meal.name}', '${mealType}')" title="Log this meal">📝</button>
                            <button onclick="UIController.likeMeal('${meal.name}', '${mealType}')" title="Like">👍</button>
                        </div>
                    </div>
                `;
            }
        }

        mealList.innerHTML = html;
    }

    static loadOfflineMealSuggestions() {
        // Fallback meal suggestions based on localStorage data
        const dietType = localStorage.getItem('dietType') || 'Non-Veg';
        const calorieLimit = localStorage.getItem('calorieLimit') || 2000;

        const mealList = document.getElementById('mealList');
        mealList.innerHTML = `
            <div class="meal-summary">
                <h4>Basic Plan (${dietType} Diet)</h4>
                <p><strong>Target Calories:</strong> ${calorieLimit} kcal/day</p>
                <p><em>Sign in for personalized meal suggestions!</em></p>
            </div>
            <div class="meal-card">
                <p>Please log in to get personalized meal suggestions based on your preferences.</p>
                <a href="login.html" class="btn">Sign In</a>
            </div>
        `;
    }

    // Meal logging function
    static async logMeal(mealName, mealType) {
        if (!AuthManager.isAuthenticated()) {
            alert('Please sign in to log meals.');
            return;
        }

        try {
            await APIService.logMeal({
                meal: { name: mealName },
                mealType
            });

            this.showSuccess(`${mealName} logged successfully!`);
        } catch (error) {
            this.showError('Failed to log meal: ' + error.message);
        }
    }

    // Like meal function (for future ML improvements)
    static likeMeal(mealName, mealType) {
        const history = JSON.parse(localStorage.getItem('mealHistory') || '[]');
        history.push({
            meal: mealName,
            type: mealType,
            liked: true,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('mealHistory', JSON.stringify(history));
        this.showSuccess('Meal preference saved!');
    }

    // Enhanced chatbot
    static setupChatbot() {
        const sendBtn = document.querySelector('.input-area button');
        const inputField = document.getElementById('userInput');

        if (!sendBtn || !inputField) return;

        sendBtn.addEventListener('click', () => this.sendChatMessage());
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
    }

    static async sendChatMessage() {
        const inputField = document.getElementById('userInput');
        const messagesContainer = document.getElementById('messages');
        const message = inputField.value.trim();

        if (!message) return;

        // Add user message to chat
        this.addMessageToChat(message, 'user');
        inputField.value = '';

        try {
            if (AuthManager.isAuthenticated()) {
                // Use backend API for authenticated users
                const response = await APIService.sendChatMessage(message);
                this.addMessageToChat(response.response, 'bot');
            } else {
                // Use local responses for non-authenticated users
                setTimeout(() => {
                    const response = this.getLocalChatResponse(message);
                    this.addMessageToChat(response, 'bot');
                }, 600);
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
        }
    }

    static addMessageToChat(text, sender) {
        const messagesContainer = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    static getLocalChatResponse(message) {
        const lowerMessage = message.toLowerCase();
        const responses = {
            'hello': 'Hi! How can I help you with your diet today?',
            'diet': 'I can help you with various diet types including Keto, Vegan, and Non-Veg diets. What would you like to know?',
            'weight': 'Weight management involves creating a balanced calorie deficit through proper nutrition and exercise.',
            'exercise': 'Regular exercise is important for overall health. I recommend combining cardio with strength training.',
            'calories': 'Calorie needs vary by person. Use our BMI calculator to get personalized recommendations!',
            'default': "I'm here to help with diet and nutrition questions. Try asking about diets, exercise, or calories!"
        };

        for (const [key, response] of Object.entries(responses)) {
            if (key !== 'default' && lowerMessage.includes(key)) {
                return response;
            }
        }

        return responses.default;
    }

    // Utility functions for UI feedback
    static showLoading(message = 'Loading...') {
        // Create or show loading indicator
        let loader = document.getElementById('loading-indicator');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loading-indicator';
            loader.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 1000;
            `;
            document.body.appendChild(loader);
        }
        loader.textContent = message;
        loader.style.display = 'block';
    }

    static hideLoading() {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.style.display = 'none';
    }

    static showSuccess(message) {
        this.showToast(message, 'success');
    }

    static showError(message) {
        this.showToast(message, 'error');
    }

    static showToast(message, type) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: bold;
            z-index: 1001;
            opacity: 0;
            transition: opacity 0.3s ease;
            ${type === 'success' ? 'background: #4CAF50;' : 'background: #f44336;'}
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Fade in
        setTimeout(() => toast.style.opacity = '1', 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Setup forms
    UIController.setupSignupForm();
    UIController.setupLoginForm();
    UIController.setupChatbot();

    // Check authentication status
    if (!AuthManager.isAuthenticated() && !window.location.pathname.includes('login') && !window.location.pathname.includes('signup')) {
        console.log('User not authenticated - some features may be limited');
    }

    // Load page-specific content
    const currentPage = window.location.pathname.split('/').pop();

    switch (currentPage) {
        case 'index.html':
        case '':
            // Set up BMI calculator
            const calculateBtn = document.querySelector('button[onclick="calculateBMI()"]');
            if (calculateBtn) {
                calculateBtn.onclick = UIController.calculateAndSaveBMI;
            }
            break;

        case 'summary.html':
            UIController.loadMealSuggestions();
            break;

        case 'chatbot.html':
            // Chatbot is already set up in setupChatbot()
            break;
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIService, AuthManager, UIController };
}
