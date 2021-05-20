<template>
  <div id="app">
    <img
      alt="Vue logo"
      src="./assets/logo.png"
    >
    <x-button type="primary">
      button
    </x-button>
    <Window
      ref="testWin"
      title="test"
      name="testWin"
      :delay="0"
      :draggable="{window:false}"
      resizable
      :width="1024"
      :height="768"
      :min-width="800"
      :min-height="600"
      :start-zindex="5"
      :start-x="0.5"
      :start-y="0.5"
      adaptive
    >
      test 1
    </Window>
    <window-container />
  </div>
</template>

<script>

export default {
  name: 'App',
  components: {
  },
  mounted () {
    this.$window.show('testWin')
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
