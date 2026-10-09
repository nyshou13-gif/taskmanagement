CREATE TABLE columns (
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title    VARCHAR(50) NOT NULL,
    position INTEGER     NOT NULL
);

CREATE TABLE tasks (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    column_id   BIGINT       NOT NULL REFERENCES columns (id),
    title       VARCHAR(100) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    priority    INTEGER      NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)),
    due_date    DATE,
    position    INTEGER      NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_column_position ON tasks (column_id, position);

INSERT INTO columns (title, position) VALUES
    ('未着手', 1),
    ('作業中', 2),
    ('完了', 3);
