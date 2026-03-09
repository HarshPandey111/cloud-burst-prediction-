# ☁️ Cloud Burst Prediction & Risk Analysis - Full Stack Application

## 📌 Project Overview

A full-stack web application that predicts cloudburst events and analyzes associated risks using Machine Learning. Built with **React.js** (Frontend), **Flask/Python** (Backend API), and **scikit-learn / XGBoost** (ML Model).

This README serves as a **complete guide / prompt for Cursor AI** to build the entire application from scratch.

---

## 🏗️ Project Architecture

```
Cloud-Burst-Prediction/
│
├── backend/                    # Flask Backend + ML Model
│   ├── app.py                  # Main Flask application
│   ├── config.py               # Configuration settings
│   ├── requirements.txt        # Python dependencies
│   ├── models/
│   │   ├── train_model.py      # ML model training script
│   │   ├── cloudburst_model.pkl # Saved trained model
│   │   └── scaler.pkl          # Saved feature scaler
│   ├── data/
│   │   ├── weather_data.csv    # Training dataset
│   │   └── generate_data.py   # Script to generate synthetic training data
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── prediction.py       # Prediction API routes
│   │   ├── history.py          # Historical data routes
│   │   └── risk.py             # Risk analysis routes
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── preprocessing.py    # Data preprocessing utilities
│   │   └── risk_calculator.py  # Risk score calculation
│   └── tests/
│       └── test_api.py         # API tests
│
├── frontend/                   # React Frontend
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Navigation bar
│   │   │   ├── PredictionForm.jsx  # Weather input form
│   │   │   ├── ResultCard.jsx      # Prediction result display
│   │   │   ├── RiskGauge.jsx       # Risk level gauge/meter
│   │   │   ├── WeatherMap.jsx      # Interactive map (Leaflet)
│   │   │   ├── HistoryChart.jsx    # Historical data charts
│   │   │   ├── Dashboard.jsx       # Main dashboard
│   │   │   └── Footer.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Predict.jsx
│   │   │   ├── RiskAnalysis.jsx
│   │   │   ├── History.jsx
│   │   │   └── About.jsx
│   │   ├── services/
│   │   │   └── api.js              # Axios API service
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   └── assets/
│   │       └── images/
│   └── tailwind.config.js
│
├── docker-compose.yml          # Docker compose for full app
├── Dockerfile.backend
├── Dockerfile.frontend
├── .env.example
└── README.md
```

---

## 🧠 Machine Learning Model Details

### Input Features (Weather Parameters)
| Feature | Description | Unit | Range |
|---------|-------------|------|-------|
| temperature | Surface Temperature | °C | -10 to 50 |
| humidity | Relative Humidity | % | 0 to 100 |
| pressure | Atmospheric Pressure | hPa | 950 to 1050 |
| rainfall | Rainfall in last 24hrs | mm | 0 to 500 |
| wind_speed | Wind Speed | km/h | 0 to 200 |
| cloud_cover | Cloud Cover Percentage | % | 0 to 100 |
| dew_point | Dew Point Temperature | °C | -20 to 35 |
| elevation | Location Elevation | meters | 0 to 5000 |
| latitude | Latitude of location | degrees | -90 to 90 |
| longitude | Longitude of location | degrees | -180 to 180 |
| month | Month of the year | 1-12 | 1 to 12 |
| hour | Hour of the day | 0-23 | 0 to 23 |

### Output
- **cloudburst_prediction**: 0 (No) or 1 (Yes)
- **cloudburst_probability**: 0.0 to 1.0
- **risk_level**: "Low", "Medium", "High", "Critical"
- **risk_score**: 0 to 100

### Model Pipeline
1. **Data Preprocessing**: StandardScaler for normalization
2. **Model**: Ensemble of RandomForest + XGBoost + Gradient Boosting
3. **Evaluation Metrics**: Accuracy, Precision, Recall, F1-Score, AUC-ROC

---

## 🔧 Backend (Flask) - Detailed Implementation

### `backend/requirements.txt`
```
flask==3.0.0
flask-cors==4.0.0
flask-restful==0.3.10
scikit-learn==1.4.0
xgboost==2.0.3
pandas==2.2.0
numpy==1.26.3
joblib==1.3.2
python-dotenv==1.0.0
gunicorn==21.2.0
requests==2.31.0
matplotlib==3.8.2
seaborn==0.13.1
```

