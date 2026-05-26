<script setup lang="ts">
const props = defineProps<{ src: string; title: string }>();
const isOpen = ref(false);

function open() {
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
}

defineExpose({ open });
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="pdf-overlay" @click.self="close">
        <div class="pdf-modal">
          <div class="pdf-header">
            <h3 class="pdf-title">{{ title }}</h3>
            <button class="pdf-close" @click="close">&times;</button>
          </div>
          <iframe :src="src" class="pdf-frame" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pdf-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.pdf-modal {
  background: #fff;
  border-radius: 10px;
  width: 90vw;
  max-width: 800px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.pdf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 12px 20px;
  border-bottom: 1px solid #eee;
}

.pdf-title {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.pdf-close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0 4px;
  transition: color 0.2s;
}

.pdf-close:hover {
  color: #333;
}

.pdf-frame {
  flex: 1;
  border: none;
  width: 100%;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
