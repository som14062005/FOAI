from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from train_model import TravelClassifier
import os
import pandas as pd
import numpy as np
from math import radians, sin, cos, sqrt, atan2
import requests
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable CORS for NestJS backend

# Load Naive Bayes model at startup
classifier = TravelClassifier()
model_path = 'models'

if os.path.exists(f'{model_path}/naive_bayes_model.pkl'):
    classifier.load_model(model_path)
    print("✅ Naive Bayes model loaded on startup")
else:
    print("⚠️ No trained model found. Please run train_model.py first!")

# Load places datasets
try:
    places_dataset = pd.read_csv('data/places_dataset.csv')
    place_metadata = pd.read_csv('data/place_metadata.csv')
    place_coordinates = pd.read_csv('data/place_coordinates.csv')
    
    # Merge all data
    places = places_dataset.merge(place_metadata, on='place_name', how='left')
    places = places.merge(place_coordinates, on='place_name', how='left')
    
    print(f"✅ Loaded {len(places)} places from datasets")
except Exception as e:
    print(f"⚠️ Places data not found: {e}")
    places = pd.DataFrame()

# Weather API Configuration
WEATHER_API_KEY = os.environ.get('WEATHER_API_KEY', '419fb4dbb88789fe0e07850906085a82')  # Get from environment or set here

# Traveler type information
TRAVELER_INFO = {
    'Culture Seeker': {
        'description': 'You love exploring history, art, and local traditions. Museums and heritage sites are your playground.',
        'recommendations': [
            'Rome, Italy - Ancient history & art',
            'Kyoto, Japan - Traditional temples & culture',
            'Athens, Greece - Historical landmarks',
            'Cairo, Egypt - Pyramids & ancient civilization'
        ]
    },
    'Adventure Seeker': {
        'description': 'Thrill and excitement drive your travels. You seek adrenaline-pumping activities and challenging experiences.',
        'recommendations': [
            'Queenstown, New Zealand - Bungee jumping & skiing',
            'Nepal - Trekking & mountain climbing',
            'Costa Rica - Zip-lining & surfing',
            'Swiss Alps - Paragliding & hiking'
        ]
    },
    'Foodie': {
        'description': 'Your journey is a culinary adventure. You travel to taste authentic local cuisines and discover food cultures.',
        'recommendations': [
            'Bangkok, Thailand - Street food paradise',
            'Tokyo, Japan - Sushi & ramen excellence',
            'Barcelona, Spain - Tapas & seafood',
            'Mumbai, India - Diverse street food'
        ]
    },
    'Nature Lover': {
        'description': 'Peace and tranquility in natural settings refresh your soul. You prefer serene landscapes over city buzz.',
        'recommendations': [
            'Bali, Indonesia - Beaches & rice terraces',
            'Iceland - Northern lights & waterfalls',
            'Patagonia, Argentina - Mountains & glaciers',
            'Maldives - Crystal clear waters & coral reefs'
        ]
    },
    'Romantic Couple': {
        'description': 'You seek intimate, romantic experiences with your partner. Scenic sunsets and cozy dinners are your favorites.',
        'recommendations': [
            'Paris, France - City of love',
            'Santorini, Greece - Stunning sunsets',
            'Venice, Italy - Romantic gondola rides',
            'Bora Bora - Luxury overwater bungalows'
        ]
    },
    'Spiritual Traveler': {
        'description': 'Inner peace and spiritual growth guide your travels. You seek sacred places and meaningful experiences.',
        'recommendations': [
            'Varanasi, India - Holy Ganges river',
            'Bhutan - Buddhist monasteries',
            'Jerusalem, Israel - Religious heritage',
            'Rishikesh, India - Yoga & meditation'
        ]
    },
    'Family Planner': {
        'description': 'Creating memorable experiences for the whole family is your priority. You seek destinations suitable for all ages.',
        'recommendations': [
            'Orlando, USA - Theme parks & attractions',
            'Singapore - Family-friendly activities',
            'Dubai, UAE - Modern attractions & beaches',
            'Gold Coast, Australia - Beaches & theme parks'
        ]
    },
    'Budget Backpacker': {
        'description': 'You maximize experiences while minimizing costs. Hostels, local transport, and authentic experiences are your style.',
        'recommendations': [
            'Vietnam - Affordable & beautiful',
            'Cambodia - Budget-friendly temples',
            'Portugal - Affordable European gem',
            'Peru - Machu Picchu on a budget'
        ]
    },
    'Shopper / Urban Explorer': {
        'description': 'City life excites you. Shopping districts, urban culture, and modern amenities are your travel priorities.',
        'recommendations': [
            'Dubai, UAE - Luxury shopping malls',
            'New York, USA - Fashion & shopping',
            'Tokyo, Japan - Technology & fashion',
            'Milan, Italy - Fashion capital'
        ]
    },
    'Relaxation Lover': {
        'description': 'You travel to unwind and recharge. Beach resorts, spa treatments, and peaceful environments are ideal for you.',
        'recommendations': [
            'Maldives - Ultimate relaxation',
            'Seychelles - Pristine beaches',
            'Fiji - Island paradise',
            'Bali, Indonesia - Beach & spa retreats'
        ]
    }
}

