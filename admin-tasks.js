/* ==========================================================================
   AnyBike — admin-tasks.js
   Internal Tasks v8.2
   ========================================================================== */

(function () {
  "use strict";

  const TASK_STAFF = [
    "Andy Gifford",
    "Sean Byrne",
    "Cat Byrne",
    "Sophie Gifford"
  ];

  function getSupabaseClient() {
    if (typeof window.sb !== "undefined") {
      return window.sb;
    }

    if (typeof sb !== "undefined") {
      return sb;
    }

    throw new Error("Supabase client 'sb' was not found.");
  }

  function normaliseNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function escapeHtml(value) {
    if (typeof window.escapeAdminHtml === "function") {
      return window.escapeAdminHtml(value);
    }

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getTaskList(enquiryId) {
    return document.getElementById(
      "deal-task-list-" + normaliseNumber(enquiryId)
    );
  }

  function getTaskBadge(enquiryId) {
    return document.getElementById(
      "deal-task-count-" + normaliseNumber(enquiryId)
    );
  }

  function getTaskForm(enquiryId) {
    return document.getElementById(
      "deal-task-form-" + normaliseNumber(enquiryId)
    );
  }

  function getTaskStatus(enquiryId) {
    return document.getElementById(
      "deal-task-status-" + normaliseNumber(enquiryId)
    );
  }

  function setTaskStatus(enquiryId, message, type) {
    const status = getTaskStatus(enquiryId);

    if (!status) {
      return;
    }

    status.textContent = String(message || "");
    status.className = "deal-task-status";

    if (message) {
      status.classList.add("show");
    }

    if (type === "success") {
      status.classList.add("success");
    }

    if (type === "error") {
      status.classList.add("error");
    }
  }

  function formatTaskDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function formatTaskDateTime(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getTodayDateOnly() {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
  }

  function isTaskOverdue(task) {
    if (task.completed || !task.due_date) {
      return false;
    }

    const dueDate = new Date(task.due_date + "T00:00:00");

    if (Number.isNaN(dueDate.getTime())) {
      return false;
    }

    return dueDate < getTodayDateOnly();
  }

  function getTaskDueText(task) {
    if (!task.due_date) {
      return "";
    }

    const dueDate = new Date(task.due_date + "T00:00:00");

    if (Number.isNaN(dueDate.getTime())) {
      return "";
    }

    if (task.completed) {
      return "Due " + formatTaskDate(task.due_date);
    }

    const today = getTodayDateOnly();

    const difference = Math.round(
      (dueDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
    );

    if (difference === 0) {
      return "Due today";
    }

    if (difference === 1) {
      return "Due tomorrow";
    }

    if (difference === -1) {
      return "1 day overdue";
    }

    if (difference < -1) {
      return Math.abs(difference) + " days overdue";
    }

    return "Due " + formatTaskDate(task.due_date);
  }

  function updateTaskBadge(enquiryId, tasks) {
    const badge = getTaskBadge(enquiryId);

    if (!badge) {
      return;
    }

    const allTasks = Array.isArray(tasks) ? tasks : [];

    const openCount = allTasks.filter(function (task) {
      return !task.completed;
    }).length;

    const overdueCount = allTasks.filter(function (task) {
      return isTaskOverdue(task);
    }).length;

    const completedCount = allTasks.filter(function (task) {
      return task.completed;
    }).length;

    badge.classList.remove(
      "badge-green",
      "badge-red",
      "badge-orange",
      "badge-grey"
    );

    if (overdueCount > 0) {
      badge.textContent =
        overdueCount === 1
          ? "1 Overdue"
          : overdueCount + " Overdue";

      badge.classList.add("badge-red");
      return;
    }

    if (openCount > 0) {
      badge.textContent =
        openCount === 1
          ? "1 Open"
          : openCount + " Open";

      badge.classList.add("badge-orange");
      return;
    }

    if (completedCount > 0) {
      badge.textContent =
        completedCount === 1
          ? "1 Done"
          : completedCount + " Done";

      badge.classList.add("badge-green");
      return;
    }

    badge.textContent = "0 Tasks";
    badge.classList.add("badge-grey");
  }

  function showAddTaskForm(enquiryId) {
    const form = getTaskForm(enquiryId);

    if (!form) {
      return;
    }

    form.classList.add("open");

    const taskInput = document.getElementById(
      "deal-task-name-" + normaliseNumber(enquiryId)
    );

    if (taskInput) {
      setTimeout(function () {
        taskInput.focus();
      }, 50);
    }
  }

  function hideAddTaskForm(enquiryId) {
    const form = getTaskForm(enquiryId);

    if (!form) {
      return;
    }

    form.classList.remove("open");
    resetTaskForm(enquiryId);
  }

  function resetTaskForm(enquiryId) {
    const id = normaliseNumber(enquiryId);

    const taskInput = document.getElementById(
      "deal-task-name-" + id
    );

    const assignedInput = document.getElementById(
      "deal-task-assigned-" + id
    );

    const dueDateInput = document.getElementById(
      "deal-task-due-" + id
    );

    const notesInput = document.getElementById(
      "deal-task-notes-" + id
    );

    if (taskInput) {
      taskInput.value = "";
    }

    if (assignedInput) {
      assignedInput.value = "";
    }

    if (dueDateInput) {
      dueDateInput.value = "";
    }

    if (notesInput) {
      notesInput.value = "";
    }
  }

  async function loadDealTasks(enquiryId) {
    const id = normaliseNumber(enquiryId);
    const list = getTaskList(id);
    const badge = getTaskBadge(id);

    if (!id) {
      return;
    }

    if (list) {
      list.innerHTML = `
        <div class="task-empty">
          Loading internal tasks…
        </div>
      `;
    }

    if (badge) {
      badge.textContent = "Loading";
    }

    try {
      const client = getSupabaseClient();

      const result = await client
        .from("deal_tasks")
        .select(
          "id,enquiry_id,task,assigned_to,due_date,completed,completed_at,notes,created_at"
        )
        .eq("enquiry_id", id)
        .order("completed", {
          ascending: true
        })
        .order("due_date", {
          ascending: true,
          nullsFirst: false
        })
        .order("created_at", {
          ascending: false
        });

      if (result.error) {
        throw result.error;
      }

      const tasks = result.data || [];

      updateTaskBadge(id, tasks);
      renderDealTasks(id, tasks);

    } catch (error) {
      console.error("Deal tasks could not be loaded:", error);

      if (list) {
        list.innerHTML = `
          <div class="task-empty">
            <strong>Tasks could not be loaded.</strong>
            <div>${escapeHtml(error.message || "Unknown error")}</div>
          </div>
        `;
      }

      if (badge) {
        badge.textContent = "Error";
        badge.classList.remove(
          "badge-green",
          "badge-orange",
          "badge-grey"
        );
        badge.classList.add("badge-red");
      }
    }
  }

  function renderDealTasks(enquiryId, tasks) {
    const list = getTaskList(enquiryId);

    if (!list) {
      return;
    }

    if (!tasks.length) {
      list.innerHTML = `
        <div class="task-empty">
          <strong>No internal tasks yet.</strong>
          <div>
            Add a task such as call the seller, request the V5,
            send an invoice or book collection.
          </div>
        </div>
      `;

      return;
    }

    list.innerHTML = tasks.map(function (task) {
      const taskId = normaliseNumber(task.id);
      const overdue = isTaskOverdue(task);
      const completed = Boolean(task.completed);

      const cardClasses = [
        "task-card",
        completed ? "task-complete" : "",
        overdue ? "task-overdue" : ""
      ].filter(Boolean).join(" ");

      const dueText = getTaskDueText(task);

      return `
        <div
          class="${cardClasses}"
          id="deal-task-card-${taskId}">

          <div class="task-top">

            <div class="task-title">

              <input
                type="checkbox"
                ${completed ? "checked" : ""}
                onchange="toggleDealTask(
                  ${taskId},
                  ${normaliseNumber(enquiryId)},
                  this.checked
                );">

              <strong>
                ${escapeHtml(task.task)}
              </strong>

            </div>

            <div class="task-actions">

              <button
                type="button"
                onclick="editDealTask(
                  ${taskId},
                  ${normaliseNumber(enquiryId)}
                );return false;">
                ✏ Edit
              </button>

              <button
                type="button"
                class="task-delete"
                onclick="deleteDealTask(
                  ${taskId},
                  ${normaliseNumber(enquiryId)}
                );return false;">
                🗑 Delete
              </button>

            </div>

          </div>

          <div class="task-meta">

            ${
              task.assigned_to
                ? `
                  <span>
                    👤 ${escapeHtml(task.assigned_to)}
                  </span>
                `
                : `
                  <span>
                    👤 Unassigned
                  </span>
                `
            }

            ${
              dueText
                ? `
                  <span class="task-due">
                    📅 ${escapeHtml(dueText)}
                  </span>
                `
                : ""
            }

            ${
              completed && task.completed_at
                ? `
                  <span>
                    ✅ Completed ${escapeHtml(
                      formatTaskDateTime(task.completed_at)
                    )}
                  </span>
                `
                : ""
            }

          </div>

          ${
            task.notes
              ? `
                <div class="task-notes">
                  ${escapeHtml(task.notes)}
                </div>
              `
              : ""
          }

        </div>
      `;
    }).join("");
  }

  async function saveDealTask(enquiryId) {
    const id = normaliseNumber(enquiryId);

    const taskInput = document.getElementById(
      "deal-task-name-" + id
    );

    const assignedInput = document.getElementById(
      "deal-task-assigned-" + id
    );

    const dueDateInput = document.getElementById(
      "deal-task-due-" + id
    );

    const notesInput = document.getElementById(
      "deal-task-notes-" + id
    );

    const taskName = taskInput
      ? taskInput.value.trim()
      : "";

    const assignedTo = assignedInput
      ? assignedInput.value.trim()
      : "";

    const dueDate = dueDateInput
      ? dueDateInput.value
      : "";

    const notes = notesInput
      ? notesInput.value.trim()
      : "";

    if (!taskName) {
      alert("Enter the task that needs to be completed.");

      if (taskInput) {
        taskInput.focus();
      }

      return;
    }

    setTaskStatus(id, "Saving task…", "");

    try {
      const client = getSupabaseClient();

      const result = await client
        .from("deal_tasks")
        .insert({
          enquiry_id: id,
          task: taskName,
          assigned_to: assignedTo || null,
          due_date: dueDate || null,
          completed: false,
          completed_at: null,
          notes: notes || null
        });

      if (result.error) {
        throw result.error;
      }

      hideAddTaskForm(id);
      await loadDealTasks(id);

      setTaskStatus(
        id,
        "Task added successfully.",
        "success"
      );

      if (typeof window.loadDealTimeline === "function") {
        window.loadDealTimeline(id);
      }

    } catch (error) {
      console.error("Task could not be saved:", error);

      setTaskStatus(
        id,
        "Task could not be saved: " +
          (error.message || "Unknown error"),
        "error"
      );
    }
  }

  async function toggleDealTask(taskId, enquiryId, completed) {
    const id = normaliseNumber(enquiryId);

    const card = document.getElementById(
      "deal-task-card-" + normaliseNumber(taskId)
    );

    if (card) {
      card.style.opacity = ".55";
      card.style.pointerEvents = "none";
    }

    try {
      const client = getSupabaseClient();

      const result = await client
        .from("deal_tasks")
        .update({
          completed: Boolean(completed),
          completed_at: completed
            ? new Date().toISOString()
            : null
        })
        .eq("id", normaliseNumber(taskId))
        .eq("enquiry_id", id);

      if (result.error) {
        throw result.error;
      }

      await loadDealTasks(id);

      setTaskStatus(
        id,
        completed
          ? "Task completed."
          : "Task reopened.",
        "success"
      );

      if (typeof window.loadDealTimeline === "function") {
        window.loadDealTimeline(id);
      }

    } catch (error) {
      console.error("Task status could not be updated:", error);

      if (card) {
        card.style.opacity = "";
        card.style.pointerEvents = "";
      }

      alert(
        "Task status could not be updated: " +
          (error.message || "Unknown error")
      );

      await loadDealTasks(id);
    }
  }
    async function getDealTaskRecord(taskId, enquiryId) {
    const client = getSupabaseClient();

    const result = await client
      .from("deal_tasks")
      .select(
        "id,enquiry_id,task,assigned_to,due_date,completed,completed_at,notes,created_at"
      )
      .eq("id", normaliseNumber(taskId))
      .eq("enquiry_id", normaliseNumber(enquiryId))
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error("Task was not found.");
    }

    return result.data;
  }

  async function editDealTask(taskId, enquiryId) {
    let task;

    try {
      task = await getDealTaskRecord(
        taskId,
        enquiryId
      );
    } catch (error) {
      alert(
        "Task could not be opened: " +
          (error.message || "Unknown error")
      );

      return;
    }

    const newTaskName = prompt(
      "Task",
      task.task || ""
    );

    if (newTaskName === null) {
      return;
    }

    const cleanedTaskName = newTaskName.trim();

    if (!cleanedTaskName) {
      alert("The task cannot be empty.");
      return;
    }

    const newAssignedTo = prompt(
      "Assigned to\n\n" +
        "Available staff:\n" +
        TASK_STAFF.join("\n") +
        "\n\nLeave blank for unassigned.",
      task.assigned_to || ""
    );

    if (newAssignedTo === null) {
      return;
    }

    const newDueDate = prompt(
      "Due date in YYYY-MM-DD format.\n\n" +
        "Leave blank for no due date.",
      task.due_date || ""
    );

    if (newDueDate === null) {
      return;
    }

    const cleanedDueDate = newDueDate.trim();

    if (
      cleanedDueDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(cleanedDueDate)
    ) {
      alert("Use the date format YYYY-MM-DD.");
      return;
    }

    const newNotes = prompt(
      "Task notes",
      task.notes || ""
    );

    if (newNotes === null) {
      return;
    }

    try {
      const client = getSupabaseClient();

      const result = await client
        .from("deal_tasks")
        .update({
          task: cleanedTaskName,
          assigned_to: newAssignedTo.trim() || null,
          due_date: cleanedDueDate || null,
          notes: newNotes.trim() || null
        })
        .eq("id", normaliseNumber(taskId))
        .eq("enquiry_id", normaliseNumber(enquiryId));

      if (result.error) {
        throw result.error;
      }

      await loadDealTasks(enquiryId);

      setTaskStatus(
        enquiryId,
        "Task updated successfully.",
        "success"
      );

      if (typeof window.loadDealTimeline === "function") {
        window.loadDealTimeline(enquiryId);
      }

    } catch (error) {
      console.error("Task could not be updated:", error);

      alert(
        "Task could not be updated: " +
          (error.message || "Unknown error")
      );
    }
  }

  async function deleteDealTask(taskId, enquiryId) {
    let task;

    try {
      task = await getDealTaskRecord(
        taskId,
        enquiryId
      );
    } catch (error) {
      alert(
        "Task could not be found: " +
          (error.message || "Unknown error")
      );

      return;
    }

    const confirmed = confirm(
      'Delete the task "' +
        task.task +
        '"?\n\n' +
        "This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const card = document.getElementById(
      "deal-task-card-" + normaliseNumber(taskId)
    );

    if (card) {
      card.style.opacity = ".45";
      card.style.pointerEvents = "none";
    }

    try {
      const client = getSupabaseClient();

      const result = await client
        .from("deal_tasks")
        .delete()
        .eq("id", normaliseNumber(taskId))
        .eq("enquiry_id", normaliseNumber(enquiryId));

      if (result.error) {
        throw result.error;
      }

      await loadDealTasks(enquiryId);

      setTaskStatus(
        enquiryId,
        "Task deleted.",
        "success"
      );

      if (typeof window.loadDealTimeline === "function") {
        window.loadDealTimeline(enquiryId);
      }

    } catch (error) {
      console.error("Task could not be deleted:", error);

      if (card) {
        card.style.opacity = "";
        card.style.pointerEvents = "";
      }

      alert(
        "Task could not be deleted: " +
          (error.message || "Unknown error")
      );
    }
  }

  function buildDealTaskStaffOptions(selectedValue) {
    const selected = String(selectedValue || "");

    const emptyOption = `
      <option value="">
        Unassigned
      </option>
    `;

    const staffOptions = TASK_STAFF
      .map(function (staffName) {
        return `
          <option
            value="${escapeHtml(staffName)}"
            ${selected === staffName ? "selected" : ""}>
            ${escapeHtml(staffName)}
          </option>
        `;
      })
      .join("");

    return emptyOption + staffOptions;
  }

  window.loadDealTasks = loadDealTasks;
  window.showAddTaskForm = showAddTaskForm;
  window.hideAddTaskForm = hideAddTaskForm;
  window.saveDealTask = saveDealTask;
  window.toggleDealTask = toggleDealTask;
  window.editDealTask = editDealTask;
  window.deleteDealTask = deleteDealTask;
  window.buildDealTaskStaffOptions = buildDealTaskStaffOptions;

})();