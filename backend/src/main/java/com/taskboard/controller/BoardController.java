package com.taskboard.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taskboard.entity.Task;
import com.taskboard.repository.BoardColumnRepository;
import com.taskboard.repository.TaskRepository;

@RestController
public class BoardController {

    private final BoardColumnRepository columnRepository;
    private final TaskRepository taskRepository;

    public BoardController(BoardColumnRepository columnRepository, TaskRepository taskRepository) {
        this.columnRepository = columnRepository;
        this.taskRepository = taskRepository;
    }

    public record TaskResponse(Long id, String title, String description, int priority,
            LocalDate dueDate, int position) {
        static TaskResponse from(Task t) {
            return new TaskResponse(t.getId(), t.getTitle(), t.getDescription(), t.getPriority(),
                    t.getDueDate(), t.getPosition());
        }
    }

    public record ColumnResponse(Long id, String title, int position, List<TaskResponse> tasks) {
    }

    @GetMapping("/api/board")
    public List<ColumnResponse> board() {
        Map<Long, List<TaskResponse>> tasksByColumn = taskRepository.findAllByOrderByPositionAsc().stream()
                .collect(Collectors.groupingBy(Task::getColumnId,
                        Collectors.mapping(TaskResponse::from, Collectors.toList())));
        return columnRepository.findAllByOrderByPositionAsc().stream()
                .map(c -> new ColumnResponse(c.getId(), c.getTitle(), c.getPosition(),
                        tasksByColumn.getOrDefault(c.getId(), List.of())))
                .toList();
    }
}
