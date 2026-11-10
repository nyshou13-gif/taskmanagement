package com.taskboard.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import com.taskboard.TestcontainersConfiguration;

/** POST /api/tasks のテスト。各テストはロールバックされ、他のテストのデータに影響しない。 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class TaskCreateControllerTest {

    @Autowired
    MockMvc mockMvc;

    private ResultActions postTask(String json) throws Exception {
        return mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void createReturns201AndIsSearchable() throws Exception {
        postTask("""
                {"columnId":1,"title":"登録テスト","description":"説明","priority":1,"dueDate":"2030-01-31"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("登録テスト"))
                .andExpect(jsonPath("$.priority").value(1))
                .andExpect(jsonPath("$.dueDate").value("2030-01-31"));

        mockMvc.perform(get("/api/tasks").param("q", "登録テスト"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("登録テスト"));
    }

    @Test
    void createWithDefaultsUsesMediumPriority() throws Exception {
        postTask("{\"columnId\":1,\"title\":\"既定値テスト\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.priority").value(2))
                .andExpect(jsonPath("$.description").value(""));
    }

    @Test
    void blankTitleIsRejected() throws Exception {
        postTask("{\"columnId\":1,\"title\":\"  \"}").andExpect(status().isBadRequest());
    }

    @Test
    void invalidPriorityIsRejected() throws Exception {
        postTask("{\"columnId\":1,\"title\":\"x\",\"priority\":9}").andExpect(status().isBadRequest());
    }

    @Test
    void unknownColumnIsRejected() throws Exception {
        postTask("{\"columnId\":99999,\"title\":\"x\"}").andExpect(status().isBadRequest());
    }
}
