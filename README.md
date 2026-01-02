# FloorPlan to 3D Converter

Web-based application that converts 2D floor plans to interactive 3D models using Machine Learning.

## 🚀 Features

- **AI-Powered Detection**: Uses Mask R-CNN to detect walls, doors, and windows
- **Interactive 3D Viewer**: Rotate, pan, and zoom the 3D model
- **Full-Screen Mode**: Immersive viewing experience
- **Web-Based**: No installation required, runs in browser

## 📦 What's Included

- **Frontend**: React + Vite + Three.js
- **Backend**: Python Flask + TensorFlow + Mask R-CNN
- **Model**: Pre-trained on CubiCasa5K dataset

## ⚠️ Important: Model Weights Required

This repository does NOT include the model weights file due to its large size (246 MB).

### Download Model Weights:
1. Download `maskrcnn_15_epochs.h5` from [Google Drive](https://drive.google.com/your-link-here)
2. Place it in: `FloorPlanTo3D-API-master/weights/maskrcnn_15_epochs.h5`

## 🛠️ Setup

### Prerequisites:
- Python 3.7 (required for TensorFlow 1.15)
- Node.js 14+

### Quick Start:
```bash
# Clone repository
git clone https://github.com/Shadow17866/Builderwebsite.git
cd Builderwebsite

# Download model weights (see above)

# Install Python dependencies
cd FloorPlanTo3D-API-master
pip install -r requirements.txt

# Install Node dependencies
cd ../model-converter
npm install

# Start both servers
npm start
```

## 🌐 Deployment

See deployment guides:
- [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md) - Quick 3-step guide
- [model-converter/NETLIFY_DEPLOYMENT.md](model-converter/NETLIFY_DEPLOYMENT.md) - Frontend deployment
- [FloorPlanTo3D-API-master/RENDER_DEPLOYMENT.md](FloorPlanTo3D-API-master/RENDER_DEPLOYMENT.md) - Backend deployment

## 📝 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Detailed integration guide

## 🏗️ Project Structure

```
Builderwebsite/
├── FloorPlanTo3D-API-master/     # Backend (Python Flask + ML)
│   ├── application.py            # Main API server
│   ├── requirements.txt          # Python dependencies
│   ├── mrcnn/                    # Mask R-CNN model
│   └── weights/                  # Model weights (not included - see above)
│       └── maskrcnn_15_epochs.h5 # DOWNLOAD THIS FILE
│
└── model-converter/              # Frontend (React + Three.js)
    ├── src/                      # React components
    ├── package.json              # Node dependencies
    └── vite.config.js            # Vite configuration
```

## 🎯 Usage

1. Start the application (see Quick Start above)
2. Open http://localhost:5173 in your browser
3. Upload a floor plan image
4. Wait for conversion (10-30 seconds)
5. View your 3D model!

## ⚙️ Tech Stack

**Frontend:**
- React 19.2.0
- Three.js 0.182.0
- Vite 7.3.0
- React Router 7.x

**Backend:**
- Python 3.7.9
- Flask 2.2.5
- TensorFlow 1.15.0
- Keras 2.2.4
- Mask R-CNN

## 🐛 Known Issues

- Model accuracy varies with floor plan style
- Best results with clean, black lines on white background
- First detection may take longer (model loading)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read the contribution guidelines first.

## 📧 Contact

For issues or questions, please open a GitHub issue.

---

**Note**: This project was trained on the CubiCasa5K dataset and works best with similar floor plan styles.
