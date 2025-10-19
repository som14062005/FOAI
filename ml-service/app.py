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
CORS(app)


# Load Naive Bayes model at startup
classifier = TravelClassifier()
model_path = 'models'


if os.path.exists(f'{model_path}/naive_bayes_model.pkl'):
    classifier.load_model(model_path)
    print("✅ Naive Bayes model loaded on startup")
else:
    print("⚠ No trained model found. Please run train_model.py first!")


# Load places datasets
try:
    places_dataset = pd.read_csv('data/places_dataset.csv')
    place_metadata = pd.read_csv('data/place_metadata.csv')
    place_coordinates = pd.read_csv('data/place_coordinates.csv')
    
    # Keep category from places_dataset, add indoor_outdoor and popularity_rating from metadata
    metadata_cols = place_metadata[['place_name', 'indoor_outdoor', 'popularity_rating']].copy()
    
    # Merge datasets
    places = places_dataset.merge(metadata_cols, on='place_name', how='left')
    places = places.merge(place_coordinates[['place_name', 'latitude', 'longitude']], on='place_name', how='left')
    
    print(f"✅ Loaded {len(places)} places from datasets")
    print(f"✅ Columns: {places.columns.tolist()}")
    print(f"\n📊 Category sample:")
    print(places[['place_name', 'category']].head(10))
    print(f"\n📊 Category distribution:")
    print(places['category'].value_counts().head(20))
    
except Exception as e:
    print(f"⚠ Places data not found: {e}")
    import traceback
    traceback.print_exc()
    places = pd.DataFrame()


# Weather API Configuration
WEATHER_API_KEY = os.environ.get('WEATHER_API_KEY', '419fb4dbb88789fe0e07850906085a82')


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


