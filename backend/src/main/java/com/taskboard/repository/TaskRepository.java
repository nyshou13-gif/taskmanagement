package com.taskboard.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.taskboard.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findAllByOrderByPositionAsc();

    @Query("""
            select t from Task t
            where (:columnId is null or t.columnId = :columnId)
              and (:priority is null or t.priority = :priority)
              and (cast(:q as string) is null
                   or lower(t.title) like lower(concat('%', cast(:q as string), '%'))
                   or lower(t.description) like lower(concat('%', cast(:q as string), '%')))
              and (cast(:dueBefore as date) is null or t.dueDate <= :dueBefore)
            order by t.columnId, t.position
            """)
    List<Task> search(@Param("columnId") Long columnId, @Param("priority") Integer priority,
            @Param("q") String q, @Param("dueBefore") LocalDate dueBefore);
}
