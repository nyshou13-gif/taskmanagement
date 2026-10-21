package com.taskboard.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.taskboard.TestcontainersConfiguration;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class TaskControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void listsAllSeededTasks() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(7));
    }

    @Test
    void filtersByPriority() throws Exception {
        mockMvc.perform(get("/api/tasks").param("priority", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void searchesByKeyword() throws Exception {
        mockMvc.perform(get("/api/tasks").param("q", "api"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void filtersByDueBefore() throws Exception {
        mockMvc.perform(get("/api/tasks").param("dueBefore", "2026-10-12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getsOneTaskAndReturns404ForMissing() throws Exception {
        mockMvc.perform(get("/api/tasks/999999")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/tasks").param("q", "ER図"))
                .andExpect(jsonPath("$[0].title").value("ER図をレビューする"));
    }
}
