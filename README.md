
## Database Setup:
1. create a MySQL database with given schema:
    - Import 'database.sql' into MySQL
2. update '.env' file in the **backend** folder with your database credentials

## Backend Setup (Flask):
cd backend
python -m venv venv
venv\Scripts\activate  (windows)  OR    source venv/bin/activate (macOS/Linux)
pip install -r req.txt

## run backend server:
python app.py
backend will run at: http://127.0.0.1:5000

## Frontend setup (React + vite):
cd frontend
npm install
npm run dev
frontend will run at: http://localhost:5173/ 

