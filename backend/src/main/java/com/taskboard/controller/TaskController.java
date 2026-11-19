package com.taskboard.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.taskboard.dto.CreateTaskRequest;
import com.taskboard.dto.TaskDetail;
import com.taskboard.dto.UpdateTaskRequest;
import com.taskboard.service.TaskService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskDetail> search(@RequestParam(required = false) Long columnId,
            @RequestParam(required = false) Integer priority,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueBefore) {
        return taskService.search(columnId, priority, q, dueBefore);
    }

    @GetMapping("/{id}")
    public TaskDetail get(@PathVariable Long id) {
        return taskService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDetail create(@Valid @RequestBody CreateTaskRequest req) {
        return taskService.create(req);
    }

    @PatchMapping("/{id}")
    public TaskDetail update(@PathVariable Long id, @Valid @RequestBody UpdateTaskRequest req) {
        return taskService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        taskService.delete(id);
    }
}
