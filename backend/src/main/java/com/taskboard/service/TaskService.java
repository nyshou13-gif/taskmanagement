package com.taskboard.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskboard.dto.CreateTaskRequest;
import com.taskboard.dto.TaskDetail;
import com.taskboard.dto.UpdateTaskRequest;
import com.taskboard.entity.Task;
import com.taskboard.exception.InvalidRequestException;
import com.taskboard.exception.NotFoundException;
import com.taskboard.repository.BoardColumnRepository;
import com.taskboard.repository.TaskRepository;

/** タスクの業務ロジック。position の再計算など、複数行にまたがる更新はここでトランザクションを張る。 */
@Service
@Transactional(readOnly = true)
public class TaskService {

    private static final int DEFAULT_PRIORITY = 2;

    private final TaskRepository taskRepository;
    private final BoardColumnRepository columnRepository;

    public TaskService(TaskRepository taskRepository, BoardColumnRepository columnRepository) {
        this.taskRepository = taskRepository;
        this.columnRepository = columnRepository;
    }

    public List<TaskDetail> search(Long columnId, Integer priority, String q, LocalDate dueBefore) {
        String keyword = (q == null || q.isBlank()) ? null : q.trim();
        return taskRepository.search(columnId, priority, keyword, dueBefore).stream()
                .map(TaskDetail::from).toList();
    }

    public TaskDetail get(Long id) {
        return TaskDetail.from(findTask(id));
    }

    /** 指定カラムの末尾に追加する。 */
    @Transactional
    public TaskDetail create(CreateTaskRequest req) {
        requireColumn(req.columnId());
        int position = taskRepository.maxPosition(req.columnId()) + 1;
        Task task = new Task(req.columnId(), req.title().trim(),
                req.description() == null ? "" : req.description(),
                req.priority() == null ? DEFAULT_PRIORITY : req.priority(), req.dueDate(), position);
        return TaskDetail.from(taskRepository.save(task));
    }

    /** 指定された項目だけを更新する。columnId / position が指定されたときは移動も行う。 */
    @Transactional
    public TaskDetail update(Long id, UpdateTaskRequest req) {
        Task task = findTask(id);
        if (req.getColumnId() != null) {
            requireColumn(req.getColumnId());
        }
        task.update(
                req.getTitle() == null ? task.getTitle() : req.getTitle().trim(),
                req.getDescription() == null ? task.getDescription() : req.getDescription(),
                req.getPriority() == null ? task.getPriority() : req.getPriority(),
                req.isDueDatePresent() ? req.getDueDate() : task.getDueDate());

        Long oldColumnId = task.getColumnId();
        Long newColumnId = req.getColumnId() == null ? oldColumnId : req.getColumnId();
        boolean columnChanged = !oldColumnId.equals(newColumnId);
        if (columnChanged || req.getPosition() != null) {
            place(task, newColumnId, req.getPosition());
            if (columnChanged) {
                renumber(oldColumnId);
            }
        }
        return TaskDetail.from(task);
    }

    /** タスクを物理削除し、同じカラムの position を詰め直す。 */
    @Transactional
    public void delete(Long id) {
        Task task = findTask(id);
        Long columnId = task.getColumnId();
        taskRepository.delete(task);
        taskRepository.flush();
        renumber(columnId);
    }

    /** カラム内のタスクを並べ直して position に保存する（1回限り・安定ソート）。 */
    @Transactional
    public List<TaskDetail> sort(Long columnId, String by) {
        requireColumn(columnId);
        Comparator<Task> order = switch (by == null ? "" : by) {
            case "priority" -> Comparator.comparingInt(Task::getPriority).reversed();
            case "due_date" -> Comparator.comparing(Task::getDueDate,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            default -> throw new InvalidRequestException("by must be priority or due_date");
        };
        List<Task> tasks = new ArrayList<>(taskRepository.findByColumnIdOrderByPositionAscIdAsc(columnId));
        tasks.sort(order);
        assignPositions(columnId, tasks);
        return tasks.stream().map(TaskDetail::from).toList();
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id).orElseThrow(() -> new NotFoundException("Task not found"));
    }

    private void requireColumn(Long columnId) {
        if (!columnRepository.existsById(columnId)) {
            throw new InvalidRequestException("Column not found");
        }
    }

    /** task を columnId の position（0始まり。null なら末尾）へ置き、そのカラムの position を振り直す。 */
    private void place(Task task, Long columnId, Integer position) {
        List<Task> tasks = new ArrayList<>(taskRepository.findByColumnIdOrderByPositionAscIdAsc(columnId));
        tasks.removeIf(t -> t.getId().equals(task.getId()));
        tasks.add(position == null ? tasks.size() : Math.min(position, tasks.size()), task);
        assignPositions(columnId, tasks);
    }

    /** カラム内の position を 1..n に詰め直す。 */
    private void renumber(Long columnId) {
        assignPositions(columnId, taskRepository.findByColumnIdOrderByPositionAscIdAsc(columnId));
    }

    private void assignPositions(Long columnId, List<Task> tasks) {
        for (int i = 0; i < tasks.size(); i++) {
            tasks.get(i).moveTo(columnId, i + 1);
        }
    }
}
