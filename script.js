document.getElementById("loadAndRunBtn").addEventListener("click", () => {
  const type = document.querySelector('input[name="automatonType"]:checked').value;
  const states = document.getElementById("statesInput").value.split(",").map(s => s.trim());
  const alphabet = document.getElementById("alphabetInput").value.split(",").map(s => s.trim());
  const startState = document.getElementById("startStateInput").value.trim();
  const acceptStates = document.getElementById("acceptStatesInput").value.split(",").map(s => s.trim());
  const transitionsText = document.getElementById("transitionsInput").value.trim();
  const inputString = document.getElementById("stringInput").value.trim();

  const transitions = parseTransitions(transitionsText, type);
  renderTransitionTable(transitions, alphabet, states, type);
  drawAutomaton(states, acceptStates, startState, transitions, type);

  const traceOutput = [];
  const result = simulateAutomaton(type, states, alphabet, startState, acceptStates, transitions, inputString, traceOutput);

  const output = result ? "✅ Input accepted by " + type : "❌ Input rejected by " + type;
  document.getElementById("simulationResult").innerText = output + "\n\n" + traceOutput.join("\n");
});

document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("simulationResult").innerText = "";
  document.getElementById("transitionTable").innerHTML = "";
  const ctx = document.getElementById("automatonCanvas").getContext("2d");
  ctx.clearRect(0, 0, 600, 350);
});

function parseTransitions(input, type) {
  const transitions = {};
  const rules = input.split(";");

  rules.forEach(rule => {
    if (!rule.trim()) return;
    const [left, right] = rule.split("->");
    const [from, symbol] = left.trim().split(",");
    const toStates = right.trim().split(",").map(s => s.trim());

    if (!transitions[from]) transitions[from] = {};

    if (type === "DFA") {
      transitions[from][symbol] = toStates[0]; // DFA has only one destination
    } else {
      if (!transitions[from][symbol]) transitions[from][symbol] = [];
      transitions[from][symbol].push(...toStates);
    }
  });

  return transitions;
}

function renderTransitionTable(transitions, alphabet, states, type) {
  const table = document.getElementById("transitionTable");
  table.innerHTML = "";

  // Create header row
  const headerRow = document.createElement("tr");
  const headerCells = ['<th>State</th>'];
  for (const symbol of alphabet) {
    headerCells.push(`<th>${symbol}</th>`);
  }
  headerRow.innerHTML = headerCells.join('');
  table.appendChild(headerRow);

  // Create one row per state
  for (const state of states) {
    const row = document.createElement("tr");
    const rowCells = [`<td>${state}</td>`];

    for (const symbol of alphabet) {
      const cellValue = (() => {
        if (transitions[state] && transitions[state][symbol]) {
          const val = transitions[state][symbol];
          return Array.isArray(val) ? val.join(",") : val;
        }
        return "-"; // fallback when no transition exists
      })();

      rowCells.push(`<td>${cellValue}</td>`);
    }

    row.innerHTML = rowCells.join('');
    table.appendChild(row);
  }
}


function drawAutomaton(states, acceptStates, startState, transitions, type) {
  const canvas = document.getElementById("automatonCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const positions = {};
  const radius = 30;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const angleStep = (2 * Math.PI) / states.length;

  states.forEach((state, index) => {
    const angle = index * angleStep;
    const x = centerX + 120 * Math.cos(angle);
    const y = centerY + 120 * Math.sin(angle);
    positions[state] = { x, y };

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = acceptStates.includes(state) ? "#DFF0D8" : "#FFFFFF";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.fillText(state, x - 10, y + 5);

    if (state === startState) {
      ctx.beginPath();
      ctx.moveTo(x - 50, y);
      ctx.lineTo(x - radius, y);
      ctx.stroke();
      ctx.fillText("Start", x - 65, y - 5);
    }
  });

  // Draw transitions with arrows
  for (const from in transitions) {
    for (const symbol in transitions[from]) {
      const destinations = transitions[from][symbol];
      const fromPos = positions[from];
      const toStates = Array.isArray(destinations) ? destinations : [destinations];

      toStates.forEach(to => {
        const toPos = positions[to];
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const angle = Math.atan2(dy, dx);
        const startX = fromPos.x + radius * Math.cos(angle);
        const startY = fromPos.y + radius * Math.sin(angle);
        const endX = toPos.x - radius * Math.cos(angle);
        const endY = toPos.y - radius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrowhead
        const headlen = 10;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(endX, endY);
        ctx.fill();

        // Draw label
        const labelX = (startX + endX) / 2;
        const labelY = (startY + endY) / 2;
        ctx.fillStyle = "blue";
        ctx.fillText(symbol, labelX, labelY - 5);
      });
    }
  }
}

function simulateAutomaton(type, states, alphabet, start, accepts, transitions, input, traceOutput) {
  if (type === "DFA") {
    let current = start;
    traceOutput.push(`Start at: ${current}`);

    for (let i = 0; i < input.length; i++) {
      const symbol = input[i];
      if (!alphabet.includes(symbol)) {
        traceOutput.push(`Invalid symbol '${symbol}'`);
        return false;
      }
      const next = transitions[current]?.[symbol];
      if (!next) {
        traceOutput.push(`No transition from ${current} on '${symbol}'`);
        return false;
      }
      traceOutput.push(`${current} --${symbol}--> ${next}`);
      current = next;
    }

    const result = accepts.includes(current);
    traceOutput.push(`End at: ${current} (${result ? "ACCEPTED" : "REJECTED"})`);
    return result;
  }

  if (type === "NFA") {
    const visited = new Set();

    function dfs(state, index, path) {
      const key = `${state},${index}`;
      if (visited.has(key)) return false;
      visited.add(key);

      path.push(`${state}${index < input.length ? ` --${input[index]}--> ` : ""}`);

      if (index === input.length) {
        if (accepts.includes(state)) {
          traceOutput.push(path.join(""));
          return true;
        }
        path.pop();
        return false;
      }

      const symbol = input[index];
      const nextStates = transitions[state]?.[symbol] || [];

      for (const next of nextStates) {
        if (dfs(next, index + 1, [...path])) return true;
      }

      return false;
    }

    return dfs(start, 0, []);
  }

  return false;
}
