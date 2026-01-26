from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider



@dataclass(frozen=True)
class AstraConfig:
    secure_bundle_env: str = "ASTRA_DB_SECURE_CONNECT_BUNDLE"
    client_id_env: str = "ASTRA_DB_CLIENT_ID"
    client_secret_env: str = "ASTRA_DB_CLIENT_SECRET"
    keyspace_env: str = "ASTRA_DB_KEYSPACE"
    token_json_env: str = "ASTRA_DB_TOKEN_JSON"
    bundle_path: str = "secure-connect-experimentein.zip"
    token_json_path: str = "Experimentein-token.json"


class AstraClientFactory:
    def __init__(self, config: Optional[AstraConfig] = None) -> None:
        self.config = config or AstraConfig()

    def create(self):
        bundle = os.getenv(self.config.secure_bundle_env)
        if not bundle:
            bundle_path = Path(__file__).parent / self.config.bundle_path
            if not bundle_path.exists():
                raise ValueError(f"Missing {self.config.secure_bundle_env} env var and bundle file")
            bundle = str(bundle_path)

        client_id = os.getenv(self.config.client_id_env)
        client_secret = os.getenv(self.config.client_secret_env)
        if not client_id or not client_secret:
            token_path = os.getenv(self.config.token_json_env)
            if token_path:
                token_file = Path(token_path)
            else:
                token_file = Path(__file__).parent / self.config.token_json_path
            if not token_file.exists():
                raise ValueError("Missing Astra credentials env vars and token JSON file")
            data = json.loads(token_file.read_text(encoding="utf-8"))
            client_id = data.get("clientId")
            client_secret = data.get("secret")
            if not client_id or not client_secret:
                raise ValueError("Token JSON missing clientId/secret")

        auth = PlainTextAuthProvider(client_id, client_secret)
        cluster = Cluster(
            cloud={"secure_connect_bundle": bundle},
            auth_provider=auth,
        )
        session = cluster.connect()

        keyspace = os.getenv(self.config.keyspace_env)
        if keyspace:
            session.set_keyspace(keyspace)

        return cluster, session
