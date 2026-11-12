// ---------- Sketch 1 ----------
const sketch1 = (p) => {
  let handPose;
  let video;
  let hands = [];

  p.setup = async () => {
    p.createCanvas(640, 480).parent('keypoint-container');

    // Load the handPose model asynchronously
    handPose = await ml5.handPose({ flipped: true });

    // Create the webcam video and hide it
    video = p.createCapture(p.VIDEO);
    video.size(640, 480);
    video.hide();

    // start detecting hands from the webcam video
    handPose.detectStart(video, gotHands);
  };

  p.draw = () => {
    // Draw the webcam video
   p.push();
    p.translate(p.width, 0);
    p.scale(-1, 1);
    p.image(video, 0, 0, p.width, p.height);
    p.pop();

    // Draw all the tracked hand points
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
      for (let j = 0; j < hand.keypoints.length; j++) {
        let keypoint = hand.keypoints[j];
        p.fill(0, 255, 0);
        p.noStroke();
        p.circle(keypoint.x, keypoint.y, 10);
      }
    }
  };

  // Callback function for when handPose outputs data
  function gotHands(results) {
    // save the output to the hands variable
    hands = results;
  }
};

// ---------- Sketch 2 ----------
const sketch2 = (p) => {
  let handPose;
  let video;
  let hands = [];

  p.preload = () => {
    // Load the handPose model
    handPose = ml5.handPose({ flipped: true });
  };

  p.mousePressed = () => { //debugger tool
    console.log(hands);
  };

  p.setup = () => {
    p.createCanvas(640, 480).parent('pinch-container');

    // Create the webcam video and hide it
    video = p.createCapture(p.VIDEO);
    video.size(640, 480);
    video.hide();
    // start detecting hands from the webcam video
    handPose.detectStart(video, gotHands);
  };

  p.draw = () => {

    // Draw the webcam video
    p.push();
    p.translate(p.width, 0);
    p.scale(-1, 1);
    p.image(video, 0, 0, p.width, p.height);
    p.pop();

    if (hands.length > 0) {
      //only does this for one hand
      let hand = hands[0];
      let thumb = hand.thumb_tip;
      let index = hand.index_finger_tip;
      // Finding the distance between thumb and index finger
      let d = p.dist(thumb.x, thumb.y, index.x, index.y)

      //so if my thumb and index finger are close together then make the cirle red
      if (d < 30) {
        p.fill(255, 0, 0);
      } else {
        //if not then green :3
        p.fill(0, 255, 0);
      }

      // ok so draw the circle at index and the distance to control size 
      p.ellipse(index.x, index.y, d, d);

    }
  };

  // Callback function for when handPose outputs data
  function gotHands(results) {
    // Save the output to the hands variable
    hands = results;
  }
};

new p5(sketch1);
new p5(sketch2);