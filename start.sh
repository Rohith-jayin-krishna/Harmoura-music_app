#!/bin/bash

# Start frontend
cd harmoura-frontend
npm run dev &   # & runs frontend in the background

# Start backend
cd ../backend
source venv-backend/bin/activate
python manage.py runserver
