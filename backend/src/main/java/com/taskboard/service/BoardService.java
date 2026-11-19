package com.taskboard.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskboard.dto.BoardResponse.ColumnResponse;
import com.taskboard.dto.BoardResponse.TaskResponse;
import com.taskboard.entity.Task;
import com.taskboard.repository.BoardColumnRepository;
import com.taskboard.repository.TaskRepository;

/** ボード全体（全カラムとタスク）の取得。 */
@Service
@Transactional(readOnly = true)
public class BoardService {

    private final BoardColumnRepository columnRepository;
    private final TaskRepository taskRepository;

    public BoardService(BoardColumnRepository columnRepository, TaskRepository taskRepository) {
        this.columnRepository = columnRepository;
        this.taskRepository = taskRepository;
    }

    public List<ColumnResponse> getBoard() {
        Map<Long, List<TaskResponse>> tasksByColumn = taskRepository.findAllByOrderByPositionAsc().stream()
                .collect(Collectors.groupingBy(Task::getColumnId,
                        Collectors.mapping(TaskResponse::from, Collectors.toList())));
        return columnRepository.findAllByOrderByPositionAsc().stream()
                .map(c -> new ColumnResponse(c.getId(), c.getTitle(), c.getPosition(),
                        tasksByColumn.getOrDefault(c.getId(), List.of())))
                .toList();
    }
}
