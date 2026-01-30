from __future__ import annotations

from flask import Flask

from .routes.process import bp as process_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(process_bp)
    return app
