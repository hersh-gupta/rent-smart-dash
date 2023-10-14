import { ref } from "vue";
import { defineStore } from "pinia";

export const useRecordStore = defineStore("record", () => {
  const selectedRecord = ref(null);

  function $reset() {
    selectedRecord.value = null;
  }

  function setSelectedRecord(data) {
    selectedRecord.value = data;
  }

  function selectedRecordDefined() {
    selectedRecord.value.length && selectedRecord !== undefined;
  }

  return { selectedRecord, setSelectedRecord, selectedRecordDefined, $reset };
});
