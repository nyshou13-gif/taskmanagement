# taskmanagement

## バックエンドの起動

前提: JDK 25、Maven

```
cd backend
mvn test
mvn spring-boot:run
curl http://localhost:8080/api/health   # {"status":"ok"}
```

PostgreSQL（次ステップで接続予定）: `docker compose up -d`
