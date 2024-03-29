<template>
  <n-form-item label="Type" label-placement="left">
    <n-select class="w-full" v-model:value="actionType" :options="taskOptions" />
  </n-form-item>
  <n-form-item label="Action" label-placement="left">
    <n-select v-model:value="subActionOptions" :options="actionOptions" />
  </n-form-item>
  <div class="flex flex-row justify-between">
    <n-form-item label="Number" label-placement="left">
      <n-input-number v-model:value="selTask" :min="selTaskIndex[0]" :max="selTaskIndex.length" />
    </n-form-item>
    <n-form-item label="Enabled" label-placement="left">
      <n-checkbox v-model:checked="enabled" />
    </n-form-item>
  </div>
  <n-form-item label="Name" label-placement="left">
    <n-input type="text" v-model:value="name" placeholder="Name..." />
  </n-form-item>
  <div class="flex flex-row justify-between">
    <n-button @click="conditionModal = true" class="bg-card" tertiary size="small"
      >Condition</n-button
    >
    <n-button @click="stopConditionModal = true" class="bg-card" tertiary size="small"
      >Stop Condition</n-button
    >
  </div>
  <div
    :class="{
      'mt-5 border-t border-white border-solid border-1': ![
        -1,
        'NoTask',
        'NoEnrouteTask',
        'NoAction',
      ].includes(subActionOptions),
    }"
  >
    <div class="mt-5">
      <option-select
        v-if="Object.values(OptionName).some((v) => v === subActionOptions)"
        :sel-task-data="selTaskData"
        :sub-action-options="subActionOptions"
        :unit-type="unitType"
      />
      <command-select
        v-if="Object.values(PerformCommand).some((v) => v === subActionOptions)"
        :sel-task="selTask"
        :sub-action-options="subActionOptions"
        :unit-type="unitType"
      />
      <perform-task-select
        v-if="Object.values(Task).some((v) => v === subActionOptions)"
        :sel-task="selTask"
        :sub-action-options="subActionOptions"
        :unit-type="unitType"
      />
      <enroute-task-select
        v-if="Object.values(EnrouteTask).some((v) => v === subActionOptions)"
        :sel-task="selTask"
        :sub-action-options="subActionOptions"
        :unit-type="unitType"
      />
    </div>
    <n-modal v-model:show="conditionModal" preset="card" class="w-3/4" title="Edit Condition">
      <edit-condition :sel-task="selTask" />
    </n-modal>
    <n-modal
      v-model:show="stopConditionModal"
      preset="card"
      class="w-3/4"
      title="Edit Stop Condition"
    >
      <edit-condition :sel-task="selTask" :stop-condition="true" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { NSelect, NInputNumber, NInput, NCheckbox, NButton, NFormItem, NModal } from "naive-ui";
import { useTasksStore } from "../stores/state";
import { useEntryStore } from "../stores/entryState";
import { computed, inject, type ComputedRef, ref } from "vue";
import type { TActionType } from "../types";
import { Task, EnrouteTask, PerformCommand, OptionName, TEnrouteTask } from "../utils/consts";
import { setFormation, defaultAction, createWrappedAction, createTask } from "../utils/setAction";
import { commands, enrouteTask, options, performTask, getAvailableActions } from "../utils/actions";
import OptionSelect from "./OptionSelect.vue";
import PerformTaskSelect from "./PerformTaskSelect.vue";
import EnrouteTaskSelect from "./EnrouteTaskSelect.vue";
import CommandSelect from "./CommandSelect.vue";
import EditCondition from "./EditCondition.vue";

const store = useTasksStore();
const entry = useEntryStore();

const conditionModal = ref(false);
const stopConditionModal = ref(false);

const selTaskIndex = computed(() => store.getTasks().map((task) => task.number));
const selTask = inject<number>("selection", 0) as unknown as ComputedRef<number>;
const selTaskData = computed({
  get: () => store.getOneTask(selTask.value - 1),
  set: (value) => {
    store.setOneTask(value, selTask.value - 1);
  },
});

const actionType = computed<TActionType>({
  get: () => {
    if (Object.values(Task).some((v) => v === selTaskData.value.id)) {
      entry.setActionType("task");
      return "task";
    } else if (Object.values(EnrouteTask).some((v) => v === selTaskData.value.id)) {
      entry.setActionType("enrouteTask");
      return "enrouteTask";
    } else if (
      Object.values(PerformCommand).some((v) => v === selTaskData.value.params.action.id)
    ) {
      entry.setActionType("commands");
      return "commands";
    } else if (selTaskData.value.params.action.id === "Option") {
      entry.setActionType("options");
      return "options";
    } else {
      entry.setActionType("task");
      return "task";
    }
  },
  set: (value) => {
    selTaskData.value = defaultAction(value);
  },
});