# Helper functions
def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in km"""
    R = 6371
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
            print(f"⚠ Weather API error: {response.status_code}")
            return []
        
        data = response.json()
        forecast = []
        
        for i in range(min(days, 5)):
            if i * 8 < len(data['list']):
                day_data = data['list'][i * 8]
                forecast.append({
                    'day': i + 1,
                    'condition': day_data['weather'][0]['main'],
                    'temp': round(day_data['main']['temp'], 1),
                    'description': day_data['weather'][0]['description'],
                    'humidity': day_data['main']['humidity']
                })
        
        print(f"🌤 Weather forecast fetched: {len(forecast)} days")
        return forecast
        
    except Exception as e:
        print(f"⚠ Weather API failed: {e}")
        return []


def generate_explanation(place, user_data, constraints_met, day_number):
    """Generate explainable AI reasons for recommendation"""
    reasons = []
    confidence_score = 0
    max_score = 5
    
    traveler_type = user_data['travelerProfile']['travelerType']
    place_category = str(place.get('category', ''))
    
    if traveler_type in place_category:
        reasons.append(f"✓ Perfect match for '{traveler_type}' traveler type")
        confidence_score += 1
    elif any(keyword in place_category for keyword in traveler_type.split()):
        reasons.append(f"≈ Partial match for '{traveler_type}' interests")
        confidence_score += 0.5
    
    budget = user_data['latestTrip']['budget']
    place_cost = str(place.get('cost_category', 'Budget'))
    reasons.append(f"✓ Fits {budget} budget (place cost: {place_cost})")
    confidence_score += 1
    
    rating = place.get('popularity_rating', 0)
    if rating >= 4:
        reasons.append(f"⭐ Highly rated: {rating}/5 stars")
        confidence_score += 1
    elif rating >= 2:
        reasons.append(f"⭐ Rated: {rating}/5 stars")
        confidence_score += 0.5
    
    duration = place.get('duration_hours', 2)
    reasons.append(f"⏱ Duration: {duration}hrs fits Day {day_number} schedule")
    confidence_score += 1
    
    if 'weather_condition' in constraints_met:
        weather = constraints_met['weather_condition']
        place_type = place.get('indoor_outdoor', 'outdoor')
        if weather in ['Rain', 'Thunderstorm'] and place_type == 'indoor':
            reasons.append(f"☔ Weather-smart: Indoor venue for rainy conditions")
            confidence_score += 1
        elif weather in ['Clear', 'Clouds'] and place_type == 'outdoor':
            reasons.append(f"☀ Weather-perfect: Outdoor activity for good weather")
            confidence_score += 1
        else:
            reasons.append(f"🌦 Weather-aware: {place_type} venue")
            confidence_score += 0.5
    
    return {
        'reasons': reasons,
        'confidence': round(confidence_score / max_score, 2),
        'algorithm': 'CSP + A* + Weather-Aware Planning'
    }


def plan_trip_csp(user_data):
    """CSP-based trip planner with TRAVELER TYPE FILTERING"""
    
    district = user_data['latestTrip']['district']
    days = user_data['latestTrip']['days']
    budget = user_data['latestTrip']['budget']
    traveler_type = user_data['travelerProfile']['travelerType']
    
    weather_forecast = get_weather_forecast(district, days)
    
    # Filter by district
    filtered = places[places['destination_city'] == district].copy()
    print(f"\n{'='*80}")
    print(f"📍 STEP 1: Filter by District")
    print(f"{'='*80}")
    print(f"Total places in {district}: {len(filtered)}")
    
    # TRAVELER TYPE FILTERING
    print(f"\n{'='*80}")
    print(f"📍 STEP 2: Filter by Traveler Type")
    print(f"{'='*80}")
    print(f"Traveler Type: '{traveler_type}'")
    
    if 'category' in filtered.columns:
        category_mask = filtered['category'].apply(
            lambda x: traveler_type in str(x) if pd.notna(x) else False
        )
        
        type_matched = filtered[category_mask]
        
        print(f"Found {len(type_matched)} places with '{traveler_type}' in category")
        
        if len(type_matched) > 0:
            print(f"\nMatching places (showing first 10):")
            for idx, row in type_matched.head(10).iterrows():
                print(f"  ✓ {row['place_name']:<40} | {row['category']}")
        
        if len(type_matched) >= days * 2:
            filtered = type_matched
            print(f"\n✅ Using {len(filtered)} matching places")
        else:
            print(f"\n⚠ Only {len(type_matched)} places (need {days * 2} minimum)")
            if len(type_matched) > 0:
                filtered = type_matched
                print(f"⚠ Proceeding with all {len(filtered)} available places")
    
    # BUDGET FILTERING
    print(f"\n{'='*80}")
    print(f"📍 STEP 3: Budget Filtering (Optional)")
    print(f"{'='*80}")
    print(f"Budget: {budget}")
    
    budget_map = {
        'LIMITED': ['Budget'],
        'MODERATE': ['Budget', 'Mid-range'],
        'LUXURY': ['Budget', 'Mid-range', 'Premium']
    }
    
    if budget in budget_map and 'cost_category' in filtered.columns:
        allowed_costs = budget_map[budget]
        budget_filtered = filtered[filtered['cost_category'].isin(allowed_costs)]
        
        print(f"Allowed costs: {allowed_costs}")
        print(f"Places matching budget: {len(budget_filtered)}")
        
        if len(budget_filtered) >= days * 2:
            filtered = budget_filtered
            print(f"✅ Applied budget filter: {len(filtered)} places")
        else:
            print(f"⚠ Budget filter too strict, keeping all {len(filtered)} places")
    
    # Sort by rating
    if 'popularity_rating' in filtered.columns:
        filtered = filtered.sort_values('popularity_rating', ascending=False)
    
    # Remove duplicates
    filtered = filtered.drop_duplicates(subset=['place_name']).reset_index(drop=True)
    
    print(f"\n{'='*80}")
    print(f"📍 FINAL POOL: {len(filtered)} places ready for itinerary")
    print(f"{'='*80}")
    
    if len(filtered) < days * 2:
        print(f"⚠ WARNING: Only {len(filtered)} places for {days} days ({days * 2} needed)")
    
    if len(filtered) > 0:
        print(f"\nFinal places (top 15):")
        for idx, row in filtered.head(15).iterrows():
            print(f"  ✓ {row['place_name']:<40} | Rating: {row.get('popularity_rating', 'N/A')} | {row.get('indoor_outdoor', 'N/A')}")
    
    # BUILD DAILY ITINERARY
    print(f"\n{'='*80}")
    print(f"📍 BUILDING {days}-DAY ITINERARY")
    print(f"{'='*80}\n")
    
    itinerary = {}
    used_places = set()
    daily_hours = 8
    places_per_day = max(2, len(filtered) // days) if len(filtered) >= days else 1
    
    for day in range(1, days + 1):
        print(f"🔍 Processing Day {day} of {days}...")
        
        day_places = []
        day_duration = 0
        
        day_weather = weather_forecast[day - 1] if day <= len(weather_forecast) else None
        
        # Weather-aware filtering
        day_filtered = filtered.copy()
        if day_weather:
            weather_condition = day_weather.get('condition', '')
            if weather_condition in ['Rain', 'Thunderstorm', 'Drizzle']:
                indoor = day_filtered[day_filtered['indoor_outdoor'].isin(['indoor', 'both'])]
                if len(indoor) > 0:
                    day_filtered = indoor
                    print(f"☔ Day {day}: Rain - using {len(indoor)} indoor/covered places")
                else:
                    print(f"☔ Day {day}: Rain - no indoor places, using all {len(day_filtered)}")
            elif weather_condition in ['Clear', 'Clouds']:
                outdoor = day_filtered[day_filtered['indoor_outdoor'].isin(['outdoor', 'both'])]
                if len(outdoor) > 0:
                    day_filtered = outdoor
                    print(f"☀ Day {day}: {weather_condition} - using {len(outdoor)} outdoor/flexible places")
                else:
                    print(f"☀ Day {day}: {weather_condition} - no outdoor places, using all {len(day_filtered)}")
        
        # Select places for this day
        for idx in range(len(day_filtered)):
            place = day_filtered.iloc[idx]
            
            if place['place_name'] in used_places:
                continue
            
            duration = int(place.get('duration_hours', 2))
            
            # Limit food places
            is_food = 'Foodie' in str(place.get('category', ''))
            food_count = sum(1 for p in day_places if 'Foodie' in str(p.get('category', '')))
            
            max_food = 2 if traveler_type == 'Foodie' else 1
            if is_food and food_count >= max_food:
                continue
            
            # Add place if it fits
            if day_duration + duration <= daily_hours or len(day_places) == 0:
                place_info = {
                    'name': str(place['place_name']),
                    'duration': duration,
                    'category': str(place.get('category', '')),
                    'cost_category': str(place.get('cost_category', '')),
                    'rating': int(place.get('popularity_rating', 0)),
                    'type': str(place.get('indoor_outdoor', '')),
                    'latitude': float(place.get('latitude', 0)),
                    'longitude': float(place.get('longitude', 0)),
                    'timing': str(place.get('timing', ''))
                }
                
                if day_weather:
                    place_info['weather'] = {
                        'condition': day_weather['condition'],
                        'temp': day_weather['temp'],
                        'description': day_weather['description']
                    }
                
                constraints_met = {'weather_condition': day_weather['condition']} if day_weather else {}
                place_info['explanation'] = generate_explanation(place, user_data, constraints_met, day)
                
                day_places.append(place_info)
                day_duration += duration
                used_places.add(place['place_name'])
                
                if len(day_places) >= places_per_day and day_duration >= 4:
                    break
        
        # A* Route Optimization
        if len(day_places) > 1 and all('latitude' in p for p in day_places):
            print(f"🔄 Day {day}: Optimizing route for {len(day_places)} places using A*...")
            optimized = [day_places[0]]
            remaining = day_places[1:]
            
            while remaining:
                last = optimized[-1]
                nearest_idx = min(range(len(remaining)), 
                                key=lambda i: haversine_distance(
                                    last['latitude'], last['longitude'],
                                    remaining[i]['latitude'], remaining[i]['longitude']
                                ))
                optimized.append(remaining.pop(nearest_idx))
            
            day_places = optimized
        
        # Always add day to itinerary
        itinerary[f'Day {day}'] = day_places
        
        print(f"✅ Day {day}: {len(day_places)} places, {day_duration}hrs total")
        if len(day_places) > 0:
            for p in day_places:
                print(f"     - {p['name']} ({p['duration']}hrs)")
        else:
            print(f"⚠ Day {day}: No places added!")
    
    print(f"\n{'='*80}\n")
    return itinerary, weather_forecast


# ROUTES
@app.route('/health', methods=['GET'])
def health():
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
    try:
        user_data = request.json
        
        if 'latestTrip' not in user_data or 'travelerProfile' not in user_data:
            return jsonify({'error': 'Missing latestTrip or travelerProfile data'}), 400
        
        if len(places) == 0:
            return jsonify({'error': 'Places dataset not loaded'}), 500
        
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
            'weatherForecast': weather_forecast,
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
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/retrain', methods=['POST'])
def retrain():
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
