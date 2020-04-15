<template>
  <div class="face-container">
    <div class="face-camv" id="mycam"></div>
    <canvas id="ctx" class="face-camc" :width="width" :height="height"></canvas>
  </div>
</template>

<script>
import { face_detection, draw_frame } from "../utils/face.js";
var WebCamera = require("webcamjs");
export default {
  name: "picojs",
  data() {
    return {
      camEnabled: false,
      width: 640,
      height: 480,
      picoInterval: null,
      camSet: {
        width: 640,
        height: 480,
        image_format: "jpeg",
        jpeg_quality: 80,
        // flip_horiz: true,
        fps: 15,
      },
    };
  },
  mounted() {
    this.picoInterval && window.clearInterval(this.picoInterval);
    this.camInit();
  },
  beforeDestroy() {
    this.picoInterval && window.clearInterval(this.picoInterval);
    this.camStop()
    draw_frame(null, "ctx");
  },
  methods: {
    async camInit() {
      await this.camStop();
      WebCamera.set(this.camSet);
      WebCamera.attach("mycam");
      WebCamera.on("live", function() {
        this.picoInterval = setInterval(function() {
          WebCamera.snap(function(data_uri) {
            face_detection(data_uri).then((det) => {
              draw_frame(det, "ctx");
            });
          });
        }, 1000);
      });
      console.log("The camera has been started");
    },
    async camStop() {
      try {
        await WebCamera.reset();
        console.log("WebCamera has been closed..");
      } catch (err) {
        return
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.face-container {
  display: flex;
  justify-content: center;
}
.face-camv {
  position: absolute;
}
.face-camc {
  position: absolute;
}
</style>
