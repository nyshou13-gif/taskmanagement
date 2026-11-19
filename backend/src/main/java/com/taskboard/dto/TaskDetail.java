package com.taskboard.dto;

import java.time.LocalDate;

import com.taskboard.entity.Task;

/** タスク1件のAPIレスポンス。 */
public record TaskDetail(Long id, Long columnId, String title, String description, int priority,
        LocalDate dueDate, int position) {

    public static TaskDetail from(Task t) {
        return new TaskDetail(t.getId(), t.getColumnId(), t.getTitle(), t.getDescription(),
                t.getPriority(), t.getDueDate(), t.getPosition());
    }
}