### `backend/data/generate_data.py`
Generate synthetic cloudburst training data with realistic weather patterns:
- Normal weather conditions (cloudburst = 0): ~85% of data
- Cloudburst conditions (cloudburst = 1): ~15% of data
- Cloudburst conditions: very high humidity (>85%), heavy rainfall (>100mm), high cloud cover (>80%), low pressure (<1000 hPa), high elevation (>1500m)
- Generate at least 10,000 samples
- Save as `weather_data.csv`

### `backend/models/train_model.py`
- Load `weather_data.csv`
- Split into train/test (80/20)
- Apply StandardScaler, save as `scaler.pkl`
- Train 3 models: RandomForest, XGBoost, GradientBoosting
- Create VotingClassifier (soft voting)
- Evaluate on test set, print classification report
- Save model as `cloudburst_model.pkl`
- Save scaler as `scaler.pkl`

### `backend/app.py` - Flask API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict` | Takes weather parameters, returns prediction |
| GET | `/api/health` | Health check |
| POST | `/api/risk-analysis` | Returns detailed risk analysis with score |
| GET | `/api/model-info` | Returns model accuracy and info |
| GET | `/api/history` | Returns past predictions (stored in memory/SQLite) |
| POST | `/api/batch-predict` | Batch prediction from CSV upload |

### API Request/Response Examples

**POST `/api/predict`**
```json
// Request
{
  "temperature": 25.5,
  "humidity": 92.3,
  "pressure": 985.2,
  "rainfall": 150.0,
  "wind_speed": 45.0,
  "cloud_cover": 95.0,
  "dew_point": 23.1,
  "elevation": 2500,
  "latitude": 30.7333,
  "longitude": 79.0667,
  "month": 7,
  "hour": 14
}

// Response
{
  "success": true,
  "prediction": {
    "cloudburst": true,
    "probability": 0.87,
    "risk_level": "Critical",
    "risk_score": 92,
    "confidence": "High",
    "advisory": "Extremely high risk of cloudburst. Evacuate low-lying areas immediately.",
    "factors": [
      "Very high humidity (92.3%)",
      "Heavy recent rainfall (150mm)",
      "Low atmospheric pressure (985.2 hPa)",
      "High elevation terrain (2500m)"
    ]
  }
}
```

### `backend/utils/risk_calculator.py`
Risk score formula based on:
- Probability weight: 40%
- Humidity factor: 15%
- Rainfall factor: 20%
- Pressure factor: 10%
- Elevation factor: 10%
- Cloud cover factor: 5%

Risk Levels:
- 0-25: "Low" (Green)
- 26-50: "Medium" (Yellow)
- 51-75: "High" (Orange)
- 76-100: "Critical" (Red)

---

## 🌐 Frontend (React) - Detailed Implementation

### Tech Stack
- React 18+
- Tailwind CSS for styling
- React Router DOM for navigation
- Axios for API calls
- Recharts for charts/graphs
- React-Leaflet for interactive maps
- React-Gauge-Chart for risk gauge
- React-Toastify for notifications
- Framer Motion for animations