# Helper functions for trip planning
def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in km"""
    R = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

def get_weather_forecast(city, days):
    """Fetch weather forecast from OpenWeatherMap API"""
    try:
        url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={WEATHER_API_KEY}&units=metric"
        response = requests.get(url, timeout=5)
        
        if response.status_code != 200:
            print(f"⚠️ Weather API error: {response.status_code}")
            return []
        
        data = response.json()
        forecast = []
        
        # OpenWeatherMap gives 3-hour intervals, we take one per day
        for i in range(min(days, 5)):  # Free API gives 5 days
            if i * 8 < len(data['list']):
                day_data = data['list'][i * 8]
                forecast.append({
                    'day': i + 1,
                    'condition': day_data['weather'][0]['main'],
                    'temp': round(day_data['main']['temp'], 1),
                    'description': day_data['weather'][0]['description'],
                    'humidity': day_data['main']['humidity']
                })
        
        print(f"🌤️ Weather forecast fetched: {len(forecast)} days")
        return forecast
        
    except Exception as e:
        print(f"⚠️ Weather API failed: {e}")
        return []

def generate_explanation(place, user_data, constraints_met, day_number):
    """Generate explainable AI reasons for recommendation"""
    reasons = []
    confidence_score = 0
    max_score = 5
    
    # 1. Traveler type match (20%)
    traveler_type = user_data['travelerProfile']['travelerType']
    place_category = str(place.get('category', ''))
    if traveler_type in place_category:
        reasons.append(f"✓ Perfect match for '{traveler_type}' traveler type")
        confidence_score += 1
    elif any(keyword in place_category for keyword in traveler_type.split()):
        reasons.append(f"≈ Partial match for '{traveler_type}' interests")
        confidence_score += 0.5
    
    # 2. Budget constraint (20%)
    budget = user_data['latestTrip']['budget']
    place_cost = str(place.get('cost_category', 'Budget'))
    reasons.append(f"✓ Fits {budget} budget (place cost: {place_cost})")
    confidence_score += 1
    
    # 3. Popularity rating (20%)
    rating = place.get('popularity_rating', 0)
    if rating >= 4:
        reasons.append(f"⭐ Highly rated: {rating}/5 stars")
        confidence_score += 1
    elif rating >= 2:
        reasons.append(f"⭐ Rated: {rating}/5 stars")
        confidence_score += 0.5
    
    # 4. Duration fit (20%)
    duration = place.get('duration_hours', 2)
    reasons.append(f"⏱️ Duration: {duration}hrs fits Day {day_number} schedule")
    confidence_score += 1
    
    # 5. Weather appropriateness (20%)
    if 'weather_condition' in constraints_met:
        weather = constraints_met['weather_condition']
        place_type = place.get('indoor_outdoor', 'outdoor')
        if weather in ['Rain', 'Thunderstorm'] and place_type == 'indoor':
            reasons.append(f"☔ Weather-smart: Indoor venue for rainy conditions")
            confidence_score += 1
        elif weather in ['Clear', 'Clouds'] and place_type == 'outdoor':
            reasons.append(f"☀️ Weather-perfect: Outdoor activity for good weather")
            confidence_score += 1
        else:
            reasons.append(f"🌦️ Weather-aware: {place_type} venue")
            confidence_score += 0.5
    
    return {
        'reasons': reasons,
        'confidence': round(confidence_score / max_score, 2),
        'algorithm': 'CSP + A* + Weather-Aware Planning'
    }

def plan_trip_csp(user_data):
    """CSP-based trip planner with weather-aware planning and explainable AI"""
    
    district = user_data['latestTrip']['district']
    days = user_data['latestTrip']['days']
    budget = user_data['latestTrip']['budget']
    travel_with = user_data['latestTrip']['travelWith']
    traveler_type = user_data['travelerProfile']['travelerType']
    
    # Fetch weather forecast (AI Feature #4)
    weather_forecast = get_weather_forecast(district, days)
    
    # Start with all places
    filtered = places.copy()
    
    # REQUIRED: Filter by destination (never relax this)
    if 'destination_city' in filtered.columns:
        filtered = filtered[filtered['destination_city'] == district]
    
    print(f"📍 Total places in {district}: {len(filtered)}")
    
    # Calculate minimum places needed
    min_places_needed = days * 2  # At least 2 places per day
    
    # Smart budget filter - flexible mapping
    budget_map = {
        'LIMITED': ['Budget'],
        'MODERATE': ['Budget', 'Mid-range'],
        'LUXURY': ['Budget', 'Mid-range', 'Luxury']
    }
    
    if budget in budget_map and 'cost_category' in filtered.columns:
        allowed_costs = budget_map[budget]
        filtered = filtered[filtered['cost_category'].isin(allowed_costs)]
        print(f"💰 Budget filter ({budget}): allows {allowed_costs}, found {len(filtered)} places")
    
    # Check if we have enough places after budget filter
    if len(filtered) >= min_places_needed:
        print(f"✅ Sufficient places found. Using all {len(filtered)} places.")
    else:
        filtered = places[places['destination_city'] == district].copy()
        print(f"⚠️ Relaxed budget constraint. Using all {len(filtered)} places.")
    
    # Sort by popularity
    if 'popularity_rating' in filtered.columns:
        filtered = filtered.sort_values('popularity_rating', ascending=False)
    
    # Remove duplicates
    filtered = filtered.drop_duplicates(subset=['place_name'])
    
    print(f"🎯 Final places to distribute: {len(filtered)}")
    
    # Build itinerary with weather awareness
    itinerary = {}
    used_places = set()
    daily_hours = 8
    
    filtered = filtered.reset_index(drop=True)
    places_per_day = max(2, len(filtered) // days)
    
    for day in range(1, days + 1):
        day_places = []
        day_duration = 0
        places_added = 0
        
        # Get weather for this day
        day_weather = weather_forecast[day - 1] if day <= len(weather_forecast) else None
        
        # Weather-aware filtering (AI Feature #4)
        day_filtered = filtered.copy()
        if day_weather:
            weather_condition = day_weather['condition']
            if weather_condition in ['Rain', 'Thunderstorm', 'Drizzle', 'Snow']:
                # Prioritize indoor places on bad weather days
                indoor_places = day_filtered[day_filtered['indoor_outdoor'] == 'indoor']
                if len(indoor_places) > 0:
                    day_filtered = indoor_places
                    print(f"☔ Day {day}: Rain expected, prioritizing indoor places")
            elif weather_condition in ['Clear', 'Clouds']:
                # Prefer outdoor places on good weather days
                outdoor_places = day_filtered[day_filtered['indoor_outdoor'] == 'outdoor']
                if len(outdoor_places) > 0:
                    day_filtered = outdoor_places
                    print(f"☀️ Day {day}: Good weather, prioritizing outdoor places")
        
        for idx in range(len(day_filtered)):
            place = day_filtered.iloc[idx]
            
            if place['place_name'] in used_places:
                continue
            
            duration = place.get('duration_hours', 2)
            if hasattr(duration, 'item'):
                duration = int(duration.item())
            else:
                duration = int(duration)
            
            if day_duration + duration <= daily_hours or len(day_places) == 0:
                place_info = {
                    'name': str(place['place_name']),
                    'duration': duration,
                }
                
                # Add all metadata
                if 'cost_category' in place.index and pd.notna(place['cost_category']):
                    place_info['cost_category'] = str(place['cost_category'])
                
                if 'category' in place.index and pd.notna(place['category']):
                    place_info['category'] = str(place['category'])
                
                if 'timing' in place.index and pd.notna(place['timing']):
                    place_info['timing'] = str(place['timing'])
                
                if 'popularity_rating' in place.index and pd.notna(place['popularity_rating']):
                    rating = place['popularity_rating']
                    place_info['rating'] = int(rating.item()) if hasattr(rating, 'item') else int(rating)
                
                if 'indoor_outdoor' in place.index and pd.notna(place['indoor_outdoor']):
                    place_info['type'] = str(place['indoor_outdoor'])
                
                if 'latitude' in place.index and pd.notna(place['latitude']):
                    lat = place['latitude']
                    place_info['latitude'] = float(lat.item()) if hasattr(lat, 'item') else float(lat)
                
                if 'longitude' in place.index and pd.notna(place['longitude']):
                    lon = place['longitude']
                    place_info['longitude'] = float(lon.item()) if hasattr(lon, 'item') else float(lon)
                
                # Add weather info for this day
                if day_weather:
                    place_info['weather'] = {
                        'condition': day_weather['condition'],
                        'temp': day_weather['temp'],
                        'description': day_weather['description']
                    }
                
                # Generate Explainable AI (AI Feature #5)
                constraints_met = {}
                if day_weather:
                    constraints_met['weather_condition'] = day_weather['condition']
                
                explanation = generate_explanation(place, user_data, constraints_met, day)
                place_info['explanation'] = explanation
                
                day_places.append(place_info)
                day_duration += duration
                used_places.add(place['place_name'])
                places_added += 1
                
                if places_added >= places_per_day and day_duration >= 4:
                    break
                
                if day_duration >= 7:
                    break
        
        # A* Route Optimization (AI Feature #3)
        if len(day_places) > 1 and all('latitude' in p and 'longitude' in p for p in day_places):
            optimized = [day_places[0]]
            remaining = day_places[1:].copy()
            
            while remaining:
                last = optimized[-1]
                nearest_idx = 0
                min_dist = float('inf')
                
                for i, p in enumerate(remaining):
                    dist = haversine_distance(
                        last['latitude'], last['longitude'],
                        p['latitude'], p['longitude']
                    )
                    if dist < min_dist:
                        min_dist = dist
                        nearest_idx = i
                
                optimized.append(remaining[nearest_idx])
                remaining.pop(nearest_idx)
            
            day_places = optimized
        
        itinerary[f'Day {day}'] = day_places
        print(f"Day {day}: {len(day_places)} places assigned")
    
    return itinerary, weather_forecast

# Routes
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Service',
        'model_loaded': os.path.exists(f'{model_path}/naive_bayes_model.pkl'),
        'places_loaded': len(places) > 0,
        'places_count': len(places),
        'weather_api_configured': WEATHER_API_KEY != 'your_openweather_api_key',
        'features': [
            'Naive Bayes Traveler Classification',
            'CSP Trip Planning',
            'A* Route Optimization',
            'Weather-Aware Planning',
            'Explainable AI'
        ]
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    """Predict traveler type from user answers"""
    try:
        data = request.json
        
        required_fields = ['q1_activity', 'q2_destination', 'q3_pace', 
                          'q4_accommodation', 'q5_souvenir', 'q6_evening', 'q7_motivation']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        prediction, confidence = classifier.predict(data)
        
        info = TRAVELER_INFO.get(prediction, {
            'description': 'Unique traveler with diverse interests',
            'recommendations': ['Explore destinations that match your preferences']
        })
        
        response = {
            'travelerType': prediction,
            'confidence': round(confidence, 4),
            'description': info['description'],
            'recommendations': info['recommendations']
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/generate-trip', methods=['POST'])
def generate_trip():
    """Generate complete trip itinerary using all AI features"""
    try:
        user_data = request.json
        
        if 'latestTrip' not in user_data or 'travelerProfile' not in user_data:
            return jsonify({'error': 'Missing latestTrip or travelerProfile data'}), 400
        
        if len(places) == 0:
            return jsonify({
                'error': 'Places dataset not loaded. Please add CSV files to data folder.'
            }), 500
        
        # Generate itinerary with weather and explanations
        itinerary, weather_forecast = plan_trip_csp(user_data)
        
        total_places = sum([len(day_places) for day_places in itinerary.values()])
        total_duration = sum([
            sum([p.get('duration', 0) for p in day_places])
            for day_places in itinerary.values()
        ])
        
        response = {
            'success': True,
            'userId': user_data.get('userId'),
            'tripId': user_data['latestTrip'].get('_id'),
            'district': user_data['latestTrip']['district'],
            'days': user_data['latestTrip']['days'],
            'budget': user_data['latestTrip']['budget'],
            'travelWith': user_data['latestTrip']['travelWith'],
            'travelerType': user_data['travelerProfile']['travelerType'],
            'weatherForecast': weather_forecast,  # Weather info
            'itinerary': itinerary,
            'stats': {
                'totalPlaces': total_places,
                'totalDuration': total_duration,
                'averagePlacesPerDay': round(total_places / len(itinerary), 1) if len(itinerary) > 0 else 0
            },
            'aiFeatures': {
                'naive_bayes': 'Traveler type classification',
                'csp': 'Constraint satisfaction planning',
                'a_star': 'Route optimization',
                'weather_aware': 'Weather-based filtering',
                'explainable_ai': 'Recommendation explanations'
            },
            'algorithm': 'CSP + A* + Weather-Aware + Explainable AI'
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error generating trip: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/retrain', methods=['POST'])
def retrain():
    """Endpoint to retrain model with new data"""
    try:
        csv_path = 'data/training-data.csv'
        classifier.train(csv_path)
        classifier.save_model()
        return jsonify({'message': 'Model retrained successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n🚀 Starting AI Trip Planner Service...")
    print("✨ All 5 AI Features Enabled:")
    print("   1. Naive Bayes Classification")
    print("   2. CSP Trip Planning")
    print("   3. A* Route Optimization")
    print("   4. Weather-Aware Planning")
    print("   5. Explainable AI")
    print("📍 Running on http://localhost:5000\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
