from flask import Flask
from config import Config
from auth import auth_bp
from invoices import invoices_bp
# register other blueprints similarly...

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    app.register_blueprint(auth_bp)
    app.register_blueprint(invoices_bp, url_prefix='/invoices')

    @app.route('/')
    def index():
        return "Invoicer app running"  # replace with dashboard render

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
