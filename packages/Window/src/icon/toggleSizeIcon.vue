<template>
  <div>
    <svg
      v-if="status === 'normal'"
      class="fullscreen-svg"
      x="0px"
      y="0px"
      viewBox="0 0 10 10"
    >
      <path
        fill="#000000"
        d="M 0 0 L 0 10 L 10 10 L 10 0 L 0 0 z M 1 1 L 9 1 L 9 9 L 1 9 L 1 1 z "
      />
    </svg>
    <svg
      v-if="status === 'fullscreen'"
      class="maximize-svg"
      x="0px"
      y="0px"
      viewBox="0 0 10 10"
    >
      <mask id="Mask">
        <rect
          fill="#FFFFFF"
          width="10"
          height="10"
        />
        <path
          fill="#000000"
          d="M 3 1 L 9 1 L 9 7 L 8 7 L 8 2 L 3 2 L 3 1 z"
        />
        <path
          fill="#000000"
          d="M 1 3 L 7 3 L 7 9 L 1 9 L 1 3 z"
        />
      </mask>
      <path
        fill="#000000"
        d="M 2 0 L 10 0 L 10 8 L 8 8 L 8 10 L 0 10 L 0 2 L 2 2 L 2 0 z"
        mask="url(#Mask)"
      />
    </svg>
  </div>
</template>
<script>
export default {
  components: {},
  props: {
    status: {
      type: String,
      default: 'normal'
    }
  },
  data () {
    return {}
  },
  computed: {},
  created () {

  },
  mounted () {

  },
  methods: {}
}
</script>
<style>
</style>
