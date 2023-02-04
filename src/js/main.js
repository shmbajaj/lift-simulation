const liftsWrapper = document.getElementById("liftsWrapper");
const buttonsWrapper = document.getElementById("buttonsWrapper");
const floorsNumberWrapper = document.getElementById("floorsNumberWrapper");
const form = document.getElementById("form");
const disableLiftForm = document.getElementById("disableLiftForm");

//default values
//if lift is moving and doors are openining/closing lift isInUse:true else isInUse:false
const lift = {
  number: 0,
  floor: 0,
  isInUse: false,
  direction: "up",
};

const requests = [];
const excludedLifts =[];
const liftAnimationsReferences = {};
let numberOfLifts = 1;
let numberOfFloors = 10;
let lifts = {};
let assigned = {};

//start:
initializeApp();
form.addEventListener("submit", onFormSubmitHandler);
disableLiftForm.addEventListener("submit", onDisableLiftFormSubmitHandler);

function initializeApp() {
  //set rows and columns according to number of floors and lifts
  liftsWrapper.style.gridTemplateColumns = `repeat(${numberOfLifts}, minmax(50px, 1fr))`;
  liftsWrapper.style.gridTemplateRows = `repeat(${numberOfFloors}, minmax(100px, 1fr))`;
  buttonsWrapper.style.gridTemplateRows = `repeat(${numberOfFloors}, minmax(100px, 1fr))`;
  floorsNumberWrapper.style.gridTemplateRows = `repeat(${numberOfFloors}, minmax(100px, 1fr))`;
  //set UI
  setLiftsAndFloors();
  setButtonsUI();
  setLiftsUI();
  setFloorsUI();
}

function removeAllChildrenNodes(parent) {
  while (parent.hasChildNodes()) {
    parent.firstChild.remove();
  }
}

function setLiftsAndFloors() {
  //reset to defualt on submit event or initial render
  lifts = {};
  assigned = {};
  for (let index = 1; index <= numberOfLifts; ++index) {
    lifts[index] = { ...lift, number: index, floor: 1 };
    //assigning all lifts to first floor
    assigned[index] = { ...lift, number: index, floor: 1 };
  }
}

function setButtonsUI() {
  removeAllChildrenNodes(buttonsWrapper, "buttonsWrapper");
  for (let index = numberOfFloors; index > 0; --index) {
    const buttonsDiv = document.createElement("div");
    const up = document.createElement("button");
    const down = document.createElement("button");
    up.textContent = "up";
    down.textContent = "down";
    up.classList.toggle("up");
    down.classList.toggle("down");
    up.setAttribute("data-floorNumber", index);
    down.setAttribute("data-floorNumber", index);
    up.addEventListener("click", clickEventListenerHandler);
    down.addEventListener("click", clickEventListenerHandler);
    //add up button on first floor
    if (index === 1) {
      buttonsDiv.appendChild(up);
    } else if (index === numberOfFloors) {
      //add down button on last floor
      buttonsDiv.appendChild(down);
    } else {
      //add both buttons on floor
      buttonsDiv.appendChild(up);
      buttonsDiv.appendChild(down);
    }
    buttonsDiv.classList.toggle("buttons-div");
    buttonsWrapper.appendChild(buttonsDiv);
  }
}

//TODO: add comments and refactor this function and remove grid-number
function setLiftsUI() {
  let liftNumber = 1;
  removeAllChildrenNodes(liftsWrapper, "liftsWrapper");
  for (let index = 1; index <= numberOfFloors * numberOfLifts; ++index) {
    const div = document.createElement("div");
    //const span = document.createElement("span");
    div.classList.toggle("lifts-item");
    //span.textContent = index;
    //span.classList.toggle("lifts-item-text");
    if (index > numberOfFloors * numberOfLifts - numberOfLifts) {
      const lift = document.createElement("div");
      const doors = document.createElement("div");
      doors.classList.toggle("doors");
      lift.classList.toggle("lift");
      doors.textContent = liftNumber;
      lift.setAttribute("id", "lift" + liftNumber);
      lift.appendChild(doors);
      ++liftNumber;
      div.appendChild(lift);
    }
    if (index === numberOfFloors * numberOfLifts) {
      liftNumber = 1;
    }
    //div.appendChild(span);
    liftsWrapper.appendChild(div);
  }
}

function setFloorsUI() {
  removeAllChildrenNodes(floorsNumberWrapper, "floorsNumberWrapper");
  for (let index = numberOfFloors; index > 0; --index) {
    const floorNumber = document.createElement("p");
    floorNumber.textContent = "Floor" + index;
    floorNumber.classList.toggle("floor-number");
    floorsNumberWrapper.appendChild(floorNumber);
  }
}

function getLiftId(floorNumber, direction) {
  const lifts = Object.keys(assigned).map((key) => assigned[key]);
  return getShortestDistanceLiftId(floorNumber, direction, lifts);
}

