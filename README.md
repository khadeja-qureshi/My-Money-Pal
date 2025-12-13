## My Money Pal
A personal finance management application to track expenses, budgets, and financial goals. 

---

##  Live Demo
- **Frontend:** (https://my-money-pal.vercel.app/login)  


---

##  Tech Stack

- **Frontend:** React, Vite, JavaScript, CSS  
- **Backend:** Python, Flask  
- **Database:** MySQL    

---

## Database Setup

1. Create a MySQL database.  
2. Import `database.sql` into your MySQL server.  
3. Update the `.env` file in the **backend** folder with your database credentials:

```env
DB_HOST=your_host
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

```
## Backend Setup
- cd backend
- python -m venv venv
**Activate virtual environment**
**Windows**: venv\Scripts\activate
**macOS/Linux**: source venv/bin/activate
-pip install -r req.txt
-python app.py
-Backend will run at: http://127.0.0.1:5000

## Frontend Setup
- cd frontend
- npm install
- npm run dev
-Frontend will run at: http://localhost:5173


