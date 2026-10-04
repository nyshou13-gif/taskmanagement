// TaskBoard モック（画面イメージ確認用・状態はメモリ上のみ）

const MAX_LEN = 100;

const PRIORITY = {
  high: { label: "高", rank: 0 },
  mid: { label: "中", rank: 1 },
  low: { label: "低", rank: 2 },
};

const state = {
  columns: [
    {
      id: "todo",
      title: "未着手",
      tasks: [
        { id: "t1", title: "要件を整理する", description: "", priority: "mid", due: "2026-10-20" },
        { id: "t2", title: "画面モックを作る", description: "ボード画面とモーダル", priority: "high", due: "2026-10-12" },
        { id: "t3", title: "DB設計を見直す", description: "", priority: "low", due: "" },
      ],
    },
    {
      id: "doing",
      title: "作業中",
      tasks: [
        { id: "t4", title: "API仕様を書く", description: "", priority: "high", due: "2026-10-15" },
        { id: "t5", title: "README更新", description: "", priority: "low", due: "2026-10-30" },
      ],
    },
    {
      id: "done",
      title: "完了",
      tasks: [
        { id: "t6", title: "リポジトリ作成", description: "", priority: "mid", due: "2026-10-01" },
      ],
    },
  ],
};

let nextTaskId = 7;
let editing = null; // { taskId, columnId } 編集中、null なら新規作成

const board = document.getElementById("board");

// --- 描画 ---

function render() {
  board.innerHTML = "";
  state.columns.forEach((col) => board.appendChild(renderColumn(col)));
}

function renderColumn(col) {
  const colEl = document.createElement("section");
  colEl.className = "column";

  const header = document.createElement("div");
  header.className = "column-header";
  header.innerHTML = `<h2 class="column-title"></h2><span class="column-count"></span>`;
  header.querySelector(".column-title").textContent = col.title;
  header.querySelector(".column-count").textContent = col.tasks.length;
  colEl.appendChild(header);

  // 並び替え（押した時点で1回だけ並べ替える。以降もDnDで自由に変更可能）
  const sortBar = document.createElement("div");
  sortBar.className = "sort-bar";
  sortBar.innerHTML = `<span class="sort-label">並び替え</span>`;
  sortBar.appendChild(makeSortButton("優先度順", () => sortColumn(col, byPriority)));
  sortBar.appendChild(makeSortButton("期限順", () => sortColumn(col, byDue)));
  colEl.appendChild(sortBar);

  const tasksEl = document.createElement("div");
  tasksEl.className = "tasks";
  col.tasks.forEach((task) => tasksEl.appendChild(renderTask(task, col.id)));
  setupDropTarget(tasksEl, col.id);
  colEl.appendChild(tasksEl);

  if (col.id === "todo") {
    const addBtn = document.createElement("button");
    addBtn.className = "add-task-btn";
    addBtn.textContent = "＋タスク追加";
    addBtn.addEventListener("click", () => openTaskModal(null));
    colEl.appendChild(addBtn);
  }

  return colEl;
}

function makeSortButton(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sort-btn";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function renderTask(task, columnId) {
  const el = document.createElement("div");
  el.className = "task";
  el.draggable = true;
  el.dataset.taskId = task.id;

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const pri = document.createElement("span");
  pri.className = `badge priority-${task.priority}`;
  pri.textContent = `優先度: ${PRIORITY[task.priority].label}`;

  const due = document.createElement("span");
  due.className = "task-due";
  due.textContent = task.due ? `期限: ${task.due}` : "期限: なし";

  meta.append(pri, due);
  el.append(title, meta);

  el.addEventListener("click", () => openTaskModal({ taskId: task.id, columnId }));
  el.addEventListener("dragstart", (e) => {
    el.classList.add("dragging");
    e.dataTransfer.setData("text/plain", JSON.stringify({ taskId: task.id, fromColumnId: columnId }));
    e.dataTransfer.effectAllowed = "move";
  });
  el.addEventListener("dragend", () => el.classList.remove("dragging"));

  return el;
}

// --- ドラッグ＆ドロップ（カラム内の自由な並び替え・カラム間の移動） ---

function setupDropTarget(tasksEl, columnId) {
  tasksEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    tasksEl.classList.add("drag-over");
  });
  tasksEl.addEventListener("dragleave", (e) => {
    if (!tasksEl.contains(e.relatedTarget)) tasksEl.classList.remove("drag-over");
  });
  tasksEl.addEventListener("drop", (e) => {
    e.preventDefault();
    tasksEl.classList.remove("drag-over");
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch {
      return; // 不正なドロップは元の位置のまま
    }
    if (!data || !data.taskId) return;
    moveTask(data.taskId, data.fromColumnId, columnId, tasksEl, e.clientY);
  });
}

