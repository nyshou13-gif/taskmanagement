# taskmanagement

## バックエンドの起動

前提: JDK 25、Maven、Docker

```
docker compose up -d                    # PostgreSQL 16 を起動（healthy になるまで待つ）
cd backend
mvn test                                # Testcontainers を使うため Docker が必要
mvn spring-boot:run                     # 起動時に Flyway がテーブル作成・初期データ投入
curl http://localhost:8080/api/health   # {"status":"ok"}
curl http://localhost:8080/api/board    # 3カラム（未着手/作業中/完了）
```

DB接続先は環境変数 `DB_URL` / `DB_USER` / `DB_PASSWORD` で上書き可能（既定は docker-compose の値）。
