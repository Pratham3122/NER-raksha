#!/usr/bin/env python3
"""
NER-RAKSHA Disruption Prediction Model Training

PROTOTYPE MODEL | SYNTHETIC DATA
This model is trained on synthetically generated data following
real-world feature schemas. It is labeled clearly throughout.

Features:
- rainfall_mm: Rainfall in mm (from weather observations)
- slope_pct: Terrain slope percentage (from SRTM data)
- incident_count_5km: Number of incidents within 5km
- road_status_score: Encoded road status (0-100)
- is_poor_condition: Binary flag for POOR/VERY_POOR road condition
- historical_disruption_rate: Historical rate 0-1

Target:
- is_disrupted: Binary (1 if SEVERELY_DISRUPTED or BLOCKED, else 0)

Models compared:
- Logistic Regression
- Random Forest
- Gradient Boosting
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix, 
    roc_auc_score, average_precision_score, f1_score, accuracy_score, precision_score, recall_score
)
import joblib
import json
from pathlib import Path
from datetime import datetime, timezone

random_state = 42
np.random.seed(random_state)

def generate_synthetic_data(n_samples=1500):
    print(f"Generating {n_samples} synthetic training samples...")
    # Generate features
    rainfall_mm = np.random.uniform(0, 150, n_samples)
    slope_pct = np.random.uniform(0, 60, n_samples)
    incident_count_5km = np.random.poisson(0.5, n_samples)
    incident_count_5km = np.clip(incident_count_5km, 0, 8)
    road_status_score = np.random.uniform(0, 100, n_samples)
    is_poor_condition = np.random.choice([0, 1], p=[0.7, 0.3], size=n_samples)
    historical_disruption_rate = np.random.beta(2, 5, n_samples)
    
    # Generate target based on features + noise
    logit = (-3.0 + 
             0.02 * rainfall_mm + 
             0.03 * slope_pct + 
             0.5 * incident_count_5km - 
             0.01 * road_status_score + 
             0.8 * is_poor_condition + 
             2.0 * historical_disruption_rate + 
             np.random.normal(0, 1, n_samples))
    
    prob = 1 / (1 + np.exp(-logit))
    is_disrupted = (prob > 0.5).astype(int)
    
    # Adjust balance slightly if needed, we want ~20% disrupted
    current_ratio = is_disrupted.mean()
    print(f"Generated target variable with {current_ratio*100:.1f}% disruption cases.")
    
    df = pd.DataFrame({
        'rainfall_mm': rainfall_mm,
        'slope_pct': slope_pct,
        'incident_count_5km': incident_count_5km,
        'road_status_score': road_status_score,
        'is_poor_condition': is_poor_condition,
        'historical_disruption_rate': historical_disruption_rate,
        'is_disrupted': is_disrupted
    })
    
    return df

def train_and_evaluate():
    df = generate_synthetic_data()
    
    features = ['rainfall_mm', 'slope_pct', 'incident_count_5km', 'road_status_score', 'is_poor_condition', 'historical_disruption_rate']
    X = df[features]
    y = df['is_disrupted']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=random_state, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    models = {
        'Logistic Regression': LogisticRegression(random_state=random_state),
        'Random Forest': RandomForestClassifier(random_state=random_state, n_estimators=100),
        'Gradient Boosting': GradientBoostingClassifier(random_state=random_state, n_estimators=100)
    }
    
    best_model = None
    best_f1 = -1
    best_name = ""
    best_metrics = {}
    
    print("\nModel Comparison:")
    print("-" * 80)
    print(f"{'Model':<20} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<10} | {'F1 Score':<10} | {'ROC AUC':<10}")
    print("-" * 80)
    
    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc = roc_auc_score(y_test, y_prob)
        pr_auc = average_precision_score(y_test, y_prob)
        
        print(f"{name:<20} | {acc:.4f}     | {prec:.4f}     | {rec:.4f}   | {f1:.4f}     | {roc:.4f}")
        
        if f1 > best_f1:
            best_f1 = f1
            best_model = model
            best_name = name
            best_metrics = {
                'accuracy': acc, 'precision': prec, 'recall': rec,
                'f1': f1, 'roc_auc': roc, 'pr_auc': pr_auc
            }
            
    print("-" * 80)
    print(f"\nBest Model selected: {best_name} (F1 Score: {best_f1:.4f})")
    
    print("\nConfusion Matrix for Best Model:")
    y_pred_best = best_model.predict(X_test_scaled)
    print(confusion_matrix(y_test, y_pred_best))
    
    print("\nLIMITATIONS NOTE: This is a PROTOTYPE model trained on SYNTHETIC data.")
    print("It must not be used for real operational decision-making.")
    
    # Save model and metadata
    out_dir = Path(__file__).parent.parent / 'models'
    out_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = out_dir / 'disruption_model.joblib'
    # Save scaler and model together in a pipeline-like structure
    joblib.dump({'scaler': scaler, 'model': best_model}, model_path)
    
    info_path = out_dir / 'model_info.json'
    metadata = {
        'algorithm': best_name,
        'version': '1.0.0',
        'metrics': best_metrics,
        'feature_names': features,
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'note': 'PROTOTYPE MODEL | SYNTHETIC DATA',
        'trained_at': datetime.now(timezone.utc).isoformat()
    }
    
    with open(info_path, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\nModel saved to {model_path}")
    print(f"Metadata saved to {info_path}")

if __name__ == '__main__':
    train_and_evaluate()
