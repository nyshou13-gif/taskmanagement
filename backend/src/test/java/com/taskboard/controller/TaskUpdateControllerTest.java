package com.taskboard.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.hamcrest.Matchers;
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

/** PATCH /api/tasks/{id}（項目更新・カラム移動・並び替え）のテスト。各テストはロールバックされる。 */
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

    private ResultActions patchJson(long id, String json) throws Exception {
        return mockMvc.perform(patch("/api/tasks/" + id)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void patchChangesAllFields() throws Exception {
        long id = createTask(1, "更新前");
        patchJson(id, """
                {"title":"更新後","description":"新しい説明","priority":3,"dueDate":"2031-02-03"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("更新後"))
                .andExpect(jsonPath("$.description").value("新しい説明"))
                .andExpect(jsonPath("$.priority").value(3))
                .andExpect(jsonPath("$.dueDate").value("2031-02-03"));

        mockMvc.perform(get("/api/tasks/" + id))
                .andExpect(jsonPath("$.title").value("更新後"))
                .andExpect(jsonPath("$.priority").value(3));
    }

    @Test
    void omittedFieldsAreKept() throws Exception {
        long id = createTask(1, "一部更新");
        patchJson(id, "{\"dueDate\":\"2031-02-03\",\"priority\":3}").andExpect(status().isOk());
        patchJson(id, "{\"title\":\"一部更新後\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("一部更新後"))
                .andExpect(jsonPath("$.priority").value(3))
                .andExpect(jsonPath("$.dueDate").value("2031-02-03"));
    }

    @Test
    void patchCanClearDueDate() throws Exception {
        long id = createTask(1, "期限クリア");
        patchJson(id, "{\"dueDate\":\"2031-02-03\"}").andExpect(status().isOk());
        patchJson(id, "{\"dueDate\":null}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").isEmpty());
    }

    @Test
    void patchColumnMovesTaskToEndOfNewColumn() throws Exception {
        long id = createTask(1, "ステータス変更");
        patchJson(id, "{\"columnId\":2}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.columnId").value(2));

        mockMvc.perform(get("/api/tasks").param("columnId", "2").param("q", "ステータス変更"))
                .andExpect(jsonPath("$[0].columnId").value(2));
    }

    @Test
    void patchValidation() throws Exception {
        long id = createTask(1, "検証");
        patchJson(id, "{\"title\":\" \"}").andExpect(status().isBadRequest());
        patchJson(id, "{\"title\":\"" + "a".repeat(101) + "\"}").andExpect(status().isBadRequest());
        patchJson(id, "{\"priority\":9}").andExpect(status().isBadRequest());
        patchJson(id, "{\"position\":-1}").andExpect(status().isBadRequest());
        patchJson(id, "{\"columnId\":99999}").andExpect(status().isBadRequest());
        patchJson(99999, "{\"title\":\"x\"}").andExpect(status().isNotFound());
    }

    @Test
    void positionReordersWithinColumn() throws Exception {
        long a = createTask(3, "並びA");
        long b = createTask(3, "並びB");
        patchJson(b, "{\"columnId\":3,\"position\":0}").andExpect(status().isOk());

        // B を先頭へ移すと、B が先頭・A が末尾になる
        mockMvc.perform(get("/api/board"))
                .andExpect(jsonPath("$[2].tasks[0].id").value((int) b))
                .andExpect(jsonPath("$[2].tasks[-1:].id").value(Matchers.contains((int) a)));
    }

    @Test
    void moveToOtherColumnChangesStatusAndRenumbersSource() throws Exception {
        long id = createTask(1, "列移動");
        patchJson(id, "{\"columnId\":2,\"position\":0}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.columnId").value(2))
                .andExpect(jsonPath("$.position").value(1));

        mockMvc.perform(get("/api/board"))
                .andExpect(jsonPath("$[1].tasks[0].id").value((int) id))
                .andExpect(jsonPath("$[0].tasks[*].position").value(Matchers.contains(1, 2, 3)));
    }
}
