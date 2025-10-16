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
        
        # Prepare features and labels
        X = self.prepare_features(df)
        y = df['label']
        
        # Train on full dataset
        X_vec = self.vectorizer.fit_transform(X)
        self.classifier.fit(X_vec, y)
        
        # Perform cross-validation to estimate accuracy
        cv_scores = cross_val_score(self.classifier, X_vec, y, cv=3)
        
        # Print only accuracy metrics
        print(f"Mean Accuracy: {cv_scores.mean() * 100:.2f}%")
        print(f"Standard Deviation: {cv_scores.std() * 100:.2f}%")
        
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
    
    def load_model(self, model_dir='models'):
        """Load trained model and vectorizer"""
        self.classifier = joblib.load(f'{model_dir}/naive_bayes_model.pkl')
        self.vectorizer = joblib.load(f'{model_dir}/vectorizer.pkl')


def main():
    """Main training script"""
    # Initialize classifier
    classifier = TravelClassifier()
    
    # Train model
    csv_path = 'data/training-data.csv'
    accuracy = classifier.train(csv_path)
    
    # Save model
    classifier.save_model()


if __name__ == '__main__':
    main()
