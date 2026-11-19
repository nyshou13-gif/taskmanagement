package com.taskboard.dto;

import java.time.LocalDate;
import java.util.List;

import com.taskboard.entity.Task;

/** GET /api/board のレスポンス。カラムごとにタスクをまとめて返す。 */
public final class BoardResponse {

    private BoardResponse() {
    }

    /** ボード上のタスク（所属カラムはカラム側が持つため columnId は含めない）。 */
    public record TaskResponse(Long id, String title, String description, int priority,
            LocalDate dueDate, int position) {

        public static TaskResponse from(Task t) {
            return new TaskResponse(t.getId(), t.getTitle(), t.getDescription(), t.getPriority(),
                    t.getDueDate(), t.getPosition());
        }
    }

    /** ボード上のカラム。 */
    public record ColumnResponse(Long id, String title, int position, List<TaskResponse> tasks) {
    }
}
