package com.taskboard.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import com.taskboard.TestcontainersConfiguration;

/** PUT /api/tasks/{id} と PUT /api/tasks/{id}/move のテスト。各テストはロールバックされる。 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class TaskUpdateControllerTest {

    @Autowired
    MockMvc mockMvc;

    private long createTask(long columnId, String title) throws Exception {
        String body = mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                .content("{\"columnId\":" + columnId + ",\"title\":\"" + title + "\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"id\":(\\d+)").matcher(body);
        m.find();
        return Long.parseLong(m.group(1));
    }

    private ResultActions putJson(String url, String json) throws Exception {
        return mockMvc.perform(put(url).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void updateChangesAllFields() throws Exception {
        long id = createTask(1, "更新前");
        putJson("/api/tasks/" + id, """
                {"columnId":1,"title":"更新後","description":"新しい説明","priority":1,"dueDate":"2031-02-03"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("更新後"))
                .andExpect(jsonPath("$.description").value("新しい説明"))
                .andExpect(jsonPath("$.priority").value(1))
                .andExpect(jsonPath("$.dueDate").value("2031-02-03"));

        mockMvc.perform(get("/api/tasks/" + id))
                .andExpect(jsonPath("$.title").value("更新後"))
                .andExpect(jsonPath("$.priority").value(1));
    }

    @Test
    void updateCanClearDueDate() throws Exception {
        long id = createTask(1, "期限クリア");
        putJson("/api/tasks/" + id, "{\"columnId\":1,\"title\":\"期限クリア\",\"priority\":2,\"dueDate\":\"2031-02-03\"}")
                .andExpect(status().isOk());
        putJson("/api/tasks/" + id, "{\"columnId\":1,\"title\":\"期限クリア\",\"priority\":2,\"dueDate\":null}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").isEmpty());
    }

    @Test
    void updateColumnMovesTaskToEndOfNewColumn() throws Exception {
        long id = createTask(1, "ステータス変更");
        putJson("/api/tasks/" + id, "{\"columnId\":2,\"title\":\"ステータス変更\",\"priority\":2}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.columnId").value(2));

        mockMvc.perform(get("/api/tasks").param("columnId", "2").param("q", "ステータス変更"))
                .andExpect(jsonPath("$[0].columnId").value(2));
    }

    @Test
    void updateValidation() throws Exception {
        long id = createTask(1, "検証");
        putJson("/api/tasks/" + id, "{\"columnId\":1,\"title\":\" \",\"priority\":2}").andExpect(status().isBadRequest());
        putJson("/api/tasks/" + id, "{\"columnId\":1,\"title\":\"x\",\"priority\":9}").andExpect(status().isBadRequest());
        putJson("/api/tasks/" + id, "{\"columnId\":99999,\"title\":\"x\",\"priority\":2}")
                .andExpect(status().isBadRequest());
        putJson("/api/tasks/99999", "{\"columnId\":1,\"title\":\"x\",\"priority\":2}").andExpect(status().isNotFound());
    }

    @Test
    void moveReordersWithinColumn() throws Exception {
        long a = createTask(3, "並びA");
        long b = createTask(3, "並びB");
        putJson("/api/tasks/" + b + "/move", "{\"columnId\":3,\"position\":0}").andExpect(status().isOk());

        // B を先頭へ移すと、B が先頭・A が末尾になる
        mockMvc.perform(get("/api/board"))
                .andExpect(jsonPath("$[2].tasks[0].id").value((int) b))
                .andExpect(jsonPath("$[2].tasks[-1:].id").value(org.hamcrest.Matchers.contains((int) a)));
    }

    @Test
    void moveToOtherColumnChangesStatusAndRenumbersSource() throws Exception {
        long id = createTask(1, "列移動");
        putJson("/api/tasks/" + id + "/move", "{\"columnId\":2,\"position\":0}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.columnId").value(2))
                .andExpect(jsonPath("$.position").value(1));

        mockMvc.perform(get("/api/board"))
                .andExpect(jsonPath("$[1].tasks[0].id").value((int) id))
                .andExpect(jsonPath("$[0].tasks[*].position").value(org.hamcrest.Matchers.contains(1, 2, 3)));
    }

    @Test
    void moveValidation() throws Exception {
        long id = createTask(1, "移動検証");
        putJson("/api/tasks/" + id + "/move", "{\"columnId\":99999,\"position\":0}").andExpect(status().isBadRequest());
        putJson("/api/tasks/" + id + "/move", "{\"columnId\":1,\"position\":-1}").andExpect(status().isBadRequest());
        putJson("/api/tasks/99999/move", "{\"columnId\":1,\"position\":0}").andExpect(status().isNotFound());
    }
}