function getShortestDistanceLiftId(floorNumber, direction, lifts) {
  
  //INFO: filter disabled lifts
  const filteredLifts = lifts.filter(lift => !excludedLifts.includes(lift.number));

  let availableLifts = [...filteredLifts];


  //get already assigned lifts for requested floorNumber
  const alreadyAssignedLifts = availableLifts.filter(
    (lift) => lift.floor === floorNumber
  );

  //if two lifts are on same folder then return lift
  //assigned for up or down
  if (alreadyAssignedLifts.length > 1) {
    const alreadyAssignedLift = alreadyAssignedLifts.filter(
      (lift) => lift.direction === direction
    );
    return alreadyAssignedLift[0].number;
  }

  //if one lift is assigned check if assigned one is assigned for same direction
  //if same direction return else filter currently assigned lift with opposite direction
  //and update available lifts
  else if (alreadyAssignedLifts.length === 1) {
    if (alreadyAssignedLifts[0].direction === direction) {
      return alreadyAssignedLifts[0].number;
    }
    //single lift same floor different direction
    if (lifts.length === 1 && alreadyAssignedLifts[0].floor === floorNumber) {
      return lifts[0].number;
    }
    //do not take same floor different direction
    availableLifts = availableLifts.filter(
      (lift) => lift.floor !== alreadyAssignedLifts[0].floor
    );
  }

  //filter out moving lifts and return if all lifts are moving
  availableLifts = availableLifts.filter((lift) => !lift.isInUse);

  if (availableLifts.length < 1) {
    return;
  }

  //get lift with min-distance from requested floorNumber
  const [firstLift, ...restLifts] = availableLifts;
  let minDistanceLift = {
    ...firstLift,
    distance: Math.abs(floorNumber - firstLift.floor),
  };
  for (let lift of restLifts) {
    if (Math.abs(floorNumber - lift.floor) < minDistanceLift.distance) {
      minDistanceLift = {
        ...lift,
        distance: Math.abs(floorNumber - lift.floor),
      };
    }
  }

  return minDistanceLift.number;
}

function setLiftIsInUse(liftId, nextFloorId, direction) {
  //assign lift to requestt floor Number and set moving status
  if (!assigned[liftId].isInUse) {
    assigned[liftId].floor = nextFloorId;
    assigned[liftId].direction = direction;
  }
  assigned[liftId].isInUse = !assigned[liftId].isInUse;
}

function clickEventListenerHandler(event) {
  //get requested floorNumber and direction
  const target = event.target;
  const nextFloorNumber = parseInt(target.getAttribute("data-floorNumber"), 10);
  const direction = target.textContent;
  //add to requests array and call process requests
  addToRequests({ floor: nextFloorNumber, direction });
  processRequests();
}

function addToRequests(request) {
  requests.push({ ...request, requestId: request.floor + request.direction });
}

function processRequests() {
  //check if is there any request and assign lift
  if (requests.length > 0) {
    const request = requests.shift();
    const { floor: nextFloorNumber, direction } = request;
    //if failed to assign lift then add request again to requests array
    //request fails because aasigned lift is moving or something unkown happend
    const isFailedToProcessRequest = moveLift({ nextFloorNumber, direction });
    if (isFailedToProcessRequest) {
      requests.unshift(request);
    }
  }
}

