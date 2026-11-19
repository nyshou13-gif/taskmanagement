package com.taskboard.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * PATCH /api/tasks/{id} のリクエスト。指定した項目だけを更新する（省略した項目は変更しない）。
 *
 * <ul>
 * <li>dueDate: 省略=変更なし / null=期限をクリア / 日付=設定
 * （JSONで「省略」と「null」を区別する必要があるため、setter で指定の有無を記録する）</li>
 * <li>columnId・position: どちらかを指定すると移動。position は移動先カラム内の0始まりの位置で、
 * 省略時はカラムの末尾</li>
 * </ul>
 */
public class UpdateTaskRequest {

    private Long columnId;

    @Pattern(regexp = "(?s).*\\S.*")
    @Size(max = 100)
    private String title;

    private String description;

    @Min(1)
    @Max(3)
    private Integer priority;

    private LocalDate dueDate;
    private boolean dueDatePresent;

    @Min(0)
    private Integer position;

    public Long getColumnId() {
        return columnId;
    }

    public void setColumnId(Long columnId) {
        this.columnId = columnId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
        this.dueDatePresent = true;
    }

    /** JSONに dueDate が含まれていたか（null を含む）。 */
    public boolean isDueDatePresent() {
        return dueDatePresent;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }
}
