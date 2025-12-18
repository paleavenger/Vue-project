<template>
  <div id="app">
    <header class="app-header">
      <h1>🎯 Vue 3 Практика - Генератор цветовых палитр</h1>
      <p>Практика 27: реактивность, директивы и работа с состоянием</p>
    </header>

    <nav class="navigation">
      <button class="nav-button active" type="button">
        Генератор палитр
      </button>
    </nav>

    <main class="main-content">
      <PaletteGenerator />
    </main>

    <footer class="app-footer">
      <p>Vue 3 + Vite • Практика 27–28 • Генератор цветовых палитр</p>
    </footer>
  </div>
</template>

<script>
import PaletteGenerator from './components/PaletteGenerator.vue'

export default {
  name: 'App',
  components: {
    PaletteGenerator,
  },
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 2rem;
  text-align: center;
}

.app-header h1 {
  margin-bottom: 0.5rem;
  font-size: 2.3rem;
}

.app-header p {
  opacity: 0.9;
  font-size: 1.05rem;
}

.navigation {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1.2rem 1.5rem;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
}

.nav-button {
  padding: 0.6rem 1.4rem;
  border: 2px solid #667eea;
  background-color: transparent;
  color: #667eea;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.nav-button:hover {
  background-color: #667eea;
  color: #fff;
  transform: translateY(-2px);
}

.nav-button.active {
  background-color: #667eea;
  color: #fff;
}

.main-content {
  flex: 1;
  padding: 1.5rem;
}

.app-footer {
  text-align: center;
  padding: 1rem;
  background-color: #fff;
  border-top: 1px solid #e2e2e2;
  font-size: 0.9rem;
  color: #666;
}
</style>
