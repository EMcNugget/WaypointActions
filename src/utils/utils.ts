import type { Action, EnumOptions, ITask } from "../types";
import { options } from "./actions";
import { useTasks } from "./hooks";

const { tasks } = useTasks();

export function createOption(
  index: number,
  name: number,
  value: number | string | boolean,
  auto?: boolean,
  enabled?: boolean,
): Action<typeof value> {
  let actionNumber = tasks.value.length + 1;

  if (index != null && index < tasks.value.length) {
    actionNumber = index;
  }

  const option = {
    auto: auto ?? false,
    enabled: enabled ?? false,
    id: "WrappedAction",
    number: actionNumber,
    params: {
      action: {
        id: "Option",
        params: {
          name,
          value,
        },
      },
    },
  } as const;
  return option;
}

export function createTask(
  name: EnumOptions,
  value: object,
  index?: number,
  auto?: boolean,
  enabled?: boolean,
): Action<object> {
  let actionNumber = tasks.value.length + 1;

  if (index != null && index < tasks.value.length) {
    actionNumber = index;
  }

  const option = {
    auto: auto ?? false,
    enabled: enabled ?? false,
    id: "WrappedAction",
    number: actionNumber,
    params: {
      action: {
        id: name,
        params: value,
      },
    },
  } as const;
  return option;
}

export function findById(data: any[], id: number): any {
  for (const item of data) {
    if (Array.isArray(item)) {
      for (const arr of item) {
        const foundItem = findById(arr.value, id);
        if (foundItem != null) {
          return { item: foundItem, parent: arr };
        }
      }
    } else if (item.value === id) {
      return item;
    }
  }
  return null;
}

export function setFormation(value: number) {
  const parent = findById(options[5].options as any[], value);
  const form = {
    formationIndex: parent.parent.key as number,
    name: 5,
    value,
    variantIndex: parent.item.key as number,
  };
  return form;
}

export const defaultTask: ITask = {
  auto: false,
  enabled: false,
  id: "WrappedAction",
  number: 1,
  params: {
    action: {
      id: "",
      params: {},
    },
  },
};