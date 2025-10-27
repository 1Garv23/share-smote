# Augmentation of RGB Image Datasets using SMOTE
## Team Members
- Anshul Dadhich (231IT010)
- Garv Mandloi (231IT023)
- H S Jayanth (231IT024)

## Things To Note
- The names of the files are not changed since they break the imports.

## Requirements

- Node.js 16+
- Python 3.8+
- MongoDB (local or Atlas)

## Contribution - H S Jayanth
I have developed 2 main modules `backend_python/upload` and `backend_python/augment`.
I have developed all the other necessary files required to run the Python backend.
- `assets` for managing the different assets.
- `augment` for the actual augmentation process.
- `logger` for the logging process.
- Other Python files for backend configuration.
The integration of all the Python modules are mainly done in the Python files.
This will import all the modules and string them together to create the flow/integration.
I have done the integration testing of all the Python backend modules, in `tests/tests.py`.
- This only tests all modules of Python backend together.
Apart from this, I have developed some sample test datasets to submit to the React Frontend.

## Contribution - Garv Mandloi
./backend_javascript/server.js (main server that listens to connections)
./backend_javascript/models/User.js (defines the user schema)
./backend_javascript/config/db.js (connects to cloud atlas database)
./backend_javascript/routes/auth.js (this binds all the functions from the below module to create a route and creates API endpoints)
./backend_javascript/routes/auth (this folder included all the functions from 1.1 in DFD and a few extra ones)
    From the DFD:
    ->recive-credential.js
    ->validate-input.js
    ->issue-jwt-token.js
    ->apply-middleware.js
    Helper functions:
    ->create-user.js (before issuing jwt token, register him in DB if it's a new user)
    ->verify-user.js (before issuing jwt token, verify with DB if it's an existing user)
./backend_python/params (DFD 1.2, makes a FastAPI route to recive parameters and stores them)
    ->router.py 
    ->schemas.py
    ->service.py
API endpoints created:
  -> /login : allows for login via POST on this endpoint
  -> /register : allows for register via POST on this endpoint
  -> /user : verifies JWT token and returns user details from DB upon successful verification.
  -> /process : processes the user's request to apply SMOTE with the given parameters and forwards it to python engine upon validation and verification and then returns the output zip to user upon completition

## Contribution - Anshul Dadhich
1. Authentication Frontend
Files: Login.jsx, Register.jsx
Features: Email/password validation, registration with username/email/password, navigation between login/register.
2. Dashboard Frontend
Files: Dashboard.jsx, Dashboard.css
Features: user info display, drag-and-drop .zip upload, optional parameters (K Neighbour, Target Ratio, Random State) with validation, file processing with loading states, automatic download, output display, logout, responsive UI.
3. Styling
Files: Dashboard.css, index.css
4. Metrics Module
Folder: backend_python/metrics/
Features: Image quality metrics endpoint, cosine similarity & SSIM computation, Pydantic schemas for validation, summary statistics aggregation

## Quick Start

### 1. Install Dependencies
NOTE: PLEASE RUN IN A LINUX BASED ENVIRONMENT.

```bash
# Node.js backend
cd backend_javascript
npm install

# Python backend
cd ../backend_python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ..
npm install
```

### 2. Configure Environment

**backend_javascript/.env**
```env
MONGO_URI=mongodb://localhost:27017/smote_db
JWT_SECRET=generate_random_32_char_string_here
PORT=5000
PY_API_KEY=generate_random_api_key_here
```

**backend_python/.env**
```env
SECRET_KEY=generate_random_32_char_string_here
REQUIRE_AUTH=True
VALID_API_KEYS=same_api_key_as_nodejs_backend
DATADIR=.data
CORSORIGINS=["http://localhost:5173"]
```

Generate keys:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create Python data directory:
```bash
cd backend_python
mkdir -p .data/assets .data/registry .data/tmp
```

### 3. Start MongoDB

```bash
sudo systemctl start mongodb
```

### 4. Run Services

Open 3 terminals:

**Terminal 1 - Node.js Backend:**
```bash
cd backend_javascript
npm start
```

**Terminal 2 - Python Backend:**
```bash
cd backend_python
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8080
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

Access: http://localhost:5173

## Run Integration Tests
Python backend integration test:
`python tests/tests.py` with the Python backend running.
`node test-process.js` with the both Python and JavaScript backends running.

## Dataset Format

ZIP structure required:
```
dataset.zip
├── class1/
│   ├── image1.jpg
│   └── image2.png
├── class2/
│   └── image1.jpg
└── class3/
    └── image1.png
```

- Images must be in class-named folders
- Formats: .jpg, .jpeg, .png, .webp
- Min resolution: 32x32px
- Max dimension: 10,000px
- Max file: 50MB each
- Max ZIP: 500MB unzipped

## Usage

1. Register/Login
2. Upload ZIP file
3. Set parameters:
   - **k_neighbour**: 2+ (default: 5)
   - **target_ratio**: 0.0-1.0 (optional, empty = auto-balance)
   - **random_state**: any integer (default: 42)
4. Click Process File
5. Download augmented dataset

Output includes original images + synthetic images + metadata.json with quality metrics.

## Troubleshooting

**MongoDB connection fails:**
- Check MongoDB is running
- Verify MONGO_URI in .env

**Port in use:**
```bash
lsof -i :5000
kill -9 <PID>
```

**Python modules not found:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

**CORS errors:**
- Ensure frontend runs on port 5173
- Check CORSORIGINS in Python .env

**Upload fails:**
- Verify ZIP structure (classes in folders)
- Check file size limits
- Ensure at least 2 images per class

**SMOTE fails:**
- Need minimum 2 images per class
- k_neighbour must be < number of images in smallest class
- Check images are valid (not corrupted)

## API Endpoints

**Node.js (5000):**
- POST /api/auth/register - Register user
- POST /api/auth/login - Login user
- GET /api/auth/user - Get user info (requires token)
- POST /api/auth/process - Process dataset (requires token)

**Python (8080):**
- GET /health - Health check
- POST /params - Set SMOTE parameters
- POST /upload/zip - Upload dataset
- POST /augment/smote - Generate augmented dataset

All Python endpoints require X-API-Key header.