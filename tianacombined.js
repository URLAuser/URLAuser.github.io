// ---------- Sketch 1: Car Counter ----------
// Uses ml5 object detection to count every car that drives across a line in the video,
// and keeps track of which direction it went.
const carSketch = (p) => {
  let video;
  let detector;
  let detections = [];

  // counting line (x position on the canvas)
  let lineX = 480;

  // cars from the last frame, so we can tell which side of the line they were on
  let lastCars = [];

  // counts
  let carCount = 0;
  let leftCount = 0;
  let rightCount = 0;

  // when the last car crossed (used to flash the screen and stop double counting)
  let lastCrossTime = -10000;
  let lastDirection = "";

  p.setup = async () => {
    detector = await ml5.objectDetection("cocossd");

    p.createCanvas(960, 540).parent('car-container');

    video = p.createVideo("assets/test2.mp4");

    // muted so the browser lets it autoplay
    video.elt.muted = true;
    video.elt.setAttribute("muted", "");
    video.elt.setAttribute("playsinline", "");

    // Safari won't autoplay a hidden video, so tuck it behind the canvas instead of hiding it
    video.position(0, 0);
    video.style("width", 1 + "px");
    video.style("height", 1 + "px");
    video.style("z-index", "-1");
    video.loop();

    detector.detectStart(video, gotDetections);
  };

  // SUVs sometimes get labeled "truck", so count those too
  function isCar(label) {
    return label == "car" || label == "truck" || label == "bus";
  }

  // Called each time the detector finishes a frame
  function gotDetections(results) {
    detections = results;

    let videoWidth = video.elt.videoWidth;
    let videoHeight = video.elt.videoHeight;
    if (videoWidth === 0 || videoHeight === 0) {
      return;
    }

    // find the center of every car in this frame
    let cars = [];
    for (let i = 0; i < results.length; i++) {
      let detection = results[i];

      if (isCar(detection.label)) {
        let x = (detection.x + detection.width / 2) * (p.width / videoWidth);
        let y = (detection.y + detection.height / 2) * (p.height / videoHeight);
        cars.push({ x: x, y: y });
      }
    }

    // match each car to the closest car from the last frame
    for (let i = 0; i < cars.length; i++) {
      let car = cars[i];
      let closest = null;
      let closestDist = 150; // if it moved more than this, it's probably a different car

      for (let j = 0; j < lastCars.length; j++) {
        let d = p.dist(car.x, car.y, lastCars[j].x, lastCars[j].y);
        if (d < closestDist) {
          closestDist = d;
          closest = lastCars[j];
        }
      }

      // if it was on one side of the line before and the other side now, it crossed!
      // (the 1 second wait stops one car from being counted twice)
      if (closest != null && p.millis() - lastCrossTime > 1000) {
        let wasLeft = closest.x < lineX;
        let isLeft = car.x < lineX;

        if (wasLeft && !isLeft) {
          carCount++;
          rightCount++;
          lastDirection = "→";
          lastCrossTime = p.millis();
        } else if (!wasLeft && isLeft) {
          carCount++;
          leftCount++;
          lastDirection = "←";
          lastCrossTime = p.millis();
        }
      }
    }

    lastCars = cars;
  }

  p.draw = () => {
    // Draw the video to fill the canvas
    p.image(video, 0, 0, p.width, p.height);

    let videoWidth = video.elt.videoWidth;
    let videoHeight = video.elt.videoHeight;
    if (videoWidth === 0 || videoHeight === 0) {
      return;
    }

    let scaleX = p.width / videoWidth;
    let scaleY = p.height / videoHeight;

    // flash the line green for a second after a car crosses, white otherwise
    let justCrossed = p.millis() - lastCrossTime < 1000;

    if (justCrossed) {
      p.stroke(0, 255, 0);
      p.strokeWeight(8);
    } else {
      p.stroke(255);
      p.strokeWeight(4);
    }
    p.line(lineX, 60, lineX, 400);

    // Draw boxes around cars only
    for (let i = 0; i < detections.length; i++) {
      let detection = detections[i];

      if (isCar(detection.label)) {
        let x = detection.x * scaleX;
        let y = detection.y * scaleY;
        let w = detection.width * scaleX;
        let h = detection.height * scaleY;

        // box is blue on the left side of the line, orange on the right
        let centerX = x + w / 2;
        if (centerX < lineX) {
          p.stroke(0, 150, 255);
        } else {
          p.stroke(255, 150, 0);
        }
        p.strokeWeight(3);
        p.noFill();
        p.rect(x, y, w, h);

        // dot in the center (this is the point we check against the line)
        p.noStroke();
        p.fill(255);
        p.ellipse(centerX, y + h / 2, 10, 10);
      }
    }

    // counter box
    p.noStroke();
    p.fill(0, 180);
    p.rect(20, 20, 260, 110, 10);

    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(32);
    p.text("Cars: " + carCount, 40, 55);
    p.textSize(20);
    p.text("← " + leftCount + "      → " + rightCount, 40, 100);

    // pop up message when a car crosses
    if (justCrossed) {
      p.fill(0, 255, 0);
      p.textSize(40);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("+1 car " + lastDirection, p.width / 2, p.height - 60);
    }

    // traffic alert once enough cars go by
    if (carCount >= 5) {
      p.noStroke();
      p.fill(255, 0, 0);
      p.rect(p.width - 250, 20, 230, 50, 10);
      p.fill(255);
      p.textSize(24);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Heavy traffic!", p.width - 135, 45);
    }

    p.textAlign(p.LEFT, p.BASELINE);
  };

  // press R to reset the counter
  p.keyPressed = () => {
    if (p.key == "r" || p.key == "R") {
      carCount = 0;
      leftCount = 0;
      rightCount = 0;
    }
  };

  // click to start the video if it didn't autoplay
  p.mousePressed = () => {
    video.loop();
  };
};

// ---------- Sketch 2: Object detection on webcam ----------
const detectSketch = (p) => {
  let video;
  let detector;
  let detections = [];

  p.setup = async () => {
    detector = await ml5.objectDetection("cocossd");

    p.createCanvas(640, 480).parent('detect-container');

    // Using webcam feed as video input, hiding html element to avoid duplicate with canvas
    video = p.createCapture(p.VIDEO);
    video.size(p.width, p.height);
    video.hide();

    detector.detectStart(video, gotDetections);
  };

  // Callback function is called each time the object detector finishes processing a frame.
  function gotDetections(results) {
    // Update detections array with the new results
    detections = results;
  }

  p.draw = () => {
    // Draw the current video frame onto the canvas.
    p.image(video, 0, 0);

    for (let i = 0; i < detections.length; i += 1) {
      let detection = detections[i];

      // Draw bounding box
      p.stroke(0, 255, 0);
      p.strokeWeight(4);
      p.noFill();
      p.rect(detection.x, detection.y, detection.width, detection.height);

      // Draw label
      p.noStroke();
      p.fill(255);
      p.textSize(24);
      p.text(detection.label, detection.x + 10, detection.y + 24);
    }
  };
};

new p5(carSketch);
new p5(detectSketch);

