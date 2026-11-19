package com.taskboard.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.taskboard.TestcontainersConfiguration;
import com.taskboard.repository.TaskRepository;

/** DELETE /api/tasks/{id} のテスト。各テストはロールバックされる。 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class TaskDeleteControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    TaskRepository taskRepository;

    private long createTask(long columnId, String title) throws Exception {
        String body = mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                .content("{\"columnId\":" + columnId + ",\"title\":\"" + title + "\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"id\":(\\d+)").matcher(body);
        m.find();
        return Long.parseLong(m.group(1));
    }

    @Test
    void deleteRemovesRowFromDatabase() throws Exception {
        long id = createTask(1, "削除対象");
        mockMvc.perform(delete("/api/tasks/" + id)).andExpect(status().isNoContent());
        assertFalse(taskRepository.existsById(id));
        mockMvc.perform(get("/api/tasks/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void deleteRenumbersPositionsInSameColumn() throws Exception {
        long a = createTask(1, "A");
        long b = createTask(1, "B");
        long c = createTask(1, "C");
        mockMvc.perform(delete("/api/tasks/" + b)).andExpect(status().isNoContent());
        int pa = taskRepository.findById(a).orElseThrow().getPosition();
        mockMvc.perform(get("/api/tasks/" + c)).andExpect(jsonPath("$.position").value(pa + 1));
    }

    @Test
    void deleteUnknownIdReturns404() throws Exception {
        mockMvc.perform(delete("/api/tasks/999999")).andExpect(status().isNotFound());
    }
}
