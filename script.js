const states = ["q0", "q1", "q2"];
const alphabet = ["0", "1"];
const startState = "q0";
const acceptStates = ["q2"];
const transitions = {
  "q0,0": "q1",
  "q0,1": "q0",
  "q1,0": "q2",
  "q1,1": "q0",
  "q2,0": "q2",
  "q2,1": "q2"
};

let tableSteps = []; // Stores transition steps

function runSimulation() {
  const input = document.getElementById("inputString").value.trim();
  let current = startState;
  tableSteps = [];

  // Build transition steps
  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    const key = `${current},${symbol}`;
    if (transitions[key]) {
      const next = transitions[key];
      tableSteps.push({ step: i + 1, current, symbol, next });
      current = next;
    } else {
      tableSteps.push({ step: i + 1, current, symbol, next: "❌ Invalid" });
      break;
    }
  }

  updateTable();
  simulateSteps();
}

function updateTable() {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = ""; // Clear old rows
  tableSteps.forEach(({ step, current, symbol, next }, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${step}</td><td>${current}</td><td>${symbol}</td><td>${next}</td>`;
    tbody.appendChild(row);
  });
}

function simulateSteps() {
  let index = 0;
  let currentState = startState;

  function nextStep() {
    if (index > 0) {
      document.querySelector(`#tableBody tr:nth-child(${index})`)?.classList.remove("highlight");
    }

    if (index >= tableSteps.length) {
      const result = acceptStates.includes(currentState) ? "✅ Accepted" : "❌ Rejected";
      document.getElementById("result").innerText = `Result: ${result}`;
      return;
    }

    const row = document.querySelector(`#tableBody tr:nth-child(${index + 1})`);
    row?.classList.add("highlight");

    const step = tableSteps[index];
    currentState = step.next;
    drawDiagram(states, transitions, startState, acceptStates, currentState);
    index++;
    setTimeout(nextStep, 1000);
  }

  drawDiagram(states, transitions, startState, acceptStates, currentState);
  setTimeout(nextStep, 1000);
}

function drawDiagram(states, transitions, start, accept, current) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 80;
  const angleStep = (2 * Math.PI) / states.length;
  const positions = {};

  states.forEach((state, index) => {
    const angle = index * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    positions[state] = [x, y];
  });

  // Draw transitions
  for (let key in transitions) {
    const [from, symbol] = key.split(",");
    const to = transitions[key];
    const [x1, y1] = positions[from];
    const [x2, y2] = positions[to];

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const dx = 30 * Math.cos(angle);
    const dy = 30 * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    const arrowX = x2 - dx;
    const arrowY = y2 - dy;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 5 * Math.cos(angle - Math.PI / 6), arrowY - 5 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(arrowX - 5 * Math.cos(angle + Math.PI / 6), arrowY - 5 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.fillText(symbol, (x1 + x2) / 2, (y1 + y2) / 2 - 5);
  }

  // Draw states
  for (let state of states) {
    const [x, y] = positions[state];
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, 2 * Math.PI);
    ctx.strokeStyle = (state === current) ? "green" : "black";
    ctx.lineWidth = (state === current) ? 3 : 1;
    ctx.stroke();

    if (accept.includes(state)) {
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    ctx.fillText(state, x - 10, y + 5);

    if (state === start) {
      ctx.beginPath();
      ctx.moveTo(x - 45, y);
      ctx.lineTo(x - 30, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 35, y - 5);
      ctx.lineTo(x - 30, y);
      ctx.lineTo(x - 35, y + 5);
      ctx.fill();
    }
  }
}