### `frontend/package.json` dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.5",
    "recharts": "^2.10.3",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "react-gauge-chart": "^0.5.1",
    "react-toastify": "^10.0.4",
    "framer-motion": "^11.0.3",
    "react-icons": "^5.0.1",
    "tailwindcss": "^3.4.1"
  }
}
```

### Pages & Components Detail

#### 1. **Home Page (`pages/Home.jsx`)**
- Hero section with animated cloud/rain background
- Statistics cards (total predictions made, accuracy, etc.)
- "Try Prediction" CTA button
- Brief explanation of how it works (3-step process)
- Recent news/alerts section

#### 2. **Predict Page (`pages/Predict.jsx`)**
- Uses `PredictionForm` component
- Form with all 12 weather input fields
- Input validation (min/max ranges)
- "Use My Location" button (uses browser Geolocation API to auto-fill lat/long)
- "Fill Sample Data" button for demo
- Submit button → calls `/api/predict`
- Shows `ResultCard` with prediction result
- Shows `RiskGauge` with risk score
- Shows contributing factors as tags/badges
- Shows advisory message with appropriate color

#### 3. **Risk Analysis Page (`pages/RiskAnalysis.jsx`)**
- Interactive map (React-Leaflet) showing Indian geography
- Click on map → auto-fill lat/long → get prediction for that area
- Color-coded markers for risk levels
- Heatmap overlay (optional)
- Risk breakdown chart (pie chart / bar chart)

#### 4. **History Page (`pages/History.jsx`)**
- Table showing past predictions
- Line chart showing prediction trends over time
- Filter by date range, risk level
- Export as CSV button

#### 5. **About Page (`pages/About.jsx`)**
- Project description (from IEEE paper context)
- Team members
- Technology stack used
- How the ML model works (simplified explanation)
- Model performance metrics (accuracy, precision, recall) with charts

### Component Details

#### `PredictionForm.jsx`
```
- 12 input fields organized in a responsive grid (3 columns on desktop, 1 on mobile)
- Each field has: label, input, unit indicator, validation
- Two buttons: "Predict" (primary) and "Reset" (secondary)
- Loading spinner while API call is in progress
- Error handling with toast notifications
```

#### `ResultCard.jsx`
```
- Card with gradient border based on risk level
- Large icon: ✅ (safe) or ⚠️ (danger) or 🔴 (critical)
- Prediction: "Cloudburst Likely" or "No Cloudburst Expected"
- Probability percentage with progress bar
- Risk level badge with color
- Advisory message
- Contributing factors as small cards/tags
- "Share Result" and "Download Report" buttons
```

#### `RiskGauge.jsx`
```
- Semicircle gauge meter (0-100)
- Color gradient: Green → Yellow → Orange → Red
- Animated needle pointing to risk score
- Risk level label below
```

#### `WeatherMap.jsx`
```
- Leaflet map centered on India (lat: 20.5937, lng: 78.9629, zoom: 5)
- On click: get lat/long, reverse geocode for location name
- Markers with popup showing location name + risk level
- Custom marker icons based on risk level
- Layer control for satellite/terrain view
```

#### `HistoryChart.jsx`
```
- Line chart (Recharts) showing predictions over time
- Bar chart showing risk level distribution
- Donut chart showing cloudburst vs no-cloudburst ratio
```

---

## 🎨 UI Design Guidelines

### Color Palette
```
Primary: #1E40AF (Blue)
Secondary: #7C3AED (Purple)
Success/Low Risk: #10B981 (Green)
Warning/Medium Risk: #F59E0B (Yellow)
Danger/High Risk: #F97316 (Orange)
Critical: #EF4444 (Red)
Background: #0F172A (Dark) or #F8FAFC (Light)
Card Background: #1E293B (Dark) or #FFFFFF (Light)
Text: #F1F5F9 (Dark mode) or #1E293B (Light mode)
```

### Design Style
- Modern, clean, dashboard-style UI
- Dark mode by default with light mode toggle
- Glassmorphism cards (backdrop blur + transparency)
- Smooth animations on page transitions and data loading
- Responsive design (mobile-first)
- Consistent spacing (Tailwind's spacing scale)

---

## 🐳 Docker Setup

### `docker-compose.yml`
```yaml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    volumes:
      - ./backend:/app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:5000
```

---

## 🚀 How to Run Locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Generate training data
python data/generate_data.py

# Train the model
python models/train_model.py

# Run the server
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### With Docker
```bash
docker-compose up --build
```

---


## 📊 Expected Model Performance
- Accuracy: ~90-95% (on synthetic data)
- Precision: ~88-92%
- Recall: ~85-90%
- F1-Score: ~87-91%
- AUC-ROC: ~0.93-0.97

---

## 🔗 API Integration (Optional - Live Weather)
You can optionally integrate OpenWeatherMap API for real-time weather data:
- API: `https://api.openweathermap.org/data/2.5/weather`
- Get free API key from: https://openweathermap.org/api
- Auto-fill form fields with live weather data for selected location

---

## 📄 IEEE Paper Reference
This project is based on the research paper: **"Cloud Burst Prediction and Risk Analysis"** (IEEE Conference Paper attached as `IEEE_Conference.pdf`).

The paper covers:
- Meteorological factors contributing to cloudbursts
- ML-based prediction methodology
- Risk assessment framework
- Case studies from Indian Himalayan region

---

## 👨‍💻 Author
- **Harsh Pandey** (@HarshPandey111)
- Project: Cloud Burst Prediction & Risk Analysis
- Date: March 2026

---

## 📜 License
MIT License - Feel free to use and modify.
