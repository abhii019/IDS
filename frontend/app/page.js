'use client';
import React, { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  ArcElement, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip, 
  Legend
);
import './ids.css';

const IDSInterface = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isIntrusionDetected, setIsIntrusionDetected] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('accuracy');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setFile(file);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setResults(data);
      setIsIntrusionDetected(data.intrusion_detected || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare the pie chart data for the graphical representation of results
  const pieChartData = {
    labels: ['Accuracy', 'Training Time', 'Detection Time'],
    datasets: [
      {
        data: results ? [
          (results.accuracy * 100),
          results.training_time,
          results.detection_time,
        ] : [0, 0, 0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(160, 33, 60, 0.8)',
          'rgba(237, 245, 2, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Pie chart options
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            if (label === 'Accuracy') {
              return `${label}: ${value.toFixed(2)}%`;
            } else {
              return `${label}: ${value.toFixed(4)}s`;
            }
          }
        }
      }
    }
  };

  // Sample model comparison data (replace with actual data from API)
  const modelComparisonData = {
    labels: ['XGBoost', 'RNN', 'CNN', 'Decision Tree'],
    datasets: [
      {
        label: 'Accuracy (%)',
        data: [99.8, 80.9, 99.2, 94.1],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'F1 Score (%)',
        data: [94.8, 89.5, 92.9, 70],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      },
      {
        label: 'Training Time (s)',
        data: [11.9, 35, 30, 5],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Detection Time (s)',
        data: [0.18, 7.1, 5.18, 0.03],
        backgroundColor: 'rgba(255, 206, 86, 0.7)',
      }
    ]
  };

  // Bar chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'ML Model Comparison',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Value',
        }
      },
      x: {
        title: {
          display: true,
          text: 'Models',
        }
      }
    }
  };

  // Function to determine score color based on value
  const getScoreColor = (score) => {
    if (score >= 0.9) return '#10B981'; // Green for excellent
    if (score >= 0.8) return '#3B82F6'; // Blue for good
    if (score >= 0.7) return '#F59E0B'; // Amber for moderate
    return '#EF4444'; // Red for poor
  };
  
  // Function to get gradient color for confusion matrix
  const getMatrixCellStyle = (value, maxValue) => {
    const normalizedValue = value / maxValue;
    // True positives (correct predictions) use green, others use a blue gradient
    const isTruePositive = value === maxValue;
    
    if (isTruePositive) {
      return {
        backgroundColor: `rgba(16, 185, 129, ${0.2 + normalizedValue * 0.8})`,
        color: normalizedValue > 0.5 ? 'white' : '#1F2937',
        fontWeight: 'bold',
        fontSize: `${Math.max(14, 14 + normalizedValue * 8)}px`
      };
    }
    
    return {
      backgroundColor: `rgba(59, 130, 246, ${0.1 + normalizedValue * 0.7})`,
      color: normalizedValue > 0.5 ? 'white' : '#1F2937',
      fontSize: `${Math.max(14, 14 + normalizedValue * 6)}px`
    };
  };

  // Get attack type label for confusion matrix
  const getAttackLabel = (index) => {
    if (!results || !results.attack_labels) {
      return `Class ${index}`;
    }
    return results.attack_labels[index] || `Class ${index}`;
  };

  return (
    <div className="container">
      <h1 className="title">Intrusion Detection System</h1>

      {/* File Upload Section */}
      <div className="card">
        <h2 className="section-title">Dataset Upload</h2>
        <div className="upload-area">
          <Upload className="upload-icon" />
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="file-input"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`submit-button ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Processing...' : 'Analyze Dataset'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <AlertCircle />
          <p>{error}</p>
        </div>
      )}

      {/* Intrusion Detected Alert */}
      {isIntrusionDetected && (
        <div className="alert-message intrusion-alert">
          <AlertCircle />
          <p className="alert-text">Intrusion Detected! 🚨</p>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="results-container">
          {/* Model Performance Metrics */}
          <div className="card">
            <h2 className="section-title">Model Performance</h2>
            <div className="metrics-grid">
              <div className="metric">
                <p className="metric-label">Accuracy</p>
                <p className="metric-value">
                  {(results.accuracy * 100).toFixed(2)}%
                </p>
              </div>
              <div className="metric">
                <p className="metric-label">Training Time</p>
                <p className="metric-value">
                  {results.training_time.toFixed(4)}s
                </p>
              </div>
              <div className="metric">
                <p className="metric-label">Detection Time</p>
                <p className="metric-value">
                  {results.detection_time.toFixed(4)}s
                </p>
              </div>
            </div>
          </div>

          {/* Graphical Display of Model Performance - Pie Chart */}
          <div className="card">
            <h2 className="section-title">Model Performance (Graphical)</h2>
            <div className="chart-container">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>
          
          Model Comparison - Bar Chart
          <div className="card">
            <h2 className="section-title">ML Model Comparison</h2>
            <div className="chart-container bar-chart">
              <Bar data={modelComparisonData} options={barChartOptions} />
            </div>
          </div>

          {/* Enhanced Classification Report */}
          <div className="card">
            <h2 className="section-title">Classification Report</h2>
            <div className="report-legend">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#10B981' }}></span>
                <span>Excellent (≥90%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#3B82F6' }}></span>
                <span>Good (80-89%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#F59E0B' }}></span>
                <span>Moderate (70-79%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#EF4444' }}></span>
                <span>Needs Improvement (70%)</span>
              </div>
            </div>
            <div className="enhanced-report-container">
              {results.classification_report && Object.entries(results.classification_report)
                .filter(([key]) => !['accuracy', 'macro avg', 'weighted avg'].includes(key))
                .map(([className, metrics]) => (
                  <div key={className} className="report-card">
                    <div className="report-class-name">{className}</div>
                    <div className="report-metrics">
                      <div className="report-metric">
                        <div 
                          className="report-metric-circle" 
                          style={{ backgroundColor: getScoreColor(metrics.precision) }}
                        >
                          {(metrics.precision * 100).toFixed(0)}%
                        </div>
                        <div className="report-metric-label">Precision</div>
                      </div>
                      <div className="report-metric">
                        <div 
                          className="report-metric-circle" 
                          style={{ backgroundColor: getScoreColor(metrics.recall) }}
                        >
                          {(metrics.recall * 100).toFixed(0)}%
                        </div>
                        <div className="report-metric-label">Recall</div>
                      </div>
                      <div className="report-metric">
                        <div 
                          className="report-metric-circle" 
                          style={{ backgroundColor: getScoreColor(metrics['f1-score']) }}
                        >
                          {(metrics['f1-score'] * 100).toFixed(0)}%
                        </div>
                        <div className="report-metric-label">F1-Score</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Enhanced Confusion Matrix */}
          <div className="card">
            <h2 className="section-title">Confusion Matrix</h2>
            <div className="matrix-container">
              <div className="matrix-description">
                <p>This heatmap visualizes the performance of our intrusion detection model. 
                Darker cells indicate higher values; the diagonal represents correct predictions.</p>
              </div>
              <div className="matrix-wrapper">
                {/* X-axis labels - Predicted */}
                <div className="matrix-axis matrix-x-label">Predicted Class</div>
                
                {/* Y-axis label - Actual */}
                <div className="matrix-axis matrix-y-label">Actual Class</div>
                
                {/* Row labels - for actual classes */}
                <div className="matrix-row-labels">
                  {results.confusion_matrix.map((_, i) => (
                    <div key={i} className="matrix-label">{getAttackLabel(i)}</div>
                  ))}
                </div>
                
               {/* Column labels - for predicted classes */}
                <div className="matrix-col-labels">
                  {/* {results.confusion_matrix[0].map((_, j) => (
                    <div key={j} className="matrix-label">{getAttackLabel(j)}</div>
                  ))} */}
                </div>
                
                {/* The actual matrix */}
                <div className="enhanced-matrix">
                  {results.confusion_matrix.map((row, i) => (
                    <div key={i} className="matrix-row">
                      {row.map((cell, j) => {
                        const maxValue = Math.max(...results.confusion_matrix.flat());
                        const cellStyle = getMatrixCellStyle(cell, maxValue);
                        return (
                          <div 
                            key={j} 
                            className="matrix-cell" 
                            style={cellStyle}
                            title={`Actual: ${getAttackLabel(i)}, Predicted: ${getAttackLabel(j)}, Count: ${cell}`}
                          >
                            {cell}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
           {/* Model Comparison - Bar Chart */}
           {/* <div className="card">
            <h2 className="section-title">ML Model Comparison</h2>
            <div className="chart-container bar-chart">
              <Bar data={modelComparisonData} options={barChartOptions} />
            </div>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default IDSInterface;