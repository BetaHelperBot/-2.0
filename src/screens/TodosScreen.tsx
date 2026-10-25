import React, { useState } from "react";
import {
  CheckSquare,
  Check,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  MinusCircle,
  Circle,
  X,
} from "lucide-react";
import { Todo, TodoPriority, STORAGE_KEYS, setLocalItem } from "../lib/storage.ts";
import { parseDueDate, getSmartMessage } from "../lib/dateParser.ts";
import { Toast } from "../components/Toast.tsx";
import { ConfirmDialog } from "../components/ConfirmDialog.tsx";

const PRIORITIES: { id: TodoPriority; label: string; color: string; icon: any }[] = [
  { id: "high", label: "Важно", color: "#f43f5e", icon: AlertCircle },
  { id: "medium", label: "Обычно", color: "#f59e0b", icon: MinusCircle },
  { id: "low", label: "Когда-нибудь", color: "#10b981", icon: Circle },
];

function getPriorityMeta(id: TodoPriority) {
  return PRIORITIES.find((p) => p.id === id) ?? PRIORITIES[1];
}

type Props = {
  todos: Todo[];
  onChange: (updated: Todo[]) => void;
};

export function TodosScreen({ todos, onChange }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [toastMsg, setToastMsg] = useState("");
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [showClearDoneDialog, setShowClearDoneDialog] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const handleAdd = () => {
    if (!text.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      text: text.trim(),
      done: false,
      priority,
      createdAt: Date.now(),
      dueDate: dueDate.trim() || undefined,
    };

    const updated = [newTodo, ...todos];
    onChange(updated);
    setLocalItem(STORAGE_KEYS.TODOS, updated);

    // Check due date for smart notification
    const parsedDate = newTodo.dueDate ? parseDueDate(newTodo.dueDate) : null;
    if (parsedDate) {
      const smartMsg = getSmartMessage(newTodo.text);
      showToast(`${smartMsg} (напоминание создано)`);
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } else {
      showToast("Задача добавлена");
    }

    setText("");
    setPriority("medium");
    setDueDate("");
    setModalVisible(false);
  };

  const toggleDone = (id: string) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    onChange(updated);
    setLocalItem(STORAGE_KEYS.TODOS, updated);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const confirmDeleteTodo = () => {
    if (!todoToDelete) return;
    const updated = todos.filter((t) => t.id !== todoToDelete.id);
    onChange(updated);
    setLocalItem(STORAGE_KEYS.TODOS, updated);
    setTodoToDelete(null);
    showToast("Задача удалена");
  };

  const confirmClearDone = () => {
    const updated = todos.filter((t) => !t.done);
    onChange(updated);
    setLocalItem(STORAGE_KEYS.TODOS, updated);
    setShowClearDoneDialog(false);
    showToast("Выполненные задачи удалены");
  };

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const doneCount = todos.filter((t) => t.done).length;
  const totalCount = todos.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative select-none">
      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="px-4 pt-3 pb-1">
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
          <div className="text-right text-xs text-slate-500 font-medium">
            {doneCount} / {totalCount} выполнено
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-4 py-2">
        {(["all", "active", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === f
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {f === "all" ? "Все" : f === "active" ? "Активные" : "Готово"}
          </button>
        ))}

        {doneCount > 0 && (
          <button
            onClick={() => setShowClearDoneDialog(true)}
            className="ml-auto p-1.5 text-rose-400 hover:text-rose-500 active:scale-95 transition-all cursor-pointer"
            title="Очистить выполненные"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-28 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center">
              <CheckSquare className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              {filter === "done"
                ? "Нет выполненных задач"
                : filter === "active"
                ? "Все задачи выполнены! 🎉"
                : "Нет задач"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {filter === "all" ? "Нажмите «+» чтобы добавить первую" : ""}
            </div>
          </div>
        ) : (
          filtered.map((todo) => {
            const p = getPriorityMeta(todo.priority);
            const PIcon = p.icon;

            return (
              <div
                key={todo.id}
                onClick={() => toggleDone(todo.id)}
                className={`bg-white dark:bg-[#141414] rounded-2xl p-3.5 flex items-start gap-3 shadow-xs border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer ${
                  todo.done ? "opacity-60" : ""
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                    todo.done
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-400 bg-transparent"
                  }`}
                >
                  {todo.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold leading-snug mb-1.5 ${
                      todo.done
                        ? "line-through text-slate-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {todo.text}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                      style={{ backgroundColor: `${p.color}20`, color: p.color }}
                    >
                      <PIcon className="w-3 h-3" />
                      <span>{p.label}</span>
                    </span>

                    {todo.dueDate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{todo.dueDate}</span>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTodoToDelete(todo);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-400 active:scale-90 cursor-pointer"
                  title="Удалить задачу"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setModalVisible(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
        title="Добавить задачу"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Add Task Modal */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#161616] rounded-t-3xl p-6 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom duration-150 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 mb-2">
              <h3 className="font-bold text-base">Новая задача</h3>
              <button
                onClick={() => setModalVisible(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              placeholder="Что нужно сделать?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              autoFocus
              className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none mb-4 resize-none border border-slate-200 dark:border-slate-800 focus:border-emerald-500"
            />

            <div className="text-xs font-bold text-slate-500 mb-2">Приоритет</div>
            <div className="flex gap-2 mb-4">
              {PRIORITIES.map((p) => {
                const PIcon = p.icon;
                const isSelected = priority === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                    style={{
                      backgroundColor: isSelected ? p.color : undefined,
                    }}
                  >
                    <PIcon className="w-3.5 h-3.5" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-bold text-slate-500 mb-1.5">
              Срок (необязательно)
            </div>
            <div className="flex items-center gap-2 border-b-2 border-emerald-500 pb-2 mb-6">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="например: завтра, 20 октября или сегодня"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all shadow-md cursor-pointer ${
                text.trim()
                  ? "bg-emerald-600 hover:bg-emerald-500 active:scale-98"
                  : "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed opacity-60"
              }`}
            >
              ДОБАВИТЬ ЗАДАЧУ
            </button>
          </div>
        </div>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      {/* Delete single todo dialog */}
      <ConfirmDialog
        visible={!!todoToDelete}
        title="Удалить задачу?"
        message={
          todoToDelete
            ? `Вы уверены, что хотите удалить «${todoToDelete.text}»?`
            : "Задача будет удалена."
        }
        confirmText="УДАЛИТЬ"
        cancelText="ОТМЕНА"
        isDestructive={true}
        onCancel={() => setTodoToDelete(null)}
        onConfirm={confirmDeleteTodo}
      />

      {/* Clear all completed todos dialog */}
      <ConfirmDialog
        visible={showClearDoneDialog}
        title="Очистить выполненные?"
        message="Будут удалены все завершённые задачи."
        confirmText="ОЧИСТИТЬ"
        cancelText="ОТМЕНА"
        isDestructive={true}
        onCancel={() => setShowClearDoneDialog(false)}
        onConfirm={confirmClearDone}
      />
    </div>
  );
}