const unitType = computed({
  get: () => entry.getUnit(),
  set: (value) => entry.setUnit(value),
});

const setActionValue = (value: number | string) => {
  if (actionType.value === "options" && typeof value === "number") {
    const args = {
      number: selTaskData.value.number,
      params: {
        name: value,
      },
      id: "Option",
    };
    const setArgs = (v: any) => {
      args.params = {
        ...args.params,
        ...v,
      };
    };
    const selOption = options[value];
    if (selOption.label === "ROE" && selOption.options) {
      if (unitType.value === "plane" || unitType.value === "helicopter") {
        setArgs({
          value: selOption.options[0][0].value,
        });
      } else if (unitType.value === "ship" || unitType.value === "vehicle") {
        setArgs({
          value: selOption.options[1][0].value,
        });
      }
    } else if (selOption.label === "Formation") {
      setArgs(setFormation(unitType.value));
    } else if (selOption.options) {
      setArgs({
        value: selOption.options[0].value,
      });
    } else if ([21, 22, 23].includes(selOption.value)) {
      setArgs({
        name: value,
        noTargetTypes: [
          "Fighters",
          "Multirole fighters",
          "Bombers",
          "Helicopters",
          "UAVs",
          "Infantry",
          "Fortifications",
          "Tanks",
          "IFV",
          "APC",
          "Artillery",
          "Unarmed vehicles",
          "AAA",
          "SR SAM",
          "MR SAM",
          "LR SAM",
          "Aircraft Carriers",
          "Cruisers",
          "Destroyers",
          "Frigates",
          "Corvettes",
          "Light armed ships",
          "Unarmed ships",
          "Submarines",
          "Cruise missiles",
          "Antiship Missiles",
          "AA Missiles",
          "AG Missiles",
          "SA Missiles",
        ],
        targetTypes: [],
        value: "none;",
      });
    }
    if (selOption.data) {
      setArgs({
        value: selOption.data,
      });
    }
    selTaskData.value = createWrappedAction(args.number, args.params, args.id);
  } else if (typeof value === "string") {
    if (actionType.value === "commands") {
      selTaskData.value = createWrappedAction(
        selTaskData.value.number,
        commands[value].params,
        value,
      );
    }
    if (actionType.value === "task") {
      selTaskData.value = createTask(selTaskData.value.number, performTask[value].params, value);
    }
    if (actionType.value === "enrouteTask") {
      if (
        (
          [
            "AWACS",
            "Tanker",
            "CAS",
            "CAP",
            "FighterSweep",
            "SEAD",
            "AntiShip",
          ] satisfies TEnrouteTask[]
        ).some((v) => v === value)
      ) {
        selTaskData.value = createTask(
          selTaskData.value.number,
          enrouteTask[value].params,
          "EngageTargets",
          value,
        );
      } else {
        selTaskData.value = createTask(selTaskData.value.number, enrouteTask[value].params, value);
      }
    }
  }
};

const taskCatagory = computed(() => entry.getTaskCatagory());
const actionOptions = computed(() =>
  getAvailableActions(unitType.value, actionType.value, taskCatagory.value),
);
const subActionOptions = computed({
  get: () => {
    if (selTaskData.value.id !== "WrappedAction") {
      if (selTaskData.value.key) {
        return selTaskData.value.key;
      } else {
        return selTaskData.value.id;
      }
    } else {
      if (selTaskData.value.params.action.id === "Option") {
        const action =
          Object.values(OptionName).find(
            (option) => option === selTaskData.value.params.action.params.name,
          ) ?? -1;
        return action ?? "No Option";
      } else {
        return selTaskData.value.params.action.id;
      }
    }
  },
  set: (value) => {
    setActionValue(value);
  },
});

const enabled = computed({
  get: () => selTaskData.value.enabled,
  set: (value) => {
    selTaskData.value.enabled = value;
  },
});

const name = computed({
  get: () => selTaskData.value.name,
  set: (value) => {
    selTaskData.value.name = value;
  },
});

const taskOptions = [
  {
    label: "Perform Task",
    value: "task",
  },
  {
    label: "Start Enroute Task",
    value: "enrouteTask",
  },
  {
    label: "Perform Command",
    value: "commands",
  },
  {
    label: "Set Option",
    value: "options",
  },
];
</script>