function moveTask(taskId, fromColumnId, toColumnId, tasksEl, y) {
  const from = findColumn(fromColumnId);
  const to = findColumn(toColumnId);
  if (!from || !to) return;

  const idx = from.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return;
  const [task] = from.tasks.splice(idx, 1);

  const afterEl = getDragAfterElement(tasksEl, y);
  if (!afterEl) {
    to.tasks.push(task);
  } else {
    const insertAt = to.tasks.findIndex((t) => t.id === afterEl.dataset.taskId);
    to.tasks.splice(insertAt, 0, task);
  }
  render();
}

function getDragAfterElement(container, y) {
  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
  container.querySelectorAll(".task:not(.dragging)").forEach((child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) closest = { offset, element: child };
  });
  return closest.element;
}

// --- 並び替え（優先度順／期限順） ---

const byPriority = (a, b) => PRIORITY[a.priority].rank - PRIORITY[b.priority].rank;
const byDue = (a, b) => {
  if (!a.due && !b.due) return 0;
  if (!a.due) return 1; // 期限なしは末尾
  if (!b.due) return -1;
  return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
};

function sortColumn(col, compare) {
  col.tasks.sort(compare); // Array.prototype.sort は安定ソート
  render();
}

function findColumn(id) {
  return state.columns.find((c) => c.id === id);
}

// --- タスク作成／編集モーダル ---

const taskModal = document.getElementById("task-modal");
const taskForm = document.getElementById("task-form");
const taskModalTitle = document.getElementById("task-modal-title");
const taskTitleInput = document.getElementById("task-title");
const taskTitleError = document.getElementById("task-title-error");
const taskDescInput = document.getElementById("task-desc");
const taskDueInput = document.getElementById("task-due");
const taskDeleteBtn = document.getElementById("task-delete-btn");

function setPriority(value) {
  taskForm.querySelector(`input[name="priority"][value="${value}"]`).checked = true;
}

function getPriority() {
  return taskForm.querySelector('input[name="priority"]:checked').value;
}

function openTaskModal(target) {
  editing = target;
  taskTitleError.textContent = "";

  if (target) {
    const task = findColumn(target.columnId).tasks.find((t) => t.id === target.taskId);
    taskModalTitle.textContent = "タスクを編集";
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description;
    setPriority(task.priority);
    taskDueInput.value = task.due;
    taskDeleteBtn.classList.remove("hidden");
  } else {
    taskModalTitle.textContent = "タスクを作成";
    taskForm.reset();
    setPriority("mid");
    taskDeleteBtn.classList.add("hidden");
  }

  taskModal.classList.remove("hidden");
  taskTitleInput.focus();
}

function closeTaskModal() {
  taskModal.classList.add("hidden");
  editing = null;
}

function validateTitle(value) {
  const v = value.trim();
  if (v.length === 0) return "タイトルを入力してください";
  if (v.length > MAX_LEN) return `${MAX_LEN}文字以内で入力してください`;
  return null;
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const error = validateTitle(taskTitleInput.value);
  if (error) {
    taskTitleError.textContent = error;
    return;
  }
  const values = {
    title: taskTitleInput.value.trim(),
    description: taskDescInput.value,
    priority: getPriority(),
    due: taskDueInput.value,
  };

  if (editing) {
    const task = findColumn(editing.columnId).tasks.find((t) => t.id === editing.taskId);
    Object.assign(task, values);
  } else {
    // 新規タスクは「未着手」の末尾に追加
    findColumn("todo").tasks.push({ id: `t${nextTaskId++}`, ...values });
  }
  closeTaskModal();
  render();
});

document.getElementById("task-cancel-btn").addEventListener("click", closeTaskModal);
taskModal.addEventListener("click", (e) => {
  if (e.target === taskModal) closeTaskModal();
});

taskDeleteBtn.addEventListener("click", () => {
  const target = editing;
  const task = findColumn(target.columnId).tasks.find((t) => t.id === target.taskId);
  closeTaskModal();
  openConfirmModal(task, target.columnId);
});

// --- 削除確認ダイアログ ---

const confirmModal = document.getElementById("confirm-modal");
let deleting = null;

function openConfirmModal(task, columnId) {
  deleting = { taskId: task.id, columnId };
  document.getElementById("confirm-task-title").textContent = task.title;
  confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
  confirmModal.classList.add("hidden");
  deleting = null;
}

document.getElementById("confirm-cancel-btn").addEventListener("click", closeConfirmModal);
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) closeConfirmModal();
});
document.getElementById("confirm-ok-btn").addEventListener("click", () => {
  const target = deleting;
  closeConfirmModal();
  if (!target) return;
  const col = findColumn(target.columnId);
  col.tasks = col.tasks.filter((t) => t.id !== target.taskId);
  render();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!confirmModal.classList.contains("hidden")) closeConfirmModal();
  else if (!taskModal.classList.contains("hidden")) closeTaskModal();
});

render();
