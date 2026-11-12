// ---------- Sketch 1: Body segmentation mask ----------
const maskSketch = (p) => {
  let bodySegmentation;
  let video;
  let segmentation;

  let options = {
    maskType: "parts",
  };

  p.setup = async () => {
    p.createCanvas(640, 480).parent('mask-container');

    bodySegmentation = await ml5.bodySegmentation("BodyPix", options);

    // Create the video
    video = p.createCapture(p.VIDEO);
    video.size(640, 480);
    video.hide();

    bodySegmentation.detectStart(video, gotResults);
  };

  p.draw = () => {
    p.background(255);
    p.image(video, 0, 0);
    if (segmentation) {
      p.image(segmentation.mask, 0, 0, p.width, p.height);
    }
  };

  // callback function for body segmentation
  function gotResults(result) {
    segmentation = result;
  }
};

// ---------- Sketch 2: Bouncing ball and body parts ----------
const ballSketch = (p) => {
  let bodySegmentation, video, segmentation;
  let ball = { x: 320, y: 0, vx: 4, vy: 1, r: 20 };
  let colors = { face: [255, 255, 255], torso: [255, 0, 0] };
  let wasHitType = null;

  p.setup = async () => {
    p.createCanvas(640, 480).parent('ball-container');
    bodySegmentation = await ml5.bodySegmentation("BodyPix", { maskType: "parts" });
    video = p.createCapture(p.VIDEO);
    video.size(640, 480);
    video.hide();
    bodySegmentation.detectStart(video, (result) => (segmentation = result));
  };

  p.draw = () => {
    p.background(255);
    p.image(video, 0, 0);
    moveBall();

    if (!segmentation) return;

    let parts = bodySegmentation.getPartsId();
    let id = segmentation.data[Math.floor(ball.x) + Math.floor(ball.y) * p.width];
    let hitType = getPartType(id, parts);

    if (hitType) {
      ball.vx *= -1;
      ball.vy *= -1;
      if (hitType !== wasHitType) colors[hitType] = [p.random(255), p.random(255), p.random(255)];
    }
    wasHitType = hitType;

    drawOverlay(parts);
  };

  function moveBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;
    if (ball.x < 0 || ball.x > p.width) ball.vx *= -1;
    if (ball.y < 0 || ball.y > p.height) ball.vy *= -1;

    p.noStroke();
    p.fill(255);
    p.ellipse(ball.x, ball.y, ball.r);
  }

  function getPartType(id, parts) {
    if (id == parts.LEFT_FACE || id == parts.RIGHT_FACE) return "face";
    if (id == parts.TORSO_FRONT) return "torso";
    return null;
  }

  function drawOverlay(parts) {
    p.noStroke();
    for (let x = 0; x < video.width; x += 10) {
      for (let y = 0; y < video.height; y += 10) {
        let id = segmentation.data[y * video.width + x];
        let type = getPartType(id, parts);
        if (type) {
          p.fill(...colors[type]);
          p.circle(x, y, 10);
        }
      }
    }
  }
};

new p5(maskSketch);
new p5(ballSketch);