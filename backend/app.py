from flask import Flask, render_template
from config import Config
from auth import auth_bp
from invoices import invoices_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(invoices_bp, url_prefix='/invoices')

    # route for dashboard / index
    @app.route('/')
    def index():
        return render_template('index.html')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
