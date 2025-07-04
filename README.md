# 🚨 Intrusion Detection System using Advanced Machine Learning

This project implements a powerful Intrusion Detection System (IDS) that leverages **XGBoost** and the **Whale Optimization Algorithm (WOA)** for detecting network attacks with high accuracy.

---

## 📌 Features

- 🔐 Detects various types of network intrusions (DoS, Probe, R2L, U2R)
- 🚀 Uses **XGBoost** for fast and accurate classification
- 🧠 Integrates **Whale Optimization Algorithm (WOA)** for efficient feature selection
- 📊 Visualizes results using confusion matrix, ROC curve, and classification report
- 🧪 Tested on **NSL-KDD** dataset

---

## 🧰 Tech Stack

- **Python 3**
- **XGBoost**
- **Whale Optimization Algorithm**
- **scikit-learn**
- **Pandas**, **NumPy**, **Matplotlib**, **Seaborn**

---

## 🗂️ Dataset

- Dataset: [NSL-KDD](https://www.unb.ca/cic/datasets/nsl.html)
- Preprocessed to remove redundant and duplicate entries
- Features selected using WOA to improve model performance

---

## 📈 Results

- ✅ Accuracy: ~98%
- 🎯 High precision and recall for majority attack types
- 🧹 Reduced false positives using feature selection

---

## 📦 Setup Instructions

1. Clone the repo:
   ```bash
   git clone https://github.com/abhii019/IDS.git
   cd IDS
