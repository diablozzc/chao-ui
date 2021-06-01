<template>
  <div>
    <el-button @click="goIndex">
      Index
    </el-button>
  </div>
</template>
<script>
export default {
  name: 'About',
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
  },
  methods: {
    goIndex () {
      this.$router.push({ name: 'Index' })
    }
  }
}
</script>
<style>
</style>