//@TODO: refactor code
function moveLift({ nextFloorNumber, direction }) {
  const liftValues = { type: "", calculatedValue: 0, initialValue: 0 };
  //get liftId for requestedFloorNumber and requestedDirection
  const liftId = getLiftId(nextFloorNumber, direction);
  if (!liftId) {
    console.log(`No Lift is available to be assigned.`);
    return true;
  }
  //get lift element
  const lift = document.getElementById("lift" + liftId);
  //get currently assigned floor of lift to be assigned
  const currentFloorNumber = assigned[liftId].floor;
  //get lift style or top and bottom
  const liftStyle = window.getComputedStyle(lift);
  //get doors to add animation
  const doors = lift.firstElementChild;
  //if lift is moving return
  if (assigned[liftId].isInUse) {
    console.log(`Lift is Assigned`);
    return true;
  }
  //if currentFloorNumber is less than nextFloorNumber then lift is moved down
  //by reducing the bottom value
  //(calculatedBotto)newBottomValue is calculated using current bottom value
  //and number of floors to cross
  if (currentFloorNumber < nextFloorNumber) {
    const bottom = liftStyle.getPropertyValue("bottom");
    const bottomValue = parseInt(bottom.replace("px", ""), 10);
    //cacluate next bottomValue
    const calculatedBottom =
      bottomValue +
      (nextFloorNumber - currentFloorNumber) * 100 +
      (nextFloorNumber - currentFloorNumber) * 8;
    //set top to auto, when moving down irresspective of top value
    lift.style.top = "auto";
    //updating common properties
    liftValues.type = "bottom";
    liftValues.initialValue = bottomValue;
    liftValues.calculatedValue = calculatedBottom;
  } else {
    //update top value of lift as lift as has to go up
    //because requested floor number is greater then
    //current assigned lift floorNumber
    const top = liftStyle.getPropertyValue("top");
    const topValue = parseInt(top.replace("px", ""), 10);
    //calculated-top value
    const calculatedTop =
      topValue +
      Math.abs(nextFloorNumber - currentFloorNumber) * 100 +
      Math.abs(nextFloorNumber - currentFloorNumber) * 8;
    lift.style.bottom = "auto";
    //updating common properties
    liftValues.type = "top";
    liftValues.initialValue = topValue;
    liftValues.calculatedValue = calculatedTop;
  }

  //update lift status for current request
  setLiftIsInUse(liftId, nextFloorNumber, direction);
  //using animation api to add lift moving animatiom
  const liftAnimation = lift.animate(
    [
      { [liftValues.type]: `${liftValues.initialValue}px` },
      { [liftValues.type]: `${liftValues.calculatedValue}px` },
    ],
    {
      duration: 2000,
      iterations: 1,
    }
  );
  //Store Reference
  liftAnimationsReferences[liftId] = liftAnimation;
  // add event handler

  //event lis tener on animation
  liftAnimation.finished.then(() => {
    if (liftValues.type === "bottom") {
      lift.style.bottom = liftValues.calculatedValue + "px";
    } else {
      lift.style.top = liftValues.calculatedValue + "px";
    }
    //adding door opening animation
    doors.classList.add("doors-open");
    //adding door closing animation
    setTimeout(() => doors.classList.add("doors-close"), 2500);
    //removing animations and updating lift status and checking for next request
    setTimeout(() => {
      doors.classList.remove("doors-open");
      doors.classList.remove("doors-close");
      // //update lift status for current request
      setLiftIsInUse(liftId, nextFloorNumber, direction);
      //looking for another request
      processRequests();
    }, 5000);
  });

  return false;
}

function onFormSubmitHandler(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  for (const [k, v] of formData.entries()) {
    //get and update number of lits and floors
    numberOfLifts =
      k === "lifts" ? parseInt(v, 10) : parseInt(numberOfLifts, 10);
    numberOfFloors =
      k === "floors" ? parseInt(v, 10) : parseInt(numberOfFloors, 10);
  }
  //update ui again
  initializeApp();
}

function onDisableLiftFormSubmitHandler(event){
  event.preventDefault();
  const formData = new FormData(event.target);
  const liftNumber = formData.get("liftNumber");
  sendLiftToNearestFloor(liftNumber);
}

// TODO: use this function to create lift
function getLift(liftNumber){
  const lift = document.createElement("div");
  const doors = document.createElement("div");
  doors.classList.toggle("doors");
  lift.classList.toggle("lift");
  doors.textContent = liftNumber;
  lift.setAttribute("id", "lift" + liftNumber);
  console.log({lift});
  lift.appendChild(doors);
  return lift;
}

function sendLiftToNearestFloor(liftNumber){
  const lift = document.getElementById('lift' + liftNumber);
  if(!lift) return;
  lift.classList.add('lift--disabled');
  excludedLifts.push(parseInt(liftNumber, 10));
  const animation = liftAnimationsReferences[liftNumber];
  if(!animation) return;
  animation?.pause();
  // if(animation.finished) return;
  // const lift = document.getElementById('lift' + liftNumber);
  // const liftStyle = window.getComputedStyle(lift);
  // const bottom = liftStyle.getPropertyValue("bottom");
  // const bottomValue = parseInt(bottom.replace("px", ""), 10);
  // const top = liftStyle.getPropertyValue("top");
  // const topValue = parseInt(top.replace("px", ""), 10);
  // console.log({bottomValue, topValue});
  // const distance = Math.abs(topValue - bottomValue);
  // //GO OPPOSITE HERE
  // const type = topValue > bottomValue ? 'top' : 'bottom';
  // const intialValue = topValue > bottomValue ? top : bottom;
  // const remainder1 = topValue % 100;
  // const remainder2 = bottomValue % 100;
  // const remainderDistance = Math.abs(remainder1 - remainder2);
  // console.log({distance, type, intialValue, remainderDistance});
  // const liftAnimation = lift.animate([
  //   {
  //     [type]: `${intialValue}px`,
  //   },
  //   {
  //     [type]: `${remainderDistance}px`
  //   }
  // ],{
  //   duration: 2000,
  //   iterations: 1,
  // });
  // console.log({type, intialValue, remainderDistance});
  // liftAnimation.finished.then(() => {
  //   if (type === "bottom") {
  //     lift.style.bottom = remainderDistance + "px";
  //   } else {
  //     lift.style.top = remainderDistance + "px";
  //   }
  // });
}

