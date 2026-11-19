package com.taskboard.controller;

import java.util.List;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.taskboard.dto.TaskDetail;
import com.taskboard.service.TaskService;

@RestController
@RequestMapping("/api/columns")
public class ColumnController {

    private final TaskService taskService;

    public ColumnController(TaskService taskService) {
        this.taskService = taskService;
    }

    /** by=priority（高→低）または by=due_date（期限が近い順・期限なしは末尾）で並べ直して保存する。 */
    @PostMapping("/{id}/sort")
    public List<TaskDetail> sort(@PathVariable Long id, @RequestParam String by) {
        return taskService.sort(id, by);
    }
}
