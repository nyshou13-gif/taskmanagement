package com.taskboard.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.taskboard.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findAllByOrderByPositionAsc();
}
