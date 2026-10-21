package com.taskboard.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.taskboard.repository.TaskRepository;

@RestController
public class TaskController {

    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public record TaskDetail(Long id, Long columnId, String title, String description, int priority,
            LocalDate dueDate, int position) {
    }

    @GetMapping("/api/tasks")
    public List<TaskDetail> search(@RequestParam(required = false) Long columnId,
            @RequestParam(required = false) Integer priority,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueBefore) {
        String keyword = (q == null || q.isBlank()) ? null : q.trim();
        return taskRepository.search(columnId, priority, keyword, dueBefore).stream()
                .map(TaskController::toDetail).toList();
    }

    @GetMapping("/api/tasks/{id}")
    public TaskDetail get(@PathVariable Long id) {
        return taskRepository.findById(id).map(TaskController::toDetail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private static TaskDetail toDetail(com.taskboard.entity.Task t) {
        return new TaskDetail(t.getId(), t.getColumnId(), t.getTitle(), t.getDescription(), t.getPriority(),
                t.getDueDate(), t.getPosition());
    }
}
