INSERT INTO tasks (column_id, title, description, priority, due_date, position)
SELECT c.id, t.title, t.description, t.priority, t.due_date, t.position
FROM (VALUES
    (1, 'API仕様書を作成する', 'エンドポイント一覧をまとめる', 3, DATE '2026-10-20', 1),
    (1, 'ER図をレビューする', '', 2, DATE '2026-10-25', 2),
    (1, 'READMEを整備する', '起動手順を追記', 1, NULL, 3),
    (2, 'タスク読み取りAPIを実装する', 'GET /api/tasks', 3, DATE '2026-10-15', 1),
    (2, 'テストデータを投入する', 'Flywayで投入', 2, DATE '2026-10-12', 2),
    (3, 'DBスキーマを作成する', 'V1__init.sql', 2, DATE '2026-10-05', 1),
    (3, 'Spring Bootの雛形を作る', '', 1, NULL, 2)
) AS t(col_pos, title, description, priority, due_date, position)
JOIN columns c ON c.position = t.col_pos;
