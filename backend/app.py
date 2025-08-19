import os
from flask import Flask
from flasgger import Swagger
from models import db
from routes import bp
from config import Config
from swagger_config import SWAGGER_CONFIG, SWAGGER_TEMPLATE

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

# Initialize Swagger
swagger = Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)

app.register_blueprint(bp)

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
