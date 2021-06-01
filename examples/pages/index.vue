<template>
  <div>
    <el-button @click="goAbout">
      About
    </el-button>
    <Window
      ref="testWin"
      title="test"
      name="testWin"
      :delay="0"
      :draggable="{window:false}"
      resizable
      :width="800"
      :height="600"
      :min-width="400"
      :min-height="300"
      :start-zindex="20"
      :start-x="0.5"
      :start-y="0.5"
      adaptive
      append-to-body
    >
      <el-button>test</el-button>
    </Window>
  </div>
</template>
<script>
export default {
  name: 'Index',
  components: {
  },
  data () {
    return {
    }
  },
  computed: {
  },
  created () {

  },
  mounted () {
    this.$window.show('testWin')
  },
  methods: {
    goAbout () {
      this.$router.push({ name: 'About' })
    }

  }
}
</script>
<style>
</style>
