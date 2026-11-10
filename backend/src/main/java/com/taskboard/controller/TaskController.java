package com.taskboard.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.taskboard.entity.Task;
import com.taskboard.repository.BoardColumnRepository;
import com.taskboard.repository.TaskRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
public class TaskController {

    private final TaskRepository taskRepository;
    private final BoardColumnRepository columnRepository;

    public TaskController(TaskRepository taskRepository, BoardColumnRepository columnRepository) {
        this.taskRepository = taskRepository;
        this.columnRepository = columnRepository;
    }

    public record CreateTaskRequest(
            @NotNull Long columnId,
            @NotBlank @Size(max = 100) String title,
            String description,
            @Min(1) @Max(3) Integer priority,
            LocalDate dueDate) {
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

    @PostMapping("/api/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDetail create(@Valid @RequestBody CreateTaskRequest req) {
        if (!columnRepository.existsById(req.columnId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Column not found");
        }
        int position = taskRepository.maxPosition(req.columnId()) + 1;
        Task task = new Task(req.columnId(), req.title().trim(),
                req.description() == null ? "" : req.description(),
                req.priority() == null ? 2 : req.priority(), req.dueDate(), position);
        return toDetail(taskRepository.save(task));
    }

    private static TaskDetail toDetail(Task t) {
        return new TaskDetail(t.getId(), t.getColumnId(), t.getTitle(), t.getDescription(), t.getPriority(),
                t.getDueDate(), t.getPosition());
    }
}
