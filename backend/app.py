import os
from flask import Flask
from models import db
from routes import bp
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
app.register_blueprint(bp)

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)