import pandas as pd
import numpy as np
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

class TravelClassifier:
    def __init__(self):
        self.vectorizer = CountVectorizer()
        self.classifier = MultinomialNB()
        
    def prepare_features(self, df):
        """Combine all question answers into a single text feature"""
        features = df.apply(
            lambda row: f"{row['q1_activity']} {row['q2_destination']} "
                       f"{row['q3_pace']} {row['q4_accommodation']} "
                       f"{row['q5_souvenir']} {row['q6_evening']} "
                       f"{row['q7_motivation']}", 
            axis=1
        )
        return features
    
    def train(self, csv_path):
        """Train the Naive Bayes model"""
        # Load data
        df = pd.read_csv(csv_path)
        print(f"Loaded {len(df)} training samples")
        print(f"Classes: {df['label'].unique()}")
        
        # Check class distribution
        print(f"\nClass distribution:")
        print(df['label'].value_counts())
        
        # Prepare features and labels
        X = self.prepare_features(df)
        y = df['label']
        
        # For small datasets, we have two options:
        
        # Option 1: Train on ALL data (recommended for very small datasets)
        print(f"\n📊 Training on full dataset (51 samples)...")
        X_vec = self.vectorizer.fit_transform(X)
        self.classifier.fit(X_vec, y)
        
        # Use cross-validation to estimate accuracy
        print(f"\n🔄 Performing 3-fold cross-validation...")
        cv_scores = cross_val_score(self.classifier, X_vec, y, cv=3)
        print(f"Cross-validation scores: {cv_scores}")
        print(f"Mean CV Accuracy: {cv_scores.mean() * 100:.2f}%")
        print(f"Std CV Accuracy: {cv_scores.std() * 100:.2f}%")
        
        # Option 2: Simple train-test split WITHOUT stratification
        # Uncomment below if you prefer train-test split
        """
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42  # Removed stratify parameter
        )
        
        X_train_vec = self.vectorizer.fit_transform(X_train)
        X_test_vec = self.vectorizer.transform(X_test)
        
        self.classifier.fit(X_train_vec, y_train)
        
        y_pred = self.classifier.predict(X_test_vec)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\n✅ Model trained successfully!")
        print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")
        print(f"Accuracy: {accuracy * 100:.2f}%")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        return accuracy
        """
        
        print(f"\n✅ Model trained successfully on full dataset!")
        return cv_scores.mean()
    
    def predict(self, answers):
        """Predict traveler type from answers"""
        # Combine answers into single text
        text = f"{answers['q1_activity']} {answers['q2_destination']} " \
               f"{answers['q3_pace']} {answers['q4_accommodation']} " \
               f"{answers['q5_souvenir']} {answers['q6_evening']} " \
               f"{answers['q7_motivation']}"
        
        # Vectorize and predict
        features = self.vectorizer.transform([text])
        prediction = self.classifier.predict(features)[0]
        probabilities = self.classifier.predict_proba(features)[0]
        
        # Get confidence (probability of predicted class)
        confidence = float(max(probabilities))
        
        return prediction, confidence
    
    def save_model(self, model_dir='models'):
        """Save trained model and vectorizer"""
        os.makedirs(model_dir, exist_ok=True)
        joblib.dump(self.classifier, f'{model_dir}/naive_bayes_model.pkl')
        joblib.dump(self.vectorizer, f'{model_dir}/vectorizer.pkl')
        print(f"✅ Model saved to {model_dir}/")
    
    def load_model(self, model_dir='models'):
        """Load trained model and vectorizer"""
        self.classifier = joblib.load(f'{model_dir}/naive_bayes_model.pkl')
        self.vectorizer = joblib.load(f'{model_dir}/vectorizer.pkl')
        print("✅ Model loaded successfully")

def main():
    """Main training script"""
    print("=" * 60)
    print("Training Travel Personality Classifier")
    print("=" * 60)
    
    # Initialize classifier
    classifier = TravelClassifier()
    
    # Train model
    csv_path = 'data/training-data.csv'
    accuracy = classifier.train(csv_path)
    
    # Save model
    classifier.save_model()
    
    # Test prediction
    print("\n" + "=" * 60)
    print("Testing Model with Sample Predictions")
    print("=" * 60)
    
    test_cases = [
        {
            'name': 'Adventure Seeker',
            'answers': {
                'q1_activity': 'Hiking or adventure sports',
                'q2_destination': 'Mountains',
                'q3_pace': 'Always on the move and adventurous',
                'q4_accommodation': 'Budget hostels',
                'q5_souvenir': 'Photos of nature & adventure',
                'q6_evening': 'Campfire or trek',
                'q7_motivation': 'Adventure & thrill'
            }
        },
        {
            'name': 'Foodie',
            'answers': {
                'q1_activity': 'Exploring local cuisine',
                'q2_destination': 'Cities',
                'q3_pace': 'Balanced with some activity',
                'q4_accommodation': 'Homestays / local inns',
                'q5_souvenir': 'Local snacks / food items',
                'q6_evening': 'Trying street food',
                'q7_motivation': 'Food discovery'
            }
        },
        {
            'name': 'Spiritual Traveler',
            'answers': {
                'q1_activity': 'Visiting temples / spiritual places',
                'q2_destination': 'Villages',
                'q3_pace': 'Balanced with some activity',
                'q4_accommodation': 'Homestays / local inns',
                'q5_souvenir': 'Handicrafts / art',
                'q6_evening': 'Exploring temples',
                'q7_motivation': 'Peace / spiritual connection'
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i} - Expected: {test_case['name']}")
        prediction, confidence = classifier.predict(test_case['answers'])
        print(f"Predicted: {prediction}")
        print(f"Confidence: {confidence * 100:.2f}%")
        print(f"✅ Correct!" if prediction == test_case['name'] else "❌ Incorrect")

if __name__ == '__main__':
    main()
