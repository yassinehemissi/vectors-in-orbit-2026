from __future__ import annotations

from .app import create_app
from .config import api_port
from .env import load_env

load_env()

def main() -> None:
    app = create_app()
    app.run(host="0.0.0.0", port=api_port())


if __name__ == "__main__":
    main()
