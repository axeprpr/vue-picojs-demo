const { createCanvas, loadImage } = require("canvas");
require("./pico.js");
/*
  1. load the face-detection cascade
*/
var facefinder_classify_region = function(r, c, s, pixels, ldim) {
  return -1.0;
};
var cascadeurl =
  window.location.origin + window.location.pathname + "facefinder.bin";
fetch(cascadeurl).then(function(response) {
  response.arrayBuffer().then(function(buffer) {
    var bytes = new Int8Array(buffer);
    facefinder_classify_region = pico.unpack_cascade(bytes);
    console.log("* facefinder loaded");
  });
});
/*
  2. prepare the image and canvas context
*/
const getImage = async (source) => {
  const image = await loadImage(source);
  const { width, height } = image;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  return { image, ctx };
};
/*
  3. transform an RGBA image to grayscale
*/
const rgba_to_grayscale = (rgba, nrows, ncols) => {
  var gray = new Uint8Array(nrows * ncols);
  for (var r = 0; r < nrows; ++r)
    for (var c = 0; c < ncols; ++c)
      // gray = 0.2*red + 0.7*green + 0.1*blue
      gray[r * ncols + c] =
        (2 * rgba[r * 4 * ncols + 4 * c + 0] +
          7 * rgba[r * 4 * ncols + 4 * c + 1] +
          1 * rgba[r * 4 * ncols + 4 * c + 2]) /
        10;
  return gray;
};
/*
  4. main function
*/
const getDefaultParams = (width, height) => {
  const factor = {
    shiftfactor: 0.1,
    scalefactor: 1.1,
  };
  const size = {
    minsize: (Math.min(width, height) * 0.07) >> 0, // minimum size of a face
    maxsize: (Math.max(width, height) * 3) >> 0, // maximum size of a face
  };
  return Object.assign(factor, size);
};

const draw_frame = async function(det, canvas_id) {
  var ctx = document.getElementById(canvas_id).getContext("2d");
  if (ctx && ctx.canvas) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  } else {
    return;
  }
  if(!det) {
    return;
  }
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "DeepSkyBlue"; //red    DodgerBlue,  Silver AliceBlue , RoyalBlue  Coral
  var x, y, r, cap_len, yfix;
  x = det[1];
  y = det[0];
  r = det[2] / 2 + 2;
  cap_len = 20;
  yfix = 1.1;
  ctx.moveTo(x - r, y - r);
  ctx.lineTo(x - r + cap_len, y - r);
  ctx.moveTo(x - r, y - r - yfix);
  ctx.lineTo(x - r, y - r + cap_len + yfix);

  ctx.moveTo(x + r, y - r);
  ctx.lineTo(x + r - cap_len, y - r);
  ctx.moveTo(x + r, y - r - yfix);
  ctx.lineTo(x + r, y - r + cap_len + yfix);

  ctx.moveTo(x - r, y + r);
  ctx.lineTo(x - r + cap_len, y + r);
  ctx.moveTo(x - r, y + r + yfix);
  ctx.lineTo(x - r, y + r - cap_len + yfix);

  ctx.moveTo(x + r, y + r);
  ctx.lineTo(x + r - cap_len, y + r);
  ctx.moveTo(x + r, y + r + yfix);
  ctx.lineTo(x + r, y + r - cap_len + yfix);
  ctx.stroke();
};

const face_detection = async (img, option, qThreshold = 5.0, IoU = 0.2) => {
  let { image, ctx } = await getImage(img);
  let { width, height } = image;
  // re-draw the image to clear previous results and get its RGBA pixel data

  var rgba = ctx.getImageData(0, 0, width, height).data;
  // prepare input to `run_cascade`
  const imageParams = {
    pixels: rgba_to_grayscale(rgba, height, width),
    nrows: height,
    ncols: width,
    ldim: width,
  };
  const params = Object.assign(getDefaultParams(width, height), option);
  // run the cascade over the image
  // dets is an array that contains (r, c, s, q) quadruplets
  // (representing row, column, scale and detection score)
  dets = pico.run_cascade(imageParams, facefinder_classify_region, params);
  // cluster the obtained detections
  dets = pico.cluster_detections(dets, IoU); // set IoU threshold to 0.2
  // return results
  dets = dets.filter((e) => e[3] > qThreshold);
  if ((dets.length = 1)) {
    return dets[0];
  } else {
    return null;
  }
};

exports.face_detection = face_detection
exports.draw_frame = draw_frame
