package com.taskboard.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** POST /api/tasks のリクエスト。priority は 1:低 / 2:中 / 3:高（省略時は中）。 */
public record CreateTaskRequest(
        @NotNull Long columnId,
        @NotBlank @Size(max = 100) String title,
        String description,
        @Min(1) @Max(3) Integer priority,
        LocalDate dueDate) {
}
