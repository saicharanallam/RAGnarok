import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:postgres@db:5432/ragnarok'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')