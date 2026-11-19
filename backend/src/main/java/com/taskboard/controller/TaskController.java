package com.taskboard.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
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

    /** 詳細画面からの更新。columnId がこれまでと違えば、移動先カラムの末尾へ移す。 */
    public record UpdateTaskRequest(
            @NotNull Long columnId,
            @NotBlank @Size(max = 100) String title,
            String description,
            @NotNull @Min(1) @Max(3) Integer priority,
            LocalDate dueDate) {
    }

    /** DnD後の配置。position は移動先カラム内の0始まりの並び順。 */
    public record MoveTaskRequest(@NotNull Long columnId, @NotNull @Min(0) Integer position) {
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

    @PutMapping("/api/tasks/{id}")
    @Transactional
    public TaskDetail update(@PathVariable Long id, @Valid @RequestBody UpdateTaskRequest req) {
        Task task = findTask(id);
        if (!columnRepository.existsById(req.columnId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Column not found");
        }
        Long oldColumnId = task.getColumnId();
        task.update(req.title().trim(), req.description() == null ? "" : req.description(),
                req.priority(), req.dueDate());
        if (!oldColumnId.equals(req.columnId())) {
            task.moveTo(req.columnId(), taskRepository.maxPosition(req.columnId()) + 1);
            renumber(oldColumnId);
        }
        return toDetail(taskRepository.save(task));
    }

    @PutMapping("/api/tasks/{id}/move")
    @Transactional
    public TaskDetail move(@PathVariable Long id, @Valid @RequestBody MoveTaskRequest req) {
        Task task = findTask(id);
        if (!columnRepository.existsById(req.columnId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Column not found");
        }
        Long oldColumnId = task.getColumnId();
        List<Task> target = new ArrayList<>(taskRepository.findByColumnIdOrderByPositionAscIdAsc(req.columnId()));
        target.removeIf(t -> t.getId().equals(id));
        target.add(Math.min(req.position(), target.size()), task);
        for (int i = 0; i < target.size(); i++) {
            target.get(i).moveTo(req.columnId(), i + 1);
        }
        taskRepository.saveAll(target);
        if (!oldColumnId.equals(req.columnId())) {
            renumber(oldColumnId);
        }
        return toDetail(task);
    }

    /** タスクを物理削除し、同じカラムの position を詰め直す。 */
    @DeleteMapping("/api/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        Task task = findTask(id);
        Long columnId = task.getColumnId();
        taskRepository.delete(task);
        taskRepository.flush();
        renumber(columnId);
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    /** カラム内の position を 1..n に詰め直す。 */
    private void renumber(Long columnId) {
        List<Task> tasks = taskRepository.findByColumnIdOrderByPositionAscIdAsc(columnId);
        for (int i = 0; i < tasks.size(); i++) {
            tasks.get(i).moveTo(columnId, i + 1);
        }
        taskRepository.saveAll(tasks);
    }

    private static TaskDetail toDetail(Task t) {
        return new TaskDetail(t.getId(), t.getColumnId(), t.getTitle(), t.getDescription(), t.getPriority(),
                t.getDueDate(), t.getPosition());
    }
}
