from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import time
import json
import os

app = Flask(__name__)
CORS(app)

# Initialize global variables for model and preprocessing components
model = None
scaler = None
label_encoders = {}
attack_type_mapping = {}  # Added for storing human-readable attack names

def preprocess_data(data):
    global scaler, label_encoders, attack_type_mapping
    
    X = data.iloc[:, :-1]  # Features
    y = data.iloc[:, -1]   # Target

    # Initialize preprocessing components if not already done
    if scaler is None:
        scaler = StandardScaler()
        
    # Handle categorical features
    for column in X.columns:
        if X[column].dtype == 'object':
            if column not in label_encoders:
                label_encoders[column] = LabelEncoder()
            X[column] = label_encoders[column].fit_transform(X[column])

    # Encode target labels
    if 'target' not in label_encoders:
        label_encoders['target'] = LabelEncoder()
    
    # Store original class labels before encoding
    unique_classes = y.unique()
    y = label_encoders['target'].fit_transform(y)
    
    # Create a mapping from encoded numbers to original attack types
    attack_type_mapping = {
        idx: class_name for idx, class_name in zip(label_encoders['target'].transform(unique_classes), unique_classes)
    }

    # Normalize features
    X = scaler.fit_transform(X)

    return X, y

@app.route('/upload', methods=['POST'])
def upload_dataset():
    global model, attack_type_mapping
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Save the uploaded file temporarily
        temp_path = 'temp_dataset.csv'
        file.save(temp_path)
        
        # Load and preprocess the dataset
        data = pd.read_csv(temp_path)
        X, y = preprocess_data(data)
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
        
        # Train the model using XGBoost
        start_time = time.time()
        model = XGBClassifier(random_state=42)
        model.fit(X_train, y_train)
        training_time = time.time() - start_time
        
        # Evaluate the model
        start_time = time.time()
        y_pred = model.predict(X_test)
        detection_time = time.time() - start_time
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        class_report = classification_report(y_test, y_pred, output_dict=True)
        conf_matrix = confusion_matrix(y_test, y_pred).tolist()
        
        # Replace numeric indices with attack type names in classification report
        renamed_report = {}
        for key, value in class_report.items():
            if key.isdigit() or (isinstance(key, (int, float)) and key.is_integer()):
                # If the key is a numeric class, replace with attack type name
                original_key = attack_type_mapping.get(int(key), f"Class {key}")
                renamed_report[original_key] = value
            else:
                # Keep non-class keys like 'accuracy', 'macro avg', etc.
                renamed_report[key] = value
        
        # Clean up
        os.remove(temp_path)
        
        # Also include attack type mapping for confusion matrix labeling
        attack_labels = {str(k): v for k, v in attack_type_mapping.items()}
        
        return jsonify({
            'message': 'Model trained successfully',
            'accuracy': accuracy,
            'training_time': training_time,
            'detection_time': detection_time,
            'classification_report': renamed_report,
            'confusion_matrix': conf_matrix,
            'attack_labels': attack_labels,
            'intrusion_detected': any(label != 'normal' for label in attack_type_mapping.values())
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not trained yet'}), 400
        
    try:
        # Get input data from request
        input_data = pd.DataFrame(request.json)
        
        # Preprocess input using saved transformers
        for column in input_data.columns:
            if column in label_encoders:
                input_data[column] = label_encoders[column].transform(input_data[column])
        
        input_scaled = scaler.transform(input_data)
        
        # Make prediction
        start_time = time.time()
        prediction = model.predict(input_scaled)
        detection_time = time.time() - start_time
        
        # Convert prediction to original labels
        prediction_labels = label_encoders['target'].inverse_transform(prediction)
        
        # Determine if any intrusions were detected
        intrusion_detected = any(label != 'normal' for label in prediction_labels)
        
        return jsonify({
            'predictions': prediction_labels.tolist(),
            'detection_time': detection_time,
            'intrusion_detected': intrusion_detected
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)