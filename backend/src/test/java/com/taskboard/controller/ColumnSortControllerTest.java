package com.taskboard.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.hamcrest.Matchers;
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

/** POST /api/columns/{id}/sort のテスト。各テストはロールバックされる。 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class ColumnSortControllerTest {

    @Autowired
    MockMvc mockMvc;

    private void create(String json) throws Exception {
        mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated());
    }

    /** 完了カラム(3)は初期データが無い前提ではないため、並び替え対象は自分で作ったタスクだけを見る。 */
    @Test
    void sortByPriorityPutsHighFirstAndIsStable() throws Exception {
        create("{\"columnId\":3,\"title\":\"sortP-低\",\"priority\":1}");
        create("{\"columnId\":3,\"title\":\"sortP-高1\",\"priority\":3}");
        create("{\"columnId\":3,\"title\":\"sortP-中\",\"priority\":2}");
        create("{\"columnId\":3,\"title\":\"sortP-高2\",\"priority\":3}");

        mockMvc.perform(post("/api/columns/3/sort").param("by", "priority"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tasks").param("columnId", "3").param("q", "sortP-"))
                .andExpect(jsonPath("$[*].title")
                        .value(Matchers.contains("sortP-高1", "sortP-高2", "sortP-中", "sortP-低")));
    }

    @Test
    void sortByDueDatePutsNoDueDateLast() throws Exception {
        create("{\"columnId\":3,\"title\":\"sortD-なし\"}");
        create("{\"columnId\":3,\"title\":\"sortD-遠い\",\"dueDate\":\"2040-01-01\"}");
        create("{\"columnId\":3,\"title\":\"sortD-近い\",\"dueDate\":\"2035-01-01\"}");

        mockMvc.perform(post("/api/columns/3/sort").param("by", "due_date"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tasks").param("columnId", "3").param("q", "sortD-"))
                .andExpect(jsonPath("$[*].title")
                        .value(Matchers.contains("sortD-近い", "sortD-遠い", "sortD-なし")));
    }

    @Test
    void invalidRequestsAreRejected() throws Exception {
        mockMvc.perform(post("/api/columns/3/sort").param("by", "title"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/columns/3/sort")).andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/columns/99999/sort").param("by", "priority"))
                .andExpect(status().isBadRequest());
    }
}
